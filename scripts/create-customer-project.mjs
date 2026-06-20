#!/usr/bin/env node
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  rmSync,
  statSync
} from "node:fs";
import { basename, dirname, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { fileURLToPath } from "node:url";
import { buildProvisionPlan, slugifyCustomer } from "./provision-wizard.mjs";

const DEFAULT_PARENT_DIR = "..";
const COPY_EXCLUDE_NAMES = new Set([
  ".git",
  ".wrangler",
  ".provision",
  ".codegraph",
  ".tours",
  ".playwright-mcp",
  ".playwright-cli",
  "node_modules",
  "dist",
  "dist-ssr"
]);
const COPY_EXCLUDE_SUFFIXES = [
  ".log",
  ".local"
];

function parseArgs(argv) {
  const args = {
    familyName: "",
    slug: "",
    targetDir: "",
    parentDir: DEFAULT_PARENT_DIR,
    install: false,
    writeWrangler: false,
    force: false,
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
    } else if (arg === "--install") {
      args.install = true;
    } else if (arg === "--write-wrangler") {
      args.writeWrangler = true;
    } else if (arg === "--force") {
      args.force = true;
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
  console.log(`Create Customer Project

Usage:
  npm run create-customer
  node scripts/create-customer-project.mjs [options]

Options:
  --family-name <name>   Tên dòng họ/khách, ví dụ "Trần Xuân"
  --slug <slug>          Slug khách, ví dụ tran-xuan
  --target-dir <path>    Folder project mới. Default: ../giapha-<slug>
  --parent-dir <path>    Folder cha khi không truyền target-dir. Default: ..
  --install              Chạy npm install trong project mới
  --write-wrangler       Ghi luôn wrangler.jsonc trong project mới
  --force                Xóa target-dir nếu đã tồn tại
  --yes                  Không hỏi tương tác, dùng tham số/default
  --help                 Hiện hướng dẫn

Examples:
  npm run create-customer
  npm run create-customer -- --family-name "Trần Xuân" --slug tran-xuan
  npm run create-customer -- --family-name "Trần Xuân" --slug tran-xuan --install --write-wrangler
`);
}

function shouldSkipCopy(path) {
  const name = basename(path);
  if (COPY_EXCLUDE_NAMES.has(name)) return true;
  return COPY_EXCLUDE_SUFFIXES.some((suffix) => name.endsWith(suffix));
}

function copyProjectTree(sourceDir, targetDir) {
  mkdirSync(targetDir, { recursive: true });
  for (const entry of readdirSync(sourceDir, { withFileTypes: true })) {
    const sourcePath = resolve(sourceDir, entry.name);
    if (shouldSkipCopy(sourcePath)) continue;

    const targetPath = resolve(targetDir, entry.name);
    if (entry.isDirectory()) {
      copyProjectTree(sourcePath, targetPath);
    } else if (entry.isFile()) {
      mkdirSync(dirname(targetPath), { recursive: true });
      copyFileSync(sourcePath, targetPath);
    }
  }
}

function runCommand(command, args, cwd) {
  console.log(`$ ${command} ${args.join(" ")}`);
  const result = spawnSync(command, args, {
    cwd,
    stdio: "inherit",
    shell: process.platform === "win32"
  });
  if (result.status !== 0) {
    throw new Error(`Command failed: ${command} ${args.join(" ")}`);
  }
}

function ensureTargetAvailable(targetDir, force) {
  if (!existsSync(targetDir)) return;
  if (!force) {
    throw new Error(`Folder đích đã tồn tại: ${targetDir}. Dùng --force nếu muốn xóa và tạo lại.`);
  }

  const absoluteTarget = resolve(targetDir);
  const cwd = resolve(".");
  if (absoluteTarget === cwd || cwd.startsWith(`${absoluteTarget}\\`) || cwd.startsWith(`${absoluteTarget}/`)) {
    throw new Error("Không thể --force xóa folder đang chứa workspace hiện tại.");
  }

  rmSync(absoluteTarget, { recursive: true, force: true });
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
  if (args.yes) return args;

  const rl = createInterface({ input, output });
  try {
    console.log("Create Customer Project - tạo folder dự án mới từ base hiện tại");
    const familyName = await ask(rl, "Tên dòng họ/khách", args.familyName || "Trần Xuân");
    const slug = slugifyCustomer(await ask(rl, "Slug khách", args.slug || slugifyCustomer(familyName)));
    const defaultTarget = resolve(args.parentDir || DEFAULT_PARENT_DIR, `giapha-${slug}`);

    return {
      ...args,
      familyName,
      slug,
      targetDir: await ask(rl, "Folder project mới", args.targetDir || defaultTarget),
      install: args.install || await askYesNo(rl, "Chạy npm install trong project mới không", false),
      writeWrangler: args.writeWrangler || await askYesNo(rl, "Ghi luôn wrangler.jsonc theo khách mới không", false),
      force: args.force || await askYesNo(rl, "Nếu folder tồn tại thì xóa tạo lại không", false)
    };
  } finally {
    rl.close();
  }
}

export function buildCustomerProjectPlan(options = {}) {
  const familyName = String(options.familyName || "Khách mới").trim();
  const slug = slugifyCustomer(options.slug || familyName);
  const targetDir = resolve(options.targetDir || resolve(options.parentDir || DEFAULT_PARENT_DIR, `giapha-${slug}`));
  const provision = buildProvisionPlan({
    familyName,
    slug,
    outputRoot: ".provision",
    writeWrangler: Boolean(options.writeWrangler)
  });

  return {
    familyName,
    slug,
    targetDir,
    install: Boolean(options.install),
    writeWrangler: Boolean(options.writeWrangler),
    force: Boolean(options.force),
    provisionArgs: [
      "--yes",
      "--family-name",
      familyName,
      "--slug",
      slug,
      ...(options.writeWrangler ? ["--write-wrangler"] : [])
    ],
    provision
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }

  const options = await collectOptions(args);
  const plan = buildCustomerProjectPlan(options);

  ensureTargetAvailable(plan.targetDir, plan.force);
  copyProjectTree(resolve("."), plan.targetDir);

  runCommand("node", ["scripts/provision-wizard.mjs", ...plan.provisionArgs], plan.targetDir);

  if (plan.install) {
    runCommand("npm", ["install"], plan.targetDir);
  }

  console.log("\nĐã tạo project khách mới:");
  console.log(`- Folder: ${plan.targetDir}`);
  console.log(`- Slug: ${plan.slug}`);
  console.log(`- Provision guide: ${resolve(plan.targetDir, ".provision", plan.slug, "PROVISION_GUIDE.md")}`);
  console.log("\nBước tiếp theo:");
  console.log(`cd ${plan.targetDir}`);
  console.log(`Mở .provision/${plan.slug}/PROVISION_GUIDE.md và làm theo checklist.`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
