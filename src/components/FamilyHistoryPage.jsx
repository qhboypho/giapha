import { useMemo, useState } from "react";
import { CalendarClock, ChevronLeft, ChevronRight, History, Images, MapPin, X } from "lucide-react";
import { buildHomepageHistoryEvents, formatHistoryEventDate } from "../utils/familyHistoryUtils";

export default function FamilyHistoryPage({ events = [], isLoading = false }) {
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const historyEvents = useMemo(() => buildHomepageHistoryEvents(events), [events]);
  const galleryImages = useMemo(() => (
    historyEvents.flatMap((event) => (
      (event.images || []).map((image) => ({
        ...image,
        eventTitle: event.title,
        eventDate: event.eventDate
      }))
    ))
  ), [historyEvents]);
  const activeImage = lightboxIndex === null ? null : galleryImages[lightboxIndex];

  const openImage = (key) => {
    const index = galleryImages.findIndex((image) => image.key === key);
    if (index >= 0) setLightboxIndex(index);
  };

  const shiftImage = (direction) => {
    setLightboxIndex((prev) => {
      if (prev === null || galleryImages.length === 0) return prev;
      return (prev + direction + galleryImages.length) % galleryImages.length;
    });
  };

  return (
    <section className="directory-page family-history-page">
      <div className="directory-hero family-history-hero">
        <div>
          <span className="directory-kicker">
            <History size={18} strokeWidth={2.2} />
            Lịch sử dòng họ
          </span>
          <h1>Lịch sử</h1>
          <p>Lưu lại các cột mốc, sự kiện và hình ảnh đáng nhớ trong hành trình gìn giữ cội nguồn Trần Công.</p>
        </div>
        <div className="directory-summary family-history-summary">
          <strong>{historyEvents.length}</strong>
          <span>cột mốc đang lưu</span>
          <small>{galleryImages.length} ảnh tư liệu</small>
        </div>
      </div>

      {isLoading ? (
        <div className="family-history-timeline">
          {[1, 2, 3].map((item) => (
            <article className="family-history-item skeleton-pulse" key={item}>
              <span className="family-history-date skeleton-bar" />
              <div className="family-history-card">
                <span className="skeleton-bar" style={{ width: "45%", height: 20 }} />
                <span className="skeleton-bar" style={{ width: "85%", height: 14 }} />
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="family-history-timeline" aria-label="Timeline lịch sử dòng họ">
          {historyEvents.map((event) => (
            <article className="family-history-item" key={event.id || `${event.eventDate}-${event.title}`}>
              <time className="family-history-date">{formatHistoryEventDate(event.eventDate)}</time>
              <span className="family-history-node" aria-hidden="true">
                <CalendarClock size={18} strokeWidth={2.2} />
              </span>
              <div className="family-history-card">
                <div className="family-history-card-head">
                  <h2>{event.title || formatHistoryEventDate(event.eventDate)}</h2>
                  {event.relatedBranch && (
                    <span>
                      <MapPin size={14} strokeWidth={2.2} />
                      {event.relatedBranch}
                    </span>
                  )}
                </div>
                <p>{event.description || "Đang cập nhập"}</p>
                {event.images?.length > 0 && (
                  <div className="family-history-gallery" aria-label={`Ảnh của ${event.title}`}>
                    {event.images.map((image) => (
                      <button type="button" key={image.key} onClick={() => openImage(image.key)} title={image.name || event.title}>
                        <img src={image.src} alt={image.name || event.title || "Ảnh lịch sử dòng họ"} />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {historyEvents.length === 0 && !isLoading && (
        <div className="directory-empty-state">
          <History size={38} strokeWidth={1.8} />
          <h2>Chưa có cột mốc lịch sử</h2>
          <p>Khi quản trị viên thêm cột mốc, trang này sẽ hiển thị toàn bộ timeline lịch sử dòng họ.</p>
        </div>
      )}

      {activeImage && (
        <div className="history-lightbox" role="dialog" aria-modal="true" aria-label="Xem ảnh lịch sử">
          <button className="history-lightbox-close" type="button" onClick={() => setLightboxIndex(null)} aria-label="Đóng">
            <X size={22} strokeWidth={2.4} />
          </button>
          {galleryImages.length > 1 && (
            <button className="history-lightbox-nav prev" type="button" onClick={() => shiftImage(-1)} aria-label="Ảnh trước">
              <ChevronLeft size={28} strokeWidth={2.4} />
            </button>
          )}
          <figure>
            <img src={activeImage.src} alt={activeImage.name || activeImage.eventTitle || "Ảnh lịch sử dòng họ"} />
            <figcaption>
              <span>
                <Images size={15} strokeWidth={2.2} />
                {activeImage.eventTitle}
              </span>
              <small>{formatHistoryEventDate(activeImage.eventDate)} · {lightboxIndex + 1}/{galleryImages.length}</small>
            </figcaption>
          </figure>
          {galleryImages.length > 1 && (
            <button className="history-lightbox-nav next" type="button" onClick={() => shiftImage(1)} aria-label="Ảnh sau">
              <ChevronRight size={28} strokeWidth={2.4} />
            </button>
          )}
        </div>
      )}
    </section>
  );
}
