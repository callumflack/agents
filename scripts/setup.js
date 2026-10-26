// Complete replica setup. Authoring checkouts keep using the lightweight linkers.
import { existsSync, lstatSync, readFileSync, readdirSync, readlinkSync, realpathSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = join(homedir(), "Repos", "callumflack", "skills");
const revision = run("mise", ["config", "get", "--file", join(root, "mise.toml"), "bootstrap.repos.~/Repos/callumflack/skills.ref"], root, true);
const checkOnly = process.argv[2] === "--check";
if (process.argv.length > (checkOnly ? 3 : 2) || !source || !/^[0-9a-f]{40}$/.test(revision || "")) {
  throw setupError("run through mise run setup or mise run setup:check");
}
const agentsHome = join(homedir(), ".agents");
const payload = join(root, ".agents");
const registry = join(agentsHome, "skills");
const targets = [".codex/skills", ".claude/skills", ".cursor/skills", ".pi/agent/skills"].map((path) => join(homedir(), path));
const lockPath = join(root, ".agents", ".skill-lock.json");
const lock = readFileSync(lockPath);
const externalNames = Object.keys(JSON.parse(lock).skills);

function setupError(message) {
  return new Error(`${message}\nFor local skill reconciliation, read ${join(root, "README.md")}#when-setup-stops-on-local-skill-changes ("When setup stops on local skill changes"). Preserve local work before retrying.`);
}

function run(command, args, cwd = root, capture = false) {
  const result = spawnSync(command, args, { cwd, encoding: "utf8", stdio: capture ? "pipe" : "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) throw setupError(capture ? result.stderr.trim() : `${command} failed (${result.status})`);
  return result.stdout?.trim();
}
function stat(path) {
  try { return lstatSync(path); }
  catch (error) { if (error.code === "ENOENT") return undefined; throw error; }
}
function cleanSource() {
  if (run("git", ["status", "--porcelain", "--untracked-files=all"], source, true)) {
    throw setupError(`preserving dirty Skills checkout: ${source}; use the existing authoring linkers until its changes are published`);
  }
}
function assertPinned() {
  cleanSource();
  const head = run("git", ["rev-parse", "HEAD"], source, true);
  if (head !== revision) throw setupError(`preserving Skills checkout at ${head}: ${source}; expected ${revision}. Review and publish local commits before deliberately aligning the checkout or pin`);
}

// Reject local state before cloning Skills, restoring content or relinking runtimes.
// Setup owns fixed locations; the standalone linkers/installer support overrides.
for (const [key, expected] of [["AGENTS_HOME", agentsHome], ["SKILLS_LOCK", lockPath]]) {
  if (process.env[key] && resolve(process.env[key]) !== expected) {
    throw setupError(`setup requires ${key}=${expected}; preserving the overridden location`);
  }
}
if (!checkOnly && run("git", ["status", "--porcelain", "--untracked-files=all"], root, true)) {
  throw setupError(`preserving dirty Agents checkout: ${root}; review and publish intended changes before replica setup; do not reset or stash just to bypass this check`);
}
if (stat(agentsHome) && (!existsSync(agentsHome) || realpathSync(agentsHome) !== realpathSync(payload))) {
  throw setupError(`preserving existing agent home: ${agentsHome}; reconcile its local skills with ${payload} before changing the link`);
}
if (stat(source)) cleanSource();
run(process.execPath, ["scripts/install-skills-from-lock.js", "--preflight"]);
for (const target of targets) {
  if (stat(target) && !stat(target).isDirectory()) throw setupError(`preserving conflicting runtime directory: ${target}`);
}
if (!checkOnly && !stat(source)) run("mise", ["bootstrap", "repos", "apply"]);
const head = run("git", ["rev-parse", "HEAD"], source, true);
const advancing = head !== revision;
if (advancing) {
  if (checkOnly) assertPinned();
  const url = run("mise", ["config", "get", "--file", join(root, "mise.toml"), "bootstrap.repos.~/Repos/callumflack/skills.url"], root, true);
  run("git", ["fetch", "--no-tags", url, revision], source);
  const ancestry = spawnSync("git", ["merge-base", "--is-ancestor", head, revision], { cwd: source });
  if (ancestry.error) throw ancestry.error;
  if (ancestry.status !== 0) {
    throw setupError(`preserving Skills checkout at ${head}: ${source}; expected ${revision}. Current HEAD is not a proven ancestor of the pin; review local commits before retrying`);
  }
}
// Inspect incoming names before moving HEAD, including newly added skills.
const authoredNames = advancing
  ? run("git", ["ls-tree", "-r", "--name-only", "-z", revision], source, true).split("\0")
    .filter((path) => /^[^/]+\/SKILL\.md$/.test(path)).map((path) => path.slice(0, -"/SKILL.md".length))
  : readdirSync(source).filter((name) => existsSync(join(source, name, "SKILL.md")));
for (const name of authoredNames) {
  if (externalNames.includes(name)) throw setupError(`authored/external skill ownership collision: ${name}`);
  const target = join(registry, name);
  if (stat(target) && (!stat(target).isSymbolicLink() || resolve(dirname(target), readlinkSync(target)) !== join(source, name))) {
    throw setupError(`preserving conflicting authored skill: ${target}`);
  }
}
const names = [...externalNames, ...authoredNames];
// The authored linker fans out unrecorded registry entries too. Preserve their
// runtime variants just as strictly as the pinned set before invoking it.
const registryPath = join(payload, "skills");
const registeredNames = stat(registryPath) ? readdirSync(registryPath, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() || entry.isSymbolicLink()).map((entry) => entry.name) : [];
const linkedNames = [...new Set([...names, ...registeredNames])];
for (const target of targets) {
  for (const name of linkedNames) {
    const path = join(target, name);
    if (stat(path) && (!stat(path).isSymbolicLink() || resolve(dirname(path), readlinkSync(path)) !== join(registry, name))) {
      throw setupError(`preserving conflicting runtime skill: ${path}`);
    }
  }
}
if (!checkOnly) {
  if (advancing) {
    cleanSource();
    run("git", ["merge", "--ff-only", "--no-autostash", "--no-overwrite-ignore", revision], source);
  }
  assertPinned();
  run(process.execPath, ["scripts/install-skills-from-lock.js", "--apply"]);
  run("bash", ["scripts/link-home.sh"]);
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
      throw setupError(`missing or incorrect runtime skill: ${path}`);
    }
  }
}
assertPinned();
if (!readFileSync(lockPath).equals(lock)) throw setupError("setup changed the external-skill lock");
console.log(`ok: ${externalNames.length} external + ${authoredNames.length} authored skills; four runtimes; Skills ${revision}`);
console.log("Provider plugin registration and Homebase/KB content remain separate setup steps.");
