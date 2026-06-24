import { getAvatarInitials, getAvatarStyle } from "../utils/avatarUtils";
import { canEditMemberInScope } from "../utils/editorScope";
import { getAge, getGenderLabel } from "../utils/mockData";
import { DEFAULT_SITE_CONFIG, normalizeSiteConfig } from "../utils/siteConfigUtils";
import { sortMembersByBirthOrder } from "../utils/sortUtils";

export default function Sidebar({
  personId,
  members,
  onSelectPerson,
  onClose,
  onEditPerson,
  onAddRelative,
  currentUser,
  showSensitiveInfo,
  siteConfig = DEFAULT_SITE_CONFIG
}) {
  const person = members.find((m) => m.id === personId);
  if (!person) return null;

  const fieldConfig = normalizeSiteConfig(siteConfig).memberFields;
  const age = getAge(person.birthDate, person.deathDate, person.isDeceased);

  // Retrieve relations
  const father = members.find((m) => m.id === person.fatherId);
  const mother = members.find((m) => m.id === person.motherId);
  
  // Spouses
  const spouses = members.filter((m) => person.spouseIds?.includes(m.id));
  const memberById = new Map(members.map((member) => [member.id, member]));
  const maxGeneration = members.length > 0 ? Math.max(...members.map((member) => member.generation || 1)) : person.generation || 1;
  const recentGenerationCutoff = Math.max(1, maxGeneration - 1);

  // Children
  const parentIds = new Set([person.id, ...spouses.map((spouse) => spouse.id)]);
  const childCandidates = sortMembersByBirthOrder(
    members.filter((member) => parentIds.has(member.fatherId) || parentIds.has(member.motherId))
  );
  const childCandidateIds = new Set(childCandidates.map((member) => member.id));
  const consumedChildIds = new Set();
  const numericIdOrder = (id) => {
    const match = String(id || "").match(/\d+$/);
    return match ? parseInt(match[0], 10) : Number.MAX_SAFE_INTEGER;
  };
  const isLinkedToCurrentCouple = (member) => parentIds.has(member.fatherId) || parentIds.has(member.motherId);
  const children = [];

  childCandidates.forEach((child) => {
    if (consumedChildIds.has(child.id)) return;

    const spouseInCandidateGroup = (child.spouseIds || [])
      .map((spouseId) => memberById.get(spouseId))
      .find((spouse) => spouse && childCandidateIds.has(spouse.id));

    if (!spouseInCandidateGroup) {
      consumedChildIds.add(child.id);
      children.push(child);
      return;
    }

    const childLinked = isLinkedToCurrentCouple(child);
    const spouseLinked = isLinkedToCurrentCouple(spouseInCandidateGroup);
    const primaryChild = childLinked && !spouseLinked
      ? child
      : spouseLinked && !childLinked
        ? spouseInCandidateGroup
        : numericIdOrder(child.id) <= numericIdOrder(spouseInCandidateGroup.id)
          ? child
          : spouseInCandidateGroup;

    consumedChildIds.add(child.id);
    consumedChildIds.add(spouseInCandidateGroup.id);
    children.push(primaryChild);
  });

  const canEdit = canEditMemberInScope(currentUser, members, person.id);
  const canEditProfile = canEdit && (!person.sensitiveMasked || showSensitiveInfo);

  const renderRelationAvatar = (member, className) => {
    const classNames = `${className} ${member.isDeceased ? "deceased" : ""}`;

    if (member.avatar) {
      return <img src={member.avatar} alt="" className={classNames} aria-hidden="true" />;
    }

    return (
      <div
        className={`${classNames} generated-avatar`}
        style={getAvatarStyle(member)}
        aria-hidden="true"
      >
        {getAvatarInitials(member.name)}
      </div>
    );
  };

  const getSpouseLabel = (member, spouse) => {
    if (!spouse) return "";
    const isRecentGeneration = member.generation >= recentGenerationCutoff;
    if (isRecentGeneration) {
      return spouse.gender === "nu" ? "Vợ" : "Chồng";
    }
    return spouse.gender === "nu" ? "Bà" : "Ông";
  };

  const getPrimarySpouse = (member) => (
    (member.spouseIds || [])
      .map((spouseId) => memberById.get(spouseId))
      .find(Boolean) || null
  );

  return (
    <aside className="sidebar glass">
      <div className="sidebar-handle-bar"></div>
      <div className="sidebar-header">
        <h3>Hồ sơ Thành viên</h3>
        <button className="sidebar-close" onClick={onClose}>
          ❌
        </button>
      </div>

      <div className="sidebar-body">
        {/* Profile Card Hero */}
        <div className="profile-hero animate-scale-up">
          <div
            className={`profile-avatar ${person.isDeceased ? "deceased" : ""} ${person.avatar ? "" : "generated-avatar"}`}
            style={person.avatar ? undefined : getAvatarStyle(person)}
          >
            {person.avatar ? (
              <img
                src={person.avatar}
                alt={person.name}
                className="profile-avatar"
                style={{ border: "none" }}
              />
            ) : (
              getAvatarInitials(person.name)
            )}
          </div>
          <h2 className="profile-name">{person.name}</h2>
          
          <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
            <span className="badge badge-primary">Đời thứ {person.generation}</span>
            {person.isDeceased ? (
              <span className="badge badge-secondary">🕯️ Đã khuất</span>
            ) : (
              <span className="badge badge-success">🟢 Còn sống</span>
            )}
          </div>

          {/* Action buttons */}
          {canEdit && (
            <div className="profile-actions">
              <button
                className="btn btn-secondary"
                onClick={() => onEditPerson(person)}
                title="Chỉnh sửa hồ sơ"
                disabled={!canEditProfile}
              >
                {canEditProfile ? "📝 Sửa" : "🔒 Bật xem riêng để sửa"}
              </button>
              <button
                className="btn btn-primary"
                onClick={() => onAddRelative(person)}
                title="Thêm quan hệ gia đình"
              >
                ➕ Thêm thân nhân
              </button>
            </div>
          )}
        </div>

        {/* Section 1: Tiểu sử */}
        <div className="info-section">
          <h4>ℹ️ Thông tin cá nhân</h4>
          <div className="info-grid">
            <span className="info-label">Giới tính:</span>
            <span className="info-value">{getGenderLabel(person.gender)}</span>

            <span className="info-label">Ngày sinh:</span>
            <span className="info-value">
              {person.birthDate ? new Date(person.birthDate).toLocaleDateString("vi-VN") : "Chưa rõ"}
            </span>

            {person.isDeceased ? (
              <>
                <span className="info-label">Ngày mất:</span>
                <span className="info-value">
                  {person.deathDate ? new Date(person.deathDate).toLocaleDateString("vi-VN") : "Chưa rõ"}
                </span>
                <span className="info-label">Thọ/Hưởng thọ:</span>
                <span className="info-value">{age !== null ? `${age} tuổi` : "Chưa rõ"}</span>
                {fieldConfig.restingPlace && (
                  <>
                    <span className="info-label">Nơi an nghỉ:</span>
                    <span className="info-value">{person.restingPlace || "Chưa rõ"}</span>
                  </>
                )}
              </>
            ) : (
              <>
                <span className="info-label">Tuổi hiện tại:</span>
                <span className="info-value">{age !== null ? `${age} tuổi` : "Chưa rõ"}</span>
                {fieldConfig.phone && person.phone && (
                  <>
                    <span className="info-label">Điện thoại:</span>
                    <span className="info-value">{person.phone}</span>
                  </>
                )}
                {fieldConfig.address && person.address && (
                  <>
                    <span className="info-label">Địa chỉ:</span>
                    <span className="info-value">{person.address}</span>
                  </>
                )}
              </>
            )}

            <span className="info-label">Nơi sinh:</span>
            <span className="info-value">{person.birthPlace || "Chưa rõ"}</span>

            {fieldConfig.occupation && (
              <>
                <span className="info-label">Nghề nghiệp:</span>
                <span className="info-value">{person.occupation || "Chưa rõ"}</span>
              </>
            )}
          </div>
        </div>

        {/* Section 2: Tóm tắt cuộc đời */}
        <div className="info-section">
          <h4>📜 Tiểu sử & Ghi chú</h4>
          <p style={{ fontSize: "0.85rem", lineHeight: "1.5", color: "var(--text-secondary)" }}>
            {person.bio || "Chưa có thông tin tiểu sử chi tiết."}
          </p>
        </div>

        {/* Section 3: Quan hệ trực hệ */}
        <div className="info-section">
          <h4>👥 Mối quan hệ trực hệ</h4>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "8px" }}>
            {/* Parents */}
            {(father || mother) && (
              <div>
                <p className="info-label" style={{ fontSize: "0.75rem", marginBottom: "4px" }}>Cha mẹ:</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  {father && (
                    <div 
                      className="relation-item has-tooltip" 
                      onClick={() => onSelectPerson(father.id)}
                      data-tooltip={father.name}
                    >
                      {renderRelationAvatar(father, "relation-avatar")}
                      <div className="relation-details">
                        <span className="relation-name">{father.name}</span>
                        <span className="relation-role">Cha</span>
                      </div>
                    </div>
                  )}
                  {mother && (
                    <div 
                      className="relation-item has-tooltip" 
                      onClick={() => onSelectPerson(mother.id)}
                      data-tooltip={mother.name}
                    >
                      {renderRelationAvatar(mother, "relation-avatar")}
                      <div className="relation-details">
                        <span className="relation-name">{mother.name}</span>
                        <span className="relation-role">Mẹ</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Spouses */}
            {spouses.length > 0 && (
              <div>
                <p className="info-label" style={{ fontSize: "0.75rem", marginBottom: "4px" }}>Bạn đời:</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {spouses.map((spouse) => (
                    <div 
                      key={spouse.id} 
                      className="relation-item has-tooltip" 
                      onClick={() => onSelectPerson(spouse.id)}
                      data-tooltip={spouse.name}
                    >
                      {renderRelationAvatar(spouse, "relation-avatar")}
                      <div className="relation-details">
                        <span className="relation-name">{spouse.name}</span>
                        <span className="relation-role">
                          {person.gender === "nam" ? "Vợ" : "Chồng"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Children */}
            {children.length > 0 && (
              <div>
                <p className="info-label" style={{ fontSize: "0.75rem", marginBottom: "4px" }}>
                  Con cái ({children.length}):
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {children.map((child) => {
                    const childSpouse = getPrimarySpouse(child);
                    const spouseLabel = getSpouseLabel(child, childSpouse);

                    return (
                      <div
                        key={child.id}
                        className="relation-item has-tooltip"
                        onClick={() => onSelectPerson(child.id)}
                        data-tooltip={`${child.name}${childSpouse ? ` - ${spouseLabel}: ${childSpouse.name}` : ""}`}
                      >
                        {renderRelationAvatar(child, "relation-avatar")}
                        <div className="relation-details">
                          <span className="relation-name">{child.name}</span>
                          <span className="relation-role">
                            {child.gender === "nam" ? "Con trai" : "Con gái"} (Đời thứ {child.generation})
                          </span>
                          {childSpouse && (
                            <span className="relation-role relation-spouse-role">
                              {spouseLabel}: {childSpouse.name}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
