import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Clock3, Gift, MapPin, Moon, Search, Sun } from "lucide-react";
import { buildUpcomingAnniversaries, buildUpcomingSolarAnniversaries, getCurrentLunarDateLabel } from "../utils/anniversaryUtils";
import { buildIncenseAnniversaryKey } from "../utils/incenseUtils";
import { DEFAULT_SITE_CONFIG, normalizeSiteConfig } from "../utils/siteConfigUtils";

const INCENSE_GIFT_LABELS = {
  incense: "Nhang",
  candle: "Nến",
  flowers: "Hoa",
  fruit: "Trái cây",
  tea: "Trà",
  wine: "Rượu",
  rice: "Cơm",
  betel: "Trầu cau",
  sweets: "Bánh kẹo",
  "paper-gold": "Vàng mã",
  water: "Nước"
};

const formatNextSolarDate = (date) => {
  if (!date) return "";
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
};

function AnniversarySkeleton() {
  return (
    <div className="anniversary-timeline-item skeleton-pulse">
      <div className="anniv-timeline-head">
        <span className="anniv-timeline-node" />
        <span className="anniv-date-inline">
          <span className="skeleton-bar" style={{ width: 42, height: 18 }} />
          <span className="skeleton-bar" style={{ width: 56, height: 11 }} />
        </span>
      </div>
      <div className="anniv-timeline-card">
        <span className="skeleton-bar" style={{ width: "42%", height: 14 }} />
        <span className="skeleton-bar" style={{ width: "72%", height: 18 }} />
        <span className="skeleton-bar" style={{ width: "58%", height: 12 }} />
      </div>
    </div>
  );
}

export default function AnniversaryPage({ members = [], isLoading = false, onOpenPerson, siteConfig = DEFAULT_SITE_CONFIG }) {
  const config = normalizeSiteConfig(siteConfig);
  const anniversaryConfig = config.anniversary;
  const isSolarMode = anniversaryConfig.calendarMode === "solar";
  const anniversaries = useMemo(() => (
    isSolarMode
      ? buildUpcomingSolarAnniversaries(members)
      : buildUpcomingAnniversaries(members)
  ), [isSolarMode, members]);
  const [incenseStats, setIncenseStats] = useState({});
  const incenseStatKeys = useMemo(() => (
    anniversaries.map((item) => `${item.member.id}:${buildIncenseAnniversaryKey(item)}`).join("|")
  ), [anniversaries]);
  const withinWindow = anniversaries.filter((item) => item.daysUntil <= anniversaryConfig.upcomingWindowDays).length;

  useEffect(() => {
    if (isLoading || anniversaries.length === 0) {
      return undefined;
    }

    let cancelled = false;
    const loadStats = async () => {
      const entries = await Promise.all(anniversaries.map(async (item) => {
        const anniversaryKey = buildIncenseAnniversaryKey(item);
        const key = `${item.member.id}:${anniversaryKey}`;
        try {
          const res = await fetch(`/api/incense-offerings/${encodeURIComponent(item.member.id)}?anniversaryKey=${encodeURIComponent(anniversaryKey)}`);
          const data = await res.json();
          return [key, data.success ? { count: Number(data.count || 0), giftCounts: data.giftCounts || {} } : { count: 0, giftCounts: {} }];
        } catch {
          return [key, { count: 0, giftCounts: {} }];
        }
      }));
      if (!cancelled) {
        setIncenseStats(Object.fromEntries(entries));
      }
    };

    loadStats();
    return () => {
      cancelled = true;
    };
  }, [anniversaries, incenseStatKeys, isLoading]);

  return (
    <section className="directory-page anniversary-directory-page">
      <div className="directory-hero anniversary-hero">
        <div>
          <span className="directory-kicker">
            {isSolarMode ? <Sun strokeWidth={1.8} /> : <Moon strokeWidth={1.8} />}
            {isSolarMode ? "Tính theo dương lịch" : getCurrentLunarDateLabel()}
          </span>
          <h1>{anniversaryConfig.pageTitle}</h1>
          <p>{anniversaryConfig.pageDescription}</p>
        </div>
        <div className="directory-summary anniversary-summary">
          <strong>{anniversaries.length}</strong>
          <span>{anniversaryConfig.summaryLabel}</span>
          <small>{withinWindow} ngày giỗ trong {anniversaryConfig.upcomingWindowDays} ngày tới</small>
        </div>
      </div>

      {isLoading ? (
        <div className="anniversary-timeline">
          {[1, 2, 3, 4].map((item) => <AnniversarySkeleton key={item} />)}
        </div>
      ) : anniversaries.length > 0 ? (
        <div className="anniversary-timeline" aria-label="Timeline ngày giỗ">
          {anniversaries.map((item, index) => {
            const stats = incenseStats[`${item.member.id}:${buildIncenseAnniversaryKey(item)}`] || { count: 0, giftCounts: {} };
            const giftEntries = Object.entries(stats.giftCounts || {}).filter(([, value]) => Number(value) > 0);
            return (
              <button
                className={`anniversary-timeline-item${index === 0 ? " is-nearest" : ""}`}
                key={item.member.id}
                onClick={() => onOpenPerson(item.member.id)}
                style={{ "--item-index": index }}
              >
              <span className="anniv-timeline-head">
                <span className="anniv-timeline-node" aria-hidden="true">
                  <CalendarDays strokeWidth={1.8} />
                </span>
                <span className="anniv-date-inline">
                  <strong>{item.day}</strong>
                  <em>{item.month}</em>
                  {anniversaryConfig.showSolarDate && (
                    <small>DL {formatNextSolarDate(item.nextSolarDate)}</small>
                  )}
                </span>
              </span>
              <span className="anniv-timeline-card">
                <span className="anniv-timeline-content">
                  <span className="anniv-timeline-status">
                    <Clock3 strokeWidth={1.8} />
                    {item.daysUntil === 0 ? "Hôm nay" : `Còn ${item.daysUntil} ngày`}
                  </span>
                  <strong>{item.title}</strong>
                  <span>{item.member.name} · Đời thứ {item.member.generation || "?"}</span>
                  {(item.member.restingPlace || item.member.birthPlace) && (
                    <span className="anniv-timeline-place">
                      <MapPin strokeWidth={1.8} />
                      {item.member.restingPlace || item.member.birthPlace}
                    </span>
                  )}
                  {stats.count > 0 && (
                    <span className="anniv-incense-summary">
                      <span className="anniv-incense-count">
                        <Gift strokeWidth={1.8} />
                        {stats.count.toLocaleString("vi-VN")} người đã thắp hương
                      </span>
                      {giftEntries.length > 0 && (
                        <span className="anniv-incense-gifts">
                          {giftEntries.slice(0, 4).map(([giftId, amount]) => (
                            <em key={giftId}>{INCENSE_GIFT_LABELS[giftId] || giftId} x{amount}</em>
                          ))}
                        </span>
                      )}
                    </span>
                  )}
                </span>
              </span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="directory-empty-state">
          <Search strokeWidth={1.8} />
          <h2>{anniversaryConfig.emptyTitle}</h2>
          <p>{anniversaryConfig.emptyDescription}</p>
        </div>
      )}
    </section>
  );
}
