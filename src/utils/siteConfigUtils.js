export const SITE_CONFIG_SETTING_KEY = "site_config";

export const DEFAULT_SITE_CONFIG = {
  familyName: "Trần Công",
  familyLabel: "Gia Phả Họ",
  siteTitle: "Gia phả họ Trần Công",
  shortName: "TC",
  logoUrl: "/tranconglogo.png",
  heroSeparatorUrl: "/tran_cong_separator_pattern_vector_transparent.png",
  heroLotusUrl: "/pattern-sen.png",
  heroTitle: "Lưu giữ cội nguồn",
  heroSubtitle: "Kết nối muôn đời con cháu",
  heroDescription: "Gia phả là sợi dây thiêng liêng kết nối quá khứ, hiện tại và tương lai. Cùng nhau gìn giữ cội nguồn, vun đắp truyền thống cho muôn đời con cháu.",
  primaryCtaLabel: "Xem gia phả",
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
  navbarBackground: {
    pattern: "diagonal",
    patternOpacity: 45,
    glowOpacity: 22,
    ornamentOpacity: 24
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
    mobileTreeSlidesMode: "auto",
    mobileTreeSlideRootIds: [],
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
  },
  security: {
    turnstileEnabled: false,
    turnstileSiteKey: "",
    turnstileTheme: "auto",
    turnstileSize: "normal"
  },
  navigation: {
    treeLabel: "Cây gia phả",
    generationsLabel: "Các đời",
    anniversaryLabel: "Lịch giỗ",
    membersLabel: "Thành viên",
    featuredLabel: "Người tiêu biểu",
    historyLabel: "Lịch sử dòng họ",
    aboutLabel: "Giới thiệu"
  },
  anniversary: {
    calendarMode: "lunar",
    pageTitle: "Lịch giỗ",
    pageDescription: "Lịch giỗ các thành viên trong dòng họ tính theo lịch âm.",
    summaryLabel: "ngày giỗ có dữ liệu",
    upcomingWindowDays: 30,
    showSolarDate: true,
    emptyTitle: "Chưa có ngày giỗ",
    emptyDescription: "Chỉ những người đã nhập ngày mất mới xuất hiện trong lịch giỗ."
  },
  memberFields: {
    phone: true,
    address: true,
    occupation: true,
    restingPlace: true
  },
  sampleData: {
    generationCount: 3,
    rootMaleName: "Cụ ông {familyName} An",
    rootFemaleName: "Cụ bà {familyName} Bình",
    secondGenerationName: "{familyName} Chính",
    thirdGenerationName: "{familyName} Minh",
    historyOriginTitle: "Khởi nguồn họ {familyName}",
    historyBranchTitle: "Hình thành các nhánh",
    historyTodayTitle: "Cập nhật dữ liệu gia phả"
  },
  aboutPage: {
    enabled: false,
    title: "Giới thiệu dòng họ",
    subtitle: "Không gian lưu giữ lịch sử, truyền thống và câu chuyện của dòng họ.",
    description: "Trang giới thiệu có thể dùng để trình bày quê gốc, thủy tổ, nhà thờ họ, truyền thống, quy ước và thông tin liên hệ khi triển khai CMS cho từng dòng họ.",
    origin: "",
    tradition: "",
    representativeText: "",
    imageUrl: "",
    showContact: true
  }
};

const SITE_CONFIG_TEXT_LIMITS = {
  familyName: 80,
  familyLabel: 80,
  siteTitle: 120,
  shortName: 16,
  logoUrl: 500,
  heroSeparatorUrl: 500,
  heroLotusUrl: 500,
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
export const SITE_NAVBAR_BACKGROUND_FIELDS = Object.keys(DEFAULT_SITE_CONFIG.navbarBackground);
export const SITE_SEO_FIELDS = Object.keys(DEFAULT_SITE_CONFIG.seo);
export const SITE_APP_IDENTITY_FIELDS = Object.keys(DEFAULT_SITE_CONFIG.appIdentity);
export const SITE_CONTACT_FIELDS = Object.keys(DEFAULT_SITE_CONFIG.contact);
export const SITE_HOMEPAGE_FIELDS = Object.keys(DEFAULT_SITE_CONFIG.homepage);
export const SITE_NOTIFICATION_FIELDS = Object.keys(DEFAULT_SITE_CONFIG.notifications);
export const SITE_PRIVACY_DISPLAY_FIELDS = Object.keys(DEFAULT_SITE_CONFIG.privacyDisplay);
export const SITE_SECURITY_FIELDS = Object.keys(DEFAULT_SITE_CONFIG.security);
export const SITE_NAVIGATION_FIELDS = Object.keys(DEFAULT_SITE_CONFIG.navigation);
export const SITE_ANNIVERSARY_FIELDS = Object.keys(DEFAULT_SITE_CONFIG.anniversary);
export const SITE_MEMBER_FIELD_FIELDS = Object.keys(DEFAULT_SITE_CONFIG.memberFields);
export const SITE_SAMPLE_DATA_FIELDS = Object.keys(DEFAULT_SITE_CONFIG.sampleData);
export const SITE_ABOUT_PAGE_FIELDS = Object.keys(DEFAULT_SITE_CONFIG.aboutPage);
export const SITE_CONFIG_FIELDS = Object.keys(DEFAULT_SITE_CONFIG).filter((field) => (
  ![
    "themeColors",
    "themeBackgrounds",
    "treeTheme",
    "navbarBackground",
    "seo",
    "appIdentity",
    "contact",
    "homepage",
    "notifications",
    "privacyDisplay",
    "security",
    "navigation",
    "anniversary",
    "memberFields",
    "sampleData",
    "aboutPage"
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
const NAVIGATION_TEXT_LIMITS = {
  treeLabel: 40,
  generationsLabel: 40,
  anniversaryLabel: 40,
  membersLabel: 40,
  featuredLabel: 60,
  historyLabel: 80,
  aboutLabel: 60
};
const ANNIVERSARY_TEXT_LIMITS = {
  calendarMode: 20,
  pageTitle: 100,
  pageDescription: 300,
  summaryLabel: 100,
  upcomingWindowDays: 10,
  showSolarDate: 10,
  emptyTitle: 100,
  emptyDescription: 240
};
const SAMPLE_DATA_TEXT_LIMITS = {
  generationCount: 10,
  rootMaleName: 120,
  rootFemaleName: 120,
  secondGenerationName: 120,
  thirdGenerationName: 120,
  historyOriginTitle: 140,
  historyBranchTitle: 140,
  historyTodayTitle: 140
};
const ABOUT_PAGE_TEXT_LIMITS = {
  enabled: 10,
  title: 120,
  subtitle: 200,
  description: 800,
  origin: 800,
  tradition: 800,
  representativeText: 800,
  imageUrl: 800,
  showContact: 10
};
const NAVBAR_BACKGROUND_PATTERNS = new Set(["none", "diagonal", "fineDiagonal", "dots", "grid", "silk"]);
const SECURITY_TEXT_LIMITS = {
  turnstileEnabled: 10,
  turnstileSiteKey: 200,
  turnstileTheme: 20,
  turnstileSize: 20
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

  normalized.heroSeparatorUrl = normalizeSeoUrl(config.heroSeparatorUrl, DEFAULT_SITE_CONFIG.heroSeparatorUrl);
  normalized.heroLotusUrl = normalizeSeoUrl(config.heroLotusUrl, DEFAULT_SITE_CONFIG.heroLotusUrl);
  normalized.themeColors = normalizeThemeColors(config.themeColors);
  normalized.themeBackgrounds = normalizeThemeBackgrounds(config.themeBackgrounds);
  normalized.treeTheme = normalizeTreeTheme(config.treeTheme);
  normalized.navbarBackground = normalizeNavbarBackgroundConfig(config.navbarBackground);
  normalized.seo = normalizeSeoConfig(config.seo);
  normalized.appIdentity = normalizeAppIdentity(config.appIdentity);
  normalized.contact = normalizeContactConfig(config.contact);
  normalized.homepage = normalizeHomepageConfig(config.homepage);
  normalized.notifications = normalizeNotificationConfig(config.notifications);
  normalized.privacyDisplay = normalizePrivacyDisplayConfig(config.privacyDisplay);
  normalized.security = normalizeSecurityConfig(config.security);
  normalized.navigation = normalizeNavigationConfig(config.navigation);
  normalized.anniversary = normalizeAnniversaryConfig(config.anniversary);
  normalized.memberFields = normalizeMemberFieldsConfig(config.memberFields);
  normalized.sampleData = normalizeSampleDataConfig(config.sampleData);
  normalized.aboutPage = normalizeAboutPageConfig(config.aboutPage);
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

export function normalizeNavbarBackgroundConfig(navbarBackground = {}) {
  const source = navbarBackground && typeof navbarBackground === "object" ? navbarBackground : {};
  const pattern = normalizeString(source.pattern, DEFAULT_SITE_CONFIG.navbarBackground.pattern, 40);
  return {
    pattern: NAVBAR_BACKGROUND_PATTERNS.has(pattern) ? pattern : DEFAULT_SITE_CONFIG.navbarBackground.pattern,
    patternOpacity: clampNumber(source.patternOpacity, DEFAULT_SITE_CONFIG.navbarBackground.patternOpacity, 0, 100),
    glowOpacity: clampNumber(source.glowOpacity, DEFAULT_SITE_CONFIG.navbarBackground.glowOpacity, 0, 100),
    ornamentOpacity: clampNumber(source.ornamentOpacity, DEFAULT_SITE_CONFIG.navbarBackground.ornamentOpacity, 0, 100)
  };
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
  const mobileTreeSlideRootIds = Array.isArray(source.mobileTreeSlideRootIds)
    ? Array.from(new Set(source.mobileTreeSlideRootIds.map((id) => normalizeString(id, "", 120)).filter(Boolean))).slice(0, 24)
    : [];
  return {
    showStats: source.showStats !== false,
    showFeatures: source.showFeatures !== false,
    showFeatured: source.showFeatured !== false,
    showAnniversaries: source.showAnniversaries !== false,
    showHistory: source.showHistory !== false,
    mobileTreeSlidesMode: source.mobileTreeSlidesMode === "manual" ? "manual" : "auto",
    mobileTreeSlideRootIds,
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

export function normalizeSecurityConfig(security = {}) {
  const source = security && typeof security === "object" ? security : {};
  const theme = normalizeString(
    source.turnstileTheme,
    DEFAULT_SITE_CONFIG.security.turnstileTheme,
    SECURITY_TEXT_LIMITS.turnstileTheme
  );
  const size = normalizeString(
    source.turnstileSize,
    DEFAULT_SITE_CONFIG.security.turnstileSize,
    SECURITY_TEXT_LIMITS.turnstileSize
  );

  return {
    turnstileEnabled: Boolean(source.turnstileEnabled),
    turnstileSiteKey: normalizeString(
      source.turnstileSiteKey,
      DEFAULT_SITE_CONFIG.security.turnstileSiteKey,
      SECURITY_TEXT_LIMITS.turnstileSiteKey
    ),
    turnstileTheme: ["auto", "light", "dark"].includes(theme)
      ? theme
      : DEFAULT_SITE_CONFIG.security.turnstileTheme,
    turnstileSize: ["normal", "compact", "flexible"].includes(size)
      ? size
      : DEFAULT_SITE_CONFIG.security.turnstileSize
  };
}

export function normalizeNavigationConfig(navigation = {}) {
  const source = navigation && typeof navigation === "object" ? navigation : {};
  return SITE_NAVIGATION_FIELDS.reduce((acc, field) => {
    acc[field] = normalizeString(
      source[field],
      DEFAULT_SITE_CONFIG.navigation[field],
      NAVIGATION_TEXT_LIMITS[field]
    );
    return acc;
  }, {});
}

export function normalizeAnniversaryConfig(anniversary = {}) {
  const source = anniversary && typeof anniversary === "object" ? anniversary : {};
  const mode = normalizeString(source.calendarMode, DEFAULT_SITE_CONFIG.anniversary.calendarMode, 20);
  return {
    calendarMode: ["lunar", "solar"].includes(mode) ? mode : DEFAULT_SITE_CONFIG.anniversary.calendarMode,
    pageTitle: normalizeString(source.pageTitle, DEFAULT_SITE_CONFIG.anniversary.pageTitle, ANNIVERSARY_TEXT_LIMITS.pageTitle),
    pageDescription: normalizeString(source.pageDescription, DEFAULT_SITE_CONFIG.anniversary.pageDescription, ANNIVERSARY_TEXT_LIMITS.pageDescription),
    summaryLabel: normalizeString(source.summaryLabel, DEFAULT_SITE_CONFIG.anniversary.summaryLabel, ANNIVERSARY_TEXT_LIMITS.summaryLabel),
    upcomingWindowDays: clampNumber(source.upcomingWindowDays, DEFAULT_SITE_CONFIG.anniversary.upcomingWindowDays, 1, 365),
    showSolarDate: source.showSolarDate !== false,
    emptyTitle: normalizeString(source.emptyTitle, DEFAULT_SITE_CONFIG.anniversary.emptyTitle, ANNIVERSARY_TEXT_LIMITS.emptyTitle),
    emptyDescription: normalizeString(source.emptyDescription, DEFAULT_SITE_CONFIG.anniversary.emptyDescription, ANNIVERSARY_TEXT_LIMITS.emptyDescription)
  };
}

export function normalizeMemberFieldsConfig(fields = {}) {
  const source = fields && typeof fields === "object" ? fields : {};
  return SITE_MEMBER_FIELD_FIELDS.reduce((acc, field) => {
    acc[field] = source[field] !== false;
    return acc;
  }, {});
}

export function normalizeSampleDataConfig(sampleData = {}) {
  const source = sampleData && typeof sampleData === "object" ? sampleData : {};
  return {
    generationCount: clampNumber(source.generationCount, DEFAULT_SITE_CONFIG.sampleData.generationCount, 1, 6),
    rootMaleName: normalizeString(source.rootMaleName, DEFAULT_SITE_CONFIG.sampleData.rootMaleName, SAMPLE_DATA_TEXT_LIMITS.rootMaleName),
    rootFemaleName: normalizeString(source.rootFemaleName, DEFAULT_SITE_CONFIG.sampleData.rootFemaleName, SAMPLE_DATA_TEXT_LIMITS.rootFemaleName),
    secondGenerationName: normalizeString(source.secondGenerationName, DEFAULT_SITE_CONFIG.sampleData.secondGenerationName, SAMPLE_DATA_TEXT_LIMITS.secondGenerationName),
    thirdGenerationName: normalizeString(source.thirdGenerationName, DEFAULT_SITE_CONFIG.sampleData.thirdGenerationName, SAMPLE_DATA_TEXT_LIMITS.thirdGenerationName),
    historyOriginTitle: normalizeString(source.historyOriginTitle, DEFAULT_SITE_CONFIG.sampleData.historyOriginTitle, SAMPLE_DATA_TEXT_LIMITS.historyOriginTitle),
    historyBranchTitle: normalizeString(source.historyBranchTitle, DEFAULT_SITE_CONFIG.sampleData.historyBranchTitle, SAMPLE_DATA_TEXT_LIMITS.historyBranchTitle),
    historyTodayTitle: normalizeString(source.historyTodayTitle, DEFAULT_SITE_CONFIG.sampleData.historyTodayTitle, SAMPLE_DATA_TEXT_LIMITS.historyTodayTitle)
  };
}

export function normalizeAboutPageConfig(aboutPage = {}) {
  const source = aboutPage && typeof aboutPage === "object" ? aboutPage : {};
  return {
    enabled: Boolean(source.enabled),
    title: normalizeString(source.title, DEFAULT_SITE_CONFIG.aboutPage.title, ABOUT_PAGE_TEXT_LIMITS.title),
    subtitle: normalizeString(source.subtitle, DEFAULT_SITE_CONFIG.aboutPage.subtitle, ABOUT_PAGE_TEXT_LIMITS.subtitle),
    description: normalizeString(source.description, DEFAULT_SITE_CONFIG.aboutPage.description, ABOUT_PAGE_TEXT_LIMITS.description),
    origin: normalizeString(source.origin, DEFAULT_SITE_CONFIG.aboutPage.origin, ABOUT_PAGE_TEXT_LIMITS.origin),
    tradition: normalizeString(source.tradition, DEFAULT_SITE_CONFIG.aboutPage.tradition, ABOUT_PAGE_TEXT_LIMITS.tradition),
    representativeText: normalizeString(source.representativeText, DEFAULT_SITE_CONFIG.aboutPage.representativeText, ABOUT_PAGE_TEXT_LIMITS.representativeText),
    imageUrl: normalizeSeoUrl(source.imageUrl, DEFAULT_SITE_CONFIG.aboutPage.imageUrl),
    showContact: source.showContact !== false
  };
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

function formatOpacity(value) {
  return (clampNumber(value, 0, 0, 100) / 100).toFixed(2);
}

function rgbaFromHex(hex, opacity = 1) {
  const normalized = HEX_COLOR_PATTERN.test(hex) ? hex.slice(1) : "ffffff";
  const red = Number.parseInt(normalized.slice(0, 2), 16);
  const green = Number.parseInt(normalized.slice(2, 4), 16);
  const blue = Number.parseInt(normalized.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${opacity})`;
}

function buildNavbarBackgroundLayer(colors, navbarBackground) {
  const base = `linear-gradient(180deg, ${colors.navbarTop}, ${colors.navbarBottom})`;
  const patternOpacity = Number(formatOpacity(navbarBackground.patternOpacity));
  const glowOpacity = Number(formatOpacity(navbarBackground.glowOpacity));
  const accent = rgbaFromHex(colors.accent, patternOpacity);
  const accentSoft = rgbaFromHex(colors.accent, Math.max(0, patternOpacity * 0.65));
  const glow = rgbaFromHex(colors.accent, glowOpacity);
  const glowSoft = rgbaFromHex(colors.accent, Math.max(0, glowOpacity * 0.7));

  const glowLayers = glowOpacity > 0
    ? [
      `radial-gradient(circle at 28% 110%, ${glow}, transparent 17%)`,
      `radial-gradient(circle at 70% -20%, ${glowSoft}, transparent 15%)`
    ]
    : [];

  const patternLayers = {
    none: [],
    diagonal: [
      `linear-gradient(45deg, ${accent} 25%, transparent 25% 50%, ${accent} 50% 75%, transparent 75%) 0 0 / 26px 26px`
    ],
    fineDiagonal: [
      `repeating-linear-gradient(45deg, ${accent} 0 2px, transparent 2px 12px)`
    ],
    dots: [
      `radial-gradient(circle, ${accent} 0 1.5px, transparent 2.5px) 0 0 / 22px 22px`
    ],
    grid: [
      `linear-gradient(${accentSoft} 1px, transparent 1px) 0 0 / 26px 26px`,
      `linear-gradient(90deg, ${accentSoft} 1px, transparent 1px) 0 0 / 26px 26px`
    ],
    silk: [
      `linear-gradient(115deg, transparent 0 18%, ${accentSoft} 18% 19%, transparent 19% 42%, ${accent} 42% 43%, transparent 43% 100%) 0 0 / 90px 90px`,
      `radial-gradient(ellipse at 50% -20%, ${glowSoft}, transparent 42%)`
    ]
  };

  return [
    ...glowLayers,
    ...(patternLayers[navbarBackground.pattern] || patternLayers.diagonal),
    base
  ].join(", ");
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

  const rawHeroSeparatorUrl = String(config.heroSeparatorUrl || "").trim();
  if (rawHeroSeparatorUrl && !/^(\/|https?:\/\/|data:image\/)/i.test(rawHeroSeparatorUrl)) {
    throw new Error("Ảnh ngăn cách hero phải là đường dẫn nội bộ, URL http/https hoặc data image.");
  }

  const rawHeroLotusUrl = String(config.heroLotusUrl || "").trim();
  if (rawHeroLotusUrl && !/^(\/|https?:\/\/|data:image\/)/i.test(rawHeroLotusUrl)) {
    throw new Error("Ảnh bông sen hero phải là đường dẫn nội bộ, URL http/https hoặc data image.");
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

  const rawAboutImage = config.aboutPage?.imageUrl;
  const normalizedAboutImage = normalized.aboutPage.imageUrl;
  if (rawAboutImage && String(rawAboutImage).trim() && !normalizedAboutImage) {
    throw new Error("Ảnh trang giới thiệu phải là đường dẫn nội bộ, URL http/https hoặc data image.");
  }

  const rawTurnstileSiteKey = String(config.security?.turnstileSiteKey || "").trim();
  if (normalized.security.turnstileEnabled && !normalized.security.turnstileSiteKey) {
    throw new Error("Cần nhập Turnstile Site Key khi bật bảo vệ đăng nhập.");
  }
  if (rawTurnstileSiteKey && !/^[0-9A-Za-z_-]{8,200}$/.test(rawTurnstileSiteKey)) {
    throw new Error("Turnstile Site Key không hợp lệ.");
  }

  return normalized;
}

export function buildThemeCssVariables(config = {}) {
  const normalized = normalizeSiteConfig(config);
  const colors = normalized.themeColors;
  const backgrounds = normalized.themeBackgrounds;
  const tree = normalized.treeTheme;
  const navbarBackground = normalized.navbarBackground;
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
    "--theme-navbar-background": buildNavbarBackgroundLayer(colors, navbarBackground),
    "--theme-navbar-ornament-opacity": formatOpacity(navbarBackground.ornamentOpacity),
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
