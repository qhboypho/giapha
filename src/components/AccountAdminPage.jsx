import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, KeyRound, LockKeyhole, Plus, Save, ShieldCheck, Trash2, Upload, UserRound } from "lucide-react";
import { EDITABLE_ROLES, ROLE_DESCRIPTIONS, getRoleLabel, isAdmin } from "../utils/authRoles";
import { getAvatarInitials, getAvatarStyle } from "../utils/avatarUtils";
import { getScopeRootOptions } from "../utils/editorScope";
import { DEFAULT_SITE_CONFIG, normalizeSiteConfig } from "../utils/siteConfigUtils";

const emptyForm = {
  username: "",
  fullName: "",
  role: "member",
  editScopeRootId: "",
  password: ""
};

const emptyPasswordForm = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: ""
};

const ROOT_ADMIN_USERNAME = "admin";

export default function AccountAdminPage({
  currentUser,
  members = [],
  mode = "manage",
  siteConfig = DEFAULT_SITE_CONFIG,
  onToast,
  onSiteConfigSave,
  onCmsPackageImported,
  onMembersSynced
}) {
  const canManage = isAdmin(currentUser);
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [siteConfigDraft, setSiteConfigDraft] = useState(null);
  const [passwordForm, setPasswordForm] = useState(emptyPasswordForm);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(canManage);
  const [saving, setSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [syncFileName, setSyncFileName] = useState("");
  const [syncPayload, setSyncPayload] = useState(null);
  const [syncPreview, setSyncPreview] = useState(null);
  const [syncErrors, setSyncErrors] = useState([]);
  const [syncBusy, setSyncBusy] = useState(false);
  const [cmsPackageFileName, setCmsPackageFileName] = useState("");
  const [cmsPackagePayload, setCmsPackagePayload] = useState(null);
  const [cmsPackagePreview, setCmsPackagePreview] = useState(null);
  const [cmsPackageErrors, setCmsPackageErrors] = useState([]);
  const [cmsPackageBusy, setCmsPackageBusy] = useState(false);

  const adminCount = useMemo(
    () => users.filter((user) => user.role === "admin").length,
    [users]
  );
  const scopeOptions = useMemo(() => getScopeRootOptions(members), [members]);
  const scopeLabelById = useMemo(
    () => new Map(scopeOptions.map((option) => [option.id, option.label])),
    [scopeOptions]
  );
  const normalizedSiteConfig = useMemo(() => normalizeSiteConfig(siteConfig), [siteConfig]);
  const siteConfigForm = siteConfigDraft || normalizedSiteConfig;
  const selectedScopeLabel = form.editScopeRootId ? scopeLabelById.get(form.editScopeRootId) : "";
  const currentUserIsRootAdmin = currentUser?.username === ROOT_ADMIN_USERNAME && currentUser?.role === "admin";

  const loadUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      if (data.success) {
        setUsers(data.data);
      } else {
        onToast?.(data.error || "Không thể tải danh sách tài khoản.");
      }
    } catch {
      onToast?.("Lỗi kết nối máy chủ.");
    } finally {
      setLoading(false);
    }
  }, [onToast]);

  useEffect(() => {
    if (!canManage) {
      return;
    }

    let cancelled = false;
    const run = async () => {
      await Promise.resolve();
      if (!cancelled) {
        await loadUsers();
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [canManage, loadUsers]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditing(null);
  };

  const handleEdit = (user) => {
    if (user.username === ROOT_ADMIN_USERNAME && !currentUserIsRootAdmin) {
      onToast?.("Chỉ admin gốc mới được sửa tài khoản admin gốc.");
      return;
    }

    setEditing(user.username);
    setForm({
      username: user.username,
      fullName: user.fullName || "",
      role: user.role || "member",
      editScopeRootId: user.editScopeRootId || "",
      password: ""
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);

    try {
      const payload = {
        username: form.username.trim(),
        fullName: form.fullName.trim(),
        role: form.role,
        editScopeRootId: form.role === "editor" ? form.editScopeRootId : "",
        password: form.password
      };

      const res = await fetch(editing ? `/api/users/${editing}` : "/api/users", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success) {
        onToast?.(editing ? "Đã cập nhật tài khoản." : "Đã tạo tài khoản mới.");
        resetForm();
        await loadUsers();
      } else {
        onToast?.(data.error || "Thao tác tài khoản thất bại.");
      }
    } catch {
      onToast?.("Lỗi kết nối máy chủ.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (username) => {
    if (username === ROOT_ADMIN_USERNAME) {
      onToast?.("Không thể xóa tài khoản admin gốc.");
      return;
    }

    if (!window.confirm(`Xóa tài khoản ${username}?`)) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/users/${username}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        onToast?.("Đã xóa tài khoản.");
        if (editing === username) resetForm();
        await loadUsers();
      } else {
        onToast?.(data.error || "Không thể xóa tài khoản.");
      }
    } catch {
      onToast?.("Lỗi kết nối máy chủ.");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      onToast?.("Mật khẩu mới và xác nhận mật khẩu chưa khớp.");
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      onToast?.("Mật khẩu mới phải có ít nhất 8 ký tự.");
      return;
    }

    setPasswordSaving(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      });
      const data = await res.json();

      if (data.success) {
        setPasswordForm(emptyPasswordForm);
        onToast?.("Đã đổi mật khẩu tài khoản hiện tại.");
      } else {
        onToast?.(data.error || "Không thể đổi mật khẩu.");
      }
    } catch {
      onToast?.("Lỗi kết nối máy chủ.");
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleSiteConfigChange = (field, value) => {
    setSiteConfigDraft((prev) => ({ ...(prev || normalizedSiteConfig), [field]: value }));
  };

  const handleSiteConfigSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const result = await onSiteConfigSave?.(siteConfigForm);
      if (result?.success) {
        setSiteConfigDraft(null);
      }
    } finally {
      setSaving(false);
    }
  };

  const downloadJson = (payload, filename) => {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const downloadResponseFile = async (endpoint, fallbackFilename, successMessage, errorMessage) => {
    setSyncBusy(true);
    try {
      const res = await fetch(endpoint);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        onToast?.(data.error || errorMessage);
        return;
      }

      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") || "";
      const filename = disposition.match(/filename="([^"]+)"/)?.[1] || fallbackFilename;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      onToast?.(successMessage);
    } catch {
      onToast?.(errorMessage);
    } finally {
      setSyncBusy(false);
    }
  };

  const exportMembers = async () => {
    await downloadResponseFile(
      "/api/member-sync/export",
      `giapha-members-${new Date().toISOString().slice(0, 10)}.json`,
      "Đã xuất dữ liệu cây gia phả.",
      "Không thể xuất dữ liệu cây gia phả."
    );
  };

  const downloadMemberSample = async () => {
    await downloadResponseFile(
      "/api/member-sync/sample",
      "giapha-members-sample.json",
      "Đã tải file JSON mẫu.",
      "Không thể tải file JSON mẫu."
    );
  };

  const downloadAiPrompt = async () => {
    await downloadResponseFile(
      "/api/member-sync/ai-prompt",
      "giapha-ai-import-prompt.txt",
      "Đã tải prompt AI nhập liệu.",
      "Không thể tải prompt AI."
    );
  };

  const exportCmsPackage = async () => {
    setCmsPackageBusy(true);
    try {
      const res = await fetch("/api/cms-package/export");
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        onToast?.(data.error || "Không thể xuất gói CMS.");
        return;
      }

      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") || "";
      const filename = disposition.match(/filename="([^"]+)"/)?.[1] || `giapha-cms-package-${new Date().toISOString().slice(0, 10)}.json`;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      onToast?.("Đã xuất gói CMS.");
    } catch {
      onToast?.("Lỗi kết nối máy chủ khi xuất gói CMS.");
    } finally {
      setCmsPackageBusy(false);
    }
  };

  const previewCmsPackageImport = async (payload, filename) => {
    setCmsPackageBusy(true);
    setCmsPackagePreview(null);
    setCmsPackageErrors([]);
    try {
      const res = await fetch("/api/cms-package/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setCmsPackagePayload(payload);
        setCmsPackageFileName(filename);
        setCmsPackagePreview(data.preview);
        setCmsPackageErrors(data.errors || []);
        onToast?.(data.valid ? "Gói CMS hợp lệ, có thể nhập dữ liệu." : "Gói CMS còn lỗi quan hệ, cần kiểm tra lại.");
      } else {
        setCmsPackagePayload(null);
        onToast?.(data.error || "Không thể kiểm tra gói CMS.");
      }
    } catch {
      setCmsPackagePayload(null);
      onToast?.("Lỗi kết nối máy chủ khi kiểm tra gói CMS.");
    } finally {
      setCmsPackageBusy(false);
    }
  };

  const handleCmsPackageFileChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      const text = await file.text();
      await previewCmsPackageImport(JSON.parse(text), file.name);
    } catch {
      setCmsPackagePayload(null);
      setCmsPackagePreview(null);
      setCmsPackageErrors([]);
      onToast?.("File gói CMS không đọc được.");
    }
  };

  const importCmsPackage = async () => {
    if (!cmsPackagePayload || cmsPackageErrors.length > 0) return;
    if (!window.confirm("Nhập gói CMS sẽ ghi đè cấu hình website, cây gia phả và lịch sử dòng họ hiện tại. Tiếp tục?")) return;

    setCmsPackageBusy(true);
    try {
      const res = await fetch("/api/cms-package/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cmsPackagePayload)
      });
      const data = await res.json();
      if (data.success) {
        if (data.backup) {
          downloadJson(data.backup, data.backupFilename || "backup-before-cms-import.json");
        }
        setCmsPackagePayload(null);
        setCmsPackagePreview(null);
        setCmsPackageErrors([]);
        setCmsPackageFileName("");
        await onCmsPackageImported?.();
        onToast?.("Đã nhập gói CMS. Backup hiện tại đã được tải xuống.");
      } else {
        setCmsPackageErrors(data.errors || []);
        onToast?.(data.error || "Không thể nhập gói CMS.");
      }
    } catch {
      onToast?.("Lỗi kết nối máy chủ khi nhập gói CMS.");
    } finally {
      setCmsPackageBusy(false);
    }
  };

  const previewMemberImport = async (payload, filename) => {
    setSyncBusy(true);
    setSyncPreview(null);
    setSyncErrors([]);
    try {
      const res = await fetch("/api/member-sync/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setSyncPayload(payload);
        setSyncFileName(filename);
        setSyncPreview(data.preview);
        setSyncErrors(data.errors || []);
        onToast?.(data.valid ? "File hợp lệ, có thể nhập dữ liệu." : "File còn lỗi quan hệ, cần kiểm tra lại.");
      } else {
        setSyncPayload(null);
        onToast?.(data.error || "Không thể kiểm tra file đồng bộ.");
      }
    } catch {
      setSyncPayload(null);
      onToast?.("Lỗi kết nối máy chủ khi kiểm tra file.");
    } finally {
      setSyncBusy(false);
    }
  };

  const handleSyncFileChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      const text = await file.text();
      await previewMemberImport(JSON.parse(text), file.name);
    } catch {
      setSyncPayload(null);
      setSyncPreview(null);
      setSyncErrors([]);
      onToast?.("File JSON không đọc được.");
    }
  };

  const importMembers = async () => {
    if (!syncPayload || syncErrors.length > 0) return;
    if (!window.confirm("Nhập file này sẽ ghi đè toàn bộ cây gia phả hiện tại. Tiếp tục?")) return;

    setSyncBusy(true);
    try {
      const res = await fetch("/api/member-sync/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(syncPayload)
      });
      const data = await res.json();
      if (data.success) {
        if (data.backup) {
          downloadJson(data.backup, data.backupFilename || "backup-before-member-import.json");
        }
        setSyncPayload(null);
        setSyncPreview(null);
        setSyncErrors([]);
        setSyncFileName("");
        await onMembersSynced?.();
        onToast?.("Đã nhập dữ liệu cây gia phả. Backup prod đã được tải xuống.");
      } else {
        setSyncErrors(data.errors || []);
        onToast?.(data.error || "Không thể nhập dữ liệu cây gia phả.");
      }
    } catch {
      onToast?.("Lỗi kết nối máy chủ khi nhập dữ liệu.");
    } finally {
      setSyncBusy(false);
    }
  };

  if (!canManage) {
    return (
      <div className="accounts-page">
        <section className="accounts-hero glass">
          <span className="accounts-eyebrow">Quản trị hệ thống</span>
          <h1>Tài khoản</h1>
          <p>Chỉ quản trị viên mới có quyền xem và thay đổi tài khoản đăng nhập.</p>
        </section>
      </div>
    );
  }

  return (
    <div className="accounts-page">
      <section className="accounts-hero glass">
        <div>
          <span className="accounts-eyebrow">
            <ShieldCheck size={16} strokeWidth={2.2} />
            Quản trị hệ thống
          </span>
          <h1>{mode === "password" ? "Đổi mật khẩu" : "Tài khoản"}</h1>
          <p>
            {mode === "password"
              ? "Cập nhật mật khẩu tài khoản đang đăng nhập trước khi tiếp tục quản trị hệ thống."
              : "Tạo tài khoản xem nội bộ, cấp quyền biên tập và giữ ít nhất một quản trị viên hoạt động."}
          </p>
        </div>
        <div className="accounts-metric">
          <strong>{users.length}</strong>
          <span>tài khoản</span>
          <small>{adminCount} quản trị viên</small>
        </div>
      </section>

      {mode === "password" && (
        <form className="account-password-card glass" onSubmit={handlePasswordSubmit}>
          <div className="account-form-title">
            <LockKeyhole size={18} strokeWidth={2.2} />
            <h2>Đổi mật khẩu quản trị viên</h2>
          </div>
          <p>
            Mật khẩu mới sẽ áp dụng cho tài khoản <strong>{currentUser?.username}</strong>. Các phiên đăng nhập khác của tài khoản này sẽ bị đăng xuất.
          </p>
          <div className="account-password-grid">
            <label>
              Mật khẩu hiện tại
              <input
                className="form-input"
                type="password"
                value={passwordForm.currentPassword}
                onChange={(event) => setPasswordForm((prev) => ({ ...prev, currentPassword: event.target.value }))}
                autoComplete="current-password"
                required
              />
            </label>
            <label>
              Mật khẩu mới
              <input
                className="form-input"
                type="password"
                value={passwordForm.newPassword}
                onChange={(event) => setPasswordForm((prev) => ({ ...prev, newPassword: event.target.value }))}
                autoComplete="new-password"
                minLength={8}
                required
              />
            </label>
            <label>
              Nhập lại mật khẩu mới
              <input
                className="form-input"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(event) => setPasswordForm((prev) => ({ ...prev, confirmPassword: event.target.value }))}
                autoComplete="new-password"
                minLength={8}
                required
              />
            </label>
          </div>
          <div className="account-form-actions">
            <button className="btn btn-primary" type="submit" disabled={passwordSaving}>
              {passwordSaving ? "Đang đổi..." : "Đổi mật khẩu"}
            </button>
          </div>
        </form>
      )}

      {mode !== "password" && (
        <>
          <form className="site-config-card glass" onSubmit={handleSiteConfigSubmit}>
            <div className="account-form-title">
              <Save size={18} strokeWidth={2.2} />
              <h2>Cấu hình website/CMS</h2>
            </div>
            <p>
              Đổi tên dòng họ, logo và nội dung trang chủ để tái sử dụng base này cho dòng họ khác mà không cần sửa source.
            </p>
            <div className="site-config-grid">
              <label>
                Nhãn nhỏ trên logo
                <input className="form-input" value={siteConfigForm.familyLabel} onChange={(event) => handleSiteConfigChange("familyLabel", event.target.value)} />
              </label>
              <label>
                Tên dòng họ
                <input className="form-input" value={siteConfigForm.familyName} onChange={(event) => handleSiteConfigChange("familyName", event.target.value)} required />
              </label>
              <label>
                Tiêu đề website
                <input className="form-input" value={siteConfigForm.siteTitle} onChange={(event) => handleSiteConfigChange("siteTitle", event.target.value)} required />
              </label>
              <label>
                Logo URL
                <input className="form-input" value={siteConfigForm.logoUrl} onChange={(event) => handleSiteConfigChange("logoUrl", event.target.value)} placeholder="/tranconglogo.png" />
              </label>
              <label>
                Hero dòng 1
                <input className="form-input" value={siteConfigForm.heroTitle} onChange={(event) => handleSiteConfigChange("heroTitle", event.target.value)} />
              </label>
              <label>
                Hero dòng 2
                <input className="form-input" value={siteConfigForm.heroSubtitle} onChange={(event) => handleSiteConfigChange("heroSubtitle", event.target.value)} />
              </label>
              <label className="site-config-wide">
                Mô tả hero
                <textarea className="form-input" rows={3} value={siteConfigForm.heroDescription} onChange={(event) => handleSiteConfigChange("heroDescription", event.target.value)} />
              </label>
              <label>
                CTA chính
                <input className="form-input" value={siteConfigForm.primaryCtaLabel} onChange={(event) => handleSiteConfigChange("primaryCtaLabel", event.target.value)} />
              </label>
              <label>
                CTA phụ
                <input className="form-input" value={siteConfigForm.secondaryCtaLabel} onChange={(event) => handleSiteConfigChange("secondaryCtaLabel", event.target.value)} />
              </label>
              <label>
                Tiêu đề cây mini
                <input className="form-input" value={siteConfigForm.mainTreeTitle} onChange={(event) => handleSiteConfigChange("mainTreeTitle", event.target.value)} />
              </label>
              <label className="site-config-wide">
                Mô tả đăng nhập
                <textarea className="form-input" rows={2} value={siteConfigForm.loginDescription} onChange={(event) => handleSiteConfigChange("loginDescription", event.target.value)} />
              </label>
              <label className="site-config-wide">
                Câu footer
                <textarea className="form-input" rows={2} value={siteConfigForm.footerQuote} onChange={(event) => handleSiteConfigChange("footerQuote", event.target.value)} />
              </label>
              <label className="site-config-wide">
                Lời nhắn footer
                <textarea className="form-input" rows={2} value={siteConfigForm.footerMessage} onChange={(event) => handleSiteConfigChange("footerMessage", event.target.value)} />
              </label>
            </div>
            <div className="account-form-actions">
              <button className="btn btn-primary" type="submit" disabled={saving}>
                {saving ? "Đang lưu..." : "Lưu cấu hình website"}
              </button>
            </div>
          </form>

          <section className="cms-package-card glass">
            <div className="account-form-title">
              <ShieldCheck size={18} strokeWidth={2.2} />
              <h2>Gói CMS website</h2>
            </div>
            <p>
              Xuất hoặc nhập trọn gói cấu hình website, cây gia phả và lịch sử dòng họ. Đây là định dạng dùng để setup nhanh cho khách mới.
            </p>
            <div className="member-sync-actions">
              <button className="btn btn-secondary" type="button" onClick={exportCmsPackage} disabled={cmsPackageBusy}>
                <Download size={16} strokeWidth={2.2} />
                Xuất gói CMS
              </button>
              <label className={`btn btn-primary member-sync-import ${cmsPackageBusy ? "disabled" : ""}`}>
                <Upload size={16} strokeWidth={2.2} />
                Chọn gói CMS
                <input type="file" accept="application/json,.json" onChange={handleCmsPackageFileChange} disabled={cmsPackageBusy} />
              </label>
            </div>

            {cmsPackagePreview && (
              <div className="member-sync-preview">
                <div className="member-sync-file">
                  <strong>{cmsPackageFileName}</strong>
                  <span>
                    {cmsPackagePreview.totals.incomingMembers} thành viên · {cmsPackagePreview.totals.incomingHistoryEvents} cột mốc lịch sử
                  </span>
                </div>
                <div className="member-sync-stats">
                  <span><strong>{cmsPackagePreview.siteConfigChanged ? "Có" : "Không"}</strong> đổi cấu hình</span>
                  <span><strong>{cmsPackagePreview.members.toCreate}</strong> thành viên mới</span>
                  <span><strong>{cmsPackagePreview.members.toUpdate}</strong> thành viên cập nhật</span>
                  <span><strong>{cmsPackagePreview.members.toDelete}</strong> thành viên sẽ xóa</span>
                  <span><strong>{cmsPackagePreview.historyEvents.toCreate}</strong> lịch sử mới</span>
                  <span><strong>{cmsPackagePreview.historyEvents.toUpdate}</strong> lịch sử cập nhật</span>
                  <span><strong>{cmsPackagePreview.historyEvents.toDelete}</strong> lịch sử sẽ xóa</span>
                </div>
                <div className="member-sync-detail-grid cms-package-detail-grid">
                  {[
                    ["Thành viên thêm", cmsPackagePreview.members.creates || [], "create", "name"],
                    ["Thành viên sửa", cmsPackagePreview.members.updates || [], "update", "name"],
                    ["Thành viên xóa", cmsPackagePreview.members.deletes || [], "delete", "name"],
                    ["Lịch sử thêm", cmsPackagePreview.historyEvents.creates || [], "create", "title"],
                    ["Lịch sử sửa", cmsPackagePreview.historyEvents.updates || [], "update", "title"],
                    ["Lịch sử xóa", cmsPackagePreview.historyEvents.deletes || [], "delete", "title"]
                  ].map(([title, items, tone, labelKey]) => (
                    <div className={`member-sync-detail-section ${tone}`} key={title}>
                      <strong>{title}</strong>
                      {items.length > 0 ? (
                        <div className="member-sync-detail-list">
                          {items.slice(0, 4).map((item) => (
                            <span key={`${title}-${item.id}`}>
                              <b>{item[labelKey]}</b>
                              <small>
                                {item.generation ? `Đời ${item.generation}` : item.eventDate}
                                {item.changedFields?.length ? ` · đổi ${item.changedFields.join(", ")}` : ""}
                              </small>
                            </span>
                          ))}
                          {items.length > 4 && <em>Còn {items.length - 4} mục khác.</em>}
                        </div>
                      ) : (
                        <small>Không có thay đổi.</small>
                      )}
                    </div>
                  ))}
                </div>
                {cmsPackageErrors.length > 0 ? (
                  <div className="member-sync-errors">
                    {cmsPackageErrors.slice(0, 6).map((error) => (
                      <span key={error}>{error}</span>
                    ))}
                    {cmsPackageErrors.length > 6 && <span>Còn {cmsPackageErrors.length - 6} lỗi khác.</span>}
                  </div>
                ) : (
                  <button className="btn btn-primary" type="button" onClick={importCmsPackage} disabled={cmsPackageBusy}>
                    Ghi đè website bằng gói CMS
                  </button>
                )}
              </div>
            )}
          </section>

          <section className="member-sync-card glass">
            <div className="account-form-title">
              <ShieldCheck size={18} strokeWidth={2.2} />
              <h2>Đồng bộ cây gia phả</h2>
            </div>
            <p>
              Xuất file JSON từ local rồi nhập lên production để đồng bộ riêng dữ liệu thành viên. Tài khoản, phiên đăng nhập và lịch sử dòng họ không bị thay đổi.
            </p>
            <div className="member-sync-actions">
              <button className="btn btn-secondary" type="button" onClick={exportMembers} disabled={syncBusy}>
                <Download size={16} strokeWidth={2.2} />
                Xuất dữ liệu cây
              </button>
              <button className="btn btn-secondary" type="button" onClick={downloadMemberSample} disabled={syncBusy}>
                <Download size={16} strokeWidth={2.2} />
                Tải JSON mẫu
              </button>
              <button className="btn btn-secondary" type="button" onClick={downloadAiPrompt} disabled={syncBusy}>
                <Download size={16} strokeWidth={2.2} />
                Tải prompt AI
              </button>
              <label className={`btn btn-primary member-sync-import ${syncBusy ? "disabled" : ""}`}>
                <Upload size={16} strokeWidth={2.2} />
                Chọn file nhập
                <input type="file" accept="application/json,.json" onChange={handleSyncFileChange} disabled={syncBusy} />
              </label>
            </div>

            {syncPreview && (
              <div className="member-sync-preview">
                <div className="member-sync-file">
                  <strong>{syncFileName}</strong>
                  <span>{syncPreview.totalIncoming} thành viên trong file</span>
                </div>
                <div className="member-sync-stats">
                  <span><strong>{syncPreview.toCreate}</strong> thêm mới</span>
                  <span><strong>{syncPreview.toUpdate}</strong> cập nhật</span>
                  <span><strong>{syncPreview.unchanged}</strong> không đổi</span>
                  <span><strong>{syncPreview.toDelete}</strong> sẽ xóa khỏi prod</span>
                </div>
                <div className="member-sync-detail-grid">
                  {[
                    ["Thêm mới", syncPreview.creates || [], "create"],
                    ["Cập nhật", syncPreview.updates || [], "update"],
                    ["Xóa khỏi prod", syncPreview.deletes || [], "delete"]
                  ].map(([title, items, tone]) => (
                    <div className={`member-sync-detail-section ${tone}`} key={title}>
                      <strong>{title}</strong>
                      {items.length > 0 ? (
                        <div className="member-sync-detail-list">
                          {items.slice(0, 6).map((item) => (
                            <span key={`${tone}-${item.id}`}>
                              <b>{item.name}</b>
                              <small>
                                Đời {item.generation}
                                {item.changedFields?.length ? ` · đổi ${item.changedFields.join(", ")}` : ""}
                              </small>
                            </span>
                          ))}
                          {items.length > 6 && <em>Còn {items.length - 6} người khác.</em>}
                        </div>
                      ) : (
                        <small>Không có thay đổi.</small>
                      )}
                    </div>
                  ))}
                </div>
                {syncErrors.length > 0 ? (
                  <div className="member-sync-errors">
                    {syncErrors.slice(0, 6).map((error) => (
                      <span key={error}>{error}</span>
                    ))}
                    {syncErrors.length > 6 && <span>Còn {syncErrors.length - 6} lỗi khác.</span>}
                  </div>
                ) : (
                  <button className="btn btn-primary" type="button" onClick={importMembers} disabled={syncBusy}>
                    Ghi đè cây gia phả trên production
                  </button>
                )}
              </div>
            )}
          </section>
        </>
      )}

      <div className="accounts-layout">
        <form className="account-form glass" onSubmit={handleSubmit}>
          <div className="account-form-title">
            {editing ? <Save size={18} strokeWidth={2.2} /> : <Plus size={18} strokeWidth={2.2} />}
            <h2>{editing ? "Sửa tài khoản" : "Thêm tài khoản"}</h2>
          </div>

          <label>
            Tên đăng nhập
            <input
              className="form-input"
              value={form.username}
              onChange={(event) => setForm((prev) => ({ ...prev, username: event.target.value }))}
              placeholder="vd: trancong_user"
              disabled={Boolean(editing)}
              required
            />
          </label>

          <label>
            Tên hiển thị
            <input
              className="form-input"
              value={form.fullName}
              onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))}
              placeholder="vd: Thành viên Gia tộc"
            />
          </label>

          <label>
            Quyền
            <select
              className="form-input"
              value={form.role}
              onChange={(event) => setForm((prev) => ({
                ...prev,
                role: event.target.value,
                editScopeRootId: event.target.value === "editor" ? prev.editScopeRootId : ""
              }))}
            >
              {EDITABLE_ROLES.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label} - {role.description}
                </option>
              ))}
            </select>
          </label>

          {form.role === "editor" && (
            <label>
              Phạm vi chỉnh sửa
              <select
                className="form-input"
                value={form.editScopeRootId}
                onChange={(event) => setForm((prev) => ({ ...prev, editScopeRootId: event.target.value }))}
              >
                <option value="">Không giới hạn - sửa mọi chi</option>
                {scopeOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    Đời {option.generation}: {option.label.replace(/^Đời\s+\d+:\s*/i, "")}
                  </option>
                ))}
              </select>
              <span className="account-field-hint">
                {selectedScopeLabel || "Tài khoản này có thể thêm/sửa mọi chi trong gia phả."}
              </span>
            </label>
          )}

          <label>
            {editing ? "Mật khẩu mới" : "Mật khẩu"}
            <input
              className="form-input"
              type="password"
              value={form.password}
              onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
              placeholder={editing ? "Bỏ trống nếu không đổi" : "Tối thiểu 8 ký tự"}
              required={!editing}
            />
          </label>

          <div className="account-form-actions">
            <button className="btn btn-primary" type="submit" disabled={saving}>
              {editing ? "Lưu thay đổi" : "Tạo tài khoản"}
            </button>
            {editing && (
              <button className="btn btn-secondary" type="button" onClick={resetForm} disabled={saving}>
                Hủy
              </button>
            )}
          </div>
        </form>

        <section className="accounts-list glass">
          <div className="accounts-list-header">
            <h2>Danh sách tài khoản</h2>
            {loading && <span>Đang tải...</span>}
          </div>

          <div className="accounts-grid">
            {users.map((user) => {
              const isSelf = user.username === currentUser?.username;
              const isRootAdminAccount = user.username === ROOT_ADMIN_USERNAME && user.role === "admin";
              const rootAdminLocked = isRootAdminAccount && !currentUserIsRootAdmin;
              const cannotDeleteLastAdmin = user.role === "admin" && adminCount <= 1;
              return (
                <article className="account-card" key={user.username}>
                  <div
                    className="account-avatar generated-avatar"
                    style={getAvatarStyle({ id: user.username, name: user.fullName || user.username })}
                  >
                    {getAvatarInitials(user.fullName || user.username)}
                  </div>
                  <div className="account-info">
                    <div className="account-title-row">
                      <h3>{user.fullName || user.username}</h3>
                      <div className="account-actions">
                        <button
                          className="btn-icon"
                          type="button"
                          onClick={() => handleEdit(user)}
                          disabled={rootAdminLocked || saving}
                          title={rootAdminLocked ? "Chỉ admin gốc mới được sửa tài khoản này" : "Sửa tài khoản"}
                        >
                          <KeyRound size={16} strokeWidth={2.2} />
                        </button>
                        <button
                          className="btn-icon danger"
                          type="button"
                          onClick={() => handleDelete(user.username)}
                          disabled={isSelf || isRootAdminAccount || cannotDeleteLastAdmin || saving}
                          title={
                            isRootAdminAccount
                              ? "Không thể xóa tài khoản admin gốc"
                              : isSelf
                                ? "Không thể xóa tài khoản đang đăng nhập"
                                : "Xóa tài khoản"
                          }
                        >
                          <Trash2 size={16} strokeWidth={2.2} />
                        </button>
                      </div>
                    </div>
                    <p>
                      <UserRound size={13} strokeWidth={2.2} />
                      {user.username}
                    </p>
                    <span className={`account-role role-${user.role}`}>
                      {getRoleLabel(user.role)}
                    </span>
                    {isRootAdminAccount && (
                      <span className="account-scope">Admin gốc</span>
                    )}
                    {user.role === "editor" && (
                      <span className="account-scope">
                        {user.editScopeRootId
                          ? scopeLabelById.get(user.editScopeRootId) || "Chi đã chọn không còn tồn tại"
                          : "Sửa mọi chi"}
                      </span>
                    )}
                    <small>{ROLE_DESCRIPTIONS[user.role] || "Tài khoản hệ thống."}</small>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
