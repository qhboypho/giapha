import { existsSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

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
    footerMessage: "Dữ liệu đang ở trạng thái mẫu. Hãy cập nhật thông tin chính thức của dòng họ trước khi công bố."
  };
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
  const root = resolve(targetDir);

  writeFileSync(resolve(root, "migrations", "0002_seed.sql"), buildSeedSql(familyName), "utf8");
  writeFileSync(resolve(root, "migrations", "0003_featured_members.sql"), buildFeaturedSql(), "utf8");
  writeFileSync(resolve(root, "migrations", "0005_family_history_events.sql"), buildHistorySql(familyName), "utf8");
  writeFileSync(resolve(root, "migrations", "0008_site_config_setting.sql"), buildSiteConfigMigrationSql(familyName), "utf8");
  writeFileSync(resolve(root, "src", "config", "cmsRuntime.js"), "export const ENABLE_SETUP_WIZARD = false;\n", "utf8");

  const setupGuidePath = resolve(root, "public", "cms-setup-guide.html");
  if (existsSync(setupGuidePath)) {
    rmSync(setupGuidePath, { force: true });
  }
}
