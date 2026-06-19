export const MEMBER_SYNC_TYPE = "giapha-tc-members";
export const MEMBER_SYNC_VERSION = 1;

export const MEMBER_SYNC_FIELDS = [
  "id",
  "name",
  "gender",
  "generation",
  "isDeceased",
  "birthDate",
  "deathDate",
  "birthPlace",
  "restingPlace",
  "occupation",
  "bio",
  "phone",
  "address",
  "avatar",
  "isFeatured",
  "spouseIds",
  "fatherId",
  "motherId"
];

const stringFields = [
  "id",
  "name",
  "gender",
  "birthDate",
  "deathDate",
  "birthPlace",
  "restingPlace",
  "occupation",
  "bio",
  "phone",
  "address",
  "avatar",
  "fatherId",
  "motherId"
];

const normalizeOptionalString = (value) => {
  const normalized = String(value || "").trim();
  return normalized || null;
};

const normalizeText = (value) => String(value || "").trim();

export function normalizeMemberForSync(member = {}) {
  const normalized = {};

  stringFields.forEach((field) => {
    normalized[field] = ["fatherId", "motherId", "birthDate", "deathDate"].includes(field)
      ? normalizeOptionalString(member[field])
      : normalizeText(member[field]);
  });

  normalized.id = normalizeText(member.id);
  normalized.name = normalizeText(member.name);
  normalized.gender = normalizeText(member.gender || "nam");
  normalized.generation = Number.parseInt(member.generation, 10) || 1;
  normalized.isDeceased = Boolean(member.isDeceased);
  normalized.isFeatured = Boolean(member.isFeatured);
  normalized.spouseIds = Array.isArray(member.spouseIds)
    ? Array.from(new Set(member.spouseIds.map(normalizeOptionalString).filter(Boolean)))
    : [];

  return MEMBER_SYNC_FIELDS.reduce((acc, field) => {
    acc[field] = normalized[field] ?? (["fatherId", "motherId", "birthDate", "deathDate"].includes(field) ? null : "");
    return acc;
  }, {});
}

export function buildMemberSyncExport(members = [], metadata = {}) {
  return {
    type: MEMBER_SYNC_TYPE,
    version: MEMBER_SYNC_VERSION,
    exportedAt: metadata.exportedAt || new Date().toISOString(),
    exportedBy: metadata.exportedBy || "",
    memberCount: members.length,
    members: members.map(normalizeMemberForSync)
  };
}

export function normalizeImportedMembers(payload = {}) {
  if (payload.type !== MEMBER_SYNC_TYPE) {
    throw new Error("File không đúng định dạng dữ liệu cây gia phả.");
  }
  if (payload.version !== MEMBER_SYNC_VERSION) {
    throw new Error("Phiên bản file đồng bộ không được hỗ trợ.");
  }
  if (!Array.isArray(payload.members)) {
    throw new Error("File không có danh sách thành viên hợp lệ.");
  }

  const seenIds = new Set();
  return payload.members.map((member, index) => {
    const normalized = normalizeMemberForSync(member);
    if (!normalized.id) {
      throw new Error(`Thành viên dòng ${index + 1} thiếu ID.`);
    }
    if (!normalized.name) {
      throw new Error(`Thành viên ${normalized.id} thiếu họ tên.`);
    }
    if (!["nam", "nu"].includes(normalized.gender)) {
      throw new Error(`Thành viên ${normalized.name} có giới tính không hợp lệ.`);
    }
    if (seenIds.has(normalized.id)) {
      throw new Error(`File có ID thành viên bị trùng: ${normalized.id}.`);
    }
    seenIds.add(normalized.id);
    return normalized;
  });
}

export function validateMemberRelations(members = []) {
  const ids = new Set(members.map((member) => member.id));
  const errors = [];

  members.forEach((member) => {
    if (member.fatherId && !ids.has(member.fatherId)) {
      errors.push(`${member.name}: cha ruột ${member.fatherId} không có trong file.`);
    }
    if (member.motherId && !ids.has(member.motherId)) {
      errors.push(`${member.name}: mẹ ruột ${member.motherId} không có trong file.`);
    }
    member.spouseIds.forEach((spouseId) => {
      if (!ids.has(spouseId)) {
        errors.push(`${member.name}: vợ/chồng ${spouseId} không có trong file.`);
      }
    });
  });

  return {
    valid: errors.length === 0,
    errors
  };
}

const comparableMember = (member) => JSON.stringify(normalizeMemberForSync(member));

export function buildMemberSyncPreview(existingMembers = [], incomingMembers = []) {
  const existingById = new Map(existingMembers.map((member) => [member.id, normalizeMemberForSync(member)]));
  let toCreate = 0;
  let toUpdate = 0;
  let unchanged = 0;

  incomingMembers.forEach((member) => {
    const existing = existingById.get(member.id);
    if (!existing) {
      toCreate += 1;
      return;
    }
    if (comparableMember(existing) === comparableMember(member)) {
      unchanged += 1;
    } else {
      toUpdate += 1;
    }
  });

  return {
    totalExisting: existingMembers.length,
    totalIncoming: incomingMembers.length,
    toCreate,
    toUpdate,
    unchanged,
    toDelete: Math.max(existingMembers.length - incomingMembers.filter((member) => existingById.has(member.id)).length, 0)
  };
}
