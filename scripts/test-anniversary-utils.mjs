import assert from "node:assert/strict";
import {
  buildUpcomingAnniversariesForMode,
  buildUpcomingSolarAnniversaries,
  getCurrentAnniversaryDateLabel
} from "../src/utils/anniversaryUtils.js";
import { normalizeSiteConfig } from "../src/utils/siteConfigUtils.js";

const member = {
  id: "tran-thi-thuc",
  name: "Trần Thị Thục",
  gender: "nu",
  generation: 3,
  isDeceased: true,
  deathDate: "2001-07-12"
};

const now = new Date(2026, 6, 6);
const [solarAnniversary] = buildUpcomingSolarAnniversaries([member], now);

assert.equal(solarAnniversary.day, "12");
assert.equal(solarAnniversary.month, "Tháng 7");
assert.equal(solarAnniversary.date, "Dương lịch ngày 12/07");
assert.equal(solarAnniversary.note, "Tạ thế ngày 12/07/2001");
assert.equal(solarAnniversary.daysUntil, 6);
assert.equal(solarAnniversary.nextSolarDate.getFullYear(), 2026);
assert.equal(solarAnniversary.nextSolarDate.getMonth(), 6);
assert.equal(solarAnniversary.nextSolarDate.getDate(), 12);

const [defaultModeAnniversary] = buildUpcomingAnniversariesForMode([member], undefined, now);
assert.equal(defaultModeAnniversary.date, "Dương lịch ngày 12/07");

const config = normalizeSiteConfig({});
assert.equal(config.anniversary.calendarMode, "solar");
assert.equal(getCurrentAnniversaryDateLabel("solar", now), "Hôm nay: 06/07");

const legacyConfig = normalizeSiteConfig({
  anniversary: {
    calendarMode: "lunar",
    pageDescription: "Lịch giỗ các thành viên trong dòng họ tính theo lịch âm."
  }
});
assert.equal(legacyConfig.anniversary.calendarMode, "solar");
assert.equal(legacyConfig.anniversary.pageDescription, "Lịch giỗ các thành viên trong dòng họ tính theo ngày mất đã nhập.");

const customLunarConfig = normalizeSiteConfig({
  anniversary: {
    calendarMode: "lunar",
    pageDescription: "Tùy chỉnh riêng theo lịch âm của dòng họ."
  }
});
assert.equal(customLunarConfig.anniversary.calendarMode, "lunar");
assert.equal(customLunarConfig.anniversary.pageDescription, "Tùy chỉnh riêng theo lịch âm của dòng họ.");

console.log("anniversary utils tests passed");
