// Complete replica setup. Authoring checkouts keep using the lightweight linkers.
import { existsSync, lstatSync, readFileSync, readdirSync, readlinkSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = join(homedir(), "Repos", "callumflack", "skills");
const revision = run("mise", ["config", "get", "--file", join(root, "mise.toml"), "bootstrap.repos.~/Repos/callumflack/skills.ref"], root, true);
const checkOnly = process.argv[2] === "--check";
if (process.argv.length > (checkOnly ? 3 : 2) || !source || !/^[0-9a-f]{40}$/.test(revision || "")) {
  throw new Error("run through mise run setup or mise run setup:check");
}
const registry = join(homedir(), ".agents", "skills");
const targets = [".codex/skills", ".claude/skills", ".cursor/skills", ".pi/agent/skills"].map((path) => join(homedir(), path));
const lockPath = join(root, ".agents", ".skill-lock.json");
const lock = readFileSync(lockPath);
const externalNames = Object.keys(JSON.parse(lock).skills);

function run(command, args, cwd = root, capture = false) {
  const result = spawnSync(command, args, { cwd, encoding: "utf8", stdio: capture ? "pipe" : "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(capture ? result.stderr.trim() : `${command} failed (${result.status})`);
  return result.stdout?.trim();
}
function stat(path) {
  try { return lstatSync(path); }
  catch (error) { if (error.code === "ENOENT") return undefined; throw error; }
}
function cleanSource() {
  if (run("git", ["status", "--porcelain", "--untracked-files=all"], source, true)) {
    throw new Error(`preserving dirty Skills checkout: ${source}; use the existing authoring linkers until its changes are published`);
  }
}
function assertPinned() {
  cleanSource();
  if (run("git", ["rev-parse", "HEAD"], source, true) !== revision) throw new Error(`Skills checkout does not match pinned revision ${revision}`);
}

// Stop before repository reconciliation or registry changes on the authoring Mac.
if (stat(source)) cleanSource();
for (const target of targets) {
  if (stat(target) && !stat(target).isDirectory()) throw new Error(`preserving conflicting runtime directory: ${target}`);
}
if (!checkOnly) run("mise", ["bootstrap", "repos", "apply"]);
assertPinned();
const authoredNames = readdirSync(source).filter((name) => existsSync(join(source, name, "SKILL.md")));
for (const name of authoredNames) {
  if (externalNames.includes(name)) throw new Error(`authored/external skill ownership collision: ${name}`);
  const target = join(registry, name);
  if (stat(target) && (!stat(target).isSymbolicLink() || resolve(dirname(target), readlinkSync(target)) !== join(source, name))) {
    throw new Error(`preserving conflicting authored skill: ${target}`);
  }
}
const names = [...externalNames, ...authoredNames];
for (const target of targets) {
  for (const name of names) {
    const path = join(target, name);
    if (stat(path) && (!stat(path).isSymbolicLink() || resolve(dirname(path), readlinkSync(path)) !== join(registry, name))) {
      throw new Error(`preserving conflicting runtime skill: ${path}`);
    }
  }
}
if (!checkOnly) {
  run("bash", ["scripts/link-home.sh"]);
  run(process.execPath, ["scripts/install-skills-from-lock.js", "--apply"]);
  run("bash", [join(source, "scripts", "link-skills.sh")]);
  // The pinned Skills linker predates Pi. Keep using Agents' existing adapter.
  run(process.execPath, ["scripts/sync-skills.js", `--target=${targets[3]}`]);
}
run(process.execPath, ["scripts/install-skills-from-lock.js", "--check"]);
run(process.execPath, ["scripts/check-skill-manifest.js"]);
run("bash", [join(source, "scripts", "check-links.sh")]);
run("bash", ["scripts/check-home.sh"]);
run(process.execPath, ["scripts/check-pstack-plugin.js"]);
for (const target of targets) {
  for (const name of names) {
    const path = join(target, name);
    if (!stat(path)?.isSymbolicLink() || readlinkSync(path) !== join(registry, name) || !existsSync(path)) {
      throw new Error(`missing or incorrect runtime skill: ${path}`);
    }
  }
}
assertPinned();
if (!readFileSync(lockPath).equals(lock)) throw new Error("setup changed the external-skill lock");
console.log(`ok: ${externalNames.length} external + ${authoredNames.length} authored skills; four runtimes; Skills ${revision}`);
console.log("Provider plugin registration and Homebase/KB content remain separate setup steps.");
