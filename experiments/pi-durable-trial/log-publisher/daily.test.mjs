import test from "node:test";
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  copyFileSync,
  existsSync,
  appendFileSync,
  rmSync,
  chmodSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname, resolve } from "node:path";
import { stopTree } from "../processes.mjs";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const site =
  process.env.LOG_PUBLISHER_SITE ??
  join(here, "../../../../worktrees/callum-website-log-publisher");
const source = resolve(site);
const runner = join(here, "run.mjs");
const snapshot = "src/app/log/_data/log.json";
function exec(cwd, command, args) {
  const value = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    timeout: 60000,
  });
  assert.equal(
    value.status,
    0,
    `${command} ${args.join(" ")}: ${value.stderr}\n${value.stdout}`,
  );
  return value.stdout.trim();
}
function fixture(t, options = {}) {
  const directory = mkdtempSync(join(tmpdir(), "log-daily-"));
  const children = [];
  t.after(async () => {
    const holding = join(directory, "site/.git/holding");
    if (existsSync(holding))
      writeFileSync(join(directory, "site/.git/released"), "cleanup");
    for (const child of children) {
      if (child.exitCode === null && child.signalCode === null) {
        try {
          await stopTree(child.pid);
        } catch (error) {
          if (error.code !== "ESRCH" && !/must still exist/.test(error.message))
            throw error;
        }
      }
    }
    rmSync(directory, { recursive: true, force: true });
  });
  const remote = join(directory, "remote.git");
  const workspace = join(directory, "site");
  const vault = join(directory, "vault");
  mkdirSync(workspace);
  mkdirSync(join(workspace, "scripts"));
  mkdirSync(join(workspace, "src/app/log/_data"), { recursive: true });
  for (const part of ["wiki", "raw", "_media"])
    mkdirSync(join(vault, part), { recursive: true });
  const log = join(vault, "wiki/LOGFILE.md");
  writeFileSync(
    log,
    "## 2026-10-19\n* An existing public entry. ^log-existing\n",
  );
  for (const file of [
    "publication-state.mjs",
    "publication-process.mjs",
    "publication-lock.py",
  ])
    copyFileSync(
      join(source, "scripts", file),
      join(workspace, "scripts", file),
    );
  writeFileSync(
    join(workspace, "scripts/publish-logfile.mjs"),
    `import ${JSON.stringify(join(source, "scripts/fixtures/publication-service.mjs"))};\n`,
  );
  exec(workspace, "git", ["init", "-b", "callum/log-publisher"]);
  exec(workspace, "git", ["config", "user.email", "fixture@example.invalid"]);
  exec(workspace, "git", ["config", "user.name", "Local publisher fixture"]);
  exec(workspace, "bun", [
    join(source, "scripts/import-logfile.mjs"),
    "--vault",
    vault,
  ]);
  exec(workspace, "git", ["add", "."]);
  exec(workspace, "git", ["commit", "-m", "fixture baseline"]);
  exec(directory, "git", ["init", "--bare", remote]);
  exec(workspace, "git", ["remote", "add", "origin", remote]);
  exec(workspace, "git", ["push", "origin", "HEAD:main"]);
  const common = join(workspace, ".git");
  const config = {
    vault,
    remote,
    importer: join(source, "scripts/import-logfile.mjs"),
    killPi: true,
    ...options,
  };
  writeFileSync(join(common, "fixture.json"), JSON.stringify(config));
  appendFileSync(log, "* One new authored entry.\n");
  const events = () =>
    existsSync(join(common, "events.jsonl"))
      ? readFileSync(join(common, "events.jsonl"), "utf8")
          .trim()
          .split("\n")
          .filter(Boolean)
          .map((line) => JSON.parse(line))
      : [];
  const command = (extra = []) => [
    runner,
    "--workspace",
    workspace,
    "--vault",
    vault,
    ...extra,
  ];
  const invoke = (extra = [], direct = false) =>
    new Promise((resolve, reject) => {
      const child = spawn(
        direct ? "bun" : process.execPath,
        direct
          ? [join(workspace, "scripts/publish-logfile.mjs"), "--vault", vault]
          : command(extra),
        { cwd: workspace, stdio: ["ignore", "pipe", "pipe"] },
      );
      children.push(child);
      let output = "";
      child.stdout.on("data", (bytes) => {
        output += bytes;
      });
      child.stderr.on("data", (bytes) => {
        output += bytes;
      });
      child.once("error", reject);
      child.once("close", (code, signal) => resolve({ code, signal, output }));
    });
  const job = () =>
    JSON.parse(readFileSync(join(common, "log-publication/active.json")));
  const pi = () =>
    JSON.parse(readFileSync(join(common, "log-publication/pi/active.json")));
  const git = (...args) => exec(workspace, "git", args);
  const verifySingle = () => {
    assert.equal(git("rev-list", "--count", "HEAD"), "2", "one content commit");
    assert.equal(
      git("ls-remote", "origin", "refs/heads/main").split(/\s+/)[0],
      git("rev-parse", "HEAD"),
    );
    assert.equal(git("status", "--porcelain"), "");
    const publicData = JSON.parse(
      git("--git-dir", remote, "show", `main:${snapshot}`),
    );
    assert.deepEqual(
      publicData.days[0].entries.map((entry) =>
        entry.content.map((part) => part.text).join(""),
      ),
      ["An existing public entry.", "One new authored entry."],
    );
    assert.equal(publicData.days[0].entries[0].id, "log-existing");
    assert.match(publicData.days[0].entries[1].id, /^log-/);
    assert.equal(
      new Set(publicData.days[0].entries.map((entry) => entry.id)).size,
      2,
    );
    assert.equal(
      events().filter((event) => event.name === "push").length,
      1,
      "one successful push; no second attempt after lost receipt",
    );
    assert.equal(job().phase, "done");
  };
  return {
    directory,
    workspace,
    common,
    log,
    config,
    invoke,
    events,
    job,
    pi,
    git,
    verifySingle,
  };
}

for (const boundary of [
  "import",
  "add",
  "commit",
  "push",
  "verify",
  "complete",
]) {
  test(
    `Pi recovers after ${boundary} without a second publication`,
    { timeout: 60000 },
    async (t) => {
      const f = fixture(t, { fault: boundary });
      const interrupted = await f.invoke();
      assert.notEqual(interrupted.code, 0, interrupted.output);
      assert.ok(existsSync(join(f.common, "interrupted")), interrupted.output);
      const id = f.pi().task;
      const deadline = f.pi().input.deadline;
      const recovered = await f.invoke();
      assert.equal(recovered.code, 0, recovered.output);
      assert.equal(f.pi().task, id, "same durable task");
      assert.equal(f.pi().input.deadline, deadline, "same original deadline");
      f.verifySingle();
      const unchanged = await f.invoke();
      assert.equal(unchanged.code, 0, unchanged.output);
      f.verifySingle();
      assert.equal(
        f.pi().outcome.result.published,
        false,
        "next daily run verifies unchanged publication",
      );
    },
  );
}

test(
  "overlapping Pi and direct publisher runs leave the active owner alone",
  { timeout: 60000 },
  async (t) => {
    const f = fixture(t, { holdVerification: true });
    const first = f.invoke();
    const until = Date.now() + 20000;
    while (!existsSync(join(f.common, "holding")) && Date.now() < until)
      await new Promise((resolve) => setTimeout(resolve, 25));
    assert.ok(existsSync(join(f.common, "holding")));
    const id = f.pi().task;
    const overlapPi = await f.invoke();
    const overlapDirect = await f.invoke([], true);
    assert.equal(overlapPi.code, 75, overlapPi.output);
    assert.equal(overlapDirect.code, 75, overlapDirect.output);
    assert.equal(f.pi().task, id);
    writeFileSync(join(f.common, "released"), "yes");
    const completed = await first;
    assert.equal(completed.code, 0, completed.output);
    f.verifySingle();
  },
);

test(
  "a surviving publisher retains the lock after its Pi parent dies",
  { timeout: 60000 },
  async (t) => {
    const f = fixture(t, { holdVerification: true });
    const first = f.invoke();
    const until = Date.now() + 20000;
    while (!existsSync(join(f.common, "holding")) && Date.now() < until)
      await new Promise((resolve) => setTimeout(resolve, 25));
    assert.ok(existsSync(join(f.common, "holding")));
    const publisher = Number(readFileSync(join(f.common, "holding")));
    const parent = Number(
      exec(f.workspace, "ps", ["-o", "ppid=", "-p", String(publisher)]),
    );
    process.kill(parent, "SIGKILL");
    const overlapping = await f.invoke();
    assert.equal(overlapping.code, 75, overlapping.output);
    writeFileSync(join(f.common, "released"), "yes");
    await first;
    // Wait until the orphan closes its inherited pipe/lock and exits.
    const recovered = await f.invoke();
    assert.equal(recovered.code, 0, recovered.output);
    f.verifySingle();
  },
);

test(
  "source edits while verifying become a separate once-only publication",
  { timeout: 60000 },
  async (t) => {
    const f = fixture(t, { editDuringVerification: true });
    const result = await f.invoke();
    assert.equal(result.code, 0, result.output);
    assert.equal(f.git("rev-list", "--count", "HEAD"), "3");
    assert.equal(f.events().filter((event) => event.name === "push").length, 2);
    const data = JSON.parse(
      f.git("--git-dir", f.config.remote, "show", `main:${snapshot}`),
    );
    assert.deepEqual(
      data.days[0].entries.map((entry) =>
        entry.content.map((part) => part.text).join(""),
      ),
      [
        "An existing public entry.",
        "One new authored entry.",
        "A later authored entry.",
      ],
    );
    assert.equal(
      new Set(data.days[0].entries.map((entry) => entry.id)).size,
      3,
    );
    const unchanged = await f.invoke();
    assert.equal(unchanged.code, 0, unchanged.output);
    assert.equal(f.git("rev-list", "--count", "HEAD"), "3");
  },
);

test(
  "expired budget stops active work and requires explicit retry",
  { timeout: 60000 },
  async (t) => {
    const f = fixture(t, { holdVerification: true });
    const expired = await f.invoke(["--budget-ms", "4000"]);
    assert.notEqual(expired.code, 0, expired.output);
    assert.equal(f.pi().outcome.error.kind, "timeout");
    const id = f.pi().directory;
    const eventCount = f.events().length;
    const stopped = await f.invoke();
    assert.notEqual(stopped.code, 0, stopped.output);
    assert.equal(f.pi().directory, id);
    assert.equal(
      f.events().length,
      eventCount,
      "failed task is not silently restarted",
    );
    writeFileSync(join(f.common, "released"), "yes");
    const retried = await f.invoke(["--retry"]);
    assert.equal(retried.code, 0, retried.output);
    assert.notEqual(f.pi().directory, id);
    f.verifySingle();
  },
);

test(
  "unrelated staged work survives and blocks recovery",
  { timeout: 60000 },
  async (t) => {
    const f = fixture(t, { fault: "add" });
    await f.invoke();
    writeFileSync(join(f.workspace, "personal.txt"), "Do not publish me.\n");
    f.git("add", "personal.txt");
    const before = f.git("diff", "--cached");
    const stopped = await f.invoke();
    assert.notEqual(stopped.code, 0, stopped.output);
    assert.equal(f.git("diff", "--cached"), before);
    assert.equal(f.git("rev-list", "--count", "HEAD"), "1");
    assert.equal(f.events().filter((event) => event.name === "push").length, 0);
  },
);

test(
  "remote advancement blocks a recovered commit without overwriting main",
  { timeout: 60000 },
  async (t) => {
    const f = fixture(t, { fault: "commit" });
    await f.invoke();
    const other = join(f.directory, "other");
    exec(f.directory, "git", ["clone", "-b", "main", f.config.remote, other]);
    exec(other, "git", ["config", "user.email", "other@example.invalid"]);
    exec(other, "git", ["config", "user.name", "Other writer"]);
    writeFileSync(join(other, "other.txt"), "Concurrent main work.\n");
    exec(other, "git", ["add", "."]);
    exec(other, "git", ["commit", "-m", "other writer"]);
    exec(other, "git", ["push", "origin", "main"]);
    const remote = exec(other, "git", ["rev-parse", "HEAD"]);
    const stopped = await f.invoke();
    assert.notEqual(stopped.code, 0, stopped.output);
    assert.equal(
      f.git("ls-remote", "origin", "refs/heads/main").split(/\s+/)[0],
      remote,
    );
    assert.equal(f.events().filter((event) => event.name === "push").length, 0);
    assert.equal(
      f.git("rev-list", "--count", "HEAD"),
      "2",
      "owned local commit retained",
    );
  },
);

test(
  "a real transient Git push rejection retries within one task",
  { timeout: 60000 },
  async (t) => {
    const f = fixture(t);
    const hook = join(f.config.remote, "hooks/pre-receive");
    writeFileSync(
      hook,
      '#!/bin/sh\nrm -- "$0"\necho "temporary local transport rejection" >&2\nexit 1\n',
    );
    chmodSync(hook, 0o700);
    const result = await f.invoke();
    assert.equal(result.code, 0, result.output);
    assert.equal(f.pi().outcome.result.attempts, 2);
    f.verifySingle();
    const before = readFileSync(
      join(f.common, "log-publication/pi/active.json"),
      "utf8",
    );
    const events = f.events().length;
    const status = await f.invoke(["--status"]);
    assert.equal(status.code, 0, status.output);
    assert.equal(
      readFileSync(join(f.common, "log-publication/pi/active.json"), "utf8"),
      before,
    );
    assert.equal(f.events().length, events, "status runs no publisher");
  },
);

test(
  "three interrupted worker openings stop until explicit retry",
  { timeout: 60000 },
  async (t) => {
    const f = fixture(t, { fault: "import", repeatFault: true });
    for (let count = 0; count < 3; count++) {
      const interrupted = await f.invoke();
      assert.notEqual(interrupted.code, 0, interrupted.output);
    }
    const events = f.events().length;
    const blocked = await f.invoke();
    assert.notEqual(blocked.code, 0, blocked.output);
    assert.match(blocked.output, /Three worker openings/);
    assert.equal(f.events().length, events);
    assert.equal(f.pi().opens, 3);
    f.config.fault = null;
    writeFileSync(join(f.common, "fixture.json"), JSON.stringify(f.config));
    const retried = await f.invoke(["--retry"]);
    assert.equal(retried.code, 0, retried.output);
    f.verifySingle();
  },
);

test(
  "different staged bytes in an owned path are preserved",
  { timeout: 60000 },
  async (t) => {
    const f = fixture(t, { fault: "add" });
    await f.invoke();
    const changed = join(f.directory, "alternate.json");
    writeFileSync(changed, '{"foreign":"staged content"}\n');
    const blob = f.git("hash-object", "-w", changed);
    f.git("update-index", "--cacheinfo", `100644,${blob},${snapshot}`);
    const before = f.git("diff", "--cached");
    const stopped = await f.invoke();
    assert.notEqual(stopped.code, 0, stopped.output);
    assert.equal(
      f.git("diff", "--cached"),
      before,
      "preserve the actual staged bytes, not merely its path",
    );
    assert.equal(f.events().filter((event) => event.name === "push").length, 0);
  },
);
