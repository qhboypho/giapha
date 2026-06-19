import assert from "node:assert/strict";
import {
  DEFAULT_SITE_CONFIG,
  normalizeSiteConfig,
  parseSiteConfigValue,
  serializeSiteConfig,
  validateSiteConfigInput
} from "../src/utils/siteConfigUtils.js";

const partialConfig = normalizeSiteConfig({
  familyName: "Nguyen Van",
  logoUrl: "/logo.png",
  heroTitle: "Ket noi gia toc"
});

assert.equal(partialConfig.familyName, "Nguyen Van");
assert.equal(partialConfig.logoUrl, "/logo.png");
assert.equal(partialConfig.heroTitle, "Ket noi gia toc");
assert.equal(partialConfig.familyLabel, DEFAULT_SITE_CONFIG.familyLabel);

const serialized = serializeSiteConfig(partialConfig);
const parsed = parseSiteConfigValue(serialized);
assert.equal(parsed.familyName, "Nguyen Van");
assert.equal(parsed.siteTitle, DEFAULT_SITE_CONFIG.siteTitle);

const validated = validateSiteConfigInput({
  ...DEFAULT_SITE_CONFIG,
  siteTitle: "Gia pha ho Nguyen Van",
  logoUrl: "https://example.com/logo.png"
});
assert.equal(validated.siteTitle, "Gia pha ho Nguyen Van");

assert.throws(
  () => validateSiteConfigInput({ ...DEFAULT_SITE_CONFIG, logoUrl: "javascript:alert(1)" }),
  /Logo phải là đường dẫn/
);

console.log("site config utils tests passed");
