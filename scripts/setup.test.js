import assert from "node:assert/strict";
import { chmodSync, cpSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, readlinkSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";

const scripts = dirname(fileURLToPath(import.meta.url));
function fixture(t) {
  const home = mkdtempSync(join(tmpdir(), "agents-setup-test-"));
  t.after(() => rmSync(home, { recursive: true, force: true }));
  const root = join(home, "Repos/callumflack/agents");
  const source = join(home, "Repos/callumflack/skills");
  const payload = join(root, ".agents");
  const registry = join(payload, "skills");
  const env = { ...process.env, HOME: home, GIT_CONFIG_GLOBAL: "/dev/null", GIT_CONFIG_NOSYSTEM: "1",
    MISE_CONFIG_DIR: join(home, ".config/mise"), MISE_DATA_DIR: join(home, ".local/share/mise"),
    MISE_STATE_DIR: join(home, ".local/state/mise"), MISE_CACHE_DIR: join(home, ".cache/mise"),
    MISE_TRUSTED_CONFIG_PATHS: root, GIT_OPTIONAL_LOCKS: "0" };
  for (const key of ["SKILLS_LOCK", "AGENTS_HOME", "MISE_ENV", "MISE_CONFIG_FILE", "GIT_DIR", "GIT_WORK_TREE", "GIT_INDEX_FILE"]) delete env[key];
  function git(cwd, ...args) {
    const result = spawnSync("git", args, { cwd, env, encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr);
    return result.stdout.trim();
  }
  function init(path) {
    mkdirSync(path, { recursive: true });
    git(path, "init", "--quiet");
    git(path, "config", "user.name", "Fixture");
    git(path, "config", "user.email", "fixture@example.invalid");
    git(path, "config", "core.hooksPath", "/dev/null");
  }
  function commit(path) { git(path, "add", "."); git(path, "commit", "--quiet", "-m", "fixture"); }
  init(source);
  git(source, "remote", "add", "origin", source);
  mkdirSync(join(source, "authored"));
  writeFileSync(join(source, "authored/SKILL.md"), "Authored skill\n");
  commit(source);
  const revision = git(source, "rev-parse", "HEAD");
  init(root);
  cpSync(scripts, join(root, "scripts"), { recursive: true });
  mkdirSync(join(registry, "external"), { recursive: true });
  writeFileSync(join(registry, "external/SKILL.md"), "External skill\n");
  writeFileSync(join(registry, "external/run.sh"), "#!/bin/sh\necho external\n", { mode: 0o755 });
  git(root, "add", ".");
  const tree = git(root, "write-tree");
  const externalTree = git(root, "rev-parse", `${tree}:.agents/skills/external`);
  git(root, "rm", "--cached", "-r", ".agents/skills");
  writeFileSync(join(root, ".gitignore"), ".agents/skills\n");
  writeFileSync(join(payload, "AGENTS.md"), "Fixture instructions\n");
  writeFileSync(join(payload, ".skill-lock.json"), JSON.stringify({ version: 3, skills: {
    external: { source: "example/skills", sourceType: "github", skillFolderHash: externalTree },
  } }));
  writeFileSync(join(root, "mise.toml"), `[bootstrap.repos]\n"~/Repos/callumflack/skills" = { url = "${source}", ref = "${revision}" }\n`);
  symlinkSync(payload, join(home, ".agents"));
  commit(root);
  return { home, root, source, registry, env, git, commit,
    run: (...args) => spawnSync(process.execPath, [join(root, "scripts/setup.js"), ...args], { cwd: root, env, encoding: "utf8", timeout: 15000 }),
  };
}

// Snapshot user-visible files, link targets, modes, and both Git indexes/HEADs.
// Git's caches, reflogs and mise's own trust cache are not user skill content.
function snapshot(f) {
  const files = {};
  function walk(path) {
    const info = lstatSync(path);
    if (info.isSymbolicLink()) files[path] = ["link", readlinkSync(path)];
    else if (info.isDirectory()) {
      files[path] = ["directory", info.mode];
      for (const name of readdirSync(path).sort()) if (name !== ".git") walk(join(path, name));
    } else files[path] = [info.mode, readFileSync(path).toString("base64")];
  }
  for (const path of [f.root, f.source, join(f.home, ".agents"), join(f.home, ".codex"), join(f.home, "other")]) {
    if (existsSync(path) || (() => { try { return lstatSync(path).isSymbolicLink(); } catch { return false; } })()) walk(path);
  }
  for (const path of [f.root, f.source]) {
    files[`${path}:HEAD`] = f.git(path, "rev-parse", "HEAD");
    files[`${path}:index`] = readFileSync(join(path, ".git/index")).toString("base64");
  }
  return files;
}

const cases = [
  ["overridden agent home", /setup requires AGENTS_HOME=/, (f) => { f.env.AGENTS_HOME = join(f.home, "other"); }],
  ["overridden skill lock", /setup requires SKILLS_LOCK=/, (f) => { f.env.SKILLS_LOCK = join(f.home, "other-lock.json"); }],
  ["unstaged Agents work", /preserving dirty Agents checkout/, (f) => writeFileSync(join(f.root, ".agents/AGENTS.md"), "Local instructions\n")],
  ["staged Agents work", /preserving dirty Agents checkout/, (f) => {
    writeFileSync(join(f.root, ".agents/AGENTS.md"), "Staged instructions\n"); f.git(f.root, "add", ".agents/AGENTS.md");
  }],
  ["untracked Agents work", /preserving dirty Agents checkout/, (f) => writeFileSync(join(f.root, "local.txt"), "keep\n")],
  ["dirty authored skill", /preserving dirty Skills checkout/, (f) => writeFileSync(join(f.source, "authored/SKILL.md"), "Local authored edit\n")],
  ["untracked authored skill", /preserving dirty Skills checkout/, (f) => writeFileSync(join(f.source, "new-skill.md"), "keep\n")],
  ["clean Skills checkout at another commit", /preserving Skills checkout at/, (f) => {
    writeFileSync(join(f.source, "authored/SKILL.md"), "Committed local variant\n"); f.commit(f.source);
  }],
  ["registry linked to another checkout", /preserving existing agent home/, (f) => {
    mkdirSync(join(f.home, "other")); writeFileSync(join(f.home, "other/local.md"), "keep\n");
    rmSync(join(f.home, ".agents")); symlinkSync(join(f.home, "other"), join(f.home, ".agents"));
  }],
  ["independent agent home directory", /preserving existing agent home/, (f) => {
    rmSync(join(f.home, ".agents")); mkdirSync(join(f.home, ".agents")); writeFileSync(join(f.home, ".agents/local.md"), "keep\n");
  }],
  ["dangling agent home link", /preserving existing agent home/, (f) => {
    rmSync(join(f.home, ".agents")); symlinkSync(join(f.home, "missing"), join(f.home, ".agents"));
  }],
  ["external skill edited locally", /preserving differing skill/, (f) => writeFileSync(join(f.registry, "external/SKILL.md"), "Local external variant\n")],
  ["external executable mode changed", /preserving differing skill/, (f) => chmodSync(join(f.registry, "external/run.sh"), 0o644)],
  ["registry directory symlink", /registry must be a real directory/, (f) => {
    cpSync(f.registry, join(f.home, "other"), { recursive: true }); rmSync(f.registry, { recursive: true }); symlinkSync(join(f.home, "other"), f.registry);
  }],
  ["authored registry conflict", /preserving conflicting authored skill/, (f) => {
    mkdirSync(join(f.registry, "authored")); writeFileSync(join(f.registry, "authored/SKILL.md"), "Local variant\n");
  }],
  ["unrecorded runtime skill linked to a local variant", /preserving conflicting runtime skill/, (f) => {
    mkdirSync(join(f.registry, "local")); writeFileSync(join(f.registry, "local/SKILL.md"), "Registry variant\n");
    mkdirSync(join(f.home, "other")); writeFileSync(join(f.home, "other/SKILL.md"), "Runtime variant\n");
    mkdirSync(join(f.home, ".codex/skills"), { recursive: true });
    symlinkSync(join(f.home, "other"), join(f.home, ".codex/skills/local"));
  }],
  ["runtime skill conflict", /preserving conflicting runtime skill/, (f) => {
    mkdirSync(join(f.home, ".codex/skills/external"), { recursive: true });
    writeFileSync(join(f.home, ".codex/skills/external/SKILL.md"), "Runtime variant\n");
  }],
];
for (const [name, error, prepare] of cases) {
  test(`setup preserves ${name} before linking or reconciliation`, (t) => {
    const f = fixture(t); prepare(f); const before = snapshot(f);
    const result = f.run();
    assert.notEqual(result.status, 0, result.stdout);
    assert.deepEqual(snapshot(f), before, "setup changed existing files, links, index or HEAD");
    assert.match(result.stderr, error);
    assert.ok(result.stderr.includes(`${join(realpathSync(f.root), "README.md")}#when-setup-stops-on-local-skill-changes`), "failure must point to this checkout's reconciliation guide");
  });
}

test("external preflight allows missing skills without installing them", (t) => {
  const f = fixture(t);
  rmSync(f.registry, { recursive: true });
  const before = snapshot(f);
  const result = spawnSync(process.execPath, [join(f.root, "scripts/install-skills-from-lock.js"), "--preflight"], {
    cwd: f.root, env: f.env, encoding: "utf8",
  });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /1 missing skills may be restored/);
  assert.deepEqual(snapshot(f), before);
});

// Build a real upstream whose latest commit is newer than the requested pin.
function advanceFixture(f) {
  const base = f.git(f.source, "rev-parse", "HEAD");
  const upstream = join(f.home, "upstream");
  f.git(f.source, "clone", "--quiet", "--no-local", f.source, upstream);
  f.git(upstream, "config", "user.name", "Fixture");
  f.git(upstream, "config", "user.email", "fixture@example.invalid");
  writeFileSync(join(upstream, "authored/SKILL.md"), "Pinned authored version\n");
  mkdirSync(join(upstream, "incoming"));
  writeFileSync(join(upstream, "incoming/SKILL.md"), "New pinned skill\n");
  f.commit(upstream);
  const pin = f.git(upstream, "rev-parse", "HEAD");
  writeFileSync(join(upstream, "authored/SKILL.md"), "Newer upstream version\n");
  f.commit(upstream);
  writeFileSync(join(f.root, "mise.toml"), `[bootstrap.repos]\n"~/Repos/callumflack/skills" = { url = "${upstream}", ref = "${pin}" }\n`);
  f.commit(f.root);
  return { base, pin };
}

test("fast-forwards an older checkout to the exact pin, retaining its branch", (t) => {
  const f = fixture(t); const { base, pin } = advanceFixture(f);
  const branch = f.git(f.source, "symbolic-ref", "HEAD");
  const result = f.run();
  assert.equal(f.git(f.source, "rev-parse", "HEAD"), pin, result.stderr);
  assert.equal(f.git(f.source, "symbolic-ref", "HEAD"), branch);
  f.git(f.source, "merge-base", "--is-ancestor", base, "HEAD");
  assert.equal(readFileSync(join(f.source, "authored/SKILL.md"), "utf8"), "Pinned authored version\n");
  assert.equal(f.git(f.source, "status", "--porcelain"), "");
  // This fixture exercises the checkout boundary only; it has no Pstack artifact.
  // Full setup completion is verified separately with a complete replica.
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /could not inspect pstack plugin parent/);
});

for (const [name, prepare, args, error] of [
  ["divergent commits", (f) => {
    writeFileSync(join(f.source, "authored/SKILL.md"), "Local committed variant\n"); f.commit(f.source);
  }, [], /preserving Skills checkout at/],
  ["ignored incoming local file", (f) => {
    writeFileSync(join(f.source, ".git/info/exclude"), "incoming/\n");
    mkdirSync(join(f.source, "incoming"));
    writeFileSync(join(f.source, "incoming/SKILL.md"), "Ignored local variant\n");
  }, [], /would be overwritten by merge/],
  ["read-only check behind the pin", () => {}, ["--check"], /preserving Skills checkout at/],
  ["incoming authored registry conflict", (f) => {
    mkdirSync(join(f.registry, "incoming"));
    writeFileSync(join(f.registry, "incoming/SKILL.md"), "Local incoming variant\n");
  }, [], /preserving conflicting authored skill/],
  ["incoming runtime conflict", (f) => {
    mkdirSync(join(f.home, ".codex/skills/incoming"), { recursive: true });
    writeFileSync(join(f.home, ".codex/skills/incoming/SKILL.md"), "Local runtime variant\n");
  }, [], /preserving conflicting runtime skill/],
]) {
  test(`setup preserves ${name} when advancing the pin`, (t) => {
    const f = fixture(t); advanceFixture(f); prepare(f);
    const before = snapshot(f); const result = f.run(...args);
    assert.notEqual(result.status, 0);
    assert.deepEqual(snapshot(f), before);
    assert.match(result.stderr, error);
    assert.ok(result.stderr.includes(`${join(realpathSync(f.root), "README.md")}#when-setup-stops-on-local-skill-changes`), "failure must point to this checkout's reconciliation guide");
  });
}
