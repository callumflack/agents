import assert from 'node:assert/strict';
import { appendFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { processTable, sameProcess, stopOwned } from './processes.mjs';

const owner = dirname(fileURLToPath(import.meta.url));
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
const sha = path => createHash('sha256').update(readFileSync(path)).digest('hex');
const lateRestart = process.argv.includes('--after-deadline');
let run;
const read = name => JSON.parse(readFileSync(join(run, name)));
const save = (name, value) => writeFileSync(join(run, name), JSON.stringify(value, null, 2) + '\n');
const event = (kind, data = {}) => appendFileSync(join(run, 'timeline.jsonl'), JSON.stringify({ at: new Date().toISOString(), kind, pid: process.pid, actor: 'fault-driver', ...data }) + '\n');

function observeOrphans(ledger) {
  const table = processTable();
  assert.equal(table.some(row => [ledger.supervisor_pid, ledger.runner_pid].includes(row.pid)), false);
  const processes = ledger.processes.map(saved => ({ saved, current: table.find(row => row.pid === saved.pid) ?? null }));
  for (const pid of [ledger.stall.pid, ledger.stall.child_pid]) assert.ok(processes.some(row => row.saved.pid === pid && row.current && !row.current.state.startsWith('Z') && sameProcess(row.saved, row.current)));
  return { observed_at_ms: Date.now(), supervisor_absent: true, runner_absent: true, processes };
}

function start(args, generation) {
  const child = spawn(process.execPath, [join(owner, 'trial.mjs'), ...args], { stdio: ['ignore', 'pipe', 'pipe'] });
  let output = '', errors = '', result;
  child.stdout.on('data', bytes => {
    output += bytes;
    if (!run) {
      const match = output.match(/Evidence: ([^\n]+)/);
      if (match) { run = match[1]; console.log(`Evidence: ${run}`); }
    }
  });
  child.stderr.on('data', bytes => { errors += bytes; });
  child.once('error', error => { result = { code: null, signal: null, error: String(error) }; });
  child.once('close', (code, signal) => { result = { code, signal }; });
  return { child, result: () => result, persist() {
    writeFileSync(join(run, `supervisor-${generation}.stdout.log`), output);
    writeFileSync(join(run, `supervisor-${generation}.stderr.log`), errors);
    save(`supervisor-${generation}.exit.json`, result);
  } };
}

async function audit() {
  const input = read('input.json');
  const ledger = read('owned-processes.json');
  const recovered = read('supervisor-recovered.json');
  const crash = read('injected-crash.json');
  const late = existsSync(join(run, 'restart-plan.json')) && read('restart-plan.json').variant === 'after-deadline';
  const events = readFileSync(join(run, 'timeline.jsonl'), 'utf8').trim().split('\n').map(JSON.parse);
  const expiry = events.find(row => row.kind === 'deadline-exceeded');
  const stopped = events.find(row => row.kind === 'timeout-processes-stopped');
  assert.equal(input.deadline_at_ms - input.admitted_at_ms, 60000);
  assert.ok(crash.signalled_at_ms - input.admitted_at_ms >= 30000 && crash.signalled_at_ms - input.admitted_at_ms < 31000);
  assert.equal(read('supervisor-1.exit.json').signal, 'SIGKILL');
  assert.equal(read('supervisor-2.exit.json').code, 1);
  assert.notEqual(recovered.pid, ledger.supervisor_pid);
  assert.equal(recovered.deadline_at_ms, input.deadline_at_ms);
  assert.equal(recovered.admitted_at_ms, input.admitted_at_ms);
  if (late) {
    const outage = read('orphan-after-deadline.json');
    assert.ok(outage.observed_at_ms >= input.deadline_at_ms + 5000);
    assert.equal(outage.supervisor_absent, true);
    assert.equal(outage.runner_absent, true);
    assert.ok(recovered.remaining_ms <= -5000, 'The replacement must see the already-expired original deadline');
    assert.ok(recovered.observed_at_ms >= outage.observed_at_ms);
  } else assert.ok(recovered.remaining_ms > 0 && recovered.remaining_ms < 30000);
  assert.equal(sha(join(run, 'input.json')), ledger.input_sha256);
  assert.equal(sha(join(run, 'owned-processes.json')), recovered.ledger_sha256);
  assert.equal(expiry.deadline_at_ms, input.deadline_at_ms);
  assert.ok(expiry.observed_at_ms >= input.deadline_at_ms);
  assert.ok(late ? expiry.observed_at_ms - recovered.observed_at_ms < 1000 : expiry.observed_at_ms - input.deadline_at_ms < 1000);
  if (late) assert.ok(Date.parse(stopped.at) - recovered.observed_at_ms < 2000, 'Recovery must clean up now, not grant a new budget');
  for (const name of ['orphan-after-crash.json', ...late ? ['orphan-after-deadline.json'] : [], 'orphan-observation.json', 'orphan-at-expiry.json']) {
    const observation = read(name);
    for (const pid of [ledger.stall.pid, ledger.stall.child_pid]) {
      const row = observation.processes.find(row => row.saved.pid === pid);
      assert.ok(row?.current && !row.current.state.startsWith('Z') && sameProcess(row.saved, row.current), `${name}: original stall ${pid} must still be alive`);
    }
  }
  const starts = events.filter(row => row.kind === 'codex-start');
  assert.deepEqual(starts.map(row => [row.generation, row.attempt]), [[1, 1]]);
  assert.ok(starts.every(row => Date.parse(row.at) < input.deadline_at_ms));
  assert.equal(events.some(row => row.kind === 'verification-retry'), false);
  const settled = read('settled.json');
  const terminal = read('terminal-reopen.json');
  const recoveredTask = read('recovered-task-2.json');
  const session = read('codex-session.json').session;
  assert.equal(recoveredTask.id, settled.id);
  assert.deepEqual(recoveredTask.state.checkpoint, { phase: 'code', attempt: 1 });
  assert.equal(recoveredTask.memos['codex-session'], session);
  assert.equal(settled.state.outcome.status, 'failed');
  assert.equal(settled.state.outcome.error.detail.reason, 'time_limit_exceeded');
  assert.equal(settled.state.outcome.error.detail.deadline_at_ms, input.deadline_at_ms);
  assert.deepEqual(terminal.before, settled);
  assert.deepEqual(terminal.after, settled);
  assert.equal(terminal.inspection.tasks.length, 0);
  for (const generation of [1, 2, 3]) assert.equal(read(`runner-deadline-${generation}.json`).deadline_at_ms, input.deadline_at_ms);
  for (const generation of [2, 3]) assert.equal(read(`recovery-worker-${generation}.json`).status, 1);
  for (const file of ['prompt-attempt-2.txt', 'codex-2.jsonl', 'candidate-attempt-2.py', 'verification-attempt-2.json']) assert.equal(existsSync(join(run, file)), false);
  const cleanup = read('timeout-cleanup.json');
  assert.equal(cleanup.stopped, true);
  for (const pid of [ledger.stall.pid, ledger.stall.child_pid]) assert.ok(cleanup.signals.some(row => row.pid === pid && (row.signal === 'SIGKILL' || ['already_exited', 'identity_changed_not_signalled'].includes(row.result))));
  const ids = new Set([...ledger.processes, ...cleanup.before].map(row => row.pid));
  ids.add(ledger.supervisor_pid);
  ids.add(recovered.pid);
  for (const row of events) if (['runner-open', 'terminal-reopened'].includes(row.kind)) ids.add(row.pid);
  const table = new Map(processTable().map(row => [row.pid, row]));
  const processes = [...ids].map(pid => ({ pid, state: table.get(pid)?.state ?? 'absent' }));
  assert.ok(processes.every(row => row.state === 'absent'));
  assert.equal(sha(join(input.source, 'scripts/_homebase.py')), input.source_module_sha256);
  assert.equal(sha(join(run, 'workspace/scripts/_homebase.py')), input.seeded_sha256);
  assert.equal(sha(join(run, 'source/verify.py')), input.oracle_sha256);
  const proof = { test_status: 'passed', job_status: 'failed', reason: 'time_limit_exceeded',
    variant: late ? 'after-deadline' : 'before-deadline',
    admitted_at_ms: input.admitted_at_ms, deadline_at_ms: input.deadline_at_ms,
    crash_after_ms: crash.signalled_at_ms - input.admitted_at_ms, recovery_remaining_ms: recovered.remaining_ms,
    expiry_after_ms: expiry.observed_at_ms - input.admitted_at_ms,
    expiry_lateness_ms: expiry.observed_at_ms - input.deadline_at_ms,
    processes_stopped_after_deadline_ms: Date.parse(stopped.at) - input.deadline_at_ms,
    supervisor_recovered_after_ms: recovered.observed_at_ms - input.admitted_at_ms,
    timeout_observed_after_recovery_ms: expiry.observed_at_ms - recovered.observed_at_ms,
    processes_stopped_after_recovery_ms: Date.parse(stopped.at) - recovered.observed_at_ms,
    original_supervisor: ledger.supervisor_pid, replacement_supervisor: recovered.pid,
    task_id: settled.id, session, original_stall_and_child_alive_at_timeout_observation: true,
    orphans_observed_past_original_deadline: late,
    coding_attempts: 1, codex_launches: 1, retries: 0, coding_after_timeout: 0,
    terminal_failure_unchanged: true, all_observed_processes_absent: true, processes,
    expected_controller_exit: 1, human_interventions_after_start: 0 };
  save('supervisor-crash-proof.json', proof);
  console.log(JSON.stringify(proof, null, 2));
}

if (process.argv[2] === '--audit') {
  run = process.argv[3];
  await audit();
} else {
  let first, second;
  try {
    first = start(['--supervisor-crash'], 1);
    const readinessLimit = Date.now() + 45000;
    while (!run || !existsSync(join(run, 'supervisor-crash-ready.json'))) {
      assert.equal(first.result(), undefined, 'Supervisor exited before the crash boundary');
      assert.ok(Date.now() < readinessLimit, 'Timed out waiting for a real stall and durable process ownership');
      await pause(25);
    }
    const input = read('input.json');
    const ledger = read('owned-processes.json');
    save('restart-plan.json', { variant: lateRestart ? 'after-deadline' : 'before-deadline',
      restart_after_deadline_ms: lateRestart ? 5000 : null, original_deadline_at_ms: input.deadline_at_ms });
    assert.equal(ledger.supervisor_pid, first.child.pid);
    while (Date.now() < input.admitted_at_ms + 30000) await pause(25);
    const signalledAt = Date.now();
    event('injected-supervisor-and-runner-crash', { supervisor: first.child.pid, runner: ledger.runner_pid, signal: 'SIGKILL' });
    first.child.kill('SIGKILL');
    process.kill(ledger.runner_pid, 'SIGKILL');
    save('injected-crash.json', { signalled_at_ms: signalledAt, supervisor: first.child.pid, runner: ledger.runner_pid,
      signals: ['supervisor SIGKILL', 'runner SIGKILL'], repair_descendants_signalled: false });
    while (!first.result()) await pause(25);
    first.persist();
    assert.equal(first.result().signal, 'SIGKILL');
    await pause(2000);
    save('orphan-after-crash.json', observeOrphans(ledger));
    if (lateRestart) {
      while (Date.now() < input.deadline_at_ms + 5000) await pause(25);
      save('orphan-after-deadline.json', observeOrphans(ledger));
      event('restart-held-past-deadline', { deadline_at_ms: input.deadline_at_ms, observed_at_ms: Date.now() });
    }
    event('fault-driver-restarts-supervisor', { deadline_at_ms: input.deadline_at_ms, remaining_ms: input.deadline_at_ms - Date.now() });
    second = start(['--resume-supervisor', run], 2);
    // Test failure guard only: successful deadline enforcement is entirely
    // inside the replacement supervisor, while this driver only awaits exit.
    while (!second.result()) {
      assert.ok(Date.now() < input.deadline_at_ms + 20000, 'Replacement supervisor failed to settle');
      await pause(25);
    }
    second.persist();
    assert.equal(second.result().code, 1);
    assert.ok(existsSync(join(run, 'settled.json')), 'Recovery did not settle timeout failure; see supervisor-2.stderr.log');
    await audit();
    process.exitCode = 1; // The repair job is failed even though its stop test passed.
  } catch (error) {
    if (first && !first.result()) first.child.kill('SIGKILL');
    if (second && !second.result()) second.child.kill('SIGKILL');
    if (run && existsSync(join(run, 'owned-processes.json'))) {
      try { save('emergency-cleanup.json', await stopOwned(read('owned-processes.json').processes)); }
      catch (cleanupError) { save('cleanup-error.json', { error: String(cleanupError) }); }
    }
    if (run) save('supervisor-crash-proof.json', { test_status: 'failed', error: String(error) });
    throw error;
  }
}
