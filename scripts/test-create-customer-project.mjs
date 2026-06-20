import assert from "node:assert/strict";
import { resolve } from "node:path";
import { buildCustomerProjectPlan } from "./create-customer-project.mjs";

const plan = buildCustomerProjectPlan({
  familyName: "Trần Xuân",
  slug: "tran-xuan",
  parentDir: ".tmp-customers",
  writeWrangler: true,
  install: true
});

assert.equal(plan.familyName, "Trần Xuân");
assert.equal(plan.slug, "tran-xuan");
assert.equal(plan.targetDir, resolve(".tmp-customers", "giapha-tran-xuan"));
assert.equal(plan.install, true);
assert.equal(plan.writeWrangler, true);
assert.deepEqual(plan.provisionArgs, [
  "--yes",
  "--family-name",
  "Trần Xuân",
  "--slug",
  "tran-xuan",
  "--write-wrangler"
]);
assert.equal(plan.provision.projectName, "giapha-tran-xuan");

const defaultPlan = buildCustomerProjectPlan({
  familyName: "Họ Nguyễn"
});
assert.equal(defaultPlan.slug, "ho-nguyen");
assert.equal(defaultPlan.targetDir, resolve("..", "giapha-ho-nguyen"));

console.log("create customer project tests passed");
