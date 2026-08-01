import test from "node:test";
import assert from "node:assert/strict";
import { parseVisionResult, toVep } from "../src/vep.js";

test("creates compact VEP", () => {
  const result = parseVisionResult(
    '{"a":"Module not found","t":"src/app.ts:42","e":["dependency error"],"c":0.97}',
    "test",
    "vision-model",
    "error",
    false
  );

  const vep = toVep(result, 520);
  assert.match(vep, /^VEP\/1\|/);
  assert.match(vep, /Module not found/);
  assert.match(vep, /src\/app\.ts:42/);
});

test("respects character budget", () => {
  const result = parseVisionResult(
    JSON.stringify({
      a: "A".repeat(400),
      t: "T".repeat(400),
      e: ["one", "two", "three"],
      c: 0.5
    }),
    "test",
    "vision-model",
    "ocr",
    false
  );

  const vep = toVep(result, 160);
  assert.ok(vep.length <= 160);
});
