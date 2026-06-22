import assert from "node:assert/strict";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { buildCustomerProjectPlan, ensureTargetAvailable, resolveCustomerTargetDir } from "./create-customer-project.mjs";
import { sanitizeCustomerProject } from "./customer-sanitizer.mjs";

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
  "--customer-project",
  "--write-wrangler"
]);
assert.equal(plan.provision.projectName, "giapha-tran-xuan");
assert.equal(plan.provision.customerProject, true);

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
assert.throws(
  () => ensureTargetAvailable(".tmp-customer-inside-base", false),
  /ngoài project base/
);

const sandbox = resolve(".tmp-test-customer-sanitize");
rmSync(sandbox, { recursive: true, force: true });
mkdirSync(resolve(sandbox, "migrations"), { recursive: true });
mkdirSync(resolve(sandbox, "src", "config"), { recursive: true });
mkdirSync(resolve(sandbox, "public"), { recursive: true });
writeFileSync(resolve(sandbox, "public", "cms-setup-guide.html"), "<html>setup</html>", "utf8");

sanitizeCustomerProject(sandbox, { familyName: "Trần Xuân", slug: "tran-xuan" });

const seedSql = readFileSync(resolve(sandbox, "migrations", "0002_seed.sql"), "utf8");
assert.match(seedSql, /Gia phả họ Trần Xuân/);
assert.match(seedSql, /Cây gia phả mẫu/);
assert.doesNotMatch(seedSql, /Trần Công Kỳ/);
assert.doesNotMatch(seedSql, /Trần Thị Hiến/);

const featuredSql = readFileSync(resolve(sandbox, "migrations", "0003_featured_members.sql"), "utf8");
assert.match(featuredSql, /sample_g1_1/);
assert.doesNotMatch(featuredSql, /g3_8/);

const runtimeConfig = readFileSync(resolve(sandbox, "src", "config", "cmsRuntime.js"), "utf8");
assert.match(runtimeConfig, /ENABLE_SETUP_WIZARD = false/);
assert.equal(existsSync(resolve(sandbox, "public", "cms-setup-guide.html")), false);

rmSync(sandbox, { recursive: true, force: true });

console.log("create customer project tests passed");
