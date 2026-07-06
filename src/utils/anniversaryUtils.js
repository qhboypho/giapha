import { lunarToSolar, parseSolarDate, solarToLunar, toLocalDate } from "./lunarCalendar.js";

export const formatDayMonth = (value) => String(value).padStart(2, "0");

export const formatSolarDate = (dateString) => {
  const parsed = parseSolarDate(dateString);
  if (!parsed) return "";
  return `${formatDayMonth(parsed.day)}/${formatDayMonth(parsed.month)}/${parsed.year}`;
};

export const getYearsString = (member, options = {}) => {
  if (!member?.id) return member?.years || "";
  if (member.isDeceased) {
    if (member.deathDate) {
      const year = member.deathDate.split("-")[0];
      return `Tạ thế ${year}`;
    }
    return options.hideUnknownDeceased ? "" : "Tạ thế";
  }

  if (member.birthDate) {
    const year = member.birthDate.split("-")[0];
    return `Sinh ${year}`;
  }
  return "Còn sống";
};

export const buildAnniversaryTitle = (member) => {
  if (member.generation <= 2) return `Giỗ cụ ${member.name}`;
  return `Giỗ ${member.gender === "nu" ? "bà" : "ông"} ${member.name}`;
};

const getValidAnniversarySolarDate = (lunarDeath, lunarYear) => {
  const exact = lunarToSolar(lunarDeath.day, lunarDeath.month, lunarYear, lunarDeath.leap);
  if (exact) {
    const back = solarToLunar(exact.day, exact.month, exact.year);
    if (
      back.day === lunarDeath.day &&
      back.month === lunarDeath.month &&
      back.leap === lunarDeath.leap
    ) {
      return toLocalDate(exact);
    }
  }

  if (lunarDeath.leap) {
    const fallback = lunarToSolar(lunarDeath.day, lunarDeath.month, lunarYear, false);
    if (fallback) return toLocalDate(fallback);
  }

  return null;
};

export const getCurrentLunarDateLabel = (now = new Date()) => {
  const lunar = solarToLunar(now.getDate(), now.getMonth() + 1, now.getFullYear());
  return `Hôm nay: ${formatDayMonth(lunar.day)}/${formatDayMonth(lunar.month)}${lunar.leap ? " nhuận" : ""}`;
};

export const getCurrentSolarDateLabel = (now = new Date()) => {
  return `Hôm nay: ${formatDayMonth(now.getDate())}/${formatDayMonth(now.getMonth() + 1)}`;
};

export const buildUpcomingAnniversaries = (members, now = new Date()) => {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  return members
    .filter((member) => member.isDeceased && member.deathDate)
    .map((member) => {
      const lunarDeath = parseSolarDate(member.deathDate);
      if (!lunarDeath) return null;

      lunarDeath.leap = Boolean(lunarDeath.leap);
      const currentLunarYear = solarToLunar(today.getDate(), today.getMonth() + 1, today.getFullYear()).year;
      const candidates = [currentLunarYear, currentLunarYear + 1, currentLunarYear + 2]
        .map((year) => getValidAnniversarySolarDate(lunarDeath, year))
        .filter(Boolean)
        .map((date) => ({
          date,
          daysUntil: Math.round((date - today) / (1000 * 60 * 60 * 24))
        }))
        .filter((candidate) => candidate.daysUntil >= 0)
        .sort((a, b) => a.daysUntil - b.daysUntil);

      if (candidates.length === 0) return null;
      const next = candidates[0];

      return {
        member,
        day: formatDayMonth(lunarDeath.day),
        month: `Tháng ${lunarDeath.month}${lunarDeath.leap ? " nhuận" : ""}`,
        title: buildAnniversaryTitle(member),
        date: `Âm lịch ngày ${formatDayMonth(lunarDeath.day)}/${formatDayMonth(lunarDeath.month)}${lunarDeath.leap ? " nhuận" : ""}`,
        note: `Tạ thế ngày ${formatSolarDate(member.deathDate)}`,
        nextSolarDate: next.date,
        daysUntil: next.daysUntil,
        solarDateLabel: formatSolarDate(member.deathDate)
      };
    })
    .filter(Boolean)
    .sort((a, b) => (
      a.daysUntil - b.daysUntil ||
      a.member.generation - b.member.generation ||
      a.member.name.localeCompare(b.member.name, "vi")
    ));
};

export const buildUpcomingSolarAnniversaries = (members, now = new Date()) => {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  return members
    .filter((member) => member.isDeceased && member.deathDate)
    .map((member) => {
      const deathSolar = parseSolarDate(member.deathDate);
      if (!deathSolar) return null;

      const candidates = [today.getFullYear(), today.getFullYear() + 1]
        .map((year) => new Date(year, deathSolar.month - 1, deathSolar.day))
        .filter((date) => date.getMonth() === deathSolar.month - 1)
        .map((date) => ({
          date,
          daysUntil: Math.round((date - today) / (1000 * 60 * 60 * 24))
        }))
        .filter((candidate) => candidate.daysUntil >= 0)
        .sort((a, b) => a.daysUntil - b.daysUntil);

      if (candidates.length === 0) return null;
      const next = candidates[0];

      return {
        member,
        day: formatDayMonth(deathSolar.day),
        month: `Tháng ${deathSolar.month}`,
        title: buildAnniversaryTitle(member),
        date: `Dương lịch ngày ${formatDayMonth(deathSolar.day)}/${formatDayMonth(deathSolar.month)}`,
        note: `Tạ thế ngày ${formatSolarDate(member.deathDate)}`,
        nextSolarDate: next.date,
        daysUntil: next.daysUntil,
        solarDateLabel: formatSolarDate(member.deathDate)
      };
    })
    .filter(Boolean)
    .sort((a, b) => (
      a.daysUntil - b.daysUntil ||
      a.member.generation - b.member.generation ||
      a.member.name.localeCompare(b.member.name, "vi")
    ));
};

export const buildUpcomingAnniversariesForMode = (members, calendarMode = "lunar", now = new Date()) => {
  return calendarMode === "lunar"
    ? buildUpcomingAnniversaries(members, now)
    : buildUpcomingSolarAnniversaries(members, now);
};

export const getCurrentAnniversaryDateLabel = (calendarMode = "lunar", now = new Date()) => {
  return calendarMode === "lunar"
    ? getCurrentLunarDateLabel(now)
    : getCurrentSolarDateLabel(now);
};
