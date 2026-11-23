import { appendFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { spawn, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createInterface } from 'node:readline';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BACKGROUND_CONTEXT as context } from '@earendil-works/chord/context';
import { createModels } from '@earendil-works/pi-ai/models';
import { Harness, createRegistry, defineExtension, defineTask } from '@earendil-works/pi-durable';
import { openNodeSqliteStorage } from '@earendil-works/pi-durable/storage/sqlite/node';
import { verifyRealTask } from './real-task-support.mjs';

const owner = dirname(fileURLToPath(import.meta.url));
const run = process.argv[2];
const generation = Number(process.argv[3]);
const input = JSON.parse(readFileSync(join(run, 'input.json')));
const realTask = input.mode === 'real-task';
const deadlineRestartTrial = input.mode === 'timeout-restart';
const timeoutTrial = input.mode === 'timeout' || deadlineRestartTrial || input.mode === 'supervisor-crash';
const limitTrial = input.mode === 'retry-limit';
const combinedTrial = input.mode === 'feedback-crash' || limitTrial;
const feedbackTrial = input.mode === 'feedback' || combinedTrial || realTask;
const terminalProbe = process.argv[4] === '--inspect-terminal';
const workspace = input.workspace ?? join(run, 'workspace');
const cli = '/Applications/ChatGPT.app/Contents/Resources/codex-cli/CodexCLI.app/Contents/MacOS/codex';
const python = '/opt/homebrew/opt/python@3.14/bin/python3.14';
const event = (kind, data = {}) => appendFileSync(join(run, 'timeline.jsonl'), JSON.stringify({ at: new Date().toISOString(), kind, generation, pid: process.pid, ...data }) + '\n');
const json = (path, value) => writeFileSync(path, JSON.stringify(value, null, 2) + '\n');
const sha = path => createHash('sha256').update(readFileSync(path)).digest('hex');
const prompt = `Repair this deliberately broken disposable Homebase copy. Missing optional projects must be reported as MISSING but succeed; missing required projects must fail. Preserve wrong-link, directory-conflict, existing-target and valid-link behavior. Only edit scripts/_homebase.py. Run python3 -B -m unittest discover -s scripts/tests -v and ./scripts/health --portable, fixing any regression within that file. Do not edit tests, instructions, manifest or documentation. No commits, publication, tools outside the workspace, learning capture or user questions. A controller may interrupt you; continue the same job if resumed. Finish with a concise account of the fix and commands run.`;
const incompletePrompt = `This is the first stage of an authorized local fault-injection experiment. Produce a deliberately incomplete candidate so an independent verifier can exercise rejection. In run_check, change the failure aggregation to fail only when state.status is WRONG or CONFLICT. This intentionally handles optional absence but misses other cases. Only edit scripts/_homebase.py; do not alter inspect_link, tests, instructions or any other file. Do not complete the full repair or run checks in this first stage. Stop after the incomplete edit and describe it honestly as an incomplete candidate. The controller will run fixed checks and send the actual failures back in a later stage. No commits, publication, learning capture, tools outside the workspace or user questions.`;

async function code(runtime, checkpoint) {
  const previous = await runtime.memo('codex-session', context);
  const attempt = checkpoint.attempt;
  const label = feedbackTrial ? `attempt-${attempt}` : String(generation);
  let request = previous ? 'The local trial controller interrupted this job. Inspect the current files, finish the authorized repair and run the required checks. Same scope; no questions or external changes.' : prompt;
  if (timeoutTrial) {
    request = `This is an authorized local timeout test. Before editing the broken checker, execute exactly python3 -B stall.py in this workspace and wait for that command. It deliberately blocks and creates a child; the external controller owns the deadline and cleanup. Do not background, cancel, shorten, replace or bypass that command, and do not start another attempt. Do not edit stall.py, tests, instructions or any source before it finishes. The helper may write only its scratch marker under .trial-runtime. No questions, commits, learning capture or external actions. A stalled repair and failed timeout outcome are the intended test, not a completed fix.`;
    if (deadlineRestartTrial && previous) {
      request = `The controller intentionally killed the previous runner and ALL of its observed command processes at the original budget midpoint. The previous tool session is gone and cannot be resumed. This is continuation of the SAME repair attempt 1, not a verification retry. The original absolute deadline is still ${input.deadline_at_ms}; it has not reset. Start a FRESH foreground command now: python3 -B stall.py . Wait on this new command until the external controller kills it at that original deadline. Do not treat the unavailable old tool session as completion, and do not return a final answer instead of starting the fresh command. Do not edit source, change or bypass the helper, shorten its wait, background it, ask questions or take external actions. Only its ignored scratch marker may be written. The expected job result remains timeout failure.`;
    }
    writeFileSync(join(run, `prompt-generation-${generation}.txt`), request);
    if (generation === 1) writeFileSync(join(run, 'prompt-attempt-1.txt'), request);
  }
  if (feedbackTrial && !realTask) {
    request = attempt === 1 ? incompletePrompt : `The independent verification rejected your first candidate. The deliberate incomplete-candidate instruction is finished. Now repair the full behavior: optional missing targets succeed; required missing targets, wrong links, conflicts and missing connections to existing targets fail; correct links succeed. Only edit scripts/_homebase.py. Use the real verifier feedback below to diagnose and fix the problem, then run the existing tests and portable health check. Do not modify tests, checks or other files. No user questions or external changes.\n\n${JSON.stringify(checkpoint.feedback, null, 2)}`;
    if (limitTrial && attempt === 2) {
      request = `This is the final candidate of an authorized local retry-exhaustion fault-injection experiment. The first candidate was rejected by the real verifier; its saved failure feedback is below. Deliberately make a different but still incomplete repair: in run_check use precisely the failure aggregation rule state.status not in {"OK"}. This fixes the first candidate's missing-required cases but still incorrectly fails missing optional targets. Do not complete the full repair. Only edit scripts/_homebase.py; do not edit tests, checks, inspect_link or other files. Stop after submitting this incomplete candidate, describe its remaining limitation honestly, and do not run checks yourself in this stage; the external verifier owns the result. No user questions, publication or other actions.\n\n${JSON.stringify(checkpoint.feedback, null, 2)}`;
    }
    writeFileSync(join(run, `prompt-attempt-${attempt}.txt`), request);
  }
  if (realTask) {
    request = input.prompt + (checkpoint.feedback ? `\n\nThe external verification rejected the previous candidate. Use this actual feedback to finish the same authorized task:\n${JSON.stringify(checkpoint.feedback, null, 2)}` : '');
    writeFileSync(join(run, `prompt-attempt-${attempt}.txt`), request);
  }
  const args = ['-c', 'approval_policy="never"', '-c', 'sandbox_mode="workspace-write"', 'exec'];
  if (previous) args.push('resume');
  args.push('--ignore-user-config', '--json');
  if (!previous) args.push('--sandbox', 'workspace-write');
  if (previous) args.push(previous, request);
  else args.push(request);
  event('codex-start', { attempt, resumed: Boolean(previous), session: previous ?? null, args });
  const child = spawn(cli, args, { cwd: workspace, detached: true, stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, CALLUM_LEARNING_WORKER: '1', PYTHONDONTWRITEBYTECODE: '1' } });
  json(join(run, 'child.json'), { pid: child.pid, generation });
  event('codex-process', { attempt, pid: child.pid });
  const closed = new Promise((resolve, reject) => { child.once('error', reject); child.once('close', (code, signal) => resolve({ code, signal })); });
  child.stderr.on('data', bytes => appendFileSync(join(run, `codex-${label}.stderr.log`), bytes));
  const lines = createInterface({ input: child.stdout });
  for await (const line of lines) {
    appendFileSync(join(run, `codex-${label}.jsonl`), line + '\n');
    let item;
    try { item = JSON.parse(line); } catch { continue; }
    if (item.type === 'thread.started') {
      const saved = await runtime.memo('codex-session', item.thread_id, context);
      if (previous && saved !== item.thread_id) throw new Error('Resume changed session identity');
      json(join(run, 'codex-session.json'), { session: saved });
      event('codex-session', { attempt, session: saved, resumed: Boolean(previous) });
    }
  }
  const outcome = await closed;
  event('codex-exit', { attempt, ...outcome });
  if (outcome.code !== 0) throw new Error(`Codex failed: ${JSON.stringify(outcome)}`);
}

async function expire(task, runtime) {
  if (!input.deadline_at_ms || Date.now() < input.deadline_at_ms) return false;
  const detail = { reason: 'time_limit_exceeded', attempts: task.state.checkpoint.attempt,
    max_attempts: input.max_attempts, budget_seconds: input.budget_seconds,
    admitted_at_ms: input.admitted_at_ms, deadline_at_ms: input.deadline_at_ms, failed_at_ms: Date.now(),
    session_id: await runtime.memo('codex-session', context) ?? null, last_checkpoint: task.state.checkpoint,
    candidate_sha256: sha(join(workspace, 'scripts/_homebase.py')),
    cleanup: existsSync(join(run, 'timeout-cleanup.json')) ? JSON.parse(readFileSync(join(run, 'timeout-cleanup.json'))) : null,
    evidence: ['input.json', 'candidate-at-timeout.py', 'patch-at-timeout.diff', 'codex-1.jsonl', 'timeout-cleanup.json', 'stall-at-timeout.json',
      ...deadlineRestartTrial ? ['codex-2.jsonl', 'stall-before-restart.json', 'restart-cleanup.json', 'recovered-task-2.json', 'runner-deadline-2.json'] : [],
      ...input.mode === 'supervisor-crash' ? ['owned-processes.json', 'supervisor-recovered.json', 'orphan-observation.json', 'orphan-at-expiry.json'] : []] };
  await runtime.commit(() => ({ status: 'terminal', outcome: { status: 'failed', error: {
    message: `Time limit exceeded (${input.budget_seconds} seconds); no further repair attempt is permitted.`, detail } } }), context);
  event('deadline-failed', { id: task.id, reason: detail.reason, attempts: detail.attempts, deadline_at_ms: detail.deadline_at_ms });
  return true;
}

const job = defineTask({
  name: 'trial.codex-repair', version: 1, initial: () => ({ phase: 'code', attempt: 1 }),
  phases: {
    code: async (task, runtime) => {
      if (await expire(task, runtime)) return;
      event('phase', { phase: 'code', checkpoint: task.state.checkpoint });
      await code(runtime, task.state.checkpoint);
      await runtime.commit(() => ({ status: 'pending', checkpoint: { ...task.state.checkpoint, phase: 'verify' } }), context);
    },
    verify: async (task, runtime) => {
      if (await expire(task, runtime)) return;
      const attempt = task.state.checkpoint.attempt;
      event('phase', { phase: 'verify', attempt });
      if (realTask) {
        const { report, feedback } = verifyRealTask(run, attempt);
        if (await expire(task, runtime)) return;
        event('verified', report);
        if (!report.passed && report.scope_preserved && report.index_preserved && report.external_verifier_unchanged && attempt < input.max_attempts) {
          json(join(run, `feedback-attempt-${attempt}.json`), feedback);
          await runtime.commit(() => ({ status: 'pending', checkpoint: { phase: 'code', attempt: attempt + 1, feedback } }), context);
          json(join(run, `retry-checkpoint-${attempt + 1}.json`), await runtime.getTask(task.id, context));
          event('verification-retry', { from_attempt: attempt, to_attempt: attempt + 1 });
          return;
        }
        const session = await runtime.memo('codex-session', context);
        await runtime.commit(() => ({ status: 'terminal', outcome: report.passed
          ? { status: 'completed', result: { ...report, session_id: session } }
          : { status: 'failed', error: { message: 'Real task did not pass independent verification', detail: {
            reason: attempt >= input.max_attempts ? 'retry_limit_exhausted' : 'verification_failed', attempts: attempt,
            session_id: session, verification: report, feedback } } } }), context);
        return;
      }
      const candidateHash = sha(join(workspace, 'scripts/_homebase.py'));
      writeFileSync(join(run, `candidate-attempt-${attempt}.py`), readFileSync(join(workspace, 'scripts/_homebase.py')));
      const acceptance = spawnSync(python, ['-B', join(owner, 'verify.py'), workspace], { encoding: 'utf8', timeout: 90000 });
      writeFileSync(join(run, 'acceptance-final.json'), acceptance.stdout);
      writeFileSync(join(run, `acceptance-attempt-${attempt}.json`), acceptance.stdout);
      const health = spawnSync(python, ['-B', join(workspace, 'scripts/health'), '--portable'], { cwd: workspace, encoding: 'utf8', timeout: 120000, env: { ...process.env, PYTHONDONTWRITEBYTECODE: '1' } });
      writeFileSync(join(run, 'health-final.log'), health.stdout + health.stderr);
      writeFileSync(join(run, `health-attempt-${attempt}.log`), health.stdout + health.stderr);
      if (await expire(task, runtime)) return;
      const patch = spawnSync('git', ['diff', '--', 'scripts/_homebase.py'], { cwd: workspace, encoding: 'utf8' });
      writeFileSync(join(run, 'fix.patch'), patch.stdout);
      writeFileSync(join(run, `fix-attempt-${attempt}.patch`), patch.stdout);
      const changed = spawnSync('git', ['diff', '--name-only'], { cwd: workspace, encoding: 'utf8' }).stdout.trim().split('\n');
      const status = spawnSync('git', ['status', '--porcelain', '--untracked-files=all'], { cwd: workspace, encoding: 'utf8' });
      const oracleUnchanged = sha(join(owner, 'verify.py')) === input.oracle_sha256;
      const artifactUnchanged = candidateHash === sha(join(workspace, 'scripts/_homebase.py'));
      const report = { attempt, acceptance_exit: acceptance.status, health_exit: health.status, changed,
        workspace_status: status.stdout, oracle_unchanged: oracleUnchanged, artifact_unchanged_during_verification: artifactUnchanged,
        fixed_sha256: sha(join(workspace, 'scripts/_homebase.py')), oracle_sha256: sha(join(owner, 'verify.py')),
        passed: acceptance.status === 0 && health.status === 0 && patch.stdout.length > 0 && changed.length === 1 && changed[0] === 'scripts/_homebase.py' && status.status === 0 && status.stdout.trim() === 'M scripts/_homebase.py' && oracleUnchanged && artifactUnchanged };
      json(join(run, 'verification.json'), report);
      json(join(run, `verification-attempt-${attempt}.json`), report);
      event('verified', report);
      if (feedbackTrial && !report.passed && oracleUnchanged && artifactUnchanged && status.stdout.trim() === 'M scripts/_homebase.py' && attempt < input.max_attempts) {
        let acceptanceReport;
        try { acceptanceReport = JSON.parse(acceptance.stdout); } catch { acceptanceReport = { stderr: acceptance.stderr, stdout: acceptance.stdout }; }
        const feedback = { rejected_candidate_sha256: candidateHash, verification: report,
          acceptance: acceptanceReport, health_log_tail: (health.stdout + health.stderr).slice(-8000) };
        json(join(run, `feedback-attempt-${attempt}.json`), feedback);
        const next = { phase: combinedTrial ? 'repair-ready' : 'code', attempt: attempt + 1, feedback };
        await runtime.commit(() => ({ status: 'pending', checkpoint: next }), context);
        json(join(run, `retry-checkpoint-${attempt + 1}.json`), await runtime.getTask(task.id, context));
        event('verification-retry', { from_attempt: attempt, to_attempt: attempt + 1, rejected_candidate_sha256: candidateHash });
        return;
      }
      const exhausted = feedbackTrial && !report.passed && attempt >= input.max_attempts;
      let failedDetail;
      if (!report.passed) {
        let finalAcceptance;
        try { finalAcceptance = JSON.parse(acceptance.stdout); } catch { finalAcceptance = { stdout: acceptance.stdout, stderr: acceptance.stderr }; }
        failedDetail = { reason: exhausted ? 'retry_limit_exhausted' : 'verification_failed', attempts: attempt,
          max_attempts: input.max_attempts, session_id: await runtime.memo('codex-session', context),
          first_rejection: task.state.checkpoint.feedback ?? null, last_verification: report,
          final_acceptance: finalAcceptance, health_log_tail: (health.stdout + health.stderr).slice(-8000),
          evidence: Array.from({ length: attempt }, (_, index) => {
            const number = index + 1;
            return { candidate: `candidate-attempt-${number}.py`, patch: `fix-attempt-${number}.patch`,
              acceptance: `acceptance-attempt-${number}.json`, health: `health-attempt-${number}.log`, verification: `verification-attempt-${number}.json` };
          }) };
      }
      const outcome = report.passed ? { status: 'completed', result: report } : { status: 'failed', error: {
        message: exhausted ? `Retry limit exhausted after ${attempt} attempts; independent verification still fails.` : 'Independent completion checks failed',
        detail: failedDetail } };
      await runtime.commit(() => ({ status: 'terminal', outcome }), context);
    },
    'repair-ready': async (task, runtime) => {
      if (await expire(task, runtime)) return;
      const checkpoint = task.state.checkpoint;
      event('phase', { phase: 'repair-ready', attempt: checkpoint.attempt });
      if (combinedTrial && generation === 1) {
        // Fault-injection boundary: hold before any repair call; the external supervisor kills this process.
        const record = await runtime.getTask(task.id, context);
        if (existsSync(join(run, 'prompt-attempt-2.txt'))) throw new Error('Repair began before the crash boundary');
        event('feedback-durable-before-crash', { id: task.id, attempt: checkpoint.attempt });
        json(join(run, 'feedback-crash-ready.json'), { task: record,
          rejected_candidate_sha256: sha(join(workspace, 'scripts/_homebase.py')), repair_started: false });
        await new Promise(resolve => {
          const hold = setInterval(() => {}, 1000);
          runtime.signal.addEventListener('abort', () => { clearInterval(hold); resolve(); }, { once: true });
        });
        return;
      }
      await runtime.commit(() => ({ status: 'pending', checkpoint: { ...checkpoint, phase: 'code' } }), context);
      event('feedback-restored', { id: task.id, attempt: checkpoint.attempt,
        rejected_candidate_sha256: checkpoint.feedback.rejected_candidate_sha256 });
    },
  },
  abort: async (_task, runtime) => runtime.commit(() => ({ status: 'terminal', outcome: { status: 'aborted' } }), context),
});

const registry = createRegistry();
registry.install(defineExtension({ name: 'trial', tasks: [job] }));
const harness = await Harness.open(await openNodeSqliteStorage(join(run, 'state.sqlite')), { models: createModels(), registry }, context);
const root = await harness.root(context);
let id;
if (generation === 1) {
  id = await root.commit(tx => tx.createTask(job, {}, { ownership: { kind: 'conversation' } }), context);
  json(join(run, 'job.json'), { id });
} else {
  id = JSON.parse(readFileSync(join(run, 'job.json'))).id;
  if (!terminalProbe) {
    const recovered = await harness.getTask(id, context);
    json(join(run, 'recovered-task.json'), recovered);
    json(join(run, `recovered-task-${generation}.json`), recovered);
    json(join(run, 'recovered-workspace.json'), { candidate_sha256: sha(join(workspace, 'scripts/_homebase.py')) });
    event('recovered-task', { id });
  }
}
const openedAt = Date.now();
const deadlineReceipt = { generation, admitted_at_ms: input.admitted_at_ms, deadline_at_ms: input.deadline_at_ms,
  observed_at_ms: openedAt, remaining_ms: input.deadline_at_ms - openedAt };
json(join(run, `runner-deadline-${generation}.json`), deadlineReceipt);
event('runner-deadline', deadlineReceipt);
if (terminalProbe) {
  const before = await harness.getTask(id, context);
  if (before?.state.status !== 'terminal') throw new Error('Terminal probe found live work');
  event('terminal-reopened', { id, status: before.state.outcome.status });
  harness.resume();
  await harness.waitForIdle(context);
  const after = await harness.getTask(id, context);
  const inspection = await harness.inspect(context);
  json(join(run, 'terminal-reopen.json'), { before, after, inspection });
  event(realTask ? 'terminal-unchanged' : 'terminal-still-failed', { id, status: after.state.outcome.status });
  await harness.close(context);
  process.exit(after.state.outcome.status === 'failed' ? 1 : 0);
}
event('runner-open', { id });
harness.resume();
try {
  const settled = await harness.waitForTask(id, context);
  json(join(run, 'settled.json'), settled);
  event('settled', { id, state: settled.state });
  if (settled.state.outcome.status === 'failed') {
    json(join(run, 'job-outcome.json'), { status: 'failed', passed: false,
      message: settled.state.outcome.error.message, ...settled.state.outcome.error.detail });
  }
  await harness.close(context);
  process.exitCode = settled.state.outcome.status === 'completed' ? 0 : 1;
} catch (error) {
  event('runner-error', { message: String(error) });
  await harness.close(context);
  process.exitCode = 1;
}
