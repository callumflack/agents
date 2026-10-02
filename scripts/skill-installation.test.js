import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  chmodSync,
  copyFileSync,
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  readlinkSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const scripts = dirname(fileURLToPath(import.meta.url));

function fixture(t) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "skill-installation-")));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const home = join(root, "home");
  const repo = join(root, "agents");
  const registry = join(repo, ".agents", "skills");
  const target = join(home, ".codex", "skills");
  for (const path of [home, registry, target, join(repo, "scripts")]) {
    mkdirSync(path, { recursive: true });
  }
  copyFileSync(join(scripts, "sync-skills.js"), join(repo, "scripts", "sync-skills.js"));
  symlinkSync(join(repo, ".agents"), join(home, ".agents"));
  return { home, repo, registry, target };
}

function run(f, script, args = [], env = {}) {
  return spawnSync(process.execPath, [join(f.repo, "scripts", script), ...args], {
    cwd: f.repo,
    env: { ...process.env, HOME: f.home, ...env },
    encoding: "utf8",
  });
}

test("sync exits nonzero and preserves a conflicting runtime directory", (t) => {
  const f = fixture(t);
  mkdirSync(join(f.registry, "alpha"));
  const conflict = join(f.target, "alpha");
  mkdirSync(conflict);
  writeFileSync(join(conflict, "SKILL.md"), "existing runtime content\n");

  const result = run(f, "sync-skills.js", [`--target=${f.target}`]);

  assert.equal(result.status, 1, result.stdout + result.stderr);
  assert.ok(lstatSync(conflict).isDirectory());
  assert.equal(readFileSync(join(conflict, "SKILL.md"), "utf8"), "existing runtime content\n");
});

function installerFixture(t) {
  const f = fixture(t);
  copyFileSync(
    join(scripts, "install-skills-from-lock.js"),
    join(f.repo, "scripts", "install-skills-from-lock.js"),
  );
  f.lock = join(f.repo, ".agents", ".skill-lock.json");
  writeFileSync(f.lock, JSON.stringify({ skills: { alpha: { source: "owner/skills" } } }));
  f.bin = join(f.home, "bin");
  mkdirSync(f.bin);
  const npx = join(f.bin, "npx");
  writeFileSync(npx, '#!/bin/sh\nprintf "install\\n" >> "$HOME/events"\nexit "${NPX_EXIT_CODE:-0}"\n');
  chmodSync(npx, 0o755);
  f.checker = join(f.home, "Repos", "callumflack", "skills", "scripts", "check-links.sh");
  mkdirSync(dirname(f.checker), { recursive: true });
  writeFileSync(
    f.checker,
    '#!/bin/sh\n[ "$#" -eq 0 ] || exit 9\nprintf "check\\n" >> "$HOME/events"\nexit "${CHECK_EXIT_CODE:-0}"\n',
  );
  return f;
}

function install(f, args = ["--apply"], env = {}) {
  return run(f, "install-skills-from-lock.js", args, {
    PATH: `${f.bin}:${process.env.PATH}`,
    SKILLS_LOCK: f.lock,
    ...env,
  });
}

test("applied installs fail when the global topology checker fails", (t) => {
  const f = installerFixture(t);
  const result = install(f, ["--apply"], { CHECK_EXIT_CODE: "7" });

  assert.equal(result.status, 1, result.stdout + result.stderr);
  assert.equal(readFileSync(join(f.home, "events"), "utf8"), "install\ncheck\n");
});

test("clean sync creates canonical links and succeeds on repeated runs", (t) => {
  const f = fixture(t);
  mkdirSync(join(f.registry, "alpha"));

  for (let i = 0; i < 2; i += 1) {
    const result = run(f, "sync-skills.js", [`--target=${f.target}`]);
    assert.equal(result.status, 0, result.stdout + result.stderr);
    assert.equal(readlinkSync(join(f.target, "alpha")), join(f.home, ".agents", "skills", "alpha"));
  }
});

test("prune fails on conflicts while preserving files, foreign links, and unrelated directories", (t) => {
  const f = fixture(t);
  for (const name of ["alpha", "beta", "gamma"]) {
    mkdirSync(join(f.registry, name));
  }
  writeFileSync(join(f.target, "alpha"), "existing file\n");
  const foreign = join(f.home, "foreign");
  mkdirSync(foreign);
  writeFileSync(join(foreign, "SKILL.md"), "foreign skill\n");
  symlinkSync(foreign, join(f.target, "beta"));
  mkdirSync(join(f.target, "unrelated"));
  writeFileSync(join(f.target, "unrelated", "keep"), "unrelated content\n");
  const stale = join(f.target, "retired");
  symlinkSync(join(f.home, ".agents", "skills", "retired"), stale);

  const result = run(f, "sync-skills.js", [`--target=${f.target}`, "--prune"]);

  assert.equal(result.status, 1, result.stdout + result.stderr);
  assert.equal(readFileSync(join(f.target, "alpha"), "utf8"), "existing file\n");
  assert.equal(readlinkSync(join(f.target, "beta")), foreign);
  assert.equal(readFileSync(join(foreign, "SKILL.md"), "utf8"), "foreign skill\n");
  assert.equal(readFileSync(join(f.target, "unrelated", "keep"), "utf8"), "unrelated content\n");
  assert.equal(readlinkSync(join(f.target, "gamma")), join(f.home, ".agents", "skills", "gamma"));
  assert.equal(lstatSync(stale, { throwIfNoEntry: false }), undefined);
});

test("clean applied installs check topology after all install commands", (t) => {
  const f = installerFixture(t);
  writeFileSync(f.lock, JSON.stringify({
    skills: { alpha: { source: "owner/skills" }, beta: { source: "owner/skills" } },
  }));

  const result = install(f);

  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.equal(readFileSync(join(f.home, "events"), "utf8"), "install\ninstall\ncheck\n");
});

test("a passing topology check does not mask an install failure", (t) => {
  const f = installerFixture(t);
  const result = install(f, ["--apply"], { NPX_EXIT_CODE: "17" });

  assert.equal(result.status, 1, result.stdout + result.stderr);
  assert.equal(readFileSync(join(f.home, "events"), "utf8"), "install\ncheck\n");
});

test("printing commands runs neither installs nor topology checks", (t) => {
  const f = installerFixture(t);
  const result = install(f, [], { CHECK_EXIT_CODE: "7", NPX_EXIT_CODE: "17" });

  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.equal(existsSync(join(f.home, "events")), false);
});

test("a custom empty manifest still requires the unscoped global topology check", (t) => {
  const f = installerFixture(t);
  const customLock = join(f.home, "custom-lock.json");
  writeFileSync(customLock, JSON.stringify({ skills: {} }));
  const result = install(f, ["--apply"], {
    SKILLS_LOCK: customLock,
    CHECK_EXIT_CODE: "7",
  });

  assert.equal(result.status, 1, result.stdout + result.stderr);
  assert.equal(readFileSync(join(f.home, "events"), "utf8"), "check\n");
});

test("applied installs fail if the topology checker is unavailable", (t) => {
  const f = installerFixture(t);
  rmSync(f.checker);
  const result = install(f);

  assert.equal(result.status, 1, result.stdout + result.stderr);
  assert.equal(readFileSync(join(f.home, "events"), "utf8"), "install\n");
});
