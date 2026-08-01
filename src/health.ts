import type { ProviderConfig, ProviderKind, Region } from "./types.js";
import { loadProviderKey, storeProviderKey } from "./secrets.js";

export interface HealthStatus {
  provider: string;
  region: Region;
  model: string;
  status: "healthy" | "degraded" | "unhealthy" | "no-key" | "unknown";
  latencyMs?: number;
  error?: string;
  quotaRemaining?: string;
}

/**
 * 检查单个 Provider 的健康状态
 */
export async function checkProviderHealth(
  provider: ProviderConfig
): Promise<HealthStatus> {
  const startTime = Date.now();

  try {
    // 1. 检查 API Key 配置
    const apiKey = await loadProviderKey(provider.id, provider.apiKeyEnv);
    if (!apiKey) {
      return {
        provider: provider.id,
        region: provider.region,
        model: provider.defaultModel,
        status: "no-key",
        error: `No API key configured`
      };
    }

    // 2. 获取 baseUrl 和 model
    const baseUrl =
      process.env.VISION_BASE_URL ||
      (provider.baseUrlEnv ? process.env[provider.baseUrlEnv] : undefined) ||
      provider.baseUrl;

    const model =
      process.env.VISION_MODEL ||
      (provider.modelEnv ? process.env[provider.modelEnv] : undefined) ||
      provider.defaultModel;

    if (!model || !baseUrl) {
      return {
        provider: provider.id,
        region: provider.region,
        model: model || provider.defaultModel,
        status: "unhealthy",
        error: model ? "No base URL configured" : "No model configured"
      };
    }

    if (baseUrl.includes("{ACCOUNT_ID}")) {
      return {
        provider: provider.id,
        region: provider.region,
        model: model,
        status: "unhealthy",
        error: `Set ${provider.baseUrlEnv ?? "VISION_BASE_URL"} with your account-specific URL`
      };
    }

    const url = baseUrl.replace(/\/$/, "") + "/chat/completions";

    // 3. 发送测试请求
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: (provider.authPrefix || "Bearer ") + apiKey
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Respond with only the word: OK"
              }
            ]
          }
        ],
        max_tokens: 10,
        timeout_ms: 5000
      }),
      signal: AbortSignal.timeout(5000)
    });

    const latencyMs = Date.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      let errorMessage = `HTTP ${response.status}`;

      try {
        const errorJson = JSON.parse(errorText);
        errorMessage =
          errorJson.error?.message || errorJson.message || errorMessage;
      } catch {
        if (errorText.length < 100) {
          errorMessage = errorText;
        }
      }

      // 根据状态码判断健康状态
      if (response.status === 429) {
        return {
          provider: provider.id,
          region: provider.region,
          model: model,
          status: "degraded",
          latencyMs,
          error: `Rate limited: ${errorMessage}`,
          quotaRemaining: "rate-limited"
        };
      } else if (response.status === 401 || response.status === 403) {
        return {
          provider: provider.id,
          region: provider.region,
          model: model,
          status: "no-key",
          latencyMs,
          error: `Auth failed: ${errorMessage}`
        };
      } else {
        return {
          provider: provider.id,
          region: provider.region,
          model: model,
          status: "unhealthy",
          latencyMs,
          error: errorMessage
        };
      }
    }

    // 4. 成功响应
    return {
      provider: provider.id,
      region: provider.region,
      model: model,
      status: "healthy",
      latencyMs,
      quotaRemaining: "available"
    };
  } catch (error) {
    const latencyMs = Date.now() - startTime;
    const errorMessage =
      error instanceof Error ? error.message : String(error);

    if (errorMessage.includes("timeout") || errorMessage.includes("ETIMEDOUT")) {
      return {
        provider: provider.id,
        region: provider.region,
        model: provider.defaultModel,
        status: "degraded",
        latencyMs,
        error: "Connection timeout"
      };
    }

    return {
      provider: provider.id,
      region: provider.region,
      model: provider.defaultModel,
      status: "unhealthy",
      latencyMs,
      error: errorMessage
    };
  }
}

/**
 * 批量检查所有 Provider
 */
export async function checkAllProvidersHealth(
  providers: ProviderConfig[]
): Promise<HealthStatus[]> {
  const results: HealthStatus[] = [];

  // 并发检查，但限制并发数避免过载
  const batchSize = 3;
  for (let i = 0; i < providers.length; i += batchSize) {
    const batch = providers.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(provider => checkProviderHealth(provider))
    );
    results.push(...batchResults);

    // 批次之间延迟避免触发限流
    if (i + batchSize < providers.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  return results;
}

/**
 * 获取颜色标记
 */
export function getStatusIcon(status: HealthStatus["status"]): string {
  switch (status) {
    case "healthy":
      return "✅";
    case "degraded":
      return "⚠️";
    case "no-key":
      return "⚪";
    case "unhealthy":
      return "❌";
    default:
      return "❓";
  }
}

/**
 * 格式化延迟时间
 */
export function formatLatency(ms?: number): string {
  if (ms === undefined) return "N/A";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}
