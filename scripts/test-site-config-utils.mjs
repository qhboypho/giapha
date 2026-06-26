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
  heroSeparatorUrl: "/separator.png",
  heroLotusUrl: "/lotus.png",
  heroTitle: "Ket noi gia toc"
});

assert.equal(partialConfig.familyName, "Nguyen Van");
assert.equal(partialConfig.logoUrl, "/logo.png");
assert.equal(partialConfig.heroSeparatorUrl, "/separator.png");
assert.equal(partialConfig.heroLotusUrl, "/lotus.png");
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
  navbarBackground: {
    pattern: "dots",
    patternOpacity: 60,
    glowOpacity: 10,
    ornamentOpacity: 40
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
  },
  security: {
    turnstileEnabled: true,
    turnstileSiteKey: "0x4AAAA_test_site_key",
    turnstileTheme: "dark",
    turnstileSize: "compact"
  },
  navigation: {
    treeLabel: "Phả đồ",
    aboutLabel: "Về dòng họ"
  },
  anniversary: {
    calendarMode: "solar",
    pageTitle: "Ngày tưởng nhớ",
    upcomingWindowDays: 60,
    showSolarDate: false
  },
  memberFields: {
    phone: false,
    restingPlace: false
  },
  sampleData: {
    generationCount: 4,
    rootMaleName: "Cụ ông {familyName} Tổ"
  },
  aboutPage: {
    enabled: true,
    title: "Về họ Nguyễn Văn",
    imageUrl: "/api/media/site/about.jpg",
    showContact: false
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
assert.equal(themedConfig.navbarBackground.pattern, "dots");
assert.equal(themedConfig.navbarBackground.patternOpacity, 60);
assert.equal(themedConfig.navbarBackground.glowOpacity, 10);
assert.equal(themedConfig.navbarBackground.ornamentOpacity, 40);
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
assert.equal(themedConfig.security.turnstileEnabled, true);
assert.equal(themedConfig.security.turnstileSiteKey, "0x4AAAA_test_site_key");
assert.equal(themedConfig.security.turnstileTheme, "dark");
assert.equal(themedConfig.security.turnstileSize, "compact");
assert.equal(themedConfig.navigation.treeLabel, "Phả đồ");
assert.equal(themedConfig.navigation.aboutLabel, "Về dòng họ");
assert.equal(themedConfig.anniversary.calendarMode, "solar");
assert.equal(themedConfig.anniversary.pageTitle, "Ngày tưởng nhớ");
assert.equal(themedConfig.anniversary.upcomingWindowDays, 60);
assert.equal(themedConfig.anniversary.showSolarDate, false);
assert.equal(themedConfig.memberFields.phone, false);
assert.equal(themedConfig.memberFields.address, true);
assert.equal(themedConfig.memberFields.restingPlace, false);
assert.equal(themedConfig.sampleData.generationCount, 4);
assert.equal(themedConfig.sampleData.rootMaleName, "Cụ ông {familyName} Tổ");
assert.equal(themedConfig.aboutPage.enabled, true);
assert.equal(themedConfig.aboutPage.title, "Về họ Nguyễn Văn");
assert.equal(themedConfig.aboutPage.imageUrl, "/api/media/site/about.jpg");
assert.equal(themedConfig.aboutPage.showContact, false);

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

assert.throws(
  () => validateSiteConfigInput({ ...DEFAULT_SITE_CONFIG, heroSeparatorUrl: "javascript:alert(1)" }),
  /Ảnh ngăn cách hero/
);

assert.throws(
  () => validateSiteConfigInput({ ...DEFAULT_SITE_CONFIG, heroLotusUrl: "javascript:alert(1)" }),
  /Ảnh bông sen hero/
);

const cssVariables = buildThemeCssVariables(themedConfig);
assert.equal(cssVariables["--color-brand-primary"], "#123ABC");
assert.match(cssVariables["--cms-bg-app"], /radial-gradient/);
assert.equal(cssVariables["--bg-app"], undefined);
assert.match(cssVariables["--theme-home-background-image"], /home\.jpg/);
assert.equal(cssVariables["--cms-generations-background"], "#101820");
assert.match(cssVariables["--theme-generations-background-image"], /generations\.jpg/);
assert.equal(cssVariables["--tree-connector-color"], "#ABCDEF");
assert.match(cssVariables["--theme-navbar-background"], /radial-gradient\(circle/);
assert.equal(cssVariables["--theme-navbar-ornament-opacity"], "0.40");

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

assert.throws(
  () => validateSiteConfigInput({
    ...DEFAULT_SITE_CONFIG,
    aboutPage: { ...DEFAULT_SITE_CONFIG.aboutPage, imageUrl: "javascript:alert(1)" }
  }),
  /Ảnh trang giới thiệu/
);

assert.throws(
  () => validateSiteConfigInput({
    ...DEFAULT_SITE_CONFIG,
    security: { ...DEFAULT_SITE_CONFIG.security, turnstileEnabled: true }
  }),
  /Turnstile Site Key/
);

assert.throws(
  () => validateSiteConfigInput({
    ...DEFAULT_SITE_CONFIG,
    security: { ...DEFAULT_SITE_CONFIG.security, turnstileSiteKey: "site key co dau cach" }
  }),
  /Turnstile Site Key không hợp lệ/
);

console.log("site config utils tests passed");
