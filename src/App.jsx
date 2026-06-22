import { useCallback, useMemo, useState, useEffect, useRef } from "react";
import Navbar from "./components/Navbar";
import Homepage from "./components/Homepage";
import TreeChart from "./components/TreeChart";
import MemberList from "./components/MemberList";
import FeaturedMembersPage from "./components/FeaturedMembersPage";
import AnniversaryPage from "./components/AnniversaryPage";
import GenerationsPage from "./components/GenerationsPage";
import AccountAdminPage from "./components/AccountAdminPage";
import { ENABLE_SETUP_WIZARD } from "./config/cmsRuntime";
import HistoryAdminPage from "./components/HistoryAdminPage";
import FamilyHistoryPage from "./components/FamilyHistoryPage";
import Sidebar from "./components/Sidebar";
import MemberModal from "./components/MemberModal";
import LoginModal from "./components/LoginModal";
import { canEditMembers, getRoleLabel, isAuthenticatedViewer } from "./utils/authRoles";
import { buildFamilyNotifications } from "./utils/notificationUtils";
import { DEFAULT_SITE_CONFIG, buildThemeCssVariables, normalizeSiteConfig } from "./utils/siteConfigUtils";
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

const getOrCreateViewerId = () => {
  const existing = localStorage.getItem(VIEWER_ID_STORAGE_KEY);
  if (existing && VIEWER_ID_PATTERN.test(existing)) return existing;

  const nextId = crypto.randomUUID?.() || `viewer_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  localStorage.setItem(VIEWER_ID_STORAGE_KEY, nextId);
  return nextId;
};

export default function App() {
  // Family tree members from database
  const [members, setMembers] = useState([]);
  const [historyEvents, setHistoryEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Authenticated user state
  const [currentUser, setCurrentUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);

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
  const [activeView, setActiveView] = useState("home");
  const [viewHistory, setViewHistory] = useState([]);
  const [accountPageMode, setAccountPageMode] = useState("manage");
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

  // Sync theme with HTML attribute
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("giapha_tc_theme", theme);
  }, [theme]);

  useEffect(() => {
    document.title = siteConfig.siteTitle;
  }, [siteConfig.siteTitle]);

  useEffect(() => {
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

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(""), 3000);
  };

  const openLoginModal = useCallback(() => {
    if (!authReady || currentUser) return;
    setIsLoginModalOpen(true);
  }, [authReady, currentUser]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const handleViewChange = useCallback((view) => {
    closeTransientOverlays();
    if (view !== "accounts") {
      setAccountPageMode("manage");
    }
    setViewHistory((history) => pushViewHistory(history, activeView, view));
    setActiveView(view);
  }, [activeView, closeTransientOverlays]);

  const handleGoBack = useCallback(() => {
    if (!viewHistory.length) return;

    closeTransientOverlays();
    const { previousView, history } = getPreviousView(viewHistory, activeView);
    setViewHistory(history);
    if (previousView !== "accounts") {
      setAccountPageMode("manage");
    }
    setActiveView(previousView);
  }, [activeView, closeTransientOverlays, viewHistory]);

  const handleOpenAccounts = (mode = "manage") => {
    setAccountPageMode(mode);
    handleViewChange("accounts");
  };

  const handleOpenHistoryAdmin = () => {
    setAccountPageMode("manage");
    handleViewChange("history-admin");
  };

  const handleLogin = async (user) => {
    setCurrentUser(user);
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
  const isAuthInitializing = !authReady;
  const canRevealSensitiveInfo = isPrivateMode && canEditMembers(currentUser);
  const canGoBack = viewHistory.length > 0;
  const notifications = useMemo(() => buildFamilyNotifications({
    members,
    historyEvents,
    currentUser,
    isPrivateMode,
    activeViewersCount
  }), [activeViewersCount, currentUser, historyEvents, isPrivateMode, members]);

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
        {isAuthInitializing ? (
          <div className="lock-screen animate-fade">
            <div className="lock-container glass">
              <span className="lock-icon">⌛</span>
              <h2>Đang kiểm tra phiên đăng nhập</h2>
              <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                Hệ thống đang xác minh tài khoản hiện tại.
              </p>
            </div>
          </div>
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
                />
              ) : activeView === "history" ? (
                <FamilyHistoryPage
                  events={historyEvents}
                  isLoading={loading}
                />
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
        />
      )}

      {/* Toast Notification */}
      {toast && <div className="toast animate-slide-up">{toast}</div>}
    </div>
  );
}
