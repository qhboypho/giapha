import { useCallback, useMemo, useState, useEffect, useRef } from "react";
import Navbar from "./components/Navbar";
import Homepage from "./components/Homepage";
import TreeChart from "./components/TreeChart";
import MemberList from "./components/MemberList";
import FeaturedMembersPage from "./components/FeaturedMembersPage";
import AnniversaryPage from "./components/AnniversaryPage";
import GenerationsPage from "./components/GenerationsPage";
import AboutPage from "./components/AboutPage";
import AccountAdminPage from "./components/AccountAdminPage";
import { ENABLE_SETUP_WIZARD } from "./config/cmsRuntime";
import HistoryAdminPage from "./components/HistoryAdminPage";
import FamilyHistoryPage from "./components/FamilyHistoryPage";
import Sidebar from "./components/Sidebar";
import MemberModal from "./components/MemberModal";
import LoginModal from "./components/LoginModal";
import { canEditMembers, getRoleLabel, isAuthenticatedViewer } from "./utils/authRoles";
import { buildFamilyNotifications } from "./utils/notificationUtils";
import { DEFAULT_SITE_CONFIG, buildSeoMetadata, buildThemeCssVariables, normalizeSiteConfig } from "./utils/siteConfigUtils";
import { getPreviousView, pushViewHistory } from "./utils/viewHistory";
import "./App.css";

const shouldIgnoreSwipeTarget = (target) => (
  target?.closest?.(
    ".mobile-drawer, .mobile-search-overlay, .modal-overlay, .sidebar, .sidebar-backdrop, .modal-content"
  )
);

const VIEWER_ID_STORAGE_KEY = "giapha_tc_viewer_id";
const VIEWER_ID_PATTERN = /^[a-zA-Z0-9_-]{16,80}$/;
const READ_NOTIFICATION_STORAGE_KEY = "giapha_tc_read_notifications";
const HAD_SESSION_STORAGE_KEY = "giapha_tc_had_session";
const LEGACY_THEME_VARIABLES = [
  "--bg-app",
  "--bg-main",
  "--bg-card",
  "--bg-card-hover",
  "--border-card",
  "--text-primary",
  "--text-secondary",
  "--text-muted",
  "--bg-input",
  "--theme-generations-background"
];
const VALID_APP_VIEWS = new Set([
  "home",
  "tree",
  "generations",
  "featured",
  "anniversary",
  "history",
  "about",
  "accounts",
  "history-admin",
  "list"
]);
const VALID_ACCOUNT_PAGE_MODES = new Set(["manage", "password", "setup"]);

const parseBrowserViewState = () => {
  const params = new URLSearchParams(window.location.search);
  const page = params.get("page") || "home";
  const mode = params.get("mode") || "manage";
  return {
    view: VALID_APP_VIEWS.has(page) ? page : "home",
    accountMode: VALID_ACCOUNT_PAGE_MODES.has(mode) ? mode : "manage"
  };
};

const buildBrowserViewUrl = (view, accountMode = "manage") => {
  const url = new URL(window.location.href);
  if (!view || view === "home") {
    url.searchParams.delete("page");
    url.searchParams.delete("mode");
  } else {
    url.searchParams.set("page", view);
    if (view === "accounts" && accountMode !== "manage") {
      url.searchParams.set("mode", accountMode);
    } else {
      url.searchParams.delete("mode");
    }
  }
  return `${url.pathname}${url.search}${url.hash}`;
};

const getOrCreateViewerId = () => {
  const existing = localStorage.getItem(VIEWER_ID_STORAGE_KEY);
  if (existing && VIEWER_ID_PATTERN.test(existing)) return existing;

  const nextId = crypto.randomUUID?.() || `viewer_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  localStorage.setItem(VIEWER_ID_STORAGE_KEY, nextId);
  return nextId;
};

const upsertHeadElement = (selector, createElement, attributes = {}) => {
  let element = document.head.querySelector(selector);
  if (!element) {
    element = createElement();
    document.head.appendChild(element);
  }
  for (const [name, value] of Object.entries(attributes)) {
    if (value) {
      element.setAttribute(name, value);
    }
  }
  return element;
};

const setMetaContent = (selector, attributes, content) => {
  upsertHeadElement(selector, () => {
    const element = document.createElement("meta");
    for (const [name, value] of Object.entries(attributes)) {
      element.setAttribute(name, value);
    }
    return element;
  }, { ...attributes, content });
};

const updateSeoHead = (siteConfig) => {
  const seo = buildSeoMetadata(siteConfig, { origin: window.location.origin });
  const config = normalizeSiteConfig(siteConfig);
  const identity = config.appIdentity;
  document.title = seo.title;
  setMetaContent('meta[name="description"]', { name: "description" }, seo.description);
  setMetaContent('meta[name="keywords"]', { name: "keywords" }, seo.keywords);
  setMetaContent('meta[name="author"]', { name: "author" }, seo.author);
  setMetaContent('meta[name="theme-color"]', { name: "theme-color" }, identity.themeColor);
  setMetaContent('meta[name="application-name"]', { name: "application-name" }, seo.applicationName);
  setMetaContent('meta[name="apple-mobile-web-app-title"]', { name: "apple-mobile-web-app-title" }, seo.appleTitle);
  setMetaContent('meta[name="apple-mobile-web-app-status-bar-style"]', { name: "apple-mobile-web-app-status-bar-style" }, identity.statusBarStyle);
  setMetaContent('meta[property="og:site_name"]', { property: "og:site_name" }, seo.ogSiteName);
  setMetaContent('meta[property="og:title"]', { property: "og:title" }, seo.ogTitle);
  setMetaContent('meta[property="og:description"]', { property: "og:description" }, seo.ogDescription);
  setMetaContent('meta[property="og:image"]', { property: "og:image" }, seo.ogImage);
  setMetaContent('meta[name="twitter:title"]', { name: "twitter:title" }, seo.twitterTitle);
  setMetaContent('meta[name="twitter:description"]', { name: "twitter:description" }, seo.twitterDescription);
  setMetaContent('meta[name="twitter:image"]', { name: "twitter:image" }, seo.twitterImage);
  upsertHeadElement('link[rel="canonical"]', () => {
    const element = document.createElement("link");
    element.setAttribute("rel", "canonical");
    return element;
  }, { href: seo.canonicalUrl });
  upsertHeadElement('link[rel="icon"][type="image/png"]', () => {
    const element = document.createElement("link");
    element.setAttribute("rel", "icon");
    element.setAttribute("type", "image/png");
    return element;
  }, { href: identity.faviconUrl });
  upsertHeadElement('link[rel="apple-touch-icon"]', () => {
    const element = document.createElement("link");
    element.setAttribute("rel", "apple-touch-icon");
    return element;
  }, { href: identity.appleTouchIconUrl });
  upsertHeadElement('link[rel="manifest"]', () => {
    const element = document.createElement("link");
    element.setAttribute("rel", "manifest");
    return element;
  }, { href: "/site.webmanifest" });
};

export default function App() {
  const initialBrowserView = useMemo(() => parseBrowserViewState(), []);
  // Family tree members from database
  const [members, setMembers] = useState([]);
  const [historyEvents, setHistoryEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Authenticated user state
  const [currentUser, setCurrentUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [hadSessionHint, setHadSessionHint] = useState(() => localStorage.getItem(HAD_SESSION_STORAGE_KEY) === "true");

  // Privacy mode status (locked/unlocked)
  const [isPrivateMode, setIsPrivateMode] = useState(true);
  const [showSensitiveInfo, setShowSensitiveInfo] = useState(false);
  const [siteConfig, setSiteConfig] = useState(DEFAULT_SITE_CONFIG);

  // Local theme state
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("giapha_tc_theme");
    return saved || "dark"; // Default to dark mode for premium look
  });

  // View states
  const [activeView, setActiveView] = useState(initialBrowserView.view);
  const [viewHistory, setViewHistory] = useState([]);
  const [accountPageMode, setAccountPageMode] = useState(initialBrowserView.accountMode);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPersonId, setSelectedPersonId] = useState(null);
  const [activeViewersCount, setActiveViewersCount] = useState(0);
  const [readNotificationIds, setReadNotificationIds] = useState(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem(READ_NOTIFICATION_STORAGE_KEY) || "[]");
      return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
    } catch {
      return [];
    }
  });
  const swipeStartRef = useRef(null);

  // Modals visibility
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  
  // Member edit/add contexts
  const [editPerson, setEditPerson] = useState(null);
  const [addRelativeOf, setAddRelativeOf] = useState(null);

  // Toast feedback
  const [toast, setToast] = useState("");
  const toastTimeoutRef = useRef(null);

  // Sync theme with HTML attribute
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("giapha_tc_theme", theme);
  }, [theme]);

  useEffect(() => {
    updateSeoHead(siteConfig);
  }, [siteConfig]);

  useEffect(() => {
    for (const name of LEGACY_THEME_VARIABLES) {
      document.documentElement.style.removeProperty(name);
    }
    const themeVariables = buildThemeCssVariables(siteConfig);
    for (const [name, value] of Object.entries(themeVariables)) {
      document.documentElement.style.setProperty(name, value);
    }
  }, [siteConfig]);

  const buildMembersUrl = useCallback((revealSensitive) => {
    const shouldReveal = Boolean(revealSensitive);
    return shouldReveal ? "/api/members?revealSensitive=true" : "/api/members";
  }, []);

  const shouldRevealSensitiveByDefault = useCallback((user, privateMode) => {
    return Boolean(privateMode && canEditMembers(user));
  }, []);

  const loadMembers = useCallback(async (revealSensitive = false) => {
    const res = await fetch(buildMembersUrl(revealSensitive));
    const data = await res.json();
    if (data.success) {
      setMembers(data.data);
      setShowSensitiveInfo(Boolean(data.sensitiveInfoVisible));
    }
    return data;
  }, [buildMembersUrl]);

  const loadHistoryEvents = useCallback(async () => {
    const res = await fetch("/api/history-events");
    const data = await res.json();
    if (data.success) {
      setHistoryEvents(data.data);
    }
    return data;
  }, []);

  const closeTransientOverlays = useCallback(() => {
    setSelectedPersonId(null);
    setIsLoginModalOpen(false);
    setIsMemberModalOpen(false);
    setEditPerson(null);
    setAddRelativeOf(null);
  }, []);

  useEffect(() => {
    const initial = parseBrowserViewState();
    window.history.replaceState(
      { page: initial.view, mode: initial.accountMode },
      "",
      buildBrowserViewUrl(initial.view, initial.accountMode)
    );

    const handleBrowserPopState = () => {
      const next = parseBrowserViewState();
      closeTransientOverlays();
      setActiveView(next.view);
      setAccountPageMode(next.view === "accounts" ? next.accountMode : "manage");
      setViewHistory((history) => history.slice(0, -1));
    };

    window.addEventListener("popstate", handleBrowserPopState);
    return () => {
      window.removeEventListener("popstate", handleBrowserPopState);
    };
  }, [closeTransientOverlays]);

  // Load user session, settings, and family tree data on mount
  useEffect(() => {
    const initApp = async () => {
      setLoading(true);
      setAuthReady(false);
      let user = null;
      let pMode = true;

      // 1. Fetch user session
      try {
        const authRes = await fetch("/api/auth/me");
        const authData = await authRes.json();
        if (authData.success) {
          user = authData.user;
          setCurrentUser(user);
          setHadSessionHint(true);
          localStorage.setItem(HAD_SESSION_STORAGE_KEY, "true");
        } else {
          setHadSessionHint(false);
          localStorage.removeItem(HAD_SESSION_STORAGE_KEY);
        }
      } catch (err) {
        console.error("Auth check failed:", err);
      }

      // 2. Fetch security settings
      try {
        const settingsRes = await fetch("/api/settings");
        const settingsData = await settingsRes.json();
        if (settingsData.success) {
          pMode = settingsData.privateMode;
          setIsPrivateMode(pMode);
          setSiteConfig(normalizeSiteConfig(settingsData.siteConfig));
        }
      } catch (err) {
        console.error("Settings fetch failed:", err);
      }

      // 3. Load family members if page is not locked
      const isLocked = pMode && !isAuthenticatedViewer(user);
      if (!isLocked) {
        try {
          await loadMembers(shouldRevealSensitiveByDefault(user, pMode));
          await loadHistoryEvents();
        } catch (err) {
          console.error("Initial data fetch failed:", err);
        }
      }
      setAuthReady(true);
      setLoading(false);
    };

    initApp();
  }, [loadHistoryEvents, loadMembers, shouldRevealSensitiveByDefault]);

  const showToast = useCallback((message) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToast(message);
    toastTimeoutRef.current = setTimeout(() => {
      setToast("");
      toastTimeoutRef.current = null;
    }, 3000);
  }, []);

  useEffect(() => () => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
  }, []);

  const openLoginModal = useCallback(() => {
    if (!authReady || currentUser) return;
    setIsLoginModalOpen(true);
  }, [authReady, currentUser]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const handleViewChange = useCallback((view, options = {}) => {
    if (!VALID_APP_VIEWS.has(view)) return;
    const nextAccountMode = view === "accounts"
      ? (options.accountMode || accountPageMode || "manage")
      : "manage";
    if (!options.replace && view === activeView && nextAccountMode === accountPageMode) {
      closeTransientOverlays();
      return;
    }

    closeTransientOverlays();
    if (view !== "accounts") {
      setAccountPageMode("manage");
    } else {
      setAccountPageMode(nextAccountMode);
    }
    setViewHistory((history) => pushViewHistory(history, activeView, view));
    setActiveView(view);
    if (options.replace) {
      window.history.replaceState({ page: view, mode: nextAccountMode }, "", buildBrowserViewUrl(view, nextAccountMode));
    } else {
      window.history.pushState({ page: view, mode: nextAccountMode }, "", buildBrowserViewUrl(view, nextAccountMode));
    }
  }, [accountPageMode, activeView, closeTransientOverlays]);

  const handleGoBack = useCallback(() => {
    if (window.history.length > 1) {
      window.history.back();
      return;
    }

    if (!viewHistory.length) return;

    closeTransientOverlays();
    const { previousView, history } = getPreviousView(viewHistory, activeView);
    setViewHistory(history);
    if (previousView !== "accounts") {
      setAccountPageMode("manage");
    }
    setActiveView(previousView);
    window.history.replaceState({ page: previousView, mode: "manage" }, "", buildBrowserViewUrl(previousView, "manage"));
  }, [activeView, closeTransientOverlays, viewHistory]);

  const handleOpenAccounts = (mode = "manage") => {
    handleViewChange("accounts", { accountMode: mode });
  };

  const handleOpenHistoryAdmin = () => {
    setAccountPageMode("manage");
    handleViewChange("history-admin");
  };

  const handleLogin = async (user) => {
    setCurrentUser(user);
    setHadSessionHint(true);
    localStorage.setItem(HAD_SESSION_STORAGE_KEY, "true");
    showToast(`Đăng nhập thành công với vai trò ${getRoleLabel(user.role)}!`);

    // Reload settings and members lists
    try {
      const settingsRes = await fetch("/api/settings");
      const settingsData = await settingsRes.json();
      let pMode = true;
      if (settingsData.success) {
        pMode = settingsData.privateMode;
        setIsPrivateMode(pMode);
        setSiteConfig(normalizeSiteConfig(settingsData.siteConfig));
      }

      const isLocked = pMode && !isAuthenticatedViewer(user);
      if (!isLocked) {
        await loadMembers(shouldRevealSensitiveByDefault(user, pMode));
        await loadHistoryEvents();
      } else {
        setMembers([]);
        setHistoryEvents([]);
        setShowSensitiveInfo(false);
      }
    } catch (err) {
      console.error("Login follow-up reload failed:", err);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setCurrentUser(null);
      setHadSessionHint(false);
      localStorage.removeItem(HAD_SESSION_STORAGE_KEY);
      setMembers([]);
      setHistoryEvents([]);
      setShowSensitiveInfo(false);
      setSelectedPersonId(null);
      showToast("Đã đăng xuất khỏi hệ thống.");
    } catch {
      showToast("Lỗi kết nối máy chủ khi đăng xuất.");
    }
  };

  const handleTogglePrivateMode = async (newVal) => {
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ privateMode: newVal })
      });
      const data = await res.json();

      if (data.success) {
        setIsPrivateMode(newVal);
        if (data.siteConfig) setSiteConfig(normalizeSiteConfig(data.siteConfig));
        const revealSensitive = shouldRevealSensitiveByDefault(currentUser, newVal);
        setShowSensitiveInfo(revealSensitive);
        showToast(newVal ? "Đã chuyển sang chế độ riêng tư." : "Đã chuyển sang chế độ công khai.");
        
        // Reload family tree data based on new lock state
        const isLocked = newVal && !isAuthenticatedViewer(currentUser);
        if (!isLocked) {
          const memData = await loadMembers(revealSensitive);
          if (!memData.success) showToast(memData.error || "Không thể tải dữ liệu gia phả.");
          const historyData = await loadHistoryEvents();
          if (!historyData.success) showToast(historyData.error || "Không thể tải lịch sử dòng họ.");
        } else {
          setMembers([]);
          setHistoryEvents([]);
          setSelectedPersonId(null);
        }
      } else {
        showToast(data.error || "Không thể cập nhật cấu hình bảo mật.");
      }
    } catch {
      showToast("Lỗi kết nối máy chủ.");
    }
  };

  const handleSiteConfigSave = async (nextConfig) => {
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteConfig: nextConfig })
      });
      const data = await res.json();

      if (data.success) {
        setSiteConfig(normalizeSiteConfig(data.siteConfig));
        showToast("Đã cập nhật cấu hình website.");
        return { success: true };
      }

      showToast(data.error || "Không thể cập nhật cấu hình website.");
      return { success: false, error: data.error };
    } catch {
      showToast("Lỗi kết nối máy chủ.");
      return { success: false, error: "network" };
    }
  };

  const handleCmsPackageImported = async () => {
    const settingsRes = await fetch("/api/settings");
    const settingsData = await settingsRes.json();
    let nextPrivateMode = isPrivateMode;
    if (settingsData.success) {
      nextPrivateMode = settingsData.privateMode;
      setIsPrivateMode(nextPrivateMode);
      setSiteConfig(normalizeSiteConfig(settingsData.siteConfig));
    }

    const isLockedAfterImport = nextPrivateMode && !isAuthenticatedViewer(currentUser);
    if (isLockedAfterImport) {
      setMembers([]);
      setHistoryEvents([]);
      setSelectedPersonId(null);
      return;
    }

    await loadMembers(shouldRevealSensitiveByDefault(currentUser, nextPrivateMode));
    await loadHistoryEvents();
  };

  const handleSelectPerson = (id) => {
    setSelectedPersonId(id);
  };

  const handleToggleSensitiveInfo = async (newVal) => {
    try {
      const data = await loadMembers(newVal);
      if (data.success) {
        showToast(newVal ? "Đã bật xem thông tin riêng." : "Đã ẩn thông tin riêng.");
      } else {
        setShowSensitiveInfo(false);
        showToast(data.error || "Không thể cập nhật chế độ xem thông tin riêng.");
      }
    } catch {
      setShowSensitiveInfo(false);
      showToast("Lỗi kết nối máy chủ.");
    }
  };

  const handleOpenPersonInTree = (id) => {
    handleViewChange("tree");
    setSelectedPersonId(id);
  };

  const handleCloseSidebar = () => {
    setSelectedPersonId(null);
  };

  const handleAddMember = () => {
    setEditPerson(null);
    setAddRelativeOf(null);
    setIsMemberModalOpen(true);
  };

  const handleEditPerson = (person) => {
    setEditPerson(person);
    setAddRelativeOf(null);
    setIsMemberModalOpen(true);
  };

  const handleAddRelative = (parent) => {
    setAddRelativeOf(parent);
    setEditPerson(null);
    setIsMemberModalOpen(true);
  };

  const handleMemberSubmit = async (formData) => {
    try {
      let res;
      if (editPerson) {
        // Update member
        res = await fetch(`/api/members/${formData.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData)
        });
      } else {
        // Add new member
        const newMember = { ...formData };
        if (addRelativeOf) {
          if (addRelativeOf.gender === "nam") {
            newMember.fatherId = addRelativeOf.id;
          } else {
            newMember.motherId = addRelativeOf.id;
          }
          newMember.generation = addRelativeOf.generation + 1;
        }
        res = await fetch("/api/members", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newMember)
        });
      }

      const data = await res.json();
      if (data.success) {
        showToast(editPerson ? "Đã cập nhật thông tin thành viên!" : "Đã thêm thành viên mới thành công!");
        
        // Reload members list from database
        const memData = await loadMembers(showSensitiveInfo);
        if (memData.success) {
          if (!editPerson) {
            // Select the newly added member
            setSelectedPersonId(data.id);
          }
        }
        setIsMemberModalOpen(false);
        setEditPerson(null);
        setAddRelativeOf(null);
      } else {
        showToast(data.error || "Thao tác thất bại.");
      }
    } catch {
      showToast("Lỗi kết nối tới máy chủ.");
    }
  };

  // Determine if application is locked under Private Mode
  const isLocked = isPrivateMode && !isAuthenticatedViewer(currentUser);
  const shouldHoldAuthGate = !authReady;
  const shouldUseGuestNavbar = isLocked && !(shouldHoldAuthGate && hadSessionHint);
  const canRevealSensitiveInfo = isPrivateMode && canEditMembers(currentUser);
  const canGoBack = viewHistory.length > 0;
  const notifications = useMemo(() => buildFamilyNotifications({
    members,
    historyEvents,
    currentUser,
    isPrivateMode,
    activeViewersCount,
    siteConfig
  }), [activeViewersCount, currentUser, historyEvents, isPrivateMode, members, siteConfig]);

  const unreadNotificationCount = useMemo(() => {
    const readSet = new Set(readNotificationIds);
    return notifications.filter((item) => !readSet.has(item.id)).length;
  }, [notifications, readNotificationIds]);

  const markNotificationsRead = useCallback((ids) => {
    const nextIds = Array.isArray(ids) ? ids : [ids];
    setReadNotificationIds((prev) => {
      const next = Array.from(new Set([...prev, ...nextIds.filter(Boolean)]));
      localStorage.setItem(READ_NOTIFICATION_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    markNotificationsRead(notifications.map((item) => item.id));
  }, [markNotificationsRead, notifications]);

  const handleNotificationAction = useCallback((notification) => {
    if (!notification) return;
    markNotificationsRead(notification.id);

    if (notification.action?.type === "member") {
      setSelectedPersonId(notification.action.memberId);
      return;
    }

    if (notification.action?.type === "view" && notification.action.view) {
      handleViewChange(notification.action.view);
    }
  }, [handleViewChange, markNotificationsRead]);

  useEffect(() => {
    let cancelled = false;
    let intervalId = null;
    let viewerId = null;

    const sendLeave = () => {
      if (!viewerId) return;
      const body = JSON.stringify({ viewerId });
      if (navigator.sendBeacon) {
        navigator.sendBeacon("/api/viewer-presence/leave", new Blob([body], { type: "application/json" }));
        return;
      }
      fetch("/api/viewer-presence/leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true
      }).catch(() => {});
    };

    const sendHeartbeat = async () => {
      if (document.visibilityState === "hidden") return;
      try {
        const res = await fetch("/api/viewer-presence/heartbeat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ viewerId })
        });
        const data = await res.json();
        if (!cancelled && data.success) {
          setActiveViewersCount(Number(data.activeViewers || 0));
        }
      } catch (err) {
        console.error("Viewer presence heartbeat failed:", err);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        sendLeave();
      } else {
        sendHeartbeat();
      }
    };

    if (isLocked) {
      return undefined;
    }

    viewerId = getOrCreateViewerId();
    sendHeartbeat();
    intervalId = window.setInterval(sendHeartbeat, 25000);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", sendLeave);

    return () => {
      cancelled = true;
      if (intervalId) window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", sendLeave);
      sendLeave();
    };
  }, [isLocked]);

  const handleTouchStart = useCallback((event) => {
    const touch = event.touches[0];
    const isMobileWidth = window.matchMedia?.("(max-width: 768px)")?.matches ?? window.innerWidth <= 768;

    if (
      !canGoBack ||
      !isMobileWidth ||
      isLoginModalOpen ||
      isMemberModalOpen ||
      selectedPersonId ||
      shouldIgnoreSwipeTarget(event.target) ||
      touch.clientX > 24
    ) {
      swipeStartRef.current = null;
      return;
    }

    swipeStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    };
  }, [canGoBack, isLoginModalOpen, isMemberModalOpen, selectedPersonId]);

  const handleTouchEnd = useCallback((event) => {
    const start = swipeStartRef.current;
    swipeStartRef.current = null;
    if (!start || shouldIgnoreSwipeTarget(event.target)) return;

    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - start.x;
    const deltaY = Math.abs(touch.clientY - start.y);
    const elapsed = Date.now() - start.time;

    if (deltaX >= 72 && deltaY <= 48 && elapsed <= 900) {
      handleGoBack();
    }
  }, [handleGoBack]);

  return (
    <div
      className="app-container"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={() => {
        swipeStartRef.current = null;
      }}
    >
      {/* Top Navbar */}
      <Navbar
        siteConfig={siteConfig}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        members={members}
        activeView={activeView}
        setActiveView={handleViewChange}
        canGoBack={canGoBack}
        onBack={handleGoBack}
        suppressOverlays={Boolean(isLoginModalOpen || isMemberModalOpen)}
        currentUser={currentUser}
        authReady={authReady}
        isGuestLocked={shouldUseGuestNavbar}
        setIsLoginModalOpen={openLoginModal}
        onLogout={handleLogout}
        isPrivateMode={isPrivateMode}
        setIsPrivateMode={handleTogglePrivateMode}
        theme={theme}
        toggleTheme={toggleTheme}
        onAddMember={handleAddMember}
        showSensitiveInfo={showSensitiveInfo}
        canRevealSensitiveInfo={canRevealSensitiveInfo}
        onToggleSensitiveInfo={handleToggleSensitiveInfo}
        onOpenAccounts={handleOpenAccounts}
        onOpenHistoryAdmin={handleOpenHistoryAdmin}
        onSearchSelectMember={handleOpenPersonInTree}
        notifications={notifications}
        unreadNotificationCount={unreadNotificationCount}
        readNotificationIds={readNotificationIds}
        onNotificationAction={handleNotificationAction}
        onMarkAllNotificationsRead={markAllNotificationsRead}
      />

      {/* Main split display */}
      <div className="main-content">
        {shouldHoldAuthGate ? (
          <div className="auth-hydration-blank" aria-hidden="true" />
        ) : isLocked ? (
          // Private Lock Screen
          <div className="lock-screen animate-fade">
            <div className="lock-container glass">
              <span className="lock-icon">🔒</span>
              <h2>Gia Phả Đang Khóa Riêng Tư</h2>
              <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                {siteConfig.siteTitle} hiện đang ở chế độ bảo mật nội bộ.
                Chỉ các thành viên có tài khoản được cấp phép mới có quyền truy cập xem thông tin.
              </p>
              <button
                className="btn btn-primary"
                onClick={openLoginModal}
                style={{ width: "100%", marginTop: "10px" }}
              >
                🔑 Đăng nhập ngay
              </button>
            </div>
          </div>
        ) : (
          // Unlocked Work View
          <>
            <div className="viewport-container">
              {activeView === "home" ? (
                <Homepage
                  siteConfig={siteConfig}
                  onNavigate={handleViewChange}
                  onOpenPerson={handleOpenPersonInTree}
                  onOpenPersonModal={handleSelectPerson}
                  members={members}
                  historyEvents={historyEvents}
                  isLoading={loading}
                  activeViewersCount={activeViewersCount}
                />
              ) : activeView === "tree" ? (
                <TreeChart
                  members={members}
                  selectedPersonId={selectedPersonId}
                  onSelectPerson={handleSelectPerson}
                  searchQuery={searchQuery}
                />
              ) : activeView === "generations" ? (
                <GenerationsPage
                  members={members}
                  isLoading={loading}
                  onOpenPerson={handleSelectPerson}
                />
              ) : activeView === "featured" ? (
                <FeaturedMembersPage
                  members={members}
                  isLoading={loading}
                  onOpenPerson={handleSelectPerson}
                />
              ) : activeView === "anniversary" ? (
                <AnniversaryPage
                  members={members}
                  isLoading={loading}
                  onOpenPerson={handleSelectPerson}
                  siteConfig={siteConfig}
                />
              ) : activeView === "history" ? (
                <FamilyHistoryPage
                  events={historyEvents}
                  isLoading={loading}
                />
              ) : activeView === "about" && normalizeSiteConfig(siteConfig).aboutPage.enabled ? (
                <AboutPage siteConfig={siteConfig} />
              ) : activeView === "accounts" ? (
                <AccountAdminPage
                  currentUser={currentUser}
                  members={members}
                  mode={ENABLE_SETUP_WIZARD ? accountPageMode : (accountPageMode === "password" ? "password" : "manage")}
                  siteConfig={siteConfig}
                  isPrivateMode={isPrivateMode}
                  onToast={showToast}
                  onSiteConfigSave={handleSiteConfigSave}
                  onPrivateModeChange={handleTogglePrivateMode}
                  onOpenSetupWizard={() => ENABLE_SETUP_WIZARD && setAccountPageMode("setup")}
                  onCmsPackageImported={handleCmsPackageImported}
                  onMembersSynced={() => loadMembers(showSensitiveInfo)}
                />
              ) : activeView === "history-admin" ? (
                <HistoryAdminPage
                  currentUser={currentUser}
                  members={members}
                  onToast={showToast}
                  onEventsChanged={setHistoryEvents}
                  onPreviewHistory={() => handleViewChange("history")}
                />
              ) : (
                <MemberList
                  members={members}
                  onSelectPerson={handleSelectPerson}
                  searchQuery={searchQuery}
                  siteConfig={siteConfig}
                />
              )}
            </div>

            {/* Sidebar Details Panel */}
            {selectedPersonId && (
              <>
                <div className="sidebar-backdrop" onClick={handleCloseSidebar} />
                <Sidebar
                  personId={selectedPersonId}
                  members={members}
                  onSelectPerson={handleSelectPerson}
                  onClose={handleCloseSidebar}
                  onEditPerson={handleEditPerson}
                  onAddRelative={handleAddRelative}
                  currentUser={currentUser}
                  showSensitiveInfo={showSensitiveInfo}
                  siteConfig={siteConfig}
                />
              </>
            )}
          </>
        )}
      </div>

      {/* Modals & Popups */}
      <LoginModal
        isOpen={authReady && !currentUser && isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLogin={handleLogin}
        siteConfig={siteConfig}
      />

      {isMemberModalOpen && (
        <MemberModal
          key={editPerson?.id || addRelativeOf?.id || "new-member"}
          isOpen={isMemberModalOpen}
          onClose={() => setIsMemberModalOpen(false)}
          onSubmit={handleMemberSubmit}
          editPerson={editPerson}
          addRelativeOf={addRelativeOf}
          members={members}
          currentUser={currentUser}
          siteConfig={siteConfig}
        />
      )}

      {/* Toast Notification */}
      {toast && <div className="toast animate-slide-up">{toast}</div>}
    </div>
  );
}
