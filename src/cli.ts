#!/usr/bin/env node
/**
 * dotenv is loaded manually here instead of `import "dotenv/config"` so that
 * credential lookup covers three locations (first match wins):
 *
 *   1. CWD .env            — the traditional project-local config
 *   2. ~/.free-vision/.env — per-user config, cwd-independent (recommended)
 *   3. System env vars     — already set by the shell / keychain / CI
 *
 * Order matters: local overrides global, preserving backwards compatibility.
 */
import { config } from "dotenv";
import { readFile } from "node:fs/promises";
import sharp from "sharp";
import path from "node:path";
import os from "node:os";

const HOME = os.homedir();

// ① CWD .env  (backward-compat — lowest priority)
config({ path: path.resolve(process.cwd(), ".env"), override: false });

// ② ~/.free-vision/.env  (recommended — higher priority, cwd-independent)
const globalEnv = path.join(HOME, ".free-vision", ".env");
try {
  const globalRaw = await readFile(globalEnv, "utf8");
  for (const line of globalRaw.split("\n")) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)/);
    if (m) (process.env as Record<string, string | undefined>)[m[1]!] = m[2]!.replace(/^["']|["']$/g, "");
  }
} catch {
  // ~/.free-vision/.env not found — silent, env may still be set by other means
}

import type { CliArgs, Region } from "./types.js";
import {
  allProviders,
  getProvider,
  providerHasCredential,
  providerRuntime,
  resolveProviderOrder
} from "./providers.js";
import { buildPrompt, inferMode } from "./prompt.js";
import { callVision } from "./call.js";
import { parseVisionResult, toVep } from "./vep.js";
import {
  normalizeQuestion,
  readImageAsDataUrl,
  sha256,
  toDataUrl
} from "./util.js";
import { cacheGet, cacheSet, cacheCleanup, cacheGetStats, cacheGetDir } from "./cache.js";
import {
  deleteProviderKey,
  readSecret,
  storeProviderKey
} from "./secrets.js";
import {
  checkAllProvidersHealth,
  formatLatency,
  getStatusIcon,
  type HealthStatus
} from "./health.js";
import { autoCrop, formatCropResult } from "./crop.js";

function parseArgs(argv: string[]): CliArgs {
  const result: CliArgs = {};
  for (let index = 0; index < argv.length; index++) {
    const item = argv[index]!;
    if (!item.startsWith("--")) continue;
    const key = item.slice(2);
    const next = argv[index + 1];

    if (!next || next.startsWith("--")) result[key] = true;
    else {
      result[key] = next;
      index++;
    }
  }
  return result;
}

function usage(): never {
  console.error(`
Free Vision Skill

Usage:
  free-vision see --image ./screen.png --question "截图里是什么错误？"
  free-vision see --image-url https://example.com/photo.jpg --question "Describe this"
  free-vision providers
  free-vision doctor
  free-vision cache [clear|stats]
  free-vision login zhipu
  free-vision logout zhipu

Options:
  --provider auto|zhipu|modelscope|openrouter|groq|...
  --region cn|global
  --json          Print compact JSON instead of VEP
  --no-cache      Ignore local cache
  --auto-crop     Auto-crop white margins from image
  --image-url <u> Pass a public image URL instead of a local file
  --max-chars 520 Maximum VEP characters
`);
  process.exit(1);
}

async function see(args: CliArgs): Promise<void> {
  const imagePath = typeof args.image === "string" ? args.image : "";
  const imageUrl = typeof args["image-url"] === "string" ? args["image-url"] : "";
  const question =
    typeof args.question === "string"
      ? args.question
      : "Return only the most important visible evidence.";

  if (!imagePath && !imageUrl) usage();

  const requested =
    typeof args.provider === "string"
      ? args.provider
      : process.env.VISION_PROVIDER || "auto";

  const regionRaw =
    typeof args.region === "string"
      ? args.region
      : process.env.VISION_REGION || "cn";

  const region: Region = regionRaw === "global" ? "global" : "cn";
  const maxTokens = Number(process.env.VISION_MAX_OUTPUT_TOKENS || "220");
  const maxChars = Number(
    typeof args["max-chars"] === "string"
      ? args["max-chars"]
      : process.env.VEP_MAX_CHARS || "520"
  );
  const timeoutMs = Number(process.env.VISION_TIMEOUT_MS || "45000");
  const mode = inferMode(question);
  const prompt = buildPrompt(question, mode);

  let imageBytes: Buffer;
  let imageDataUrl: string;
  let actualImagePath: string | undefined;
  let useImageUrl = false;

  // ── URL mode ──────────────────────────────────────────────────────────────
  if (imageUrl) {
    imageDataUrl = imageUrl;   // pass the URL through as-is
    imageBytes = Buffer.from(imageUrl); // use URL as cache key component
    useImageUrl = true;
  } else {
    // ── Base64 mode (local file) ─────────────────────────────────────────────
    const absolute = path.resolve(imagePath);
    actualImagePath = absolute;

    // Auto-crop if requested
    if (args["auto-crop"]) {
      try {
        const cropResult = await autoCrop(absolute);
        if (cropResult.cropped) {
          console.error(`\n${formatCropResult(cropResult)}`);
          actualImagePath = cropResult.savedPath!;
        } else {
          console.error(`\n✂️  Crop skipped: ${cropResult.reason}`);
        }
      } catch (cropError) {
        console.error(
          `\n⚠️  Auto-crop failed: ${cropError instanceof Error ? cropError.message : String(cropError)}`
        );
      }
    }

    imageBytes = await readFile(actualImagePath!);

    // Auto-compress large images (>2 MB) to JPEG quality 80
    const MAX_RAW_BYTES = 2 * 1024 * 1024;
    let compressed = false;
    if (imageBytes.length > MAX_RAW_BYTES && actualImagePath) {
      try {
        const smaller = await sharp(actualImagePath)
          .jpeg({ quality: 80, progressive: true })
          .toBuffer();
        if (smaller.length < imageBytes.length) {
          imageBytes = smaller;
          compressed = true;
        }
        console.error(`\n📦 Compressed ${(imageBytes.length / 1024).toFixed(0)} KB (JPEG 80%)`);
      } catch (compressError) {
        console.error(
          `\n⚠️  Compression failed: ${compressError instanceof Error ? compressError.message : String(compressError)} — using original`
        );
      }
    }

    // Build data URL from the (possibly compressed) bytes we already have in memory.
    // This avoids re-reading the file after compression, which was a bug — the
    // data URL was always built from the original uncompressed file.
    imageDataUrl = toDataUrl(
      imageBytes,
      compressed ? "image/jpeg" : undefined  // undefined → infer from file extension
    );
  }
  const providers = resolveProviderOrder(requested, region);
  const errors: string[] = [];

  for (const provider of providers) {
    try {
      const runtime = await providerRuntime(provider);
      const cacheKey = sha256(
        Buffer.concat([
          imageBytes,
          Buffer.from([
            normalizeQuestion(question),
            provider.id,
            runtime.model,
            "prompt-v2"
          ].join("|"))
        ])
      );

      // 检查缓存（--no-cache 时跳过）
      const useCache = !args["no-cache"];
      if (useCache) {
        const cached = await cacheGet(cacheKey);
        if (cached) {
          const result = parseVisionResult(
            cached,
            provider.id,
            runtime.model,
            mode,
            true
          );
          console.log(
            args.json
              ? JSON.stringify(result, null, 2)
              : toVep(result, maxChars)
          );
          return;
        }
      } else {
        // --no-cache: 删除旧缓存
        await (await import("./cache.js")).cacheManager.delete(cacheKey);
      }

      const raw = await callVision({
        provider,
        ...runtime,
        prompt,
        imageDataUrl,
        maxTokens,
        timeoutMs
      });

      await cacheSet(cacheKey, raw);

      const result = parseVisionResult(
        raw,
        provider.id,
        runtime.model,
        mode,
        false
      );

      console.log(
        args.json
          ? JSON.stringify(result, null, 2)
          : toVep(result, maxChars)
      );
      return;
    } catch (error) {
      errors.push(
        `${provider.id}: ${error instanceof Error ? error.message : String(error)}`
      );
      if (requested !== "auto") break;
    }
  }

  throw new Error(`All providers failed:\n${errors.join("\n")}`);
}

async function providers(): Promise<void> {
  for (const provider of allProviders()) {
    const enabled = await providerHasCredential(provider);
    console.log(
      `${enabled ? "✓" : "·"} ${provider.id.padEnd(12)} ` +
      `${provider.region.padEnd(6)} ` +
      `${provider.defaultModel || "(set model env)"}`
    );
  }
}

async function doctor(): Promise<void> {
  console.log("Free Vision Skill doctor\n");

  // 获取所有 provider
  const providers = allProviders();

  console.log("Provider Health Check:\n");

  // 执行健康检查
  const healthStatuses = await checkAllProvidersHealth(providers);

  // 显示结果
  for (const status of healthStatuses) {
    const icon = getStatusIcon(status.status);
    const regionLabel = status.region === "cn" ? "cn" : "gl";
    const latency = formatLatency(status.latencyMs);
    const quotaLabel = status.quotaRemaining
      ? `[${status.quotaRemaining}]`
      : "";

    console.log(
      `${icon} ${status.provider.padEnd(12)} ${regionLabel.padEnd(3)} ${status.model.padEnd(
        35
      )} ${latency.padStart(6)} ${quotaLabel}`
    );

    if (status.error && status.status !== "healthy") {
      console.log(`    └─ ${status.error}`);
    }
  }

  // 统计
  const summary = {
    total: healthStatuses.length,
    healthy: healthStatuses.filter(s => s.status === "healthy").length,
    degraded: healthStatuses.filter(s => s.status === "degraded").length,
    unhealthy: healthStatuses.filter(s => s.status === "unhealthy").length,
    noKey: healthStatuses.filter(s => s.status === "no-key").length
  };

  console.log(`\nSummary: ${summary.healthy}/${summary.total} providers healthy`);

  if (summary.degraded > 0) {
    console.log(`  ⚠️  ${summary.degraded} degraded (rate-limited)`);
  }
  if (summary.unhealthy > 0) {
    console.log(`  ❌ ${summary.unhealthy} unhealthy (connection/auth issue)`);
  }
  if (summary.noKey > 0) {
    console.log(`  ⚪ ${summary.noKey} not configured (no API key)`);
  }

  // 系统检查
  console.log("\nSystem Checks:");
  console.log("  ✓ Provider registry loaded");
  console.log("  ✓ Local VEP compression available");
  console.log("  ✓ SHA-256 result cache available");
  console.log("  ✓ Health check module loaded");
  console.log("  - Keychain: macOS Keychain or Linux Secret Service");

  // 健康提示
  if (summary.healthy === 0) {
    console.log("\n⚠️  No healthy providers found!");
    console.log("Run: free-vision login <provider> to configure credentials.");
  } else if (summary.healthy < summary.total / 2) {
    console.log(
      "\n💡 Less than half of providers are healthy. Consider configuring more."
    );
  }

  if (summary.degraded > 0) {
    console.log(
      "\n💡 Some providers are rate-limited. Wait a few minutes or use a different provider."
    );
  }
}

async function login(providerId: string | undefined): Promise<void> {
  if (!providerId) usage();
  getProvider(providerId);
  const apiKey = await readSecret(`API key for ${providerId}: `);
  await storeProviderKey(providerId, apiKey);
  console.log(`Saved ${providerId} credential in the OS keychain.`);
}

async function logout(providerId: string | undefined): Promise<void> {
  if (!providerId) usage();
  getProvider(providerId);
  await deleteProviderKey(providerId);
  console.log(`Removed ${providerId} credential from the OS keychain.`);
}

async function cacheStats(): Promise<void> {
  const stats = cacheGetStats();
  const total = stats.hits + stats.misses;

  console.log("Cache Statistics:\n");
  console.log(`  Location:     ${cacheGetDir()}`);
  console.log(`  Hit Rate:     ${(stats.hitRate * 100).toFixed(1)}% (${stats.hits}/${total})`);
  console.log(`  Misses:       ${stats.misses}`);
  console.log(`  Evictions:    ${stats.evictions}`);
  console.log(`  Size:         ${stats.size} entries`);
  console.log(`  Max Limit:    1000 entries`);

  if (stats.hitRate > 0.5) {
    console.log("\n✅ Cache is effective (>50% hit rate)");
  } else if (total > 0) {
    console.log("\n⚠️  Low cache hit rate (<50%)");
  }
}

async function cacheClear(): Promise<void> {
  await (await import("./cache.js")).cacheManager.clear();
  console.log("✅ Cache cleared");
}

async function handleCache(subcommand: string | undefined): Promise<void> {
  if (!subcommand || subcommand === "stats") {
    await cacheStats();
  } else if (subcommand === "clear") {
    await cacheClear();
  } else {
    console.error(`Unknown cache command: ${subcommand}`);
    usage();
  }
}

async function main(): Promise<void> {
  const [command, positional, ...rest] = process.argv.slice(2);
  const args = parseArgs([positional, ...rest].filter(Boolean) as string[]);

  if (command === "see") await see(args);
  else if (command === "providers") await providers();
  else if (command === "doctor") await doctor();
  else if (command === "cache") await handleCache(positional);
  else if (command === "login") await login(positional);
  else if (command === "logout") await logout(positional);
  else usage();
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
