import { compactList, compactText, extractJson } from "./util.js";
import type { VisionMode, VisionResult } from "./types.js";

export function parseVisionResult(
  raw: string,
  provider: string,
  model: string,
  mode: VisionMode,
  cached: boolean
): VisionResult {
  const value = extractJson(raw);
  const confidence =
    typeof value.c === "number"
      ? Math.max(0, Math.min(1, value.c))
      : undefined;

  return {
    provider,
    model,
    mode,
    answer: compactText(value.a ?? value.answer, 240) || undefined,
    text: compactText(value.t ?? value.text, 320) || undefined,
    summary: compactText(value.s ?? value.summary, 180) || undefined,
    objects: compactList(value.o ?? value.objects, 6, 55),
    issues: compactList(value.e ?? value.issues, 4, 80),
    values: compactList(value.v ?? value.values, 6, 50),
    confidence,
    raw,
    cached
  };
}

export function toVep(result: VisionResult, maxChars: number): string {
  const parts = [
    "VEP/1",
    `src=${result.provider}/${result.model}`,
    `m=${result.mode}`
  ];

  if (result.answer) parts.push(`a="${result.answer}"`);
  if (result.text) parts.push(`t="${result.text}"`);
  if (result.summary) parts.push(`s="${result.summary}"`);
  if (result.objects?.length) parts.push(`o=[${result.objects.join(",")}]`);
  if (result.issues?.length) parts.push(`e=[${result.issues.join(",")}]`);
  if (result.values?.length) parts.push(`v=[${result.values.join(",")}]`);
  if (typeof result.confidence === "number") {
    parts.push(`c=${result.confidence.toFixed(2)}`);
  }
  if (result.cached) parts.push("cache=hit");

  const full = parts.join("|").replace(/\|+/g, "|");
  if (full.length <= maxChars) return full;

  const compact = [
    "VEP/1",
    `src=${result.provider}/${result.model}`,
    result.answer ? `a="${result.answer.slice(0, 180)}"` : "",
    result.text ? `t="${result.text.slice(0, 180)}"` : "",
    result.issues?.length ? `e=[${result.issues.slice(0, 2).join(",")}]` : "",
    result.values?.length ? `v=[${result.values.slice(0, 3).join(",")}]` : "",
    typeof result.confidence === "number" ? `c=${result.confidence.toFixed(2)}` : ""
  ].filter(Boolean).join("|");

  return compact.slice(0, maxChars);
}
