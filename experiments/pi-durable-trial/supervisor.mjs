import assert from 'node:assert/strict';
import { appendFileSync, copyFileSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { processTable, sameProcess, stopOwned } from './processes.mjs';

const owner = dirname(fileURLToPath(import.meta.url));
const sha = path => createHash('sha256').update(readFileSync(path)).digest('hex');

export async function recoverSupervisor(run) {
  const read = name => JSON.parse(readFileSync(join(run, name)));
  const save = (name, value) => writeFileSync(join(run, name), JSON.stringify(value, null, 2) + '\n');
  const event = (kind, data = {}) => appendFileSync(join(run, 'timeline.jsonl'), JSON.stringify({
    at: new Date().toISOString(), kind, pid: process.pid, supervisor_generation: 2, ...data }) + '\n');
  const input = read('input.json');
  const ledger = read('owned-processes.json');
  assert.equal(input.mode, 'supervisor-crash');
  assert.equal(sha(join(run, 'input.json')), ledger.input_sha256);
  assert.equal(input.deadline_at_ms, ledger.deadline_at_ms);
  const table = processTable();
  assert.equal(table.some(row => [ledger.supervisor_pid, ledger.runner_pid].includes(row.pid)), false,
    'Both old writers must be gone before recovery');
  const observed = ledger.processes.map(saved => ({ saved, current: table.find(row => row.pid === saved.pid) ?? null }));
  for (const row of observed) if (row.current) assert.ok(sameProcess(row.saved, row.current), 'Orphan identity must match its pre-crash record');
  const reopenedAt = Date.now();
  const recovery = { pid: process.pid, admitted_at_ms: input.admitted_at_ms, deadline_at_ms: input.deadline_at_ms,
    observed_at_ms: reopenedAt, remaining_ms: input.deadline_at_ms - reopenedAt,
    input_sha256: sha(join(run, 'input.json')), ledger_sha256: sha(join(run, 'owned-processes.json')),
    strategy: 'Watch existing orphaned repair processes until original deadline; do not replay coding' };
  save('supervisor-recovered.json', recovery);
  save('orphan-observation.json', { observed_at_ms: Date.now(), processes: observed });
  event('supervisor-recovered', recovery);

  while (Date.now() < input.deadline_at_ms) await new Promise(resolve => setTimeout(resolve, Math.min(25, input.deadline_at_ms - Date.now())));
  event('deadline-exceeded', { deadline_at_ms: input.deadline_at_ms, observed_at_ms: Date.now(), budget_seconds: input.budget_seconds });
  const expiryTable = processTable();
  save('orphan-at-expiry.json', { observed_at_ms: Date.now(), processes: ledger.processes.map(saved => ({
    saved, current: expiryTable.find(row => row.pid === saved.pid) ?? null })) });
  const modulePath = join(run, 'workspace/scripts/_homebase.py');
  copyFileSync(modulePath, join(run, 'candidate-at-timeout.py'));
  const diff = spawnSync('git', ['diff', '--', 'scripts/_homebase.py'], { cwd: join(run, 'workspace'), encoding: 'utf8', timeout: 5000 });
  assert.equal(diff.status, 0);
  writeFileSync(join(run, 'patch-at-timeout.diff'), diff.stdout);
  save('stall-at-timeout.json', ledger.stall);
  const cleanup = await stopOwned(ledger.processes);
  save('timeout-cleanup.json', cleanup);
  assert.equal(cleanup.stopped, true);
  event('timeout-processes-stopped', { pids: cleanup.before.map(row => row.pid), stopped: true });

  // Only after cleanup, open SQLite. The existing phase guard must expire
  // before code(), so neither this recovery nor terminal reopening runs Codex.
  for (const [generation, args] of [[2, []], [3, ['--inspect-terminal']]]) {
    const result = spawnSync(process.execPath, [join(owner, 'worker.mjs'), run, String(generation), ...args], {
      encoding: 'utf8', timeout: 15000 });
    writeFileSync(join(run, `recovery-worker-${generation}.stdout.log`), result.stdout ?? '');
    writeFileSync(join(run, `recovery-worker-${generation}.stderr.log`), result.stderr ?? '');
    save(`recovery-worker-${generation}.json`, { status: result.status, signal: result.signal, error: result.error?.message ?? null });
    assert.equal(result.status, 1, 'Timeout settlement and terminal reopen must return failure');
  }
  const settled = read('settled.json');
  const terminal = read('terminal-reopen.json');
  const outcome = read('job-outcome.json');
  assert.equal(outcome.reason, 'time_limit_exceeded');
  assert.equal(outcome.attempts, 1);
  assert.equal(outcome.passed, false);
  assert.equal(outcome.deadline_at_ms, input.deadline_at_ms);
  assert.deepEqual(terminal.before, settled);
  assert.deepEqual(terminal.after, settled);
  assert.equal(terminal.inspection.tasks.length, 0);
  assert.equal(sha(join(run, 'input.json')), ledger.input_sha256);
  const events = readFileSync(join(run, 'timeline.jsonl'), 'utf8').trim().split('\n').map(JSON.parse);
  assert.deepEqual(events.filter(row => row.kind === 'codex-start').map(row => [row.generation, row.attempt]), [[1, 1]]);
  assert.equal(events.some(row => row.kind === 'verification-retry'), false);
  assert.equal(events.some(row => row.kind === 'settled' && row.state.outcome.status === 'completed'), false);
  save('result.json', { passed: false, status: 'failed', reason: outcome.reason, mode: input.mode,
    attempts: 1, max_attempts: input.max_attempts, budget_seconds: input.budget_seconds,
    deadline_at_ms: input.deadline_at_ms, processes_stopped: true, run,
    scope: 'Supervisor and runner killed; replacement adopted saved orphan identities and original deadline; orphan cleanup preceded terminal timeout failure; no coding replay or retry' });
  event('recovery-supervisor-finished', { status: 'failed', reason: outcome.reason });
  console.log(JSON.stringify(read('result.json'), null, 2));
}
