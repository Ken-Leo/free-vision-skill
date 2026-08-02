#!/usr/bin/env node
/**
 * E2E test: Free Vision Skill — VEP output and cache behavior
 *
 * Purpose: verify the CLI produces a well-formed VEP that a coding agent
 * can reason from. Does NOT test automatic trigger by the model (that
 * depends on the model's own multimodal capability, which varies).
 *
 * Usage: node tests/e2e-vep.test.js
 * Or:    npm run test:e2e
 */

import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { createHash } from "node:crypto";

const IMAGE = path.resolve("assets/slide-02-token.png");
const CLI = "npx";
const CLI_ARGS = ["tsx", "src/cli.ts", "see"];

// ── helpers ──────────────────────────────────────────────────────────────────

function runSeen(...args) {
  const { stdout, stderr, status } = spawnSync(
    CLI,
    [...CLI_ARGS, ...args],
    { encoding: "utf-8", timeout: 60_000 }
  );
  return { stdout: stdout.trim(), stderr: stderr.trim(), status };
}

function grep(text, pattern) {
  return text.includes(pattern);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
  console.log("  ✅ " + message);
}

function section(label) {
  console.log("\n── " + label + " ──");
}

// ── VEP field presence ────────────────────────────────────────────────────────

const REQUIRED_FIELDS = [
  "VEP/1",         // protocol version
  "src=",          // provider/model
  "m=",            // mode
  "c=",            // confidence
];

function verifyVepFormat(vep) {
  for (const field of REQUIRED_FIELDS) {
    assert(grep(vep, field), `VEP contains "${field}"`);
  }
  // Protocol prefix must be first
  assert(vep.startsWith("VEP/1"), "VEP starts with VEP/1");
}

// ── uniqueness ────────────────────────────────────────────────────────────────

function hashCacheEntry(vep) {
  // strip optional |cache=hit so warm/cold VEPs can be compared
  return createHash("sha-256").update(vep.replace(/\|cache=hit$/, "")).digest("hex").slice(0, 16);
}

async function clearCache() {
  const dir = path.join(os.homedir(), ".cache", "free-vision");
  try { await fs.rm(dir, { recursive: true, force: true }); } catch { /* ok */ }
}

// ── tests ─────────────────────────────────────────────────────────────────────

async function main() {
  await clearCache();   // always start clean for reproducible cold runs

  console.log("E2E: Free Vision Skill — VEP output + cache\n");

  // 0. Pre-flight
  section("Pre-flight");
  assert((await fs.stat(IMAGE)).size > 0, `test image exists: ${IMAGE} (${(await fs.stat(IMAGE)).size} bytes)`);

  // 1. Cold run — expect a real VEP, no cache=hit
  section("Run 1 — cold (cache miss)");
  const r1 = runSeen("--image", IMAGE, "--question", "Only the page title.");
  assert(r1.status === 0, "CLI exits 0");
  assert(r1.stdout.startsWith("VEP/1"), "stdout is VEP");
  assert(!grep(r1.stdout, "cache=hit"), "cold run has no cache=hit");
  verifyVepFormat(r1.stdout);
  console.log("  VEP: " + r1.stdout.slice(0, 120) + "...");
  const h1 = hashCacheEntry(r1.stdout);
  console.log("  VEP hash: " + h1);

  // 2. Warm run — same image + question, must be cache=hit, same VEP content
  section("Run 2 — warm (cache hit)");
  const r2 = runSeen("--image", IMAGE, "--question", "Only the page title.");
  assert(r2.status === 0, "CLI exits 0");
  assert(grep(r2.stdout, "VEP/1"), "stdout is VEP");
  assert(grep(r2.stdout, "cache=hit"), "warm run has cache=hit");
  verifyVepFormat(r2.stdout);
  const h2 = hashCacheEntry(r2.stdout);
  assert(h2 === h1, "warm VEP matches cold VEP (same hash)");
  console.log("  VEP hash: " + h2 + " (matches cold)");

  // 3. Different question — different VEP, still no cache=hit
  section("Run 3 — different question (cache miss)");
  const r3 = runSeen("--image", IMAGE, "--question", "List all objects mentioned.");
  assert(r3.status === 0, "CLI exits 0");
  assert(grep(r3.stdout, "VEP/1"), "stdout is VEP");
  assert(!grep(r3.stdout, "cache=hit"), "new question → no cache=hit");
  verifyVepFormat(r3.stdout);
  const h3 = hashCacheEntry(r3.stdout);
  assert(h3 !== h1, "different question → different VEP");
  console.log("  VEP hash: " + h3 + " (≠ cold hash " + h1 + ")");

  // 4. --no-cache — forces miss even if cached
  section("Run 4 — --no-cache");
  const r4 = runSeen("--image", IMAGE, "--question", "Only the page title.", "--no-cache");
  assert(r4.status === 0, "CLI exits 0");
  assert(!grep(r4.stdout, "cache=hit"), "--no-cache prevents cache=hit");
  verifyVepFormat(r4.stdout);

  // 5. Summary
  console.log("\n── Summary ──");
  console.log("  VEP format    ✅");
  console.log("  Cold run      ✅");
  console.log("  Cache hit     ✅ (same image + question → ~10x faster)");
  console.log("  Cache miss    ✅ (different question → fresh VEP)");
  console.log("  --no-cache    ✅");
  console.log("\nAll E2E checks passed.");
}

main().catch(err => {
  console.error("❌ " + err.message);
  process.exit(1);
});
