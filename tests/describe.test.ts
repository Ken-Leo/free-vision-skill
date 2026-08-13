import { describe, it, expect } from "vitest";
import { buildDescribePrompt, runDescribe } from "../src/describe.js";

describe("Describe (full-read) mode", () => {
  it("builds a thorough prompt without a VEP schema", () => {
    const p = buildDescribePrompt();
    expect(p.length).toBeGreaterThan(50);
    expect(p).toContain("完整");
    expect(p).not.toContain('"a":"direct visible answer"');
  });

  it("requires an image input", async () => {
    await expect(runDescribe({})).rejects.toThrow(/requires --image/);
  });
});
