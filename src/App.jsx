import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import Homepage from "./components/Homepage";
import TreeChart from "./components/TreeChart";
import MemberList from "./components/MemberList";
import Sidebar from "./components/Sidebar";
import MemberModal from "./components/MemberModal";
import LoginModal from "./components/LoginModal";
import "./App.css";

export default function App() {
  // Family tree members from database
  const [members, setMembers] = useState([]);

  // Authenticated user state
  const [currentUser, setCurrentUser] = useState(null);

  // Privacy mode status (locked/unlocked)
  const [isPrivateMode, setIsPrivateMode] = useState(true);

  // Local theme state
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("giapha_tc_theme");
    return saved || "dark"; // Default to dark mode for premium look
  });

  // View states
  const [activeView, setActiveView] = useState("home"); // "home", "tree" or "list"
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

  // Load user session, settings, and family tree data on mount
  useEffect(() => {
    const initApp = async () => {
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
      const isLocked = pMode && (!user || user.role === "guest");
      if (!isLocked) {
        try {
          const res = await fetch("/api/members");
          const data = await res.json();
          if (data.success) {
            setMembers(data.data);
          }
        } catch (err) {
          console.error("Members fetch failed:", err);
        }
      }
    };

    initApp();
  }, []);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(""), 3000);
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const handleLogin = async (user) => {
    setCurrentUser(user);
    showToast(`Đăng nhập thành công với vai trò ${user.role.toUpperCase()}!`);

    // Reload settings and members lists
    try {
      const settingsRes = await fetch("/api/settings");
      const settingsData = await settingsRes.json();
      let pMode = true;
      if (settingsData.success) {
        pMode = settingsData.privateMode;
        setIsPrivateMode(pMode);
      }

      const isLocked = pMode && (user.role === "guest");
      if (!isLocked) {
        const res = await fetch("/api/members");
        const data = await res.json();
        if (data.success) {
          setMembers(data.data);
        }
      } else {
        setMembers([]);
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
      setSelectedPersonId(null);
      showToast("Đã đăng xuất khỏi hệ thống.");
    } catch (err) {
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
        showToast(newVal ? "Đã chuyển sang chế độ riêng tư." : "Đã chuyển sang chế độ công khai.");
        
        // Reload family tree data based on new lock state
        const isLocked = newVal && (!currentUser || currentUser.role === "guest");
        if (!isLocked) {
          const memRes = await fetch("/api/members");
          const memData = await memRes.json();
          if (memData.success) setMembers(memData.data);
        } else {
          setMembers([]);
          setSelectedPersonId(null);
        }
      } else {
        showToast(data.error || "Không thể cập nhật cấu hình bảo mật.");
      }
    } catch (err) {
      showToast("Lỗi kết nối máy chủ.");
    }
  };

  const handleSelectPerson = (id) => {
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
        const memRes = await fetch("/api/members");
        const memData = await memRes.json();
        if (memData.success) {
          setMembers(memData.data);
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
    } catch (err) {
      showToast("Lỗi kết nối tới máy chủ.");
    }
  };

  // Determine if application is locked under Private Mode
  const isLocked = isPrivateMode && (!currentUser || currentUser.role === "guest");

  return (
    <div className="app-container">
      {/* Top Navbar */}
      <Navbar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        activeView={activeView}
        setActiveView={setActiveView}
        currentUser={currentUser}
        setIsLoginModalOpen={setIsLoginModalOpen}
        onLogout={handleLogout}
        isPrivateMode={isPrivateMode}
        setIsPrivateMode={handleTogglePrivateMode}
        theme={theme}
        toggleTheme={toggleTheme}
        onAddMember={handleAddMember}
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
                <Homepage onNavigate={setActiveView} members={members} />
              ) : activeView === "tree" ? (
                <TreeChart
                  members={members}
                  selectedPersonId={selectedPersonId}
                  onSelectPerson={handleSelectPerson}
                  searchQuery={searchQuery}
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

      <MemberModal
        isOpen={isMemberModalOpen}
        onClose={() => setIsMemberModalOpen(false)}
        onSubmit={handleMemberSubmit}
        editPerson={editPerson}
        addRelativeOf={addRelativeOf}
        members={members}
      />

      {/* Toast Notification */}
      {toast && <div className="toast animate-slide-up">{toast}</div>}
    </div>
  );
}
