import { CalendarDays, Clock3, MapPin, Moon, Search } from "lucide-react";
import { buildUpcomingAnniversaries, getCurrentLunarDateLabel } from "../utils/anniversaryUtils";

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

export default function AnniversaryPage({ members = [], isLoading = false, onOpenPerson }) {
  const anniversaries = buildUpcomingAnniversaries(members);
  const withinThirtyDays = anniversaries.filter((item) => item.daysUntil <= 30).length;

  return (
    <section className="directory-page anniversary-directory-page">
      <div className="directory-hero anniversary-hero">
        <div>
          <span className="directory-kicker">
            <Moon strokeWidth={1.8} />
            {getCurrentLunarDateLabel()}
          </span>
          <h1>Lịch giỗ</h1>
          <p>
            Lịch giỗ các thành viên trong dòng họ tính theo lịch âm.
          </p>
        </div>
        <div className="directory-summary anniversary-summary">
          <strong>{anniversaries.length}</strong>
          <span>ngày giỗ có dữ liệu</span>
          <small>{withinThirtyDays} ngày giỗ trong 30 ngày tới</small>
        </div>
      </div>

      {isLoading ? (
        <div className="anniversary-timeline">
          {[1, 2, 3, 4].map((item) => <AnniversarySkeleton key={item} />)}
        </div>
      ) : anniversaries.length > 0 ? (
        <div className="anniversary-timeline" aria-label="Timeline ngày giỗ">
          {anniversaries.map((item, index) => (
            <button
              className="anniversary-timeline-item"
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
                  <small>DL {formatNextSolarDate(item.nextSolarDate)}</small>
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
                </span>
              </span>
            </button>
          ))}
        </div>
      ) : (
        <div className="directory-empty-state">
          <Search strokeWidth={1.8} />
          <h2>Chưa có ngày giỗ</h2>
          <p>Chỉ những người đã nhập ngày mất mới xuất hiện trong lịch giỗ.</p>
        </div>
      )}
    </section>
  );
}
