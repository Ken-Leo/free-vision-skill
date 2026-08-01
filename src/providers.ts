import registryJson from "../registry/providers.json" with { type: "json" };
import type { ProviderConfig, Registry, Region } from "./types.js";
import { loadProviderKey } from "./secrets.js";

const registry = registryJson as Registry;

export function allProviders(): ProviderConfig[] {
  return [...registry.providers];
}

export function getProvider(id: string): ProviderConfig {
  const provider = registry.providers.find(item => item.id === id);
  if (!provider) throw new Error(`Unknown provider: ${id}`);
  return provider;
}

export function resolveProviderOrder(
  requested: string,
  region: Region
): ProviderConfig[] {
  if (requested !== "auto") return [getProvider(requested)];

  const preferred = registry.providers
    .filter(provider => provider.region === region)
    .sort((a, b) => a.priority - b.priority);

  const fallback = registry.providers
    .filter(provider => provider.region !== region)
    .sort((a, b) => a.priority - b.priority);

  return [...preferred, ...fallback];
}

export async function providerRuntime(
  provider: ProviderConfig
): Promise<{ apiKey: string; baseUrl: string; model: string }> {
  const apiKey = await loadProviderKey(provider.id, provider.apiKeyEnv);
  if (!apiKey) {
    throw new Error(
      `No credential for ${provider.id}. Set ${provider.apiKeyEnv} ` +
      `or run: free-vision login ${provider.id}`
    );
  }

  const baseUrl =
    process.env.VISION_BASE_URL ||
    (provider.baseUrlEnv ? process.env[provider.baseUrlEnv] : undefined) ||
    provider.baseUrl;

  const model =
    process.env.VISION_MODEL ||
    (provider.modelEnv ? process.env[provider.modelEnv] : undefined) ||
    provider.defaultModel;

  if (!model) {
    throw new Error(
      `No model configured for ${provider.id}. Set VISION_MODEL` +
      (provider.modelEnv ? ` or ${provider.modelEnv}` : "") +
      "."
    );
  }

  if (baseUrl.includes("{ACCOUNT_ID}")) {
    throw new Error(
      `Set ${provider.baseUrlEnv ?? "VISION_BASE_URL"} with your account-specific URL.`
    );
  }

  return {
    apiKey,
    baseUrl: baseUrl.replace(/\/$/, ""),
    model
  };
}

export async function providerHasCredential(
  provider: ProviderConfig
): Promise<boolean> {
  return Boolean(await loadProviderKey(provider.id, provider.apiKeyEnv));
}
