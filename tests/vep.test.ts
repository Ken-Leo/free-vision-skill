import { describe, it, expect } from "vitest";
import { parseVisionResult, toVep } from "../src/vep.js";

describe("VEP Generation", () => {
  it("creates compact VEP", () => {
    const result = parseVisionResult(
      '{"a":"Module not found","t":"src/app.ts:42","e":["dependency error"],"c":0.97}',
      "test",
      "vision-model",
      "error",
      false
    );

    const vep = toVep(result, 520);
    expect(vep).toMatch(/^VEP\/1\|/);
    expect(vep).toContain("Module not found");
    expect(vep).toContain("src/app.ts:42");
  });

  it("respects character budget", () => {
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
    expect(vep.length).toBeLessThanOrEqual(160);
  });
});
