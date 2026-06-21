import assert from "node:assert/strict";
import { buildGitPublishPlan } from "./customer-git-publish.mjs";

const plan = buildGitPublishPlan({
  remoteUrl: "https://github.com/qhboypho/giapha-tran-xuan.git",
  branch: "customer/tran-xuan",
  userName: "Dinh Tung",
  userEmail: "you@example.com",
  commitMessage: "chore: configure Tran Xuan Cloudflare resources",
  globalConfig: true,
  init: true,
  noPush: true
});

assert.equal(plan.remoteName, "origin");
assert.equal(plan.remoteUrl, "https://github.com/qhboypho/giapha-tran-xuan.git");
assert.equal(plan.branch, "customer/tran-xuan");
assert.equal(plan.userName, "Dinh Tung");
assert.equal(plan.userEmail, "you@example.com");
assert.equal(plan.commitMessage, "chore: configure Tran Xuan Cloudflare resources");
assert.equal(plan.globalConfig, true);
assert.equal(plan.init, true);
assert.equal(plan.noPush, true);

const fallback = buildGitPublishPlan({}, "customer/demo");
assert.equal(fallback.branch, "customer/demo");
assert.equal(fallback.remoteName, "origin");
assert.equal(fallback.commitMessage, "chore: configure customer project");

console.log("customer git publish tests passed");
