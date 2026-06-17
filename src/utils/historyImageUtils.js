export const MAX_HISTORY_IMAGES = 8;
export const MAX_HISTORY_UPLOAD_BYTES = 2 * 1024 * 1024;
const TARGET_IMAGE_BYTES = 900 * 1024;
const MAX_IMAGE_SIDE = 1600;

function fileToImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Không thể đọc ảnh."));
    };
    image.src = url;
  });
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve) => {
    canvas.toBlob(resolve, type, quality);
  });
}

function getImageSize(width, height, maxSide) {
  const largest = Math.max(width, height);
  if (largest <= maxSide) return { width, height };
  const ratio = maxSide / largest;
  return {
    width: Math.round(width * ratio),
    height: Math.round(height * ratio)
  };
}

function normalizeImageType(type) {
  if (type === "image/png" || type === "image/jpeg" || type === "image/webp") return type;
  return "image/jpeg";
}

export async function compressHistoryImage(file) {
  if (!file?.type?.startsWith("image/")) {
    throw new Error("File không phải ảnh.");
  }

  if (file.type === "image/gif" && file.size <= MAX_HISTORY_UPLOAD_BYTES) {
    return file;
  }

  const image = await fileToImage(file);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { alpha: true });
  const outputType = normalizeImageType(file.type);
  const attempts = [
    { side: MAX_IMAGE_SIDE, quality: 0.86 },
    { side: 1400, quality: 0.78 },
    { side: 1180, quality: 0.72 },
    { side: 980, quality: 0.68 }
  ];

  let bestBlob = null;
  for (const attempt of attempts) {
    const size = getImageSize(image.naturalWidth || image.width, image.naturalHeight || image.height, attempt.side);
    canvas.width = size.width;
    canvas.height = size.height;
    ctx.clearRect(0, 0, size.width, size.height);
    ctx.drawImage(image, 0, 0, size.width, size.height);

    const blob = await canvasToBlob(canvas, outputType, attempt.quality);
    if (!blob) continue;
    bestBlob = blob;
    if (blob.size <= TARGET_IMAGE_BYTES) break;
  }

  if (!bestBlob) {
    throw new Error("Không thể nén ảnh.");
  }

  return new File([bestBlob], file.name, {
    type: bestBlob.type || outputType,
    lastModified: Date.now()
  });
}

export function formatImageSize(bytes = 0) {
  const value = Number(bytes || 0);
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}
