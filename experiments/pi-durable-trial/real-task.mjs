import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync, appendFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { hash, git, snapshot } from './real-task-support.mjs';
import { processTable, stopTree } from './processes.mjs';

const owner = dirname(fileURLToPath(import.meta.url));
const workspace = '/Users/callumflack/Repos/callumflack/homebase';
const run = join(owner, 'runs', new Date().toISOString().replaceAll(':', '-'));
const python = '/opt/homebrew/opt/python@3.14/bin/python3.14';
const save = (name, value) => writeFileSync(join(run, name), JSON.stringify(value, null, 2) + '\n');
const event = (kind, data = {}) => appendFileSync(join(run, 'timeline.jsonl'), JSON.stringify({ at: new Date().toISOString(), kind, pid: process.pid, ...data }) + '\n');
const allowed = ['scripts/_homebase.py', 'scripts/tests/test_config_errors.py', 'LOG.md'];
assert.equal(existsSync(join(workspace, allowed[1])), false, 'Use a new regression file, preserve inherited tests');
assert.equal(git(workspace, ['diff', '--', 'scripts/_homebase.py']), '', 'Do not take ownership of a dirty implementation file');
mkdirSync(join(run, 'source'), { recursive: true });
for (const name of ['real-task.mjs', 'real-task-support.mjs', 'worker.mjs', 'processes.mjs', 'verify-real.py', 'package.json', 'package-lock.json']) copyFileSync(join(owner, name), join(run, 'source', name));
const baseline = snapshot(workspace);
save('workspace-before.json', baseline);
for (const [name, detail] of Object.entries(baseline)) if (detail.kind === 'file') {
  const target = join(run, 'before', name); mkdirSync(dirname(target), { recursive: true }); copyFileSync(join(workspace, name), target);
}
writeFileSync(join(run, 'index-before.txt'), git(workspace, ['ls-files', '--stage', '-z']));
writeFileSync(join(run, 'git-status-before.txt'), git(workspace, ['status', '--short']));
const log = readFileSync(join(workspace, 'LOG.md'), 'utf8');
const oldHistory = log.slice(log.indexOf('\n## [2026-10-15]'));
assert.ok(oldHistory.length > 100 && oldHistory.includes('Combine Playbooks and Learning'));
writeFileSync(join(run, 'homebase-log-history.txt'), oldHistory);
const verifier = join(owner, 'verify-real.py');
const baselineCheck = spawnSync(python, ['-B', verifier, workspace], { encoding: 'utf8' });
save('baseline-acceptance.json', JSON.parse(baselineCheck.stdout));
assert.equal(baselineCheck.status, 1, 'Existing source must reproduce the real bug without modification');
assert.deepEqual(JSON.parse(baselineCheck.stdout).cases.filter(row => !row.passed).map(row => [row.command, row.config_kind]), [['check', 'directory'], ['setup', 'directory']]);
const admitted = Date.now();
save('input.json', { mode: 'real-task', workspace, source_head: git(workspace, ['rev-parse', 'HEAD']).trim(),
  node: process.version, pi_durable: '1.3.0', admitted_at_ms: admitted, deadline_at_ms: admitted + 600000,
  budget_seconds: 600, max_attempts: 2, allowed_paths: allowed, verifier, oracle_sha256: hash(verifier),
  fault_injection: null, seeded_source: false, scripted_bad_candidate: false,
  prompt: `Complete this real local Homebase task in ${workspace}. The current unmodified command python3 -B scripts/check --config /private/tmp crashes with an IsADirectoryError traceback because the config argument names a directory. Make config read failures report a clear configuration error with the offending path and exit 2 for scripts/check and scripts/setup. Preserve existing missing-file and malformed-TOML messages and valid-config behavior. Diagnose the source yourself and make the smallest fix. Add meaningful regression coverage in NEW scripts/tests/test_config_errors.py using real files/directories and real CLI behavior, not mocked read exceptions. Only write scripts/_homebase.py, that new test file, and the current 'Local unattended config-read repair' LOG entry; resolve that entry before finishing and preserve all prior log history exactly. Read AGENTS.md, Homebase Learning/README.md and the global test-audit skill before changing tests. Learning retrieval is read-only in this nested job. Preserve the dirty README conflict and every other inherited change. No staging, commits, resets, publication, network actions, provider/service/schedule changes, live setup/clone/bootstrap or writing through navigation links. Fixture-only CLI tests are permitted. Run python3 -B -m unittest discover -s scripts/tests -v and python3 -B scripts/health --portable, fix any regressions within the scope, and finish with the actual result. No user questions or approval pauses; the bounded reversible local repair is authorized. No fault injection, deliberately incorrect patch or artificial stall is requested. The external controller owns independent acceptance and may return genuine failure feedback for one corrective attempt.` });
event('real-task-admitted', { workspace, deadline_at_ms: admitted + 600000 });
console.log(`Evidence: ${run}`);
const child = spawn(process.execPath, [join(owner, 'worker.mjs'), run, '1'], { stdio: ['ignore', 'pipe', 'pipe'] });
let result;
child.once('close', (code, signal) => { result = { code, signal }; });
child.stdout.on('data', bytes => appendFileSync(join(run, 'runner-1.stdout.log'), bytes));
child.stderr.on('data', bytes => appendFileSync(join(run, 'runner-1.stderr.log'), bytes));
event('supervisor-started-runner', { child: child.pid });
let timedOut = false;
while (!result) {
  if (Date.now() > admitted + 600000 && !timedOut) {
    save('timeout-cleanup.json', await stopTree(child.pid));
    timedOut = true;
  }
  await new Promise(resolve => setTimeout(resolve, 50));
}
save('worker-exit.json', result);
if (timedOut) {
  const failure = spawnSync(process.execPath, [join(owner, 'worker.mjs'), run, '2'], { encoding: 'utf8', timeout: 15000 });
  save('timeout-settlement.json', { exit: failure.status, stdout: failure.stdout, stderr: failure.stderr });
  process.exitCode = 1;
} else {
  const settled = JSON.parse(readFileSync(join(run, 'settled.json')));
  const passed = result.code === 0 && settled.state.outcome.status === 'completed';
  const terminal = spawnSync(process.execPath, [join(owner, 'worker.mjs'), run, '2', '--inspect-terminal'], { encoding: 'utf8', timeout: 15000 });
  writeFileSync(join(run, 'terminal-reopen.stdout.log'), terminal.stdout ?? '');
  writeFileSync(join(run, 'terminal-reopen.stderr.log'), terminal.stderr ?? '');
  const reopened = JSON.parse(readFileSync(join(run, 'terminal-reopen.json')));
  assert.deepEqual(reopened.before, settled);
  assert.deepEqual(reopened.after, settled);
  assert.equal(reopened.inspection.tasks.length, 0);
  assert.equal(terminal.status, passed ? 0 : 1);
  const events = readFileSync(join(run, 'timeline.jsonl'), 'utf8').trim().split('\n').map(JSON.parse);
  const ids = new Set(events.filter(row => ['codex-process', 'runner-open', 'terminal-reopened'].includes(row.kind)).map(row => row.pid));
  const table = new Map(processTable().map(row => [row.pid, row]));
  const processes = [...ids].map(pid => ({ pid, state: table.get(pid)?.state ?? 'absent' }));
  assert.ok(processes.every(row => row.state === 'absent'));
  const verification = JSON.parse(readFileSync(join(run, 'verification.json')));
  const receipt = { passed, status: settled.state.outcome.status, mode: 'real-task', workspace,
    seeded_source: false, fault_injection: null, scripted_bad_candidate: false,
    attempts: verification.attempt, coding_launches: events.filter(row => row.kind === 'codex-start').length,
    retries: events.filter(row => row.kind === 'verification-retry').length,
    human_interventions_after_start: 0, terminal_reopen_exit: terminal.status,
    terminal_outcome_unchanged: true, all_observed_processes_absent: true, processes,
    elapsed_ms: Date.now() - admitted, verification, run };
  save('result.json', receipt);
  console.log(JSON.stringify(receipt, null, 2));
  process.exitCode = passed ? 0 : 1;
}
