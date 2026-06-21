#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { hashPassword } from "../functions/helpers/auth.js";

const DEFAULT_SQL_OUTPUT = ".wrangler/admin-bootstrap/admin-user.sql";

export function parseArgs(argv) {
  const args = {
    dbName: "",
    remote: false,
    migrate: false,
    yes: false,
    sqlOutput: DEFAULT_SQL_OUTPUT,
    adminUsername: "admin",
    adminName: "Quản trị viên",
    adminPassword: ""
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = argv[i + 1];
    const [flagName, inlineValue] = arg.includes("=") ? arg.split(/=(.*)/s, 2) : [arg, ""];

    if (flagName === "--db") {
      args.dbName = inlineValue || next || "";
      if (!inlineValue) i += 1;
    } else if (arg === "--remote") {
      args.remote = true;
    } else if (arg === "--local") {
      args.remote = false;
    } else if (arg === "--migrate") {
      args.migrate = true;
    } else if (arg === "--yes") {
      args.yes = true;
    } else if (flagName === "--sql-output") {
      args.sqlOutput = inlineValue || next || DEFAULT_SQL_OUTPUT;
      if (!inlineValue) i += 1;
    } else if (flagName === "--admin-username") {
      args.adminUsername = inlineValue || next || "admin";
      if (!inlineValue) i += 1;
    } else if (flagName === "--admin-name") {
      args.adminName = inlineValue || next || "Quản trị viên";
      if (!inlineValue) i += 1;
    } else if (flagName === "--admin-password") {
      args.adminPassword = inlineValue || next || "";
      if (!inlineValue) i += 1;
    } else if (arg === "--help" || arg === "-h") {
      args.help = true;
    } else {
      throw new Error(`Tham số không hỗ trợ: ${arg}`);
    }
  }

  return args;
}

function printHelp() {
  console.log(`Admin bootstrap

Usage:
  node scripts/admin-bootstrap.mjs [options]

Options:
  --db <name>                 D1 database name. Default: first D1 database in wrangler.jsonc
  --local                     Write local D1 storage. Default
  --remote                    Write remote Cloudflare D1
  --migrate                   Apply D1 migrations before setting admin
  --admin-password <value>    Admin password to hash and save. Or use ADMIN_BOOTSTRAP_PASSWORD env
  --admin-username <value>    Admin username. Default: admin
  --admin-name <value>        Admin display name. Default: Quản trị viên
  --sql-output <path>         Generated SQL path. Default: ${DEFAULT_SQL_OUTPUT}
  --yes                       Execute changes. Without this, script only writes SQL
  --help                      Show this help

Examples:
  node scripts/admin-bootstrap.mjs --admin-password="change-me"
  $env:ADMIN_BOOTSTRAP_PASSWORD="prod-pass"
  node scripts/admin-bootstrap.mjs --db=giapha-tran-xuan-db --remote --migrate --yes
`);
}

function readJsonFile(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function readWranglerDatabaseName() {
  const config = readJsonFile("wrangler.jsonc");
  const firstDb = config.d1_databases?.[0]?.database_name;
  if (!firstDb) {
    throw new Error("Không tìm thấy d1_databases[0].database_name trong wrangler.jsonc.");
  }
  return firstDb;
}

function sqlText(value) {
  return `'${String(value ?? "").replaceAll("'", "''")}'`;
}

export function buildAdminBootstrapSql(admin) {
  return `BEGIN TRANSACTION;

INSERT INTO users (username, password, role, fullName, createdAt)
VALUES (${sqlText(admin.username)}, ${sqlText(admin.passwordHash)}, 'admin', ${sqlText(admin.fullName)}, datetime('now'))
ON CONFLICT(username) DO UPDATE SET
  password = excluded.password,
  role = 'admin',
  fullName = excluded.fullName;

DELETE FROM sessions WHERE username = ${sqlText(admin.username)};

COMMIT;
`;
}

function runCommand(command, args, options = {}) {
  console.log(`$ ${command} ${args.join(" ")}`);
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
    ...options
  });

  if (result.status !== 0) {
    throw new Error(`Command failed: ${command} ${args.join(" ")}`);
  }
}

export async function buildAdminBootstrapPlan(options) {
  const adminPassword = options.adminPassword || process.env.ADMIN_BOOTSTRAP_PASSWORD || "";
  if (!adminPassword) {
    throw new Error("Thiếu --admin-password <mật khẩu admin> hoặc biến môi trường ADMIN_BOOTSTRAP_PASSWORD.");
  }

  const admin = {
    username: options.adminUsername,
    fullName: options.adminName,
    passwordHash: await hashPassword(adminPassword)
  };

  return {
    dbName: options.dbName || readWranglerDatabaseName(),
    remote: options.remote,
    migrate: options.migrate,
    yes: options.yes,
    sqlOutput: options.sqlOutput,
    admin,
    sql: buildAdminBootstrapSql(admin)
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
    return;
  }

  const plan = await buildAdminBootstrapPlan(options);
  const sqlOutput = resolve(plan.sqlOutput);
  mkdirSync(dirname(sqlOutput), { recursive: true });
  writeFileSync(sqlOutput, plan.sql, "utf8");

  console.log("Admin bootstrap đã sẵn sàng.");
  console.log(`D1 database: ${plan.dbName}`);
  console.log(`Mode: ${plan.remote ? "remote" : "local"}`);
  console.log(`Admin username: ${plan.admin.username}`);
  console.log(`SQL: ${sqlOutput}`);

  if (!plan.yes) {
    console.log("Dry-run: chưa ghi DB. Thêm --yes để apply migrations và tạo/update admin.");
    return;
  }

  const modeFlag = plan.remote ? "--remote" : "--local";
  if (plan.migrate) {
    runCommand("npx", ["wrangler", "d1", "migrations", "apply", plan.dbName, modeFlag]);
  }
  runCommand("npx", ["wrangler", "d1", "execute", plan.dbName, modeFlag, "--file", sqlOutput]);
  console.log("Admin bootstrap hoàn tất. Có thể đăng nhập bằng user admin vừa set.");
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
