import { describe, it, expect, beforeAll } from "vitest";
import { autoCrop, formatCropResult } from "../src/crop.js";
import sharp from "sharp";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const tmpDir = path.join(__dirname, "..", "tmp");

// Ensure tmp directory exists
beforeAll(() => {
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
  }
});

describe("Auto-Crop", () => {
  it("crops image with white margins", async () => {
    const testImagePath = path.join(tmpDir, "test-image.png");

    // Create test image if it doesn't exist
    if (!fs.existsSync(testImagePath)) {
      await sharp({
        create: {
          width: 400,
          height: 300,
          channels: 4,
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        }
      })
      .composite([{ input: Buffer.from('<svg><rect x="50" y="50" width="300" height="200" fill="black"/></svg>'), blend: 'over' }])
      .png()
      .toFile(testImagePath);
    }

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
    const tinyInputPath = path.join(tmpDir, "tiny-input.png");
    const tinyOutputPath = path.join(tmpDir, "tiny-crop.png");

    // Create tiny test image
    await sharp(tinyInputPath, {
      create: { width: 10, height: 10, channels: 3, background: { r: 255, g: 255, b: 255 } }
    }).toFile(tinyOutputPath);

    const result = await autoCrop(tinyOutputPath);
    expect(result.cropped).toBe(false);
    expect(result.reason).toBeDefined();
  });
});
