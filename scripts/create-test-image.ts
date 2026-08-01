import sharp from "sharp";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function createTestImage() {
  // Create a test image with white margins and content in the center
  const testImagePath = path.join(__dirname, "..", "tmp", "test-image.png");

  // Ensure tmp directory exists
  await sharp({
    create: {
      width: 400,
      height: 300,
      channels: 3,
      background: { r: 255, g: 255, b: 255 }
    }
  })
    .composite([
      {
        input: Buffer.from(
          `<svg width="200" height="150"><rect width="200" height="150" fill="black"/><text x="10" y="80" font-family="Arial" font-size="20" fill="red">Test Image</text></svg>`
        ),
        top: 75,
        left: 100
      }
    ])
    .toFile(testImagePath);

  console.log(`✅ Test image created: ${testImagePath}`);
  console.log(`   Size: 400x300 (white margins will be cropped)`);
}

createTestImage().catch(console.error);
