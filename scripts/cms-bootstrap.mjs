#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { hashPassword } from "../functions/helpers/auth.js";
import {
  buildCmsPackagePreview,
  normalizeImportedCmsPackage,
  validateCmsPackageRelations
} from "../src/utils/cmsPackageUtils.js";
import { serializeSiteConfig } from "../src/utils/siteConfigUtils.js";

const DEFAULT_SQL_OUTPUT = ".wrangler/cms-bootstrap/import-package.sql";

function parseArgs(argv) {
  const args = {
    packagePath: "",
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

    if (flagName === "--package") {
      args.packagePath = inlineValue || next || "";
      if (!inlineValue) i += 1;
    } else if (flagName === "--db") {
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
  console.log(`CMS bootstrap

Usage:
  node scripts/cms-bootstrap.mjs --package ./customer.json [options]

Options:
  --db <name>                 D1 database name. Default: first D1 database in wrangler.jsonc
  --local                     Import local D1 storage. Default
  --remote                    Import remote Cloudflare D1
  --migrate                   Apply D1 migrations before importing package
  --admin-password <value>    Create/update admin account with this password
  --admin-username <value>    Admin username. Default: admin
  --admin-name <value>        Admin display name. Default: Quản trị viên
  --sql-output <path>         Generated SQL path. Default: ${DEFAULT_SQL_OUTPUT}
  --yes                       Execute changes. Without this, script only validates and writes SQL
  --help                      Show this help

Examples:
  node scripts/cms-bootstrap.mjs --package=./data/customer.json
  npm run cms:bootstrap -- -- --package=./data/customer.json
  npm run cms:bootstrap -- -- --package=./data/customer.json --migrate --admin-password="change-me" --yes
  npm run cms:bootstrap -- -- --package=./data/customer.json --remote --migrate --yes
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

function sqlString(value) {
  if (value === null || value === undefined || value === "") return "NULL";
  return `'${String(value).replaceAll("'", "''")}'`;
}

function sqlText(value) {
  return `'${String(value ?? "").replaceAll("'", "''")}'`;
}

function sqlNumber(value) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? String(number) : "0";
}

export function buildImportSql(packageData, admin = {}) {
  const statements = [
    "PRAGMA foreign_keys = OFF;",
    `INSERT INTO settings (key, value, updatedAt) VALUES ('site_config', ${sqlText(serializeSiteConfig(packageData.siteConfig))}, datetime('now')) ON CONFLICT(key) DO UPDATE SET value=excluded.value, updatedAt=excluded.updatedAt;`,
    "DELETE FROM members;"
  ];

  packageData.members.forEach((member) => {
    statements.push(`INSERT INTO members (
  id, name, gender, generation, isDeceased, birthDate, deathDate,
  birthPlace, restingPlace, occupation, bio, phone, address,
  avatar, isFeatured, spouseIds, fatherId, motherId, createdAt, updatedAt
) VALUES (
  ${sqlText(member.id)}, ${sqlText(member.name)}, ${sqlText(member.gender)}, ${sqlNumber(member.generation)}, ${member.isDeceased ? 1 : 0},
  ${sqlString(member.birthDate)}, ${sqlString(member.deathDate)}, ${sqlText(member.birthPlace)}, ${sqlText(member.restingPlace)},
  ${sqlText(member.occupation)}, ${sqlText(member.bio)}, ${sqlText(member.phone)}, ${sqlText(member.address)},
  ${sqlString(member.avatar)}, ${member.isFeatured ? 1 : 0}, ${sqlText(JSON.stringify(member.spouseIds || []))},
  ${sqlString(member.fatherId)}, ${sqlString(member.motherId)}, datetime('now'), datetime('now')
);`);
  });

  statements.push("DELETE FROM family_history_events;");
  packageData.historyEvents.forEach((event) => {
    statements.push(`INSERT INTO family_history_events (
  id, eventDate, title, description, relatedBranch, relatedMemberIds,
  imageUrls, isHomepageVisible, sortOrder, createdAt, updatedAt
) VALUES (
  ${sqlText(event.id)}, ${sqlText(event.eventDate)}, ${sqlText(event.title)}, ${sqlText(event.description)},
  ${sqlText(event.relatedBranch)}, ${sqlText(JSON.stringify(event.relatedMemberIds || []))},
  ${sqlText(JSON.stringify(event.images || []))}, ${event.isHomepageVisible ? 1 : 0}, ${sqlNumber(event.sortOrder)},
  datetime('now'), datetime('now')
);`);
  });

  if (admin.passwordHash) {
    statements.push(`INSERT INTO users (username, password, role, fullName, createdAt)
VALUES (${sqlText(admin.username)}, ${sqlText(admin.passwordHash)}, 'admin', ${sqlText(admin.fullName)}, datetime('now'))
ON CONFLICT(username) DO UPDATE SET
  password = excluded.password,
  role = 'admin',
  fullName = excluded.fullName;`);
    statements.push(`DELETE FROM sessions WHERE username = ${sqlText(admin.username)};`);
  }

  statements.push("PRAGMA foreign_keys = ON;");
  return `${statements.join("\n\n")}\n`;
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

export async function buildBootstrapPlan(options) {
  if (!options.packagePath) {
    throw new Error("Thiếu --package <file.json>.");
  }

  const packagePath = resolve(options.packagePath);
  const rawPackage = readJsonFile(packagePath);
  const packageData = normalizeImportedCmsPackage(rawPackage);
  const relationResult = validateCmsPackageRelations(packageData);

  if (!relationResult.valid) {
    throw new Error(`Gói CMS chưa hợp lệ:\n- ${relationResult.errors.join("\n- ")}`);
  }

  const admin = {
    username: options.adminUsername,
    fullName: options.adminName,
    passwordHash: options.adminPassword ? await hashPassword(options.adminPassword) : ""
  };
  const sql = buildImportSql(packageData, admin);
  const preview = buildCmsPackagePreview({
    siteConfig: {},
    members: [],
    historyEvents: []
  }, packageData);

  return {
    packagePath,
    dbName: options.dbName || readWranglerDatabaseName(),
    remote: options.remote,
    migrate: options.migrate,
    yes: options.yes,
    sqlOutput: options.sqlOutput,
    packageData,
    preview,
    sql
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
    return;
  }

  const plan = await buildBootstrapPlan(options);
  const sqlOutput = resolve(plan.sqlOutput);
  mkdirSync(dirname(sqlOutput), { recursive: true });
  writeFileSync(sqlOutput, plan.sql, "utf8");

  console.log("CMS package hợp lệ.");
  console.log(`Package: ${plan.packagePath}`);
  console.log(`D1 database: ${plan.dbName}`);
  console.log(`Mode: ${plan.remote ? "remote" : "local"}`);
  console.log(`SQL: ${sqlOutput}`);
  console.log(`Members: ${plan.preview.members.totalIncoming}`);
  console.log(`History events: ${plan.preview.historyEvents.totalIncoming}`);

  if (!plan.yes) {
    console.log("Dry-run: chưa ghi DB. Thêm --yes để apply migrations/import.");
    return;
  }

  const modeFlag = plan.remote ? "--remote" : "--local";
  if (plan.migrate) {
    runCommand("npx", ["wrangler", "d1", "migrations", "apply", plan.dbName, modeFlag]);
  }
  runCommand("npx", ["wrangler", "d1", "execute", plan.dbName, modeFlag, "--file", sqlOutput]);
  console.log("Bootstrap CMS hoàn tất.");
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
