import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarClock, Eye, EyeOff, History, Plus, Save, Search, Trash2, X } from "lucide-react";
import { formatHistoryEventDate } from "../utils/familyHistoryUtils";
import { getRoleLabel, isAdmin } from "../utils/authRoles";

const emptyForm = {
  eventDate: "",
  title: "",
  description: "",
  relatedBranch: "",
  relatedMemberIds: [],
  isHomepageVisible: true,
  sortOrder: 0
};

export default function HistoryAdminPage({ currentUser, members = [], onToast, onEventsChanged }) {
  const canManage = isAdmin(currentUser);
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(canManage);
  const [saving, setSaving] = useState(false);
  const [memberSearchQuery, setMemberSearchQuery] = useState("");

  const memberOptions = useMemo(() => (
    [...members]
      .sort((a, b) => (a.generation || 0) - (b.generation || 0) || a.name.localeCompare(b.name, "vi"))
      .map((member) => ({
        id: member.id,
        label: `Đời ${member.generation}: ${member.name}`
      }))
  ), [members]);

  const memberLabelById = useMemo(
    () => new Map(memberOptions.map((option) => [option.id, option.label])),
    [memberOptions]
  );
  const selectedMemberIds = useMemo(() => new Set(form.relatedMemberIds), [form.relatedMemberIds]);
  const normalizedMemberSearch = memberSearchQuery.trim().toLocaleLowerCase("vi-VN");
  const filteredMemberOptions = useMemo(() => {
    if (!normalizedMemberSearch) return memberOptions.slice(0, 12);
    return memberOptions
      .filter((option) => option.label.toLocaleLowerCase("vi-VN").includes(normalizedMemberSearch))
      .slice(0, 24);
  }, [memberOptions, normalizedMemberSearch]);

  const visibleCount = events.filter((event) => event.isHomepageVisible).length;

  const loadEvents = useCallback(async () => {
    try {
      const res = await fetch("/api/history-events?includeHidden=true");
      const data = await res.json();
      if (data.success) {
        setEvents(data.data);
        onEventsChanged?.(data.data.filter((event) => event.isHomepageVisible));
      } else {
        onToast?.(data.error || "Không thể tải cột mốc lịch sử.");
      }
    } catch {
      onToast?.("Lỗi kết nối máy chủ.");
    } finally {
      setLoading(false);
    }
  }, [onEventsChanged, onToast]);

  useEffect(() => {
    if (!canManage) return;

    let cancelled = false;
    const run = async () => {
      await Promise.resolve();
      if (!cancelled) await loadEvents();
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [canManage, loadEvents]);

  const resetForm = () => {
    setEditing(null);
    setForm(emptyForm);
  };

  const handleEdit = (event) => {
    setEditing(event.id);
    setForm({
      eventDate: event.eventDate || "",
      title: event.title || "",
      description: event.description || "",
      relatedBranch: event.relatedBranch || "",
      relatedMemberIds: event.relatedMemberIds || [],
      isHomepageVisible: Boolean(event.isHomepageVisible),
      sortOrder: Number(event.sortOrder || 0)
    });
  };

  const toggleRelatedMember = (memberId) => {
    setForm((prev) => {
      const current = new Set(prev.relatedMemberIds);
      if (current.has(memberId)) {
        current.delete(memberId);
      } else {
        current.add(memberId);
      }
      return { ...prev, relatedMemberIds: Array.from(current) };
    });
  };

  const removeRelatedMember = (memberId) => {
    setForm((prev) => ({
      ...prev,
      relatedMemberIds: prev.relatedMemberIds.filter((id) => id !== memberId)
    }));
  };

  const setDateFromPicker = (value) => {
    if (!value) return;
    setForm((prev) => ({ ...prev, eventDate: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);

    try {
      const res = await fetch(editing ? `/api/history-events/${editing}` : "/api/history-events", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await res.json();

      if (data.success) {
        onToast?.(editing ? "Đã cập nhật cột mốc lịch sử." : "Đã thêm cột mốc lịch sử.");
        resetForm();
        await loadEvents();
      } else {
        onToast?.(data.error || "Không thể lưu cột mốc lịch sử.");
      }
    } catch {
      onToast?.("Lỗi kết nối máy chủ.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (eventId) => {
    if (!window.confirm("Xóa cột mốc lịch sử này?")) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/history-events/${eventId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        onToast?.("Đã xóa cột mốc lịch sử.");
        if (editing === eventId) resetForm();
        await loadEvents();
      } else {
        onToast?.(data.error || "Không thể xóa cột mốc lịch sử.");
      }
    } catch {
      onToast?.("Lỗi kết nối máy chủ.");
    } finally {
      setSaving(false);
    }
  };

  if (!canManage) {
    return (
      <div className="history-admin-page">
        <section className="accounts-hero glass">
          <span className="accounts-eyebrow">Lịch sử dòng họ</span>
          <h1>Quản lý lịch sử</h1>
          <p>Chỉ quản trị viên mới có quyền thêm, sửa và ẩn hiện cột mốc lịch sử dòng họ.</p>
        </section>
      </div>
    );
  }

  return (
    <div className="history-admin-page">
      <section className="accounts-hero glass">
        <div>
          <span className="accounts-eyebrow">
            <History size={16} strokeWidth={2.2} />
            Lịch sử dòng họ
          </span>
          <h1>Quản lý cột mốc</h1>
          <p>
            Nhập các sự kiện quan trọng của dòng họ như xây nhà thờ, họp họ, dựng bia, lập quỹ hoặc cột mốc theo từng chi.
          </p>
        </div>
        <div className="accounts-metric">
          <strong>{events.length}</strong>
          <span>cột mốc</span>
          <small>{visibleCount} đang hiện trang chủ</small>
        </div>
      </section>

      <div className="history-admin-layout">
        <form className="history-event-form glass" onSubmit={handleSubmit}>
          <div className="account-form-title">
            {editing ? <Save size={18} strokeWidth={2.2} /> : <Plus size={18} strokeWidth={2.2} />}
            <h2>{editing ? "Sửa cột mốc" : "Thêm cột mốc"}</h2>
          </div>

          <label>
            Thời gian
            <span className="history-date-row">
              <input
                className="form-input"
                value={form.eventDate}
                onChange={(event) => setForm((prev) => ({ ...prev, eventDate: event.target.value }))}
                placeholder="YYYY, YYYY-MM hoặc YYYY-MM-DD"
                required
              />
              <input
                className="form-input history-date-picker"
                type="date"
                value={/^\d{4}-\d{2}-\d{2}$/.test(form.eventDate) ? form.eventDate : ""}
                onChange={(event) => setDateFromPicker(event.target.value)}
                title="Chọn ngày cụ thể"
              />
            </span>
            <span className="account-field-hint">Có thể nhập riêng năm, tháng/năm, hoặc chọn ngày cụ thể bằng lịch.</span>
          </label>

          <label>
            Tiêu đề
            <input
              className="form-input"
              value={form.title}
              onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
              placeholder="vd: Xây lại nhà thờ họ chi Cụ Húc"
              required
            />
          </label>

          <label>
            Nội dung hiển thị
            <textarea
              className="form-textarea"
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              placeholder="Bỏ trống thì trang chủ hiện: Đang cập nhập"
              rows={5}
            />
          </label>

          <label>
            Chi hoặc địa điểm liên quan
            <input
              className="form-input"
              value={form.relatedBranch}
              onChange={(event) => setForm((prev) => ({ ...prev, relatedBranch: event.target.value }))}
              placeholder="vd: Chi Cụ Húc, nhà thờ họ, xóm 10..."
            />
          </label>

          <label>
            Thành viên liên quan
            <span className="history-member-search">
              <Search size={15} strokeWidth={2.2} aria-hidden="true" />
              <input
                className="form-input"
                value={memberSearchQuery}
                onChange={(event) => setMemberSearchQuery(event.target.value)}
                placeholder="Tìm thành viên để chọn..."
              />
            </span>
            {form.relatedMemberIds.length > 0 && (
              <div className="history-selected-members">
                {form.relatedMemberIds.map((memberId) => (
                  <button
                    key={memberId}
                    type="button"
                    className="history-selected-chip"
                    onClick={() => removeRelatedMember(memberId)}
                    title="Bỏ chọn"
                  >
                    {memberLabelById.get(memberId) || memberId}
                    <X size={12} strokeWidth={2.4} aria-hidden="true" />
                  </button>
                ))}
              </div>
            )}
            <div className="history-member-picker" role="group" aria-label="Chọn thành viên liên quan">
              {filteredMemberOptions.map((option) => (
                <label className={`history-member-option ${selectedMemberIds.has(option.id) ? "is-selected" : ""}`} key={option.id}>
                  <input
                    type="checkbox"
                    checked={selectedMemberIds.has(option.id)}
                    onChange={() => toggleRelatedMember(option.id)}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
              {filteredMemberOptions.length === 0 && (
                <span className="history-member-empty">Không tìm thấy thành viên phù hợp.</span>
              )}
            </div>
            <span className="account-field-hint">Bấm từng người để chọn nhiều thành viên. Có thể bỏ trống nếu là sự kiện chung.</span>
          </label>

          <label>
            Thứ tự ưu tiên
            <input
              className="form-input"
              type="number"
              value={form.sortOrder}
              onChange={(event) => setForm((prev) => ({ ...prev, sortOrder: event.target.value }))}
            />
          </label>

          <label className="history-toggle-row">
            <input
              type="checkbox"
              checked={form.isHomepageVisible}
              onChange={(event) => setForm((prev) => ({ ...prev, isHomepageVisible: event.target.checked }))}
            />
            <span>Hiển thị ở lịch sử dòng họ trên trang chủ</span>
          </label>

          <div className="account-form-actions">
            <button className="btn btn-primary" type="submit" disabled={saving}>
              {saving ? "Đang lưu..." : editing ? "Lưu thay đổi" : "Thêm cột mốc"}
            </button>
            {editing && (
              <button className="btn btn-secondary" type="button" onClick={resetForm} disabled={saving}>
                Hủy
              </button>
            )}
          </div>
        </form>

        <section className="history-events-list glass">
          <div className="accounts-list-header">
            <h2>Danh sách cột mốc</h2>
            {loading && <span>Đang tải...</span>}
          </div>

          <div className="history-event-grid">
            {events.map((event) => (
              <article className="history-event-card" key={event.id}>
                <div className="history-event-date">
                  <CalendarClock size={18} strokeWidth={2.2} />
                  <strong>{formatHistoryEventDate(event.eventDate)}</strong>
                </div>
                <div className="history-event-body">
                  <div className="history-event-title-row">
                    <h3>{event.title}</h3>
                    <span className={`history-visibility-pill ${event.isHomepageVisible ? "is-visible" : ""}`}>
                      {event.isHomepageVisible ? <Eye size={13} strokeWidth={2.2} /> : <EyeOff size={13} strokeWidth={2.2} />}
                      {event.isHomepageVisible ? "Trang chủ" : "Đang ẩn"}
                    </span>
                  </div>
                  <p>{event.description || "Đang cập nhập"}</p>
                  {event.relatedBranch && <small>{event.relatedBranch}</small>}
                  {event.relatedMemberIds?.length > 0 && (
                    <div className="history-related-members">
                      {event.relatedMemberIds.map((id) => (
                        <span key={id}>{memberLabelById.get(id) || id}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="history-event-actions">
                  <button className="btn btn-secondary" type="button" onClick={() => handleEdit(event)}>
                    Sửa
                  </button>
                  <button className="btn btn-secondary danger" type="button" onClick={() => handleDelete(event.id)} disabled={saving}>
                    <Trash2 size={15} strokeWidth={2.2} />
                    Xóa
                  </button>
                </div>
              </article>
            ))}
            {events.length === 0 && !loading && (
              <div className="directory-empty-state">
                <History size={38} strokeWidth={1.8} />
                <h2>Chưa có cột mốc lịch sử</h2>
                <p>Thêm cột mốc đầu tiên để hiển thị vào lịch sử dòng họ trên trang chủ.</p>
              </div>
            )}
          </div>
        </section>
      </div>
      <span className="history-admin-footnote">
        Đang đăng nhập với quyền {getRoleLabel(currentUser?.role)}.
      </span>
    </div>
  );
}
