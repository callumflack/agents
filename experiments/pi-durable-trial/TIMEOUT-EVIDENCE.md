# Stalled repair stops at its time limit

Later proof: the [active-restart deadline trial](DEADLINE-RESTART-EVIDENCE.md) kills the stalled runner and its observed tree halfway through the budget, resumes the same task/session/attempt before expiry, and observes timeout at the original deadline. It preserves its rejected initial run separately. The historical timeout run below is unchanged.

**The repair job timed out, stopped and reported failure.** One local controlled run on 19 October 2026. The test shortened the whole-job budget to 60 seconds; the normal budget remains ten minutes. A real Codex repair command executed `python3 -B stall.py`, which waited on a real Python child sleeping for 600 seconds. No parent-chat or human intervention occurred after launch.

## Observed timeline

- The absolute admission time and deadline were recorded once in [input.json](runs/2026-10-19T02-30-21.938Z/input.json), with `budget_seconds: 60` and two attempts available.
- [Stall evidence](runs/2026-10-19T02-30-21.938Z/stall-at-timeout.json) records helper PID 25810, child PID 25811 and their start time. The helper and child occupied a different process group from Codex, so killing only Codex's group would not cover them.
- At 12:31:22 Brisbane, the watchdog observed the deadline, 14 ms after its stored deadline. It saved the stalled source snapshot, diff and OS process ancestry before issuing SIGKILL.
- [Cleanup evidence](runs/2026-10-19T02-30-21.938Z/timeout-cleanup.json) records five observed processes: the runner, Codex, its code-mode host, the Python helper and its child. Each received SIGKILL. The first cleanup observation saw four absent and the exited runner briefly in zombie state while awaiting reaping. A later [process audit](runs/2026-10-19T02-30-21.938Z/process-audit.json) checks all those PIDs are absent, as well as the supervisor and subsequent administrative runners.
- A replacement runner reopened task 7, with the original absolute deadline already expired. The phase guard committed [terminal timeout failure](runs/2026-10-19T02-30-21.938Z/settled.json) before calling Codex again. A further [terminal reopen](runs/2026-10-19T02-30-21.938Z/terminal-reopen.json), with scheduling enabled, preserved the identical failed state and deadline and reported zero live tasks.
- Reopening checks finished at 12:31:23, 60.754 seconds after admission. Cleanup and failure settlement were administrative work after the repair deadline, not another coding attempt.

## Failed job result

The [controller result](runs/2026-10-19T02-30-21.938Z/result.json) and [job outcome](runs/2026-10-19T02-30-21.938Z/job-outcome.json) report:

```json
{
  "passed": false,
  "status": "failed",
  "reason": "time_limit_exceeded",
  "budget_seconds": 60,
  "attempts": 1,
  "max_attempts": 2,
  "processes_stopped": true
}
```

The controller, timeout-finalization worker and terminal-reopen probe all returned exit **1**. The separately saved [timeout-proof.json](runs/2026-10-19T02-30-21.938Z/timeout-proof.json) says the test of timeout handling passed; it does not mark the repair successful.

The [full timeline](runs/2026-10-19T02-30-21.938Z/timeline.jsonl) records exactly one Codex start and zero verification retries. Assertions prohibit any further coding start after the deadline event. There are no second-attempt prompt, Codex log, candidate or verification files and no completed task outcome. The remaining retry allowance was not used or reset by reopening the task.

## Preserved evidence

The run retains [partial Codex events](runs/2026-10-19T02-30-21.938Z/codex-1.jsonl), stderr, the prompt, the original failed acceptance baseline, `candidate-at-timeout.py`, `patch-at-timeout.diff`, the stall marker, process metadata and signals, recovered task/workspace snapshots, SQLite `state.sqlite`, and the failed terminal record. The source was not edited before the stall, so the saved diff is correctly empty; no fix was accepted or claimed as verified.

The failed outcome's `error.detail` retains the original deadline, session identity, last checkpoint, candidate hash and cleanup report after live memos are retired. Reopening checks compare it against the original terminal failure. [Frozen implementation](runs/2026-10-19T02-30-21.938Z/source/) and [evidence hashes](runs/2026-10-19T02-30-21.938Z/SHA256.json) preserve the implementation and results used.

The independent verifier is unchanged at SHA-256 `63a8ebf449de340664b51fa0767f166dcb02da7c4d2e83fe9bf2742dc41958fd`. The current live Homebase checker still matches the captured original. Only the disposable trial fixture includes the stall helper and ignored scratch marker.

## Positive control and limits

The same updated implementation then completed a valid `--feedback-crash` repair: [positive-control result](runs/2026-10-19T02-31-47.302Z/result.json), 8/8 acceptance cases, [26 passing existing tests](runs/2026-10-19T02-31-47.302Z/health-final.log), command exit 0. Its input retains the normal 600-second budget. This checks that deadline handling does not simply reject every job.

Run `npm run trial -- --timeout` to repeat this expected failed job. A shell receives exit 1. The same deadline watcher is used for all modes; only the test budget and deliberate stall are selected by `--timeout`. Absolute times are persisted in the input file and copied into terminal failure diagnostics, so runner reopening does not start a fresh budget.

This proves the observed 60-second deadline and cleanup of the processes descended from the running trial. It does not establish machine-power-loss handling, clock jumps, every race with newly spawned processes, unrelated or already-daemonized processes, or external provider cancellation. No permanent restart service, schedule or provider change was introduced.

Updated `trial.mjs`, `worker.mjs`, the focused `processes.mjs` process helper, the timeout-only `stall.py` fault, README, this report, the retry-limit report's later-proof pointer and the owner LOG remain local and uncommitted in the shared Agents checkout. No live repair or active trial handoff remains.
