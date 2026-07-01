const formatDateKeyPart = (value) => String(value).padStart(2, "0");

export function buildIncenseAnniversaryKey(event) {
  const date = event?.nextSolarDate;
  if (date instanceof Date && !Number.isNaN(date.getTime())) {
    return [
      date.getFullYear(),
      formatDateKeyPart(date.getMonth() + 1),
      formatDateKeyPart(date.getDate())
    ].join("-");
  }

  return String(event?.date || event?.member?.id || "anniversary")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/[^a-z0-9:_-]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80) || "anniversary";
}
