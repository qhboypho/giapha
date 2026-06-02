import React, { useState } from "react";

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
        <span className="logo-icon">🌳</span>
        <span className="logo-text">Gia Phả Họ Trần Công</span>
      </div>

      {/* Desktop Navigation (Hidden on Mobile) */}
      <div className="nav-actions desktop-nav">
        {/* Search bar */}
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder="Tìm kiếm thành viên..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* View toggles */}
        <div className="btn-group">
          <button
            className={`btn-tab ${activeView === "tree" ? "active" : ""}`}
            onClick={() => setActiveView("tree")}
          >
            🌿 Sơ đồ cây
          </button>
          <button
            className={`btn-tab ${activeView === "list" ? "active" : ""}`}
            onClick={() => setActiveView("list")}
          >
            📋 Danh sách
          </button>
        </div>

        {/* Admin only action: Add Member */}
        {(currentUser?.role === "admin" || currentUser?.role === "editor") && (
          <button className="btn btn-primary" onClick={onAddMember} style={{ flex: "none", borderRadius: "20px", fontSize: "0.85rem" }}>
            ➕ Thêm thành viên
          </button>
        )}

        {/* Security / Privacy Toggle (Admin only) */}
        {currentUser?.role === "admin" && (
          <button 
            className="btn btn-secondary tooltip-container tooltip-bottom" 
            onClick={() => setIsPrivateMode(!isPrivateMode)}
            style={{ flex: "none", borderRadius: "20px", fontSize: "0.85rem" }}
          >
            {isPrivateMode ? "🔒 Riêng tư" : "🔓 Công khai"}
            <span className="tooltip-text">
              {isPrivateMode ? "Chỉ thành viên đăng nhập mới xem được" : "Mọi người đều có thể xem"}
            </span>
          </button>
        )}

        {/* Theme Switcher */}
        <button className="btn-icon" onClick={toggleTheme} title="Đổi giao diện">
          {theme === "light" ? "🌙" : "☀️"}
        </button>

        {/* User login / logout */}
        {currentUser ? (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div className="user-badge" style={{ cursor: "default" }}>
              <div className="user-avatar">
                {currentUser.username.substring(0, 1).toUpperCase()}
              </div>
              <span className="user-role" style={{ textTransform: "capitalize" }}>
                {currentUser.role}
              </span>
            </div>
            <button 
              className="btn-logout tooltip-container tooltip-bottom" 
              onClick={onLogout} 
              aria-label="Đăng xuất"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span className="tooltip-text">Đăng xuất</span>
            </button>
          </div>
        ) : (
          <button className="btn btn-secondary" onClick={() => setIsLoginModalOpen(true)} style={{ flex: "none", borderRadius: "20px" }}>
            🔑 Đăng nhập
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
            style={{ padding: "4px 10px", fontSize: "0.75rem", borderRadius: "15px" }}
          >
            🌳 Cây
          </button>
          <button
            className={`btn-tab ${activeView === "list" ? "active" : ""}`}
            onClick={() => setActiveView("list")}
            style={{ padding: "4px 10px", fontSize: "0.75rem", borderRadius: "15px" }}
          >
            📋 Bảng
          </button>
        </div>

        {/* Hamburger Menu button */}
        <button className="hamburger-btn" onClick={toggleMobileMenu} aria-label="Toggle menu">
          ☰
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
                ❌
              </button>
            </div>
            <div className="mobile-drawer-body">
              {/* Mobile Search */}
              <div className="search-box" style={{ width: "100%" }}>
                <span className="search-icon">🔍</span>
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
                  ➕ Thêm thành viên
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
                  {isPrivateMode ? "🔒 Riêng tư" : "🔓 Công khai"}
                </button>
              )}

              {/* Theme Switcher */}
              <button
                className="btn btn-secondary"
                onClick={() => {
                  toggleTheme();
                }}
                style={{ width: "100%", justifyContent: "center" }}
              >
                Giao diện: {theme === "light" ? "🌙 Tối" : "☀️ Sáng"}
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
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
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
                  🔑 Đăng nhập
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </nav>
  );
}
