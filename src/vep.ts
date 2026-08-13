import { compactList, compactText, extractJson } from "./util.js";
import type { VisionMode, VisionResult } from "./types.js";


function toElements(
  value: unknown,
  count: number,
  each: number
): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map(item => (item && typeof item === "object"
      ? JSON.stringify(item)
      : typeof item === "string" ? item : ""))
    .filter(Boolean)
    .slice(0, count)
    .map(item => compactText(item, each))
    .filter(Boolean);
}

export function parseVisionResult(
  raw: string,
  provider: string,
  model: string,
  mode: VisionMode,
  cached: boolean
): VisionResult {
  const value = extractJson(raw);
  const caps = mode === "ui"
    ? { answer: 500, text: 800, summary: 260, oCount: 32, oEach: 260, eCount: 10, eEach: 180, vCount: 14, vEach: 90 }
    : { answer: 240, text: 320, summary: 180, oCount: 6, oEach: 55, eCount: 4, eEach: 80, vCount: 6, vEach: 50 };
  const confidence =
    typeof value.c === "number"
      ? Math.max(0, Math.min(1, value.c))
      : undefined;

  return {
    provider,
    model,
    mode,
    answer: compactText(value.a ?? value.answer, caps.answer) || undefined,
    text: compactText(value.t ?? value.text, caps.text) || undefined,
    summary: compactText(value.s ?? value.summary, caps.summary) || undefined,
    objects: toElements(value.o ?? value.objects, caps.oCount, caps.oEach),
    issues: compactList(value.e ?? value.issues, caps.eCount, caps.eEach),
    values: compactList(value.v ?? value.values, caps.vCount, caps.vEach),
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
