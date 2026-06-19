import assert from "node:assert/strict";
import {
  buildMemberSyncExport,
  buildMemberSyncPreview,
  normalizeImportedMembers,
  validateMemberRelations
} from "../src/utils/memberSyncUtils.js";

const existingMembers = [
  {
    id: "g1_1",
    name: "Tran Cong A",
    gender: "nam",
    generation: 1,
    isDeceased: false,
    birthDate: "1900-01-01",
    deathDate: "",
    birthPlace: "Nam Dinh",
    restingPlace: "",
    occupation: "",
    bio: "",
    phone: "",
    address: "",
    avatar: "",
    isFeatured: true,
    spouseIds: ["g1_2"],
    fatherId: null,
    motherId: null
  },
  {
    id: "g1_2",
    name: "Tran Thi B",
    gender: "nu",
    generation: 1,
    isDeceased: false,
    spouseIds: ["g1_1"],
    fatherId: null,
    motherId: null
  }
];

const incomingMembers = [
  {
    ...existingMembers[0],
    occupation: "Teacher"
  },
  existingMembers[1],
  {
    id: "g2_1",
    name: "Tran Cong C",
    gender: "nam",
    generation: 2,
    isDeceased: false,
    spouseIds: [],
    fatherId: "g1_1",
    motherId: "g1_2"
  }
];

const exportPayload = buildMemberSyncExport(existingMembers, {
  exportedBy: "admin",
  exportedAt: "2026-06-20T00:00:00.000Z"
});

assert.equal(exportPayload.type, "giapha-tc-members");
assert.equal(exportPayload.version, 1);
assert.equal(exportPayload.members.length, 2);
assert.deepEqual(exportPayload.members[0].spouseIds, ["g1_2"]);

const normalizedMembers = normalizeImportedMembers({
  type: "giapha-tc-members",
  version: 1,
  members: incomingMembers
});

assert.equal(normalizedMembers[0].occupation, "Teacher");
assert.equal(normalizedMembers[2].fatherId, "g1_1");
assert.deepEqual(normalizedMembers[2].spouseIds, []);

const relationResult = validateMemberRelations(normalizedMembers);
assert.equal(relationResult.valid, true);
assert.deepEqual(relationResult.errors, []);

const invalidRelationResult = validateMemberRelations([
  {
    id: "bad_child",
    name: "Bad Child",
    gender: "nam",
    generation: 2,
    spouseIds: ["missing_spouse"],
    fatherId: "missing_father",
    motherId: null
  }
]);

assert.equal(invalidRelationResult.valid, false);
assert.equal(invalidRelationResult.errors.length, 2);

const preview = buildMemberSyncPreview(existingMembers, normalizedMembers);
assert.equal(preview.totalIncoming, 3);
assert.equal(preview.toCreate, 1);
assert.equal(preview.toUpdate, 1);
assert.equal(preview.unchanged, 1);

console.log("member sync utils tests passed");
