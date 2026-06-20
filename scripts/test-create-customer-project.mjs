import assert from "node:assert/strict";
import { resolve } from "node:path";
import { buildCustomerProjectPlan, resolveCustomerTargetDir } from "./create-customer-project.mjs";

const plan = buildCustomerProjectPlan({
  familyName: "Trần Xuân",
  slug: "tran-xuan",
  parentDir: ".tmp-customers",
  writeWrangler: true,
  install: true,
  gitInit: true,
  commitMessage: "chore: init tran xuan"
});

assert.equal(plan.familyName, "Trần Xuân");
assert.equal(plan.slug, "tran-xuan");
assert.equal(plan.targetDir, resolve(".tmp-customers", "giapha-tran-xuan"));
assert.equal(plan.install, true);
assert.equal(plan.writeWrangler, true);
assert.equal(plan.gitInit, true);
assert.equal(plan.gitBranch, "customer/tran-xuan");
assert.equal(plan.commitMessage, "chore: init tran xuan");
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
assert.equal(defaultPlan.gitBranch, "customer/ho-nguyen");
assert.equal(defaultPlan.commitMessage, "chore: initialize Họ Nguyễn customer project");

const relativeTargetPlan = buildCustomerProjectPlan({
  familyName: "Trần Xuân",
  slug: "tran-xuan",
  targetDir: "giapha-tran-xuan"
});
assert.equal(relativeTargetPlan.targetDir, resolve("..", "giapha-tran-xuan"));
assert.equal(resolveCustomerTargetDir("custom-folder", "..", "ignored"), resolve("..", "custom-folder"));
assert.equal(resolveCustomerTargetDir("", "..", "tran-xuan"), resolve("..", "giapha-tran-xuan"));

console.log("create customer project tests passed");
