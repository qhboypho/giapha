import { useCallback, useEffect, useMemo, useState } from "react";
import { Copy, Download, ExternalLink, Image, KeyRound, LockKeyhole, Palette, Plus, Save, ShieldCheck, Smartphone, Trash2, Upload, UserRound, Wand2 } from "lucide-react";
import { EDITABLE_ROLES, ROLE_DESCRIPTIONS, getRoleLabel, isAdmin } from "../utils/authRoles";
import { getAvatarInitials, getAvatarStyle } from "../utils/avatarUtils";
import { getScopeRootOptions } from "../utils/editorScope";
import { SHOW_SETUP_GUIDE_LINK } from "../config/cmsRuntime";
import {
  DEFAULT_SITE_CONFIG,
  SITE_ABOUT_PAGE_FIELDS,
  SITE_ANNIVERSARY_FIELDS,
  SITE_APP_IDENTITY_FIELDS,
  SITE_CONTACT_FIELDS,
  SITE_HOMEPAGE_FIELDS,
  SITE_MEMBER_FIELD_FIELDS,
  SITE_NAVIGATION_FIELDS,
  SITE_NOTIFICATION_FIELDS,
  SITE_SAMPLE_DATA_FIELDS,
  SITE_THEME_BACKGROUND_FIELDS,
  SITE_THEME_COLOR_FIELDS,
  SITE_SEO_FIELDS,
  SITE_TREE_THEME_FIELDS,
  buildSeoMetadata,
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
const SEO_FIELD_LABELS = {
  title: "Meta title",
  description: "Meta description",
  keywords: "Meta keywords",
  author: "Meta author",
  applicationName: "Application name",
  appleTitle: "Apple app title",
  canonicalUrl: "Canonical URL",
  ogSiteName: "OG site name",
  ogTitle: "OG title",
  ogDescription: "OG description",
  ogImage: "OG image",
  twitterTitle: "Twitter title",
  twitterDescription: "Twitter description",
  twitterImage: "Twitter image"
};
const SEO_LONG_FIELDS = new Set(["description", "keywords", "ogDescription", "twitterDescription"]);
const SEO_IMAGE_FIELDS = new Set(["ogImage", "twitterImage"]);
const APP_IDENTITY_LABELS = {
  faviconUrl: "Favicon",
  appleTouchIconUrl: "Apple touch icon",
  appIconUrl: "Icon app/PWA",
  themeColor: "Theme color trình duyệt",
  statusBarStyle: "iOS status bar"
};
const CONTACT_FIELD_LABELS = {
  managerName: "Người quản trị/chủ gia phả",
  phone: "Số điện thoại",
  zalo: "Zalo",
  email: "Email",
  address: "Địa chỉ/quê gốc",
  facebookUrl: "Facebook URL",
  youtubeUrl: "YouTube URL",
  showInFooter: "Hiển thị liên hệ ở footer"
};
const HOMEPAGE_FIELD_LABELS = {
  showStats: "Hiển thị thống kê",
  showFeatures: "Hiển thị lối vào nhanh",
  showFeatured: "Hiển thị người tiêu biểu",
  showAnniversaries: "Hiển thị ngày giỗ sắp tới",
  showHistory: "Hiển thị lịch sử dòng họ",
  featuredLimit: "Số người tiêu biểu",
  anniversaryLimit: "Số ngày giỗ hiển thị",
  anniversaryWindowDays: "Khoảng ngày giỗ sắp tới"
};
const NOTIFICATION_FIELD_LABELS = {
  enableAnniversary: "Thông báo ngày giỗ",
  anniversaryDaysAhead: "Nhắc trước số ngày",
  anniversaryLimit: "Số thông báo ngày giỗ",
  enableHistory: "Thông báo lịch sử",
  historyLimit: "Số thông báo lịch sử",
  enableFeatured: "Thông báo người tiêu biểu",
  featuredLimit: "Số thông báo người tiêu biểu",
  enablePrivacy: "Thông báo chế độ riêng tư",
  enablePresence: "Thông báo người đang xem",
  maxVisible: "Số thông báo tối đa"
};
const NAVIGATION_FIELD_LABELS = {
  treeLabel: "Menu cây gia phả",
  generationsLabel: "Menu các đời",
  anniversaryLabel: "Menu lịch giỗ",
  membersLabel: "Menu thành viên",
  featuredLabel: "Nhãn người tiêu biểu",
  historyLabel: "Nhãn lịch sử dòng họ",
  aboutLabel: "Menu giới thiệu"
};
const ANNIVERSARY_FIELD_LABELS = {
  calendarMode: "Kiểu lịch giỗ",
  pageTitle: "Tiêu đề trang",
  pageDescription: "Mô tả trang",
  summaryLabel: "Text thẻ thống kê",
  upcomingWindowDays: "Số ngày sắp tới",
  showSolarDate: "Hiển thị ngày dương lịch",
  emptyTitle: "Tiêu đề khi trống",
  emptyDescription: "Mô tả khi trống"
};
const MEMBER_FIELD_LABELS = {
  phone: "Hiện field số điện thoại",
  address: "Hiện field địa chỉ",
  occupation: "Hiện field nghề nghiệp",
  restingPlace: "Hiện field nơi an nghỉ"
};
const SAMPLE_DATA_FIELD_LABELS = {
  generationCount: "Số đời mẫu",
  rootMaleName: "Tên cụ ông mẫu",
  rootFemaleName: "Tên cụ bà mẫu",
  secondGenerationName: "Tên đời 2 mẫu",
  thirdGenerationName: "Tên đời 3 mẫu",
  historyOriginTitle: "Tiêu đề lịch sử khởi nguồn",
  historyBranchTitle: "Tiêu đề lịch sử phát triển",
  historyTodayTitle: "Tiêu đề lịch sử hiện nay"
};
const ABOUT_PAGE_FIELD_LABELS = {
  enabled: "Bật trang giới thiệu",
  title: "Tiêu đề trang",
  subtitle: "Mô tả ngắn",
  description: "Nội dung tổng quan",
  origin: "Quê gốc và thủy tổ",
  tradition: "Truyền thống",
  representativeText: "Dấu ấn dòng họ",
  imageUrl: "Ảnh trang giới thiệu",
  showContact: "Hiển thị liên hệ"
};
const ANNIVERSARY_BOOLEAN_FIELDS = new Set(["showSolarDate"]);
const ABOUT_BOOLEAN_FIELDS = new Set(["enabled", "showContact"]);
const ABOUT_LONG_FIELDS = new Set(["description", "origin", "tradition", "representativeText"]);
const SAMPLE_NUMBER_FIELDS = new Set(["generationCount"]);
const SYSTEM_ASSET_FIELDS = new Set(["faviconUrl", "appleTouchIconUrl", "appIconUrl"]);
const SYSTEM_BOOLEAN_FIELDS = new Set([
  "showInFooter",
  "showStats",
  "showFeatures",
  "showFeatured",
  "showAnniversaries",
  "showHistory",
  "enableAnniversary",
  "enableHistory",
  "enableFeatured",
  "enablePrivacy",
  "enablePresence",
  ...ANNIVERSARY_BOOLEAN_FIELDS,
  ...SITE_MEMBER_FIELD_FIELDS,
  ...ABOUT_BOOLEAN_FIELDS
]);
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

function AssetUploadField({
  label,
  value,
  placeholder,
  scope,
  onChange,
  onUpload,
  uploading,
  dragging,
  onDragStart,
  onDragEnd,
  className = ""
}) {
  const handleFileInput = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) {
      await onUpload(file, { scope });
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    if (uploading) return;
    event.dataTransfer.dropEffect = "copy";
    onDragStart(scope);
  };

  const handleDragLeave = (event) => {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      onDragEnd();
    }
  };

  const handleDrop = async (event) => {
    event.preventDefault();
    onDragEnd();
    if (uploading) return;
    const file = Array.from(event.dataTransfer.files || []).find((item) => item.type?.startsWith("image/"));
    if (file) {
      await onUpload(file, { scope });
    }
  };

  return (
    <label className={`asset-url-field ${className}`}>
      <span>{label}</span>
      <input
        className="form-input"
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
      <div
        className={`asset-upload-box ${dragging === scope ? "is-dragging" : ""} ${uploading ? "is-disabled" : ""}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Upload size={17} strokeWidth={2.2} />
        <span>{uploading ? "Đang tải ảnh..." : "Chọn hoặc kéo ảnh vào đây"}</span>
        <input type="file" accept="image/*" onChange={handleFileInput} disabled={uploading} />
      </div>
      {value ? (
        <div className="asset-url-preview">
          <img src={value} alt="" />
          <small>{value}</small>
        </div>
      ) : null}
    </label>
  );
}

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
  const [assetUploadingScope, setAssetUploadingScope] = useState("");
  const [assetDraggingScope, setAssetDraggingScope] = useState("");

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
  const currentOrigin = typeof window !== "undefined" ? window.location.origin : "";
  const seoPreview = useMemo(
    () => buildSeoMetadata(siteConfigForm, { origin: currentOrigin }),
    [currentOrigin, siteConfigForm]
  );
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

  const handleSeoChange = (field, value) => {
    setSiteConfigDraft((prev) => {
      const base = prev || normalizedSiteConfig;
      return {
        ...base,
        seo: {
          ...base.seo,
          [field]: value
        }
      };
    });
  };

  const handleNestedSiteConfigChange = (section, field, value) => {
    setSiteConfigDraft((prev) => {
      const base = prev || normalizedSiteConfig;
      return {
        ...base,
        [section]: {
          ...base[section],
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

  const uploadSiteAsset = async (file, { scope, onUploaded }) => {
    if (!file?.type?.startsWith("image/")) {
      onToast?.("Chỉ hỗ trợ upload file ảnh.");
      return;
    }

    setAssetUploadingScope(scope);
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("scope", scope);
      const res = await fetch("/api/site-assets", {
        method: "POST",
        body
      });
      const data = await res.json();
      if (!data.success) {
        onToast?.(data.error || "Không thể tải ảnh lên.");
        return;
      }
      onUploaded?.(data.asset?.src || "");
      onToast?.("Đã tải ảnh lên và điền đường dẫn.");
    } catch {
      onToast?.("Lỗi kết nối máy chủ khi tải ảnh.");
    } finally {
      setAssetUploadingScope("");
    }
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
              {SHOW_SETUP_GUIDE_LINK && (
                <a className="btn btn-secondary" href="/cms-setup-guide.html" target="_blank" rel="noreferrer">
                  <ExternalLink size={16} strokeWidth={2.2} />
                  Hướng dẫn setup
                </a>
              )}
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
                <AssetUploadField
                  label="Logo"
                  value={siteConfigForm.logoUrl}
                  placeholder="/tranconglogo.png"
                  scope="logo"
                  onChange={(value) => handleSiteConfigChange("logoUrl", value)}
                  onUpload={(file, options) => uploadSiteAsset(file, {
                    ...options,
                    onUploaded: (src) => handleSiteConfigChange("logoUrl", src)
                  })}
                  uploading={assetUploadingScope === "logo"}
                  dragging={assetDraggingScope}
                  onDragStart={setAssetDraggingScope}
                  onDragEnd={() => setAssetDraggingScope("")}
                />
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

          {wizardStep === "seo" && (
            <form className="setup-wizard-panel" onSubmit={handleSiteConfigSubmit}>
              <div className="theme-config-head">
                <div>
                  <span className="accounts-eyebrow">
                    <Image size={16} strokeWidth={2.2} />
                    SEO và chia sẻ
                  </span>
                  <h3>Cài đặt meta tag</h3>
                  <p>Bỏ trống trường nào thì hệ thống tự sinh theo tên dòng họ; nhập vào khi muốn tối ưu SEO hoặc chia sẻ mạng xã hội.</p>
                </div>
              </div>

              <div className="seo-config-grid">
                {SITE_SEO_FIELDS.map((field) => {
                  const value = siteConfigForm.seo?.[field] || "";
                  if (SEO_IMAGE_FIELDS.has(field)) {
                    return (
                      <AssetUploadField
                        key={field}
                        className="seo-config-wide"
                        label={SEO_FIELD_LABELS[field] || field}
                        value={value}
                        placeholder="/api/media/site/seo/anh-chia-se.jpg"
                        scope={`seo-${field}`}
                        onChange={(nextValue) => handleSeoChange(field, nextValue)}
                        onUpload={(file, options) => uploadSiteAsset(file, {
                          ...options,
                          onUploaded: (src) => {
                            handleSeoChange(field, src);
                            if (field === "ogImage" && !siteConfigForm.seo?.twitterImage) {
                              handleSeoChange("twitterImage", src);
                            }
                          }
                        })}
                        uploading={assetUploadingScope === `seo-${field}`}
                        dragging={assetDraggingScope}
                        onDragStart={setAssetDraggingScope}
                        onDragEnd={() => setAssetDraggingScope("")}
                      />
                    );
                  }
                  if (SEO_LONG_FIELDS.has(field)) {
                    return (
                      <label className="seo-config-wide" key={field}>
                        {SEO_FIELD_LABELS[field] || field}
                        <textarea
                          className="form-input"
                          rows={field === "keywords" ? 2 : 3}
                          value={value}
                          onChange={(event) => handleSeoChange(field, event.target.value)}
                          placeholder={seoPreview[field] || ""}
                        />
                      </label>
                    );
                  }
                  return (
                    <label key={field}>
                      {SEO_FIELD_LABELS[field] || field}
                      <input
                        className="form-input"
                        value={value}
                        onChange={(event) => handleSeoChange(field, event.target.value)}
                        placeholder={seoPreview[field] || ""}
                      />
                    </label>
                  );
                })}
              </div>

              <div className="seo-preview-card">
                <div>
                  <span>Xem trước khi chia sẻ</span>
                  <strong>{seoPreview.ogTitle}</strong>
                  <p>{seoPreview.ogDescription}</p>
                  <small>{seoPreview.canonicalUrl || currentOrigin}</small>
                </div>
                {seoPreview.ogImage ? <img src={seoPreview.ogImage} alt="" /> : null}
              </div>

              <div className="account-form-actions">
                <button className="btn btn-secondary" type="button" onClick={() => handleSeoChange("ogImage", "")}>
                  Xóa ảnh OGP
                </button>
                <button className="btn btn-primary" type="submit" disabled={saving}>
                  {saving ? "Đang lưu..." : "Lưu cài đặt SEO"}
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
                  <AssetUploadField
                    className="theme-background-field"
                    key={field}
                    label={THEME_BACKGROUND_LABELS[field] || field}
                    value={siteConfigForm.themeBackgrounds?.[field] || ""}
                    placeholder="/images/nen-gia-pha.jpg"
                    scope={`background-${field}`}
                    onChange={(value) => handleThemeBackgroundChange(field, value)}
                    onUpload={(file, options) => uploadSiteAsset(file, {
                      ...options,
                      onUploaded: (src) => handleThemeBackgroundChange(field, src)
                    })}
                    uploading={assetUploadingScope === `background-${field}`}
                    dragging={assetDraggingScope}
                    onDragStart={setAssetDraggingScope}
                    onDragEnd={() => setAssetDraggingScope("")}
                  />
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

          {wizardStep === "system" && (
            <form className="setup-wizard-panel" onSubmit={handleSiteConfigSubmit}>
              <div className="theme-config-head">
                <div>
                  <span className="accounts-eyebrow">
                    <Smartphone size={16} strokeWidth={2.2} />
                    Cài đặt hệ thống
                  </span>
                  <h3>PWA, liên hệ, trang chủ và thông báo</h3>
                  <p>Các cấu hình này đi theo CMS package và project khách mới, nhưng để trống vẫn giữ hành vi hiện tại.</p>
                </div>
              </div>

              <div className="theme-section-title">
                <strong>Icon và PWA</strong>
                <span>Upload icon để đổi biểu tượng trình duyệt, icon iOS và app install.</span>
              </div>
              <div className="system-config-grid">
                {SITE_APP_IDENTITY_FIELDS.map((field) => {
                  const value = siteConfigForm.appIdentity?.[field] || "";
                  if (SYSTEM_ASSET_FIELDS.has(field)) {
                    return (
                      <AssetUploadField
                        key={field}
                        label={APP_IDENTITY_LABELS[field] || field}
                        value={value}
                        placeholder={DEFAULT_SITE_CONFIG.appIdentity[field]}
                        scope={`identity-${field}`}
                        onChange={(nextValue) => handleNestedSiteConfigChange("appIdentity", field, nextValue)}
                        onUpload={(file, options) => uploadSiteAsset(file, {
                          ...options,
                          onUploaded: (src) => handleNestedSiteConfigChange("appIdentity", field, src)
                        })}
                        uploading={assetUploadingScope === `identity-${field}`}
                        dragging={assetDraggingScope}
                        onDragStart={setAssetDraggingScope}
                        onDragEnd={() => setAssetDraggingScope("")}
                      />
                    );
                  }
                  if (field === "themeColor") {
                    const swatchValue = HEX_COLOR_INPUT_PATTERN.test(value) ? value : DEFAULT_SITE_CONFIG.appIdentity.themeColor;
                    return (
                      <label className="theme-color-field" key={field}>
                        <span>{APP_IDENTITY_LABELS[field] || field}</span>
                        <div className="theme-color-control">
                          <input
                            className="theme-color-swatch"
                            type="color"
                            value={swatchValue}
                            onChange={(event) => handleNestedSiteConfigChange("appIdentity", field, event.target.value)}
                          />
                          <input
                            className="form-input"
                            value={value}
                            onChange={(event) => handleNestedSiteConfigChange("appIdentity", field, event.target.value)}
                            placeholder="#7A1819"
                            maxLength={7}
                          />
                        </div>
                      </label>
                    );
                  }
                  return (
                    <label className="theme-color-field" key={field}>
                      <span>{APP_IDENTITY_LABELS[field] || field}</span>
                      <select
                        className="form-input"
                        value={value}
                        onChange={(event) => handleNestedSiteConfigChange("appIdentity", field, event.target.value)}
                      >
                        <option value="black-translucent">black-translucent</option>
                        <option value="black">black</option>
                        <option value="default">default</option>
                      </select>
                    </label>
                  );
                })}
              </div>

              <div className="theme-section-title">
                <strong>Liên hệ</strong>
                <span>Thông tin phục vụ bàn giao và có thể hiện ở footer.</span>
              </div>
              <div className="system-config-grid">
                {SITE_CONTACT_FIELDS.map((field) => {
                  if (SYSTEM_BOOLEAN_FIELDS.has(field)) {
                    return (
                      <label className="system-toggle-field" key={field}>
                        <input
                          type="checkbox"
                          checked={Boolean(siteConfigForm.contact?.[field])}
                          onChange={(event) => handleNestedSiteConfigChange("contact", field, event.target.checked)}
                        />
                        <span>{CONTACT_FIELD_LABELS[field] || field}</span>
                      </label>
                    );
                  }
                  return (
                    <label key={field}>
                      {CONTACT_FIELD_LABELS[field] || field}
                      <input
                        className="form-input"
                        value={siteConfigForm.contact?.[field] || ""}
                        onChange={(event) => handleNestedSiteConfigChange("contact", field, event.target.value)}
                        placeholder={field.endsWith("Url") ? "https://..." : ""}
                      />
                    </label>
                  );
                })}
              </div>

              <div className="theme-section-title">
                <strong>Trang chủ</strong>
                <span>Bật tắt block và giới hạn số item trên trang chủ.</span>
              </div>
              <div className="system-config-grid">
                {SITE_HOMEPAGE_FIELDS.map((field) => {
                  if (SYSTEM_BOOLEAN_FIELDS.has(field)) {
                    return (
                      <label className="system-toggle-field" key={field}>
                        <input
                          type="checkbox"
                          checked={siteConfigForm.homepage?.[field] !== false}
                          onChange={(event) => handleNestedSiteConfigChange("homepage", field, event.target.checked)}
                        />
                        <span>{HOMEPAGE_FIELD_LABELS[field] || field}</span>
                      </label>
                    );
                  }
                  return (
                    <label key={field}>
                      {HOMEPAGE_FIELD_LABELS[field] || field}
                      <input
                        className="form-input"
                        type="number"
                        min={1}
                        max={field === "anniversaryWindowDays" ? 365 : 24}
                        value={siteConfigForm.homepage?.[field] || DEFAULT_SITE_CONFIG.homepage[field]}
                        onChange={(event) => handleNestedSiteConfigChange("homepage", field, event.target.value)}
                      />
                    </label>
                  );
                })}
              </div>

              <div className="theme-section-title">
                <strong>Thông báo</strong>
                <span>Bật tắt từng loại notification và giới hạn số lượng hiển thị.</span>
              </div>
              <div className="system-config-grid">
                {SITE_NOTIFICATION_FIELDS.map((field) => {
                  if (SYSTEM_BOOLEAN_FIELDS.has(field)) {
                    return (
                      <label className="system-toggle-field" key={field}>
                        <input
                          type="checkbox"
                          checked={siteConfigForm.notifications?.[field] !== false}
                          onChange={(event) => handleNestedSiteConfigChange("notifications", field, event.target.checked)}
                        />
                        <span>{NOTIFICATION_FIELD_LABELS[field] || field}</span>
                      </label>
                    );
                  }
                  return (
                    <label key={field}>
                      {NOTIFICATION_FIELD_LABELS[field] || field}
                      <input
                        className="form-input"
                        type="number"
                        min={field.endsWith("Limit") ? 0 : 1}
                        max={field === "anniversaryDaysAhead" ? 365 : 30}
                        value={siteConfigForm.notifications?.[field] ?? DEFAULT_SITE_CONFIG.notifications[field]}
                        onChange={(event) => handleNestedSiteConfigChange("notifications", field, event.target.value)}
                      />
                    </label>
                  );
                })}
              </div>

              <div className="theme-section-title">
                <strong>Menu và điều hướng</strong>
                <span>Đổi nhãn navbar/menu để phù hợp từng dòng họ hoặc từng bản CMS.</span>
              </div>
              <div className="system-config-grid">
                {SITE_NAVIGATION_FIELDS.map((field) => (
                  <label key={field}>
                    {NAVIGATION_FIELD_LABELS[field] || field}
                    <input
                      className="form-input"
                      value={siteConfigForm.navigation?.[field] || DEFAULT_SITE_CONFIG.navigation[field]}
                      onChange={(event) => handleNestedSiteConfigChange("navigation", field, event.target.value)}
                    />
                  </label>
                ))}
              </div>

              <div className="theme-section-title">
                <strong>Lịch giỗ</strong>
                <span>Cấu hình kiểu lịch, khoảng ngày sắp tới và text hiển thị trên trang lịch giỗ.</span>
              </div>
              <div className="system-config-grid">
                {SITE_ANNIVERSARY_FIELDS.map((field) => {
                  if (field === "calendarMode") {
                    return (
                      <label key={field}>
                        {ANNIVERSARY_FIELD_LABELS[field] || field}
                        <select
                          className="form-input"
                          value={siteConfigForm.anniversary?.[field] || DEFAULT_SITE_CONFIG.anniversary[field]}
                          onChange={(event) => handleNestedSiteConfigChange("anniversary", field, event.target.value)}
                        >
                          <option value="lunar">Âm lịch</option>
                          <option value="solar">Dương lịch</option>
                        </select>
                      </label>
                    );
                  }
                  if (SYSTEM_BOOLEAN_FIELDS.has(field)) {
                    return (
                      <label className="system-toggle-field" key={field}>
                        <input
                          type="checkbox"
                          checked={siteConfigForm.anniversary?.[field] !== false}
                          onChange={(event) => handleNestedSiteConfigChange("anniversary", field, event.target.checked)}
                        />
                        <span>{ANNIVERSARY_FIELD_LABELS[field] || field}</span>
                      </label>
                    );
                  }
                  return (
                    <label key={field}>
                      {ANNIVERSARY_FIELD_LABELS[field] || field}
                      {field === "pageDescription" || field === "emptyDescription" ? (
                        <textarea
                          className="form-input"
                          rows={2}
                          value={siteConfigForm.anniversary?.[field] || DEFAULT_SITE_CONFIG.anniversary[field]}
                          onChange={(event) => handleNestedSiteConfigChange("anniversary", field, event.target.value)}
                        />
                      ) : (
                        <input
                          className="form-input"
                          type={field === "upcomingWindowDays" ? "number" : "text"}
                          min={field === "upcomingWindowDays" ? 1 : undefined}
                          max={field === "upcomingWindowDays" ? 365 : undefined}
                          value={siteConfigForm.anniversary?.[field] || DEFAULT_SITE_CONFIG.anniversary[field]}
                          onChange={(event) => handleNestedSiteConfigChange("anniversary", field, event.target.value)}
                        />
                      )}
                    </label>
                  );
                })}
              </div>

              <div className="theme-section-title">
                <strong>Trường hồ sơ thành viên</strong>
                <span>Bật tắt các field phụ trong modal thêm/sửa và hồ sơ chi tiết.</span>
              </div>
              <div className="system-config-grid">
                {SITE_MEMBER_FIELD_FIELDS.map((field) => (
                  <label className="system-toggle-field" key={field}>
                    <input
                      type="checkbox"
                      checked={siteConfigForm.memberFields?.[field] !== false}
                      onChange={(event) => handleNestedSiteConfigChange("memberFields", field, event.target.checked)}
                    />
                    <span>{MEMBER_FIELD_LABELS[field] || field}</span>
                  </label>
                ))}
              </div>

              <div className="theme-section-title">
                <strong>Dữ liệu mẫu khi tạo project mới</strong>
                <span>Dùng placeholder <code>{"{familyName}"}</code> để script thay bằng tên dòng họ.</span>
              </div>
              <div className="system-config-grid">
                {SITE_SAMPLE_DATA_FIELDS.map((field) => (
                  <label key={field}>
                    {SAMPLE_DATA_FIELD_LABELS[field] || field}
                    <input
                      className="form-input"
                      type={SAMPLE_NUMBER_FIELDS.has(field) ? "number" : "text"}
                      min={SAMPLE_NUMBER_FIELDS.has(field) ? 1 : undefined}
                      max={SAMPLE_NUMBER_FIELDS.has(field) ? 6 : undefined}
                      value={siteConfigForm.sampleData?.[field] || DEFAULT_SITE_CONFIG.sampleData[field]}
                      onChange={(event) => handleNestedSiteConfigChange("sampleData", field, event.target.value)}
                    />
                  </label>
                ))}
              </div>

              <div className="theme-section-title">
                <strong>Trang giới thiệu dòng họ</strong>
                <span>Tắt mặc định. Khi bật sẽ xuất hiện trong navbar, menu mobile và tìm kiếm.</span>
              </div>
              <div className="system-config-grid">
                {SITE_ABOUT_PAGE_FIELDS.map((field) => {
                  if (ABOUT_BOOLEAN_FIELDS.has(field)) {
                    return (
                      <label className="system-toggle-field" key={field}>
                        <input
                          type="checkbox"
                          checked={field === "enabled" ? Boolean(siteConfigForm.aboutPage?.[field]) : siteConfigForm.aboutPage?.[field] !== false}
                          onChange={(event) => handleNestedSiteConfigChange("aboutPage", field, event.target.checked)}
                        />
                        <span>{ABOUT_PAGE_FIELD_LABELS[field] || field}</span>
                      </label>
                    );
                  }
                  if (field === "imageUrl") {
                    return (
                      <AssetUploadField
                        key={field}
                        label={ABOUT_PAGE_FIELD_LABELS[field] || field}
                        value={siteConfigForm.aboutPage?.[field] || ""}
                        placeholder="/about-family.jpg"
                        scope="about-image"
                        onChange={(nextValue) => handleNestedSiteConfigChange("aboutPage", field, nextValue)}
                        onUpload={(file, options) => uploadSiteAsset(file, {
                          ...options,
                          onUploaded: (src) => handleNestedSiteConfigChange("aboutPage", field, src)
                        })}
                        uploading={assetUploadingScope === "about-image"}
                        dragging={assetDraggingScope}
                        onDragStart={setAssetDraggingScope}
                        onDragEnd={() => setAssetDraggingScope("")}
                      />
                    );
                  }
                  return (
                    <label key={field} className={ABOUT_LONG_FIELDS.has(field) ? "ai-config-wide" : ""}>
                      {ABOUT_PAGE_FIELD_LABELS[field] || field}
                      {ABOUT_LONG_FIELDS.has(field) ? (
                        <textarea
                          className="form-input"
                          rows={3}
                          value={siteConfigForm.aboutPage?.[field] || DEFAULT_SITE_CONFIG.aboutPage[field]}
                          onChange={(event) => handleNestedSiteConfigChange("aboutPage", field, event.target.value)}
                        />
                      ) : (
                        <input
                          className="form-input"
                          value={siteConfigForm.aboutPage?.[field] || DEFAULT_SITE_CONFIG.aboutPage[field]}
                          onChange={(event) => handleNestedSiteConfigChange("aboutPage", field, event.target.value)}
                        />
                      )}
                    </label>
                  );
                })}
              </div>

              <div className="account-form-actions">
                <button className="btn btn-secondary" type="button" onClick={() => {
                  handleNestedSiteConfigChange("appIdentity", "faviconUrl", DEFAULT_SITE_CONFIG.appIdentity.faviconUrl);
                  handleNestedSiteConfigChange("appIdentity", "appleTouchIconUrl", DEFAULT_SITE_CONFIG.appIdentity.appleTouchIconUrl);
                  handleNestedSiteConfigChange("appIdentity", "appIconUrl", DEFAULT_SITE_CONFIG.appIdentity.appIconUrl);
                }}>
                  Icon mặc định
                </button>
                <button className="btn btn-primary" type="submit" disabled={saving}>
                  {saving ? "Đang lưu..." : "Lưu cài đặt hệ thống"}
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
