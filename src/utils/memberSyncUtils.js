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

export const MEMBER_SYNC_SAMPLE_MEMBERS = [
  {
    id: "doi_1_cu_ong",
    name: "Tran Cong Mau",
    gender: "nam",
    generation: 1,
    isDeceased: true,
    birthDate: "1900-01-01",
    deathDate: "1970-01-01",
    birthPlace: "Nam Dinh",
    restingPlace: "Nghia trang dong ho",
    occupation: "Nong nghiep",
    bio: "Nguoi khai chi, thong tin can kiem chung lai tu tu lieu goc.",
    phone: "",
    address: "Nam Dinh",
    avatar: "",
    isFeatured: true,
    spouseIds: ["doi_1_cu_ba"],
    fatherId: null,
    motherId: null
  },
  {
    id: "doi_1_cu_ba",
    name: "Tran Thi Mau",
    gender: "nu",
    generation: 1,
    isDeceased: true,
    birthDate: "1905-01-01",
    deathDate: null,
    birthPlace: "Nam Dinh",
    restingPlace: "",
    occupation: "",
    bio: "",
    phone: "",
    address: "Nam Dinh",
    avatar: "",
    isFeatured: false,
    spouseIds: ["doi_1_cu_ong"],
    fatherId: null,
    motherId: null
  },
  {
    id: "doi_2_con_trai",
    name: "Tran Cong Con",
    gender: "nam",
    generation: 2,
    isDeceased: false,
    birthDate: "1930-01-01",
    deathDate: null,
    birthPlace: "Nam Dinh",
    restingPlace: "",
    occupation: "",
    bio: "",
    phone: "",
    address: "",
    avatar: "",
    isFeatured: false,
    spouseIds: [],
    fatherId: "doi_1_cu_ong",
    motherId: "doi_1_cu_ba"
  }
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

export function buildMemberSyncSample(metadata = {}) {
  return buildMemberSyncExport(MEMBER_SYNC_SAMPLE_MEMBERS, {
    exportedAt: metadata.exportedAt || "2026-01-01T00:00:00.000Z",
    exportedBy: metadata.exportedBy || "sample"
  });
}

export function buildMemberSyncAiPrompt() {
  const fields = MEMBER_SYNC_FIELDS.map((field) => `- ${field}`).join("\n");
  const sample = JSON.stringify(buildMemberSyncSample(), null, 2);

  return [
    "Bạn là trợ lý nhập liệu gia phả. Hãy đọc ảnh/PDF/tờ giấy gia phả được cung cấp và trích xuất dữ liệu thành file JSON để import vào hệ thống.",
    "",
    "Yêu cầu bắt buộc:",
    "- Chỉ trả về JSON thuần, không bọc Markdown, không giải thích thêm.",
    `- type phải là "${MEMBER_SYNC_TYPE}" và version phải là ${MEMBER_SYNC_VERSION}.`,
    "- Giữ nguyên tên tiếng Việt có dấu nếu đọc được.",
    "- Nếu thông tin chưa rõ, dùng chuỗi rỗng \"\" hoặc null, không tự bịa.",
    "- ID phải ổn định, không dấu, viết thường, ví dụ doi_3_tran_van_a hoặc person_001.",
    "- gender chỉ dùng \"nam\" hoặc \"nu\".",
    "- generation là số đời.",
    "- isDeceased và isFeatured là boolean true/false.",
    "- spouseIds là mảng ID vợ/chồng và nên khai báo hai chiều cho cả hai người.",
    "- fatherId và motherId là ID cha/mẹ ruột nếu xác định được.",
    "- Tất cả fatherId, motherId, spouseIds phải trỏ tới người có trong members.",
    "",
    "Schema member:",
    fields,
    "",
    "Mẫu JSON đúng định dạng:",
    sample
  ].join("\n");
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
  const incomingIds = new Set(incomingMembers.map((member) => member.id));
  const creates = [];
  const updates = [];
  const unchangedItems = [];
  const deletes = [];
  let toCreate = 0;
  let toUpdate = 0;
  let unchanged = 0;

  incomingMembers.forEach((member) => {
    const normalizedMember = normalizeMemberForSync(member);
    const existing = existingById.get(member.id);
    if (!existing) {
      toCreate += 1;
      creates.push(summarizeMemberForPreview(normalizedMember));
      return;
    }
    if (comparableMember(existing) === comparableMember(normalizedMember)) {
      unchanged += 1;
      unchangedItems.push(summarizeMemberForPreview(normalizedMember));
    } else {
      toUpdate += 1;
      updates.push({
        ...summarizeMemberForPreview(normalizedMember),
        changedFields: getChangedMemberFields(existing, normalizedMember)
      });
    }
  });

  existingMembers.forEach((member) => {
    const normalizedMember = normalizeMemberForSync(member);
    if (!incomingIds.has(normalizedMember.id)) {
      deletes.push(summarizeMemberForPreview(normalizedMember));
    }
  });

  return {
    totalExisting: existingMembers.length,
    totalIncoming: incomingMembers.length,
    toCreate,
    toUpdate,
    unchanged,
    toDelete: deletes.length,
    creates,
    updates,
    unchangedItems,
    deletes
  };
}

function summarizeMemberForPreview(member) {
  return {
    id: member.id,
    name: member.name,
    generation: member.generation,
    gender: member.gender
  };
}

function getChangedMemberFields(existingMember, incomingMember) {
  return MEMBER_SYNC_FIELDS.filter((field) => {
    const existingValue = existingMember[field];
    const incomingValue = incomingMember[field];
    if (Array.isArray(existingValue) || Array.isArray(incomingValue)) {
      return JSON.stringify(existingValue || []) !== JSON.stringify(incomingValue || []);
    }
    return existingValue !== incomingValue;
  });
}
