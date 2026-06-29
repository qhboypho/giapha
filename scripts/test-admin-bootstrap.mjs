import assert from "node:assert/strict";
import { buildAdminBootstrapPlan, buildAdminBootstrapSql, parseArgs } from "./admin-bootstrap.mjs";

const parsed = parseArgs([
  "--db=giapha-tran-xuan-db",
  "--remote",
  "--migrate",
  "--admin-username=owner",
  "--admin-name",
  "Chu so huu",
  "--admin-password=secret",
  "--yes"
]);

assert.equal(parsed.dbName, "giapha-tran-xuan-db");
assert.equal(parsed.remote, true);
assert.equal(parsed.migrate, true);
assert.equal(parsed.adminUsername, "owner");
assert.equal(parsed.adminName, "Chu so huu");
assert.equal(parsed.adminPassword, "secret");
assert.equal(parsed.yes, true);

const sql = buildAdminBootstrapSql({
  username: "ad'min",
  fullName: "Quan tri",
  passwordHash: "pbkdf2:salt:hash"
});

assert.match(sql, /INSERT INTO users/);
assert.match(sql, /ON CONFLICT\(username\) DO UPDATE/);
assert.match(sql, /DELETE FROM sessions/);
assert.match(sql, /ad''min/);
assert.doesNotMatch(sql, /secret/);

const plan = await buildAdminBootstrapPlan({
  dbName: "giapha-test-db",
  remote: false,
  migrate: false,
  yes: false,
  sqlOutput: ".wrangler/admin-bootstrap/test.sql",
  adminUsername: "admin",
  adminName: "Quan tri",
  adminPassword: "secret"
});

assert.equal(plan.dbName, "giapha-test-db");
assert.equal(plan.remote, false);
assert.match(plan.admin.passwordHash, /^pbkdf2:100000:/);
assert.match(plan.sql, /INSERT INTO users/);

process.env.ADMIN_BOOTSTRAP_PASSWORD = "from-env";
try {
  const envPlan = await buildAdminBootstrapPlan({
    dbName: "giapha-env-db",
    remote: true,
    migrate: true,
    yes: false,
    sqlOutput: ".wrangler/admin-bootstrap/env.sql",
    adminUsername: "admin",
    adminName: "Quan tri",
    adminPassword: ""
  });

  assert.equal(envPlan.dbName, "giapha-env-db");
  assert.equal(envPlan.remote, true);
  assert.match(envPlan.admin.passwordHash, /^pbkdf2:100000:/);
} finally {
  delete process.env.ADMIN_BOOTSTRAP_PASSWORD;
}

console.log("admin bootstrap tests passed");
