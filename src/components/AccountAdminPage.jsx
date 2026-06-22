import { useCallback, useEffect, useMemo, useState } from "react";
import { Copy, Download, ExternalLink, KeyRound, LockKeyhole, Palette, Plus, Save, ShieldCheck, Trash2, Upload, UserRound, Wand2 } from "lucide-react";
import { EDITABLE_ROLES, ROLE_DESCRIPTIONS, getRoleLabel, isAdmin } from "../utils/authRoles";
import { getAvatarInitials, getAvatarStyle } from "../utils/avatarUtils";
import { getScopeRootOptions } from "../utils/editorScope";
import {
  DEFAULT_SITE_CONFIG,
  SITE_THEME_BACKGROUND_FIELDS,
  SITE_THEME_COLOR_FIELDS,
  SITE_TREE_THEME_FIELDS,
  normalizeSiteConfig
} from "../utils/siteConfigUtils";
import { AI_PROVIDERS, getAiProviderConfig } from "../utils/aiConfigUtils";
import { SETUP_WIZARD_STEPS, SETUP_WIZARD_STORAGE_KEY, getSetupProgress } from "../utils/setupWizardUtils";

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
const HEX_COLOR_INPUT_PATTERN = /^#[0-9a-f]{6}$/i;
const THEME_COLOR_LABELS = {
  primary: "Màu chính",
  secondary: "Màu phụ",
  accent: "Màu nhấn",
  appBackground: "Nền tổng thể",
  cardBackground: "Nền thẻ",
  cardHover: "Nền thẻ hover",
  border: "Viền",
  textPrimary: "Chữ chính",
  textSecondary: "Chữ phụ",
  textMuted: "Chữ mờ",
  navbarTop: "Navbar trên",
  navbarBottom: "Navbar dưới",
  generationsBackground: "Nền trang các đời"
};
const THEME_BACKGROUND_LABELS = {
  app: "Nền toàn app",
  home: "Nền trang chủ",
  pages: "Nền các trang danh sách",
  generations: "Nền trang các đời",
  tree: "Nền cây gia phả"
};
const TREE_THEME_LABELS = {
  maleBackground: "Node nam",
  maleBorder: "Viền nam",
  femaleBackground: "Node nữ",
  femaleBorder: "Viền nữ",
  deceasedBackground: "Node đã mất",
  deceasedBorder: "Viền đã mất",
  deceasedText: "Chữ đã mất",
  connector: "Đường nối",
  spouseConnector: "Đường vợ/chồng",
  selectedRing: "Viền đang chọn",
  searchHighlight: "Highlight tìm kiếm"
};
const defaultAiConfigForm = {
  provider: "openai",
  model: AI_PROVIDERS.openai.defaultModel,
  apiKey: "",
  clearApiKey: false
};

export default function AccountAdminPage({
  currentUser,
  members = [],
  mode = "manage",
  siteConfig = DEFAULT_SITE_CONFIG,
  isPrivateMode = true,
  onToast,
  onSiteConfigSave,
  onPrivateModeChange,
  onCmsPackageImported,
  onMembersSynced
}) {
  const canManage = isAdmin(currentUser);
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [siteConfigDraft, setSiteConfigDraft] = useState(null);
  const [aiConfig, setAiConfig] = useState(null);
  const [aiConfigForm, setAiConfigForm] = useState(defaultAiConfigForm);
  const [aiConfigBusy, setAiConfigBusy] = useState(false);
  const [aiConfigTesting, setAiConfigTesting] = useState(false);
  const [wizardStep, setWizardStep] = useState("site");
  const [wizardDone, setWizardDone] = useState(() => localStorage.getItem(SETUP_WIZARD_STORAGE_KEY) === "true");
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
  const [mediaPackageFileName, setMediaPackageFileName] = useState("");
  const [mediaPackagePayload, setMediaPackagePayload] = useState(null);
  const [mediaPackagePreview, setMediaPackagePreview] = useState(null);
  const [mediaPackageErrors, setMediaPackageErrors] = useState([]);
  const [mediaPackageBusy, setMediaPackageBusy] = useState(false);
  const [aiSourceFiles, setAiSourceFiles] = useState([]);
  const [aiJsonText, setAiJsonText] = useState("");
  const [aiPayload, setAiPayload] = useState(null);
  const [aiPreview, setAiPreview] = useState(null);
  const [aiErrors, setAiErrors] = useState([]);
  const [aiBusy, setAiBusy] = useState(false);

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
  const setupProgress = useMemo(
    () => getSetupProgress({ siteConfig: siteConfigForm, aiConfig, members }),
    [aiConfig, members, siteConfigForm]
  );
  const wizardStepIndex = Math.max(0, SETUP_WIZARD_STEPS.findIndex((step) => step.id === wizardStep));
  const currentWizardStep = SETUP_WIZARD_STEPS[wizardStepIndex] || SETUP_WIZARD_STEPS[0];
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

  const applyAiConfigToForm = useCallback((config) => {
    const provider = config?.provider || "openai";
    const providerDefaults = getAiProviderConfig(provider);
    setAiConfigForm({
      provider,
      model: config?.model || providerDefaults.defaultModel,
      apiKey: "",
      clearApiKey: false
    });
  }, []);

  const loadAiConfig = useCallback(async () => {
    try {
      const res = await fetch("/api/ai-config");
      const data = await res.json();
      if (data.success) {
        setAiConfig(data.config);
        applyAiConfigToForm(data.config);
      } else {
        onToast?.(data.error || "Không thể tải cấu hình AI.");
      }
    } catch {
      onToast?.("Lỗi kết nối máy chủ khi tải cấu hình AI.");
    }
  }, [applyAiConfigToForm, onToast]);

  useEffect(() => {
    if (!canManage) {
      return;
    }

    let cancelled = false;
    const run = async () => {
      await Promise.resolve();
      if (!cancelled) {
        await loadUsers();
        await loadAiConfig();
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [canManage, loadAiConfig, loadUsers]);

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

  const handleThemeColorChange = (field, value) => {
    setSiteConfigDraft((prev) => {
      const base = prev || normalizedSiteConfig;
      return {
        ...base,
        themeColors: {
          ...base.themeColors,
          [field]: value
        }
      };
    });
  };

  const handleThemeBackgroundChange = (field, value) => {
    setSiteConfigDraft((prev) => {
      const base = prev || normalizedSiteConfig;
      return {
        ...base,
        themeBackgrounds: {
          ...base.themeBackgrounds,
          [field]: value
        }
      };
    });
  };

  const handleTreeThemeChange = (field, value) => {
    setSiteConfigDraft((prev) => {
      const base = prev || normalizedSiteConfig;
      return {
        ...base,
        treeTheme: {
          ...base.treeTheme,
          [field]: value
        }
      };
    });
  };

  const resetThemeColors = () => {
    setSiteConfigDraft((prev) => ({
      ...(prev || normalizedSiteConfig),
      themeColors: { ...DEFAULT_SITE_CONFIG.themeColors },
      themeBackgrounds: { ...DEFAULT_SITE_CONFIG.themeBackgrounds },
      treeTheme: { ...DEFAULT_SITE_CONFIG.treeTheme }
    }));
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

  const handleAiProviderChange = (provider) => {
    const providerDefaults = getAiProviderConfig(provider);
    setAiConfigForm((prev) => ({
      ...prev,
      provider,
      model: providerDefaults.defaultModel,
      apiKey: "",
      clearApiKey: false
    }));
  };

  const handleAiConfigSubmit = async (event) => {
    event.preventDefault();
    setAiConfigBusy(true);
    try {
      const res = await fetch("/api/ai-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(aiConfigForm)
      });
      const data = await res.json();
      if (data.success) {
        setAiConfig(data.config);
        applyAiConfigToForm(data.config);
        onToast?.("Đã lưu cấu hình AI.");
      } else {
        onToast?.(data.error || "Không thể lưu cấu hình AI.");
      }
    } catch {
      onToast?.("Lỗi kết nối máy chủ khi lưu cấu hình AI.");
    } finally {
      setAiConfigBusy(false);
    }
  };

  const testAiConfig = async () => {
    setAiConfigTesting(true);
    try {
      const res = await fetch("/api/ai-config/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(aiConfigForm)
      });
      const data = await res.json();
      onToast?.(data.success ? "Kết nối AI hợp lệ." : (data.error || "Không kiểm tra được cấu hình AI."));
    } catch {
      onToast?.("Lỗi kết nối máy chủ khi kiểm tra AI.");
    } finally {
      setAiConfigTesting(false);
    }
  };

  const goToWizardStep = (stepId) => {
    if (SETUP_WIZARD_STEPS.some((step) => step.id === stepId)) {
      setWizardStep(stepId);
    }
  };

  const goWizardNext = () => {
    const nextStep = SETUP_WIZARD_STEPS[Math.min(wizardStepIndex + 1, SETUP_WIZARD_STEPS.length - 1)];
    setWizardStep(nextStep.id);
  };

  const goWizardBack = () => {
    const prevStep = SETUP_WIZARD_STEPS[Math.max(wizardStepIndex - 1, 0)];
    setWizardStep(prevStep.id);
  };

  const finishSetupWizard = () => {
    localStorage.setItem(SETUP_WIZARD_STORAGE_KEY, "true");
    setWizardDone(true);
    onToast?.("Đã hoàn tất setup cơ bản.");
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

  const copyAiPrompt = async () => {
    setAiBusy(true);
    try {
      const res = await fetch("/api/member-sync/ai-prompt");
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        onToast?.(data.error || "Không thể lấy prompt AI.");
        return;
      }

      const text = await res.text();
      await navigator.clipboard.writeText(text);
      onToast?.("Đã copy prompt AI.");
    } catch {
      onToast?.("Không thể copy prompt AI. Hãy tải prompt để dùng thủ công.");
    } finally {
      setAiBusy(false);
    }
  };

  const addAiSourceFiles = (files) => {
    const nextFiles = Array.from(files || [])
      .filter((file) => file.type.startsWith("image/") || file.type === "application/pdf")
      .map((file) => ({
        file,
        name: file.name,
        size: file.size,
        type: file.type || "unknown"
      }));

    if (!nextFiles.length) {
      onToast?.("Chỉ hỗ trợ ảnh hoặc PDF làm nguồn cho AI.");
      return;
    }

    setAiSourceFiles((prev) => {
      const existing = new Set(prev.map((file) => `${file.name}-${file.size}`));
      return [
        ...prev,
        ...nextFiles.filter((file) => !existing.has(`${file.name}-${file.size}`))
      ].slice(0, 12);
    });
  };

  const handleAiSourceChange = (event) => {
    addAiSourceFiles(event.target.files);
    event.target.value = "";
  };

  const clearAiImport = () => {
    setAiJsonText("");
    setAiPayload(null);
    setAiPreview(null);
    setAiErrors([]);
  };

  const handleAiJsonTextChange = (event) => {
    setAiJsonText(event.target.value);
    setAiPayload(null);
    setAiPreview(null);
    setAiErrors([]);
  };

  const previewAiJsonImport = async () => {
    setAiBusy(true);
    setAiPreview(null);
    setAiErrors([]);
    try {
      const payload = JSON.parse(aiJsonText);
      const res = await fetch("/api/member-sync/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setAiPayload(payload);
        setAiPreview(data.preview);
        setAiErrors(data.errors || []);
        onToast?.(data.valid ? "JSON AI hợp lệ, có thể nhập vào cây." : "JSON AI còn lỗi quan hệ, cần sửa lại.");
      } else {
        setAiPayload(null);
        onToast?.(data.error || "Không thể kiểm tra JSON AI.");
      }
    } catch {
      setAiPayload(null);
      setAiPreview(null);
      setAiErrors([]);
      onToast?.("JSON AI không đọc được.");
    } finally {
      setAiBusy(false);
    }
  };

  const extractAiMembers = async () => {
    if (!aiSourceFiles.length) {
      onToast?.("Vui lòng chọn ảnh/PDF gia phả trước khi dùng AI nhận diện.");
      return;
    }

    setAiBusy(true);
    setAiPreview(null);
    setAiErrors([]);
    try {
      const formData = new FormData();
      aiSourceFiles.forEach((source) => {
        if (source.file) {
          formData.append("sources", source.file, source.name);
        }
      });

      const res = await fetch("/api/member-sync/ai-extract", {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        const payload = data.payload;
        setAiPayload(payload);
        setAiJsonText(JSON.stringify(payload, null, 2));
        setAiPreview(data.preview);
        setAiErrors(data.errors || []);
        onToast?.(
          data.valid
            ? `AI đã nhận diện ${data.preview?.totalIncoming || payload?.members?.length || 0} thành viên.`
            : "AI đã trả JSON nhưng còn lỗi quan hệ, cần kiểm tra lại."
        );
      } else {
        setAiPayload(null);
        setAiPreview(null);
        setAiErrors(data.errors || []);
        onToast?.(data.error || "AI chưa nhận diện được dữ liệu gia phả.");
      }
    } catch {
      setAiPayload(null);
      setAiPreview(null);
      setAiErrors([]);
      onToast?.("Lỗi kết nối máy chủ khi gọi AI nhận diện.");
    } finally {
      setAiBusy(false);
    }
  };

  const importAiMembers = async () => {
    if (!aiPayload || aiErrors.length > 0) return;
    if (!window.confirm("Nhập JSON AI sẽ ghi đè toàn bộ cây gia phả hiện tại. Tiếp tục?")) return;

    setAiBusy(true);
    try {
      const res = await fetch("/api/member-sync/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(aiPayload)
      });
      const data = await res.json();
      if (data.success) {
        if (data.backup) {
          downloadJson(data.backup, data.backupFilename || "backup-before-ai-import.json");
        }
        clearAiImport();
        await onMembersSynced?.();
        onToast?.("Đã nhập dữ liệu AI vào cây gia phả. Backup hiện tại đã được tải xuống.");
      } else {
        setAiErrors(data.errors || []);
        onToast?.(data.error || "Không thể nhập dữ liệu AI.");
      }
    } catch {
      onToast?.("Lỗi kết nối máy chủ khi nhập dữ liệu AI.");
    } finally {
      setAiBusy(false);
    }
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

  const exportMediaPackage = async () => {
    setMediaPackageBusy(true);
    try {
      const res = await fetch("/api/media-package/export");
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        onToast?.(data.error || "Không thể xuất gói media.");
        return;
      }

      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") || "";
      const filename = disposition.match(/filename="([^"]+)"/)?.[1] || `giapha-media-package-${new Date().toISOString().slice(0, 10)}.json`;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      onToast?.("Đã xuất gói media.");
    } catch {
      onToast?.("Lỗi kết nối máy chủ khi xuất gói media.");
    } finally {
      setMediaPackageBusy(false);
    }
  };

  const previewMediaPackageImport = async (payload, filename) => {
    setMediaPackageBusy(true);
    setMediaPackagePreview(null);
    setMediaPackageErrors([]);
    try {
      const res = await fetch("/api/media-package/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setMediaPackagePayload(payload);
        setMediaPackageFileName(filename);
        setMediaPackagePreview(data.preview);
        setMediaPackageErrors(data.errors || []);
        onToast?.("Gói media hợp lệ, có thể nhập vào R2.");
      } else {
        setMediaPackagePayload(null);
        onToast?.(data.error || "Không thể kiểm tra gói media.");
      }
    } catch {
      setMediaPackagePayload(null);
      onToast?.("Lỗi kết nối máy chủ khi kiểm tra gói media.");
    } finally {
      setMediaPackageBusy(false);
    }
  };

  const handleMediaPackageFileChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      const text = await file.text();
      await previewMediaPackageImport(JSON.parse(text), file.name);
    } catch {
      setMediaPackagePayload(null);
      setMediaPackagePreview(null);
      setMediaPackageErrors([]);
      onToast?.("File gói media không đọc được.");
    }
  };

  const importMediaPackage = async () => {
    if (!mediaPackagePayload || mediaPackageErrors.length > 0) return;
    if (!window.confirm("Nhập gói media sẽ upload/ghi đè ảnh cùng key trong R2. Tiếp tục?")) return;

    setMediaPackageBusy(true);
    try {
      const res = await fetch("/api/media-package/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mediaPackagePayload)
      });
      const data = await res.json();
      if (data.success) {
        setMediaPackagePayload(null);
        setMediaPackagePreview(null);
        setMediaPackageErrors([]);
        setMediaPackageFileName("");
        onToast?.(`Đã nhập ${data.imported || 0} ảnh vào R2.`);
      } else {
        setMediaPackageErrors(data.errors || []);
        onToast?.(data.error || "Không thể nhập gói media.");
      }
    } catch {
      onToast?.("Lỗi kết nối máy chủ khi nhập gói media.");
    } finally {
      setMediaPackageBusy(false);
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
          <h1>{mode === "password" ? "Đổi mật khẩu" : mode === "setup" ? "Setup Wizard" : "Tài khoản"}</h1>
          <p>
            {mode === "password"
              ? "Cập nhật mật khẩu tài khoản đang đăng nhập trước khi tiếp tục quản trị hệ thống."
              : mode === "setup"
                ? "Thiết lập website gia phả theo từng bước: cấu hình, bảo mật, AI và nhập dữ liệu."
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

      {mode === "setup" ? (
        <section className="setup-wizard-card glass">
          <div className="setup-wizard-head">
            <div>
              <span className="accounts-eyebrow">
                <Wand2 size={16} strokeWidth={2.2} />
                Quy trình cài đặt nhanh
              </span>
              <h2>{currentWizardStep.title}</h2>
              <p>{currentWizardStep.description}</p>
            </div>
            <div className="setup-wizard-progress">
              <strong>{wizardStepIndex + 1}/{SETUP_WIZARD_STEPS.length}</strong>
              <span>{wizardDone ? "Đã hoàn tất" : `${setupProgress.completedCount}/${setupProgress.requiredCount} mục bắt buộc`}</span>
              <a className="btn btn-secondary" href="/cms-setup-guide.html" target="_blank" rel="noreferrer">
                <ExternalLink size={16} strokeWidth={2.2} />
                Hướng dẫn setup
              </a>
            </div>
          </div>

          <div className="setup-wizard-steps">
            {SETUP_WIZARD_STEPS.map((step, index) => (
              <button
                className={`setup-wizard-step ${step.id === wizardStep ? "active" : ""} ${index < wizardStepIndex ? "done" : ""}`}
                type="button"
                onClick={() => goToWizardStep(step.id)}
                key={step.id}
              >
                <span>{index + 1}</span>
                <strong>{step.title}</strong>
              </button>
            ))}
          </div>

          {wizardStep === "site" && (
            <form className="setup-wizard-panel" onSubmit={handleSiteConfigSubmit}>
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
                <label>
                  Tiêu đề cây mini
                  <input className="form-input" value={siteConfigForm.mainTreeTitle} onChange={(event) => handleSiteConfigChange("mainTreeTitle", event.target.value)} />
                </label>
                <label>
                  CTA chính
                  <input className="form-input" value={siteConfigForm.primaryCtaLabel} onChange={(event) => handleSiteConfigChange("primaryCtaLabel", event.target.value)} />
                </label>
                <label>
                  CTA phụ
                  <input className="form-input" value={siteConfigForm.secondaryCtaLabel} onChange={(event) => handleSiteConfigChange("secondaryCtaLabel", event.target.value)} />
                </label>
                <label className="site-config-wide">
                  Mô tả hero
                  <textarea className="form-input" rows={3} value={siteConfigForm.heroDescription} onChange={(event) => handleSiteConfigChange("heroDescription", event.target.value)} />
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
                <button className="btn btn-secondary" type="button" onClick={goWizardNext}>
                  Bỏ qua
                </button>
                <button className="btn btn-primary" type="submit" disabled={saving}>
                  {saving ? "Đang lưu..." : "Lưu cấu hình website"}
                </button>
              </div>
            </form>
          )}

          {wizardStep === "theme" && (
            <form className="setup-wizard-panel" onSubmit={handleSiteConfigSubmit}>
              <div className="theme-config-head">
                <div>
                  <span className="accounts-eyebrow">
                    <Palette size={16} strokeWidth={2.2} />
                    Tùy chỉnh giao diện
                  </span>
                  <h3>Màu sắc website</h3>
                  <p>Những màu này được lưu trong CMS package và đi theo project khách khi clone.</p>
                </div>
                <div className="theme-config-preview" aria-label="Xem trước bảng màu">
                  {SITE_THEME_COLOR_FIELDS.slice(0, 6).map((field) => (
                    <span
                      key={field}
                      style={{ backgroundColor: siteConfigForm.themeColors?.[field] || DEFAULT_SITE_CONFIG.themeColors[field] }}
                    />
                  ))}
                </div>
              </div>

              <div className="theme-color-grid">
                {SITE_THEME_COLOR_FIELDS.map((field) => {
                  const value = siteConfigForm.themeColors?.[field] || DEFAULT_SITE_CONFIG.themeColors[field];
                  const swatchValue = HEX_COLOR_INPUT_PATTERN.test(value) ? value : DEFAULT_SITE_CONFIG.themeColors[field];
                  return (
                    <label className="theme-color-field" key={field}>
                      <span>{THEME_COLOR_LABELS[field] || field}</span>
                      <div className="theme-color-control">
                        <input
                          className="theme-color-swatch"
                          type="color"
                          value={swatchValue}
                          onChange={(event) => handleThemeColorChange(field, event.target.value)}
                          aria-label={THEME_COLOR_LABELS[field] || field}
                        />
                        <input
                          className="form-input"
                          value={value}
                          onChange={(event) => handleThemeColorChange(field, event.target.value)}
                          placeholder="#B64235"
                          maxLength={7}
                        />
                      </div>
                    </label>
                  );
                })}
              </div>

              <div className="theme-section-title">
                <strong>Hình nền</strong>
                <span>Dùng đường dẫn nội bộ như /background.jpg, URL https hoặc data image.</span>
              </div>
              <div className="theme-background-grid">
                {SITE_THEME_BACKGROUND_FIELDS.map((field) => (
                  <label className="theme-background-field" key={field}>
                    <span>{THEME_BACKGROUND_LABELS[field] || field}</span>
                    <input
                      className="form-input"
                      value={siteConfigForm.themeBackgrounds?.[field] || ""}
                      onChange={(event) => handleThemeBackgroundChange(field, event.target.value)}
                      placeholder="/images/nen-gia-pha.jpg"
                    />
                  </label>
                ))}
              </div>

              <div className="theme-section-title">
                <strong>Cây gia phả</strong>
                <span>Điều chỉnh node, đường nối và màu highlight trong màn cây.</span>
              </div>
              <div className="theme-color-grid tree-theme-grid">
                {SITE_TREE_THEME_FIELDS.map((field) => {
                  const value = siteConfigForm.treeTheme?.[field] || DEFAULT_SITE_CONFIG.treeTheme[field];
                  const swatchValue = HEX_COLOR_INPUT_PATTERN.test(value) ? value : DEFAULT_SITE_CONFIG.treeTheme[field];
                  return (
                    <label className="theme-color-field" key={field}>
                      <span>{TREE_THEME_LABELS[field] || field}</span>
                      <div className="theme-color-control">
                        <input
                          className="theme-color-swatch"
                          type="color"
                          value={swatchValue}
                          onChange={(event) => handleTreeThemeChange(field, event.target.value)}
                          aria-label={TREE_THEME_LABELS[field] || field}
                        />
                        <input
                          className="form-input"
                          value={value}
                          onChange={(event) => handleTreeThemeChange(field, event.target.value)}
                          placeholder="#D6A85A"
                          maxLength={7}
                        />
                      </div>
                    </label>
                  );
                })}
              </div>

              <div className="account-form-actions">
                <button className="btn btn-secondary" type="button" onClick={resetThemeColors}>
                  Giao diện mặc định
                </button>
                <button className="btn btn-primary" type="submit" disabled={saving}>
                  {saving ? "Đang lưu..." : "Lưu giao diện"}
                </button>
              </div>
            </form>
          )}

          {wizardStep === "security" && (
            <div className="setup-wizard-panel">
              <div className="setup-choice-grid">
                <div className="setup-choice">
                  <strong>Chế độ riêng tư</strong>
                  <span>{isPrivateMode ? "Website yêu cầu đăng nhập để xem dữ liệu." : "Website đang mở công khai cho người truy cập."}</span>
                  <button className="btn btn-secondary" type="button" onClick={() => onPrivateModeChange?.(!isPrivateMode)}>
                    {isPrivateMode ? "Chuyển sang công khai" : "Bật riêng tư"}
                  </button>
                </div>
                <div className="setup-choice">
                  <strong>AI nhận diện gia phả</strong>
                  <span>{aiConfig?.hasApiKey ? `${aiConfig.providerLabel} đã có API key.` : "Có thể cấu hình sau nếu chưa dùng ảnh/PDF."}</span>
                  <button className="btn btn-secondary" type="button" onClick={() => goToWizardStep("data")}>
                    Nhập dữ liệu trước
                  </button>
                </div>
              </div>

              <form className="setup-ai-form" onSubmit={handleAiConfigSubmit}>
                {aiConfig && !aiConfig.encryptionReady && (
                  <div className="ai-config-warning">
                    Cần cấu hình secret <strong>AI_CONFIG_SECRET</strong> trên Cloudflare Pages trước khi lưu API key trong app.
                  </div>
                )}
                <div className="ai-config-grid">
                  <label>
                    Provider
                    <select className="form-input" value={aiConfigForm.provider} onChange={(event) => handleAiProviderChange(event.target.value)}>
                      {Object.entries(AI_PROVIDERS).map(([value, provider]) => (
                        <option value={value} key={value}>{provider.label}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Model
                    <input
                      className="form-input"
                      value={aiConfigForm.model}
                      onChange={(event) => setAiConfigForm((prev) => ({ ...prev, model: event.target.value }))}
                      placeholder={getAiProviderConfig(aiConfigForm.provider).defaultModel}
                      required
                    />
                  </label>
                  <label className="ai-config-wide">
                    API key mới
                    <input
                      className="form-input"
                      type="password"
                      value={aiConfigForm.apiKey}
                      onChange={(event) => setAiConfigForm((prev) => ({ ...prev, apiKey: event.target.value, clearApiKey: false }))}
                      placeholder={aiConfig?.hasApiKey ? "Để trống nếu không đổi key" : "Nhập API key của provider đã chọn"}
                      autoComplete="off"
                    />
                  </label>
                  {aiConfig?.hasApiKey && (
                    <label className="ai-config-clear">
                      <input
                        type="checkbox"
                        checked={aiConfigForm.clearApiKey}
                        onChange={(event) => setAiConfigForm((prev) => ({ ...prev, clearApiKey: event.target.checked, apiKey: event.target.checked ? "" : prev.apiKey }))}
                      />
                      Xóa API key hiện tại
                    </label>
                  )}
                </div>
                <div className="account-form-actions">
                  <button className="btn btn-secondary" type="button" onClick={testAiConfig} disabled={aiConfigTesting || aiConfigBusy}>
                    {aiConfigTesting ? "Đang kiểm tra..." : "Kiểm tra kết nối"}
                  </button>
                  <button className="btn btn-primary" type="submit" disabled={aiConfigBusy}>
                    {aiConfigBusy ? "Đang lưu..." : "Lưu cấu hình AI"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {wizardStep === "data" && (
            <div className="setup-wizard-panel">
              <div className="member-sync-actions">
                <button className="btn btn-secondary" type="button" onClick={exportCmsPackage} disabled={cmsPackageBusy}>
                  <Download size={16} strokeWidth={2.2} />
                  Xuất gói CMS
                </button>
                <button className="btn btn-secondary" type="button" onClick={exportMediaPackage} disabled={mediaPackageBusy}>
                  <Download size={16} strokeWidth={2.2} />
                  Xuất gói media
                </button>
                <button className="btn btn-secondary" type="button" onClick={exportMembers} disabled={syncBusy}>
                  <Download size={16} strokeWidth={2.2} />
                  Xuất dữ liệu cây
                </button>
                <button className="btn btn-secondary" type="button" onClick={downloadMemberSample} disabled={syncBusy}>
                  <Download size={16} strokeWidth={2.2} />
                  Tải JSON mẫu
                </button>
                <button className="btn btn-secondary" type="button" onClick={copyAiPrompt} disabled={aiBusy}>
                  <Copy size={16} strokeWidth={2.2} />
                  Copy prompt AI
                </button>
                <button className="btn btn-secondary" type="button" onClick={downloadAiPrompt} disabled={syncBusy}>
                  <Download size={16} strokeWidth={2.2} />
                  Tải prompt AI
                </button>
              </div>

              <div className="setup-import-grid">
                <label className={`setup-import-tile ${cmsPackageBusy ? "disabled" : ""}`}>
                  <Upload size={20} strokeWidth={2.2} />
                  <strong>Nhập gói CMS</strong>
                  <span>Website config, cây gia phả và lịch sử dòng họ.</span>
                  <input type="file" accept="application/json,.json" onChange={handleCmsPackageFileChange} disabled={cmsPackageBusy} />
                </label>
                <label className={`setup-import-tile ${syncBusy ? "disabled" : ""}`}>
                  <Upload size={20} strokeWidth={2.2} />
                  <strong>Nhập JSON cây</strong>
                  <span>Chỉ thay dữ liệu thành viên cây gia phả.</span>
                  <input type="file" accept="application/json,.json" onChange={handleSyncFileChange} disabled={syncBusy} />
                </label>
                <label className={`setup-import-tile ${mediaPackageBusy ? "disabled" : ""}`}>
                  <Upload size={20} strokeWidth={2.2} />
                  <strong>Nhập gói media</strong>
                  <span>Upload ảnh lịch sử vào R2.</span>
                  <input type="file" accept="application/json,.json" onChange={handleMediaPackageFileChange} disabled={mediaPackageBusy} />
                </label>
                <label className={`setup-import-tile ${aiBusy ? "disabled" : ""}`}>
                  <ShieldCheck size={20} strokeWidth={2.2} />
                  <strong>AI đọc ảnh/PDF</strong>
                  <span>Kéo ảnh/PDF giấy gia phả để tạo JSON.</span>
                  <input type="file" accept="image/*,application/pdf" multiple onChange={handleAiSourceChange} disabled={aiBusy} />
                </label>
              </div>

              {(cmsPackagePreview || syncPreview || mediaPackagePreview || aiSourceFiles.length > 0) && (
                <div className="setup-import-status">
                  {cmsPackagePreview && <span>Gói CMS {cmsPackageFileName ? `"${cmsPackageFileName}"` : ""}: {cmsPackagePreview.members.totalIncoming} thành viên, {cmsPackagePreview.historyEvents.totalIncoming} mốc lịch sử.</span>}
                  {syncPreview && <span>JSON cây {syncFileName ? `"${syncFileName}"` : ""}: {syncPreview.totalIncoming} thành viên.</span>}
                  {mediaPackagePreview && <span>Media {mediaPackageFileName ? `"${mediaPackageFileName}"` : ""}: {mediaPackagePreview.totalIncoming} ảnh.</span>}
                  {aiSourceFiles.length > 0 && <span>AI: đã chọn {aiSourceFiles.length} file nguồn.</span>}
                </div>
              )}

              <div className="account-form-actions">
                {cmsPackagePreview && cmsPackageErrors.length === 0 && (
                  <button className="btn btn-primary" type="button" onClick={importCmsPackage} disabled={cmsPackageBusy}>
                    Nhập gói CMS
                  </button>
                )}
                {syncPreview && syncErrors.length === 0 && (
                  <button className="btn btn-primary" type="button" onClick={importMembers} disabled={syncBusy}>
                    Nhập JSON cây
                  </button>
                )}
                {mediaPackagePreview && mediaPackageErrors.length === 0 && (
                  <button className="btn btn-primary" type="button" onClick={importMediaPackage} disabled={mediaPackageBusy}>
                    Nhập media
                  </button>
                )}
                {aiSourceFiles.length > 0 && (
                  <button className="btn btn-primary" type="button" onClick={extractAiMembers} disabled={aiBusy}>
                    AI tự nhận diện
                  </button>
                )}
                <button className="btn btn-primary" type="button" onClick={previewAiJsonImport} disabled={aiBusy || !aiJsonText.trim()}>
                  Kiểm tra JSON AI
                </button>
                <button className="btn btn-secondary" type="button" onClick={clearAiImport} disabled={aiBusy || (!aiJsonText && !aiPreview)}>
                  Xóa JSON AI
                </button>
              </div>

              <textarea
                className="form-input ai-json-input"
                rows={8}
                value={aiJsonText}
                onChange={handleAiJsonTextChange}
                placeholder="AI sẽ điền JSON vào đây, hoặc paste JSON AI bên ngoài trả về..."
                spellCheck={false}
              />

              {aiPreview && (
                <div className="setup-import-status">
                  <span>AI đã tạo preview {aiPreview.totalIncoming} thành viên.</span>
                  {aiErrors.length === 0 && (
                    <button className="btn btn-primary" type="button" onClick={importAiMembers} disabled={aiBusy}>
                      Nhập JSON AI vào cây
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {wizardStep === "review" && (
            <div className="setup-wizard-panel">
              <div className="setup-review-grid">
                <div className={`setup-review-item ${setupProgress.hasSiteName ? "ok" : ""}`}>
                  <strong>Tên dòng họ</strong>
                  <span>{setupProgress.hasSiteName ? siteConfigForm.familyName : "Chưa nhập"}</span>
                </div>
                <div className={`setup-review-item ${setupProgress.hasSiteTitle ? "ok" : ""}`}>
                  <strong>Tiêu đề website</strong>
                  <span>{setupProgress.hasSiteTitle ? siteConfigForm.siteTitle : "Chưa nhập"}</span>
                </div>
                <div className={`setup-review-item ${setupProgress.hasMembers ? "ok" : ""}`}>
                  <strong>Dữ liệu cây</strong>
                  <span>{setupProgress.hasMembers ? `${members.length} thành viên` : "Chưa có thành viên"}</span>
                </div>
                <div className={`setup-review-item ${setupProgress.hasAiConfig ? "ok" : ""}`}>
                  <strong>Cấu hình AI</strong>
                  <span>{setupProgress.hasAiConfig ? `${aiConfig?.providerLabel} đã sẵn sàng` : "Có thể cấu hình sau"}</span>
                </div>
              </div>
              <div className="account-form-actions">
                <button className="btn btn-secondary" type="button" onClick={() => goToWizardStep("site")}>
                  Xem lại từ đầu
                </button>
                <button className="btn btn-primary" type="button" onClick={finishSetupWizard}>
                  Hoàn tất setup
                </button>
              </div>
            </div>
          )}

          <div className="setup-wizard-footer">
            <button className="btn btn-secondary" type="button" onClick={goWizardBack} disabled={wizardStepIndex === 0}>
              Quay lại
            </button>
            {wizardStep !== "review" ? (
              <button className="btn btn-primary" type="button" onClick={goWizardNext}>
                Tiếp tục
              </button>
            ) : (
              <button className="btn btn-secondary" type="button" onClick={() => setWizardDone(false)}>
                Mở lại wizard
              </button>
            )}
          </div>
        </section>
      ) : null}

      {mode !== "setup" && mode !== "password" && <div className="accounts-layout">
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
      </div>}
    </div>
  );
}
