import assert from "node:assert/strict";
import {
  buildMediaPackage,
  buildMediaPackagePreview,
  normalizeImportedMediaPackage
} from "../src/utils/mediaPackageUtils.js";

const mediaPackage = buildMediaPackage([
  {
    key: "history/2026/a.jpg",
    name: "a.jpg",
    contentType: "image/jpeg",
    size: 12,
    base64: "aGVsbG8="
  },
  {
    key: "history/2026/b.png",
    name: "b.png",
    contentType: "image/png",
    size: 16,
    base64: "d29ybGQ="
  }
], {
  exportedAt: "2026-06-20T00:00:00.000Z",
  exportedBy: "admin"
});

assert.equal(mediaPackage.type, "giapha-media-package");
assert.equal(mediaPackage.version, 1);
assert.equal(mediaPackage.mediaCount, 2);

const normalized = normalizeImportedMediaPackage(mediaPackage);
assert.equal(normalized.media.length, 2);
assert.equal(normalized.media[0].key, "history/2026/a.jpg");

const preview = buildMediaPackagePreview(["history/2026/a.jpg"], normalized.media);
assert.equal(preview.totalIncoming, 2);
assert.equal(preview.toUpload, 1);
assert.equal(preview.toOverwrite, 1);
assert.equal(preview.uploads[0].key, "history/2026/b.png");

assert.throws(
  () => normalizeImportedMediaPackage({ ...mediaPackage, media: [mediaPackage.media[0], mediaPackage.media[0]] }),
  /bị trùng/
);

assert.throws(
  () => normalizeImportedMediaPackage({ ...mediaPackage, media: [{ ...mediaPackage.media[0], base64: "@@@" }] }),
  /base64/
);

console.log("media package utils tests passed");
