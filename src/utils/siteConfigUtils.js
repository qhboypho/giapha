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
export const SITE_CONFIG_FIELDS = Object.keys(DEFAULT_SITE_CONFIG).filter((field) => (
  !["themeColors", "themeBackgrounds", "treeTheme"].includes(field)
));
const HEX_COLOR_PATTERN = /^#[0-9a-f]{6}$/i;
const BACKGROUND_URL_LIMIT = 800;

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

export function normalizeBackgroundUrl(value, fallback = "") {
  const url = String(value ?? "").trim().slice(0, BACKGROUND_URL_LIMIT);
  if (!url) return fallback || "";
  return /^(\/|https?:\/\/|data:image\/)/i.test(url) ? url : (fallback || "");
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
    "--bg-app": [
      appBackgroundLayer,
      `radial-gradient(circle at top left, ${colors.cardBackground}, ${colors.appBackground})`
    ].filter(Boolean).join(", "),
    "--bg-main": colors.appBackground,
    "--bg-card": colors.cardBackground,
    "--bg-card-hover": colors.cardHover,
    "--border-card": colors.border,
    "--text-primary": colors.textPrimary,
    "--text-secondary": colors.textSecondary,
    "--text-muted": colors.textMuted,
    "--bg-input": colors.appBackground,
    "--bg-nav": `linear-gradient(180deg, ${colors.navbarTop}, ${colors.navbarBottom})`,
    "--theme-navbar-top": colors.navbarTop,
    "--theme-navbar-bottom": colors.navbarBottom,
    "--theme-home-background-image": buildCssImageLayer(backgrounds.home),
    "--theme-pages-background-image": buildCssImageLayer(backgrounds.pages),
    "--theme-generations-background": colors.generationsBackground,
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

function buildCssImageLayer(url) {
  if (!url) return "";
  return `linear-gradient(rgba(0, 0, 0, 0.34), rgba(0, 0, 0, 0.34)), url("${url.replaceAll('"', "%22")}") center / cover no-repeat`;
}
