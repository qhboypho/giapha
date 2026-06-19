import { useState, useRef } from "react";
import { getAvatarInitials, getAvatarStyle } from "../utils/avatarUtils";
import { buildUpcomingAnniversaries, getCurrentLunarDateLabel, getYearsString } from "../utils/anniversaryUtils";
import { buildHomepageHistoryEvents, formatHistoryEventDate } from "../utils/familyHistoryUtils";
import { sortMembersByBirthOrder } from "../utils/sortUtils";
import "./Homepage.css";
import {
  CalendarDays,
  FileText,
  Images,
  Landmark,
  Network,
  TreeDeciduous,
  UserRoundCheck,
  Users
} from "lucide-react";
import paperBg from "../assets/homepage-design/paper-bg.png";
import mountainBg from "../assets/homepage-design/new-mountain-bg.png";
import lotusWatercolor from "../assets/homepage-design/lotus-watercolor-cutout.png";
import pineWatercolor from "../assets/homepage-design/new-pine-watercolor.png";
import goldClouds from "../assets/homepage-design/gold-clouds-cutout.png";
import goldWavesLotus from "../assets/homepage-design/gold-waves-lotus-cutout.png";
import goldBorders from "../assets/homepage-design/gold-borders-cutout.png";
import dongsonDrum from "../assets/homepage-design/dongson-drum.jpg";

// Static fallback removed

function MemberAvatar({ member, className = "" }) {
  if (member?.avatar) {
    return <img src={member.avatar} alt={member.name} className={className} />;
  }

  return (
    <span
      className={`${className} generated-avatar`}
      style={getAvatarStyle(member)}
      aria-label={member?.name || "Thành viên"}
    >
      {getAvatarInitials(member?.name)}
    </span>
  );
}

const features = [
  {
    title: "Cây phả hệ",
    text: "Khám phá sơ đồ gia phả trực quan, dễ dàng theo dõi các đời.",
    icon: "tree",
    tone: "green",
    view: "tree"
  },
  {
    title: "Hồ sơ tổ tiên",
    text: "Lưu giữ thông tin, tiểu sử của các bậc tiền nhân.",
    icon: "record",
    tone: "gold",
    view: "list"
  },
  {
    title: "Ngày giỗ & sự kiện",
    text: "Quản lý ngày giỗ, sự kiện quan trọng của dòng họ.",
    icon: "calendar",
    tone: "red",
    view: "anniversary"
  },
  {
    title: "Ký ức gia đình",
    text: "Lưu giữ hình ảnh, kỷ vật và câu chuyện gia đình.",
    icon: "memory",
    tone: "teal",
    view: "history"
  }
];

const heritageIconMap = {
  temple: Landmark,
  people: Users,
  branch: Network,
  calendar: CalendarDays,
  tree: TreeDeciduous,
  record: FileText,
  memory: Images,
  viewer: UserRoundCheck
};

function HeritageIcon({ type }) {
  const Icon = heritageIconMap[type] || Network;
  return (
    <span className={`heritage-icon heritage-icon-${type}`} aria-hidden="true">
      <Icon strokeWidth={2.15} />
    </span>
  );
}

export default function Homepage({ onNavigate, onOpenPerson, members = [], historyEvents = [], isLoading = false, activeViewersCount = 0 }) {
  const currentLunarDateLabel = getCurrentLunarDateLabel();
  const homepageHistoryEvents = buildHomepageHistoryEvents(historyEvents);

  // Calculate dynamic stats from database data
  const generations = members.length > 0 ? Math.max(...members.map(m => m.generation), 0) : 3;
  const membersCount = members.length > 0 ? members.length : 31;

  // Branches count: children of generation 1 patriarchs/matriarchs who are heads of branches
  let branchesCount = 5;
  if (members.length > 0) {
    const minGen = Math.min(...members.map(m => m.generation), 1);
    const roots = members.filter(m => m.generation === minGen && !m.fatherId && !m.motherId);
    const rootIds = roots.map(r => r.id);
    const branchChildren = members.filter(m => rootIds.includes(m.fatherId) || rootIds.includes(m.motherId));
    branchesCount = branchChildren.length > 0 ? branchChildren.length : 1;
  }

  const [activeSlide, setActiveSlide] = useState(0);
  const touchStartRef = useRef(0);
  const recentGenerationCutoff = Math.max(1, generations - 1);
  const getMobileYearsString = (member) => getYearsString(member, { hideUnknownDeceased: true });
  const getMobileSpouseLabel = (child, spouse) => {
    const isRecentGeneration = child.generation >= recentGenerationCutoff;
    if (isRecentGeneration) {
      return spouse.gender === "nu" ? "Vợ" : "Chồng";
    }
    return spouse.gender === "nu" ? "Bà" : "Ông";
  };

  // Helper to build mobile slides dynamically
  const buildMobileSlides = () => {
    if (!members || members.length === 0) return [];

    const numericIdOrder = (id) => {
      const match = String(id || "").match(/\d+$/);
      return match ? parseInt(match[0], 10) : 0;
    };

    const compareMembersForSlideOrder = (a, b) => {
      const genDiff = (a.generation || 0) - (b.generation || 0);
      if (genDiff !== 0) return genDiff;

      const sortedPair = sortMembersByBirthOrder([a, b]);
      if (sortedPair[0]?.id === a.id && sortedPair[1]?.id === b.id) return -1;
      if (sortedPair[0]?.id === b.id && sortedPair[1]?.id === a.id) return 1;

      return numericIdOrder(a.id) - numericIdOrder(b.id);
    };

    const slides = [];
    const seenUnits = new Set();

    const parentsWithChildren = members.filter(parent =>
      members.some(child => child.fatherId === parent.id || child.motherId === parent.id)
    );

    parentsWithChildren.forEach((member) => {
      const spouses = (member.spouseIds || [])
        .map(spouseId => members.find(candidate => candidate.id === spouseId))
        .filter(Boolean);

      const spouse = spouses[0] || null;
      let parent = member;
      let partner = spouse;

      if (spouse) {
        if (spouse.gender === "nam" && member.gender !== "nam") {
          parent = spouse;
          partner = member;
        } else if (member.gender === spouse.gender && compareMembersForSlideOrder(spouse, member) < 0) {
          parent = spouse;
          partner = member;
        }
      }

      const unitIds = partner ? [parent.id, partner.id].sort() : [parent.id];
      const unitKey = unitIds.join("|");
      if (seenUnits.has(unitKey)) return;
      seenUnits.add(unitKey);

      const parentIds = partner ? [parent.id, partner.id] : [parent.id];
      const children = members.filter(child =>
        child.generation > parent.generation &&
        (
          (child.fatherId && parentIds.includes(child.fatherId)) ||
          (child.motherId && parentIds.includes(child.motherId))
        )
      );

      if (children.length === 0) return;

      const sortedCandidates = sortMembersByBirthOrder(children);
      const candidateIds = new Set(sortedCandidates.map(child => child.id));
      const usedChildIds = new Set();
      const sortedChildren = [];

      sortedCandidates.forEach((child) => {
        if (usedChildIds.has(child.id)) return;

        const spouseInCandidateGroup = (child.spouseIds || [])
          .map(spouseId => members.find(candidate => candidate.id === spouseId))
          .find(spouse => spouse && candidateIds.has(spouse.id));

        if (!spouseInCandidateGroup) {
          usedChildIds.add(child.id);
          sortedChildren.push(child);
          return;
        }

        const primaryChild = numericIdOrder(child.id) <= numericIdOrder(spouseInCandidateGroup.id)
          ? child
          : spouseInCandidateGroup;
        const spouseChild = primaryChild.id === child.id ? spouseInCandidateGroup : child;

        usedChildIds.add(primaryChild.id);
        usedChildIds.add(spouseChild.id);
        sortedChildren.push(primaryChild);
      });

      slides.push({ parent, spouse: partner, children: sortedChildren });
    });

    slides.sort((a, b) => compareMembersForSlideOrder(a.parent, b.parent));
    return slides;
  };

  const mobileSlides = buildMobileSlides();
  const activeSlideIndex = Math.min(activeSlide, Math.max(mobileSlides.length - 1, 0));
  const currentSlide = mobileSlides[activeSlideIndex];

  const handleTouchStart = (e) => {
    touchStartRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStartRef.current - touchEnd;
    if (diff > 50) {
      // Swipe left -> next slide
      setActiveSlide((prev) => Math.min(prev + 1, mobileSlides.length - 1));
    } else if (diff < -50) {
      // Swipe right -> prev slide
      setActiveSlide((prev) => Math.max(prev - 1, 0));
    }
  };

  // Resolve dynamic mini tree root, children and branches
  let root = null;
  let treeChildren = [];
  let treeBranches = [];

  if (members && members.length > 0) {
    root = members.find(m => m.generation === 1 && m.gender === "nam") || members.find(m => m.generation === 1);
    if (root) {
      treeChildren = sortMembersByBirthOrder(members.filter(m => m.fatherId === root.id || m.motherId === root.id));
      treeBranches = treeChildren.map(child => {
        const lastName = child.name.trim().split(" ").pop();
        const prefix = "Chi cụ";
        return `${prefix} ${lastName}`;
      });
    }
  }

  if (!root) {
    root = { name: "", title: "", years: "", avatar: "" };
    treeChildren = [];
    treeBranches = [];
  }

  // Curated featured members for homepage.
  let featuredMembers = [];
  if (members && members.length > 0) {
    featuredMembers = members
      .filter(m => m.isFeatured)
      .sort((a, b) => (a.generation || 0) - (b.generation || 0) || a.name.localeCompare(b.name, "vi"))
      .map(m => ({
      name: m.name,
      title: m.generation === 1 ? "Thủy tổ dòng họ" : `Đời thứ ${m.generation}`,
      years: getYearsString(m),
      member: m
    }));
  }
  const visibleFeaturedMembers = featuredMembers.slice(0, 8);
  const shouldScrollFeaturedMembers = visibleFeaturedMembers.length > 4;

  const upcomingAnniversaries = buildUpcomingAnniversaries(members);
  const upcomingAnniversariesCount = members.length > 0
    ? upcomingAnniversaries.filter((event) => event.daysUntil <= 30).length
    : 0;
  const visibleAnniversaries = upcomingAnniversaries.slice(0, 6);

  const stats = [
    { value: String(generations), label: "Đời", note: "Lịch sử dòng họ", tone: "green", icon: "temple" },
    { value: String(branchesCount), label: "Chi nhánh", note: "Đang kết nối", tone: "gold", icon: "branch" },
    { value: membersCount.toLocaleString("vi-VN"), label: "Thành viên", note: "Đã ghi danh", tone: "red", icon: "people" },
    { value: String(upcomingAnniversariesCount).padStart(2, "0"), label: "Ngày giỗ sắp tới", note: "Trong 30 ngày tới", tone: "green", icon: "calendar" },
    { value: activeViewersCount.toLocaleString("vi-VN"), label: "Người đang xem", note: "Người đang xem gia phả", tone: "teal", icon: "viewer" }
  ];

  return (
    <main
      className="homepage-container"
      style={{
        "--home-paper-bg": `url(${paperBg})`,
        "--home-mountain-bg": `url(${mountainBg})`,
        "--home-gold-clouds": `url(${goldClouds})`,
        "--home-gold-waves-lotus": `url(${goldWavesLotus})`,
        "--home-gold-borders": `url(${goldBorders})`,
        "--home-dongson-drum": `url(${dongsonDrum})`
      }}
    >
      <section className="home-hero">
        <img
          src={lotusWatercolor}
          alt="Hoa sen màu nước"
          className="hero-lotus-art"
        />
        <div className="home-hero-copy">
          <span className="hero-cloud-mark" aria-hidden="true" />
          <h1 className="hero-title serif">
            Lưu giữ cội nguồn
            <span>Kết nối muôn đời con cháu</span>
          </h1>
          <span className="hero-divider" aria-hidden="true" />
          <p className="hero-description">
            Gia phả là sợi dây thiêng liêng kết nối quá khứ, hiện tại và tương lai.
            Cùng nhau gìn giữ cội nguồn, vun đắp truyền thống cho muôn đời con cháu.
          </p>
          <div className="hero-cta-buttons">
            <button className="heritage-btn heritage-btn-primary" onClick={() => onNavigate("tree")}>
              <HeritageIcon type="branch" />
              Khám phá gia phả
            </button>
            <button className="heritage-btn heritage-btn-secondary" onClick={() => onNavigate("list")}>
              <HeritageIcon type="people" />
              Tìm người thân
            </button>
          </div>
        </div>

        <aside className="hero-tree-panel">
          <div className="panel-heading">
            <strong>Cây gia phả dòng chính</strong>
            <button className="panel-link" onClick={() => onNavigate("tree")}>
              Xem toàn bộ cây phả
              <span aria-hidden="true">→</span>
            </button>
          </div>
          <img src={pineWatercolor} alt="" className="pine-art" aria-hidden="true" />
          
          {isLoading ? (
            <>
              {/* Desktop Skeleton */}
              <div 
                className="mini-family-tree-dynamic skeleton-tree desktop-only-tree"
                style={{
                  "--tree-child-cols": 5,
                  "--branch-cols": 5
                }}
              >
                {/* Root node skeleton */}
                <div className="mini-tree-root-wrapper">
                  <div className="tree-founder skeleton-pulse">
                    <div className="skeleton-avatar" />
                    <div>
                      <span className="skeleton-bar" style={{ width: "80px", height: "12px", marginBottom: "6px" }} />
                      <strong className="skeleton-bar" style={{ width: "120px", height: "16px", marginBottom: "6px" }} />
                      <small className="skeleton-bar" style={{ width: "60px", height: "10px" }} />
                    </div>
                  </div>
                </div>

                {/* Connectors skeleton */}
                <div className="mini-tree-connectors-wrapper">
                  <div className="mini-tree-line-down-from-root" />
                  <div 
                    className="mini-tree-horizontal-line" 
                    style={{
                      left: "10%",
                      right: "10%"
                    }}
                  />
                </div>

                {/* Children row skeleton */}
                <div className="mini-tree-children-wrapper">
                  {[1, 2, 3, 4, 5].map((idx) => (
                    <div key={idx} className="mini-tree-child-column">
                      <div className="mini-tree-line-down-to-child" />
                      <div className="tree-child skeleton-pulse">
                        <span className="tree-child-landscape skeleton-avatar" />
                        <strong className="skeleton-bar" style={{ width: "60px", height: "12px", marginBottom: "4px" }} />
                        <small className="skeleton-bar" style={{ width: "40px", height: "9px" }} />
                      </div>
                      <div className="skeleton-branch-btn skeleton-pulse" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Mobile Skeleton */}
              <div className="mini-family-tree-dynamic skeleton-tree mobile-only-tree">
                {/* Two parent nodes side-by-side */}
                <div className="mini-tree-root-wrapper mobile-root-row">
                  <div className="tree-founder skeleton-pulse parent-node">
                    <div className="skeleton-avatar" />
                    <div>
                      <span className="skeleton-bar" style={{ width: "60px", height: "10px", marginBottom: "4px" }} />
                      <strong className="skeleton-bar" style={{ width: "80px", height: "14px", marginBottom: "4px" }} />
                      <small className="skeleton-bar" style={{ width: "50px", height: "9px" }} />
                    </div>
                  </div>
                  <div className="tree-founder skeleton-pulse spouse-node">
                    <div className="skeleton-avatar" />
                    <div>
                      <span className="skeleton-bar" style={{ width: "60px", height: "10px", marginBottom: "4px" }} />
                      <strong className="skeleton-bar" style={{ width: "80px", height: "14px", marginBottom: "4px" }} />
                      <small className="skeleton-bar" style={{ width: "50px", height: "9px" }} />
                    </div>
                  </div>
                </div>

                {/* Children list */}
                <div className="mini-tree-children-wrapper">
                  {[1, 2, 3, 4, 5].map((idx) => (
                    <div key={idx} className="mini-tree-child-column">
                      <div className="tree-child skeleton-pulse">
                        <span className="tree-child-landscape skeleton-avatar" />
                        <strong className="skeleton-bar" style={{ width: "80px", height: "12px", marginBottom: "4px" }} />
                        <small className="skeleton-bar" style={{ width: "50px", height: "9px" }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Desktop Tree View */}
              <div 
                className="mini-family-tree-dynamic desktop-only-tree"
                style={{
                  "--tree-child-cols": treeChildren.length || 5,
                  "--branch-cols": treeBranches.length || 5
                }}
              >
                {/* Root node */}
                <div className="mini-tree-root-wrapper">
                  <div className="tree-founder">
                    <MemberAvatar member={root} />
                    <div>
                      <span>{root.title || "Thủy tổ dòng họ"}</span>
                      <strong>{root.name}</strong>
                      <small>{getYearsString(root)}</small>
                    </div>
                  </div>
                </div>

                {/* Connectors */}
                {treeChildren.length > 0 && (
                  <div className="mini-tree-connectors-wrapper">
                    <div className="mini-tree-line-down-from-root" />
                    <div 
                      className="mini-tree-horizontal-line" 
                      style={{
                        left: `calc(${100 / treeChildren.length / 2}% )`,
                        right: `calc(${100 / treeChildren.length / 2}% )`
                      }}
                    />
                  </div>
                )}

                {/* Children row */}
                <div className="mini-tree-children-wrapper">
                  {treeChildren.map((child, idx) => {
                    const branch = treeBranches[idx];
                    return (
                      <div key={child.id || idx} className="mini-tree-child-column">
                        <div className="mini-tree-line-down-to-child" />
                        <div 
                          className="tree-child has-tooltip"
                          data-tooltip={`${child.name} (${getYearsString(child)})`}
                        >
                          <MemberAvatar member={child} className="tree-child-landscape" />
                          <strong>{child.name}</strong>
                          <small>{getYearsString(child)}</small>
                        </div>
                        {branch && (
                          <button className="tree-branch-btn" style={{ cursor: "default" }}>
                            <HeritageIcon type="branch" />
                            {branch}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Mobile Tree View (Slide) */}
              {mobileSlides.length > 0 && currentSlide && (
                <div 
                  className="mini-family-tree-dynamic mobile-only-tree"
                  onTouchStart={handleTouchStart}
                  onTouchEnd={handleTouchEnd}
                >
                  {/* Two parent nodes side-by-side */}
                  <div className={`mini-tree-root-wrapper mobile-root-row ${currentSlide.spouse ? "has-spouse" : "single-parent"}`}>
                    <div 
                      className="tree-founder parent-node has-tooltip"
                      data-tooltip={`${currentSlide.parent.name}${getMobileYearsString(currentSlide.parent) ? ` (${getMobileYearsString(currentSlide.parent)})` : ""}`}
                    >
                      <span className="couple-role-badge">
                        {currentSlide.parent.gender === "nam" ? "Ông" : "Bà"}
                      </span>
                      <MemberAvatar member={currentSlide.parent} />
                      <div>
                        <span>{currentSlide.parent.generation === 1 ? "Thủy tổ dòng họ" : `Đời thứ ${currentSlide.parent.generation}`}</span>
                        <strong>{currentSlide.parent.name}</strong>
                        {getMobileYearsString(currentSlide.parent) && <small>{getMobileYearsString(currentSlide.parent)}</small>}
                      </div>
                    </div>
                    {currentSlide.spouse && (
                      <div 
                        className="tree-founder spouse-node has-tooltip"
                        data-tooltip={`${currentSlide.spouse.name}${getMobileYearsString(currentSlide.spouse) ? ` (${getMobileYearsString(currentSlide.spouse)})` : ""}`}
                      >
                        <span className="couple-role-badge">
                          {currentSlide.spouse.gender === "nu" ? "Bà" : "Ông"}
                        </span>
                        <MemberAvatar member={currentSlide.spouse} />
                        <div>
                          <span>{currentSlide.spouse.gender === "nu" ? "Phu nhân" : "Phu quân"}</span>
                          <strong>{currentSlide.spouse.name}</strong>
                          {getMobileYearsString(currentSlide.spouse) && <small>{getMobileYearsString(currentSlide.spouse)}</small>}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mobile-couple-connectors" aria-hidden="true">
                    <span className="mobile-couple-line" />
                    <span className="mobile-family-drop" />
                  </div>

                  {/* Children list */}
                  <div className="mini-tree-children-wrapper">
                    {currentSlide.children.map((child, idx) => {
                      const childSpouse = (child.spouseIds || [])
                        .map(spouseId => members.find(candidate => candidate.id === spouseId))
                        .find(Boolean);
                      const childStatus = getYearsString(child, { hideUnknownDeceased: true });
                      const spouseLabel = childSpouse
                        ? `${getMobileSpouseLabel(child, childSpouse)}: ${childSpouse.name}`
                        : "";

                      return (
                        <div key={child.id || idx} className="mini-tree-child-column">
                          <div 
                            className="tree-child has-tooltip mobile-child-family-card"
                            data-tooltip={`${child.name} (${childStatus})${childSpouse ? ` - ${spouseLabel}` : ""}`}
                          >
                            <MemberAvatar member={child} className="tree-child-landscape" />
                            <strong>
                              <span className="child-name-text">{child.name}</span>
                              {childStatus && <span className="child-inline-status">{childStatus}</span>}
                            </strong>
                            {spouseLabel && <small>{spouseLabel}</small>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}

          {!isLoading && mobileSlides.length > 0 && (
            <div className="hero-dots mobile-only-dots" aria-label="Slide navigation">
              {mobileSlides.map((_, idx) => (
                <span 
                  key={idx} 
                  className={idx === activeSlideIndex ? "active" : ""} 
                  onClick={() => setActiveSlide(idx)}
                  style={{ cursor: "pointer" }}
                />
              ))}
            </div>
          )}
        </aside>
      </section>

      <section className="homepage-stats-row" aria-label="Thống kê dòng họ">
        {stats.map((stat) => (
          <article className={`stat-card stat-${stat.tone}`} key={stat.label}>
            <div className="stat-icon-wrapper">
              <HeritageIcon type={stat.icon} />
            </div>
            <div className="stat-details">
              <div>
                <strong className="stat-number">{stat.value}</strong>
                <span className="stat-label">{stat.label}</span>
              </div>
              <span className="stat-note">{stat.note}</span>
            </div>
          </article>
        ))}
      </section>

      <section className="homepage-features-section" aria-label="Lối vào nhanh">
        {features.map((feature) => (
          <button
            className={`feature-card feature-${feature.tone}`}
            key={feature.title}
            onClick={() => onNavigate(feature.view)}
          >
            <span className="feature-medallion">
              <HeritageIcon type={feature.icon} />
            </span>
            <span className="feature-body">
              <strong className="feature-title serif">{feature.title}</strong>
              <span className="feature-desc">{feature.text}</span>
              <span className="feature-link">Xem chi tiết <span aria-hidden="true">→</span></span>
            </span>
          </button>
        ))}
      </section>

      <section className="homepage-bottom-grid">
        <article className="home-panel panel-notables">
          <div className="column-header-row">
            <h2 className="column-title serif">
              <span className="header-mark" aria-hidden="true" />
              Người tiêu biểu
            </h2>
            <button className="column-more-link" onClick={() => onNavigate("featured")}>Xem tất cả <span aria-hidden="true">→</span></button>
          </div>
          <div className={`notables-list${shouldScrollFeaturedMembers ? " is-scrollable" : ""}`}>
            {isLoading ? (
              [1, 2, 3, 4].map((idx) => (
                <div className="notable-card skeleton-pulse" key={idx} style={{ cursor: "default" }}>
                  <div className="notable-avatar skeleton-avatar" />
                  <span className="notable-copy">
                    <strong className="skeleton-bar" style={{ width: "70px", height: "14px", marginBottom: "6px" }} />
                    <span className="skeleton-bar" style={{ width: "90px", height: "11px", marginBottom: "6px" }} />
                    <span className="skeleton-bar" style={{ width: "60px", height: "10px" }} />
                  </span>
                </div>
              ))
            ) : (
              visibleFeaturedMembers.length > 0 ? (
                visibleFeaturedMembers.map((person) => (
                  <button className="notable-card" key={person.member.id} onClick={() => onOpenPerson(person.member.id)}>
                    <MemberAvatar member={person.member} className="notable-avatar" />
                    <span className="notable-copy">
                      <strong className="notable-name">{person.name}</strong>
                      <span className="notable-title">{person.title}</span>
                      <span className="notable-years">({person.years})</span>
                    </span>
                  </button>
                ))
              ) : (
                <div className="notables-empty-state">
                  Chưa có thành viên nào được đánh dấu là người tiêu biểu.
                </div>
              )
            )}
          </div>
        </article>

        <article className="home-panel panel-events">
          <div className="column-header-row">
            <h2 className="column-title serif">
              <span className="header-mark calendar-mark" aria-hidden="true" />
              Ngày giỗ sắp tới
            </h2>
            <span className="lunar-today-pill">{currentLunarDateLabel}</span>
            <button className="column-more-link" onClick={() => onNavigate("anniversary")}>Xem lịch đầy đủ <span aria-hidden="true">→</span></button>
          </div>
          <div className="anniversaries-list">
            {visibleAnniversaries.length === 0 && !isLoading && (
              <div className="anniversary-empty-state">
                Chưa có thành viên nào được nhập ngày mất.
              </div>
            )}
            {visibleAnniversaries.map((event) => (
              <div 
                className="anniversary-item has-tooltip" 
                key={event.member.id}
                data-tooltip={`${event.title} (${event.date})`}
              >
                <div className="anniversary-date-box">
                  <strong>{event.day}</strong>
                  <span>{event.month}</span>
                </div>
                <div className="anniversary-details">
                  <strong>{event.title}</strong>
                  <span>{event.date}</span>
                  <small>{event.note}</small>
                </div>
                <button className="btn-item-action" onClick={() => onOpenPerson(event.member.id)}>Xem chi tiết</button>
              </div>
            ))}
          </div>
        </article>

        <article className="home-panel panel-history">
          <div className="column-header-row">
            <h2 className="column-title serif">
              <span className="header-mark record-mark" aria-hidden="true" />
              Lịch sử dòng họ
            </h2>
            <button className="column-more-link" onClick={() => onNavigate("history")}>Xem toàn bộ <span aria-hidden="true">→</span></button>
          </div>
          <div className="history-timeline">
            {homepageHistoryEvents.map((event) => (
              <div className="timeline-node" key={event.id || `${event.eventDate}-${event.title}`}>
                <strong>{formatHistoryEventDate(event.eventDate)}</strong>
                <span>{event.description || "Đang cập nhập"}</span>
              </div>
            ))}
          </div>
        </article>
      </section>

      <footer className="traditional-footer">
        <p className="footer-quote serif">
          Cội nguồn là nơi bắt đầu - Ký ức là sợi dây - Tương lai là nơi tiếp nối.
          <span>Nguyện cùng nhau gìn giữ, để dòng họ Trần Công mãi bền vững và tỏa sáng.</span>
        </p>
      </footer>
    </main>
  );
}
