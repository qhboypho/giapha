import { buildUpcomingAnniversaries } from "./anniversaryUtils";
import { formatHistoryEventDate } from "./familyHistoryUtils";
import { isAdmin } from "./authRoles";

const MAX_VISIBLE_NOTIFICATIONS = 8;

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
  activeViewersCount = 0
} = {}) {
  const notifications = [];

  buildUpcomingAnniversaries(members)
    .filter((event) => event.daysUntil <= 30)
    .slice(0, 5)
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

  historyEvents
    .filter((event) => event?.isHomepageVisible)
    .slice(-3)
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

  const featuredMembers = members
    .filter((member) => member.isFeatured)
    .sort((a, b) => (a.generation || 0) - (b.generation || 0) || a.name.localeCompare(b.name, "vi"))
    .slice(0, 2);

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

  if (isAdmin(currentUser)) {
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

  if (activeViewersCount > 0) {
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

  return notifications.slice(0, MAX_VISIBLE_NOTIFICATIONS);
}
