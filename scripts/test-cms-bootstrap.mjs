import assert from "node:assert/strict";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { buildCmsPackage } from "../src/utils/cmsPackageUtils.js";
import { DEFAULT_SITE_CONFIG } from "../src/utils/siteConfigUtils.js";
import { buildBootstrapPlan, buildImportSql } from "./cms-bootstrap.mjs";

const packagePayload = buildCmsPackage({
  siteConfig: { ...DEFAULT_SITE_CONFIG, familyName: "Nguyen Van" },
  members: [
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
  ],
  historyEvents: [
    {
      id: "history_1",
      eventDate: "2026",
      title: "Lap gia pha",
      description: "Khoi tao website",
      relatedBranch: "",
      relatedMemberIds: ["g1_1"],
      images: [],
      isHomepageVisible: true,
      sortOrder: 10
    }
  ]
}, {
  exportedAt: "2026-06-20T00:00:00.000Z",
  exportedBy: "test"
});

const sql = buildImportSql(packagePayload, {
  username: "admin",
  fullName: "Quan tri",
  passwordHash: "pbkdf2:salt:hash"
});

assert.match(sql, /BEGIN TRANSACTION/);
assert.match(sql, /DELETE FROM members/);
assert.match(sql, /DELETE FROM family_history_events/);
assert.match(sql, /INSERT INTO users/);
assert.match(sql, /Nguyen Van/);

const tempPackagePath = join(".wrangler", "cms-bootstrap-test-package.json");
mkdirSync(".wrangler", { recursive: true });
writeFileSync(tempPackagePath, JSON.stringify(packagePayload), "utf8");

try {
  const plan = await buildBootstrapPlan({
    packagePath: tempPackagePath,
    dbName: "giapha-test-db",
    remote: false,
    migrate: false,
    yes: false,
    sqlOutput: ".wrangler/cms-bootstrap/test.sql",
    adminUsername: "admin",
    adminName: "Quan tri",
    adminPassword: ""
  });

  assert.equal(plan.dbName, "giapha-test-db");
  assert.equal(plan.preview.members.totalIncoming, 1);
  assert.equal(plan.preview.historyEvents.totalIncoming, 1);
} finally {
  rmSync(tempPackagePath, { force: true });
}

console.log("cms bootstrap tests passed");
