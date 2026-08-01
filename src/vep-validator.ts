/**
 * VEP (Visual Evidence Packet) Schema Validator
 *
 * Validates VEP/1 format strings and VisionResult objects.
 * Can be used as a standalone module or CLI tool.
 */

import type { VisionMode, VisionResult } from "./types.js";

export interface VEPValidationResult {
  valid: boolean;
  version?: string;
  provider?: string;
  model?: string;
  mode?: VisionMode;
  errors: string[];
  warnings: string[];
}

export interface VEPParsedResult {
  success: boolean;
  data?: Record<string, unknown>;
  vepString: string;
  errors: string[];
}

/**
 * Validate a VEP string format.
 *
 * @param vepString - VEP string to validate (e.g., "VEP/1|src=zhipu/glm-4.6v-flash|...")
 * @returns Validation result with detailed errors/warnings
 */
export function validateVep(vepString: string): VEPValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check format
  if (!vepString.startsWith("VEP/")) {
    errors.push(`Invalid format: must start with "VEP/"`);
    return { valid: false, errors, warnings };
  }

  // Parse version
  const versionMatch = vepString.match(/^VEP\/(\d+)/);
  if (!versionMatch) {
    errors.push("Invalid version: must be VEP/<number>");
    return { valid: false, errors, warnings };
  }

  const version = versionMatch[1];

  // Split fields
  const fields = vepString.split("|");
  if (fields.length < 2) {
    errors.push("Invalid format: missing fields after version");
    return { valid: false, version: `VEP/${version}`, errors, warnings };
  }

  // Parse key-value pairs
  const data: Record<string, string | number> = {};
  for (let i = 1; i < fields.length; i++) {
    const field = fields[i]?.trim();
    if (!field) continue;

    const idx = field.indexOf("=");
    if (idx < 0) {
      warnings.push(`Skipping malformed field: "${field}"`);
      continue;
    }

    const key = field.slice(0, idx);
    let value: string | number = field.slice(idx + 1);

    // Strip surrounding quotes from string values
    if (typeof value === "string") {
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
    }

    // Parse numbers
    if (!isNaN(Number(value)) && value !== "") {
      value = Number(value);
    }

    data[key] = value;
  }

  // Validate required fields
  if (!data.src) {
    errors.push("Missing required field: src");
  }

  if (!data.m) {
    errors.push("Missing required field: m");
  }

  // Validate src format (provider/model)
  if (data.src && typeof data.src === "string") {
    const srcParts = data.src.split("/");
    if (srcParts.length < 2) {
      warnings.push(`src format should be "provider/model", got: "${data.src}"`);
    }
  }

  // Validate mode
  const validModes = ["error", "ocr", "ui", "chart", "general"];
  if (data.m && !validModes.includes(data.m as string)) {
    warnings.push(`Unknown mode "${data.m}", expected one of: ${validModes.join(", ")}`);
  }

  // Validate confidence
  if (typeof data.c === "number") {
    if (data.c < 0 || data.c > 1) {
      errors.push(`Confidence must be between 0 and 1, got: ${data.c}`);
    }
  }

  // Parse arrays
  const parseArray = (value: string | number): unknown[] => {
    if (typeof value !== "string" || !value.startsWith("[") || !value.endsWith("]")) {
      return [];
    }
    try {
      return JSON.parse(value) as unknown[];
    } catch {
      return [];
    }
  };

  // Validate arrays
  if (data.o) parseArray(data.o);
  if (data.e) parseArray(data.e);
  if (data.v) parseArray(data.v);

  return {
    valid: errors.length === 0,
    version: `VEP/${version}`,
    provider: typeof data.src === "string" ? data.src.split("/")[0] : undefined,
    model: typeof data.src === "string" ? data.src.split("/")[1] : undefined,
    mode: data.m as VisionMode,
    errors,
    warnings
  };
}

/**
 * Parse a VEP string into structured data.
 *
 * @param vepString - VEP string to parse
 * @returns Parsed result with data object or errors
 */
export function parseVep(vepString: string): VEPParsedResult {
  const validation = validateVep(vepString);
  const errors: string[] = [...validation.errors];

  if (!validation.valid) {
    return {
      success: false,
      vepString,
      errors
    };
  }

  try {
    const fields = vepString.split("|");
    const data: Record<string, unknown> = {};

    for (let i = 1; i < fields.length; i++) {
      const field = fields[i]?.trim();
      if (!field) continue;

      const idx = field.indexOf("=");
      if (idx < 0) continue;

      const key = field.slice(0, idx);
      let value: unknown = field.slice(idx + 1);

      // Strip surrounding quotes
      if (typeof value === "string") {
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
      }

      // Parse numbers
      if (!isNaN(Number(value)) && value !== "") {
        value = Number(value);
      }

      // Parse arrays
      if (typeof value === "string" && value.startsWith("[") && value.endsWith("]")) {
        try {
          value = JSON.parse(value);
        } catch {
          // Keep as string
        }
      }

      data[key] = value;
    }

    return {
      success: true,
      data,
      vepString,
      errors: []
    };
  } catch (error) {
    errors.push(`Parse error: ${error instanceof Error ? error.message : String(error)}`);
    return {
      success: false,
      vepString,
      errors
    };
  }
}

/**
 * Validate a VisionResult object.
 *
 * @param result - VisionResult to validate
 * @returns Validation result
 */
export function validateVisionResult(result: VisionResult): VEPValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required fields
  if (!result.provider) {
    errors.push("Missing required field: provider");
  }

  if (!result.model) {
    errors.push("Missing required field: model");
  }

  if (!result.mode) {
    errors.push("Missing required field: mode");
  }

  // Check mode validity
  const validModes = ["error", "ocr", "ui", "chart", "general"];
  if (result.mode && !validModes.includes(result.mode)) {
    warnings.push(`Unknown mode "${result.mode}", expected one of: ${validModes.join(", ")}`);
  }

  // Check confidence
  if (typeof result.confidence === "number") {
    if (result.confidence < 0 || result.confidence > 1) {
      errors.push(`Confidence must be between 0 and 1, got: ${result.confidence}`);
    }
  }

  // Check raw field
  if (!result.raw || result.raw.trim() === "") {
    warnings.push("Empty raw field");
  }

  return {
    valid: errors.length === 0,
    provider: result.provider,
    model: result.model,
    mode: result.mode,
    errors,
    warnings
  };
}

/**
 * Format validation result as human-readable string.
 *
 * @param result - Validation result to format
 * @returns Formatted string
 */
export function formatValidationResult(result: VEPValidationResult): string {
  const lines: string[] = [];

  if (result.valid) {
    lines.push(`✅ Valid VEP: ${result.version}`);
    if (result.provider) lines.push(`   Provider: ${result.provider}`);
    if (result.model) lines.push(`   Model: ${result.model}`);
    if (result.mode) lines.push(`   Mode: ${result.mode}`);
  } else {
    lines.push(`❌ Invalid VEP`);
    if (result.version) lines.push(`   Version: ${result.version}`);
  }

  if (result.errors.length > 0) {
    lines.push(`\nErrors:`);
    result.errors.forEach(err => lines.push(`  - ${err}`));
  }

  if (result.warnings.length > 0) {
    lines.push(`\nWarnings:`);
    result.warnings.forEach(warn => lines.push(`  - ${warn}`));
  }

  return lines.join("\n");
}

