import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Award,
  Bell,
  BookOpenText,
  CalendarDays,
  ChevronDown,
  CheckCheck,
  Clock3,
  Eye,
  EyeOff,
  History,
  LogOut,
  LockKeyhole,
  MapPin,
  Moon,
  Network,
  Search,
  ShieldCheck,
  ScrollText,
  Sun,
  UserCog,
  UserRoundCheck,
  UserRound,
  Users,
  Wand2,
  X
} from "lucide-react";
import { getAvatarInitials, getAvatarStyle } from "../utils/avatarUtils";
import { ENABLE_SETUP_WIZARD } from "../config/cmsRuntime";
import { getRoleLabel, isAdmin } from "../utils/authRoles";
import { DEFAULT_SITE_CONFIG, normalizeSiteConfig } from "../utils/siteConfigUtils";

const normalizeSearchText = (value = "") => (
  String(value)
    .toLocaleLowerCase("vi-VN")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
);

const pageSearchItems = [
  {
    id: "tree",
    label: "Cây gia phả",
    description: "Xem sơ đồ gia phả và mở hồ sơ thành viên",
    keywords: "cay gia pha so do tree pha he"
  },
  {
    id: "generations",
    label: "Các đời",
    description: "Xem thành viên theo từng đời",
    keywords: "cac doi doi the he generation"
  },
  {
    id: "anniversary",
    label: "Lịch giỗ",
    description: "Xem toàn bộ ngày giỗ theo lịch âm",
    keywords: "lich gio ngay gio su kien am lich"
  },
  {
    id: "history",
    label: "Lịch sử dòng họ",
    description: "Xem toàn bộ cột mốc và ảnh tư liệu",
    keywords: "lich su dong ho cot moc su kien anh tu lieu nha tho"
  },
  {
    id: "list",
    label: "Thành viên",
    description: "Danh sách đầy đủ thành viên gia phả",
    keywords: "thanh vien danh sach nguoi member"
  }
];

export default function Navbar({
  siteConfig = DEFAULT_SITE_CONFIG,
  searchQuery,
  setSearchQuery,
  members = [],
  activeView,
  setActiveView,
  canGoBack = false,
  onBack,
  suppressOverlays = false,
  currentUser,
  authReady = true,
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
  onOpenAccounts,
  onOpenHistoryAdmin,
  onSearchSelectMember,
  notifications = [],
  unreadNotificationCount = 0,
  readNotificationIds = [],
  onNotificationAction,
  onMarkAllNotificationsRead
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userMenuOpenView, setUserMenuOpenView] = useState(null);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const config = normalizeSiteConfig(siteConfig);
  const userMenuRef = useRef(null);
  const desktopNotificationRef = useRef(null);
  const mobileNotificationRef = useRef(null);
  const mobileDrawerTouchStartRef = useRef(null);
  const userDisplayName = currentUser?.fullName || currentUser?.displayName || currentUser?.username || "";
  const userAvatar = currentUser?.avatar || currentUser?.photoURL || currentUser?.image;
  const canAddTopLevelMember = currentUser?.role === "admin" || (currentUser?.role === "editor" && !currentUser?.editScopeRootId);
  const normalizedQuery = normalizeSearchText(searchQuery.trim());
  const shouldShowSearchPanel = isSearchOpen && searchQuery.trim().length >= 2;
  const isUserMenuOpen = userMenuOpenView === activeView;
  const readNotificationSet = useMemo(() => new Set(readNotificationIds), [readNotificationIds]);
  const hasNotifications = notifications.length > 0;

  useEffect(() => {
    if (!isUserMenuOpen) return undefined;

    const handlePointerDown = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpenView(null);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setUserMenuOpenView(null);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isUserMenuOpen]);

  useEffect(() => {
    if (!isNotificationOpen) return undefined;

    const handlePointerDown = (event) => {
      const isInsideDesktop = desktopNotificationRef.current?.contains(event.target);
      const isInsideMobile = mobileNotificationRef.current?.contains(event.target);
      if (!isInsideDesktop && !isInsideMobile) {
        setIsNotificationOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsNotificationOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isNotificationOpen]);

  const memberById = useMemo(
    () => new Map(members.map((member) => [member.id, member])),
    [members]
  );

  const searchResults = useMemo(() => {
    if (normalizedQuery.length < 2) {
      return { members: [], pages: [] };
    }

    const memberResults = members
      .map((member) => {
        const relations = [
          member.fatherId ? memberById.get(member.fatherId)?.name : "",
          member.motherId ? memberById.get(member.motherId)?.name : "",
          ...(member.spouseIds || []).map((id) => memberById.get(id)?.name)
        ].filter(Boolean);
        const haystack = normalizeSearchText([
          member.name,
          `đời ${member.generation}`,
          `doi ${member.generation}`,
          member.gender === "nu" ? "nữ nu bà mẹ vợ" : "nam ông cha chồng",
          member.isDeceased ? "tạ thế đã mất qua đời" : "còn sống",
          member.birthDate,
          member.deathDate,
          member.birthPlace,
          member.restingPlace,
          member.occupation,
          member.bio,
          member.phone,
          member.address,
          ...relations
        ].join(" "));

        if (!haystack.includes(normalizedQuery)) return null;
        const nameMatch = normalizeSearchText(member.name).includes(normalizedQuery);
        const relationMatch = relations.some((name) => normalizeSearchText(name).includes(normalizedQuery));
        return {
          member,
          score: (nameMatch ? 10 : 0) + (relationMatch ? 4 : 0) + Math.max(0, 6 - member.generation)
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score || a.member.generation - b.member.generation || a.member.name.localeCompare(b.member.name, "vi"))
      .slice(0, 7)
      .map((item) => item.member);

    const pageResults = pageSearchItems.filter((item) => (
      normalizeSearchText(`${item.label} ${item.description} ${item.keywords}`).includes(normalizedQuery)
    ));

    return { members: memberResults, pages: pageResults };
  }, [memberById, members, normalizedQuery]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((prev) => !prev);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
    mobileDrawerTouchStartRef.current = null;
  };

  const handleMobileDrawerTouchStart = (event) => {
    const touch = event.touches[0];

    if (touch.clientX > 36) {
      mobileDrawerTouchStartRef.current = null;
      return;
    }

    mobileDrawerTouchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    };
  };

  const handleMobileDrawerTouchEnd = (event) => {
    const start = mobileDrawerTouchStartRef.current;
    mobileDrawerTouchStartRef.current = null;
    if (!start) return;

    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - start.x;
    const deltaY = Math.abs(touch.clientY - start.y);
    const elapsed = Date.now() - start.time;

    if (deltaX >= 72 && deltaY <= 48 && elapsed <= 900) {
      closeMobileMenu();
    }
  };

  const openMobileSearch = () => {
    setIsMobileMenuOpen(false);
    setIsMobileSearchOpen(true);
    setIsSearchOpen(true);
  };

  const closeMobileSearch = () => {
    setIsMobileSearchOpen(false);
    setIsSearchOpen(false);
  };

  const handleSearchBlur = () => {
    window.setTimeout(() => setIsSearchOpen(false), 120);
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
    setIsSearchOpen(true);
  };

  const clearSearchQuery = () => {
    setSearchQuery("");
    setIsSearchOpen(false);
  };

  const openSearchMember = (member) => {
    setSearchQuery(member.name);
    setIsSearchOpen(false);
    setUserMenuOpenView(null);
    setIsMobileMenuOpen(false);
    setIsMobileSearchOpen(false);
    onSearchSelectMember?.(member.id);
  };

  const openSearchPage = (view) => {
    setSearchQuery("");
    setIsSearchOpen(false);
    setUserMenuOpenView(null);
    setIsMobileMenuOpen(false);
    setIsMobileSearchOpen(false);
    setActiveView(view);
  };

  const getNotificationIcon = (type) => {
    if (type === "anniversary") return <CalendarDays size={17} strokeWidth={2.2} />;
    if (type === "history") return <History size={17} strokeWidth={2.2} />;
    if (type === "featured") return <Award size={17} strokeWidth={2.2} />;
    if (type === "security") return <ShieldCheck size={17} strokeWidth={2.2} />;
    if (type === "presence") return <UserRoundCheck size={17} strokeWidth={2.2} />;
    return <Clock3 size={17} strokeWidth={2.2} />;
  };

  const openNotification = (notification) => {
    onNotificationAction?.(notification);
    setIsNotificationOpen(false);
    setIsMobileMenuOpen(false);
  };

  const toggleNotificationPanel = () => {
    setIsSearchOpen(false);
    setUserMenuOpenView(null);
    setIsNotificationOpen((prev) => !prev);
  };

  const renderNotificationButton = (className = "") => (
    <button
      className={`btn-bell notification-trigger ${isNotificationOpen ? "active" : ""} ${className}`}
      aria-label={`Thông báo${unreadNotificationCount > 0 ? `, ${unreadNotificationCount} chưa đọc` : ""}`}
      aria-haspopup="dialog"
      aria-expanded={isNotificationOpen}
      type="button"
      onClick={toggleNotificationPanel}
    >
      <Bell aria-hidden="true" strokeWidth={2.2} />
      {unreadNotificationCount > 0 && (
        <span className="notification-badge">
          {unreadNotificationCount > 9 ? "9+" : unreadNotificationCount}
        </span>
      )}
    </button>
  );

  const renderNotificationPanel = () => {
    if (suppressOverlays || !isNotificationOpen) return null;

    return (
      <div className="notification-panel glass" role="dialog" aria-label="Thông báo gia phả">
        <div className="notification-head">
          <div>
            <strong>Thông báo</strong>
            <span>{unreadNotificationCount > 0 ? `${unreadNotificationCount} mục chưa đọc` : "Đã cập nhật mới nhất"}</span>
          </div>
          <button
            className="notification-read-all"
            type="button"
            onClick={onMarkAllNotificationsRead}
            disabled={!hasNotifications}
          >
            <CheckCheck size={15} strokeWidth={2.3} />
            Đã đọc
          </button>
        </div>

        {hasNotifications ? (
          <div className="notification-list">
            {notifications.map((notification) => {
              const isUnread = !readNotificationSet.has(notification.id);
              return (
                <button
                  key={notification.id}
                  type="button"
                  className={`notification-item notification-${notification.tone || "info"} ${isUnread ? "is-unread" : ""}`}
                  onClick={() => openNotification(notification)}
                >
                  <span className="notification-icon">
                    {getNotificationIcon(notification.type)}
                  </span>
                  <span className="notification-copy">
                    <span className="notification-title-row">
                      <strong>{notification.title}</strong>
                      {isUnread && <i aria-label="Chưa đọc" />}
                    </span>
                    <small>{notification.description}</small>
                    <em>{notification.timeLabel}</em>
                  </span>
                  <span className="notification-action">{notification.actionLabel}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="notification-empty">
            Chưa có thông báo quan trọng.
          </div>
        )}
      </div>
    );
  };

  const handleSearchKeyDown = (event) => {
    if (event.key !== "Enter" || !shouldShowSearchPanel) return;
    const firstMember = searchResults.members[0];
    const firstPage = searchResults.pages[0];
    if (firstMember) {
      event.preventDefault();
      openSearchMember(firstMember);
    } else if (firstPage) {
      event.preventDefault();
      openSearchPage(firstPage.id);
    }
  };

  const renderSearchPanel = () => {
    if (suppressOverlays || !shouldShowSearchPanel) return null;
    const hasMemberResults = searchResults.members.length > 0;
    const hasPageResults = searchResults.pages.length > 0;

    return (
      <div className="global-search-panel glass">
        {hasMemberResults && (
          <div className="global-search-section">
            <span className="global-search-label">Thành viên</span>
            {searchResults.members.map((member) => {
              const avatar = member.avatar || member.photoURL || member.image;
              const location = member.birthPlace || member.address || member.restingPlace || "";
              return (
                <button
                  key={member.id}
                  type="button"
                  className="global-search-item"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => openSearchMember(member)}
                >
                  <span
                    className={`global-search-avatar ${avatar ? "" : "generated-avatar"}`}
                    style={avatar ? undefined : getAvatarStyle(member)}
                  >
                    {avatar ? <img src={avatar} alt="" /> : getAvatarInitials(member.name)}
                  </span>
                  <span className="global-search-copy">
                    <strong>{member.name}</strong>
                    <small>
                      <UserRound size={12} strokeWidth={2.2} />
                      Đời {member.generation} · {member.isDeceased ? "Tạ thế" : "Còn sống"}
                    </small>
                    {location && (
                      <em>
                        <MapPin size={12} strokeWidth={2.2} />
                        {location}
                      </em>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {hasPageResults && (
          <div className="global-search-section">
            <span className="global-search-label">Điều hướng</span>
            {searchResults.pages.map((item) => (
              <button
                key={item.id}
                type="button"
                className="global-search-item compact"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => openSearchPage(item.id)}
              >
                <span className="global-search-nav-icon">
                  {item.id === "tree" ? <Network size={17} strokeWidth={2.2} /> : null}
                  {item.id === "generations" ? <BookOpenText size={17} strokeWidth={2.2} /> : null}
                  {item.id === "anniversary" ? <CalendarDays size={17} strokeWidth={2.2} /> : null}
                  {item.id === "history" ? <ScrollText size={17} strokeWidth={2.2} /> : null}
                  {item.id === "list" ? <Users size={17} strokeWidth={2.2} /> : null}
                </span>
                <span className="global-search-copy">
                  <strong>{item.label}</strong>
                  <small>{item.description}</small>
                </span>
              </button>
            ))}
          </div>
        )}

        {!hasMemberResults && !hasPageResults && (
          <div className="global-search-empty">
            Không tìm thấy kết quả phù hợp.
          </div>
        )}
      </div>
    );
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
          <img src={config.logoUrl} alt="" aria-hidden="true" />
        </span>
        <span className="logo-text" aria-label={config.siteTitle}>
          <span className="logo-text-kicker">{config.familyLabel}</span>
          <span className="logo-text-main">{config.familyName}</span>
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
          {searchQuery ? (
            <button
              className="search-icon search-clear-btn"
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={clearSearchQuery}
              aria-label="Xóa tìm kiếm"
            >
              <X size={16} strokeWidth={2.4} aria-hidden="true" />
            </button>
          ) : (
            <Search className="search-icon" aria-hidden="true" strokeWidth={2.3} />
          )}
          <input
            type="text"
            className="search-input"
            placeholder="Tìm kiếm thành viên, đời, sự kiện..."
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={() => setIsSearchOpen(true)}
            onClick={() => setIsSearchOpen(true)}
            onBlur={handleSearchBlur}
            onKeyDown={handleSearchKeyDown}
            autoComplete="off"
          />
          {renderSearchPanel()}
        </div>

        <div className="notification-wrap" ref={desktopNotificationRef}>
          {renderNotificationButton()}
          {renderNotificationPanel()}
        </div>

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
          <div className="user-menu-wrap" ref={userMenuRef}>
            <button
              className={`user-badge user-menu-trigger ${isUserMenuOpen ? "active" : ""}`}
              onClick={() => setUserMenuOpenView((prev) => (prev === activeView ? null : activeView))}
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

                {isAdmin(currentUser) && ENABLE_SETUP_WIZARD && (
                  <>
                    <button
                      className="user-menu-item"
                      type="button"
                      onClick={() => {
                        onOpenAccounts?.("setup");
                        setUserMenuOpenView(null);
                      }}
                    >
                      <Wand2 size={17} strokeWidth={2.2} />
                      Setup Wizard
                    </button>
                    <button
                      className="user-menu-item"
                      type="button"
                      onClick={() => {
                        onOpenAccounts?.("manage");
                        setUserMenuOpenView(null);
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
                        setUserMenuOpenView(null);
                      }}
                    >
                      <LockKeyhole size={17} strokeWidth={2.2} />
                      Đổi mật khẩu
                    </button>
                    <button
                      className="user-menu-item"
                      type="button"
                      onClick={() => {
                        onOpenHistoryAdmin?.();
                        setUserMenuOpenView(null);
                      }}
                    >
                      <ScrollText size={17} strokeWidth={2.2} />
                      Quản lý lịch sử
                    </button>
                    <button
                      className="user-menu-item"
                      type="button"
                      onClick={() => {
                        setIsPrivateMode(!isPrivateMode);
                        setUserMenuOpenView(null);
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
                      setUserMenuOpenView(null);
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
                    setUserMenuOpenView(null);
                    onLogout();
                  }}
                >
                  <LogOut size={17} strokeWidth={2.2} />
                  Đăng xuất
                </button>
              </div>
            )}
          </div>
        ) : authReady ? (
          <button className="btn btn-secondary" onClick={() => setIsLoginModalOpen(true)} style={{ flex: "none", borderRadius: "20px" }}>
            Đăng nhập
          </button>
        ) : null}
      </div>

      {/* Mobile Navigation Toggle (Visible on Mobile) */}
      <div className="mobile-nav-toggle">
        {canGoBack && (
          <button
            className="mobile-back-btn"
            onClick={onBack}
            aria-label="Quay lại trang trước"
            title="Quay lại"
            type="button"
          >
            <ArrowLeft aria-hidden="true" strokeWidth={2.4} />
          </button>
        )}

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

        <button
          className="mobile-search-btn"
          onClick={openMobileSearch}
          aria-label="Tìm kiếm"
          type="button"
        >
          <Search aria-hidden="true" strokeWidth={2.3} />
        </button>

        <div className="notification-wrap mobile-notification-wrap" ref={mobileNotificationRef}>
          {renderNotificationButton("mobile-notification-btn")}
          {renderNotificationPanel()}
        </div>

        {/* Hamburger Menu button */}
        <button className="hamburger-btn" onClick={toggleMobileMenu} aria-label="Toggle menu">
          <span aria-hidden="true">☰</span>
        </button>
      </div>

      {isMobileSearchOpen && !suppressOverlays && (
        <>
          <div className="mobile-search-backdrop" onClick={closeMobileSearch} />
          <div className="mobile-search-overlay glass">
            <div className="mobile-search-head">
              <strong>Tìm kiếm gia phả</strong>
              <button className="btn-icon mobile-search-close" type="button" onClick={closeMobileSearch} aria-label="Đóng tìm kiếm">
                <X size={18} strokeWidth={2.4} aria-hidden="true" />
              </button>
            </div>
            <div className="search-box mobile-search-box">
              <div className="mobile-search-input-wrap">
                {searchQuery ? (
                  <button
                    className="search-icon search-clear-btn"
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={clearSearchQuery}
                    aria-label="Xóa tìm kiếm"
                  >
                    <X size={16} strokeWidth={2.4} aria-hidden="true" />
                  </button>
                ) : (
                  <Search className="search-icon" aria-hidden="true" strokeWidth={2.3} />
                )}
                <input
                  type="text"
                  className="search-input"
                  placeholder="Nhập tên, đời, địa danh..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onFocus={() => setIsSearchOpen(true)}
                  onClick={() => setIsSearchOpen(true)}
                  onKeyDown={handleSearchKeyDown}
                  autoComplete="off"
                  autoFocus
                />
              </div>
              {renderSearchPanel()}
            </div>
          </div>
        </>
      )}

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && !suppressOverlays && (
        <>
          <div className="modal-overlay" style={{ zIndex: 140 }} onClick={closeMobileMenu} />
          <div
            className="mobile-drawer glass animate-slide-right"
            onTouchStart={handleMobileDrawerTouchStart}
            onTouchEnd={handleMobileDrawerTouchEnd}
            onTouchCancel={() => {
              mobileDrawerTouchStartRef.current = null;
            }}
          >
            <div className="mobile-drawer-header">
              <h3>Menu tiện ích</h3>
              <button className="sidebar-close" onClick={closeMobileMenu}>
                Đóng
              </button>
            </div>
            <div className="mobile-drawer-body">
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

              {isAdmin(currentUser) && ENABLE_SETUP_WIZARD && (
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    onOpenAccounts?.("setup");
                    setIsMobileMenuOpen(false);
                  }}
                  style={{ width: "100%", justifyContent: "center", gap: "8px" }}
                >
                  <Wand2 size={16} strokeWidth={2.2} />
                  Setup Wizard
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

              {isAdmin(currentUser) && (
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    onOpenHistoryAdmin?.();
                    setIsMobileMenuOpen(false);
                  }}
                  style={{ width: "100%", justifyContent: "center", gap: "8px" }}
                >
                  <ScrollText size={16} strokeWidth={2.2} />
                  Quản lý lịch sử
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
              ) : authReady ? (
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
              ) : null}
            </div>
          </div>
        </>
      )}
    </nav>
  );
}
