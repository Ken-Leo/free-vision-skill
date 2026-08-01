#!/usr/bin/env node
import "dotenv/config";
import { readFile } from "node:fs/promises";
import path from "node:path";
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
  cacheGet,
  cacheSet,
  normalizeQuestion,
  readImageAsDataUrl,
  sha256
} from "./util.js";
import {
  deleteProviderKey,
  readSecret,
  storeProviderKey
} from "./secrets.js";

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
  free-vision providers
  free-vision doctor
  free-vision login zhipu
  free-vision logout zhipu

Options:
  --provider auto|zhipu|modelscope|openrouter|groq|...
  --region cn|global
  --json          Print compact JSON instead of VEP
  --no-cache      Ignore local cache
  --max-chars 520 Maximum VEP characters
`);
  process.exit(1);
}

async function see(args: CliArgs): Promise<void> {
  const imagePath = typeof args.image === "string" ? args.image : "";
  const question =
    typeof args.question === "string"
      ? args.question
      : "Return only the most important visible evidence.";

  if (!imagePath) usage();

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

  const absolute = path.resolve(imagePath);
  const imageBytes = await readFile(absolute);
  const imageDataUrl = await readImageAsDataUrl(absolute);
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

      if (!args["no-cache"]) {
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
  await providers();
  console.log("\nChecks:");
  console.log("- ✓ Provider registry loaded");
  console.log("- ✓ Local VEP compression available");
  console.log("- ✓ SHA-256 result cache available");
  console.log("- Keychain: macOS Keychain or Linux Secret Service");
  console.log("- Run a focused `see` request to validate real quota and model availability.");
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

async function main(): Promise<void> {
  const [command, positional, ...rest] = process.argv.slice(2);
  const args = parseArgs([positional, ...rest].filter(Boolean) as string[]);

  if (command === "see") await see(args);
  else if (command === "providers") await providers();
  else if (command === "doctor") await doctor();
  else if (command === "login") await login(positional);
  else if (command === "logout") await logout(positional);
  else usage();
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
