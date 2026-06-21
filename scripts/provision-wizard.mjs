#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { randomBytes } from "node:crypto";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { fileURLToPath } from "node:url";

const DEFAULT_COMPATIBILITY_DATE = "2026-06-01";
const DEFAULT_OUTPUT_ROOT = ".provision";
const D1_ID_PLACEHOLDER = "PASTE_D1_DATABASE_ID_HERE";

function parseArgs(argv) {
  const args = {
    familyName: "",
    slug: "",
    projectName: "",
    d1Name: "",
    d1Id: "",
    r2Name: "",
    previewR2Name: "",
    cmsPackagePath: "",
    outputRoot: DEFAULT_OUTPUT_ROOT,
    aiSecret: "",
    writeWrangler: false,
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
    } else if (flagName === "--project-name") {
      args.projectName = value;
      if (!inlineValue) i += 1;
    } else if (flagName === "--d1-name") {
      args.d1Name = value;
      if (!inlineValue) i += 1;
    } else if (flagName === "--d1-id") {
      args.d1Id = value;
      if (!inlineValue) i += 1;
    } else if (flagName === "--r2-name") {
      args.r2Name = value;
      if (!inlineValue) i += 1;
    } else if (flagName === "--preview-r2-name") {
      args.previewR2Name = value;
      if (!inlineValue) i += 1;
    } else if (flagName === "--cms-package") {
      args.cmsPackagePath = value;
      if (!inlineValue) i += 1;
    } else if (flagName === "--output-root") {
      args.outputRoot = value || DEFAULT_OUTPUT_ROOT;
      if (!inlineValue) i += 1;
    } else if (flagName === "--ai-secret") {
      args.aiSecret = value;
      if (!inlineValue) i += 1;
    } else if (arg === "--write-wrangler") {
      args.writeWrangler = true;
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
  console.log(`Provision Wizard

Usage:
  npm run provision:wizard
  node scripts/provision-wizard.mjs [options]

Options:
  --family-name <name>       Tên dòng họ/khách
  --slug <slug>              Slug khách, ví dụ tran-cong
  --project-name <name>      Cloudflare Pages project
  --d1-name <name>           Cloudflare D1 database name
  --d1-id <id>               Cloudflare D1 database id nếu đã tạo
  --r2-name <name>           Cloudflare R2 bucket name
  --preview-r2-name <name>   Preview R2 bucket name
  --cms-package <path>       Đường dẫn CMS package nếu có
  --output-root <dir>        Thư mục output. Default: ${DEFAULT_OUTPUT_ROOT}
  --ai-secret <secret>       AI_CONFIG_SECRET. Nếu bỏ trống script tự sinh
  --write-wrangler           Ghi wrangler.jsonc ở root sau khi sinh bản backup
  --yes                      Không hỏi tương tác, dùng default từ tham số
  --help                     Hiện hướng dẫn

Examples:
  npm run provision:wizard
  npm run provision:wizard -- --family-name "Trần Công" --slug tran-cong
  node scripts/provision-wizard.mjs --slug tran-cong --d1-id xxxx --write-wrangler
`);
}

export function slugifyCustomer(value = "") {
  const slug = String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return slug || "khach-moi";
}

export function generateAiSecret() {
  return randomBytes(32).toString("base64url");
}

function defaultPlanFromSlug(slug) {
  return {
    projectName: `giapha-${slug}`,
    d1Name: `giapha-${slug}-db`,
    r2Name: `giapha-${slug}-media`,
    previewR2Name: `giapha-${slug}-media-preview`
  };
}

function normalizePathForDocs(path = "") {
  return String(path || "").replaceAll("\\", "/");
}

function ensureValue(value, fallback) {
  const normalized = String(value || "").trim();
  return normalized || fallback;
}

async function ask(rl, label, fallback = "") {
  const suffix = fallback ? ` (${fallback})` : "";
  const answer = await rl.question(`${label}${suffix}: `);
  return ensureValue(answer, fallback);
}

async function askYesNo(rl, label, fallback = false) {
  const answer = await rl.question(`${label} ${fallback ? "(Y/n)" : "(y/N)"}: `);
  const normalized = answer.trim().toLowerCase();
  if (!normalized) return fallback;
  return ["y", "yes", "co", "có"].includes(normalized);
}

async function collectInteractiveOptions(args) {
  if (args.yes) return args;

  const rl = createInterface({ input, output });
  try {
    console.log("Provision Wizard - tạo bộ cài Cloudflare cho khách mới");
    const familyName = await ask(rl, "Tên dòng họ/khách", args.familyName || "Khách mới");
    const slug = slugifyCustomer(await ask(rl, "Slug khách", args.slug || slugifyCustomer(familyName)));
    const defaults = defaultPlanFromSlug(slug);

    return {
      ...args,
      familyName,
      slug,
      projectName: await ask(rl, "Cloudflare Pages project", args.projectName || defaults.projectName),
      d1Name: await ask(rl, "D1 database name", args.d1Name || defaults.d1Name),
      d1Id: await ask(rl, "D1 database id nếu đã tạo, bỏ trống nếu chưa", args.d1Id),
      r2Name: await ask(rl, "R2 bucket production", args.r2Name || defaults.r2Name),
      previewR2Name: await ask(rl, "R2 bucket preview", args.previewR2Name || defaults.previewR2Name),
      cmsPackagePath: await ask(rl, "CMS package path nếu có, bỏ trống nếu setup trong app", args.cmsPackagePath),
      aiSecret: await ask(rl, "AI_CONFIG_SECRET, bỏ trống để tự sinh", args.aiSecret),
      writeWrangler: args.writeWrangler || await askYesNo(rl, "Ghi đè wrangler.jsonc ở root luôn không", false)
    };
  } finally {
    rl.close();
  }
}

export function buildProvisionPlan(options = {}) {
  const familyName = ensureValue(options.familyName, "Khách mới");
  const slug = slugifyCustomer(options.slug || familyName);
  const defaults = defaultPlanFromSlug(slug);
  const outputDir = normalizePathForDocs(resolve(options.outputRoot || DEFAULT_OUTPUT_ROOT, slug));

  return {
    familyName,
    slug,
    outputDir,
    projectName: ensureValue(options.projectName, defaults.projectName),
    d1Name: ensureValue(options.d1Name, defaults.d1Name),
    d1Id: ensureValue(options.d1Id, D1_ID_PLACEHOLDER),
    r2Name: ensureValue(options.r2Name, defaults.r2Name),
    previewR2Name: ensureValue(options.previewR2Name, defaults.previewR2Name),
    cmsPackagePath: normalizePathForDocs(options.cmsPackagePath || ""),
    aiSecret: ensureValue(options.aiSecret, generateAiSecret()),
    writeWrangler: Boolean(options.writeWrangler)
  };
}

export function buildWranglerConfig(plan) {
  return {
    $schema: "node_modules/wrangler/config-schema.json",
    name: plan.projectName,
    compatibility_date: DEFAULT_COMPATIBILITY_DATE,
    pages_build_output_dir: "./dist",
    compatibility_flags: ["nodejs_compat"],
    d1_databases: [
      {
        binding: "DB",
        database_name: plan.d1Name,
        database_id: plan.d1Id,
        preview_database_id: plan.d1Id
      }
    ],
    r2_buckets: [
      {
        binding: "MEDIA_BUCKET",
        bucket_name: plan.r2Name,
        preview_bucket_name: plan.previewR2Name
      }
    ]
  };
}

function jsonWithTrailingNewline(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

export function buildProvisionGuide(plan) {
  const cmsPackageLine = plan.cmsPackagePath || "data/khach-a-package.json";
  const d1IdNote = plan.d1Id === D1_ID_PLACEHOLDER
    ? "- D1 id đang là placeholder. Sau khi chạy lệnh tạo D1, copy id vào `wrangler.generated.jsonc` hoặc root `wrangler.jsonc`."
    : "- D1 id đã được điền trong config sinh ra.";

  return `# Provision Guide - ${plan.familyName}

Thư mục này được sinh bởi \`npm run provision:wizard\`. Dùng nó để triển khai nhanh một site gia phả mới từ base hiện tại.

Nếu bắt đầu từ repo base, lệnh đầy đủ kiểu Trần Xuân là:

\`\`\`powershell
npm run create-customer -- --family-name="${plan.familyName}" --slug=${plan.slug} --git-init --write-wrangler --install --force --commit-message="chore: init ${plan.familyName} site"
\`\`\`

Sau lệnh này, vào folder project khách rồi làm các bước bên dưới.

## 1. Đăng nhập Cloudflare

\`\`\`powershell
npx wrangler login
\`\`\`

## 2. Tạo tài nguyên Cloudflare

\`\`\`powershell
npx wrangler d1 create ${plan.d1Name}
npx wrangler r2 bucket create ${plan.r2Name}
npx wrangler r2 bucket create ${plan.previewR2Name}
\`\`\`

${d1IdNote}

Nếu cần xem lại UUID:

\`\`\`powershell
npx wrangler d1 list
\`\`\`

## 3. Áp dụng cấu hình Wrangler

File đã sinh:

\`\`\`text
${plan.outputDir}/wrangler.generated.jsonc
\`\`\`

Dev có thể copy file này thành \`wrangler.jsonc\`, hoặc chạy lại wizard với \`--write-wrangler\`.

Kiểm tra kỹ không để thừa dấu cách trong \`database_id\` và \`preview_database_id\`.

## 4. Commit và push GitHub nếu có repo riêng

Sau khi \`wrangler.jsonc\` đã đúng, commit lại cấu hình local:

\`\`\`powershell
git add wrangler.jsonc .provision\\${plan.slug}\\PROVISION_GUIDE.md .provision\\${plan.slug}\\provision-summary.json
git commit -m "chore: configure ${plan.familyName} Cloudflare resources"
\`\`\`

Nếu đã tạo repo GitHub riêng, ví dụ \`https://github.com/qhboypho/${plan.projectName}.git\`, đẩy code lên repo đó:

\`\`\`powershell
git remote add origin https://github.com/qhboypho/${plan.projectName}.git
git push -u origin customer/${plan.slug}
\`\`\`

Nếu \`origin\` đã tồn tại thì dùng:

\`\`\`powershell
git remote set-url origin https://github.com/qhboypho/${plan.projectName}.git
git push -u origin customer/${plan.slug}
\`\`\`

## 5. Apply migrations

Local:

\`\`\`powershell
npx wrangler d1 migrations apply ${plan.d1Name} --local
\`\`\`

Production:

\`\`\`powershell
npx wrangler d1 migrations apply ${plan.d1Name} --remote
\`\`\`

## 6. Build và chạy local Cloudflare Pages

\`\`\`powershell
npm install
npm run build
npm run dev:cf
\`\`\`

Mở:

\`\`\`text
http://127.0.0.1:8788
\`\`\`

## 7. Deploy Cloudflare Pages lần đầu

Deploy lần đầu để Cloudflare tạo Pages project:

\`\`\`powershell
npm run build
npx wrangler pages deploy ./dist --project-name ${plan.projectName}
\`\`\`

Sau khi deploy thành công, URL mặc định thường là:

\`\`\`text
https://${plan.projectName}.pages.dev/
\`\`\`

## 8. Cấu hình secret AI

\`\`\`powershell
npx wrangler pages secret put AI_CONFIG_SECRET --project-name ${plan.projectName}
\`\`\`

Giá trị gợi ý đã sinh:

\`\`\`text
${plan.aiSecret}
\`\`\`

Không commit secret này lên git. Sau khi set secret, deploy lại để Pages Function nhận biến mới:

\`\`\`powershell
npm run build
npx wrangler pages deploy ./dist --project-name ${plan.projectName}
\`\`\`

Sau khi deploy, admin có thể nhập API key OpenAI/Gemini/Claude trong app.

## 9. Import CMS package nếu có

Dry-run:

\`\`\`powershell
node scripts/cms-bootstrap.mjs --package=${cmsPackageLine}
\`\`\`

Import local:

\`\`\`powershell
node scripts/cms-bootstrap.mjs --package=${cmsPackageLine} --migrate --admin-password="doi-mat-khau-nay" --yes
\`\`\`

Import production:

\`\`\`powershell
node scripts/cms-bootstrap.mjs --package=${cmsPackageLine} --remote --migrate --admin-password="doi-mat-khau-prod" --yes
\`\`\`

Nếu chưa có CMS package, deploy site base rồi đăng nhập admin, mở Setup Wizard trong app để cấu hình và nhập dữ liệu.

## 10. Sau deploy

- Đăng nhập admin.
- Mở Setup Wizard trong app.
- Cấu hình tên dòng họ, logo, footer.
- Cấu hình AI nếu dùng ảnh/PDF.
- Import CMS package, JSON cây, media package hoặc dùng AI nhận diện.
- Đổi mật khẩu admin trước khi bàn giao.
`;
}

export function buildProvisionSummary(plan) {
  return {
    familyName: plan.familyName,
    slug: plan.slug,
    projectName: plan.projectName,
    d1Name: plan.d1Name,
    d1Id: plan.d1Id,
    r2Name: plan.r2Name,
    previewR2Name: plan.previewR2Name,
    cmsPackagePath: plan.cmsPackagePath,
    outputDir: plan.outputDir,
    aiSecretPreview: `${plan.aiSecret.slice(0, 6)}...${plan.aiSecret.slice(-6)}`
  };
}

function writeProvisionFiles(plan) {
  mkdirSync(plan.outputDir, { recursive: true });

  const wranglerPath = resolve(plan.outputDir, "wrangler.generated.jsonc");
  const guidePath = resolve(plan.outputDir, "PROVISION_GUIDE.md");
  const summaryPath = resolve(plan.outputDir, "provision-summary.json");
  const secretPath = resolve(plan.outputDir, "AI_CONFIG_SECRET.txt");

  writeFileSync(wranglerPath, jsonWithTrailingNewline(buildWranglerConfig(plan)), "utf8");
  writeFileSync(guidePath, buildProvisionGuide(plan), "utf8");
  writeFileSync(summaryPath, jsonWithTrailingNewline(buildProvisionSummary(plan)), "utf8");
  writeFileSync(secretPath, `${plan.aiSecret}\n`, "utf8");

  return { wranglerPath, guidePath, summaryPath, secretPath };
}

function writeRootWrangler(plan, generatedWranglerPath) {
  const rootPath = resolve("wrangler.jsonc");
  const backupPath = resolve(plan.outputDir, "wrangler.backup.jsonc");

  if (existsSync(rootPath)) {
    writeFileSync(backupPath, readFileSync(rootPath, "utf8"), "utf8");
  } else {
    mkdirSync(dirname(rootPath), { recursive: true });
  }

  writeFileSync(rootPath, readFileSync(generatedWranglerPath, "utf8"), "utf8");
  return { rootPath, backupPath };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }

  const options = await collectInteractiveOptions(args);
  const plan = buildProvisionPlan(options);
  const files = writeProvisionFiles(plan);
  let rootWrite = null;

  if (plan.writeWrangler) {
    rootWrite = writeRootWrangler(plan, files.wranglerPath);
  }

  console.log("\nProvision files đã sinh:");
  console.log(`- ${files.guidePath}`);
  console.log(`- ${files.wranglerPath}`);
  console.log(`- ${files.summaryPath}`);
  console.log(`- ${files.secretPath}`);

  if (rootWrite) {
    console.log("\nĐã ghi root wrangler.jsonc:");
    console.log(`- ${rootWrite.rootPath}`);
    console.log(`Backup: ${rootWrite.backupPath}`);
  } else {
    console.log("\nChưa ghi đè wrangler.jsonc. Mở wrangler.generated.jsonc để copy khi sẵn sàng.");
  }

  console.log("\nBước tiếp theo:");
  console.log(`1. Mở ${files.guidePath}`);
  console.log("2. Tạo D1/R2 nếu chưa có");
  console.log("3. Điền D1 database_id nếu đang là placeholder");
  console.log("4. Build/deploy, rồi mở Setup Wizard trong app");
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
