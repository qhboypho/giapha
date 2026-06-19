import { useMemo, useState } from "react";
import {
  BookOpenText,
  ChevronDown,
  ChevronRight,
  GitBranch,
  MapPin,
  Network,
  UserRound,
  Users
} from "lucide-react";
import { getAvatarInitials, getAvatarStyle } from "../utils/avatarUtils";
import { getYearsString } from "../utils/anniversaryUtils";
import { sortMembersByBirthOrder } from "../utils/sortUtils";

function GenerationAvatar({ member }) {
  if (member.avatar) {
    return <img className="generation-member-avatar" src={member.avatar} alt={member.name} />;
  }

  return (
    <span className="generation-member-avatar generated-avatar" style={getAvatarStyle(member)}>
      {getAvatarInitials(member.name)}
    </span>
  );
}

function getPrimaryGenerationMembers(members, selectedGeneration) {
  const generationMembers = sortMembersByBirthOrder(
    members.filter((member) => Number(member.generation) === Number(selectedGeneration))
  );
  const usedMemberIds = new Set();

  return generationMembers.filter((member) => {
    if (usedMemberIds.has(member.id)) return false;
    usedMemberIds.add(member.id);
    (member.spouseIds || []).forEach((spouseId) => usedMemberIds.add(spouseId));
    return true;
  });
}

function buildGenerationGroups(members, selectedGeneration) {
  const memberById = new Map(members.map((member) => [member.id, member]));
  const generationMembers = getPrimaryGenerationMembers(members, selectedGeneration);

  const resolveParentPair = (member) => {
    let father = memberById.get(member.fatherId);
    let mother = memberById.get(member.motherId);

    if (father && !mother) {
      mother = (father.spouseIds || [])
        .map((id) => memberById.get(id))
        .find((spouse) => spouse && Number(spouse.generation) === Number(selectedGeneration) - 1) || null;
    }

    if (mother && !father) {
      father = (mother.spouseIds || [])
        .map((id) => memberById.get(id))
        .find((spouse) => spouse && Number(spouse.generation) === Number(selectedGeneration) - 1) || null;
    }

    return { father, mother };
  };

  if (selectedGeneration <= 1) {
    return [
      {
        id: "generation-founder",
        title: "Thủy tổ",
        subtitle: "Khởi nguồn dòng họ",
        parents: [],
        members: generationMembers
      }
    ];
  }

  const groups = new Map();

  generationMembers.forEach((member) => {
    const { father, mother } = resolveParentPair(member);
    const key = `${father?.id || member.fatherId || "unknown-father"}:${mother?.id || member.motherId || "unknown-mother"}`;

    if (!groups.has(key)) {
      const parentNames = [father?.name, mother?.name].filter(Boolean);
      groups.set(key, {
        id: key,
        title: parentNames.length > 0 ? parentNames.join(" - ") : "Chưa rõ cha mẹ",
        subtitle: `Cha mẹ đời ${selectedGeneration - 1}`,
        parents: [father, mother].filter(Boolean),
        members: []
      });
    }

    groups.get(key).members.push(member);
  });

  return Array.from(groups.values()).sort((a, b) => {
    const firstA = a.members[0];
    const firstB = b.members[0];
    return (
      (firstA?.generation || 0) - (firstB?.generation || 0) ||
      String(firstA?.createdAt || firstA?.id || "").localeCompare(String(firstB?.createdAt || firstB?.id || ""))
    );
  });
}

function getSpouses(member, memberById) {
  return (member.spouseIds || [])
    .map((id) => memberById.get(id))
    .filter(Boolean);
}

function parseDeclaredChildCount(text = "") {
  const normalized = text
    .toLocaleLowerCase("vi-VN")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  const match = normalized.match(/\bco\s+(\d+)\s+(?:nguoi\s+)?con\b/);
  return match ? Number(match[1]) : 0;
}

function getChildCount(member, spouses, members) {
  const parentIds = new Set([member.id, ...spouses.map((spouse) => spouse.id)]);
  const linkedChildCount = getPrimaryGenerationMembers(members, Number(member.generation) + 1).filter(
    (item) => parentIds.has(item.fatherId) || parentIds.has(item.motherId)
  ).length;

  if (linkedChildCount > 0) return linkedChildCount;

  const declaredCounts = [member, ...spouses]
    .map((person) => parseDeclaredChildCount(person?.bio || ""))
    .filter((count) => count > 0);

  return declaredCounts.length > 0 ? Math.max(...declaredCounts) : 0;
}

function GenerationSkeleton() {
  return (
    <div className="generation-family-group skeleton-pulse">
      <div className="generation-couple-head">
        <span className="skeleton-bar" style={{ width: 170, height: 18 }} />
        <span className="skeleton-bar" style={{ width: 110, height: 12 }} />
      </div>
      <div className="generation-members-grid">
        {[1, 2, 3].map((item) => (
          <div className="generation-member-card" key={item}>
            <span className="generation-member-avatar skeleton-avatar" />
            <span className="generation-member-main">
              <span className="skeleton-bar" style={{ width: "65%", height: 16 }} />
              <span className="skeleton-bar" style={{ width: "48%", height: 12 }} />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function GenerationsPage({ members = [], isLoading = false, onOpenPerson }) {
  const generations = useMemo(() => {
    return Array.from(new Set(members.map((member) => Number(member.generation)).filter(Boolean))).sort((a, b) => a - b);
  }, [members]);

  const [selectedGeneration, setSelectedGeneration] = useState(() => generations[0] || 1);
  const [collapsedGroupState, setCollapsedGroupState] = useState(() => ({
    generation: null,
    ids: new Set()
  }));
  const activeGeneration = generations.includes(selectedGeneration) ? selectedGeneration : generations[0] || 1;
  const collapsedGroups = collapsedGroupState.generation === activeGeneration ? collapsedGroupState.ids : new Set();

  const memberById = useMemo(() => new Map(members.map((member) => [member.id, member])), [members]);
  const generationGroups = useMemo(
    () => buildGenerationGroups(members, activeGeneration),
    [members, activeGeneration]
  );
  const peopleCount = generationGroups.reduce((total, group) => total + group.members.length, 0);
  const generationCounts = useMemo(() => {
    return new Map(
      generations.map((generation) => [
        generation,
        getPrimaryGenerationMembers(members, generation).length
      ])
    );
  }, [generations, members]);

  const handleGenerationChange = (generation) => {
    const nextGeneration = Number(generation);
    setSelectedGeneration(nextGeneration);
    setCollapsedGroupState({ generation: nextGeneration, ids: new Set() });
  };

  const toggleGroup = (groupId) => {
    setCollapsedGroupState((current) => {
      const currentIds = current.generation === activeGeneration ? current.ids : new Set();
      const next = new Set(currentIds);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return { generation: activeGeneration, ids: next };
    });
  };

  return (
    <section className="directory-page generations-page">
      <div className="directory-hero generations-hero">
        <div>
          <span className="directory-kicker">
            <BookOpenText strokeWidth={1.8} />
            Phả hệ theo từng đời
          </span>
          <h1>Các đời</h1>
          <p>
            Chọn một đời để xem riêng nhánh gia phả của đời đó, giữ thứ tự anh chị em theo dữ liệu cây gia phả đã nhập.
          </p>
        </div>
        <div className="directory-summary generations-summary">
          <strong>Đang xem đời {activeGeneration}</strong>
          <small>{peopleCount} thành viên trong {generationGroups.length} nhánh</small>
        </div>
      </div>

      <div className="generation-controls" aria-label="Chọn đời">
        <div className="generation-tabs">
          {generations.map((generation) => (
            <button
              type="button"
              key={generation}
              className={`generation-tab ${activeGeneration === generation ? "active" : ""}`}
              onClick={() => handleGenerationChange(generation)}
            >
              <span>Đời {generation}</span>
              <small>{generationCounts.get(generation) || 0} người</small>
            </button>
          ))}
        </div>
        <label className="generation-select-wrap">
          <span>Chọn đời</span>
          <select value={activeGeneration} onChange={(event) => handleGenerationChange(event.target.value)}>
            {generations.map((generation) => (
              <option key={generation} value={generation}>
                Đời {generation}
              </option>
            ))}
          </select>
          <ChevronDown strokeWidth={2} aria-hidden="true" />
        </label>
      </div>

      {isLoading ? (
        <div className="generation-groups">
          {[1, 2].map((item) => <GenerationSkeleton key={item} />)}
        </div>
      ) : generationGroups.length > 0 && peopleCount > 0 ? (
        <div className="generation-groups">
          {generationGroups.map((group, groupIndex) => {
            const isCollapsed = collapsedGroups.has(group.id);
            const ToggleIcon = isCollapsed ? ChevronRight : ChevronDown;

            return (
              <section
                className={`generation-family-group ${isCollapsed ? "is-collapsed" : ""}`}
                key={group.id}
                style={{ "--index": groupIndex }}
              >
                <button
                  type="button"
                  className="generation-couple-head generation-couple-toggle-row"
                  aria-expanded={!isCollapsed}
                  aria-label={`${isCollapsed ? "Mở" : "Đóng"} nhánh ${group.title}`}
                  onClick={() => toggleGroup(group.id)}
                >
                  <span className="generation-couple-icon" aria-hidden="true">
                    <Network strokeWidth={1.9} />
                  </span>
                  <span className="generation-couple-text">
                    <span className="generation-couple-title-line">
                      <strong>{group.title}</strong>
                      <span className="generation-branch-count">
                        <Users strokeWidth={1.8} />
                        <span>{group.members.length} người con</span>
                      </span>
                    </span>
                    <small>{group.subtitle}</small>
                  </span>
                  <span className="generation-branch-arrow" aria-hidden="true">
                    <ToggleIcon strokeWidth={2.2} />
                  </span>
                </button>

                {!isCollapsed && (
                  <>
                    <div className="generation-tree-stem" aria-hidden="true" />

                    <div className="generation-members-grid">
                      {group.members.map((member) => {
                        const spouses = getSpouses(member, memberById);
                        const childCount = getChildCount(member, spouses, members);

                        return (
                          <button
                            type="button"
                            className={`generation-member-card ${member.gender || ""} ${member.isDeceased ? "deceased" : ""}`}
                            key={member.id}
                            onClick={() => onOpenPerson(member.id)}
                          >
                            <GenerationAvatar member={member} />
                            <span className="generation-member-main">
                              <span className="generation-member-topline">
                                <strong>{member.name}</strong>
                                <em>Đời {member.generation || "?"}</em>
                              </span>
                              <span className="generation-member-meta">
                                <UserRound strokeWidth={1.7} />
                                {getYearsString(member)}
                              </span>
                              {spouses.length > 0 && (
                                <span className="generation-member-spouse">
                                  {member.gender === "nam" ? "Bà" : "Ông"}: {spouses.map((spouse) => spouse.name).join(", ")}
                                </span>
                              )}
                              <span className="generation-member-children">
                                <GitBranch strokeWidth={1.7} />
                                Con cái: {childCount > 0 ? `${childCount} người` : "Đang cập nhật"}
                              </span>
                              {(member.birthPlace || member.address) && (
                                <span className="generation-member-place">
                                  <MapPin strokeWidth={1.7} />
                                  {member.birthPlace || member.address}
                                </span>
                              )}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </section>
            );
          })}
        </div>
      ) : (
        <div className="directory-empty-state">
          <Network strokeWidth={1.8} />
          <h2>Chưa có dữ liệu đời {activeGeneration}</h2>
          <p>Đời này chưa có thành viên đủ dữ liệu cha mẹ để dựng thành nhánh riêng.</p>
        </div>
      )}
    </section>
  );
}
