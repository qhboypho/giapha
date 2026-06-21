#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const DEFAULT_REMOTE_NAME = "origin";

function parseArgs(argv) {
  const args = {
    remoteUrl: "",
    remoteName: DEFAULT_REMOTE_NAME,
    branch: "",
    userName: "",
    userEmail: "",
    commitMessage: "chore: configure customer project",
    globalConfig: false,
    init: false,
    noPush: false,
    yes: false,
    help: false
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = argv[i + 1];
    const [flagName, inlineValue] = arg.includes("=") ? arg.split(/=(.*)/s, 2) : [arg, ""];
    const value = inlineValue || next || "";

    if (flagName === "--remote-url") {
      args.remoteUrl = value;
      if (!inlineValue) i += 1;
    } else if (flagName === "--remote-name") {
      args.remoteName = value || DEFAULT_REMOTE_NAME;
      if (!inlineValue) i += 1;
    } else if (flagName === "--branch") {
      args.branch = value;
      if (!inlineValue) i += 1;
    } else if (flagName === "--user-name") {
      args.userName = value;
      if (!inlineValue) i += 1;
    } else if (flagName === "--user-email") {
      args.userEmail = value;
      if (!inlineValue) i += 1;
    } else if (flagName === "--commit-message") {
      args.commitMessage = value || args.commitMessage;
      if (!inlineValue) i += 1;
    } else if (arg === "--global-config") {
      args.globalConfig = true;
    } else if (arg === "--init") {
      args.init = true;
    } else if (arg === "--no-push") {
      args.noPush = true;
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
  console.log(`Customer Git Publish

Usage:
  npm run git:publish-customer -- --remote-url <github-repo-url> [options]

Options:
  --remote-url <url>       GitHub repo URL, ví dụ https://github.com/qhboypho/giapha-tran-xuan.git
  --remote-name <name>     Remote name. Default: origin
  --branch <name>          Branch cần push. Default: current branch
  --user-name <name>       Git author name nếu máy chưa config
  --user-email <email>     Git author email nếu máy chưa config
  --commit-message <msg>   Commit message nếu có thay đổi
  --global-config          Set user.name/email ở global thay vì local repo
  --init                   Chạy git init nếu folder chưa là git repo
  --no-push                Chỉ config remote/commit, không push
  --yes                    Không hỏi tương tác
  --help                   Hiện hướng dẫn

Examples:
  npm run git:publish-customer -- --remote-url=https://github.com/qhboypho/giapha-tran-xuan.git
  npm run git:publish-customer -- --remote-url=https://github.com/qhboypho/giapha-tran-xuan.git --branch=customer/tran-xuan
  npm run git:publish-customer -- --remote-url=https://github.com/qhboypho/giapha-tran-xuan.git --user-name="Dinh Tung" --user-email="you@example.com"
`);
}

function runGit(args, options = {}) {
  const result = spawnSync("git", args, {
    encoding: "utf8",
    shell: false,
    stdio: options.stdio || "pipe"
  });

  if (options.allowFailure) {
    return result;
  }
  if (result.status !== 0) {
    throw new Error((result.stderr || result.stdout || `git ${args.join(" ")} failed`).trim());
  }
  return result;
}

function gitOutput(args) {
  return runGit(args).stdout.trim();
}

function isGitRepository() {
  const result = runGit(["rev-parse", "--is-inside-work-tree"], { allowFailure: true });
  return result.status === 0 && result.stdout.trim() === "true";
}

function getGitConfig(key) {
  const result = runGit(["config", "--get", key], { allowFailure: true });
  return result.status === 0 ? result.stdout.trim() : "";
}

function remoteExists(remoteName) {
  const result = runGit(["remote", "get-url", remoteName], { allowFailure: true });
  return result.status === 0;
}

function branchExists(branch) {
  const result = runGit(["rev-parse", "--verify", branch], { allowFailure: true });
  return result.status === 0;
}

function getCurrentBranch() {
  const result = runGit(["branch", "--show-current"], { allowFailure: true });
  return result.status === 0 ? result.stdout.trim() : "";
}

function hasChanges() {
  return gitOutput(["status", "--porcelain"]).length > 0;
}

async function ask(rl, label, fallback = "") {
  const suffix = fallback ? ` (${fallback})` : "";
  const answer = await rl.question(`${label}${suffix}: `);
  return String(answer || fallback || "").trim();
}

async function collectOptions(args) {
  if (args.yes) return args;

  const rl = createInterface({ input, output });
  try {
    return {
      ...args,
      remoteUrl: await ask(rl, "GitHub repo URL", args.remoteUrl),
      branch: await ask(rl, "Branch cần push", args.branch || getCurrentBranch()),
      userName: await ask(rl, "Git user.name nếu chưa có", args.userName),
      userEmail: await ask(rl, "Git user.email nếu chưa có", args.userEmail)
    };
  } finally {
    rl.close();
  }
}

export function buildGitPublishPlan(options = {}, currentBranch = "") {
  const branch = String(options.branch || currentBranch || "").trim();
  return {
    remoteName: String(options.remoteName || DEFAULT_REMOTE_NAME).trim() || DEFAULT_REMOTE_NAME,
    remoteUrl: String(options.remoteUrl || "").trim(),
    branch,
    userName: String(options.userName || "").trim(),
    userEmail: String(options.userEmail || "").trim(),
    commitMessage: String(options.commitMessage || "chore: configure customer project").trim(),
    globalConfig: Boolean(options.globalConfig),
    init: Boolean(options.init),
    noPush: Boolean(options.noPush)
  };
}

function ensureGitIdentity(plan) {
  const scope = plan.globalConfig ? "--global" : "--local";
  const currentName = getGitConfig("user.name");
  const currentEmail = getGitConfig("user.email");

  if (!currentName) {
    if (!plan.userName) {
      throw new Error("Git chưa có user.name. Truyền --user-name hoặc chạy git config user.name.");
    }
    runGit(["config", scope, "user.name", plan.userName]);
  }

  if (!currentEmail) {
    if (!plan.userEmail) {
      throw new Error("Git chưa có user.email. Truyền --user-email hoặc chạy git config user.email.");
    }
    runGit(["config", scope, "user.email", plan.userEmail]);
  }
}

function ensureBranch(branch) {
  if (!branch) {
    throw new Error("Không xác định được branch cần push. Truyền --branch=customer/<slug>.");
  }

  const current = getCurrentBranch();
  if (current === branch) return;

  if (branchExists(branch)) {
    runGit(["checkout", branch], { stdio: "inherit" });
  } else {
    runGit(["checkout", "-b", branch], { stdio: "inherit" });
  }
}

function ensureRemote(plan) {
  if (!plan.remoteUrl) {
    throw new Error("Thiếu --remote-url <github-repo-url>.");
  }

  if (remoteExists(plan.remoteName)) {
    runGit(["remote", "set-url", plan.remoteName, plan.remoteUrl]);
  } else {
    runGit(["remote", "add", plan.remoteName, plan.remoteUrl]);
  }
}

function commitIfNeeded(message) {
  if (!hasChanges()) {
    console.log("Không có thay đổi mới để commit.");
    return false;
  }

  runGit(["add", "."], { stdio: "inherit" });
  runGit(["commit", "-m", message], { stdio: "inherit" });
  return true;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }

  const options = await collectOptions(args);
  const plan = buildGitPublishPlan(options, getCurrentBranch());

  if (!isGitRepository()) {
    if (!plan.init) {
      throw new Error("Folder hiện tại chưa phải git repo. Truyền --init nếu muốn tạo git repo local.");
    }
    runGit(["init"], { stdio: "inherit" });
  }

  ensureGitIdentity(plan);
  ensureBranch(plan.branch);
  commitIfNeeded(plan.commitMessage);
  ensureRemote(plan);

  if (!plan.noPush) {
    runGit(["push", "-u", plan.remoteName, plan.branch], { stdio: "inherit" });
  }

  console.log("Git publish hoàn tất.");
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
