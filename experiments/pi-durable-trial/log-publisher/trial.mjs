import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawn, spawnSync } from 'node:child_process';
import { appendFileSync, copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { stopTree, processTable } from '../processes.mjs';

const owner = dirname(fileURLToPath(import.meta.url));
const run = join(owner, '..', 'runs', 'logfile-' + new Date().toISOString().replaceAll(':', '-'));
mkdirSync(join(run, 'bin'), { recursive: true });
const json = (name, value) => writeFileSync(join(run, name), JSON.stringify(value, null, 2) + '\n');
const hash = path => createHash('sha256').update(readFileSync(path)).digest('hex');
const workspace = '/Users/callumflack/Repos/callumflack/worktrees/callum-website-log-publisher';
const vault = '/Users/callumflack/Repos/callumflack/kb-2026/kb-2026';
const heartbeat = '/Users/callumflack/.codex/automations/publish-logfile-to-callum-s-site/automation.toml';
const source = join(vault, 'wiki/LOGFILE.md');
const gitPath = '/opt/homebrew/bin/git';
const git = (...args) => {
  const result = spawnSync(gitPath, args, { cwd: workspace, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim();
};
assert.equal(git('status', '--porcelain'), '', 'Publisher checkout has another writer or retained changes');
assert.equal(git('branch', '--show-current'), 'callum/log-publisher');
const baseline = git('ls-remote', 'origin', 'refs/heads/main').split(/\s+/)[0];
assert.equal(git('rev-parse', 'HEAD'), baseline, 'Publisher must start at current main');
const input = { workspace, vault, source, snapshot: 'src/app/log/_data/log.json', heartbeat, git: gitPath,
  bun: '/opt/homebrew/bin/bun', admitted: Date.now(), deadline: Date.now() + 20 * 60 * 1000,
  baseline, heartbeat_sha256: hash(heartbeat), publisher_sha256: hash(join(workspace, 'scripts/publish-logfile.mjs')) };
json('input.json', input);
copyFileSync(source, join(run, 'LOGFILE-before.md'));
copyFileSync(join(workspace, input.snapshot), join(run, 'snapshot-before.json'));
copyFileSync(join(workspace, 'scripts/publish-logfile.mjs'), join(run, 'publisher-source.mjs'));
copyFileSync(join(owner, 'worker.mjs'), join(run, 'worker-source.mjs'));
writeFileSync(join(run, 'bin/git'), `#!${process.execPath}\nimport ${JSON.stringify(join(owner, 'git-shim.mjs'))};\n`, { mode: 0o755 });
console.log('RUN=' + run);
const launch = generation => {
  const child = spawn(process.execPath, [join(owner, 'worker.mjs'), run, String(generation)], { detached: true, stdio: ['ignore', 'pipe', 'pipe'] });
  for (const stream of [child.stdout, child.stderr]) stream.on('data', bytes => appendFileSync(join(run, `worker-${generation}.log`), bytes));
  const done = new Promise(resolve => child.once('close', (code, signal) => resolve({ code, signal })));
  return { child, done };
};
let current;
let expired = false;
const timer = setTimeout(async () => {
  expired = true;
  if (current?.child.exitCode === null && current?.child.signalCode === null) json('deadline-cleanup.json', await stopTree(current.child.pid));
}, input.deadline - Date.now());
try {
  current = launch(1);
  let reviewNotified = false;
  while (!existsSync(join(run, 'push-receipt.json'))) {
    assert.equal(expired, false, 'Original deadline expired');
    assert.equal(current.child.exitCode, null, 'Worker exited before real push; inspect logs');
    assert.equal(current.child.signalCode, null);
    if (!reviewNotified && existsSync(join(run, 'review-ready.json'))) { console.log('STAGED_REVIEW=' + run); reviewNotified = true; }
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  const receipt = JSON.parse(readFileSync(join(run, 'push-receipt.json')));
  assert.notEqual(receipt.commit, baseline, 'Trial requires a new real publication');
  assert.equal(git('ls-remote', 'origin', 'refs/heads/main').split(/\s+/)[0], receipt.commit);
  assert.equal(existsSync(join(run, 'settled-1.json')), false);
  json('crash-cleanup.json', await stopTree(current.child.pid, [receipt.shim_pid]));
  await current.done;
  console.log('INTERRUPTED_AFTER_PUSH=' + receipt.commit);
  current = launch(2);
  const resumed = await current.done;
  json('resumed-exit.json', resumed);
  assert.equal(resumed.code, 0, 'Recovery did not verify the published candidate');
  current = launch(3);
  assert.equal((await current.done).code, 0, 'Terminal reopen failed');
  const before = readFileSync(join(run, 'LOGFILE-before.md'), 'utf8');
  const after = readFileSync(source, 'utf8');
  const stripIds = value => value.replace(/ \^log-[a-z0-9]+/g, '');
  assert.equal(stripIds(after), stripIds(before), 'Importer changed source prose');
  const events = readFileSync(join(run, 'git-events.jsonl'), 'utf8').trim().split('\n').map(JSON.parse);
  assert.equal(events.filter(event => event.kind === 'push-succeeded').length, 1);
  assert.equal(events.filter(event => event.kind === 'commit').length, 1);
  const timeline = readFileSync(join(run, 'timeline.jsonl'), 'utf8').trim().split('\n').map(JSON.parse);
  assert.equal(timeline.filter(event => event.kind === 'publisher-start').length, 2);
  assert.equal(JSON.parse(readFileSync(join(run, 'recovered-2.json'))).state.checkpoint.phase, 'publish');
  const settled = JSON.parse(readFileSync(join(run, 'settled-2.json')));
  assert.equal(settled.state.outcome.result.commit, receipt.commit);
  assert.deepEqual(JSON.parse(readFileSync(join(run, 'settled-3.json'))), settled);
  assert.equal(hash(heartbeat), input.heartbeat_sha256, 'Heartbeat changed');
  assert.equal(hash(join(workspace, 'scripts/publish-logfile.mjs')), input.publisher_sha256);
  assert.equal(git('status', '--porcelain'), '');
  assert.equal(git('ls-remote', 'origin', 'refs/heads/main').split(/\s+/)[0], receipt.commit);
  assert.equal(git('rev-list', '--count', baseline + '..' + receipt.commit), '1', 'Remote must contain exactly one new commit');
  assert.equal(git('diff', '--name-only', baseline, receipt.commit), input.snapshot, 'Only the designated public snapshot changed');
  writeFileSync(join(run, 'published.patch'), git('show', '--format=fuller', receipt.commit) + '\n');
  copyFileSync(source, join(run, 'LOGFILE-after.md'));
  copyFileSync(join(workspace, input.snapshot), join(run, 'snapshot-after.json'));
  const known = JSON.parse(readFileSync(join(run, 'crash-cleanup.json'))).before;
  const remaining = processTable().filter(row => known.some(saved => row.pid === saved.pid));
  assert.equal(remaining.length, 0, 'Interrupted processes remain');
  const oldIds = [...before.matchAll(/\^log-[a-z0-9]+/g)].map(match => match[0]);
  for (const id of oldIds) assert.equal(after.split(id).length, before.split(id).length, 'Existing ID changed');
  const newIds = [...after.matchAll(/\^log-[a-z0-9]+/g)].map(match => match[0]).filter(id => !oldIds.includes(id));
  const authoredRoots = before.split('\n').filter(line => /^[*-] /.test(line)).length;
  const priorRoots = JSON.parse(readFileSync(join(run, 'snapshot-before.json'))).days.reduce((count, day) => count + day.entries.length, 0);
  assert.equal(newIds.length, authoredRoots - priorRoots, 'All newly authored LOGFILE nodes must receive one ID');
  assert.ok(newIds.length > 0);
  const proof = { passed: true, commit: receipt.commit, baseline, new_ids: newIds.map(id => id.slice(1)), pushes: 1, commits: 1,
    publisher_launches: 2, same_task_id: JSON.parse(readFileSync(join(run, 'job.json'))).id,
    heartbeat_unchanged: true, publisher_unchanged: true, source_prose_preserved: true, terminal_reopen_unchanged: true,
    interrupted_processes_absent: true, url: 'https://www.callum.website/log#' + newIds[0].slice(1) };
  json('proof.json', proof);
  console.log(JSON.stringify(proof));
} finally {
  clearTimeout(timer);
  if (current?.child.exitCode === null && current?.child.signalCode === null) json('final-cleanup.json', await stopTree(current.child.pid));
}
