import { Award, MapPin, Search, Sparkles, UserRound } from "lucide-react";
import { getAvatarInitials, getAvatarStyle } from "../utils/avatarUtils";
import { getYearsString } from "../utils/anniversaryUtils";

function FeaturedAvatar({ member }) {
  if (member.avatar) {
    return <img className="featured-page-avatar" src={member.avatar} alt={member.name} />;
  }

  return (
    <span className="featured-page-avatar generated-avatar" style={getAvatarStyle(member)}>
      {getAvatarInitials(member.name)}
    </span>
  );
}

function FeaturedSkeleton() {
  return (
    <div className="directory-card skeleton-pulse">
      <span className="featured-page-avatar skeleton-avatar" />
      <div className="directory-card-main">
        <span className="skeleton-bar" style={{ width: "52%", height: 18 }} />
        <span className="skeleton-bar" style={{ width: "36%", height: 12 }} />
        <span className="skeleton-bar" style={{ width: "78%", height: 12 }} />
      </div>
    </div>
  );
}

export default function FeaturedMembersPage({ members = [], isLoading = false, onOpenPerson }) {
  const featuredMembers = members
    .filter((member) => member.isFeatured)
    .sort((a, b) => (a.generation || 0) - (b.generation || 0) || a.name.localeCompare(b.name, "vi"));

  const generations = new Set(featuredMembers.map((member) => member.generation)).size;

  return (
    <section className="directory-page featured-directory-page">
      <div className="directory-hero">
        <div>
          <span className="directory-kicker">
            <Award strokeWidth={1.8} />
            Hồ sơ được đánh dấu
          </span>
          <h1>Người tiêu biểu</h1>
          <p>
            Tổng hợp các thành viên nổi bật trong gia phả, hiển thị từ dữ liệu thật đã được tích chọn trong hồ sơ.
          </p>
        </div>
        <div className="directory-summary">
          <strong>{featuredMembers.length}</strong>
          <span>người tiêu biểu</span>
          <small>{generations || 0} đời đang có dữ liệu</small>
        </div>
      </div>

      {isLoading ? (
        <div className="directory-grid">
          {[1, 2, 3, 4].map((item) => <FeaturedSkeleton key={item} />)}
        </div>
      ) : featuredMembers.length > 0 ? (
        <div className="directory-grid">
          {featuredMembers.map((member) => (
            <button className="directory-card featured-directory-card" key={member.id} onClick={() => onOpenPerson(member.id)}>
              <FeaturedAvatar member={member} />
              <span className="directory-card-main">
                <span className="directory-card-topline">
                  <strong>{member.name}</strong>
                  <em>Đời {member.generation || "?"}</em>
                </span>
                <span className="directory-card-meta">
                  <UserRound strokeWidth={1.8} />
                  {getYearsString(member)}
                </span>
                {member.occupation && (
                  <span className="directory-card-note">{member.occupation}</span>
                )}
                {(member.birthPlace || member.address) && (
                  <span className="directory-card-place">
                    <MapPin strokeWidth={1.8} />
                    {member.birthPlace || member.address}
                  </span>
                )}
              </span>
              <span className="directory-card-mark" aria-hidden="true">
                <Sparkles strokeWidth={1.7} />
              </span>
            </button>
          ))}
        </div>
      ) : (
        <div className="directory-empty-state">
          <Search strokeWidth={1.8} />
          <h2>Chưa có người tiêu biểu</h2>
          <p>Vào hồ sơ thành viên, tích chọn “Người tiêu biểu” để người đó xuất hiện tại đây.</p>
        </div>
      )}
    </section>
  );
}
