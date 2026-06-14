const TIME_ZONE = 7;

const INT = (d) => Math.floor(d);

const jdFromDate = (dd, mm, yy) => {
  const a = INT((14 - mm) / 12);
  const y = yy + 4800 - a;
  const m = mm + 12 * a - 3;
  let jd = dd + INT((153 * m + 2) / 5) + 365 * y + INT(y / 4) - INT(y / 100) + INT(y / 400) - 32045;
  if (jd < 2299161) {
    jd = dd + INT((153 * m + 2) / 5) + 365 * y + INT(y / 4) - 32083;
  }
  return jd;
};

const jdToDate = (jd) => {
  let a;
  let b;
  let c;
  if (jd > 2299160) {
    a = jd + 32044;
    b = INT((4 * a + 3) / 146097);
    c = a - INT((b * 146097) / 4);
  } else {
    b = 0;
    c = jd + 32082;
  }
  const d = INT((4 * c + 3) / 1461);
  const e = c - INT((1461 * d) / 4);
  const m = INT((5 * e + 2) / 153);
  const day = e - INT((153 * m + 2) / 5) + 1;
  const month = m + 3 - 12 * INT(m / 10);
  const year = b * 100 + d - 4800 + INT(m / 10);
  return [day, month, year];
};

const newMoon = (k) => {
  const t = k / 1236.85;
  const t2 = t * t;
  const t3 = t2 * t;
  const dr = Math.PI / 180;
  let jd1 = 2415020.75933 + 29.53058868 * k + 0.0001178 * t2 - 0.000000155 * t3;
  jd1 += 0.00033 * Math.sin((166.56 + 132.87 * t - 0.009173 * t2) * dr);
  const m = 359.2242 + 29.10535608 * k - 0.0000333 * t2 - 0.00000347 * t3;
  const mpr = 306.0253 + 385.81691806 * k + 0.0107306 * t2 + 0.00001236 * t3;
  const f = 21.2964 + 390.67050646 * k - 0.0016528 * t2 - 0.00000239 * t3;
  let c1 = (0.1734 - 0.000393 * t) * Math.sin(m * dr) + 0.0021 * Math.sin(2 * dr * m);
  c1 -= 0.4068 * Math.sin(mpr * dr) + 0.0161 * Math.sin(2 * dr * mpr);
  c1 -= 0.0004 * Math.sin(3 * dr * mpr);
  c1 += 0.0104 * Math.sin(2 * dr * f) - 0.0051 * Math.sin((m + mpr) * dr);
  c1 -= 0.0074 * Math.sin((m - mpr) * dr) + 0.0004 * Math.sin((2 * f + m) * dr);
  c1 -= 0.0004 * Math.sin((2 * f - m) * dr) - 0.0006 * Math.sin((2 * f + mpr) * dr);
  c1 += 0.0010 * Math.sin((2 * f - mpr) * dr) + 0.0005 * Math.sin((2 * mpr + m) * dr);
  const deltaT = t < -11
    ? 0.001 + 0.000839 * t + 0.0002261 * t2 - 0.00000845 * t3 - 0.000000081 * t * t3
    : -0.000278 + 0.000265 * t + 0.000262 * t2;
  return jd1 + c1 - deltaT;
};

const getNewMoonDay = (k, timeZone = TIME_ZONE) => INT(newMoon(k) + 0.5 + timeZone / 24);

const sunLongitude = (jdn) => {
  const t = (jdn - 2451545.5) / 36525;
  const t2 = t * t;
  const dr = Math.PI / 180;
  const m = 357.52910 + 35999.05030 * t - 0.0001559 * t2 - 0.00000048 * t * t2;
  const l0 = 280.46645 + 36000.76983 * t + 0.0003032 * t2;
  let dl = (1.914600 - 0.004817 * t - 0.000014 * t2) * Math.sin(dr * m);
  dl += (0.019993 - 0.000101 * t) * Math.sin(2 * dr * m) + 0.000290 * Math.sin(3 * dr * m);
  let l = l0 + dl;
  l *= dr;
  l -= Math.PI * 2 * INT(l / (Math.PI * 2));
  return l;
};

const getSunLongitude = (dayNumber, timeZone = TIME_ZONE) => {
  return INT((sunLongitude(dayNumber - 0.5 - timeZone / 24) / Math.PI) * 6);
};

const getLunarMonth11 = (yy, timeZone = TIME_ZONE) => {
  const off = jdFromDate(31, 12, yy) - 2415021;
  const k = INT(off / 29.530588853);
  let nm = getNewMoonDay(k, timeZone);
  const sunLong = getSunLongitude(nm, timeZone);
  if (sunLong >= 9) {
    nm = getNewMoonDay(k - 1, timeZone);
  }
  return nm;
};

const getLeapMonthOffset = (a11, timeZone = TIME_ZONE) => {
  const k = INT((a11 - 2415021.076998695) / 29.530588853 + 0.5);
  let last;
  let i = 1;
  let arc = getSunLongitude(getNewMoonDay(k + i, timeZone), timeZone);
  do {
    last = arc;
    i += 1;
    arc = getSunLongitude(getNewMoonDay(k + i, timeZone), timeZone);
  } while (arc !== last && i < 14);
  return i - 1;
};

export const solarToLunar = (dd, mm, yy, timeZone = TIME_ZONE) => {
  const dayNumber = jdFromDate(dd, mm, yy);
  const k = INT((dayNumber - 2415021.076998695) / 29.530588853);
  let monthStart = getNewMoonDay(k + 1, timeZone);
  if (monthStart > dayNumber) {
    monthStart = getNewMoonDay(k, timeZone);
  }
  let a11 = getLunarMonth11(yy, timeZone);
  let b11 = a11;
  let lunarYear;
  if (a11 >= monthStart) {
    lunarYear = yy;
    a11 = getLunarMonth11(yy - 1, timeZone);
  } else {
    lunarYear = yy + 1;
    b11 = getLunarMonth11(yy + 1, timeZone);
  }
  const lunarDay = dayNumber - monthStart + 1;
  const diff = INT((monthStart - a11) / 29);
  let lunarLeap = 0;
  let lunarMonth = diff + 11;
  if (b11 - a11 > 365) {
    const leapMonthDiff = getLeapMonthOffset(a11, timeZone);
    if (diff >= leapMonthDiff) {
      lunarMonth = diff + 10;
      if (diff === leapMonthDiff) {
        lunarLeap = 1;
      }
    }
  }
  if (lunarMonth > 12) {
    lunarMonth -= 12;
  }
  if (lunarMonth >= 11 && diff < 4) {
    lunarYear -= 1;
  }
  return { day: lunarDay, month: lunarMonth, year: lunarYear, leap: lunarLeap === 1 };
};

export const lunarToSolar = (lunarDay, lunarMonth, lunarYear, lunarLeap = false, timeZone = TIME_ZONE) => {
  let a11;
  let b11;
  if (lunarMonth < 11) {
    a11 = getLunarMonth11(lunarYear - 1, timeZone);
    b11 = getLunarMonth11(lunarYear, timeZone);
  } else {
    a11 = getLunarMonth11(lunarYear, timeZone);
    b11 = getLunarMonth11(lunarYear + 1, timeZone);
  }
  const k = INT(0.5 + (a11 - 2415021.076998695) / 29.530588853);
  let off = lunarMonth - 11;
  if (off < 0) {
    off += 12;
  }
  if (b11 - a11 > 365) {
    const leapOff = getLeapMonthOffset(a11, timeZone);
    const leapMonth = leapOff - 2 < 0 ? leapOff + 10 : leapOff - 2;
    if (lunarLeap && lunarMonth !== leapMonth) {
      return null;
    }
    if (lunarLeap || off >= leapOff) {
      off += 1;
    }
  }
  const monthStart = getNewMoonDay(k + off, timeZone);
  const solar = jdToDate(monthStart + lunarDay - 1);
  return { day: solar[0], month: solar[1], year: solar[2] };
};

export const parseSolarDate = (dateString) => {
  const [year, month, day] = String(dateString || "").split("-").map(Number);
  if (!year || !month || !day) return null;
  return { day, month, year };
};

export const toLocalDate = ({ day, month, year }) => new Date(year, month - 1, day);
