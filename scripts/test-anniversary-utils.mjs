import assert from "node:assert/strict";
import {
  buildUpcomingAnniversaries,
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
const [lunarAnniversary] = buildUpcomingAnniversaries([member], now);

assert.equal(lunarAnniversary.day, "12");
assert.equal(lunarAnniversary.month, "Tháng 7");
assert.equal(lunarAnniversary.date, "Âm lịch ngày 12/07");
assert.equal(lunarAnniversary.note, "Tạ thế ngày 12/07/2001");
assert.equal(lunarAnniversary.daysUntil, 48);
assert.equal(lunarAnniversary.nextSolarDate.getFullYear(), 2026);
assert.equal(lunarAnniversary.nextSolarDate.getMonth(), 7);
assert.equal(lunarAnniversary.nextSolarDate.getDate(), 23);

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
assert.equal(defaultModeAnniversary.date, "Âm lịch ngày 12/07");

const config = normalizeSiteConfig({});
assert.equal(config.anniversary.calendarMode, "lunar");
assert.equal(config.anniversary.pageDescription, "Lịch giỗ các thành viên trong dòng họ tính theo lịch âm.");
assert.equal(getCurrentAnniversaryDateLabel("solar", now), "Hôm nay: 06/07");

const customLunarConfig = normalizeSiteConfig({
  anniversary: {
    calendarMode: "lunar",
    pageDescription: "Tùy chỉnh riêng theo lịch âm của dòng họ."
  }
});
assert.equal(customLunarConfig.anniversary.calendarMode, "lunar");
assert.equal(customLunarConfig.anniversary.pageDescription, "Tùy chỉnh riêng theo lịch âm của dòng họ.");

console.log("anniversary utils tests passed");
