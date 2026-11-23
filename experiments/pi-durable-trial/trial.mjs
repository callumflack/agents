import { mkdirSync, readFileSync, writeFileSync, copyFileSync, existsSync, appendFileSync } from 'node:fs';
import { spawn, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { ownedTree, processTable, stopTree } from './processes.mjs';
import { recoverSupervisor } from './supervisor.mjs';

const resumeSupervisor = process.argv.indexOf('--resume-supervisor');
if (resumeSupervisor !== -1) {
  await recoverSupervisor(process.argv[resumeSupervisor + 1]);
  process.exit(1);
}

const owner = dirname(fileURLToPath(import.meta.url));
const deadlineRestartTrial = process.argv.includes('--timeout-restart');
const supervisorCrashTrial = process.argv.includes('--supervisor-crash');
const timeoutTrial = process.argv.includes('--timeout') || deadlineRestartTrial || supervisorCrashTrial;
const limitTrial = process.argv.includes('--retry-limit');
const combinedTrial = process.argv.includes('--feedback-crash') || limitTrial;
const feedbackTrial = process.argv.includes('--feedback') || combinedTrial;
const restartTrial = timeoutTrial || !feedbackTrial || combinedTrial;
const mode = supervisorCrashTrial ? 'supervisor-crash' : deadlineRestartTrial ? 'timeout-restart' : timeoutTrial ? 'timeout' : limitTrial ? 'retry-limit' : combinedTrial ? 'feedback-crash' : feedbackTrial ? 'feedback' : 'crash';
const source = '/Users/callumflack/Repos/callumflack/homebase';
const run = join(owner, 'runs', new Date().toISOString().replaceAll(':', '-'));
const workspace = join(run, 'workspace');
const python = '/opt/homebrew/opt/python@3.14/bin/python3.14';
mkdirSync(workspace, { recursive: true });
mkdirSync(join(run, 'source'));
for (const filename of ['trial.mjs', 'worker.mjs', 'real-task.mjs', 'real-task-support.mjs', 'verify-real.py', 'processes.mjs', 'supervisor.mjs', 'supervisor-crash.mjs', 'stall.py', 'verify.py', 'package.json', 'package-lock.json']) copyFileSync(join(owner, filename), join(run, 'source', filename));
const json = (name, value) => writeFileSync(join(run, name), JSON.stringify(value, null, 2) + '\n');
const sha = path => createHash('sha256').update(readFileSync(path)).digest('hex');
const event = (kind, data = {}) => appendFileSync(join(run, 'timeline.jsonl'), JSON.stringify({ at: new Date().toISOString(), kind, pid: process.pid, ...data }) + '\n');
function command(executable, args, cwd = workspace) {
  const result = spawnSync(executable, args, { cwd, encoding: 'utf8', timeout: 120000 });
  if (result.status !== 0) throw new Error(`${executable} ${args.join(' ')}: ${result.stderr}`);
  return result.stdout;
}
const files = command('git', ['ls-files', '-z'], source).split('\0').filter(Boolean);
for (const file of files) {
  if (!existsSync(join(source, file))) continue;
  mkdirSync(dirname(join(workspace, file)), { recursive: true });
  copyFileSync(join(source, file), join(workspace, file));
}
const modulePath = join(workspace, 'scripts/_homebase.py');
const original = readFileSync(modulePath, 'utf8');
const needle = 'failed = failed or state.failing';
const checkStart = original.indexOf('def run_check(');
const checkEnd = original.indexOf('\ndef run_setup(', checkStart);
const checkFunction = original.slice(checkStart, checkEnd);
assert.equal(checkFunction.split(needle).length, 2, 'Seed must change one known decision in run_check');
writeFileSync(join(run, 'original-homebase.py'), original);
writeFileSync(modulePath, original.slice(0, checkStart) + checkFunction.replace(needle, 'failed = failed or state.status != "OK"') + original.slice(checkEnd));
writeFileSync(join(workspace, 'AGENTS.md'), `# Disposable local recovery trial\nOnly scripts/_homebase.py may be edited. Preserve all existing behavior except the optional-project regression. Run the existing behavioral tests and portable health command. No commits, external actions, learning capture, or user questions. This copy has no formatter or IDE diagnostics integration. The controller owns all files outside this workspace.\n`);
if (timeoutTrial) {
  copyFileSync(join(owner, 'stall.py'), join(workspace, 'stall.py'));
  appendFileSync(join(workspace, '.gitignore'), '\n/.trial-runtime/\n');
  appendFileSync(join(workspace, 'AGENTS.md'), 'Timeout test exception: execute the read-only stall.py helper before any edit; it may create .trial-runtime/stall.json and its temporary scratch file. Do not edit or bypass the helper. The external controller owns its processes.\n');
}
command('git', ['init', '-q']);
command('git', ['add', '.']);
command('git', ['-c', 'user.name=Local Trial', '-c', 'user.email=local-trial@localhost', '-c', 'commit.gpgsign=false', 'commit', '-qm', 'Seeded disposable trial input']);
const before = spawnSync(python, ['-B', join(owner, 'verify.py'), workspace], { encoding: 'utf8', timeout: 90000 });
writeFileSync(join(run, 'acceptance-before.json'), before.stdout);
assert.equal(before.status, 1, 'Protected oracle must reject seeded bug');
const beforeReport = JSON.parse(before.stdout);
assert.deepEqual(beforeReport.cases.filter(x => !x.passed).map(x => x.case), ['optional absent', 'optional dangling']);
const initialHash = sha(modulePath);
const oracleHash = sha(join(owner, 'verify.py'));
const admittedAt = Date.now();
const budgetSeconds = timeoutTrial ? 60 : 600;
const deadline = admittedAt + budgetSeconds * 1000;
json('input.json', { source, source_head: command('git', ['rev-parse', 'HEAD'], source).trim(),
  source_module_sha256: createHash('sha256').update(original).digest('hex'), seeded_sha256: initialHash,
  oracle_sha256: oracleHash, node: process.version, pi_durable: '1.3.0', budget_seconds: budgetSeconds,
  admitted_at_ms: admittedAt, deadline_at_ms: deadline,
  mode, max_attempts: feedbackTrial || timeoutTrial ? 2 : 1,
  interruption: supervisorCrashTrial ? 'at 30 seconds, SIGKILL supervisor and runner only; restart supervisor over persisted input and process identities while repair descendants remain orphaned' : deadlineRestartTrial ? 'at 30 seconds, during a real stalled repair; kill runner and owned tree, resume same task/session/attempt with remaining original budget' : combinedTrial ? 'after first rejection and durable repair-ready checkpoint, before the repair starts' : feedbackTrial ? null : 'after first source edit, before final independent verification',
  fault_injection: timeoutTrial ? 'The real Codex repair must wait for stall.py and its real child; the persisted whole-job deadline is shortened to 60 seconds.' : limitTrial ? 'Both agent-authored candidates are deliberately incomplete; the second remains wrong for missing optional targets. All verifier outputs are genuine and unchanged.' : feedbackTrial ? 'Agent is instructed to submit an intentionally incomplete first candidate; verifier outputs are genuine and unchanged.' : null });
event('baseline-rejected', { failed: beforeReport.cases.filter(x => !x.passed).map(x => x.case) });
console.log(`Evidence: ${run}`);
let interrupted = false;
let timedOut = false;
let activeChild;
const inputHash = sha(join(run, 'input.json'));
const generations = restartTrial ? [1, 2] : [1];
try {
  for (const generation of generations) {
    const child = spawn(process.execPath, [join(owner, 'worker.mjs'), run, String(generation)], { stdio: ['ignore', 'pipe', 'pipe'] });
    activeChild = child;
    let result;
    const closed = new Promise(resolve => child.once('close', (code, signal) => { result = { code, signal }; resolve(result); }));
    child.stdout.on('data', bytes => appendFileSync(join(run, `runner-${generation}.stdout.log`), bytes));
    child.stderr.on('data', bytes => appendFileSync(join(run, `runner-${generation}.stderr.log`), bytes));
    event('supervisor-started-runner', { generation, child: child.pid });
    let settlementDeadline = Date.now() + 15000;
    while (!result) {
      if (timedOut && Date.now() > settlementDeadline) throw new Error('Timed-out task did not settle within the cleanup allowance');
      if (supervisorCrashTrial && !existsSync(join(run, 'supervisor-crash-ready.json')) && existsSync(join(workspace, '.trial-runtime/stall.json')) && existsSync(join(run, 'codex-session.json'))) {
        const stall = JSON.parse(readFileSync(join(workspace, '.trial-runtime/stall.json')));
        const owned = ownedTree(child.pid, [stall.pid, stall.child_pid]);
        const receipt = { supervisor_pid: process.pid, runner_pid: child.pid, admitted_at_ms: admittedAt,
          deadline_at_ms: deadline, input_sha256: inputHash, persisted_at_ms: Date.now(), processes: owned, stall };
        json('owned-processes.json', receipt);
        json('supervisor-crash-ready.json', { supervisor_pid: process.pid, runner_pid: child.pid });
        event('owned-processes-persisted', { pids: owned.map(row => row.pid), deadline_at_ms: deadline });
      }
      if (deadlineRestartTrial && generation === 1 && !interrupted && Date.now() >= admittedAt + 30000) {
        const stall = JSON.parse(readFileSync(join(workspace, '.trial-runtime/stall.json')));
        assert.ok(Date.now() - stall.started_at_ms > 1000, 'A real repair must already be stalled at the midpoint');
        assert.ok(existsSync(join(run, 'codex-session.json')), 'Session identity must be durable before the crash');
        json('stall-before-restart.json', stall);
        event('forced-crash', { runner: child.pid, signal: 'SIGKILL', boundary: 'stalled repair at original budget midpoint',
          admitted_at_ms: admittedAt, deadline_at_ms: deadline, remaining_ms: deadline - Date.now() });
        const cleanup = await stopTree(child.pid, [stall.pid, stall.child_pid]);
        json('restart-cleanup.json', cleanup);
        assert.equal(cleanup.stopped, true, 'The first repair process tree must stop before resumption');
        interrupted = true;
        event('restart-processes-stopped', { pids: cleanup.before.map(row => row.pid) });
      }
      if (Date.now() > deadline && !timedOut) {
        let stall;
        if (timeoutTrial) {
          stall = JSON.parse(readFileSync(join(workspace, '.trial-runtime/stall.json')));
          assert.ok(Date.now() - stall.started_at_ms > 1000, 'A real repair command must have stalled before timeout');
          if (deadlineRestartTrial) {
            const first = JSON.parse(readFileSync(join(run, 'stall-before-restart.json')));
            assert.notEqual(stall.pid, first.pid, 'The resumed command must have created a fresh real stall');
            assert.ok(stall.started_at_ms > first.started_at_ms);
          }
          json('stall-at-timeout.json', stall);
        }
        event('deadline-exceeded', { deadline_at_ms: deadline, observed_at_ms: Date.now(), budget_seconds: budgetSeconds });
        copyFileSync(modulePath, join(run, 'candidate-at-timeout.py'));
        writeFileSync(join(run, 'patch-at-timeout.diff'), command('git', ['diff', '--', 'scripts/_homebase.py']));
        const cleanup = await stopTree(child.pid, stall ? [stall.pid, stall.child_pid] : []);
        json('timeout-cleanup.json', cleanup);
        assert.equal(cleanup.stopped, true, 'All observed repair processes must stop');
        event('timeout-processes-stopped', { pids: cleanup.before.map(row => row.pid), stopped: cleanup.stopped });
        timedOut = true;
        interrupted = true;
        settlementDeadline = Date.now() + 15000;
        if (!generations.includes(generation + 1)) generations.push(generation + 1);
      }
      const crashReady = combinedTrial ? existsSync(join(run, 'feedback-crash-ready.json')) : !feedbackTrial && existsSync(join(run, 'codex-session.json')) && sha(modulePath) !== initialHash;
      if (!timeoutTrial && restartTrial && generation === 1 && !interrupted && crashReady) {
        const codex = JSON.parse(readFileSync(join(run, 'child.json')));
        if (combinedTrial) {
          const ready = JSON.parse(readFileSync(join(run, 'feedback-crash-ready.json')));
          const feedback = JSON.parse(readFileSync(join(run, 'feedback-attempt-1.json')));
          assert.deepEqual(ready.task.state.checkpoint.feedback, feedback);
          assert.equal(ready.task.state.checkpoint.phase, 'repair-ready');
          assert.equal(feedback.verification.passed, false);
          assert.equal(ready.repair_started, false);
          assert.equal(existsSync(join(run, 'codex-attempt-2.jsonl')), false);
          assert.equal(existsSync(join(run, 'prompt-attempt-2.txt')), false);
          assert.equal(sha(modulePath), feedback.rejected_candidate_sha256);
        }
        event('forced-crash', { runner: child.pid, codex: combinedTrial ? null : codex.pid, signal: 'SIGKILL',
          boundary: JSON.parse(readFileSync(join(run, 'input.json'))).interruption,
          patch_sha256: sha(modulePath), verification_existed: existsSync(join(run, 'verification.json')),
          repair_started: combinedTrial ? false : null });
        if (!combinedTrial) {
          try { process.kill(-codex.pid, 'SIGKILL'); } catch (error) { if (error.code !== 'ESRCH') throw error; }
        }
        child.kill('SIGKILL');
        interrupted = true;
      }
      await new Promise(resolve => setTimeout(resolve, 25));
    }
    await closed;
    event('supervisor-runner-exited', { generation, ...result });
    if (timedOut) {
      if (result.signal === 'SIGKILL') {
        console.log('Deadline reached; processes stopped. Reopening only to settle timeout failure.');
        continue;
      }
      assert.equal(result.code, 1, 'Timeout finalization must return failure');
      break;
    }
    if (restartTrial && generation === 1) {
      assert.ok(interrupted, 'First runner must be killed at the selected checkpoint');
      assert.equal(result.signal, 'SIGKILL');
      console.log('Forced crash observed; automatically reopening persisted Pi task with its original deadline.');
    } else assert.equal(result.code, limitTrial || timeoutTrial ? 1 : 0, 'Runner exit must agree with the independent job outcome');
  }
  if (timedOut) {
    const settled = JSON.parse(readFileSync(join(run, 'settled.json')));
    const outcome = JSON.parse(readFileSync(join(run, 'job-outcome.json')));
    assert.equal(settled.state.outcome.status, 'failed');
    assert.equal(outcome.reason, 'time_limit_exceeded');
    assert.equal(outcome.passed, false);
    if (timeoutTrial) assert.equal(outcome.attempts, 1);
    assert.equal(outcome.deadline_at_ms, deadline);
    assert.equal(outcome.cleanup.stopped, true);
    const probe = spawnSync(process.execPath, [join(owner, 'worker.mjs'), run, String(Math.max(...generations) + 1), '--inspect-terminal'], { encoding: 'utf8', timeout: 15000 });
    writeFileSync(join(run, 'terminal-reopen.stdout.log'), probe.stdout);
    writeFileSync(join(run, 'terminal-reopen.stderr.log'), probe.stderr);
    assert.equal(probe.status, 1);
    const terminal = JSON.parse(readFileSync(join(run, 'terminal-reopen.json')));
    assert.deepEqual(terminal.before, settled);
    assert.deepEqual(terminal.after, settled);
    assert.equal(terminal.inspection.tasks.length, 0);
    assert.equal(terminal.after.state.outcome.error.detail.deadline_at_ms, deadline);
    const timeline = readFileSync(join(run, 'timeline.jsonl'), 'utf8').trim().split('\n').map(JSON.parse);
    if (timeoutTrial) {
      assert.deepEqual(timeline.filter(x => x.kind === 'codex-start').map(x => [x.generation, x.attempt]), deadlineRestartTrial ? [[1, 1], [2, 1]] : [[1, 1]]);
      assert.equal(timeline.filter(x => x.kind === 'verification-retry').length, 0);
    }
    const expiredIndex = timeline.findIndex(x => x.kind === 'deadline-exceeded');
    assert.equal(timeline.slice(expiredIndex).some(x => x.kind === 'codex-start'), false);
    assert.equal(timeline.some(x => x.kind === 'settled' && x.state?.outcome?.status === 'completed'), false);
    if (timeoutTrial) {
      for (const name of ['prompt-attempt-2.txt', ...deadlineRestartTrial ? [] : ['codex-2.jsonl'], 'codex-attempt-2.jsonl', 'candidate-attempt-2.py', 'verification-attempt-2.json']) assert.equal(existsSync(join(run, name)), false, name);
      assert.equal(sha(modulePath), initialHash);
    }
    assert.equal(sha(join(run, 'input.json')), inputHash, 'Admission and deadline file must never be rewritten');
    if (deadlineRestartTrial) {
      const recovered = JSON.parse(readFileSync(join(run, 'recovered-task-2.json')));
      const firstSession = JSON.parse(readFileSync(join(run, 'codex-session.json'))).session;
      assert.equal(recovered.id, settled.id);
      assert.equal(recovered.state.checkpoint.phase, 'code');
      assert.equal(recovered.state.checkpoint.attempt, 1);
      assert.equal(recovered.memos['codex-session'], firstSession);
      assert.equal(outcome.session_id, firstSession);
      const sessions = timeline.filter(x => x.kind === 'codex-session');
      assert.deepEqual(sessions.map(x => [x.generation, x.session, x.resumed]), [[1, firstSession, false], [2, firstSession, true]]);
      const recoveredDeadline = JSON.parse(readFileSync(join(run, 'runner-deadline-2.json')));
      assert.equal(recoveredDeadline.deadline_at_ms, deadline);
      assert.equal(recoveredDeadline.admitted_at_ms, admittedAt);
      assert.ok(recoveredDeadline.remaining_ms > 0 && recoveredDeadline.remaining_ms <= 30000);
      const expired = timeline[expiredIndex];
      assert.ok(expired.observed_at_ms - deadline < 1000, 'Timeout must occur near the original deadline, not one minute after restart');
      const cleanups = ['restart-cleanup.json', 'timeout-cleanup.json'].map(name => JSON.parse(readFileSync(join(run, name))));
      const pids = [...new Set(cleanups.flatMap(cleanup => cleanup.before.map(row => row.pid)))];
      const table = new Map(processTable().map(row => [row.pid, row]));
      const audit = pids.map(pid => ({ pid, state: table.get(pid)?.state ?? 'absent' }));
      json('process-audit.json', { observed_at: new Date().toISOString(), processes: audit });
      assert.ok(audit.every(row => row.state === 'absent'), 'Every observed process from both repair generations must be gone');
      json('deadline-restart-proof.json', { test_status: 'passed', job_status: 'failed', task_id: settled.id,
        same_codex_session: firstSession, attempt: outcome.attempts, codex_launches: sessions.length,
        admitted_at_ms: admittedAt, deadline_at_ms: deadline, restart_remaining_ms: recoveredDeadline.remaining_ms,
        deadline_lateness_ms: expired.observed_at_ms - deadline, process_count: pids.length, all_observed_pids_absent: true,
        retries: 0, coding_started_after_timeout: false, input_file_unchanged: true, terminal_reopen_exit: probe.status,
        human_interventions_after_start: 0, expected_controller_exit: 1 });
    }
    assert.equal(sha(join(owner, 'verify.py')), oracleHash);
    const receipt = { passed: false, status: 'failed', reason: outcome.reason, message: outcome.message,
      mode, budget_seconds: budgetSeconds, attempts: outcome.attempts, max_attempts: outcome.max_attempts,
      deadline_at_ms: deadline, processes_stopped: true, run, scope: deadlineRestartTrial ? 'Stalled repair killed at midpoint; same task/session/attempt resumed with original deadline; both observed process trees stopped; timeout stayed failed on terminal reopen; no retry.' : 'One real repair command and child deliberately stalled; deadline killed its process tree; same task settled failed and stayed failed on reopen; no further coding attempt.' };
    json('result.json', receipt);
    json('timeout-proof.json', { test_status: 'passed', job_status: 'failed', coding_attempts: outcome.attempts, codex_launches: timeline.filter(x => x.kind === 'codex-start').length,
      retries: timeline.filter(x => x.kind === 'verification-retry').length,
      all_observed_processes_stopped: true, deadline_preserved_after_reopen: true, terminal_failure_unchanged_after_reopen: true,
      another_coding_attempt_started: false, terminal_reopen_exit: probe.status, expected_controller_exit: 1 });
    console.log(JSON.stringify(receipt, null, 2));
    process.exitCode = 1;
  } else {
  assert.equal(sha(join(owner, 'verify.py')), oracleHash, 'Acceptance checker unchanged');
  const verification = JSON.parse(readFileSync(join(run, 'verification.json')));
  assert.equal(verification.passed, !limitTrial);
  assert.equal(verification.fixed_sha256, sha(modulePath));
  const first = readFileSync(join(run, feedbackTrial ? 'codex-attempt-1.jsonl' : 'codex-1.jsonl'), 'utf8').trim().split('\n').map(JSON.parse).find(x => x.type === 'thread.started');
  const second = readFileSync(join(run, feedbackTrial ? 'codex-attempt-2.jsonl' : 'codex-2.jsonl'), 'utf8').trim().split('\n').map(JSON.parse).find(x => x.type === 'thread.started');
  assert.equal(first.thread_id, second.thread_id, 'Same Codex session must resume');
  if (feedbackTrial) {
    const rejected = JSON.parse(readFileSync(join(run, 'verification-attempt-1.json')));
    const rejectedCases = JSON.parse(readFileSync(join(run, 'acceptance-attempt-1.json'))).cases.filter(x => !x.passed);
    assert.equal(rejected.passed, false, 'First candidate must genuinely fail independent verification');
    assert.equal(rejected.acceptance_exit, 1);
    assert.deepEqual(rejectedCases.map(x => x.case), ['required absent', 'required dangling', 'connection missing to existing target']);
    assert.notEqual(rejected.fixed_sha256, verification.fixed_sha256, 'The agent must change the rejected artifact');
    assert.equal(verification.attempt, 2, 'Exactly one corrective attempt is permitted');
    const feedback = JSON.parse(readFileSync(join(run, 'feedback-attempt-1.json')));
    const repairPrompt = readFileSync(join(run, 'prompt-attempt-2.txt'), 'utf8');
    assert.ok(repairPrompt.includes(JSON.stringify(feedback, null, 2)), 'Repair must receive the actual rejected verification evidence');
    const checkpoint = JSON.parse(readFileSync(join(run, 'retry-checkpoint-2.json')));
    assert.deepEqual(checkpoint.state.checkpoint.feedback, feedback, 'Feedback must be stored in the Pi task checkpoint');
    assert.equal(checkpoint.memos['codex-session'], first.thread_id);
    if (combinedTrial) {
      const recovered = JSON.parse(readFileSync(join(run, 'recovered-task.json')));
      assert.equal(recovered.id, checkpoint.id, 'The same Pi task must reopen');
      assert.equal(recovered.state.checkpoint.phase, 'repair-ready');
      assert.equal(recovered.state.checkpoint.attempt, 2);
      assert.deepEqual(recovered.state.checkpoint.feedback, feedback, 'Reopened SQLite must contain the original failure feedback');
      assert.equal(recovered.memos['codex-session'], first.thread_id);
      assert.equal(JSON.parse(readFileSync(join(run, 'recovered-workspace.json'))).candidate_sha256, rejected.fixed_sha256);
      const timeline = readFileSync(join(run, 'timeline.jsonl'), 'utf8').trim().split('\n').map(JSON.parse);
      assert.deepEqual(timeline.filter(x => x.kind === 'codex-start').map(x => [x.generation, x.attempt]), [[1, 1], [2, 2]]);
      assert.deepEqual(timeline.filter(x => x.kind === 'verified').map(x => [x.generation, x.attempt, x.passed]), [[1, 1, false], [2, 2, !limitTrial]]);
      const index = kind => timeline.findIndex(x => x.kind === kind);
      assert.ok(index('verification-retry') < index('feedback-durable-before-crash'));
      assert.ok(index('feedback-durable-before-crash') < index('forced-crash'));
      assert.ok(index('forced-crash') < index('recovered-task'));
      assert.ok(index('recovered-task') < index('feedback-restored'));
      assert.equal(timeline.filter(x => x.kind === 'forced-crash').length, 1);
    }
  }
  const receipt = { passed: !limitTrial, mode, interrupted, persisted_feedback_recovered: combinedTrial ? true : undefined,
    same_codex_session: first.thread_id, human_interventions_after_start: 0, run, verification,
    scope: combinedTrial ? 'First candidate rejected; real feedback saved in SQLite; runner killed before repair; reopened same task and session; recovered feedback led to a different passing candidate; local only.' : feedbackTrial ? 'One deliberately incomplete agent-authored candidate was rejected; actual verification feedback led the same session to repair it; same fixed checks; local only.' : 'One seeded Homebase CLI bug; forced stop after source edit; same Pi task and Codex session; local result only.' };
  if (limitTrial) {
    const settled = JSON.parse(readFileSync(join(run, 'settled.json')));
    const jobOutcome = JSON.parse(readFileSync(join(run, 'job-outcome.json')));
    assert.equal(settled.state.outcome.status, 'failed');
    assert.equal(settled.state.outcome.error.detail.reason, 'retry_limit_exhausted');
    assert.equal(jobOutcome.passed, false);
    assert.equal(jobOutcome.attempts, 2);
    assert.equal(jobOutcome.max_attempts, 2);
    assert.equal(jobOutcome.session_id, first.thread_id);
    assert.equal(verification.acceptance_exit, 1);
    assert.equal(verification.health_exit, 1);
    const lastCases = JSON.parse(readFileSync(join(run, 'acceptance-attempt-2.json'))).cases;
    assert.deepEqual(lastCases.filter(x => !x.passed).map(x => x.case), ['optional absent', 'optional dangling']);
    Object.assign(receipt, { status: 'failed', reason: jobOutcome.reason, attempts: 2, max_attempts: 2,
      message: jobOutcome.message, scope: 'The controlled second candidate still fails; the two-attempt limit terminates the job as failed. No fix is accepted.' });
    json('result.json', receipt);
    const terminalBefore = readFileSync(join(run, 'settled.json'));
    const probe = spawnSync(process.execPath, [join(owner, 'worker.mjs'), run, '3', '--inspect-terminal'], { encoding: 'utf8', timeout: 15000 });
    writeFileSync(join(run, 'terminal-reopen.stdout.log'), probe.stdout);
    writeFileSync(join(run, 'terminal-reopen.stderr.log'), probe.stderr);
    assert.equal(probe.status, 1, 'Reopened failed task must still return failure');
    assert.deepEqual(readFileSync(join(run, 'settled.json')), terminalBefore, 'Probe must not replace the original terminal receipt');
    const reopened = JSON.parse(readFileSync(join(run, 'terminal-reopen.json')));
    assert.deepEqual(reopened.before, settled);
    assert.deepEqual(reopened.after, settled);
    assert.equal(reopened.after.state.outcome.error.detail.reason, 'retry_limit_exhausted');
    assert.deepEqual(reopened.after.state.outcome.error.detail.first_rejection, JSON.parse(readFileSync(join(run, 'feedback-attempt-1.json'))));
    assert.deepEqual(reopened.after.state.outcome.error.detail.final_acceptance.cases, lastCases);
    assert.equal(reopened.inspection.tasks.length, 0, 'No live task may remain after the failed task is reopened');
    const timeline = readFileSync(join(run, 'timeline.jsonl'), 'utf8').trim().split('\n').map(JSON.parse);
    assert.deepEqual(timeline.filter(x => x.kind === 'codex-start').map(x => x.attempt), [1, 2]);
    assert.equal(timeline.filter(x => x.kind === 'verification-retry').length, 1);
    assert.equal(timeline.some(x => x.kind === 'settled' && x.state?.outcome?.status === 'completed'), false);
    for (const name of ['prompt-attempt-3.txt', 'codex-attempt-3.jsonl', 'candidate-attempt-3.py', 'verification-attempt-3.json', 'retry-checkpoint-3.json']) assert.equal(existsSync(join(run, name)), false, name);
    for (const attempt of [1, 2]) for (const name of [`candidate-attempt-${attempt}.py`, `fix-attempt-${attempt}.patch`, `acceptance-attempt-${attempt}.json`, `health-attempt-${attempt}.log`, `verification-attempt-${attempt}.json`]) assert.ok(readFileSync(join(run, name)).length > 0, name);
    json('limit-proof.json', { test_status: 'passed', job_status: 'failed', expected_controller_exit: 1,
      max_attempts: 2, coding_attempts: 2, retries: 1, third_attempt_started: false, completed_outcome_recorded: false,
      terminal_failure_unchanged_after_reopen: true, terminal_reopen_exit: probe.status, evidence_preserved: true });
    console.log(JSON.stringify(receipt, null, 2));
    process.exitCode = 1;
  } else {
    json('result.json', receipt);
    console.log(JSON.stringify(receipt, null, 2));
  }
  }
} catch (error) {
  if (activeChild && activeChild.exitCode === null) activeChild.kill('SIGKILL');
  if (existsSync(join(run, 'child.json'))) {
    try { process.kill(-JSON.parse(readFileSync(join(run, 'child.json'))).pid, 'SIGKILL'); } catch {}
  }
  event('trial-failed', { message: String(error) });
  json('result.json', { passed: false, interrupted, error: String(error), run });
  throw error;
}
