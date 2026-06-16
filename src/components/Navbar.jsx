import { useState } from "react";
import {
  Bell,
  BookOpenText,
  CalendarDays,
  ChevronDown,
  Eye,
  EyeOff,
  LogOut,
  LockKeyhole,
  Moon,
  Network,
  Search,
  ShieldCheck,
  Sun,
  UserCog,
  Users
} from "lucide-react";
import { getAvatarInitials, getAvatarStyle } from "../utils/avatarUtils";
import { getRoleLabel, isAdmin } from "../utils/authRoles";

export default function Navbar({
  searchQuery,
  setSearchQuery,
  activeView,
  setActiveView,
  currentUser,
  setIsLoginModalOpen,
  onLogout,
  isPrivateMode,
  setIsPrivateMode,
  theme,
  toggleTheme,
  onAddMember,
  showSensitiveInfo,
  canRevealSensitiveInfo,
  onToggleSensitiveInfo,
  onOpenAccounts
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userDisplayName = currentUser?.fullName || currentUser?.displayName || currentUser?.username || "";
  const userAvatar = currentUser?.avatar || currentUser?.photoURL || currentUser?.image;
  const canAddTopLevelMember = currentUser?.role === "admin" || (currentUser?.role === "editor" && !currentUser?.editScopeRootId);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((prev) => !prev);
  };

  return (
    <nav className="navbar glass">
      <button
        type="button"
        className="nav-brand"
        onClick={() => setActiveView("home")}
        aria-label="Về trang chủ"
      >
        <span className="logo-icon">
          <img src="/tranconglogo.png" alt="" aria-hidden="true" />
        </span>
        <span className="logo-text" aria-label="Gia Phả Họ Trần Công">
          <span className="logo-text-kicker">Gia Phả Họ</span>
          <span className="logo-text-main">Trần Công</span>
        </span>
      </button>

      {/* Desktop Navigation (Hidden on Mobile) */}
      <div className="nav-actions desktop-nav">
        {/* View toggles */}
        <div className="btn-group">
          <button
            className={`btn-tab ${activeView === "tree" ? "active" : ""}`}
            onClick={() => setActiveView("tree")}
          >
            <Network className="nav-tab-icon" aria-hidden="true" strokeWidth={2.2} />
            Cây gia phả
          </button>
          <button
            className={`btn-tab ${activeView === "generations" ? "active" : ""}`}
            onClick={() => setActiveView("generations")}
          >
            <BookOpenText className="nav-tab-icon" aria-hidden="true" strokeWidth={2.2} />
            Các đời
          </button>
          <button
            className={`btn-tab ${activeView === "anniversary" ? "active" : ""}`}
            onClick={() => setActiveView("anniversary")}
          >
            <CalendarDays className="nav-tab-icon" aria-hidden="true" strokeWidth={2.2} />
            Lịch giỗ
          </button>
          <button
            className={`btn-tab ${activeView === "list" ? "active" : ""}`}
            onClick={() => setActiveView("list")}
          >
            <Users className="nav-tab-icon" aria-hidden="true" strokeWidth={2.2} />
            Thành viên
          </button>
        </div>

        {/* Search bar */}
        <div className="search-box">
          <Search className="search-icon" aria-hidden="true" strokeWidth={2.3} />
          <input
            type="text"
            className="search-input"
            placeholder="Tìm kiếm thành viên, đời, sự kiện..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <button className="btn-bell" aria-label="Thông báo" type="button">
          <Bell aria-hidden="true" strokeWidth={2.2} />
        </button>

        {/* Theme Switcher */}
        <button className="btn-icon" onClick={toggleTheme} title={theme === "light" ? "Chuyển sang giao diện tối" : "Chuyển sang giao diện sáng"}>
          {theme === "light" ? (
            <Moon aria-hidden="true" strokeWidth={2.2} size={18} />
          ) : (
            <Sun aria-hidden="true" strokeWidth={2.2} size={18} />
          )}
        </button>

        {/* User login / logout */}
        {currentUser ? (
          <div className="user-menu-wrap">
            <button
              className={`user-badge user-menu-trigger ${isUserMenuOpen ? "active" : ""}`}
              onClick={() => setIsUserMenuOpen((prev) => !prev)}
              aria-haspopup="menu"
              aria-expanded={isUserMenuOpen}
              type="button"
            >
              <div
                className={`user-avatar ${userAvatar ? "" : "generated-avatar"}`}
                style={userAvatar ? undefined : getAvatarStyle({ id: currentUser.id || currentUser.username, name: userDisplayName })}
              >
                {userAvatar ? (
                  <img src={userAvatar} alt="" />
                ) : (
                  getAvatarInitials(userDisplayName)
                )}
              </div>
              <span className="user-role">
                {userDisplayName}
              </span>
              <ChevronDown className="user-menu-chevron" size={16} strokeWidth={2.4} aria-hidden="true" />
            </button>
            {isUserMenuOpen && (
              <div className="user-menu-panel glass" role="menu">
                <div className="user-menu-heading">
                  <strong>{userDisplayName}</strong>
                  <span>{getRoleLabel(currentUser.role)}</span>
                </div>

                {isAdmin(currentUser) && (
                  <>
                    <button
                      className="user-menu-item"
                      type="button"
                      onClick={() => {
                        onOpenAccounts?.("manage");
                        setIsUserMenuOpen(false);
                      }}
                    >
                      <UserCog size={17} strokeWidth={2.2} />
                      Quản trị tài khoản
                    </button>
                    <button
                      className="user-menu-item"
                      type="button"
                      onClick={() => {
                        onOpenAccounts?.("password");
                        setIsUserMenuOpen(false);
                      }}
                    >
                      <LockKeyhole size={17} strokeWidth={2.2} />
                      Đổi mật khẩu
                    </button>
                    <button
                      className="user-menu-item"
                      type="button"
                      onClick={() => {
                        setIsPrivateMode(!isPrivateMode);
                        setIsUserMenuOpen(false);
                      }}
                    >
                      <ShieldCheck size={17} strokeWidth={2.2} />
                      {isPrivateMode ? "Chế độ: Riêng tư" : "Chế độ: Công khai"}
                    </button>
                  </>
                )}

                {canRevealSensitiveInfo && (
                  <button
                    className="user-menu-item"
                    type="button"
                    onClick={() => {
                      onToggleSensitiveInfo(!showSensitiveInfo);
                      setIsUserMenuOpen(false);
                    }}
                  >
                    {showSensitiveInfo ? <Eye size={17} strokeWidth={2.2} /> : <EyeOff size={17} strokeWidth={2.2} />}
                    {showSensitiveInfo ? "Ẩn thông tin riêng" : "Xem thông tin riêng"}
                  </button>
                )}

                <button
                  className="user-menu-item danger"
                  type="button"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    onLogout();
                  }}
                >
                  <LogOut size={17} strokeWidth={2.2} />
                  Đăng xuất
                </button>
              </div>
            )}
          </div>
        ) : (
          <button className="btn btn-secondary" onClick={() => setIsLoginModalOpen(true)} style={{ flex: "none", borderRadius: "20px" }}>
            Đăng nhập
          </button>
        )}
      </div>

      {/* Mobile Navigation Toggle (Visible on Mobile) */}
      <div className="mobile-nav-toggle">
        {/* View Toggle */}
        <div className="btn-group" style={{ padding: "2px" }}>
          <button
            className={`btn-tab ${activeView === "tree" ? "active" : ""}`}
            onClick={() => setActiveView("tree")}
            style={{ padding: "4px 8px", fontSize: "0.7rem", borderRadius: "15px" }}
          >
            Cây
          </button>
          <button
            className={`btn-tab ${activeView === "list" ? "active" : ""}`}
            onClick={() => setActiveView("list")}
            style={{ padding: "4px 8px", fontSize: "0.7rem", borderRadius: "15px" }}
          >
            Bảng
          </button>
        </div>

        {/* Hamburger Menu button */}
        <button className="hamburger-btn" onClick={toggleMobileMenu} aria-label="Toggle menu">
          <span aria-hidden="true">☰</span>
        </button>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <>
          <div className="modal-overlay" style={{ zIndex: 140 }} onClick={() => setIsMobileMenuOpen(false)} />
          <div className="mobile-drawer glass animate-slide-right">
            <div className="mobile-drawer-header">
              <h3>Menu tiện ích</h3>
              <button className="sidebar-close" onClick={() => setIsMobileMenuOpen(false)}>
                Đóng
              </button>
            </div>
            <div className="mobile-drawer-body">
              {/* Mobile Search */}
              <div className="search-box" style={{ width: "100%" }}>
                <Search className="search-icon" aria-hidden="true" strokeWidth={2.3} />
                <input
                  type="text"
                  className="search-input"
                  placeholder="Tìm thành viên..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Admin actions */}
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setActiveView("generations");
                  setIsMobileMenuOpen(false);
                }}
                style={{ width: "100%", justifyContent: "center", gap: "8px" }}
              >
                <BookOpenText size={16} strokeWidth={2.2} />
                Các đời
              </button>

              <button
                className="btn btn-secondary"
                onClick={() => {
                  setActiveView("anniversary");
                  setIsMobileMenuOpen(false);
                }}
                style={{ width: "100%", justifyContent: "center", gap: "8px" }}
              >
                <CalendarDays size={16} strokeWidth={2.2} />
                Lịch giỗ
              </button>

              {canAddTopLevelMember && (
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    onAddMember();
                    setIsMobileMenuOpen(false);
                  }}
                  style={{ width: "100%", justifyContent: "center" }}
                >
                  Thêm thành viên
                </button>
              )}

              {isAdmin(currentUser) && (
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    onOpenAccounts?.("manage");
                    setIsMobileMenuOpen(false);
                  }}
                  style={{ width: "100%", justifyContent: "center", gap: "8px" }}
                >
                  <ShieldCheck size={16} strokeWidth={2.2} />
                  Tài khoản
                </button>
              )}

              {isAdmin(currentUser) && (
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    onOpenAccounts?.("password");
                    setIsMobileMenuOpen(false);
                  }}
                  style={{ width: "100%", justifyContent: "center", gap: "8px" }}
                >
                  <LockKeyhole size={16} strokeWidth={2.2} />
                  Đổi mật khẩu
                </button>
              )}

              {/* Security / Privacy Toggle (Admin only) */}
              {isAdmin(currentUser) && (
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setIsPrivateMode(!isPrivateMode);
                  }}
                  style={{ width: "100%", justifyContent: "center" }}
                >
                  {isPrivateMode ? "Riêng tư" : "Công khai"}
                </button>
              )}

              {canRevealSensitiveInfo && (
                <button
                  className={`btn btn-secondary ${showSensitiveInfo ? "active" : ""}`}
                  onClick={() => {
                    onToggleSensitiveInfo(!showSensitiveInfo);
                  }}
                  style={{ width: "100%", justifyContent: "center", gap: "8px" }}
                >
                  {showSensitiveInfo ? <Eye size={16} strokeWidth={2.2} /> : <EyeOff size={16} strokeWidth={2.2} />}
                  {showSensitiveInfo ? "Đang hiện thông tin riêng" : "Ẩn thông tin riêng"}
                </button>
              )}

              {/* Theme Switcher */}
              <button
                className="btn btn-secondary"
                onClick={() => {
                  toggleTheme();
                }}
                style={{ width: "100%", justifyContent: "center", gap: "8px" }}
              >
                {theme === "light" ? <Moon size={16} strokeWidth={2.2} /> : <Sun size={16} strokeWidth={2.2} />}
                Giao diện: {theme === "light" ? "Tối" : "Sáng"}
              </button>

              <hr style={{ border: "none", borderTop: "1px solid var(--border-card)", margin: "8px 0" }} />

              {/* Login / Logout */}
              {currentUser ? (
                <div
                  className="btn btn-secondary"
                  onClick={() => {
                    onLogout();
                    setIsMobileMenuOpen(false);
                  }}
                  style={{ width: "100%", justifyContent: "center", color: "var(--color-brand-accent)", fontWeight: 700, gap: "8px" }}
                >
                  <LogOut aria-hidden="true" strokeWidth={2.3} />
                  Đăng xuất ({getRoleLabel(currentUser.role)})
                </div>
              ) : (
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setIsLoginModalOpen(true);
                    setIsMobileMenuOpen(false);
                  }}
                  style={{ width: "100%", justifyContent: "center", fontWeight: 700 }}
                >
                  Đăng nhập
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </nav>
  );
}
