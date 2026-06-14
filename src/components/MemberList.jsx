import { useState } from "react";
import { getAvatarInitials, getAvatarStyle } from "../utils/avatarUtils";
import { getAge, getGenderLabel } from "../utils/mockData";

function MemberListAvatar({ member, className }) {
  if (member.avatar) {
    return <img src={member.avatar} alt="" className={className} aria-hidden="true" />;
  }

  return (
    <span
      className={`${className} generated-avatar`}
      style={getAvatarStyle(member)}
      aria-hidden="true"
    >
      {getAvatarInitials(member.name)}
    </span>
  );
}

export default function MemberList({ members, onSelectPerson, searchQuery }) {
  const [filterGen, setFilterGen] = useState("");
  const [filterGender, setFilterGender] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // Get unique generations list for filter
  const generations = Array.from(new Set(members.map((m) => m.generation))).sort(
    (a, b) => a - b
  );

  // Filter members
  const filteredMembers = members.filter((member) => {
    // Search filter
    const matchesSearch = member.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    // Gen filter
    const matchesGen = filterGen === "" || member.generation === parseInt(filterGen);

    // Gender filter
    const matchesGender = filterGender === "" || member.gender === filterGender;

    // Status filter
    const matchesStatus =
      filterStatus === "" ||
      (filterStatus === "living" && !member.isDeceased) ||
      (filterStatus === "deceased" && member.isDeceased);

    return matchesSearch && matchesGen && matchesGender && matchesStatus;
  });

  return (
    <div className="list-view-container">
      <div className="list-header">
        <h2>Danh sách thành viên ({filteredMembers.length})</h2>
      </div>

      {/* Filter panel */}
      <div className="list-filters">
        <div className="filter-group">
          <label>Đời thứ</label>
          <select
            className="filter-select"
            value={filterGen}
            onChange={(e) => setFilterGen(e.target.value)}
          >
            <option value="">Tất cả các đời</option>
            {generations.map((gen) => (
              <option key={gen} value={gen}>
                Đời thứ {gen}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Giới tính</label>
          <select
            className="filter-select"
            value={filterGender}
            onChange={(e) => setFilterGender(e.target.value)}
          >
            <option value="">Tất cả</option>
            <option value="nam">Nam</option>
            <option value="nu">Nữ</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Trạng thái</label>
          <select
            className="filter-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">Tất cả</option>
            <option value="living">Còn sống</option>
            <option value="deceased">Đã mất</option>
          </select>
        </div>

        <div className="filter-group" style={{ justifyContent: "flex-end" }}>
          <button
            className="btn btn-secondary"
            onClick={() => {
              setFilterGen("");
              setFilterGender("");
              setFilterStatus("");
            }}
            style={{ padding: "8px 16px", borderRadius: "8px", fontSize: "0.85rem" }}
          >
            🔄 Đặt lại bộ lọc
          </button>
        </div>
      </div>

      {/* Members table */}
      {filteredMembers.length === 0 ? (
        <div className="empty-state glass">
          <span className="empty-icon">📁</span>
          <h3>Không tìm thấy thành viên nào</h3>
          <p>Hãy thử thay đổi điều kiện lọc hoặc nhập từ khóa tìm kiếm khác.</p>
        </div>
      ) : (
        <>
          {/* Desktop Table Wrapper */}
          <div className="list-table-wrapper">
            <table className="list-table">
              <thead>
                <tr>
                  <th>Họ và tên</th>
                  <th>Giới tính</th>
                  <th>Thế hệ</th>
                  <th>Tuổi/Thọ</th>
                  <th>Trạng thái</th>
                  <th>Nơi sinh</th>
                  <th>Nghề nghiệp</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map((member) => {
                  const age = getAge(member.birthDate, member.deathDate, member.isDeceased);
                  return (
                    <tr key={member.id} onClick={() => onSelectPerson(member.id)}>
                      <td style={{ fontWeight: 600 }}>
                        <MemberListAvatar member={member} className="table-avatar" />
                        {member.name}
                      </td>
                      <td>{getGenderLabel(member.gender)}</td>
                      <td>Đời thứ {member.generation}</td>
                      <td>{age !== null ? `${age} tuổi` : "Chưa rõ"}</td>
                      <td>
                        {member.isDeceased ? (
                          <span className="badge badge-secondary">🕯️ Đã mất</span>
                        ) : (
                          <span className="badge badge-success">🟢 Còn sống</span>
                        )}
                      </td>
                      <td>{member.birthPlace || "Chưa rõ"}</td>
                      <td>{member.occupation || "Chưa rõ"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile responsive cards list */}
          <div className="mobile-card-list">
            {filteredMembers.map((member) => {
              const age = getAge(member.birthDate, member.deathDate, member.isDeceased);
              return (
                <div
                  key={member.id}
                  className={`mobile-member-card glass ${member.gender} ${
                    member.isDeceased ? "deceased" : ""
                  }`}
                  onClick={() => onSelectPerson(member.id)}
                >
                  <div className="mobile-card-header">
                    <span className="mobile-card-name">
                      <MemberListAvatar member={member} className="mobile-list-avatar" />
                      {member.name}
                    </span>
                    <span className="mobile-card-gen">Đời {member.generation}</span>
                  </div>
                  <div className="mobile-card-body">
                    <div className="mobile-meta-row">
                      <span>Tuổi/Thọ: {age !== null ? `${age} tuổi` : "Chưa rõ"}</span>
                      <span>
                        {member.isDeceased ? "🕯️ Đã mất" : "🟢 Còn sống"}
                      </span>
                    </div>
                    {member.occupation && <div className="mobile-meta-desc">💼 {member.occupation}</div>}
                    {member.birthPlace && <div className="mobile-meta-desc">📍 {member.birthPlace}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
