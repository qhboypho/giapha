import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { buildSeoMetadata } from "../src/utils/siteConfigUtils.js";

const DEFAULT_PASSWORDS = {
  admin: "pbkdf2:831d51423ca7c9f63e35ffadc5e6a778:31bc8b0f51a53df1f077ae3b274d3b101dfcc690899791882ba4930b1e66d34f",
  editor: "pbkdf2:e48d6c0711a74d434586885a3a5aaef8:7022bcc4828ef38f3911c6a6b445a69d4903a3217ac47a2b387fb64ee8312877",
  member: "pbkdf2:e41bf6e79f74ab31893ec1d32e9984a7:224470f350a3d28e25cc1f193d06e81a800d25a881594d8b886d72446350df13"
};

function sqlString(value) {
  return `'${String(value ?? "").replaceAll("'", "''")}'`;
}

function initialsFromFamilyName(familyName) {
  const words = String(familyName || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const initials = words.slice(0, 2).map((word) => word[0]?.toUpperCase()).join("");
  return initials || "GP";
}

function buildSiteConfig(familyName) {
  return {
    familyName,
    familyLabel: "Gia Phả Họ",
    siteTitle: `Gia phả họ ${familyName}`,
    shortName: initialsFromFamilyName(familyName),
    logoUrl: "/tranconglogo.png",
    heroTitle: "Lưu giữ cội nguồn",
    heroSubtitle: "Kết nối muôn đời con cháu",
    heroDescription: "Đây là dữ liệu mẫu để bắt đầu dựng cây gia phả. Quản trị viên có thể sửa nội dung, đổi logo và nhập dữ liệu thật trong phần quản trị.",
    primaryCtaLabel: "Khám phá gia phả",
    secondaryCtaLabel: "Tìm người thân",
    mainTreeTitle: "Cây gia phả mẫu",
    loginDescription: "Hệ thống yêu cầu đăng nhập để xem thông tin chi tiết gia phả.",
    footerQuote: "Cội nguồn là nơi bắt đầu - Ký ức là sợi dây - Tương lai là nơi tiếp nối.",
    footerMessage: "Dữ liệu đang ở trạng thái mẫu. Hãy cập nhật thông tin chính thức của dòng họ trước khi công bố.",
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
}

function buildCustomerSeo(familyName, slug) {
  return buildSeoMetadata(buildSiteConfig(familyName), {
    origin: `https://giapha-${slug}.pages.dev`
  });
}

function escapeHtmlAttribute(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function replaceHeadContent(html, selectorPattern, nextValue) {
  return html.replace(selectorPattern, (match) => (
    match.replace(/content="[^"]*"/, `content="${escapeHtmlAttribute(nextValue)}"`)
  ));
}

function sanitizeIndexHtml(root, familyName, slug) {
  const indexPath = resolve(root, "index.html");
  if (!existsSync(indexPath)) return;

  const seo = buildCustomerSeo(familyName, slug);
  let html = readFileSync(indexPath, "utf8");
  html = html.replace(/<title>.*?<\/title>/s, `<title>${escapeHtmlAttribute(seo.title)}</title>`);
  html = replaceHeadContent(html, /<meta name="description" content="[^"]*" \/>/, seo.description);
  html = replaceHeadContent(html, /<meta name="keywords" content="[^"]*" \/>/, seo.keywords);
  html = replaceHeadContent(html, /<meta name="author" content="[^"]*" \/>/, seo.author);
  html = replaceHeadContent(html, /<meta name="application-name" content="[^"]*" \/>/, seo.applicationName);
  html = replaceHeadContent(html, /<meta name="apple-mobile-web-app-title" content="[^"]*" \/>/, seo.appleTitle);
  html = replaceHeadContent(html, /<meta property="og:site_name" content="[^"]*" \/>/, seo.ogSiteName);
  html = replaceHeadContent(html, /<meta property="og:title" content="[^"]*" \/>/, seo.ogTitle);
  html = replaceHeadContent(html, /<meta property="og:description" content="[^"]*" \/>/, seo.ogDescription);
  html = replaceHeadContent(html, /<meta name="twitter:title" content="[^"]*" \/>/, seo.twitterTitle);
  html = replaceHeadContent(html, /<meta name="twitter:description" content="[^"]*" \/>/, seo.twitterDescription);
  html = html.replace(/<link rel="canonical" href="[^"]*" \/>/, `<link rel="canonical" href="${escapeHtmlAttribute(seo.canonicalUrl)}" />`);
  writeFileSync(indexPath, html, "utf8");
}

function sanitizeManifest(root, familyName) {
  const manifestPath = resolve(root, "public", "site.webmanifest");
  if (!existsSync(manifestPath)) return;

  const siteConfig = buildSiteConfig(familyName);
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  manifest.name = siteConfig.siteTitle;
  manifest.short_name = siteConfig.shortName;
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
}

function buildSampleMembers(familyName) {
  return [
    ["sample_g1_1", `Cụ ông ${familyName} An`, "nam", 1, 1, null, null, "Quê gốc", "", "Làm nông", "Nhân vật mẫu đời thứ nhất.", "", "", "[\"sample_g1_2\"]", null, null],
    ["sample_g1_2", `Cụ bà ${familyName} Bình`, "nu", 1, 1, null, null, "Quê gốc", "", "Làm nông", "Phu nhân mẫu đời thứ nhất.", "", "", "[\"sample_g1_1\"]", null, null],
    ["sample_g2_1", `${familyName} Chính`, "nam", 2, 0, null, null, "Quê gốc", "", "", "Người con mẫu thuộc đời thứ hai.", "", "", "[\"sample_g2_2\"]", "sample_g1_1", "sample_g1_2"],
    ["sample_g2_2", `Phu nhân ${familyName} Chính`, "nu", 2, 0, null, null, "", "", "", "Nhân thân mẫu để minh họa quan hệ vợ chồng.", "", "", "[\"sample_g2_1\"]", null, null],
    ["sample_g2_3", `${familyName} Dung`, "nu", 2, 0, null, null, "Quê gốc", "", "", "Người con gái mẫu thuộc đời thứ hai.", "", "", "[]", "sample_g1_1", "sample_g1_2"],
    ["sample_g3_1", `${familyName} Minh`, "nam", 3, 0, null, null, "", "", "", "Cháu mẫu thuộc đời thứ ba.", "", "", "[]", "sample_g2_1", "sample_g2_2"]
  ];
}

function row(values) {
  return `(${values.map((value) => value === null ? "NULL" : sqlString(value)).join(", ")})`;
}

function buildSeedSql(familyName) {
  const siteConfig = JSON.stringify(buildSiteConfig(familyName));
  const members = buildSampleMembers(familyName);

  return `-- Migration 0002: Seed sample customer data

DELETE FROM members;
DELETE FROM users;
DELETE FROM settings;

INSERT INTO users (username, password, role, fullName) VALUES
('admin', '${DEFAULT_PASSWORDS.admin}', 'admin', 'Quản trị viên'),
('editor', '${DEFAULT_PASSWORDS.editor}', 'editor', 'Biên tập viên'),
('member', '${DEFAULT_PASSWORDS.member}', 'member', 'Thành viên Gia tộc');

INSERT INTO settings (key, value) VALUES
('private_mode', 'true'),
('site_config', ${sqlString(siteConfig)});

INSERT INTO members (id, name, gender, generation, isDeceased, birthDate, deathDate, birthPlace, restingPlace, occupation, bio, phone, address, spouseIds, fatherId, motherId) VALUES
${members.map(row).join(",\n")};
`;
}

function buildFeaturedSql() {
  return `-- Migration 0003: Add curated featured member flag

ALTER TABLE members ADD COLUMN isFeatured INTEGER NOT NULL DEFAULT 0;

UPDATE members
SET isFeatured = 1
WHERE id IN ('sample_g1_1', 'sample_g1_2', 'sample_g2_1');
`;
}

function buildHistorySql(familyName) {
  const values = [
    ["history_sample_origin", "Đời 1", `Khởi nguồn họ ${familyName}`, "Mốc lịch sử mẫu để ghi lại quê gốc, thủy tổ và câu chuyện mở đầu dòng họ.", "", "[\"sample_g1_1\",\"sample_g1_2\"]", 1, 10],
    ["history_sample_branch", "Đời 2", "Hình thành các nhánh", "Mốc mẫu cho giai đoạn con cháu phát triển thành các chi nhánh trong gia phả.", "", "[\"sample_g2_1\",\"sample_g2_3\"]", 1, 20],
    ["history_sample_today", "Hiện nay", "Cập nhật dữ liệu gia phả", "Quản trị viên thay nội dung mẫu này bằng lịch sử thật của dòng họ.", "", "[]", 1, 30]
  ];

  return `-- Migration 0005: Editable family history milestones

CREATE TABLE IF NOT EXISTS family_history_events (
  id TEXT PRIMARY KEY,
  eventDate TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  relatedBranch TEXT,
  relatedMemberIds TEXT,
  isHomepageVisible INTEGER NOT NULL DEFAULT 1,
  sortOrder INTEGER NOT NULL DEFAULT 0,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO family_history_events (
  id, eventDate, title, description, relatedBranch, relatedMemberIds, isHomepageVisible, sortOrder
) VALUES
${values.map(row).join(",\n")};
`;
}

function buildSiteConfigMigrationSql(familyName) {
  const siteConfig = JSON.stringify(buildSiteConfig(familyName));
  return `-- Migration 0008: Add CMS site configuration setting

INSERT INTO settings (key, value)
SELECT
  'site_config',
  ${sqlString(siteConfig)}
WHERE NOT EXISTS (
  SELECT 1 FROM settings WHERE key = 'site_config'
);
`;
}

export function sanitizeCustomerProject(targetDir, options = {}) {
  const familyName = String(options.familyName || "Khách mới").trim();
  const slug = String(options.slug || "").trim() || initialsFromFamilyName(familyName).toLowerCase();
  const setupWizard = options.setupWizard !== false;
  const root = resolve(targetDir);

  writeFileSync(resolve(root, "migrations", "0002_seed.sql"), buildSeedSql(familyName), "utf8");
  writeFileSync(resolve(root, "migrations", "0003_featured_members.sql"), buildFeaturedSql(), "utf8");
  writeFileSync(resolve(root, "migrations", "0005_family_history_events.sql"), buildHistorySql(familyName), "utf8");
  writeFileSync(resolve(root, "migrations", "0008_site_config_setting.sql"), buildSiteConfigMigrationSql(familyName), "utf8");
  writeFileSync(resolve(root, "src", "config", "cmsRuntime.js"), `export const ENABLE_SETUP_WIZARD = ${setupWizard ? "true" : "false"};\n`, "utf8");
  sanitizeIndexHtml(root, familyName, slug);
  sanitizeManifest(root, familyName);

  const setupGuidePath = resolve(root, "public", "cms-setup-guide.html");
  if (!setupWizard && existsSync(setupGuidePath)) {
    rmSync(setupGuidePath, { force: true });
  }
}
