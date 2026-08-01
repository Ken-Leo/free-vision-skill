import { describe, it, expect } from "vitest";
import { autoCrop, formatCropResult } from "../src/crop.js";
import sharp from "sharp";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe("Auto-Crop", () => {
  it("crops image with white margins", async () => {
    const testImagePath = path.join(__dirname, "..", "tmp", "test-image.png");

    const result = await autoCrop(testImagePath, {
      margin: 10,
      threshold: 240
    });

    expect(result.cropped).toBe(true);
    expect(result.originalSize).toEqual({ width: 400, height: 300 });
    expect(result.croppedSize!.width).toBeLessThan(400);
    expect(result.savedPath).toBeDefined();
  });

  it("handles tiny images", async () => {
    const tinyInputPath = path.join(__dirname, "..", "tmp", "tiny-input.png");
    const tinyOutputPath = path.join(__dirname, "..", "tmp", "tiny-crop.png");

    await sharp(tinyInputPath, {
      create: { width: 10, height: 10, channels: 3, background: { r: 255, g: 255, b: 255 } }
    }).toFile(tinyOutputPath);

    const result = await autoCrop(tinyOutputPath);
    expect(result.cropped).toBe(false);
    expect(result.reason).toBeDefined();
  });
});
