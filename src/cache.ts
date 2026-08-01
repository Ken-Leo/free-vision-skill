/**
 * 增强的缓存系统
 *
 * 特性：
 * - TTL 过期时间
 * - 最大缓存条目限制（LRU 清理）
 * - 缓存统计和监控
 * - 批量清理过期缓存
 */

import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";

const CACHE_DIR = path.resolve(".vision-cache");
const MAX_CACHE_ENTRIES = 1000; // 最大缓存条目数
const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000; // 24 小时

interface CacheEntry {
  value: string;
  timestamp: number;
  accessCount: number;
  lastAccess: number;
  size: number; // bytes
}

interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
  size: number;
}

class CacheManager {
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    size: 0
  };

  /**
   * 获取缓存值
   */
  async get(key: string): Promise<string | null> {
    const filePath = this.getKeyPath(key);

    try {
      const data = await readFile(filePath, "utf8");
      const entry: CacheEntry = JSON.parse(data);

      // 检查 TTL
      const now = Date.now();
      if (now - entry.timestamp > DEFAULT_TTL_MS) {
        // 过期，删除并返回 null
        await rm(filePath).catch(() => {});
        this.stats.misses++;
        this.stats.size--;
        return null;
      }

      // 更新访问信息
      entry.accessCount++;
      entry.lastAccess = now;
      await writeFile(filePath, JSON.stringify(entry), "utf8");

      this.stats.hits++;
      return entry.value;
    } catch {
      this.stats.misses++;
      return null;
    }
  }

  /**
   * 设置缓存值
   */
  async set(key: string, value: string): Promise<void> {
    const filePath = this.getKeyPath(key);

    // 确保缓存目录存在
    await mkdir(CACHE_DIR, { recursive: true });

    const now = Date.now();
    const entry: CacheEntry = {
      value,
      timestamp: now,
      accessCount: 0,
      lastAccess: now,
      size: Buffer.byteLength(value, "utf8")
    };

    await writeFile(filePath, JSON.stringify(entry), "utf8");
    this.stats.size++;

    // 检查是否需要清理
    await this.evictIfNeeded();
  }

  /**
   * 删除特定缓存项
   */
  async delete(key: string): Promise<void> {
    const filePath = this.getKeyPath(key);
    await rm(filePath).catch(() => {});
    this.stats.size = Math.max(0, this.stats.size - 1);
  }

  /**
   * 清理过期缓存
   */
  async cleanupExpired(): Promise<number> {
    const files = await readdir(CACHE_DIR).catch(() => []);
    const now = Date.now();
    let cleaned = 0;

    for (const file of files) {
      if (!file.endsWith(".json")) continue;

      const filePath = path.join(CACHE_DIR, file);
      try {
        const data = await readFile(filePath, "utf8");
        const entry: CacheEntry = JSON.parse(data);

        if (now - entry.timestamp > DEFAULT_TTL_MS) {
          await rm(filePath);
          cleaned++;
          this.stats.size = Math.max(0, this.stats.size - 1);
        }
      } catch {
        // 忽略损坏的缓存文件
        await rm(filePath).catch(() => {});
        cleaned++;
      }
    }

    return cleaned;
  }

  /**
   * LRU 清理：删除最少访问的缓存项
   */
  private async evictIfNeeded(): Promise<void> {
    const files = await readdir(CACHE_DIR).catch(() => []);
    const cacheFiles = files.filter(f => f.endsWith(".json"));

    if (cacheFiles.length <= MAX_CACHE_ENTRIES) return;

    // 读取所有缓存条目
    const entries: Array<{ path: string; key: string; entry: CacheEntry }> = [];

    for (const file of cacheFiles) {
      const filePath = path.join(CACHE_DIR, file);
      try {
        const data = await readFile(filePath, "utf8");
        const entry: CacheEntry = JSON.parse(data);
        const key = file.replace(/\.json$/, "");

        entries.push({ path: filePath, key, entry });
      } catch {
        // 忽略损坏的文件
      }
    }

    // 按访问次数排序（最少访问优先）
    entries.sort((a, b) => a.entry.accessCount - b.entry.accessCount);

    // 删除最久未使用的条目
    const toDelete = entries.slice(0, entries.length - MAX_CACHE_ENTRIES);
    for (const item of toDelete) {
      await rm(item.path).catch(() => {});
      this.stats.evictions++;
      this.stats.size = Math.max(0, this.stats.size - 1);
    }
  }

  /**
   * 清空所有缓存
   */
  async clear(): Promise<void> {
    await rm(CACHE_DIR, { recursive: true, force: true }).catch(() => {});
    this.stats.size = 0;
    this.stats.hits = 0;
    this.stats.misses = 0;
    this.stats.evictions = 0;
  }

  /**
   * 获取缓存统计
   */
  getStats(): CacheStats & { hitRate: number } {
    const total = this.stats.hits + this.stats.misses;
    return {
      ...this.stats,
      hitRate: total > 0 ? this.stats.hits / total : 0
    };
  }

  /**
   * 获取缓存键路径
   */
  private getKeyPath(key: string): string {
    // 使用 SHA-256 作为文件名，避免路径长度问题
    const hash = createHash("sha256").update(key).digest("hex");
    return path.join(CACHE_DIR, `${hash}.json`);
  }
}

// 导出单例
export const cacheManager = new CacheManager();

// 向后兼容的 API
export async function cacheGet(key: string): Promise<string | null> {
  return cacheManager.get(key);
}

export async function cacheSet(key: string, value: string): Promise<void> {
  return cacheManager.set(key, value);
}

export async function cacheClear(): Promise<void> {
  return cacheManager.clear();
}

export async function cacheCleanup(): Promise<number> {
  return cacheManager.cleanupExpired();
}

export function cacheGetStats() {
  return cacheManager.getStats();
}
