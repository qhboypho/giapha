import assert from "node:assert/strict";
import { resolve } from "node:path";
import { buildCustomerSetupPlan, extractD1IdFromListJson, parseArgs } from "./customer-setup.mjs";

const args = parseArgs([
  "--family-name=Trần Xuân",
  "--slug=tran-xuan",
  "--admin-password=TranXuan@2026",
  "--deploy",
  "--force",
  "--git-init"
]);

assert.equal(args.familyName, "Trần Xuân");
assert.equal(args.slug, "tran-xuan");
assert.equal(args.adminPassword, "TranXuan@2026");
assert.equal(args.deploy, true);
assert.equal(args.force, true);
assert.equal(args.gitInit, true);
assert.equal(args.install, true);

const plan = buildCustomerSetupPlan(args);
assert.equal(plan.familyName, "Trần Xuân");
assert.equal(plan.slug, "tran-xuan");
assert.equal(plan.targetDir, resolve("..", "giapha-tran-xuan"));
assert.equal(plan.provision.projectName, "giapha-tran-xuan");
assert.equal(plan.provision.d1Name, "giapha-tran-xuan-db");
assert.equal(plan.provision.r2Name, "giapha-tran-xuan-media");
assert.equal(plan.deploy, true);

const d1Id = extractD1IdFromListJson(JSON.stringify([
  { uuid: "11111111-1111-1111-1111-111111111111", name: "other-db" },
  { uuid: "370c2d40-99fe-4124-aa8f-d87e236203f1", name: "giapha-tran-xuan-db" }
]), "giapha-tran-xuan-db");

assert.equal(d1Id, "370c2d40-99fe-4124-aa8f-d87e236203f1");

const d1IdWithBanner = extractD1IdFromListJson(`
wrangler banner
[
  {"uuid":"370c2d40-99fe-4124-aa8f-d87e236203f1","name":"giapha-tran-xuan-db"}
]
`, "giapha-tran-xuan-db");

assert.equal(d1IdWithBanner, "370c2d40-99fe-4124-aa8f-d87e236203f1");

assert.throws(
  () => extractD1IdFromListJson("[]", "missing-db"),
  /Không tìm thấy database_id/
);

console.log("customer setup tests passed");
