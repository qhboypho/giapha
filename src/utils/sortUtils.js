/**
 * sortUtils.js
 * Utility functions for sorting family tree members consistently.
 * Sorts siblings by birthDate only when every sibling in the group has a valid
 * birthDate. If the group has incomplete birth data, keep a stable creation/id
 * order so a single dated younger sibling cannot jump ahead of older siblings.
 */

export const sortMembersByBirthOrder = (list) => {
  if (!list || !Array.isArray(list)) return [];

  const hasValidBirthDate = (member) => {
    if (!member?.birthDate) return false;
    return !Number.isNaN(new Date(member.birthDate).valueOf());
  };

  const canSortByBirthDate = list.length > 1 && list.every(hasValidBirthDate);
  
  return [...list].sort((a, b) => {
    if (canSortByBirthDate) {
      const dateA = new Date(a.birthDate);
      const dateB = new Date(b.birthDate);
      if (dateA - dateB !== 0) {
        return dateA - dateB; // Older first (earlier year first)
      }
    }

    if (a.createdAt && b.createdAt && a.createdAt !== b.createdAt) {
      return String(a.createdAt).localeCompare(String(b.createdAt));
    }

    // Compare by numeric part of ID (e.g. g2_1 -> 1, member_1780548129414 -> 1780548129414)
    const getNumericId = (idStr) => {
      if (!idStr) return 0;
      const match = idStr.match(/\d+$/);
      return match ? parseInt(match[0], 10) : 0;
    };
    
    const numA = getNumericId(a.id);
    const numB = getNumericId(b.id);
    
    if (numA !== numB) {
      return numA - numB;
    }
    
    // 3. Default string fallback
    return String(a.id || "").localeCompare(String(b.id || ""));
  });
};
