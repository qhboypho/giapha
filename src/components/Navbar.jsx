import { useState } from "react";
import {
  Bell,
  BookOpenText,
  CalendarDays,
  Home,
  LogOut,
  Moon,
  Network,
  Search,
  Sun,
  Users
} from "lucide-react";
import avatarTinh from "../assets/avatar_tinh.png";

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
  onAddMember
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((prev) => !prev);
  };

  return (
    <nav className="navbar glass">
      <div className="nav-brand">
        <span className="logo-icon">陳</span>
        <span className="logo-text">Gia Phả Họ Trần Công</span>
      </div>

      {/* Desktop Navigation (Hidden on Mobile) */}
      <div className="nav-actions desktop-nav">
        {/* View toggles */}
        <div className="btn-group">
          <button
            className={`btn-tab ${activeView === "home" ? "active" : ""}`}
            onClick={() => setActiveView("home")}
          >
            <Home className="nav-tab-icon" aria-hidden="true" strokeWidth={2.2} />
            Trang chủ
          </button>
          <button
            className={`btn-tab ${activeView === "tree" ? "active" : ""}`}
            onClick={() => setActiveView("tree")}
          >
            <Network className="nav-tab-icon" aria-hidden="true" strokeWidth={2.2} />
            Cây gia phả
          </button>
          <button
            className={`btn-tab ${activeView === "generations" ? "active" : ""}`}
            onClick={() => setActiveView("tree")}
          >
            <BookOpenText className="nav-tab-icon" aria-hidden="true" strokeWidth={2.2} />
            Các đời
          </button>
          <button
            className={`btn-tab ${activeView === "anniversary" ? "active" : ""}`}
            onClick={() => setActiveView("tree")}
          >
            <CalendarDays className="nav-tab-icon" aria-hidden="true" strokeWidth={2.2} />
            Ngày giỗ
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
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div className="user-badge" style={{ cursor: "default" }}>
              <div className="user-avatar">
                <img src={avatarTinh} alt="" />
              </div>
              <span className="user-role">
                {currentUser.role === "admin" ? "Trần Công Minh" : currentUser.fullName || currentUser.displayName || currentUser.username}
              </span>
            </div>
            <button 
              className="btn-logout tooltip-container tooltip-bottom" 
              onClick={onLogout} 
              aria-label="Đăng xuất"
            >
              <LogOut aria-hidden="true" strokeWidth={2.3} />
              <span className="tooltip-text">Đăng xuất</span>
            </button>
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
            className={`btn-tab ${activeView === "home" ? "active" : ""}`}
            onClick={() => setActiveView("home")}
            style={{ padding: "4px 8px", fontSize: "0.7rem", borderRadius: "15px" }}
          >
            Chủ
          </button>
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
              {(currentUser?.role === "admin" || currentUser?.role === "editor") && (
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

              {/* Security / Privacy Toggle (Admin only) */}
              {currentUser?.role === "admin" && (
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
                  Đăng xuất ({currentUser.role})
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
