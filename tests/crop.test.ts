import { autoCrop, formatCropResult } from "../src/crop.js";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function testAutoCrop() {
  console.log("🧪 Testing auto-crop functionality...\n");

  // Test 1: Image with white margins
  const testImagePath = path.join(__dirname, "..", "tmp", "test-image.png");

  try {
    const result = await autoCrop(testImagePath, {
      margin: 10,
      threshold: 240
    });

    console.log("Test 1: Image with white margins");
    console.log(formatCropResult(result));

    if (result.cropped) {
      console.log("✅ PASS: Image was cropped successfully");
      console.log(`   Original: ${result.originalSize.width}x${result.originalSize.height}`);
      console.log(`   Cropped: ${result.croppedSize!.width}x${result.croppedSize!.height}`);
      console.log(`   Crop box: ${result.cropBox!.width}x${result.cropBox!.height} at (${result.cropBox!.x}, ${result.cropBox!.y})`);
    } else {
      console.log(`⚠️  SKIP: ${result.reason}`);
    }
  } catch (error) {
    console.error("❌ FAIL:", error);
  }

  // Test 2: Very small image (should skip)
  console.log("\n---\n");

  try {
    // Create a tiny image
    const tinyPath = path.join(__dirname, "..", "tmp", "tiny.png");
    await sharp(tinyPath, { create: { width: 10, height: 10, channels: 3, background: { r: 255, g: 255, b: 255 } } })
      .toFile(tinyPath);

    const result = await autoCrop(tinyPath);
    console.log("Test 2: Tiny image (10x10)");
    console.log(formatCropResult(result));
    console.log(result.cropped ? "❌ FAIL: Should have skipped" : "✅ PASS: Correctly skipped");
  } catch (error) {
    console.error("❌ FAIL:", error);
  }

  // Test 3: Integration with CLI
  console.log("\n---\n");
  console.log("Test 3: CLI integration");
  console.log("Run: npx tsx src/cli.ts see --image tmp/test-image.png --auto-crop --question 'Test'");
  console.log("(Manual test required - check stderr for crop result)\n");
}

testAutoCrop();
