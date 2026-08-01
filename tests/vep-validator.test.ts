import { describe, it, expect } from "vitest";
import { validateVep, parseVep, validateVisionResult, formatValidationResult } from "../src/vep-validator.js";
import type { VisionResult } from "../src/types.js";

describe("VEP Validator", () => {
  describe("validateVep", () => {
    it("accepts valid VEP string", () => {
      const vep = 'VEP/1|src=zhipu/glm-4.6v-flash|m=error|a="Cannot find module"|t="src/app.ts:42"|c=0.97';
      const result = validateVep(vep);

      expect(result.valid).toBe(true);
      expect(result.version).toBe("VEP/1");
      expect(result.provider).toBe("zhipu");
      expect(result.model).toBe("glm-4.6v-flash");
      expect(result.mode).toBe("error");
      expect(result.errors).toHaveLength(0);
    });

    it("rejects invalid format", () => {
      const result = validateVep("not a vep string");

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("rejects missing required fields", () => {
      const vep = "VEP/1|src=zhipu/glm-4.6v-flash";
      const result = validateVep(vep);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Missing required field: m");
    });

    it("warns on unknown mode", () => {
      const vep = 'VEP/1|src=zhipu/glm-4.6v-flash|m=unknown|a="test"';
      const result = validateVep(vep);

      expect(result.warnings.some(w => w.includes("Unknown mode"))).toBe(true);
    });

    it("rejects invalid confidence", () => {
      const vep = 'VEP/1|src=zhipu/glm-4.6v-flash|m=error|a="test"|c=1.5';
      const result = validateVep(vep);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes("Confidence"))).toBe(true);
    });

    it("accepts valid confidence", () => {
      const vep = 'VEP/1|src=zhipu/glm-4.6v-flash|m=error|a="test"|c=0.97';
      const result = validateVep(vep);

      expect(result.valid).toBe(true);
    });

    it("handles cache=hit flag", () => {
      const vep = 'VEP/1|src=zhipu/glm-4.6v-flash|m=error|a="test"|cache=hit';
      const result = validateVep(vep);

      expect(result.valid).toBe(true);
      expect(vep).toContain("cache=hit");
    });
  });

  describe("parseVep", () => {
    it("parses valid VEP to structured data", () => {
      const vep = 'VEP/1|src=zhipu/glm-4.6v-flash|m=error|a="Cannot find module"|c=0.97';
      const result = parseVep(vep);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.src).toBe("zhipu/glm-4.6v-flash");
      expect(result.data?.m).toBe("error");
      expect(result.data?.a).toBe("Cannot find module");
      expect(result.data?.c).toBe(0.97);
    });

    it("parses array fields", () => {
      const vep = 'VEP/1|src=zhipu/glm-4.6v-flash|m=ui|o=["button","input"]|e=["disabled"]';
      const result = parseVep(vep);

      expect(result.success).toBe(true);
      expect(result.data?.o).toEqual(["button", "input"]);
      expect(result.data?.e).toEqual(["disabled"]);
    });

    it("returns errors for invalid VEP", () => {
      const result = parseVep("invalid");

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe("validateVisionResult", () => {
    it("accepts valid VisionResult", () => {
      const result: VisionResult = {
        provider: "zhipu",
        model: "glm-4.6v-flash",
        mode: "error",
        answer: "Cannot find module",
        raw: '{"a": "Cannot find module"}',
        cached: false
      };

      const validation = validateVisionResult(result);

      expect(validation.valid).toBe(true);
      expect(validation.provider).toBe("zhipu");
      expect(validation.model).toBe("glm-4.6v-flash");
    });

    it("rejects missing provider", () => {
      const result: VisionResult = {
        provider: "",
        model: "glm-4.6v-flash",
        mode: "error",
        raw: "{}",
        cached: false
      };

      const validation = validateVisionResult(result);
      expect(validation.valid).toBe(false);
    });
  });

  describe("formatValidationResult", () => {
    it("formats valid result", () => {
      const validation: VEPValidationResult = {
        valid: true,
        version: "VEP/1",
        provider: "zhipu",
        model: "glm-4.6v-flash",
        mode: "error",
        errors: [],
        warnings: []
      };

      const formatted = formatValidationResult(validation);
      expect(formatted).toContain("✅");
      expect(formatted).toContain("VEP/1");
      expect(formatted).toContain("zhipu");
    });

    it("formats invalid result with errors", () => {
      const validation: VEPValidationResult = {
        valid: false,
        version: "VEP/1",
        errors: ["Missing required field: m"],
        warnings: []
      };

      const formatted = formatValidationResult(validation);
      expect(formatted).toContain("❌");
      expect(formatted).toContain("Errors:");
      expect(formatted).toContain("Missing required field: m");
    });
  });
});
