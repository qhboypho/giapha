import {
  buildMemberSyncPreview,
  normalizeImportedMembers,
  normalizeMemberForSync,
  validateMemberRelations
} from "./memberSyncUtils.js";
import { normalizeSiteConfig, validateSiteConfigInput } from "./siteConfigUtils.js";

export const CMS_PACKAGE_TYPE = "giapha-cms-package";
export const CMS_PACKAGE_VERSION = 1;

export const CMS_HISTORY_EVENT_FIELDS = [
  "id",
  "eventDate",
  "title",
  "description",
  "relatedBranch",
  "relatedMemberIds",
  "images",
  "isHomepageVisible",
  "sortOrder"
];

const normalizeText = (value) => String(value || "").trim();

const normalizeDateText = (value) => normalizeText(value);

export function normalizeHistoryEventForPackage(event = {}) {
  const relatedMemberIds = Array.isArray(event.relatedMemberIds)
    ? Array.from(new Set(event.relatedMemberIds.map(normalizeText).filter(Boolean)))
    : [];
  const images = Array.isArray(event.images)
    ? event.images.map(normalizeHistoryImageForPackage).filter(Boolean)
    : [];

  return {
    id: normalizeText(event.id),
    eventDate: normalizeDateText(event.eventDate),
    title: normalizeText(event.title),
    description: normalizeText(event.description),
    relatedBranch: normalizeText(event.relatedBranch),
    relatedMemberIds,
    images,
    isHomepageVisible: event.isHomepageVisible !== false,
    sortOrder: Number.isFinite(Number(event.sortOrder)) ? Number(event.sortOrder) : 0
  };
}

export function buildCmsPackage({ siteConfig = {}, members = [], historyEvents = [] } = {}, metadata = {}) {
  const normalizedMembers = members.map(normalizeMemberForSync);
  const normalizedHistoryEvents = historyEvents.map(normalizeHistoryEventForPackage);

  return {
    type: CMS_PACKAGE_TYPE,
    version: CMS_PACKAGE_VERSION,
    exportedAt: metadata.exportedAt || new Date().toISOString(),
    exportedBy: metadata.exportedBy || "",
    siteConfig: normalizeSiteConfig(siteConfig),
    counts: {
      members: normalizedMembers.length,
      historyEvents: normalizedHistoryEvents.length
    },
    members: normalizedMembers,
    historyEvents: normalizedHistoryEvents
  };
}

export function normalizeImportedCmsPackage(payload = {}) {
  if (payload.type !== CMS_PACKAGE_TYPE) {
    throw new Error("File không đúng định dạng gói CMS gia phả.");
  }
  if (payload.version !== CMS_PACKAGE_VERSION) {
    throw new Error("Phiên bản gói CMS không được hỗ trợ.");
  }

  const siteConfig = validateSiteConfigInput(payload.siteConfig || {});
  const members = normalizeImportedMembers({
    type: "giapha-tc-members",
    version: 1,
    members: payload.members
  });
  const historyEvents = normalizeImportedHistoryEvents(payload.historyEvents || []);

  return {
    siteConfig,
    members,
    historyEvents
  };
}

export function buildCmsPackagePreview(existing = {}, incoming = {}) {
  const memberPreview = buildMemberSyncPreview(existing.members || [], incoming.members || []);
  const historyPreview = buildHistoryEventsPreview(existing.historyEvents || [], incoming.historyEvents || []);
  const siteConfigChanged = JSON.stringify(normalizeSiteConfig(existing.siteConfig || {}))
    !== JSON.stringify(normalizeSiteConfig(incoming.siteConfig || {}));

  return {
    siteConfigChanged,
    members: memberPreview,
    historyEvents: historyPreview,
    totals: {
      existingMembers: memberPreview.totalExisting,
      incomingMembers: memberPreview.totalIncoming,
      existingHistoryEvents: historyPreview.totalExisting,
      incomingHistoryEvents: historyPreview.totalIncoming
    }
  };
}

export function validateCmsPackageRelations(packageData = {}) {
  const memberRelationResult = validateMemberRelations(packageData.members || []);
  const memberIds = new Set((packageData.members || []).map((member) => member.id));
  const historyErrors = [];

  (packageData.historyEvents || []).forEach((event) => {
    event.relatedMemberIds.forEach((memberId) => {
      if (!memberIds.has(memberId)) {
        historyErrors.push(`${event.title}: thành viên liên quan ${memberId} không có trong members.`);
      }
    });
  });

  return {
    valid: memberRelationResult.valid && historyErrors.length === 0,
    errors: [...memberRelationResult.errors, ...historyErrors]
  };
}

function normalizeImportedHistoryEvents(events) {
  if (!Array.isArray(events)) {
    throw new Error("Gói CMS không có danh sách lịch sử hợp lệ.");
  }

  const seenIds = new Set();

  return events.map((event, index) => {
    const normalized = normalizeHistoryEventForPackage(event);
    if (!normalized.id) {
      throw new Error(`Cột mốc lịch sử dòng ${index + 1} thiếu ID.`);
    }
    if (seenIds.has(normalized.id)) {
      throw new Error(`File có ID cột mốc lịch sử bị trùng: ${normalized.id}.`);
    }
    if (!/^\d{4}(-\d{2}(-\d{2})?)?$/.test(normalized.eventDate)) {
      throw new Error(`${normalized.id}: ngày lịch sử cần nhập dạng YYYY, YYYY-MM hoặc YYYY-MM-DD.`);
    }
    if (!normalized.title) {
      throw new Error(`${normalized.id}: thiếu tiêu đề cột mốc lịch sử.`);
    }

    seenIds.add(normalized.id);
    return normalized;
  });
}

function buildHistoryEventsPreview(existingEvents = [], incomingEvents = []) {
  const existingById = new Map(existingEvents.map((event) => [event.id, normalizeHistoryEventForPackage(event)]));
  const incomingIds = new Set(incomingEvents.map((event) => event.id));
  const creates = [];
  const updates = [];
  const unchangedItems = [];
  const deletes = [];

  incomingEvents.forEach((event) => {
    const normalizedEvent = normalizeHistoryEventForPackage(event);
    const existing = existingById.get(normalizedEvent.id);
    if (!existing) {
      creates.push(summarizeHistoryEvent(normalizedEvent));
      return;
    }

    if (JSON.stringify(existing) === JSON.stringify(normalizedEvent)) {
      unchangedItems.push(summarizeHistoryEvent(normalizedEvent));
    } else {
      updates.push({
        ...summarizeHistoryEvent(normalizedEvent),
        changedFields: getChangedHistoryEventFields(existing, normalizedEvent)
      });
    }
  });

  existingEvents.forEach((event) => {
    const normalizedEvent = normalizeHistoryEventForPackage(event);
    if (!incomingIds.has(normalizedEvent.id)) {
      deletes.push(summarizeHistoryEvent(normalizedEvent));
    }
  });

  return {
    totalExisting: existingEvents.length,
    totalIncoming: incomingEvents.length,
    toCreate: creates.length,
    toUpdate: updates.length,
    unchanged: unchangedItems.length,
    toDelete: deletes.length,
    creates,
    updates,
    unchangedItems,
    deletes
  };
}

function summarizeHistoryEvent(event) {
  return {
    id: event.id,
    title: event.title,
    eventDate: event.eventDate
  };
}

function getChangedHistoryEventFields(existingEvent, incomingEvent) {
  return CMS_HISTORY_EVENT_FIELDS.filter((field) => {
    const existingValue = existingEvent[field];
    const incomingValue = incomingEvent[field];
    if (Array.isArray(existingValue) || Array.isArray(incomingValue)) {
      return JSON.stringify(existingValue || []) !== JSON.stringify(incomingValue || []);
    }
    return existingValue !== incomingValue;
  });
}

function normalizeHistoryImageForPackage(image = {}) {
  const key = normalizeText(image.key).replace(/^\/+/, "");
  const src = normalizeText(image.src);
  if (!key && !src) return null;

  return {
    key,
    src,
    name: normalizeText(image.name),
    type: normalizeText(image.type),
    size: Number.isFinite(Number(image.size)) ? Number(image.size) : 0
  };
}
