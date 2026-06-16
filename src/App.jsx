import { useCallback, useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import Homepage from "./components/Homepage";
import TreeChart from "./components/TreeChart";
import MemberList from "./components/MemberList";
import FeaturedMembersPage from "./components/FeaturedMembersPage";
import AnniversaryPage from "./components/AnniversaryPage";
import GenerationsPage from "./components/GenerationsPage";
import AccountAdminPage from "./components/AccountAdminPage";
import Sidebar from "./components/Sidebar";
import MemberModal from "./components/MemberModal";
import LoginModal from "./components/LoginModal";
import { getRoleLabel, isAuthenticatedViewer } from "./utils/authRoles";
import "./App.css";

export default function App() {
  // Family tree members from database
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Authenticated user state
  const [currentUser, setCurrentUser] = useState(null);

  // Privacy mode status (locked/unlocked)
  const [isPrivateMode, setIsPrivateMode] = useState(true);
  const [showSensitiveInfo, setShowSensitiveInfo] = useState(false);

  // Local theme state
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("giapha_tc_theme");
    return saved || "dark"; // Default to dark mode for premium look
  });

  // View states
  const [activeView, setActiveView] = useState("home");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPersonId, setSelectedPersonId] = useState(null);

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

  const buildMembersUrl = useCallback((revealSensitive) => {
    const shouldReveal = Boolean(revealSensitive);
    return shouldReveal ? "/api/members?revealSensitive=true" : "/api/members";
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

  // Load user session, settings, and family tree data on mount
  useEffect(() => {
    const initApp = async () => {
      setLoading(true);
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
        }
      } catch (err) {
        console.error("Settings fetch failed:", err);
      }

      // 3. Load family members if page is not locked
      const isLocked = pMode && !isAuthenticatedViewer(user);
      if (!isLocked) {
        try {
          await loadMembers(false);
        } catch (err) {
          console.error("Members fetch failed:", err);
        }
      }
      setLoading(false);
    };

    initApp();
  }, [loadMembers]);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(""), 3000);
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const handleViewChange = (view) => {
    if (view !== activeView && selectedPersonId) {
      setSelectedPersonId(null);
    }
    setActiveView(view);
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
      }

      const isLocked = pMode && !isAuthenticatedViewer(user);
      if (!isLocked) {
        await loadMembers(false);
      } else {
        setMembers([]);
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
        setShowSensitiveInfo(false);
        showToast(newVal ? "Đã chuyển sang chế độ riêng tư." : "Đã chuyển sang chế độ công khai.");
        
        // Reload family tree data based on new lock state
        const isLocked = newVal && !isAuthenticatedViewer(currentUser);
        if (!isLocked) {
          const memData = await loadMembers(false);
          if (!memData.success) showToast(memData.error || "Không thể tải dữ liệu gia phả.");
        } else {
          setMembers([]);
          setSelectedPersonId(null);
        }
      } else {
        showToast(data.error || "Không thể cập nhật cấu hình bảo mật.");
      }
    } catch {
      showToast("Lỗi kết nối máy chủ.");
    }
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
    setActiveView("tree");
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
  const canRevealSensitiveInfo = isPrivateMode && isAuthenticatedViewer(currentUser);

  return (
    <div className="app-container">
      {/* Top Navbar */}
      <Navbar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        activeView={activeView}
        setActiveView={handleViewChange}
        currentUser={currentUser}
        setIsLoginModalOpen={setIsLoginModalOpen}
        onLogout={handleLogout}
        isPrivateMode={isPrivateMode}
        setIsPrivateMode={handleTogglePrivateMode}
        theme={theme}
        toggleTheme={toggleTheme}
        onAddMember={handleAddMember}
        showSensitiveInfo={showSensitiveInfo}
        canRevealSensitiveInfo={canRevealSensitiveInfo}
        onToggleSensitiveInfo={handleToggleSensitiveInfo}
      />

      {/* Main split display */}
      <div className="main-content">
        {isLocked ? (
          // Private Lock Screen
          <div className="lock-screen animate-fade">
            <div className="lock-container glass">
              <span className="lock-icon">🔒</span>
              <h2>Gia Phả Đang Khóa Riêng Tư</h2>
              <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                Hệ thống gia phả họ Trần Công hiện đang ở chế độ bảo mật nội bộ.
                Chỉ các thành viên có tài khoản được cấp phép mới có quyền truy cập xem thông tin.
              </p>
              <button
                className="btn btn-primary"
                onClick={() => setIsLoginModalOpen(true)}
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
                  onNavigate={handleViewChange}
                  onOpenPerson={handleOpenPersonInTree}
                  members={members}
                  isLoading={loading}
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
                  onOpenPerson={handleOpenPersonInTree}
                />
              ) : activeView === "anniversary" ? (
                <AnniversaryPage
                  members={members}
                  isLoading={loading}
                  onOpenPerson={handleSelectPerson}
                />
              ) : activeView === "accounts" ? (
                <AccountAdminPage
                  currentUser={currentUser}
                  members={members}
                  onToast={showToast}
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
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLogin={handleLogin}
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
