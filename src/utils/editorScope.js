export function buildEditorScopeIds(members = [], rootId) {
  if (!rootId) return null;
  const memberById = new Map(members.map((member) => [member.id, member]));
  if (!memberById.has(rootId)) return new Set();

  const scopeIds = new Set([rootId]);
  let changed = true;

  while (changed) {
    changed = false;

    members.forEach((member) => {
      const isChildOfScope = scopeIds.has(member.fatherId) || scopeIds.has(member.motherId);
      const isSpouseOfScope = member.spouseIds?.some((spouseId) => scopeIds.has(spouseId));
      const hasSpouseInScope = Array.from(scopeIds).some((scopeId) => {
        const scopedMember = memberById.get(scopeId);
        return scopedMember?.spouseIds?.includes(member.id);
      });

      if ((isChildOfScope || isSpouseOfScope || hasSpouseInScope) && !scopeIds.has(member.id)) {
        scopeIds.add(member.id);
        changed = true;
      }
    });
  }

  return scopeIds;
}

export function getEditableScopeIds(user, members = []) {
  if (!user || user.role !== "editor" || !user.editScopeRootId) return null;
  return buildEditorScopeIds(members, user.editScopeRootId);
}

export function canEditMemberInScope(user, members = [], memberId) {
  if (user?.role === "admin") return true;
  if (user?.role !== "editor") return false;
  if (!user.editScopeRootId) return true;
  return getEditableScopeIds(user, members)?.has(memberId) || false;
}

export function getScopeRootOptions(members = []) {
  return members
    .filter((member) => members.some((child) => child.fatherId === member.id || child.motherId === member.id))
    .sort((a, b) => Number(a.generation || 0) - Number(b.generation || 0) || a.name.localeCompare(b.name, "vi"))
    .map((member) => {
      const spouse = member.spouseIds
        ?.map((spouseId) => members.find((candidate) => candidate.id === spouseId))
        .find(Boolean);
      return {
        id: member.id,
        generation: member.generation,
        label: spouse ? `Đời ${member.generation}: ${member.name} - ${spouse.name}` : `Đời ${member.generation}: ${member.name}`
      };
    });
}
