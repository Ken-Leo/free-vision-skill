/**
 * 并发控制和请求池管理
 *
 * 特性：
 * - 并发请求池限制
 * - 指数退避重试
 * - 速率限制器
 * - 超时控制
 * - 并行 fallback 支持
 */

export interface PoolConfig {
  /** 最大并发请求数（默认：3） */
  maxConcurrency?: number;
  /** 超时时间 ms（默认：30000） */
  timeoutMs?: number;
  /** 最大重试次数（默认：2） */
  maxRetries?: number;
  /** 基础延迟 ms（默认：1000） */
  baseDelayMs?: number;
  /** 最大延迟 ms（默认：10000） */
  maxDelayMs?: number;
}

export interface RequestOptions<T> {
  fn: () => Promise<T>;
  key?: string;
  priority?: number;
}

export interface RequestResult<T> {
  success: boolean;
  value?: T;
  error?: Error;
  retries: number;
  durationMs: number;
}

/**
 * 并发请求池
 */
export class RequestPool<T> {
  private config: Required<PoolConfig>;
  private running = 0;
  private queue: Array<{
    options: RequestOptions<T>;
    resolve: (result: RequestResult<T>) => void;
    reject: (error: Error) => void;
  }> = [];

  constructor(config: PoolConfig = {}) {
    this.config = {
      maxConcurrency: config.maxConcurrency ?? 3,
      timeoutMs: config.timeoutMs ?? 30000,
      maxRetries: config.maxRetries ?? 2,
      baseDelayMs: config.baseDelayMs ?? 1000,
      maxDelayMs: config.maxDelayMs ?? 10000
    };
  }

  /**
   * 添加请求到池中
   */
  async submit(options: RequestOptions<T>): Promise<RequestResult<T>> {
    return new Promise((resolve, reject) => {
      this.queue.push({ options, resolve, reject });
      this.processQueue();
    });
  }

  /**
   * 批量提交请求
   */
  async submitAll(
    optionsArray: RequestOptions<T>[]
  ): Promise<RequestResult<T>[]> {
    const results = await Promise.all(
      optionsArray.map(options => this.submit(options))
    );
    return results;
  }

  /**
   * 处理队列
   */
  private async processQueue(): Promise<void> {
    while (this.running < this.config.maxConcurrency && this.queue.length > 0) {
      const item = this.queue.shift();
      if (!item) break;

      this.running++;
      this.execute(item).finally(() => {
        this.running--;
        this.processQueue();
      });
    }
  }

  /**
   * 执行请求（带重试）
   */
  private async execute(
    item: {
      options: RequestOptions<T>;
      resolve: (result: RequestResult<T>) => void;
      reject: (error: Error) => void;
    }
  ): Promise<void> {
    const { options } = item;
    let lastError: Error | undefined;
    let retries = 0;

    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      const startTime = Date.now();

      try {
        const value = await this.withTimeout(options.fn(), this.config.timeoutMs);

        item.resolve({
          success: true,
          value,
          retries: attempt,
          durationMs: Date.now() - startTime
        });
        return;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // 如果是最后一次重试，直接失败
        if (attempt === this.config.maxRetries) break;

        // 指数退避延迟
        const delay = Math.min(
          this.config.baseDelayMs * Math.pow(2, attempt),
          this.config.maxDelayMs
        );

        await this.sleep(delay);
        retries++;
      }
    }

    item.resolve({
      success: false,
      error: lastError,
      retries,
      durationMs: 0
    });
  }

  /**
   * 添加超时控制
   */
  private withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)
      )
    ]);
  }

  /**
   * 延迟
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 获取队列状态
   */
  getStatus() {
    return {
      running: this.running,
      queued: this.queue.length,
      config: this.config
    };
  }
}

/**
 * 速率限制器
 */
export class RateLimiter {
  private tokens: number;
  private lastRefill: number;
  private readonly maxTokens: number;
  private readonly refillRate: number; // tokens per ms

  constructor(
    maxTokens: number,
    refillPeriodMs: number
  ) {
    this.maxTokens = maxTokens;
    this.tokens = maxTokens;
    this.lastRefill = Date.now();
    this.refillRate = maxTokens / refillPeriodMs;
  }

  /**
   * 尝试获取令牌
   */
  async tryAcquire(tokens: number = 1): Promise<boolean> {
    this.refill();

    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return true;
    }

    return false;
  }

  /**
   * 等待直到获取令牌
   */
  async acquire(tokens: number = 1): Promise<void> {
    while (!(await this.tryAcquire(tokens))) {
      const waitMs = Math.min(
        ((tokens - this.tokens) / this.refillRate) * 1000,
        1000
      );
      await this.sleep(waitMs);
    }
  }

  /**
   * 补充令牌
   */
  private refill(): void {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    const newTokens = elapsed * this.refillRate;

    this.tokens = Math.min(this.maxTokens, this.tokens + newTokens);
    this.lastRefill = now;
  }

  /**
   * 获取当前状态
   */
  getStatus() {
    this.refill();
    return {
      tokens: this.tokens,
      maxTokens: this.maxTokens,
      available: this.tokens / this.maxTokens
    };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * 并行 fallback 执行器
 *
 * 用于 Provider 降级时，同时尝试多个 provider
 */
export async function parallelFallback<T>(
  items: Array<{ id: string; fn: () => Promise<T> }>,
  config: PoolConfig = {}
): Promise<{ success: T; provider: string }> {
  const pool = new RequestPool<T>({
    maxConcurrency: config.maxConcurrency ?? 3,
    timeoutMs: config.timeoutMs ?? 15000,
    maxRetries: 0,
    ...config
  });

  const results = await pool.submitAll(
    items.map(item => ({
      fn: item.fn,
      key: item.id
    }))
  );

  // 找到第一个成功的请求
  const success = results.find(r => r.success);
  if (success && success.value !== undefined) {
    const provider = items.find((_, i) => results[i] === success)?.id || "unknown";
    return { success: success.value, provider };
  }

  // 所有请求都失败
  const errors = results
    .filter(r => !r.success && r.error)
    .map(r => r.error!.message)
    .join("; ");

  throw new Error(`All providers failed: ${errors}`);
}
