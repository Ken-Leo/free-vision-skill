import type { ProviderConfig } from "./types.js";

interface CallOptions {
  provider: ProviderConfig;
  apiKey: string;
  baseUrl: string;
  model: string;
  prompt: string;
  imageDataUrl: string;
  maxTokens: number;
  timeoutMs: number;
}

function contentToText(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map(item => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object") {
          const value = item as Record<string, unknown>;
          return typeof value.text === "string" ? value.text : "";
        }
        return "";
      })
      .join("");
  }
  return "";
}

export async function callVision(options: CallOptions): Promise<string> {
  const {
    provider, apiKey, baseUrl, model, prompt,
    imageDataUrl, maxTokens, timeoutMs
  } = options;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  const imageBlock: Record<string, unknown> = {
    type: "image_url",
    image_url: {
      url: imageDataUrl,
      ...(provider.supportsDetail ? { detail: "low" } : {})
    }
  };

  const body =
    provider.kind === "cohere"
      ? {
          model,
          messages: [{
            role: "user",
            content: [
              { type: "text", text: prompt },
              imageBlock
            ]
          }],
          max_tokens: maxTokens,
          temperature: 0
        }
      : {
          model,
          messages: [{
            role: "user",
            content: [
              { type: "text", text: prompt },
              imageBlock
            ]
          }],
          max_tokens: maxTokens,
          temperature: 0,
          stream: false
        };

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Authorization": `${provider.authPrefix ?? "Bearer "}${apiKey}`,
        "Content-Type": "application/json",
        ...(provider.id === "openrouter"
          ? {
              "HTTP-Referer": "https://github.com/",
              "X-Title": "DeepSeek Free Vision Skill"
            }
          : {})
      },
      body: JSON.stringify(body)
    });

    const text = await response.text();
    if (!response.ok) {
      throw new Error(`${provider.id} HTTP ${response.status}: ${text.slice(0, 500)}`);
    }

    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(`${provider.id} returned non-JSON: ${text.slice(0, 500)}`);
    }

    const obj = data as {
      choices?: Array<{ message?: { content?: unknown } }>;
      message?: { content?: unknown };
    };

    const result =
      contentToText(obj.choices?.[0]?.message?.content) ||
      contentToText(obj.message?.content);

    if (!result) {
      throw new Error(`${provider.id} returned no text content.`);
    }

    return result;
  } finally {
    clearTimeout(timeout);
  }
}
