# Retry exhaustion reports a failed repair job

**The repair job failed and stopped at its limit.** Local controlled run on 19 October 2026, 12:21:02–12:21:42 Brisbane time; 40.207 seconds through reopening the failed task. Both agent-authored candidates were deliberately constrained to stay incorrect. The verifier itself was unchanged and its failures were genuine. No human intervention occurred after launch.

## Observed candidates

| Candidate | External acceptance | Existing tests | Job decision |
| --- | --- | --- | --- |
| First, intentionally incomplete | 5/8 passed | 24/26 passed; health exit 1 | Reject and permit one retry |
| Second, changed but still incomplete | 6/8 passed | 25/26 passed; health exit 1 | Reject and stop; limit reached |

The first candidate incorrectly succeeded for required absent/dangling targets and an existing target lacking its connection. Its [failures](runs/2026-10-19T02-21-01.249Z/acceptance-attempt-1.json) were saved, the runner was killed, and the same Pi task/Codex session recovered them as in the combined trial. The second candidate corrected those cases but incorrectly failed optional absent/dangling targets: [second verification](runs/2026-10-19T02-21-01.249Z/acceptance-attempt-2.json). The acceptance reports show the actual and expected exit codes; these are behavior failures, not transport or permissions errors. Both Codex invocations themselves exited 0, so the completion decision came from independent verification.

## Failure report and hard stop

The [job result](runs/2026-10-19T02-21-01.249Z/result.json) and [failure summary](runs/2026-10-19T02-21-01.249Z/job-outcome.json) report:

```json
{
  "passed": false,
  "status": "failed",
  "reason": "retry_limit_exhausted",
  "attempts": 2,
  "max_attempts": 2,
  "message": "Retry limit exhausted after 2 attempts; independent verification still fails."
}
```

The resumed coding worker exited **1** after committing [terminal Pi failure](runs/2026-10-19T02-21-01.249Z/settled.json); the top-level `node trial.mjs --retry-limit` command also exited **1**, as observed by the execution host. No accepted fix or completed job was recorded. `limit-proof.json` separately reports that the test of this stop behavior passed; it is not a successful repair result.

The [full timeline](runs/2026-10-19T02-21-01.249Z/timeline.jsonl) has exactly two coding starts, two failed verification results and one retry transition. It has no completed outcome. There are no attempt-three prompt, Codex log, candidate, verification or retry-checkpoint files.

## Reopen and evidence preservation

After failure, the controller started a third runner **only to reopen and inspect the terminal task**, with scheduling enabled. It launched no Codex request. [Reopen evidence](runs/2026-10-19T02-21-01.249Z/terminal-reopen.json) shows an identical failed task before and after and zero live tasks. The probe returned exit 1. [Stop assertions](runs/2026-10-19T02-21-01.249Z/limit-proof.json) record the observed guard checks.

Terminal Pi records in the installed 1.3.0 package do not retain live task memos. The implementation therefore puts durable failure diagnostics in `outcome.error.detail`. The reopened task retains the original rejection, the final failed acceptance cases, verification status, hashes, limits and evidence filenames. Assertions compare these against the actual reports after reopening.

Retained artifacts:

- Rejected [first patch](runs/2026-10-19T02-21-01.249Z/fix-attempt-1.patch) and [second patch](runs/2026-10-19T02-21-01.249Z/fix-attempt-2.patch), plus complete candidate snapshots `candidate-attempt-1.py` and `candidate-attempt-2.py`.
- Independent [first health output](runs/2026-10-19T02-21-01.249Z/health-attempt-1.log) and [second health output](runs/2026-10-19T02-21-01.249Z/health-attempt-2.log), acceptance reports and per-attempt verification JSON.
- [Saved feedback](runs/2026-10-19T02-21-01.249Z/feedback-attempt-1.json), [recovered retry state](runs/2026-10-19T02-21-01.249Z/recovered-task.json), prompts and separate Codex logs for each candidate.
- SQLite `state.sqlite`, [frozen source](runs/2026-10-19T02-21-01.249Z/source/) and [evidence hashes](runs/2026-10-19T02-21-01.249Z/SHA256.json).

The first candidate hash is `006f4ba0e7097a6ae458d37e145579a6419dff279ff10711e40c7e03a4fef749`; the different second candidate is `46b3179d7903bdb9e8ce1d6e57a40bcee2f093075eb3b7ca3086c7014d2b5e18`. Neither was accepted. The oracle remained `63a8ebf449de340664b51fa0767f166dcb02da7c4d2e83fe9bf2742dc41958fd`.

## Positive control and limits

The same updated runner was then run with `--feedback-crash`, allowing a genuine second repair. That separate [positive-control result](runs/2026-10-19T02-22-16.641Z/result.json) reports success with 8/8 acceptance cases and the [26-test portable health gate](runs/2026-10-19T02-22-16.641Z/health-final.log), and the command exited 0. This checks that failure reporting is not unconditional.

Run `npm run trial -- --retry-limit` to repeat the expected failing job. A shell should receive exit 1; do not reinterpret it as a successful repair because the stop test behaved as intended. The two-candidate limit survives the injected restart, and reopening this terminal task does not reset it. A new invocation creates a different disposable job; this test does not prohibit a separately authorized new job.

This establishes one controlled exhausted retry path with real checks, crash recovery and terminal reopen. It does not prove arbitrary failures, time-budget expiry, machine-reboot behavior or external side-effect handling.

Updated `trial.mjs`, `worker.mjs`, `README.md`, this report, the combined report's later-proof pointer and the owner `LOG.md` remain local and uncommitted in the shared Agents checkout. Live Homebase and global runtime settings are unchanged. The intentionally failing artifacts are retained as evidence; there is no pending live fix or active trial handoff.

A later [timeout test](TIMEOUT-EVIDENCE.md) separately verifies a deliberately stalled repair, process-tree cleanup, terminal time-limit failure and no further coding call after expiry. This report retains its retry-count scope.
