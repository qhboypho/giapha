import React from "react";
import "./Homepage.css";
import lotusPainting from "../assets/lotus_painting.png";
import avatarTinh from "../assets/avatar_tinh.png";
import avatarNghi from "../assets/avatar_nghi.png";
import avatarNghia from "../assets/avatar_nghia.png";
import avatarTri from "../assets/avatar_tri.png";

export default function Homepage({ onNavigate }) {
  return (
    <div className="homepage-container">
      {/* 1. Hero Section */}
      <header className="homepage-hero">
        <div className="hero-content">
          <div className="hero-text-side">
            <h1 className="hero-title serif">
              Lưu giữ cội nguồn <br />
              <span className="hero-title-sub">– Kết nối muôn đời con cháu</span>
            </h1>
            <p className="hero-description">
              Gia phả là sợi dây thiêng liêng kết nối quá khứ – hiện tại – tương lai.
              Cùng nhau gìn giữ cội nguồn, vun đắp truyền thống cho muôn đời con cháu.
            </p>
            <div className="hero-cta-buttons">
              <button
                id="btn-explore-tree"
                className="btn btn-primary btn-cta"
                onClick={() => onNavigate("tree")}
              >
                🌳 Khám phá gia phả
              </button>
              <button
                id="btn-find-relative"
                className="btn btn-outline btn-cta-outline"
                onClick={() => onNavigate("list")}
              >
                👥 Tìm người thân
              </button>
            </div>
            <div className="hero-left-art">
              <img src={lotusPainting} alt="Tranh hoa sen màu nước" className="lotus-art-img" />
            </div>
          </div>

          <div className="hero-tree-preview-side">
            <div className="tree-preview-card glass">
              <div className="tree-preview-header">
                <span className="tree-preview-tag">🌿 Cây gia phả dòng chính</span>
                <button
                  id="btn-view-full-tree"
                  className="btn-link"
                  onClick={() => onNavigate("tree")}
                >
                  Xem toàn bộ cây phả &rarr;
                </button>
              </div>

              {/* Mini Tree Diagram */}
              <div className="mini-tree-visual">
                {/* Level 1: Thủy tổ */}
                <div className="mini-tree-row">
                  <div className="mini-node root-node">
                    <img src={avatarTinh} alt="Trần Công Tinh" className="mini-avatar" />
                    <div className="mini-node-info">
                      <span className="mini-node-role">Thủy tổ</span>
                      <h4 className="mini-node-name">Trần Công Tinh</h4>
                      <span className="mini-node-years">1240 - 1310</span>
                    </div>
                  </div>
                </div>

                {/* Connectors Layer */}
                <div className="mini-connectors">
                  <svg width="100%" height="40" viewBox="0 0 300 40" fill="none" className="mini-svg-lines">
                    <path d="M150 0 V15 H50 V40 M150 15 V40 M150 15 H250 V40" stroke="var(--heritage-gold)" strokeWidth="1.5" />
                  </svg>
                </div>

                {/* Level 2: 3 Sons */}
                <div className="mini-tree-row row-sons">
                  <div className="mini-node">
                    <img src={avatarNghi} alt="Trần Công Nghi" className="mini-avatar" />
                    <div className="mini-node-info">
                      <h5 className="mini-node-name">Trần Công Nghi</h5>
                      <span className="mini-node-years">1265 - 1335</span>
                    </div>
                  </div>
                  <div className="mini-node active-branch">
                    <img src={avatarNghia} alt="Trần Công Nghĩa" className="mini-avatar" />
                    <div className="mini-node-info">
                      <h5 className="mini-node-name">Trần Công Nghĩa</h5>
                      <span className="mini-node-years">1270 - 1340</span>
                    </div>
                  </div>
                  <div className="mini-node">
                    <img src={avatarTri} alt="Trần Công Trị" className="mini-avatar" />
                    <div className="mini-node-info">
                      <h5 className="mini-node-name">Trần Công Trị</h5>
                      <span className="mini-node-years">1275 - 1345</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Branch shortcuts */}
              <div className="tree-preview-branches">
                <span className="branch-item" onClick={() => onNavigate("tree")}>Chi Nhất</span>
                <span className="branch-item" onClick={() => onNavigate("tree")}>Chi Nhị</span>
                <span className="branch-item active" onClick={() => onNavigate("tree")}>Chi Ba</span>
                <span className="branch-item" onClick={() => onNavigate("tree")}>Chi Tư</span>
                <span className="branch-item" onClick={() => onNavigate("tree")}>Chi Năm</span>
                <span className="branch-item" onClick={() => onNavigate("tree")}>Chi Sáu</span>
              </div>
              <div className="carousel-dots">
                <span className="dot"></span>
                <span className="dot active"></span>
                <span className="dot"></span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 2. Stats Grid Section */}
      <section className="homepage-stats-row">
        <div className="stat-card glass">
          <div className="stat-icon-wrapper">
            <span className="stat-icon">🏛️</span>
          </div>
          <div className="stat-details">
            <h3 className="stat-number">26 Đời</h3>
            <span className="stat-label">Lịch sử dòng họ</span>
          </div>
        </div>
        <div className="stat-card glass">
          <div className="stat-icon-wrapper">
            <span className="stat-icon">👥</span>
          </div>
          <div className="stat-details">
            <h3 className="stat-number">1.284</h3>
            <span className="stat-label">Thành viên ghi danh</span>
          </div>
        </div>
        <div className="stat-card glass">
          <div className="stat-icon-wrapper">
            <span className="stat-icon">🌿</span>
          </div>
          <div className="stat-details">
            <h3 className="stat-number">8</h3>
            <span className="stat-label">Chi nhánh kết nối</span>
          </div>
        </div>
        <div className="stat-card glass">
          <div className="stat-icon-wrapper">
            <span className="stat-icon">📅</span>
          </div>
          <div className="stat-details">
            <h3 className="stat-number">03</h3>
            <span className="stat-label">Ngày giỗ sắp tới (30 ngày)</span>
          </div>
        </div>
      </section>

      {/* 3. Feature Link Cards */}
      <section className="homepage-features-section">
        <div className="feature-card glass glass-hover" onClick={() => onNavigate("tree")}>
          <div className="feature-icon">🌳</div>
          <h3 className="feature-title serif">Cây phả hệ</h3>
          <p className="feature-desc">Khám phá sơ đồ gia phả trực quan, dễ dàng theo dõi các thế hệ đời con cháu.</p>
          <span className="feature-link">Xem chi tiết &rarr;</span>
        </div>
        <div className="feature-card glass glass-hover" onClick={() => onNavigate("tree")}>
          <div className="feature-icon">📜</div>
          <h3 className="feature-title serif">Hồ sơ tổ tiên</h3>
          <p className="feature-desc">Lưu giữ thông tin, tiểu sử quý giá và hình ảnh truyền thống của tiền nhân.</p>
          <span className="feature-link">Xem chi tiết &rarr;</span>
        </div>
        <div className="feature-card glass glass-hover" onClick={() => onNavigate("tree")}>
          <div className="feature-icon">📅</div>
          <h3 className="feature-title serif">Ngày giỗ & sự kiện</h3>
          <p className="feature-desc">Quản lý lịch cúng giỗ, lễ họ, họp họ và các cột mốc quan trọng âm dương.</p>
          <span className="feature-link">Xem chi tiết &rarr;</span>
        </div>
        <div className="feature-card glass glass-hover" onClick={() => onNavigate("tree")}>
          <div className="feature-icon">🖼️</div>
          <h3 className="feature-title serif">Ký ức gia đình</h3>
          <p className="feature-desc">Nơi lưu giữ album ảnh gia đình, các câu chuyện truyền đời đầy ý nghĩa.</p>
          <span className="feature-link">Xem chi tiết &rarr;</span>
        </div>
      </section>

      {/* 4. Bottom Grid (3 Columns) */}
      <section className="homepage-bottom-grid">
        {/* Column 1: Danh nhân tiêu biểu */}
        <div className="grid-column column-notables">
          <div className="column-header-row">
            <h3 className="column-title serif">🏆 Danh nhân tiêu biểu</h3>
            <span className="column-more-link" onClick={() => onNavigate("tree")}>Xem tất cả &rarr;</span>
          </div>
          <div className="notables-list">
            <div className="notable-card">
              <img src={avatarTinh} alt="Trần Công Tinh" className="notable-avatar" />
              <div className="notable-info">
                <h4 className="notable-name">Trần Công Tinh</h4>
                <span className="notable-title">Thủy tổ dòng họ (1240 - 1310)</span>
              </div>
            </div>
            <div className="notable-card">
              <img src={avatarNghi} alt="Trần Công Nghi" className="notable-avatar" />
              <div className="notable-info">
                <h4 className="notable-name">Trần Công Nghi</h4>
                <span className="notable-title">Khai quốc công thần (1265 - 1335)</span>
              </div>
            </div>
            <div className="notable-card">
              <img src={avatarNghia} alt="Trần Công Nghĩa" className="notable-avatar" />
              <div className="notable-info">
                <h4 className="notable-name">Trần Công Nghĩa</h4>
                <span className="notable-title">Triệu đại Trần (1270 - 1340)</span>
              </div>
            </div>
            <div className="notable-card">
              <img src={avatarTri} alt="Trần Công Trị" className="notable-avatar" />
              <div className="notable-info">
                <h4 className="notable-name">Trần Công Trị</h4>
                <span className="notable-title">Nhà nho, nhà giáo (1275 - 1345)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Column 2: Ngày giỗ sắp tới */}
        <div className="grid-column column-anniversaries">
          <div className="column-header-row">
            <h3 className="column-title serif">📅 Ngày giỗ sắp tới</h3>
            <span className="column-more-link" onClick={() => onNavigate("tree")}>Xem lịch đầy đủ &rarr;</span>
          </div>
          <div className="anniversaries-list">
            <div className="anniversary-item">
              <div className="anniversary-date-box">
                <span className="date-day">15</span>
                <span className="date-month">Tháng 5</span>
              </div>
              <div className="anniversary-details">
                <h4 className="anniversary-title">Giỗ Thủy tổ Trần Công Tinh</h4>
                <span className="anniversary-time">Thứ Năm, 15/05/2025 (18/04 Âm Lịch)</span>
                <span className="anniversary-loc">📍 Từ đường họ Trần Công</span>
              </div>
              <button className="btn-item-action" onClick={() => onNavigate("tree")}>Xem chi tiết</button>
            </div>

            <div className="anniversary-item">
              <div className="anniversary-date-box">
                <span className="date-day">02</span>
                <span className="date-month">Tháng 6</span>
              </div>
              <div className="anniversary-details">
                <h4 className="anniversary-title">Giỗ Trần Công Nghi</h4>
                <span className="anniversary-time">Thứ Hai, 02/06/2025 (07/05 Âm Lịch)</span>
                <span className="anniversary-loc">📍 Từ đường họ Trần Công</span>
              </div>
              <button className="btn-item-action" onClick={() => onNavigate("tree")}>Xem chi tiết</button>
            </div>

            <div className="anniversary-item">
              <div className="anniversary-date-box">
                <span className="date-day">18</span>
                <span className="date-month">Tháng 6</span>
              </div>
              <div className="anniversary-details">
                <h4 className="anniversary-title">Giỗ Trần Công Nghĩa</h4>
                <span className="anniversary-time">Thứ Tư, 18/06/2025 (23/05 Âm Lịch)</span>
                <span className="anniversary-loc">📍 Từ đường họ Trần Công</span>
              </div>
              <button className="btn-item-action" onClick={() => onNavigate("tree")}>Xem chi tiết</button>
            </div>
          </div>
          <button className="btn-view-more-events" onClick={() => onNavigate("tree")}>
            Xem thêm sự kiện &rarr;
          </button>
        </div>

        {/* Column 3: Lịch sử dòng họ */}
        <div className="grid-column column-timeline">
          <div className="column-header-row">
            <h3 className="column-title serif">📜 Lịch sử dòng họ</h3>
            <span className="column-more-link" onClick={() => onNavigate("tree")}>Xem toàn bộ &rarr;</span>
          </div>
          <div className="history-timeline">
            <div className="timeline-node">
              <span className="timeline-year">1240</span>
              <p className="timeline-desc">Thủy tổ Trần Công Tinh đặt nền móng lập nghiệp cho dòng họ Trần Công.</p>
            </div>
            <div className="timeline-node">
              <span className="timeline-year">1265</span>
              <p className="timeline-desc">Trần Công Nghi phò vua, lập công lớn trong việc giữ yên bờ cõi phía Nam.</p>
            </div>
            <div className="timeline-node">
              <span className="timeline-year">1300</span>
              <p className="timeline-desc">Các chi nhánh con cháu bắt đầu tách lập hương hỏa, di cư lập nghiệp ở các vùng miền.</p>
            </div>
            <div className="timeline-node">
              <span className="timeline-year">1600</span>
              <p className="timeline-desc">Dòng họ phát triển hưng thịnh, nhiều người đỗ đạt bảng vàng khoa cử làm quan lớn triều đình.</p>
            </div>
            <div className="timeline-node">
              <span className="timeline-year">1900</span>
              <p className="timeline-desc">Gìn giữ truyền thống yêu nước, đoàn kết đóng góp xây dựng quê hương xứ sở từ đường họ.</p>
            </div>
            <div className="timeline-node active">
              <span className="timeline-year">Hiện tại</span>
              <p className="timeline-desc">Con cháu cùng nhau kết nối phả hệ số, gìn giữ nguồn cội và phát triển cho các thế hệ tương lai.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Traditional Footer Bar */}
      <footer className="traditional-footer">
        <div className="footer-crest-decor">
          <span className="footer-crest-icon">🏵️</span>
        </div>
        <p className="footer-quote font-quote">
          “Cội nguồn là nơi bắt đầu – Ký ức là sợi dây – Tương lai là nơi tiếp nối. <br />
          Nguyện cùng nhau gìn giữ, để dòng họ Trần Công mãi bền vững và tỏa sáng.”
        </p>
      </footer>
    </div>
  );
}
