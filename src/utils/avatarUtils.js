const avatarPalette = [
  ["#7f1d1d", "#f8d28a"],
  ["#8a4f12", "#fff1c6"],
  ["#355e45", "#e5f2d8"],
  ["#2f5d62", "#d8f0ed"],
  ["#623b7a", "#f0ddff"],
  ["#7a3b3b", "#ffe2d3"],
  ["#3f4f7a", "#dfe7ff"],
  ["#66511f", "#fff0bd"]
];

export const getAvatarInitials = (name = "") => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const familyInitial = parts[0]?.[0] || "";
  const givenInitial = parts[parts.length - 1]?.[0] || familyInitial;
  return `${familyInitial}${givenInitial}`.toLocaleUpperCase("vi-VN");
};

export const getAvatarStyle = (member = {}) => {
  const key = `${member.id || ""}${member.name || ""}`;
  const hash = Array.from(key).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const [backgroundColor, color] = avatarPalette[hash % avatarPalette.length];
  return { backgroundColor, color };
};
