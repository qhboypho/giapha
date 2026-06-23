#!/usr/bin/env node
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  rmSync,
  statSync
} from "node:fs";
import { basename, dirname, isAbsolute, relative, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { fileURLToPath } from "node:url";
import { buildProvisionPlan, slugifyCustomer } from "./provision-wizard.mjs";
import { sanitizeCustomerProject } from "./customer-sanitizer.mjs";

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

export function parseArgs(argv) {
  const args = {
    familyName: "",
    slug: "",
    targetDir: "",
    parentDir: DEFAULT_PARENT_DIR,
    customerProject: false,
    handoffReady: false,
    install: false,
    writeWrangler: false,
    gitInit: false,
    commitMessage: "",
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
    } else if (arg === "--customer-project") {
      args.customerProject = true;
    } else if (arg === "--handoff-ready" || arg === "--no-setup-wizard") {
      args.handoffReady = true;
    } else if (arg === "--install") {
      args.install = true;
    } else if (arg === "--write-wrangler") {
      args.writeWrangler = true;
    } else if (arg === "--git-init") {
      args.gitInit = true;
    } else if (flagName === "--commit-message") {
      args.commitMessage = value;
      if (!inlineValue) i += 1;
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
  --customer-project     Clone ở chế độ khách mới, dùng dữ liệu sample
  --handoff-ready        Ẩn Setup Wizard trong project khách đã cấu hình xong
  --no-setup-wizard      Alias của --handoff-ready
  --install              Chạy npm install trong project mới
  --write-wrangler       Ghi luôn wrangler.jsonc trong project mới
  --git-init             Tạo git repo local, branch customer/<slug>, initial commit
  --commit-message <msg> Commit message khi dùng --git-init
  --force                Xóa target-dir nếu đã tồn tại
  --yes                  Không hỏi tương tác, dùng tham số/default
  --help                 Hiện hướng dẫn

Examples:
  npm run create-customer
  npm run create-customer -- --family-name "Trần Xuân" --slug tran-xuan
  npm run create-customer -- --family-name "Trần Xuân" --slug tran-xuan --git-init --install --write-wrangler
  npm run create-customer -- --family-name "Trần Xuân" --slug tran-xuan --handoff-ready
`);
}

function shouldSkipCopy(path) {
  const name = basename(path);
  if (COPY_EXCLUDE_NAMES.has(name)) return true;
  if (/^giapha-[a-z0-9-]+$/i.test(name)) return true;
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

function runCommand(command, args, cwd, options = {}) {
  console.log(`$ ${command} ${args.join(" ")}`);
  const needsWindowsShell = process.platform === "win32" && ["npm", "npx"].includes(command);
  const executable = needsWindowsShell ? command : command;
  const maxAttempts = Number(options.retries || 0) + 1;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const result = spawnSync(executable, args, {
      cwd,
      stdio: "inherit",
      shell: needsWindowsShell,
      windowsVerbatimArguments: false
    });
    if (result.status === 0) return;

    if (attempt < maxAttempts) {
      console.log(`Command failed, thử lại lần ${attempt + 1}/${maxAttempts}: ${command} ${args.join(" ")}`);
    }
  }

  throw new Error(`Command failed: ${command} ${args.join(" ")}`);
}

export function ensureTargetAvailable(targetDir, force) {
  const absoluteTarget = resolve(targetDir);
  const cwd = resolve(".");
  const targetInsideWorkspace = relative(cwd, absoluteTarget);
  if (absoluteTarget === cwd || (targetInsideWorkspace && !targetInsideWorkspace.startsWith("..") && !isAbsolute(targetInsideWorkspace))) {
    throw new Error("Folder project mới phải nằm ngoài project base hiện tại, nên đặt ngang hàng với folder base.");
  }
  if (cwd.startsWith(`${absoluteTarget}\\`) || cwd.startsWith(`${absoluteTarget}/`)) {
    throw new Error("Không thể --force xóa folder đang chứa workspace hiện tại.");
  }
  if (!existsSync(targetDir)) return;
  if (!force) {
    throw new Error(`Folder đích đã tồn tại: ${targetDir}. Dùng --force nếu muốn xóa và tạo lại.`);
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
      gitInit: args.gitInit || await askYesNo(rl, "Tạo git repo local và commit initial không", true),
      force: args.force || await askYesNo(rl, "Nếu folder tồn tại thì xóa tạo lại không", false)
    };
  } finally {
    rl.close();
  }
}

export function buildCustomerProjectPlan(options = {}) {
  const familyName = String(options.familyName || "Khách mới").trim();
  const slug = slugifyCustomer(options.slug || familyName);
  const parentDir = options.parentDir || DEFAULT_PARENT_DIR;
  const targetDir = resolveCustomerTargetDir(options.targetDir, parentDir, slug);
  const provision = buildProvisionPlan({
    familyName,
    slug,
    outputRoot: ".provision",
    writeWrangler: Boolean(options.writeWrangler),
    customerProject: true,
    handoffReady: Boolean(options.handoffReady)
  });

  return {
    familyName,
    slug,
    targetDir,
    install: Boolean(options.install),
    writeWrangler: Boolean(options.writeWrangler),
    gitInit: Boolean(options.gitInit),
    gitBranch: `customer/${slug}`,
    commitMessage: String(options.commitMessage || `chore: initialize ${familyName} customer project`).trim(),
    setupWizard: !options.handoffReady,
    force: Boolean(options.force),
    provisionArgs: [
      "--yes",
      "--family-name",
      familyName,
      "--slug",
      slug,
      "--customer-project",
      ...(options.handoffReady ? ["--handoff-ready"] : []),
      ...(options.writeWrangler ? ["--write-wrangler"] : [])
    ],
    provision
  };
}

export function resolveCustomerTargetDir(targetDir, parentDir = DEFAULT_PARENT_DIR, slug = "khach-moi") {
  const value = String(targetDir || "").trim();
  if (!value) {
    return resolve(parentDir, `giapha-${slug}`);
  }
  if (isAbsolute(value)) {
    return resolve(value);
  }
  return resolve(parentDir, value);
}

function initializeGitRepository(plan) {
  runCommand("git", ["init"], plan.targetDir);
  runCommand("git", ["checkout", "-b", plan.gitBranch], plan.targetDir);
  runCommand("git", ["add", "."], plan.targetDir);
  runCommand("git", ["commit", "-m", plan.commitMessage], plan.targetDir);
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
  sanitizeCustomerProject(plan.targetDir, { familyName: plan.familyName, slug: plan.slug, setupWizard: plan.setupWizard });

  runCommand("node", ["scripts/provision-wizard.mjs", ...plan.provisionArgs], plan.targetDir);

  if (plan.install) {
    runCommand("npm", ["install", "--no-audit", "--no-fund"], plan.targetDir, { retries: 1 });
  }

  if (plan.gitInit) {
    initializeGitRepository(plan);
  }

  console.log("\nĐã tạo project khách mới:");
  console.log(`- Folder: ${plan.targetDir}`);
  console.log(`- Slug: ${plan.slug}`);
  if (plan.gitInit) {
    console.log(`- Git branch: ${plan.gitBranch}`);
  }
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
