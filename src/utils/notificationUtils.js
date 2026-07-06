import { buildUpcomingAnniversariesForMode } from "./anniversaryUtils";
import { formatHistoryEventDate } from "./familyHistoryUtils";
import { isAdmin } from "./authRoles";
import { DEFAULT_SITE_CONFIG, normalizeSiteConfig } from "./siteConfigUtils";

const getAnniversaryTone = (daysUntil) => {
  if (daysUntil === 0) return "critical";
  if (daysUntil <= 7) return "warning";
  return "info";
};

const getAnniversaryTimeLabel = (daysUntil) => {
  if (daysUntil === 0) return "Hôm nay";
  if (daysUntil === 1) return "Ngày mai";
  return `Còn ${daysUntil} ngày`;
};

export function buildFamilyNotifications({
  members = [],
  historyEvents = [],
  currentUser = null,
  isPrivateMode = true,
  activeViewersCount = 0,
  siteConfig = DEFAULT_SITE_CONFIG
} = {}) {
  const config = normalizeSiteConfig(siteConfig);
  const notificationConfig = config.notifications;
  const notifications = [];

  if (notificationConfig.enableAnniversary) {
    buildUpcomingAnniversariesForMode(members, config.anniversary.calendarMode)
      .filter((event) => event.daysUntil <= notificationConfig.anniversaryDaysAhead)
      .slice(0, notificationConfig.anniversaryLimit)
      .forEach((event) => {
        notifications.push({
          id: `anniversary:${event.member.id}:${event.day}:${event.month}`,
          type: "anniversary",
          tone: getAnniversaryTone(event.daysUntil),
          title: event.title,
          description: `${event.date} - ${getAnniversaryTimeLabel(event.daysUntil)}`,
          timeLabel: getAnniversaryTimeLabel(event.daysUntil),
          actionLabel: "Xem hồ sơ",
          action: { type: "member", memberId: event.member.id }
        });
      });
  }

  if (notificationConfig.enableHistory && notificationConfig.historyLimit > 0) {
    historyEvents
      .filter((event) => event?.isHomepageVisible)
      .slice(-notificationConfig.historyLimit)
      .reverse()
      .forEach((event) => {
        notifications.push({
          id: `history:${event.id || event.eventDate}:${event.title}`,
          type: "history",
          tone: "heritage",
          title: event.title || "Cột mốc dòng họ",
          description: event.description || "Có cột mốc lịch sử đang được hiển thị.",
          timeLabel: formatHistoryEventDate(event.eventDate),
          actionLabel: "Xem lịch sử",
          action: { type: "view", view: "history" }
        });
      });
  }

  const featuredMembers = notificationConfig.enableFeatured && notificationConfig.featuredLimit > 0 ? members
    .filter((member) => member.isFeatured)
    .sort((a, b) => (a.generation || 0) - (b.generation || 0) || a.name.localeCompare(b.name, "vi"))
    .slice(0, notificationConfig.featuredLimit) : [];

  featuredMembers.forEach((member) => {
    notifications.push({
      id: `featured:${member.id}`,
      type: "featured",
      tone: "success",
      title: member.name,
      description: `Người tiêu biểu đời thứ ${member.generation}.`,
      timeLabel: "Tiêu biểu",
      actionLabel: "Xem hồ sơ",
      action: { type: "member", memberId: member.id }
    });
  });

  if (notificationConfig.enablePrivacy && isAdmin(currentUser)) {
    notifications.push({
      id: `privacy:${isPrivateMode ? "private" : "public"}`,
      type: "security",
      tone: isPrivateMode ? "warning" : "success",
      title: isPrivateMode ? "Gia phả đang ở chế độ riêng tư" : "Gia phả đang mở công khai",
      description: isPrivateMode
        ? "Chỉ tài khoản được cấp quyền mới xem được nội dung."
        : "Khách truy cập có thể xem dữ liệu công khai.",
      timeLabel: "Bảo mật",
      actionLabel: "Quản trị",
      action: { type: "view", view: "accounts" }
    });
  }

  if (notificationConfig.enablePresence && activeViewersCount > 0) {
    notifications.push({
      id: "presence:active-viewers",
      type: "presence",
      tone: "info",
      title: `${activeViewersCount.toLocaleString("vi-VN")} người đang xem`,
      description: "Số phiên truy cập đang hoạt động trong gia phả.",
      timeLabel: "Trực tuyến",
      actionLabel: "Về trang chủ",
      action: { type: "view", view: "home" }
    });
  }

  return notifications.slice(0, notificationConfig.maxVisible);
}
