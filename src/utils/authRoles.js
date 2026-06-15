export const ROLE_LABELS = {
  admin: "Quản trị viên",
  editor: "Biên tập viên",
  member: "Thành viên",
  viewer: "Thành viên"
};

export const ROLE_DESCRIPTIONS = {
  admin: "Toàn quyền quản lý dữ liệu, tài khoản và chế độ riêng tư.",
  editor: "Được thêm và chỉnh sửa hồ sơ thành viên.",
  member: "Chỉ xem dữ liệu gia phả được cấp quyền.",
  viewer: "Chỉ xem dữ liệu gia phả được cấp quyền."
};

export const EDITABLE_ROLES = [
  { value: "member", label: "Thành viên", description: "Chỉ xem gia phả" },
  { value: "editor", label: "Biên tập viên", description: "Thêm và sửa hồ sơ" },
  { value: "admin", label: "Quản trị viên", description: "Toàn quyền hệ thống" }
];

export function getRoleLabel(role) {
  return ROLE_LABELS[role] || role || "Khách";
}

export function canEditMembers(user) {
  return user?.role === "admin" || user?.role === "editor";
}

export function isAdmin(user) {
  return user?.role === "admin";
}

export function isAuthenticatedViewer(user) {
  return Boolean(user && user.role !== "guest");
}
