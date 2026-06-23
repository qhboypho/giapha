import assert from "node:assert/strict";
import {
  buildProvisionGuide,
  buildProvisionPlan,
  buildProvisionSummary,
  buildWranglerConfig,
  slugifyCustomer
} from "./provision-wizard.mjs";

assert.equal(slugifyCustomer("Trần Công"), "tran-cong");
assert.equal(slugifyCustomer("  Họ Nguyễn / Chi A  "), "ho-nguyen-chi-a");
assert.equal(slugifyCustomer(""), "khach-moi");

const plan = buildProvisionPlan({
  familyName: "Trần Công",
  outputRoot: ".tmp-provision-test",
  d1Id: "abc-123",
  aiSecret: "secret-secret-secret-secret"
});

assert.equal(plan.slug, "tran-cong");
assert.equal(plan.projectName, "giapha-tran-cong");
assert.equal(plan.d1Name, "giapha-tran-cong-db");
assert.equal(plan.r2Name, "giapha-tran-cong-media");
assert.equal(plan.previewR2Name, "giapha-tran-cong-media-preview");
assert.equal(plan.d1Id, "abc-123");

const wrangler = buildWranglerConfig(plan);
assert.equal(wrangler.name, "giapha-tran-cong");
assert.equal(wrangler.d1_databases[0].database_id, "abc-123");
assert.equal(wrangler.r2_buckets[0].binding, "MEDIA_BUCKET");

const guide = buildProvisionGuide(plan);
assert.match(guide, /npx wrangler d1 create giapha-tran-cong-db/);
assert.match(guide, /npx wrangler pages deploy \.\/dist --project-name giapha-tran-cong/);
assert.match(guide, /npm run create-customer -- --family-name="Trần Công" --slug=tran-cong/);
assert.match(guide, /Deploy lần đầu để Cloudflare tạo Pages project/);
assert.match(guide, /git push -u origin customer\/tran-cong/);
assert.match(guide, /npm run git:publish-customer -- --remote-url=https:\/\/github.com\/qhboypho\/giapha-tran-cong.git/);
assert.match(guide, /"preview_database_id": "PASTE_D1_DATABASE_ID_HERE"/);
assert.match(guide, /Setup Wizard/);

const customerPlan = buildProvisionPlan({
  familyName: "Trần Xuân",
  customerProject: true
});
const customerGuide = buildProvisionGuide(customerPlan);
assert.match(customerGuide, /dữ liệu mẫu vài người/);
assert.match(customerGuide, /Mở Setup Wizard trong app/);
assert.equal(buildProvisionSummary(customerPlan).customerProject, true);

const handoffCustomerPlan = buildProvisionPlan({
  familyName: "Trần Xuân",
  customerProject: true,
  setupWizard: false
});
const handoffCustomerGuide = buildProvisionGuide(handoffCustomerPlan);
assert.match(handoffCustomerGuide, /đã có sẵn dữ liệu mẫu vài người/);
assert.doesNotMatch(handoffCustomerGuide, /Mở Setup Wizard trong app/);
assert.equal(buildProvisionSummary(handoffCustomerPlan).setupWizard, false);

const summary = buildProvisionSummary(plan);
assert.equal(summary.familyName, "Trần Công");
assert.equal(summary.aiSecretPreview, "secret...secret");

console.log("provision wizard tests passed");
