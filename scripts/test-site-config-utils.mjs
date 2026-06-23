import assert from "node:assert/strict";
import {
  DEFAULT_SITE_CONFIG,
  buildSeoMetadata,
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
  siteTitle: "Gia pha ho Nguyen Van",
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
  },
  seo: {
    title: "Gia pha Nguyen Van custom",
    description: "Mo ta SEO rieng cho dong ho Nguyen Van.",
    canonicalUrl: "https://example.com/gia-pha-nguyen-van",
    ogImage: "/api/media/site/seo/og.jpg",
    twitterImage: "https://cdn.example.com/twitter.jpg"
  },
  appIdentity: {
    faviconUrl: "/api/media/site/icon/favicon.png",
    appIconUrl: "/api/media/site/icon/app.png",
    themeColor: "#123456"
  },
  contact: {
    managerName: "Nguyen Van A",
    facebookUrl: "https://facebook.com/example",
    showInFooter: true
  },
  homepage: {
    showHistory: false,
    featuredLimit: 12,
    anniversaryWindowDays: 45
  },
  notifications: {
    enablePresence: false,
    anniversaryDaysAhead: 45,
    maxVisible: 5
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
assert.equal(themedConfig.seo.title, "Gia pha Nguyen Van custom");
assert.equal(themedConfig.seo.canonicalUrl, "https://example.com/gia-pha-nguyen-van");
assert.equal(themedConfig.seo.ogImage, "/api/media/site/seo/og.jpg");
assert.equal(themedConfig.appIdentity.faviconUrl, "/api/media/site/icon/favicon.png");
assert.equal(themedConfig.appIdentity.themeColor, "#123456");
assert.equal(themedConfig.contact.managerName, "Nguyen Van A");
assert.equal(themedConfig.contact.showInFooter, true);
assert.equal(themedConfig.homepage.showHistory, false);
assert.equal(themedConfig.homepage.featuredLimit, 12);
assert.equal(themedConfig.homepage.anniversaryWindowDays, 45);
assert.equal(themedConfig.notifications.enablePresence, false);
assert.equal(themedConfig.notifications.anniversaryDaysAhead, 45);
assert.equal(themedConfig.notifications.maxVisible, 5);

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
assert.match(cssVariables["--cms-bg-app"], /radial-gradient/);
assert.equal(cssVariables["--bg-app"], undefined);
assert.match(cssVariables["--theme-home-background-image"], /home\.jpg/);
assert.equal(cssVariables["--cms-generations-background"], "#101820");
assert.match(cssVariables["--theme-generations-background-image"], /generations\.jpg/);
assert.equal(cssVariables["--tree-connector-color"], "#ABCDEF");

const seo = buildSeoMetadata(themedConfig, { origin: "https://giapha-nguyen-van.pages.dev/" });
assert.equal(seo.ogTitle, "Gia pha ho Nguyen Van");
assert.equal(seo.title, "Gia pha Nguyen Van custom");
assert.equal(seo.description, "Mo ta SEO rieng cho dong ho Nguyen Van.");
assert.match(seo.keywords, /gia phả họ Nguyen Van/);
assert.equal(seo.ogImage, "https://giapha-nguyen-van.pages.dev/api/media/site/seo/og.jpg");
assert.equal(seo.twitterImage, "https://cdn.example.com/twitter.jpg");
assert.equal(seo.canonicalUrl, "https://example.com/gia-pha-nguyen-van");

assert.throws(
  () => validateSiteConfigInput({
    ...DEFAULT_SITE_CONFIG,
    themeBackgrounds: { ...DEFAULT_SITE_CONFIG.themeBackgrounds, pages: "javascript:alert(1)" }
  }),
  /Hình nền/
);

assert.throws(
  () => validateSiteConfigInput({
    ...DEFAULT_SITE_CONFIG,
    seo: { ...DEFAULT_SITE_CONFIG.seo, canonicalUrl: "/khong-hop-le" }
  }),
  /Canonical URL/
);

assert.throws(
  () => validateSiteConfigInput({
    ...DEFAULT_SITE_CONFIG,
    contact: { ...DEFAULT_SITE_CONFIG.contact, facebookUrl: "facebook.com/example" }
  }),
  /Link liên hệ/
);

console.log("site config utils tests passed");
