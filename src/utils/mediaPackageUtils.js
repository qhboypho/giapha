export const MEDIA_PACKAGE_TYPE = "giapha-media-package";
export const MEDIA_PACKAGE_VERSION = 1;

const MAX_MEDIA_BASE64_LENGTH = 12 * 1024 * 1024;

const normalizeText = (value) => String(value || "").trim();

export function normalizeMediaItem(item = {}) {
  const key = normalizeText(item.key).replace(/^\/+/, "");
  const contentType = normalizeText(item.contentType || item.type || "application/octet-stream");
  const base64 = normalizeText(item.base64 || item.data);

  return {
    key,
    name: normalizeText(item.name),
    contentType,
    size: Number.isFinite(Number(item.size)) ? Number(item.size) : 0,
    base64
  };
}

export function buildMediaPackage(items = [], metadata = {}) {
  const media = items.map(normalizeMediaItem).filter((item) => item.key && item.base64);

  return {
    type: MEDIA_PACKAGE_TYPE,
    version: MEDIA_PACKAGE_VERSION,
    exportedAt: metadata.exportedAt || new Date().toISOString(),
    exportedBy: metadata.exportedBy || "",
    mediaCount: media.length,
    media
  };
}

export function normalizeImportedMediaPackage(payload = {}) {
  if (payload.type !== MEDIA_PACKAGE_TYPE) {
    throw new Error("File không đúng định dạng gói media gia phả.");
  }
  if (payload.version !== MEDIA_PACKAGE_VERSION) {
    throw new Error("Phiên bản gói media không được hỗ trợ.");
  }
  if (!Array.isArray(payload.media)) {
    throw new Error("Gói media không có danh sách ảnh hợp lệ.");
  }

  const seenKeys = new Set();
  const media = payload.media.map((item, index) => {
    const normalized = normalizeMediaItem(item);
    if (!normalized.key || normalized.key.includes("..")) {
      throw new Error(`Ảnh dòng ${index + 1} có key không hợp lệ.`);
    }
    if (!normalized.base64) {
      throw new Error(`Ảnh ${normalized.key} thiếu dữ liệu base64.`);
    }
    if (normalized.base64.length > MAX_MEDIA_BASE64_LENGTH) {
      throw new Error(`Ảnh ${normalized.key} vượt quá giới hạn kích thước gói media.`);
    }
    if (!/^[a-z0-9+/=]+$/i.test(normalized.base64)) {
      throw new Error(`Ảnh ${normalized.key} có dữ liệu base64 không hợp lệ.`);
    }
    if (seenKeys.has(normalized.key)) {
      throw new Error(`Gói media có key ảnh bị trùng: ${normalized.key}.`);
    }
    seenKeys.add(normalized.key);
    return normalized;
  });

  return { media };
}

export function buildMediaPackagePreview(existingKeys = [], incomingMedia = []) {
  const existingSet = new Set(existingKeys.filter(Boolean));
  const uploads = [];
  const overwrites = [];

  incomingMedia.forEach((item) => {
    const summary = summarizeMediaItem(item);
    if (existingSet.has(item.key)) {
      overwrites.push(summary);
    } else {
      uploads.push(summary);
    }
  });

  return {
    totalExisting: existingSet.size,
    totalIncoming: incomingMedia.length,
    toUpload: uploads.length,
    toOverwrite: overwrites.length,
    uploads,
    overwrites
  };
}

function summarizeMediaItem(item) {
  return {
    key: item.key,
    name: item.name,
    contentType: item.contentType,
    size: item.size
  };
}
