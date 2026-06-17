export const PRESENT_HISTORY_EVENT = {
  id: "history_present_static",
  eventDate: "Hiện tại",
  title: "Hiện tại",
  description: "Con cháu sum vầy, cùng nhau kết nối và số hóa gia phả dòng họ.",
  isHomepageVisible: true,
  isStatic: true
};

export function formatHistoryEventDate(eventDate = "") {
  const value = String(eventDate || "").trim();
  const match = value.match(/^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?$/);
  if (!match) return value || "Chưa rõ";

  const [, year, month, day] = match;
  if (day && month) return `${day}/${month}/${year}`;
  if (month) return `${month}/${year}`;
  return year;
}

export function normalizeHistoryEvents(events = []) {
  return events
    .filter((event) => event?.isHomepageVisible)
    .map((event) => ({
      ...event,
      description: String(event.description || "").trim() || "Đang cập nhập"
    }))
    .sort((a, b) => (
      String(a.eventDate || "").localeCompare(String(b.eventDate || ""))
      || Number(a.sortOrder || 0) - Number(b.sortOrder || 0)
      || String(a.title || "").localeCompare(String(b.title || ""), "vi")
    ));
}

export function buildHomepageHistoryEvents(events = []) {
  return [
    ...normalizeHistoryEvents(events),
    PRESENT_HISTORY_EVENT
  ];
}
