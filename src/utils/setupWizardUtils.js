export const SETUP_WIZARD_STORAGE_KEY = "giapha_tc_setup_wizard_done";

export const SETUP_WIZARD_STEPS = [
  {
    id: "site",
    title: "Thông tin website",
    description: "Tên dòng họ, tiêu đề, logo và nội dung trang chủ."
  },
  {
    id: "seo",
    title: "Cài đặt SEO",
    description: "Meta tag, canonical URL và ảnh OGP khi chia sẻ."
  },
  {
    id: "theme",
    title: "Giao diện",
    description: "Tùy chỉnh màu thương hiệu, nền, thẻ và thanh điều hướng."
  },
  {
    id: "security",
    title: "Bảo mật và AI",
    description: "Chế độ riêng tư và API key AI nếu muốn nhập liệu từ ảnh/PDF."
  },
  {
    id: "data",
    title: "Nhập dữ liệu",
    description: "Chọn CMS package, JSON cây, media package hoặc AI."
  },
  {
    id: "review",
    title: "Kiểm tra",
    description: "Xem nhanh trạng thái trước khi hoàn tất setup."
  }
];

export function getSetupProgress({ siteConfig = {}, aiConfig = {}, members = [] } = {}) {
  const hasSiteName = Boolean(String(siteConfig.familyName || "").trim());
  const hasSiteTitle = Boolean(String(siteConfig.siteTitle || "").trim());
  const hasMembers = Array.isArray(members) && members.length > 0;
  const hasAiConfig = Boolean(aiConfig?.hasApiKey);

  return {
    hasSiteName,
    hasSiteTitle,
    hasMembers,
    hasAiConfig,
    completedCount: [hasSiteName, hasSiteTitle, hasMembers].filter(Boolean).length,
    requiredCount: 3
  };
}
