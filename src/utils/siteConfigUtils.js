export const SITE_CONFIG_SETTING_KEY = "site_config";

export const DEFAULT_SITE_CONFIG = {
  familyName: "Trần Công",
  familyLabel: "Gia Phả Họ",
  siteTitle: "Gia phả họ Trần Công",
  shortName: "TC",
  logoUrl: "/tranconglogo.png",
  heroTitle: "Lưu giữ cội nguồn",
  heroSubtitle: "Kết nối muôn đời con cháu",
  heroDescription: "Gia phả là sợi dây thiêng liêng kết nối quá khứ, hiện tại và tương lai. Cùng nhau gìn giữ cội nguồn, vun đắp truyền thống cho muôn đời con cháu.",
  primaryCtaLabel: "Khám phá gia phả",
  secondaryCtaLabel: "Tìm người thân",
  mainTreeTitle: "Cây gia phả dòng chính",
  loginDescription: "Hệ thống yêu cầu mật khẩu để xem thông tin chi tiết gia phả dòng họ.",
  footerQuote: "Cội nguồn là nơi bắt đầu - Ký ức là sợi dây - Tương lai là nơi tiếp nối.",
  footerMessage: "Nguyện cùng nhau gìn giữ, để dòng họ Trần Công mãi bền vững và tỏa sáng.",
  themeColors: {
    primary: "#B64235",
    secondary: "#55745F",
    accent: "#D6A85A",
    appBackground: "#0F0A07",
    cardBackground: "#241A12",
    cardHover: "#2D2017",
    border: "#4B3828",
    textPrimary: "#F5E7D3",
    textSecondary: "#D4C6B2",
    textMuted: "#8E7F72",
    navbarTop: "#9C130F",
    navbarBottom: "#690604",
    generationsBackground: "#0F0A07"
  },
  themeBackgrounds: {
    app: "",
    home: "",
    pages: "",
    generations: "",
    tree: ""
  },
  treeTheme: {
    maleBackground: "#1E2D3A",
    maleBorder: "#4A90E2",
    femaleBackground: "#3A2230",
    femaleBorder: "#E24A90",
    deceasedBackground: "#1B120C",
    deceasedBorder: "#8E7F72",
    deceasedText: "#8E7F72",
    connector: "#8E7F72",
    spouseConnector: "#D6A85A",
    selectedRing: "#B64235",
    searchHighlight: "#D6A85A"
  },
  seo: {
    title: "",
    description: "",
    keywords: "",
    author: "",
    applicationName: "",
    appleTitle: "",
    canonicalUrl: "",
    ogSiteName: "",
    ogTitle: "",
    ogDescription: "",
    ogImage: "",
    twitterTitle: "",
    twitterDescription: "",
    twitterImage: ""
  },
  appIdentity: {
    faviconUrl: "/favicon-96x96.png",
    appleTouchIconUrl: "/apple-touch-icon.png",
    appIconUrl: "/web-app-manifest-512x512.png",
    themeColor: "#7A1819",
    statusBarStyle: "black-translucent"
  },
  contact: {
    managerName: "",
    phone: "",
    zalo: "",
    email: "",
    address: "",
    facebookUrl: "",
    youtubeUrl: "",
    showInFooter: false
  },
  homepage: {
    showStats: true,
    showFeatures: true,
    showFeatured: true,
    showAnniversaries: true,
    showHistory: true,
    featuredLimit: 8,
    anniversaryLimit: 6,
    anniversaryWindowDays: 30
  },
  notifications: {
    enableAnniversary: true,
    anniversaryDaysAhead: 30,
    anniversaryLimit: 5,
    enableHistory: true,
    historyLimit: 3,
    enableFeatured: true,
    featuredLimit: 2,
    enablePrivacy: true,
    enablePresence: true,
    maxVisible: 8
  },
  privacyDisplay: {
    guestCanSeeNavbar: true,
    maskPhone: true,
    maskAddress: true,
    maskBirthPlace: true,
    maskRestingPlace: true
  }
};

const SITE_CONFIG_TEXT_LIMITS = {
  familyName: 80,
  familyLabel: 80,
  siteTitle: 120,
  shortName: 16,
  logoUrl: 500,
  heroTitle: 120,
  heroSubtitle: 160,
  heroDescription: 500,
  primaryCtaLabel: 80,
  secondaryCtaLabel: 80,
  mainTreeTitle: 120,
  loginDescription: 300,
  footerQuote: 250,
  footerMessage: 300
};

export const SITE_THEME_COLOR_FIELDS = Object.keys(DEFAULT_SITE_CONFIG.themeColors);
export const SITE_THEME_BACKGROUND_FIELDS = Object.keys(DEFAULT_SITE_CONFIG.themeBackgrounds);
export const SITE_TREE_THEME_FIELDS = Object.keys(DEFAULT_SITE_CONFIG.treeTheme);
export const SITE_SEO_FIELDS = Object.keys(DEFAULT_SITE_CONFIG.seo);
export const SITE_APP_IDENTITY_FIELDS = Object.keys(DEFAULT_SITE_CONFIG.appIdentity);
export const SITE_CONTACT_FIELDS = Object.keys(DEFAULT_SITE_CONFIG.contact);
export const SITE_HOMEPAGE_FIELDS = Object.keys(DEFAULT_SITE_CONFIG.homepage);
export const SITE_NOTIFICATION_FIELDS = Object.keys(DEFAULT_SITE_CONFIG.notifications);
export const SITE_PRIVACY_DISPLAY_FIELDS = Object.keys(DEFAULT_SITE_CONFIG.privacyDisplay);
export const SITE_CONFIG_FIELDS = Object.keys(DEFAULT_SITE_CONFIG).filter((field) => (
  ![
    "themeColors",
    "themeBackgrounds",
    "treeTheme",
    "seo",
    "appIdentity",
    "contact",
    "homepage",
    "notifications",
    "privacyDisplay"
  ].includes(field)
));
const HEX_COLOR_PATTERN = /^#[0-9a-f]{6}$/i;
const BACKGROUND_URL_LIMIT = 800;
const SEO_TEXT_LIMITS = {
  title: 160,
  description: 320,
  keywords: 500,
  author: 160,
  applicationName: 160,
  appleTitle: 64,
  canonicalUrl: 800,
  ogSiteName: 160,
  ogTitle: 160,
  ogDescription: 320,
  ogImage: 800,
  twitterTitle: 160,
  twitterDescription: 320,
  twitterImage: 800
};
const APP_IDENTITY_TEXT_LIMITS = {
  faviconUrl: 800,
  appleTouchIconUrl: 800,
  appIconUrl: 800,
  themeColor: 7,
  statusBarStyle: 40
};
const CONTACT_TEXT_LIMITS = {
  managerName: 120,
  phone: 40,
  zalo: 80,
  email: 120,
  address: 240,
  facebookUrl: 800,
  youtubeUrl: 800,
  showInFooter: 10
};

const normalizeString = (value, fallback = "", maxLength = 300) => {
  const text = String(value ?? "").trim();
  return (text || fallback).slice(0, maxLength);
};

export function normalizeSiteConfig(config = {}) {
  const normalized = SITE_CONFIG_FIELDS.reduce((acc, field) => {
    acc[field] = normalizeString(
      config[field],
      DEFAULT_SITE_CONFIG[field],
      SITE_CONFIG_TEXT_LIMITS[field]
    );
    return acc;
  }, {});

  normalized.themeColors = normalizeThemeColors(config.themeColors);
  normalized.themeBackgrounds = normalizeThemeBackgrounds(config.themeBackgrounds);
  normalized.treeTheme = normalizeTreeTheme(config.treeTheme);
  normalized.seo = normalizeSeoConfig(config.seo);
  normalized.appIdentity = normalizeAppIdentity(config.appIdentity);
  normalized.contact = normalizeContactConfig(config.contact);
  normalized.homepage = normalizeHomepageConfig(config.homepage);
  normalized.notifications = normalizeNotificationConfig(config.notifications);
  normalized.privacyDisplay = normalizePrivacyDisplayConfig(config.privacyDisplay);
  return normalized;
}

export function normalizeThemeColors(colors = {}) {
  const source = colors && typeof colors === "object" ? colors : {};
  return SITE_THEME_COLOR_FIELDS.reduce((acc, field) => {
    const rawValue = String(source[field] || "").trim();
    acc[field] = HEX_COLOR_PATTERN.test(rawValue)
      ? rawValue.toUpperCase()
      : DEFAULT_SITE_CONFIG.themeColors[field];
    return acc;
  }, {});
}

export function normalizeThemeBackgrounds(backgrounds = {}) {
  const source = backgrounds && typeof backgrounds === "object" ? backgrounds : {};
  return SITE_THEME_BACKGROUND_FIELDS.reduce((acc, field) => {
    acc[field] = normalizeBackgroundUrl(source[field], DEFAULT_SITE_CONFIG.themeBackgrounds[field]);
    return acc;
  }, {});
}

export function normalizeTreeTheme(colors = {}) {
  const source = colors && typeof colors === "object" ? colors : {};
  return SITE_TREE_THEME_FIELDS.reduce((acc, field) => {
    const rawValue = String(source[field] || "").trim();
    acc[field] = HEX_COLOR_PATTERN.test(rawValue)
      ? rawValue.toUpperCase()
      : DEFAULT_SITE_CONFIG.treeTheme[field];
    return acc;
  }, {});
}

export function normalizeSeoConfig(seo = {}) {
  const source = seo && typeof seo === "object" ? seo : {};
  return SITE_SEO_FIELDS.reduce((acc, field) => {
    const fallback = DEFAULT_SITE_CONFIG.seo[field];
    const value = normalizeString(source[field], fallback, SEO_TEXT_LIMITS[field]);
    if (field === "canonicalUrl") {
      acc[field] = normalizeCanonicalUrl(value, fallback);
    } else if (["ogImage", "twitterImage"].includes(field)) {
      acc[field] = normalizeSeoUrl(value, fallback);
    } else {
      acc[field] = value;
    }
    return acc;
  }, {});
}

export function normalizeAppIdentity(identity = {}) {
  const source = identity && typeof identity === "object" ? identity : {};
  return SITE_APP_IDENTITY_FIELDS.reduce((acc, field) => {
    const fallback = DEFAULT_SITE_CONFIG.appIdentity[field];
    const value = normalizeString(source[field], fallback, APP_IDENTITY_TEXT_LIMITS[field]);
    if (["faviconUrl", "appleTouchIconUrl", "appIconUrl"].includes(field)) {
      acc[field] = normalizeSeoUrl(value, fallback);
    } else if (field === "themeColor") {
      acc[field] = HEX_COLOR_PATTERN.test(value) ? value.toUpperCase() : fallback;
    } else {
      acc[field] = ["default", "black", "black-translucent"].includes(value) ? value : fallback;
    }
    return acc;
  }, {});
}

export function normalizeContactConfig(contact = {}) {
  const source = contact && typeof contact === "object" ? contact : {};
  return SITE_CONTACT_FIELDS.reduce((acc, field) => {
    if (field === "showInFooter") {
      acc[field] = Boolean(source[field]);
      return acc;
    }
    const fallback = DEFAULT_SITE_CONFIG.contact[field];
    const value = normalizeString(source[field], fallback, CONTACT_TEXT_LIMITS[field]);
    if (["facebookUrl", "youtubeUrl"].includes(field)) {
      acc[field] = normalizeExternalUrl(value, fallback);
    } else {
      acc[field] = value;
    }
    return acc;
  }, {});
}

export function normalizeHomepageConfig(homepage = {}) {
  const source = homepage && typeof homepage === "object" ? homepage : {};
  return {
    showStats: source.showStats !== false,
    showFeatures: source.showFeatures !== false,
    showFeatured: source.showFeatured !== false,
    showAnniversaries: source.showAnniversaries !== false,
    showHistory: source.showHistory !== false,
    featuredLimit: clampNumber(source.featuredLimit, DEFAULT_SITE_CONFIG.homepage.featuredLimit, 1, 24),
    anniversaryLimit: clampNumber(source.anniversaryLimit, DEFAULT_SITE_CONFIG.homepage.anniversaryLimit, 1, 24),
    anniversaryWindowDays: clampNumber(source.anniversaryWindowDays, DEFAULT_SITE_CONFIG.homepage.anniversaryWindowDays, 1, 365)
  };
}

export function normalizeNotificationConfig(notifications = {}) {
  const source = notifications && typeof notifications === "object" ? notifications : {};
  return {
    enableAnniversary: source.enableAnniversary !== false,
    anniversaryDaysAhead: clampNumber(source.anniversaryDaysAhead, DEFAULT_SITE_CONFIG.notifications.anniversaryDaysAhead, 1, 365),
    anniversaryLimit: clampNumber(source.anniversaryLimit, DEFAULT_SITE_CONFIG.notifications.anniversaryLimit, 0, 20),
    enableHistory: source.enableHistory !== false,
    historyLimit: clampNumber(source.historyLimit, DEFAULT_SITE_CONFIG.notifications.historyLimit, 0, 20),
    enableFeatured: source.enableFeatured !== false,
    featuredLimit: clampNumber(source.featuredLimit, DEFAULT_SITE_CONFIG.notifications.featuredLimit, 0, 20),
    enablePrivacy: source.enablePrivacy !== false,
    enablePresence: source.enablePresence !== false,
    maxVisible: clampNumber(source.maxVisible, DEFAULT_SITE_CONFIG.notifications.maxVisible, 1, 30)
  };
}

export function normalizePrivacyDisplayConfig(privacy = {}) {
  const source = privacy && typeof privacy === "object" ? privacy : {};
  return SITE_PRIVACY_DISPLAY_FIELDS.reduce((acc, field) => {
    acc[field] = source[field] !== false;
    return acc;
  }, {});
}

export function normalizeBackgroundUrl(value, fallback = "") {
  const url = String(value ?? "").trim().slice(0, BACKGROUND_URL_LIMIT);
  if (!url) return fallback || "";
  return /^(\/|https?:\/\/|data:image\/)/i.test(url) ? url : (fallback || "");
}

function normalizeSeoUrl(value, fallback = "") {
  const url = String(value ?? "").trim().slice(0, BACKGROUND_URL_LIMIT);
  if (!url) return fallback || "";
  return /^(\/|https?:\/\/|data:image\/)/i.test(url) ? url : (fallback || "");
}

function normalizeCanonicalUrl(value, fallback = "") {
  const url = String(value ?? "").trim().slice(0, BACKGROUND_URL_LIMIT);
  if (!url) return fallback || "";
  return /^https?:\/\//i.test(url) ? url : (fallback || "");
}

function normalizeExternalUrl(value, fallback = "") {
  const url = String(value ?? "").trim().slice(0, BACKGROUND_URL_LIMIT);
  if (!url) return fallback || "";
  return /^https?:\/\//i.test(url) ? url : (fallback || "");
}

function clampNumber(value, fallback, min, max) {
  const number = Number.parseInt(value, 10);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
}

export function parseSiteConfigValue(value) {
  if (!value) return DEFAULT_SITE_CONFIG;

  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    return normalizeSiteConfig(parsed && typeof parsed === "object" ? parsed : {});
  } catch {
    return DEFAULT_SITE_CONFIG;
  }
}

export function serializeSiteConfig(config = {}) {
  return JSON.stringify(normalizeSiteConfig(config));
}

export function validateSiteConfigInput(config = {}) {
  const normalized = normalizeSiteConfig(config);

  if (!normalized.familyName) {
    throw new Error("Tên dòng họ không được để trống.");
  }

  if (!normalized.siteTitle) {
    throw new Error("Tiêu đề website không được để trống.");
  }

  const logoUrl = normalized.logoUrl;
  if (logoUrl && !/^(\/|https?:\/\/|data:image\/)/i.test(logoUrl)) {
    throw new Error("Logo phải là đường dẫn nội bộ, URL http/https hoặc data image.");
  }

  for (const field of SITE_THEME_BACKGROUND_FIELDS) {
    const rawUrl = config.themeBackgrounds?.[field];
    const normalizedUrl = normalized.themeBackgrounds[field];
    if (rawUrl && String(rawUrl).trim() && !normalizedUrl) {
      throw new Error("Hình nền phải là đường dẫn nội bộ, URL http/https hoặc data image.");
    }
  }

  const seo = normalized.seo;
  const rawCanonicalUrl = String(config.seo?.canonicalUrl || "").trim();
  if (rawCanonicalUrl && !/^https?:\/\//i.test(rawCanonicalUrl)) {
    throw new Error("Canonical URL SEO phải là URL http/https đầy đủ.");
  }

  for (const field of ["ogImage", "twitterImage"]) {
    const rawUrl = config.seo?.[field];
    const normalizedUrl = seo[field];
    if (rawUrl && String(rawUrl).trim() && !normalizedUrl) {
      throw new Error("Ảnh SEO/OGP phải là đường dẫn nội bộ, URL http/https hoặc data image.");
    }
  }

  for (const field of ["faviconUrl", "appleTouchIconUrl", "appIconUrl"]) {
    const rawUrl = config.appIdentity?.[field];
    const normalizedUrl = normalized.appIdentity[field];
    if (rawUrl && String(rawUrl).trim() && !normalizedUrl) {
      throw new Error("Icon/PWA phải là đường dẫn nội bộ, URL http/https hoặc data image.");
    }
  }

  for (const field of ["facebookUrl", "youtubeUrl"]) {
    const rawUrl = config.contact?.[field];
    const normalizedUrl = normalized.contact[field];
    if (rawUrl && String(rawUrl).trim() && !normalizedUrl) {
      throw new Error("Link liên hệ phải là URL http/https đầy đủ.");
    }
  }

  return normalized;
}

export function buildThemeCssVariables(config = {}) {
  const normalized = normalizeSiteConfig(config);
  const colors = normalized.themeColors;
  const backgrounds = normalized.themeBackgrounds;
  const tree = normalized.treeTheme;
  const appBackgroundLayer = buildCssImageLayer(backgrounds.app);
  return {
    "--color-brand-primary": colors.primary,
    "--color-brand-secondary": colors.secondary,
    "--color-brand-accent": colors.accent,
    "--heritage-red": colors.primary,
    "--heritage-green": colors.secondary,
    "--heritage-gold": colors.accent,
    "--cms-bg-app": [
      appBackgroundLayer,
      `radial-gradient(circle at top left, ${colors.cardBackground}, ${colors.appBackground})`
    ].filter(Boolean).join(", "),
    "--cms-bg-main": colors.appBackground,
    "--cms-bg-card": colors.cardBackground,
    "--cms-bg-card-hover": colors.cardHover,
    "--cms-border-card": colors.border,
    "--cms-text-primary": colors.textPrimary,
    "--cms-text-secondary": colors.textSecondary,
    "--cms-text-muted": colors.textMuted,
    "--cms-bg-input": colors.appBackground,
    "--bg-nav": `linear-gradient(180deg, ${colors.navbarTop}, ${colors.navbarBottom})`,
    "--theme-navbar-top": colors.navbarTop,
    "--theme-navbar-bottom": colors.navbarBottom,
    "--theme-home-background-image": buildCssImageLayer(backgrounds.home),
    "--theme-pages-background-image": buildCssImageLayer(backgrounds.pages),
    "--cms-generations-background": colors.generationsBackground,
    "--theme-generations-background-image": buildCssImageLayer(backgrounds.generations),
    "--theme-tree-background-image": buildCssImageLayer(backgrounds.tree),
    "--node-living-male-bg": tree.maleBackground,
    "--node-living-male-border": tree.maleBorder,
    "--node-living-female-bg": tree.femaleBackground,
    "--node-living-female-border": tree.femaleBorder,
    "--node-deceased-bg": tree.deceasedBackground,
    "--node-deceased-border": tree.deceasedBorder,
    "--node-deceased-text": tree.deceasedText,
    "--tree-connector-color": tree.connector,
    "--tree-spouse-connector-color": tree.spouseConnector,
    "--tree-selected-ring": tree.selectedRing,
    "--tree-search-highlight": tree.searchHighlight
  };
}

export function buildSeoMetadata(config = {}, options = {}) {
  const normalized = normalizeSiteConfig(config);
  const customSeo = normalized.seo || {};
  const familyName = normalized.familyName;
  const siteName = normalized.siteTitle || `Gia phả họ ${familyName}`;
  const shortName = normalized.shortName || "GP";
  const origin = String(options.origin || "").trim().replace(/\/+$/, "");
  const canonicalUrl = String(customSeo.canonicalUrl || options.canonicalUrl || (origin ? `${origin}/` : "")).trim();
  const imageUrl = resolvePublicUrl(customSeo.ogImage || options.imageUrl || "/web-app-manifest-512x512.png", origin);
  const twitterImageUrl = resolvePublicUrl(customSeo.twitterImage || customSeo.ogImage || options.imageUrl || "/web-app-manifest-512x512.png", origin);
  const description = `${siteName} là không gian lưu giữ phả hệ, thông tin thành viên, ngày giỗ, sự kiện và ký ức gia đình qua nhiều thế hệ.`;
  const socialDescription = `Lưu giữ phả hệ, thành viên, ngày giỗ và ký ức gia đình của dòng họ ${familyName}.`;
  const keywords = [
    `gia phả họ ${familyName}`,
    "gia phả",
    "cây gia phả",
    "phả hệ",
    `dòng họ ${familyName}`,
    "ngày giỗ",
    "lịch giỗ",
    "thành viên gia đình"
  ].join(", ");

  return {
    title: customSeo.title || `${siteName} - Lưu giữ cội nguồn dòng họ`,
    description: customSeo.description || description,
    keywords: customSeo.keywords || keywords,
    author: customSeo.author || siteName,
    applicationName: customSeo.applicationName || siteName,
    appleTitle: customSeo.appleTitle || shortName,
    ogSiteName: customSeo.ogSiteName || siteName,
    ogTitle: customSeo.ogTitle || siteName,
    ogDescription: customSeo.ogDescription || socialDescription,
    ogImage: imageUrl,
    twitterTitle: customSeo.twitterTitle || customSeo.ogTitle || siteName,
    twitterDescription: customSeo.twitterDescription || customSeo.ogDescription || `Lưu giữ cội nguồn và kết nối các thế hệ trong dòng họ ${familyName}.`,
    twitterImage: twitterImageUrl,
    canonicalUrl
  };
}

function resolvePublicUrl(value, origin = "") {
  const url = String(value || "").trim();
  if (!url) return "";
  if (/^https?:\/\//i.test(url) || /^data:image\//i.test(url)) return url;
  if (url.startsWith("/") && origin) return `${origin}${url}`;
  return url;
}

function buildCssImageLayer(url) {
  if (!url) return "";
  return `linear-gradient(rgba(0, 0, 0, 0.34), rgba(0, 0, 0, 0.34)), url("${url.replaceAll('"', "%22")}") center / cover no-repeat`;
}
