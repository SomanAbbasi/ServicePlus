/**
 * Client-side image compression and downscaling utility.
 * Shrinks multi-megabyte photos down to lightweight WebP/JPEG payloads (< 300 KB)
 * so they instantly upload without hitting serverless payload limits (413).
 */

export interface CompressOptions {
  maxDimension?: number;
  quality?: number;
  mimeType?: "image/webp" | "image/jpeg";
}

export interface CompressedImageResult {
  base64: string;
  contentType: string;
  filename: string;
  sizeBytes: number;
}

export async function compressImageFile(
  file: File,
  options: CompressOptions = {}
): Promise<CompressedImageResult> {
  const {
    maxDimension = 1600,
    quality = 0.82,
    mimeType = "image/webp",
  } = options;

  // For SVG files or animated GIF files, pass raw base64
  if (file.type === "image/svg+xml" || file.type === "image/gif") {
    const rawBase64 = await readFileAsBase64(file);
    return {
      base64: rawBase64,
      contentType: file.type,
      filename: file.name,
      sizeBytes: file.size,
    };
  }

  // Create an image element to read natural dimensions
  const image = await loadImage(file);
  const { naturalWidth, naturalHeight } = image;

  let width = naturalWidth;
  let height = naturalHeight;

  if (width > maxDimension || height > maxDimension) {
    if (width > height) {
      height = Math.round((height * maxDimension) / width);
      width = maxDimension;
    } else {
      width = Math.round((width * maxDimension) / height);
      height = maxDimension;
    }
  }

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(width, 1);
  canvas.height = Math.max(height, 1);

  const ctx = canvas.getContext("2d", { alpha: mimeType === "image/webp" });
  if (!ctx) {
    // Fallback if canvas context is unavailable
    const rawBase64 = await readFileAsBase64(file);
    return {
      base64: rawBase64,
      contentType: file.type,
      filename: file.name,
      sizeBytes: file.size,
    };
  }

  // If output is JPEG, paint white background first
  if (mimeType === "image/jpeg") {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
  }

  ctx.drawImage(image, 0, 0, width, height);

  // Test if WebP export is supported by checking data URL
  let targetMime = mimeType;
  let dataUrl = canvas.toDataURL(targetMime, quality);
  if (!dataUrl.startsWith(`data:${targetMime}`)) {
    targetMime = "image/jpeg";
    dataUrl = canvas.toDataURL("image/jpeg", quality);
  }

  const base64 = dataUrl.split(",")[1] ?? "";
  const ext = targetMime === "image/webp" ? ".webp" : ".jpg";
  const nameBase = file.name.replace(/\.[^/.]+$/, "");
  const newFilename = `${nameBase}${ext}`;

  // Approximate byte size of base64
  const sizeBytes = Math.round((base64.length * 3) / 4);

  return {
    base64,
    contentType: targetMime,
    filename: newFilename,
    sizeBytes,
  };
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image for compression: " + String(err)));
    };
    img.src = url;
  });
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? "");
      const base64 = result.includes(",") ? result.split(",")[1] : result;
      resolve(base64 || "");
    };
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}
