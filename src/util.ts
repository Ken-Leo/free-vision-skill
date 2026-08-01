import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export function sha256(value: string | Buffer): string {
  return createHash("sha256").update(value).digest("hex");
}

export function normalizeQuestion(value: string): string {
  return value.replace(/\s+/g, " ").trim().toLowerCase();
}

export async function readImageAsDataUrl(filePath: string): Promise<string> {
  const absolute = path.resolve(filePath);
  const data = await readFile(absolute);
  const ext = path.extname(absolute).toLowerCase();
  const mime =
    ext === ".png" ? "image/png" :
    ext === ".webp" ? "image/webp" :
    ext === ".gif" ? "image/gif" :
    ext === ".bmp" ? "image/bmp" :
    ext === ".avif" ? "image/avif" :
    "image/jpeg";
  return `data:${mime};base64,${data.toString("base64")}`;
}

export async function cacheGet(key: string): Promise<string | null> {
  try {
    return await readFile(path.resolve(".vision-cache", `${key}.json`), "utf8");
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, value: string): Promise<void> {
  const dir = path.resolve(".vision-cache");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, `${key}.json`), value, "utf8");
}

export function extractJson(text: string): Record<string, unknown> {
  const stripped = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    return JSON.parse(stripped) as Record<string, unknown>;
  } catch {
    const start = stripped.indexOf("{");
    const end = stripped.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(stripped.slice(start, end + 1)) as Record<string, unknown>;
      } catch {
        // Fall through.
      }
    }
    return { answer: stripped.slice(0, 1000) };
  }
}

export function compactText(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").replace(/[|\n\r]/g, " ").trim().slice(0, max);
}

export function compactList(value: unknown, count: number, each: number): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .slice(0, count)
    .map(item => compactText(item, each))
    .filter(Boolean);
}
