import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const checker = fileURLToPath(new URL("./check-home.sh", import.meta.url));

function fixture(t) {
  const directory = mkdtempSync(join(tmpdir(), "agents-runtime-check-"));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const root = join(directory, "repo");
  const payload = join(root, ".agents");
  const agentsHome = join(directory, "agents");
  const companion = join(payload, "references/project-work.md");
  mkdirSync(join(root, "scripts"), { recursive: true });
  mkdirSync(join(payload, "references"), { recursive: true });
  copyFileSync(checker, join(root, "scripts/check-home.sh"));
  symlinkSync(payload, agentsHome);

  const instructions = "Read `~/.agents/skills/owner/SKILL.md` and `~/.agents/references/project-work.md`.\n";
  writeFileSync(join(payload, "AGENTS.md"), instructions);
  writeFileSync(companion, "Before reviewing tests, read `~/.agents/skills/test-audit/SKILL.md`.\n");
  for (const skill of ["owner", "test-audit"]) {
    mkdirSync(join(payload, "skills", skill), { recursive: true });
    writeFileSync(join(payload, "skills", skill, "SKILL.md"), "Fixture skill\n");
  }

  const env = { ...process.env, AGENTS_HOME: agentsHome };
  for (const [key, name] of [
    ["CODEX_AGENTS_FILE", "codex.md"],
    ["CLAUDE_AGENTS_FILE", "claude.md"],
    ["PI_AGENTS_FILE", "pi.md"],
  ]) {
    env[key] = join(directory, name);
    symlinkSync(join(agentsHome, "AGENTS.md"), env[key]);
  }
  env.CURSOR_AGENTS_RULE = join(directory, "cursor.mdc");
  writeFileSync(env.CURSOR_AGENTS_RULE,
    "---\ndescription: Callum global agent instructions (from ~/.agents/AGENTS.md)\nalwaysApply: true\n---\n\n" + instructions);

  return {
    payload,
    companion,
    run: () => spawnSync("bash", [join(root, "scripts/check-home.sh")], {
      cwd: root,
      env,
      encoding: "utf8",
      timeout: 5000,
    }),
  };
}

test("accepts four matching adapters with the companion and both skill sources available", (t) => {
  const f = fixture(t);
  const result = f.run();
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Codex, Claude, Cursor, and Pi use the current global instructions/);
});

test("rejects a missing required instruction companion", (t) => {
  const f = fixture(t);
  rmSync(f.companion);
  const result = f.run();
  assert.equal(result.status, 1, result.stdout);
  assert.match(result.stderr, /missing required global reference: .*references\/project-work\.md/);
});

for (const [source, skill] of [["main instructions", "owner"], ["companion", "test-audit"]]) {
  test(`rejects a missing skill required by the ${source}`, (t) => {
    const f = fixture(t);
    rmSync(join(f.payload, "skills", skill, "SKILL.md"));
    const result = f.run();
    assert.equal(result.status, 1, result.stdout);
    assert.match(result.stderr, /required global skill is missing:/);
    assert.ok(result.stderr.includes(`skills/${skill}/SKILL.md`), result.stderr);
  });
}
