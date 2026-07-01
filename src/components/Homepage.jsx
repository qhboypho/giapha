import { useEffect, useState, useRef } from "react";
import { getAvatarInitials, getAvatarStyle } from "../utils/avatarUtils";
import { buildUpcomingAnniversaries, getCurrentLunarDateLabel, getYearsString } from "../utils/anniversaryUtils";
import { buildHomepageHistoryEvents, formatHistoryEventDate } from "../utils/familyHistoryUtils";
import { DEFAULT_SITE_CONFIG, normalizeSiteConfig } from "../utils/siteConfigUtils";
import { sortMembersByBirthOrder } from "../utils/sortUtils";
import { getInLawLabel } from "../utils/relationLabels";
import "./Homepage.css";
import {
  CalendarDays,
  Check,
  ChevronDown,
  Flame,
  FileText,
  Gift,
  HandHeart,
  Images,
  Landmark,
  Network,
  TreeDeciduous,
  X,
  UserRoundCheck,
  Users
} from "lucide-react";
import paperBg from "../assets/homepage-design/paper-bg.png";
import mountainBg from "../assets/homepage-design/new-mountain-bg.png";
import pineWatercolor from "../assets/homepage-design/new-pine-watercolor.png";
import goldClouds from "../assets/homepage-design/gold-clouds-cutout.png";
import goldWavesLotus from "../assets/homepage-design/gold-waves-lotus-cutout.png";
import goldBorders from "../assets/homepage-design/gold-borders-cutout.png";
import dongsonDrum from "../assets/homepage-design/dongson-drum.jpg";

// Static fallback removed
const INCENSE_VIEWER_ID_STORAGE_KEY = "giapha_tc_viewer_id";
const INCENSE_VIEWER_ID_PATTERN = /^[a-zA-Z0-9_-]{16,80}$/;

const getOrCreateIncenseViewerId = () => {
  const existing = localStorage.getItem(INCENSE_VIEWER_ID_STORAGE_KEY);
  if (existing && INCENSE_VIEWER_ID_PATTERN.test(existing)) return existing;

  const nextId = crypto.randomUUID?.() || `viewer_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  localStorage.setItem(INCENSE_VIEWER_ID_STORAGE_KEY, nextId);
  return nextId;
};

const slugifyIncensePart = (value) => (
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48) || "anniversary"
);

const buildIncenseAnniversaryKey = (event) => (
  `${slugifyIncensePart(event?.day)}_${slugifyIncensePart(event?.month)}`
);

const INCENSE_GIFT_OPTIONS = [
  { id: "incense", label: "Nhang" },
  { id: "candle", label: "Nến" },
  { id: "flowers", label: "Hoa" },
  { id: "fruit", label: "Trái cây" },
  { id: "tea", label: "Trà" },
  { id: "wine", label: "Rượu" },
  { id: "rice", label: "Cơm" },
  { id: "betel", label: "Trầu cau" },
  { id: "sweets", label: "Bánh kẹo" },
  { id: "paper-gold", label: "Vàng mã" },
  { id: "water", label: "Nước" }
];

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

function IncenseOfferingModal({ event, onClose }) {
  const member = event?.member;
  const anniversaryKey = buildIncenseAnniversaryKey(event);
  const [count, setCount] = useState(0);
  const [isLoadingCount, setIsLoadingCount] = useState(true);
  const [isOffering, setIsOffering] = useState(false);
  const [hasOffered, setHasOffered] = useState(false);
  const [error, setError] = useState("");
  const [selectedGiftIds, setSelectedGiftIds] = useState([]);
  const [isGiftPickerOpen, setIsGiftPickerOpen] = useState(false);
  const selectedGifts = INCENSE_GIFT_OPTIONS.filter((item) => selectedGiftIds.includes(item.id));

  useEffect(() => {
    if (!member?.id) return undefined;
    let cancelled = false;

    const loadCount = async () => {
      setIsLoadingCount(true);
      setError("");
      try {
        const res = await fetch(`/api/incense-offerings/${encodeURIComponent(member.id)}?anniversaryKey=${encodeURIComponent(anniversaryKey)}`);
        const data = await res.json();
        if (!cancelled) {
          if (data.success) {
            setCount(Number(data.count || 0));
          } else {
            setError(data.error || "Chưa tải được số lượt thắp hương.");
          }
        }
      } catch {
        if (!cancelled) setError("Không thể kết nối để tải số lượt thắp hương.");
      } finally {
        if (!cancelled) setIsLoadingCount(false);
      }
    };

    loadCount();
    return () => {
      cancelled = true;
    };
  }, [anniversaryKey, member?.id]);

  if (!event || !member) return null;

  const handleOfferIncense = async () => {
    if (isOffering) return;
    if (selectedGiftIds.length === 0) {
      setError("Vui lòng chọn ít nhất một lễ vật.");
      return;
    }
    setIsOffering(true);
    setError("");
    try {
      const res = await fetch(`/api/incense-offerings/${encodeURIComponent(member.id)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          viewerId: getOrCreateIncenseViewerId(),
          anniversaryKey,
          giftItems: selectedGiftIds
        })
      });
      const data = await res.json();
      if (data.success) {
        setCount(Number(data.count || 0));
        setHasOffered(true);
      } else {
        setError(data.error || "Chưa thắp hương được, vui lòng thử lại.");
      }
    } catch {
      setError("Không thể kết nối để thắp hương.");
    } finally {
      setIsOffering(false);
    }
  };

  const toggleGift = (giftId) => {
    if (hasOffered) return;
    setSelectedGiftIds((current) => (
      current.includes(giftId)
        ? current.filter((id) => id !== giftId)
        : [...current, giftId]
    ));
  };

  return (
    <div className="incense-modal-overlay" role="dialog" aria-modal="true" aria-label={`Thắp hương cho ${member.name}`} onClick={onClose}>
      <div className="incense-modal" onClick={(eventClick) => eventClick.stopPropagation()}>
        <header className="incense-modal-header">
          <span className="incense-modal-title">
            <Flame size={18} strokeWidth={2.2} />
            Thắp hương online
          </span>
          <button type="button" className="incense-modal-close" onClick={onClose} aria-label="Đóng">
            <X size={22} strokeWidth={2.4} />
          </button>
        </header>

        <div className="incense-altar">
          <div className="incense-avatar-ring">
            <MemberAvatar member={member} className={`incense-avatar ${member.isDeceased ? "deceased" : ""}`} />
          </div>
          <span className="incense-ritual-label">
            {event.title.endsWith(member.name) ? event.title.slice(0, -member.name.length).trim() : event.title}
          </span>
          <h3>{member.name}</h3>
          <span>{event.date}</span>
        </div>

        <div className="incense-flame-stage" aria-hidden="true">
          <span className="incense-stick">
            <span className="incense-stick-flame" />
            <span className="incense-smoke incense-smoke-one" />
            <span className="incense-smoke incense-smoke-two" />
          </span>
        </div>

        <div className="incense-counter-panel">
          <span className="incense-counter-label">
            <HandHeart size={16} strokeWidth={2.1} />
            Số người đã thắp hương
          </span>
          <strong className="incense-counter-number">{isLoadingCount ? "..." : count.toLocaleString("vi-VN")}</strong>
          <div className="incense-counter-track">
            <span style={{ width: `${Math.min(100, Math.max(8, count * 9))}%` }} />
          </div>
        </div>

        <div className="incense-gift-section">
          <button
            type="button"
            className="incense-gift-toggle"
            onClick={() => setIsGiftPickerOpen(true)}
            disabled={hasOffered}
          >
            <span>
              <Gift size={16} strokeWidth={2.1} />
              Chọn lễ vật
            </span>
            <strong>{selectedGifts.length}</strong>
            <ChevronDown size={16} strokeWidth={2.2} />
          </button>
          {selectedGifts.length > 0 ? (
            <div className="incense-selected-gifts" aria-label="Lễ vật đã chọn">
              {selectedGifts.map((gift) => (
                <span key={gift.id}>
                  <Check size={13} strokeWidth={2.5} />
                  {gift.label}
                </span>
              ))}
            </div>
          ) : (
            <p className="incense-gift-hint">Chọn ít nhất một lễ vật trước khi thắp hương.</p>
          )}
        </div>

        {error && <p className="incense-error">{error}</p>}
        {hasOffered && <p className="incense-success">Nén hương của bạn đã được ghi nhận.</p>}

        <button
          type="button"
          className="incense-submit-btn"
          onClick={handleOfferIncense}
          disabled={isOffering || selectedGiftIds.length === 0 || hasOffered}
        >
          <Flame size={17} strokeWidth={2.2} />
          {isOffering ? "Đang thắp..." : hasOffered ? "Đã thắp hương" : "Thắp hương"}
        </button>
        {isGiftPickerOpen && (
          <div className="incense-gift-picker-backdrop" role="dialog" aria-modal="true" aria-label="Chọn lễ vật" onClick={() => setIsGiftPickerOpen(false)}>
            <div className="incense-gift-picker" onClick={(eventClick) => eventClick.stopPropagation()}>
              <div className="incense-gift-picker-head">
                <span>
                  <Gift size={17} strokeWidth={2.1} />
                  Lễ vật
                </span>
                <button type="button" onClick={() => setIsGiftPickerOpen(false)} aria-label="Đóng chọn lễ vật">
                  <X size={20} strokeWidth={2.4} />
                </button>
              </div>
              <div className="incense-gift-list">
                {INCENSE_GIFT_OPTIONS.map((gift) => {
                  const selected = selectedGiftIds.includes(gift.id);
                  return (
                    <button
                      type="button"
                      key={gift.id}
                      className={`incense-gift-option${selected ? " selected" : ""}`}
                      onClick={() => toggleGift(gift.id)}
                    >
                      <span className="incense-gift-option-icon">
                        <Gift size={15} strokeWidth={2.1} />
                      </span>
                      <span>{gift.label}</span>
                      {selected ? <Check size={17} strokeWidth={2.6} /> : <span className="incense-gift-option-empty" />}
                    </button>
                  );
                })}
              </div>
              <button type="button" className="incense-gift-done" onClick={() => setIsGiftPickerOpen(false)}>
                Xong
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const features = [
  {
    title: "Cây gia phả",
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

export default function Homepage({ siteConfig = DEFAULT_SITE_CONFIG, onNavigate, onOpenPerson, onOpenPersonModal, members = [], historyEvents = [], isLoading = false, activeViewersCount = 0 }) {
  const config = normalizeSiteConfig(siteConfig);
  const homepageConfig = config.homepage;
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
  const suppressPersonClickRef = useRef(false);
  const [incenseEvent, setIncenseEvent] = useState(null);
  const getMobileYearsString = (member) => getYearsString(member, { hideUnknownDeceased: true });

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
    if (homepageConfig.mobileTreeSlidesMode === "manual") {
      const selectedRootIds = homepageConfig.mobileTreeSlideRootIds || [];
      const selectedIdSet = new Set(selectedRootIds);
      const selectedSlides = slides
        .filter((slide) => selectedIdSet.has(slide.parent.id) || (slide.spouse && selectedIdSet.has(slide.spouse.id)))
        .sort((a, b) => {
          const aIndex = selectedRootIds.findIndex((id) => id === a.parent.id || id === a.spouse?.id);
          const bIndex = selectedRootIds.findIndex((id) => id === b.parent.id || id === b.spouse?.id);
          return aIndex - bIndex;
        });

      return selectedSlides.length > 0 ? selectedSlides : slides.slice(0, 1);
    }

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
    const didSwipe = Math.abs(diff) > 50;
    if (diff > 50) {
      // Swipe left -> next slide
      setActiveSlide((prev) => Math.min(prev + 1, mobileSlides.length - 1));
    } else if (diff < -50) {
      // Swipe right -> prev slide
      setActiveSlide((prev) => Math.max(prev - 1, 0));
    }
    if (didSwipe) {
      suppressPersonClickRef.current = true;
      window.setTimeout(() => {
        suppressPersonClickRef.current = false;
      }, 0);
    }
  };

  const shouldOpenPersonModalOnHomepage = () => (
    typeof window !== "undefined" &&
    window.matchMedia("(max-width: 760px)").matches
  );

  const handleHomepagePersonOpen = (id) => {
    if (!id) return;
    if (suppressPersonClickRef.current) return;
    if (shouldOpenPersonModalOnHomepage() && onOpenPersonModal) {
      onOpenPersonModal(id);
      return;
    }
    onOpenPerson(id);
  };

  const handleHomepagePersonKeyDown = (event, id) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    handleHomepagePersonOpen(id);
  };

  const handleAnniversaryAction = (event, isNearestAnniversary) => {
    if (isNearestAnniversary) {
      setIncenseEvent(event);
      return;
    }
    handleHomepagePersonOpen(event.member.id);
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
  const visibleFeaturedMembers = featuredMembers.slice(0, homepageConfig.featuredLimit);
  const shouldScrollFeaturedMembers = visibleFeaturedMembers.length > 4;

  const upcomingAnniversaries = buildUpcomingAnniversaries(members);
  const upcomingAnniversariesCount = members.length > 0
    ? upcomingAnniversaries.filter((event) => event.daysUntil <= homepageConfig.anniversaryWindowDays).length
    : 0;
  const visibleAnniversaries = upcomingAnniversaries.slice(0, homepageConfig.anniversaryLimit);
  const shouldShowBottomGrid = homepageConfig.showFeatured || homepageConfig.showAnniversaries || homepageConfig.showHistory;

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
          src={config.heroLotusUrl}
          alt="Hoa sen màu nước"
          className="hero-lotus-art"
        />
        <div className="home-hero-copy">
          <span className="hero-cloud-mark" aria-hidden="true" />
          <h1 className="hero-title serif">
            {config.heroTitle}
            <span>{config.heroSubtitle}</span>
          </h1>
          <span
            className={`hero-divider ${config.heroSeparatorUrl ? "has-image" : ""}`}
            style={config.heroSeparatorUrl ? { "--hero-separator-image": `url("${config.heroSeparatorUrl}")` } : undefined}
            aria-hidden="true"
          />
          <p className="hero-description">
            {config.heroDescription}
          </p>
          <div className="hero-cta-buttons">
            <button className="heritage-btn heritage-btn-primary" onClick={() => onNavigate("tree")}>
              <HeritageIcon type="branch" />
              {config.primaryCtaLabel}
            </button>
            <button className="heritage-btn heritage-btn-secondary" onClick={() => onNavigate("list")}>
              <HeritageIcon type="people" />
              {config.secondaryCtaLabel}
            </button>
          </div>
        </div>

        <aside className="hero-tree-panel">
          <div className="panel-heading">
            <strong>{config.mainTreeTitle}</strong>
            <button className="panel-link" onClick={() => onNavigate("tree")}>
              Xem toàn bộ cây
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
                  <div
                    className="tree-founder"
                    role="button"
                    tabIndex={0}
                    onClick={() => handleHomepagePersonOpen(root.id)}
                    onKeyDown={(event) => handleHomepagePersonKeyDown(event, root.id)}
                  >
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
                          role="button"
                          tabIndex={0}
                          onClick={() => handleHomepagePersonOpen(child.id)}
                          onKeyDown={(event) => handleHomepagePersonKeyDown(event, child.id)}
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
                      role="button"
                      tabIndex={0}
                      onClick={() => handleHomepagePersonOpen(currentSlide.parent.id)}
                      onKeyDown={(event) => handleHomepagePersonKeyDown(event, currentSlide.parent.id)}
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
                        role="button"
                        tabIndex={0}
                        onClick={() => handleHomepagePersonOpen(currentSlide.spouse.id)}
                        onKeyDown={(event) => handleHomepagePersonKeyDown(event, currentSlide.spouse.id)}
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
                        ? `${getInLawLabel(childSpouse)}: ${childSpouse.name}`
                        : "";

                      return (
                        <div key={child.id || idx} className="mini-tree-child-column">
                          <div 
                            className="tree-child has-tooltip mobile-child-family-card"
                            data-tooltip={`${child.name} (${childStatus})${childSpouse ? ` - ${spouseLabel}` : ""}`}
                            role="button"
                            tabIndex={0}
                            onClick={() => handleHomepagePersonOpen(child.id)}
                            onKeyDown={(event) => handleHomepagePersonKeyDown(event, child.id)}
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

      {homepageConfig.showStats && <section className="homepage-stats-row" aria-label="Thống kê dòng họ">
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
      </section>}

      {homepageConfig.showFeatures && <section className="homepage-features-section" aria-label="Lối vào nhanh">
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
      </section>}

      {shouldShowBottomGrid && <section className="homepage-bottom-grid">
        {homepageConfig.showFeatured && <article className="home-panel panel-notables">
          <div className="column-header-row">
            <h2 className="column-title serif">
              <UserRoundCheck className="header-mark" aria-hidden="true" />
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
                  <button className="notable-card" key={person.member.id} onClick={() => handleHomepagePersonOpen(person.member.id)}>
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
        </article>}

        {homepageConfig.showAnniversaries && <article className="home-panel panel-events">
          <div className="column-header-row">
            <h2 className="column-title serif">
              <CalendarDays className="header-mark" aria-hidden="true" />
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
            {visibleAnniversaries.map((event, idx) => {
              const isNearestAnniversary = idx === 0;
              const titlePrefix = event.title.endsWith(event.member.name)
                ? event.title.slice(0, -event.member.name.length)
                : "";
              const titleName = titlePrefix ? event.member.name : event.title;

              return (
              <div 
                className={`anniversary-item has-tooltip${isNearestAnniversary ? " is-nearest" : ""}`}
                key={event.member.id}
                data-tooltip={`${event.title} (${event.date})`}
              >
                <div className="anniversary-date-box">
                  <strong>{event.day}</strong>
                  <span>{event.month}</span>
                </div>
                <div className="anniversary-details">
                  <strong>
                    {titlePrefix}
                    <span className={isNearestAnniversary ? "anniversary-highlight-name" : undefined}>{titleName}</span>
                  </strong>
                  <span>{event.date}</span>
                  <small>{event.note}</small>
                </div>
                <button
                  className={`btn-item-action${isNearestAnniversary ? " incense-action" : ""}`}
                  onClick={() => handleAnniversaryAction(event, isNearestAnniversary)}
                >
                  {isNearestAnniversary ? "Thắp hương" : "Xem chi tiết"}
                </button>
              </div>
              );
            })}
          </div>
        </article>}

        {homepageConfig.showHistory && <article className="home-panel panel-history">
          <div className="column-header-row">
            <h2 className="column-title serif">
              <FileText className="header-mark" aria-hidden="true" />
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
        </article>}
      </section>}

      <footer className="traditional-footer">
        <p className="footer-quote serif">
          {config.footerQuote}
          <span>{config.footerMessage}</span>
        </p>
        {config.contact.showInFooter && (
          <div className="footer-contact">
            {config.contact.managerName && <span>Quản trị: {config.contact.managerName}</span>}
            {config.contact.phone && <span>Điện thoại: {config.contact.phone}</span>}
            {config.contact.zalo && <span>Zalo: {config.contact.zalo}</span>}
            {config.contact.email && <span>Email: {config.contact.email}</span>}
            {config.contact.address && <span>{config.contact.address}</span>}
            {config.contact.facebookUrl && <a href={config.contact.facebookUrl} target="_blank" rel="noreferrer">Facebook</a>}
            {config.contact.youtubeUrl && <a href={config.contact.youtubeUrl} target="_blank" rel="noreferrer">YouTube</a>}
          </div>
        )}
      </footer>
      {incenseEvent && (
        <IncenseOfferingModal
          event={incenseEvent}
          onClose={() => setIncenseEvent(null)}
        />
      )}
    </main>
  );
}
