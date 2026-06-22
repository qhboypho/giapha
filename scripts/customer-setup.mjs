#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { fileURLToPath } from "node:url";
import { buildProvisionPlan, slugifyCustomer } from "./provision-wizard.mjs";
import { resolveCustomerTargetDir } from "./create-customer-project.mjs";

const DEFAULT_PARENT_DIR = "..";

export function parseArgs(argv) {
  const args = {
    familyName: "",
    slug: "",
    targetDir: "",
    parentDir: DEFAULT_PARENT_DIR,
    adminPassword: "",
    deploy: false,
    install: true,
    force: false,
    gitInit: false,
    yes: false,
    help: false
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = argv[i + 1];
    const [flagName, inlineValue] = arg.includes("=") ? arg.split(/=(.*)/s, 2) : [arg, ""];
    const value = inlineValue || next || "";

    if (flagName === "--family-name") {
      args.familyName = value;
      if (!inlineValue) i += 1;
    } else if (flagName === "--slug") {
      args.slug = value;
      if (!inlineValue) i += 1;
    } else if (flagName === "--target-dir") {
      args.targetDir = value;
      if (!inlineValue) i += 1;
    } else if (flagName === "--parent-dir") {
      args.parentDir = value || DEFAULT_PARENT_DIR;
      if (!inlineValue) i += 1;
    } else if (flagName === "--admin-password") {
      args.adminPassword = value;
      if (!inlineValue) i += 1;
    } else if (arg === "--deploy") {
      args.deploy = true;
    } else if (arg === "--no-install") {
      args.install = false;
    } else if (arg === "--force") {
      args.force = true;
    } else if (arg === "--git-init") {
      args.gitInit = true;
    } else if (arg === "--yes") {
      args.yes = true;
    } else if (arg === "--help" || arg === "-h") {
      args.help = true;
    } else {
      throw new Error(`Tham số không hỗ trợ: ${arg}`);
    }
  }

  return args;
}

function printHelp() {
  console.log(`Customer setup

Usage:
  npm run customer:setup
  node scripts/customer-setup.mjs [options]

Options:
  --family-name <name>      Tên dòng họ/khách, ví dụ "Trần Xuân"
  --slug <slug>             Slug khách, ví dụ tran-xuan
  --admin-password <value>  Mật khẩu admin production
  --target-dir <path>       Folder project mới. Default: ../giapha-<slug>
  --parent-dir <path>       Folder cha khi không truyền target-dir. Default: ..
  --deploy                  Build và deploy Cloudflare Pages
  --no-install              Bỏ qua npm install trong project mới
  --force                   Xóa folder project local nếu đã tồn tại
  --git-init                Tạo git repo local trong project khách
  --yes                     Không hỏi tương tác, dùng tham số/default
  --help                    Hiện hướng dẫn

Examples:
  npm run customer:setup
  npm run customer:setup -- --family-name="Trần Xuân" --slug=tran-xuan --admin-password="TranXuan@2026" --deploy
  npm run customer:setup -- --family-name="Trần Xuân" --slug=tran-xuan --admin-password="TranXuan@2026" --deploy --force
`);
}

async function ask(rl, label, fallback = "") {
  const suffix = fallback ? ` (${fallback})` : "";
  const answer = await rl.question(`${label}${suffix}: `);
  return String(answer || fallback || "").trim();
}

async function askYesNo(rl, label, fallback = false) {
  const answer = await rl.question(`${label} ${fallback ? "(Y/n)" : "(y/N)"}: `);
  const normalized = answer.trim().toLowerCase();
  if (!normalized) return fallback;
  return ["y", "yes", "co", "có"].includes(normalized);
}

async function collectOptions(args) {
  if (args.yes || (args.familyName && args.slug && args.adminPassword)) {
    return args;
  }

  const rl = createInterface({ input, output });
  try {
    console.log("Customer Setup - tạo, cấu hình và deploy site gia phả khách mới");
    const familyName = await ask(rl, "Tên dòng họ/khách", args.familyName || "Trần Xuân");
    const slug = slugifyCustomer(await ask(rl, "Slug khách", args.slug || slugifyCustomer(familyName)));
    const defaultTarget = resolve(args.parentDir || DEFAULT_PARENT_DIR, `giapha-${slug}`);

    return {
      ...args,
      familyName,
      slug,
      targetDir: await ask(rl, "Folder project mới", args.targetDir || defaultTarget),
      adminPassword: await ask(rl, "Mật khẩu admin production", args.adminPassword),
      deploy: args.deploy || await askYesNo(rl, "Deploy Cloudflare Pages luôn không", true),
      install: args.install && await askYesNo(rl, "Chạy npm install trong project mới không", true),
      gitInit: args.gitInit || await askYesNo(rl, "Tạo git repo local không", false),
      force: args.force || await askYesNo(rl, "Nếu folder local tồn tại thì xóa tạo lại không", false)
    };
  } finally {
    rl.close();
  }
}

function executableFor(command) {
  return command;
}

function shouldUseShell(command) {
  return process.platform === "win32" && ["npm", "npx"].includes(command);
}

function runCommand(command, args, options = {}) {
  console.log(`$ ${command} ${args.join(" ")}`);
  const result = spawnSync(executableFor(command), args, {
    cwd: options.cwd || process.cwd(),
    env: options.env || process.env,
    input: options.input,
    encoding: options.input ? "utf8" : undefined,
    stdio: options.input ? ["pipe", "inherit", "inherit"] : "inherit",
    shell: shouldUseShell(command),
    windowsVerbatimArguments: false
  });

  if (result.status !== 0) {
    throw new Error(`Command failed: ${command} ${args.join(" ")}`);
  }
}

function captureCommand(command, args, options = {}) {
  console.log(`$ ${command} ${args.join(" ")}`);
  const result = spawnSync(executableFor(command), args, {
    cwd: options.cwd || process.cwd(),
    env: options.env || process.env,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    shell: shouldUseShell(command),
    windowsVerbatimArguments: false
  });

  if (result.status !== 0) {
    if (result.stdout) process.stdout.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);
    throw new Error(`Command failed: ${command} ${args.join(" ")}`);
  }

  return result.stdout;
}

export function extractD1IdFromListJson(jsonText, dbName) {
  const normalized = String(jsonText || "").trim();
  const jsonStart = normalized.indexOf("[");
  const jsonEnd = normalized.lastIndexOf("]");
  const jsonPayload = jsonStart >= 0 && jsonEnd >= jsonStart
    ? normalized.slice(jsonStart, jsonEnd + 1)
    : normalized;
  const rows = JSON.parse(jsonPayload);
  const match = rows.find((row) => row.name === dbName);
  if (!match?.uuid) {
    throw new Error(`Không tìm thấy database_id cho D1 ${dbName}.`);
  }
  return match.uuid;
}

export function buildCustomerSetupPlan(options = {}) {
  const familyName = String(options.familyName || "Khách mới").trim();
  const slug = slugifyCustomer(options.slug || familyName);
  const targetDir = resolveCustomerTargetDir(options.targetDir, options.parentDir || DEFAULT_PARENT_DIR, slug);
  const provision = buildProvisionPlan({
    familyName,
    slug,
    outputRoot: ".provision"
  });

  return {
    familyName,
    slug,
    targetDir,
    adminPassword: String(options.adminPassword || "").trim(),
    deploy: Boolean(options.deploy),
    install: options.install !== false,
    force: Boolean(options.force),
    gitInit: Boolean(options.gitInit),
    provision
  };
}

function assertReady(plan) {
  if (!plan.familyName) throw new Error("Thiếu --family-name.");
  if (!plan.slug) throw new Error("Thiếu --slug.");
  if (!plan.adminPassword) {
    throw new Error("Thiếu --admin-password để tạo tài khoản admin production.");
  }
  if (existsSync(plan.targetDir) && !plan.force) {
    throw new Error(`Folder project đã tồn tại: ${plan.targetDir}. Thêm --force nếu muốn xóa và tạo lại.`);
  }
}

function writeJson(path, value) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function updateWranglerD1Id(targetDir, d1Id) {
  const wranglerPath = resolve(targetDir, "wrangler.jsonc");
  const config = readJson(wranglerPath);
  config.d1_databases = (config.d1_databases || []).map((db, index) => index === 0
    ? { ...db, database_id: d1Id, preview_database_id: d1Id }
    : db);
  writeJson(wranglerPath, config);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }

  const options = await collectOptions(args);
  const plan = buildCustomerSetupPlan(options);
  assertReady(plan);

  runCommand("node", [
    "scripts/create-customer-project.mjs",
    "--yes",
    "--family-name",
    plan.familyName,
    "--slug",
    plan.slug,
    ...(options.targetDir ? ["--target-dir", options.targetDir] : []),
    ...(options.parentDir ? ["--parent-dir", options.parentDir] : []),
    "--write-wrangler",
    ...(plan.install ? ["--install"] : []),
    ...(plan.gitInit ? ["--git-init"] : []),
    ...(plan.force ? ["--force"] : [])
  ]);

  runCommand("npx", ["wrangler", "d1", "create", plan.provision.d1Name], { cwd: plan.targetDir });
  const d1ListJson = captureCommand("npx", ["wrangler", "d1", "list", "--json"], { cwd: plan.targetDir });
  const d1Id = extractD1IdFromListJson(d1ListJson, plan.provision.d1Name);
  updateWranglerD1Id(plan.targetDir, d1Id);

  runCommand("node", [
    "scripts/provision-wizard.mjs",
    "--yes",
    "--family-name",
    plan.familyName,
    "--slug",
    plan.slug,
    "--d1-id",
    d1Id,
    "--write-wrangler"
  ], { cwd: plan.targetDir });

  runCommand("npx", ["wrangler", "r2", "bucket", "create", plan.provision.r2Name], { cwd: plan.targetDir });
  runCommand("npx", ["wrangler", "r2", "bucket", "create", plan.provision.previewR2Name], { cwd: plan.targetDir });

  runCommand("npx", ["wrangler", "d1", "migrations", "apply", plan.provision.d1Name, "--remote"], {
    cwd: plan.targetDir,
    env: {
      ...process.env,
      CI: process.env.CI || "1"
    }
  });
  runCommand("node", ["scripts/admin-bootstrap.mjs", "--db", plan.provision.d1Name, "--remote", "--yes"], {
    cwd: plan.targetDir,
    env: {
      ...process.env,
      ADMIN_BOOTSTRAP_PASSWORD: plan.adminPassword
    }
  });

  let deployedUrl = "";
  if (plan.deploy) {
    runCommand("npm", ["run", "build"], { cwd: plan.targetDir });
    runCommand("npx", ["wrangler", "pages", "deploy", "./dist", "--project-name", plan.provision.projectName], { cwd: plan.targetDir });
    deployedUrl = `https://${plan.provision.projectName}.pages.dev/`;
  }

  console.log("\nCustomer setup hoàn tất:");
  console.log(`- Folder: ${plan.targetDir}`);
  console.log(`- Project: ${plan.provision.projectName}`);
  console.log(`- D1: ${plan.provision.d1Name} (${d1Id})`);
  console.log(`- R2: ${plan.provision.r2Name}`);
  console.log(`- Admin: admin`);
  console.log(`- Password: ${plan.adminPassword}`);
  if (deployedUrl) console.log(`- URL: ${deployedUrl}`);
  console.log("\nGitHub repo riêng là bước optional, có thể làm sau khi site đã chạy ổn.");
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
