import assert from "node:assert/strict";
import {
  DEFAULT_SITE_CONFIG,
  buildThemeCssVariables,
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
assert.equal(partialConfig.themeColors.primary, DEFAULT_SITE_CONFIG.themeColors.primary);

const themedConfig = normalizeSiteConfig({
  familyName: "Nguyen Van",
  themeColors: {
    primary: "#123abc",
    generationsBackground: "#101820",
    accent: "red"
  },
  themeBackgrounds: {
    home: "/images/home.jpg",
    generations: "/images/generations.jpg",
    tree: "javascript:alert(1)"
  },
  treeTheme: {
    connector: "#abcdef",
    selectedRing: "blue"
  }
});
assert.equal(themedConfig.themeColors.primary, "#123ABC");
assert.equal(themedConfig.themeColors.generationsBackground, "#101820");
assert.equal(themedConfig.themeColors.accent, DEFAULT_SITE_CONFIG.themeColors.accent);
assert.equal(themedConfig.themeBackgrounds.home, "/images/home.jpg");
assert.equal(themedConfig.themeBackgrounds.generations, "/images/generations.jpg");
assert.equal(themedConfig.themeBackgrounds.tree, "");
assert.equal(themedConfig.treeTheme.connector, "#ABCDEF");
assert.equal(themedConfig.treeTheme.selectedRing, DEFAULT_SITE_CONFIG.treeTheme.selectedRing);

const serialized = serializeSiteConfig(partialConfig);
const parsed = parseSiteConfigValue(serialized);
assert.equal(parsed.familyName, "Nguyen Van");
assert.equal(parsed.siteTitle, DEFAULT_SITE_CONFIG.siteTitle);
assert.equal(parsed.themeColors.primary, DEFAULT_SITE_CONFIG.themeColors.primary);

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

const cssVariables = buildThemeCssVariables(themedConfig);
assert.equal(cssVariables["--color-brand-primary"], "#123ABC");
assert.match(cssVariables["--bg-app"], /radial-gradient/);
assert.match(cssVariables["--theme-home-background-image"], /home\.jpg/);
assert.equal(cssVariables["--theme-generations-background"], "#101820");
assert.match(cssVariables["--theme-generations-background-image"], /generations\.jpg/);
assert.equal(cssVariables["--tree-connector-color"], "#ABCDEF");

assert.throws(
  () => validateSiteConfigInput({
    ...DEFAULT_SITE_CONFIG,
    themeBackgrounds: { ...DEFAULT_SITE_CONFIG.themeBackgrounds, pages: "javascript:alert(1)" }
  }),
  /Hình nền/
);

console.log("site config utils tests passed");
