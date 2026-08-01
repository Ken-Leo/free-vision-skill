import sharp from "sharp";
import path from "node:path";

export interface CropOptions {
  /** Minimum margin to keep from edges (default: 10) */
  margin?: number;
  /** Threshold for white/transparent detection (default: 240) */
  threshold?: number;
  /** Minimum crop dimensions (default: 50x50) */
  minSize?: { width: number; height: number };
}

export interface CropResult {
  cropped: boolean;
  originalSize: { width: number; height: number };
  croppedSize?: { width: number; height: number };
  cropBox?: { x: number; y: number; width: number; height: number };
  savedPath?: string;
  reason?: string;
}

/**
 * Auto-crop image by removing white/transparent margins.
 *
 * @param imagePath - Path to input image
 * @param options - Crop configuration options
 * @returns Crop result with metadata
 */
export async function autoCrop(
  imagePath: string,
  options: CropOptions = {}
): Promise<CropResult> {
  const {
    margin = 10,
    threshold = 240,
    minSize = { width: 50, height: 50 }
  } = options;

  const absolute = path.resolve(imagePath);

  // Get image metadata
  const metadata = await sharp(absolute).metadata();

  if (!metadata.width || !metadata.height) {
    throw new Error(`Failed to read image dimensions: ${imagePath}`);
  }

  const originalSize = { width: metadata.width, height: metadata.height };

  // Extract alpha channel (transparency)
  const alphaBuffer = await sharp(absolute)
    .ensureAlpha()
    .raw()
    .toBuffer();

  // Extract white channel (brightness)
  const whiteBuffer = await sharp(absolute)
    .greyscale()
    .raw()
    .toBuffer();

  const width = metadata.width;
  const height = metadata.height;
  const stride = metadata.channels || 3;

  // Find content bounds
  const bounds = findContentBounds(
    alphaBuffer,
    whiteBuffer,
    width,
    height,
    stride,
    threshold,
    margin
  );

  // Check if cropping is needed
  if (!bounds) {
    return {
      cropped: false,
      originalSize,
      reason: "No content bounds found (image might be empty)"
    };
  }

  const cropWidth = bounds.right - bounds.left;
  const cropHeight = bounds.bottom - bounds.top;

  // Validate minimum dimensions
  if (cropWidth < minSize.width || cropHeight < minSize.height) {
    return {
      cropped: false,
      originalSize,
      reason: `Cropped area too small: ${cropWidth}x${cropHeight} < ${minSize.width}x${minSize.height}`
    };
  }

  // Check if cropping is beneficial (>5% reduction)
  const widthReduction = 1 - cropWidth / width;
  const heightReduction = 1 - cropHeight / height;

  if (widthReduction < 0.05 && heightReduction < 0.05) {
    return {
      cropped: false,
      originalSize,
      reason: "Marginal reduction < 5%, skipping crop"
    };
  }

  // Perform crop
  const croppedBuffer = await sharp(absolute)
    .extract({
      left: bounds.left,
      top: bounds.top,
      width: cropWidth,
      height: cropHeight
    })
    .toBuffer();

  // Save cropped image
  const ext = path.extname(absolute);
  const baseName = path.basename(absolute, ext);
  const dir = path.dirname(absolute);
  const savedPath = path.join(dir, `${baseName}.cropped${ext}`);

  await sharp(croppedBuffer).toFile(savedPath);

  return {
    cropped: true,
    originalSize,
    croppedSize: { width: cropWidth, height: cropHeight },
    cropBox: {
      x: bounds.left,
      y: bounds.top,
      width: cropWidth,
      height: cropHeight
    },
    savedPath
  };
}

/**
 * Find content bounds by detecting non-white/non-transparent areas.
 */
interface Bounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

function findContentBounds(
  alphaBuffer: Buffer,
  whiteBuffer: Buffer,
  width: number,
  height: number,
  stride: number,
  threshold: number,
  margin: number
): Bounds | null {
  let top = height;
  let bottom = 0;
  let left = width;
  let right = 0;

  const isContent = (x: number, y: number): boolean => {
    const idx = (y * width + x) * stride;

    // Check alpha channel (if available)
    if (alphaBuffer.length > idx) {
      const alpha = alphaBuffer[idx];
      if (alpha !== undefined && alpha < 10) return false; // Fully transparent
    }

    // Check brightness
    const brightness = whiteBuffer[idx];
    if (brightness === undefined) return false;
    return brightness < threshold;
  };

  // Scan all pixels
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (isContent(x, y)) {
        if (y < top) top = y;
        if (y > bottom) bottom = y;
        if (x < left) left = x;
        if (x > right) right = x;
      }
    }
  }

  // No content found
  if (top > bottom || left > right) {
    return null;
  }

  // Apply margin
  top = Math.max(0, top - margin);
  bottom = Math.min(height - 1, bottom + margin);
  left = Math.max(0, left - margin);
  right = Math.min(width - 1, right + margin);

  return { top, bottom, left, right };
}

/**
 * Format crop result for display.
 */
export function formatCropResult(result: CropResult): string {
  if (!result.cropped) {
    return `✂️  No crop needed: ${result.reason}`;
  }

  const origW = result.originalSize.width;
  const origH = result.originalSize.height;
  const cropW = result.croppedSize!.width;
  const cropH = result.croppedSize!.height;
  const reduction = Math.round((1 - (cropW * cropH) / (origW * origH)) * 100);

  return [
    `✂️  Cropped: ${origW}x${origH} → ${cropW}x${cropH}`,
    `   Reduction: ${reduction}%`,
    `   Saved to: ${result.savedPath}`
  ].join("\n");
}
