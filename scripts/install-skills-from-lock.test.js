import { createHash } from "node:crypto";
import assert from "node:assert/strict";
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";

const installer = join(dirname(fileURLToPath(import.meta.url)), "install-skills-from-lock.js");
function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), "agents-restore-test-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const repository = join(root, "upstream");
  const state = join(root, "state");
  mkdirSync(repository); mkdirSync(state);
  function git(...args) {
    const result = spawnSync("git", args, { cwd: repository, encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr);
    return result.stdout.trim();
  }
  git("init", "--quiet"); git("config", "user.name", "Fixture"); git("config", "user.email", "fixture@example.invalid");
  mkdirSync(join(repository, "one", "scripts"), { recursive: true });
  writeFileSync(join(repository, "one", "SKILL.md"), "---\nname: one\ndescription: fixture\n---\nRecorded version\n");
  writeFileSync(join(repository, "one", "scripts", "run.sh"), "#!/bin/sh\nprintf 'recorded\\n'\n");
  chmodSync(join(repository, "one", "scripts", "run.sh"), 0o755);
  git("add", "."); git("commit", "--quiet", "-m", "recorded");
  const tree = git("rev-parse", "HEAD:one");
  const lockPath = join(state, ".skill-lock.json");
  const lock = { version: 3, skills: { one: { source: "example/skills", sourceType: "github", skillPath: "one/SKILL.md", skillFolderHash: tree } } };
  const save = () => writeFileSync(lockPath, JSON.stringify(lock));
  save();
  const env = { ...process.env, HOME: root, SKILLS_LOCK: lockPath,
    GIT_CONFIG_COUNT: "1", GIT_CONFIG_KEY_0: `url.file://${repository}.insteadOf`, GIT_CONFIG_VALUE_0: "https://github.com/example/skills.git" };
  const run = (mode) => spawnSync(process.execPath, [installer, mode], { env, encoding: "utf8" });
  return { root, repository, state, lockPath, lock, save, git, run, env };
}

test("restores the recorded files and modes after upstream advances; repeat preserves content and lock", (t) => {
  const f = fixture(t); const originalLock = readFileSync(f.lockPath);
  writeFileSync(join(f.repository, "one", "SKILL.md"), "new upstream content\n");
  f.git("add", "."); f.git("commit", "--quiet", "-m", "upstream advanced");
  const first = f.run("--apply"); assert.equal(first.status, 0, first.stderr);
  const installed = join(f.state, "skills", "one", "SKILL.md");
  assert.match(readFileSync(installed, "utf8"), /Recorded version/);
  assert.equal(f.run("--check").status, 0);
  const second = f.run("--apply"); assert.equal(second.status, 0, second.stderr);
  assert.match(second.stdout, /restored 0 recorded skills/);
  assert.deepEqual(readFileSync(f.lockPath), originalLock);
  chmodSync(join(f.state, "skills", "one", "scripts", "run.sh"), 0o644);
  assert.notEqual(f.run("--check").status, 0, "executable-mode drift must be detected");
});

test("source verification writes no registry; missing recorded objects prevent partial installation", (t) => {
  const f = fixture(t);
  const verified = f.run("--verify-sources"); assert.equal(verified.status, 0, verified.stderr);
  assert.equal(existsSync(join(f.state, "skills")), false);
  f.env.GIT_CONFIG_COUNT = "2";
  f.env.GIT_CONFIG_KEY_1 = `url.file://${f.repository}.insteadOf`;
  f.env.GIT_CONFIG_VALUE_1 = "https://github.com/example/other.git";
  f.lock.skills.two = { ...f.lock.skills.one, source: "example/other", skillFolderHash: "0".repeat(40) }; f.save();
  assert.notEqual(f.run("--apply").status, 0);
  assert.equal(existsSync(join(f.state, "skills")), false);
});

test("missing content fails verification; restoration preserves changed files and unrelated entries", (t) => {
  const f = fixture(t);
  assert.notEqual(f.run("--check").status, 0);
  assert.equal(f.run("--apply").status, 0);
  const installed = join(f.state, "skills", "one", "SKILL.md");
  writeFileSync(installed, "local edits\n");
  writeFileSync(join(f.state, "skills", "unrelated.txt"), "keep\n");
  const result = f.run("--apply"); assert.notEqual(result.status, 0); assert.match(result.stderr, /preserving differing skill/);
  assert.equal(readFileSync(installed, "utf8"), "local edits\n");
  assert.equal(readFileSync(join(f.state, "skills", "unrelated.txt"), "utf8"), "keep\n");
});

test("refuses symlink destinations and symlinks inside recorded trees", (t) => {
  const f = fixture(t);
  mkdirSync(join(f.state, "skills"));
  symlinkSync(join(f.repository, "one"), join(f.state, "skills", "one"));
  assert.notEqual(f.run("--apply").status, 0);
  rmSync(join(f.state, "skills", "one"));
  symlinkSync("/outside", join(f.repository, "one", "escape"));
  f.git("add", "."); f.git("commit", "--quiet", "-m", "symlink");
  f.lock.skills.one.skillFolderHash = f.git("rev-parse", "HEAD:one"); f.save();
  const result = f.run("--apply"); assert.notEqual(result.status, 0); assert.match(result.stderr, /unsupported Git tree entry/);
  assert.equal(existsSync(join(f.state, "skills", "one")), false);
});

function adaptFixture(f) {
  const baseTree = f.lock.skills.one.skillFolderHash;
  writeFileSync(join(f.repository, "one", "SKILL.md"), "---\nname: one\ndescription: fixture\n---\nAccepted local behavior\n");
  const patch = f.git("diff", "--relative=one", "--", "one") + "\n";
  f.git("add", "."); f.git("commit", "--quiet", "-m", "accepted adaptation");
  const tree = f.git("rev-parse", "HEAD:one");
  mkdirSync(join(f.state, "skill-patches"));
  writeFileSync(join(f.state, "skill-patches", "one.patch"), patch);
  f.lock.skills.one.adaptation = { baseTree, tree, patchSha256: createHash("sha256").update(patch).digest("hex") };
  f.save();
}

test("reproduces accepted local behavior from upstream plus a patch; repeated setup and content check agree", (t) => {
  const f = fixture(t); adaptFixture(f);
  const verified = f.run("--verify-sources"); assert.equal(verified.status, 0, verified.stderr);
  assert.equal(existsSync(join(f.state, "skills")), false);
  const first = f.run("--apply"); assert.equal(first.status, 0, first.stderr);
  assert.match(readFileSync(join(f.state, "skills", "one", "SKILL.md"), "utf8"), /Accepted local behavior/);
  assert.equal(f.run("--check").status, 0);
  assert.equal(f.run("--apply").status, 0);
  writeFileSync(join(f.state, "skills", "one", "SKILL.md"), "unexpected reinstall\n");
  assert.notEqual(f.run("--check").status, 0);
  assert.notEqual(f.run("--apply").status, 0);
  assert.equal(readFileSync(join(f.state, "skills", "one", "SKILL.md"), "utf8"), "unexpected reinstall\n");
});

test("rejects stale, changed, removed or incorrect adaptation records before publishing", (t) => {
  const f = fixture(t); adaptFixture(f);
  const adaptation = { ...f.lock.skills.one.adaptation };
  f.lock.skills.one.skillFolderHash = adaptation.tree; f.save();
  assert.match(f.run("--apply").stderr, /adaptation must be reviewed/);
  f.lock.skills.one.skillFolderHash = adaptation.baseTree;
  delete f.lock.skills.one.adaptation; f.save();
  assert.match(f.run("--apply").stderr, /adaptation record missing/);
  f.lock.skills.one.adaptation = { ...adaptation, patchSha256: "0".repeat(64) }; f.save();
  assert.match(f.run("--apply").stderr, /patch changed without review/);
  f.lock.skills.one.adaptation = { ...adaptation, tree: "0".repeat(40) }; f.save();
  assert.match(f.run("--apply").stderr, /adapted tree differs/);
  assert.equal(existsSync(join(f.state, "skills")), false);
});
