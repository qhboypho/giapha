import "./Homepage.css";
import {
  CalendarDays,
  FileText,
  Images,
  Landmark,
  Network,
  TreeDeciduous,
  Users
} from "lucide-react";
import paperBg from "../assets/homepage-design/paper-bg.png";
import mountainBg from "../assets/homepage-design/mountain-bg-cutout.png";
import lotusWatercolor from "../assets/homepage-design/lotus-watercolor-cutout.png";
import pineWatercolor from "../assets/homepage-design/pine-watercolor-cutout.png";
import goldClouds from "../assets/homepage-design/gold-clouds-cutout.png";
import goldWavesLotus from "../assets/homepage-design/gold-waves-lotus-cutout.png";
import goldBorders from "../assets/homepage-design/gold-borders-cutout.png";
import avatarTinh from "../assets/avatar_tinh.png";
import avatarNghi from "../assets/avatar_nghi.png";
import avatarNghia from "../assets/avatar_nghia.png";
import avatarTri from "../assets/avatar_tri.png";

const people = [
  {
    name: "Trần Công Tinh",
    title: "Thủy tổ dòng họ",
    years: "1240 - 1310",
    avatar: avatarTinh
  },
  {
    name: "Trần Công Nghi",
    title: "Khai quốc công thần",
    years: "1265 - 1335",
    avatar: avatarNghi
  },
  {
    name: "Trần Công Nghĩa",
    title: "Triệu đại Trần",
    years: "1270 - 1340",
    avatar: avatarNghia
  },
  {
    name: "Trần Công Trị",
    title: "Nhà nho, nhà giáo",
    years: "1275 - 1345",
    avatar: avatarTri
  }
];

const stats = [
  { value: "26", label: "Đời", note: "Lịch sử dòng họ", tone: "green", icon: "temple" },
  { value: "1.284", label: "Thành viên", note: "Đã ghi danh", tone: "red", icon: "people" },
  { value: "8", label: "Chi nhánh", note: "Đang kết nối", tone: "gold", icon: "branch" },
  { value: "03", label: "Ngày giỗ sắp tới", note: "Trong 30 ngày tới", tone: "green", icon: "calendar" }
];

const features = [
  {
    title: "Cây phả hệ",
    text: "Khám phá sơ đồ gia phả trực quan, dễ dàng theo dõi các đời.",
    icon: "tree",
    tone: "green"
  },
  {
    title: "Hồ sơ tổ tiên",
    text: "Lưu giữ thông tin, tiểu sử của các bậc tiền nhân.",
    icon: "record",
    tone: "gold"
  },
  {
    title: "Ngày giỗ & sự kiện",
    text: "Quản lý ngày giỗ, sự kiện quan trọng của dòng họ.",
    icon: "calendar",
    tone: "red"
  },
  {
    title: "Ký ức gia đình",
    text: "Lưu giữ hình ảnh, kỷ vật và câu chuyện gia đình.",
    icon: "memory",
    tone: "teal"
  }
];

const events = [
  {
    day: "15",
    month: "Tháng 5",
    title: "Giỗ Thủy tổ Trần Công Tinh",
    date: "Thứ Năm, 15/05/2025 (18/04 AL)"
  },
  {
    day: "02",
    month: "Tháng 6",
    title: "Giỗ Trần Công Nghi",
    date: "Thứ Hai, 02/06/2025 (07/05 AL)"
  },
  {
    day: "18",
    month: "Tháng 6",
    title: "Giỗ Trần Công Nghĩa",
    date: "Thứ Tư, 18/06/2025 (23/05 AL)"
  }
];

const history = [
  ["1240", "Thủy tổ Trần Công Tinh đặt nền móng cho dòng họ Trần Công."],
  ["1265", "Trần Công Nghi phò vua, có công lớn trong việc giữ yên bờ cõi."],
  ["1300", "Các chi nhánh dần hình thành, phát triển tại nhiều vùng đất."],
  ["1600", "Dòng họ phát triển hưng thịnh, nhiều người đỗ đạt, làm quan."],
  ["1900", "Gìn giữ truyền thống, đoàn kết xây dựng quê hương."],
  ["Hiện tại", "Cùng nhau kết nối, gìn giữ và phát triển cho mai sau."]
];

const heritageIconMap = {
  temple: Landmark,
  people: Users,
  branch: Network,
  calendar: CalendarDays,
  tree: TreeDeciduous,
  record: FileText,
  memory: Images
};

function HeritageIcon({ type }) {
  const Icon = heritageIconMap[type] || Network;
  return (
    <span className={`heritage-icon heritage-icon-${type}`} aria-hidden="true">
      <Icon strokeWidth={2.15} />
    </span>
  );
}

export default function Homepage({ onNavigate }) {
  return (
    <main
      className="homepage-container"
      style={{
        "--home-paper-bg": `url(${paperBg})`,
        "--home-mountain-bg": `url(${mountainBg})`,
        "--home-gold-clouds": `url(${goldClouds})`,
        "--home-gold-waves-lotus": `url(${goldWavesLotus})`,
        "--home-gold-borders": `url(${goldBorders})`
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
            <span>- Kết nối muôn đời con cháu</span>
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
          <span className="panel-cloud panel-cloud-left" aria-hidden="true" />
          <span className="panel-cloud panel-cloud-right" aria-hidden="true" />
          <div className="mini-family-tree">
            <div className="tree-founder">
              <img src={avatarTinh} alt="Trần Công Tinh" />
              <div>
                <span>Thủy tổ</span>
                <strong>Trần Công Tinh</strong>
                <small>1240 - 1310</small>
              </div>
            </div>
            <div className="tree-lines" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <div className="tree-children">
              {people.slice(1).map((person) => (
                <div className="tree-child" key={person.name}>
                  <span className="tree-child-landscape" aria-hidden="true" />
                  <strong>{person.name}</strong>
                  <small>{person.years}</small>
                </div>
              ))}
            </div>
            <div className="branch-row">
              {["Chi Nhất", "Chi Nhì", "Chi Ba", "Chi Tư", "Chi Năm", "Chi Sáu"].map((branch) => (
                <button key={branch} onClick={() => onNavigate("tree")}>
                  <HeritageIcon type="branch" />
                  {branch}
                </button>
              ))}
            </div>
          </div>
          <div className="hero-dots" aria-hidden="true">
            <span className="active" />
            <span />
            <span />
            <span />
          </div>
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
            onClick={() => onNavigate(feature.title === "Cây phả hệ" ? "tree" : "list")}
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
              Danh nhân tiêu biểu
            </h2>
            <button className="column-more-link" onClick={() => onNavigate("tree")}>Xem tất cả <span aria-hidden="true">→</span></button>
          </div>
          <div className="notables-list">
            {people.map((person) => (
              <button className="notable-card" key={person.name} onClick={() => onNavigate("tree")}>
                <img src={person.avatar} alt={person.name} className="notable-avatar" />
                <strong className="notable-name">{person.name}</strong>
                <span className="notable-title">{person.title}</span>
                <span className="notable-years">({person.years})</span>
              </button>
            ))}
          </div>
        </article>

        <article className="home-panel panel-events">
          <div className="column-header-row">
            <h2 className="column-title serif">
              <span className="header-mark calendar-mark" aria-hidden="true" />
              Ngày giỗ sắp tới
            </h2>
            <button className="column-more-link" onClick={() => onNavigate("tree")}>Xem lịch đầy đủ <span aria-hidden="true">→</span></button>
          </div>
          <div className="anniversaries-list">
            {events.map((event) => (
              <div className="anniversary-item" key={event.title}>
                <div className="anniversary-date-box">
                  <strong>{event.day}</strong>
                  <span>{event.month}</span>
                </div>
                <div className="anniversary-details">
                  <strong>{event.title}</strong>
                  <span>{event.date}</span>
                  <small>Từ đường họ Trần Công</small>
                </div>
                <button className="btn-item-action" onClick={() => onNavigate("tree")}>Xem chi tiết</button>
              </div>
            ))}
          </div>
          <button className="btn-view-more-events" onClick={() => onNavigate("tree")}>Xem thêm sự kiện <span aria-hidden="true">→</span></button>
        </article>

        <article className="home-panel panel-history">
          <div className="column-header-row">
            <h2 className="column-title serif">
              <span className="header-mark record-mark" aria-hidden="true" />
              Lịch sử dòng họ
            </h2>
            <button className="column-more-link" onClick={() => onNavigate("tree")}>Xem toàn bộ <span aria-hidden="true">→</span></button>
          </div>
          <div className="history-timeline">
            {history.map(([year, text]) => (
              <div className="timeline-node" key={year}>
                <strong>{year}</strong>
                <span>{text}</span>
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
