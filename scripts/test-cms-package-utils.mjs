import assert from "node:assert/strict";
import {
  buildCmsPackage,
  buildCmsPackagePreview,
  normalizeImportedCmsPackage,
  validateCmsPackageRelations
} from "../src/utils/cmsPackageUtils.js";
import { DEFAULT_SITE_CONFIG } from "../src/utils/siteConfigUtils.js";

const existingMembers = [
  {
    id: "g1_1",
    name: "Tran Cong A",
    gender: "nam",
    generation: 1,
    isDeceased: true,
    spouseIds: [],
    fatherId: null,
    motherId: null
  }
];

const incomingMembers = [
  {
    ...existingMembers[0],
    bio: "Cap nhat tieu su"
  },
  {
    id: "g2_1",
    name: "Tran Cong B",
    gender: "nam",
    generation: 2,
    isDeceased: false,
    spouseIds: [],
    fatherId: "g1_1",
    motherId: null
  }
];

const existingHistoryEvents = [
  {
    id: "history_1",
    eventDate: "1936",
    title: "Cot moc cu",
    description: "Mo ta cu",
    relatedBranch: "",
    relatedMemberIds: ["g1_1"],
    images: [],
    isHomepageVisible: true,
    sortOrder: 10
  }
];

const incomingHistoryEvents = [
  {
    ...existingHistoryEvents[0],
    description: "Mo ta moi"
  },
  {
    id: "history_2",
    eventDate: "2026-06-20",
    title: "Cot moc moi",
    description: "",
    relatedBranch: "",
    relatedMemberIds: ["g2_1"],
    images: [],
    isHomepageVisible: true,
    sortOrder: 20
  }
];

const cmsPackage = buildCmsPackage({
  siteConfig: { ...DEFAULT_SITE_CONFIG, familyName: "Nguyen Van" },
  members: incomingMembers,
  historyEvents: incomingHistoryEvents
}, {
  exportedAt: "2026-06-20T00:00:00.000Z",
  exportedBy: "admin"
});

assert.equal(cmsPackage.type, "giapha-cms-package");
assert.equal(cmsPackage.version, 1);
assert.equal(cmsPackage.counts.members, 2);
assert.equal(cmsPackage.siteConfig.familyName, "Nguyen Van");

const normalized = normalizeImportedCmsPackage(cmsPackage);
assert.equal(normalized.members.length, 2);
assert.equal(normalized.historyEvents.length, 2);

const relationResult = validateCmsPackageRelations(normalized);
assert.equal(relationResult.valid, true);
assert.deepEqual(relationResult.errors, []);

const preview = buildCmsPackagePreview({
  siteConfig: DEFAULT_SITE_CONFIG,
  members: existingMembers,
  historyEvents: existingHistoryEvents
}, normalized);

assert.equal(preview.siteConfigChanged, true);
assert.equal(preview.members.toCreate, 1);
assert.equal(preview.members.toUpdate, 1);
assert.equal(preview.historyEvents.toCreate, 1);
assert.equal(preview.historyEvents.toUpdate, 1);

const invalid = normalizeImportedCmsPackage({
  ...cmsPackage,
  historyEvents: [{ ...incomingHistoryEvents[0], relatedMemberIds: ["missing_member"] }]
});
const invalidRelations = validateCmsPackageRelations(invalid);
assert.equal(invalidRelations.valid, false);
assert.match(invalidRelations.errors[0], /missing_member/);

console.log("cms package utils tests passed");
