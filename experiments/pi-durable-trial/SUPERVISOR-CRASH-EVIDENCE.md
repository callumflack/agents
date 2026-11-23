# Supervisor death preserves the deadline and cleans up orphans

Later proof: [recovery after the original deadline](LATE-RESTART-EVIDENCE.md) keeps both controllers dead past expiry, then checks immediate orphan cleanup and unchanged timeout failure on restart. The historical run below is unchanged.

Observed locally on 19 October 2026 in the shared Agents checkout, `/Users/callumflack/Repos/callumflack/agents/experiments/pi-durable-trial`. The test of crash recovery and timeout handling passed. The repair job correctly remained **failed**, `time_limit_exceeded`, exit **1**. No user intervention or source change occurred after the successful run was admitted.

Run: [2026-10-19T03-44-54.621Z](runs/2026-10-19T03-44-54.621Z/input.json). The [raw proof](runs/2026-10-19T03-44-54.621Z/supervisor-crash-proof.json), [timeline](runs/2026-10-19T03-44-54.621Z/timeline.jsonl) and [preserved source](runs/2026-10-19T03-44-54.621Z/source/) support the account below.

## Actual crash and recovery

| Boundary | Time from original admission | Observation |
| --- | ---: | --- |
| Admission | 0 ms | Original input: admitted `1792381495438`, deadline `1792381555438`, 60-second budget |
| SIGKILL supervisor and runner | 30,007 ms | Supervisor PID 68933 and runner PID 68989 killed; repair descendants deliberately left alive |
| Replacement supervisor opens saved run | 32,194 ms | New PID 69753; original deadline, **27,806 ms remaining** |
| Original deadline observed | 60,001 ms | **1 ms late**; no fresh budget from restart |
| Cleanup observed stopped | 60,697 ms | Recorded repair processes absent, including the original stalled helper and child |

Before the crash, the supervisor saved an [ownership ledger](runs/2026-10-19T03-44-54.621Z/owned-processes.json) containing five observed runner-tree processes, each with PID, OS start time, process group and executable. It also saved the original admission/deadline and input-file hash. The fault driver then killed **only the supervisor and runner**, with SIGKILL; see [injected crash](runs/2026-10-19T03-44-54.621Z/injected-crash.json) and [supervisor exit](runs/2026-10-19T03-44-54.621Z/supervisor-1.exit.json).

After a two-second gap, [OS observation](runs/2026-10-19T03-44-54.621Z/orphan-after-crash.json) confirmed that both old controllers were absent while Codex, its code-mode host, the Python helper and sleeping child survived. Codex was reparented to PID 1. The replacement [recovered supervisor](runs/2026-10-19T03-44-54.621Z/supervisor-recovered.json) read the existing input and ledger from disk, checked identities and watched those same orphaned processes until the original absolute deadline. It did not replay the command or start another coding invocation.

The external driver remained alive only to inject the crash, restart the supervisor and await its result. It did not enforce the successful run's repair deadline or perform its cleanup. Its separate 20-second post-deadline test-failure guard was not reached. No permanent supervisor, service or schedule was installed.

## Orphan cleanup and the exit race

The [expiry observation](runs/2026-10-19T03-44-54.621Z/orphan-at-expiry.json) verifies that the **original** helper and child were still alive at expiry, with their original identities. The [cleanup report](runs/2026-10-19T03-44-54.621Z/timeout-cleanup.json) records the actual signals, skipped signals, original and current process metadata, and final states.

SIGKILL was sent to the child and Codex. The helper exited after its child was killed, while the code-mode host also disappeared during cleanup. The helper briefly appeared with OS state `?s` and executable text `(Python)` rather than its previous executable path. Cleanup refused to signal that changed identity, continued cleaning other matching processes and required every recorded PID to have stopped. All five ledger PIDs were absent at the cleanup observation. This observed transition explains why treating only explicit zombie state as already exited was insufficient.

Live PID identity mismatches at recovery are refused. Each individual signal also requires a fresh identity match; changed identities are never signalled. Cleanup cannot report success merely because it skipped a process: all recorded PIDs must be absent or exited before settlement, and the final audit requires absence. The [stale-identity control](runs/2026-10-19T03-44-54.621Z/identity-guard.json) left a real sleeping test process alive after refusing stale identity data, then successfully stopped it using matching identity. Three [real waiting-parent/child cleanup checks](runs/2026-10-19T03-44-54.621Z/exit-race-check.json) also passed. Their rerunnable scripts are preserved in the same run.

## No replay, retry or success claim

The replacement opened SQLite only **after** orphan cleanup. It recovered the same [Pi task 7 and code/attempt-1 checkpoint](runs/2026-10-19T03-44-54.621Z/recovered-task-2.json), including Codex session memo `01a15243-2a5e-7901-86c0-42ab98ed3372`. The existing deadline guard expired the task before entering the coding function.

The [failed job outcome](runs/2026-10-19T03-44-54.621Z/job-outcome.json), [controller result](runs/2026-10-19T03-44-54.621Z/result.json) and [settled task](runs/2026-10-19T03-44-54.621Z/settled.json) agree on failure, original deadline, attempt **1** and limit **2**. [Terminal reopening](runs/2026-10-19T03-44-54.621Z/terminal-reopen.json), with scheduling enabled, preserved the identical failed record and found zero live tasks. Settlement worker, terminal probe, replacement supervisor and fault driver returned exit **1**.

The timeline records exactly **one coding launch**, zero verification retries and zero coding after timeout, including all recovery/probe generations. There is no second-attempt prompt, candidate or verification artifact and no completed outcome. The stalled source remains the original rejected seed, with its timeout snapshot and correctly empty patch preserved. The separate proof receipt reports a passed stop test, not a successful repair.

## Preserved failures

Two rejected runs preceded the successful fresh run:

- [03:40:28 run](runs/2026-10-19T03-40-28.005Z/supervisor-crash-proof.json): reached the original deadline, then aborted the cleanup loop when the waiting helper's identity changed during exit. [Supervisor stderr](runs/2026-10-19T03-40-28.005Z/supervisor-2.stderr.log) preserves the assertion. [Fallback cleanup](runs/2026-10-19T03-40-28.005Z/emergency-cleanup.json) stopped the remaining Codex process. It did not settle the intended timeout result, so the test stayed failed.
- [03:42:33 run](runs/2026-10-19T03-42-33.252Z/supervisor-crash-proof.json): explicit zombie handling alone was insufficient; the same exit transition still stopped cleanup. Its [stderr](runs/2026-10-19T03-42-33.252Z/supervisor-2.stderr.log), [fallback cleanup](runs/2026-10-19T03-42-33.252Z/emergency-cleanup.json), source snapshot and failed proof remain intact.

The first assertions did not preserve the exact intermediate process state; the successful run's conservative refusal record supplied that missing observation. The final repair handles changes during the signal walk without weakening the pre-signal identity requirement, and requires all recorded processes to stop. The successful run began anew with fixed source and ran through without intervention. Neither rejected run was relabelled as a pass.

## Reproduction and proof boundary

The final implementation also completed a valid `--feedback-crash` repair: [control result](runs/2026-10-19T03-46-03.966Z/result.json), [8/8 acceptance cases](runs/2026-10-19T03-46-03.966Z/acceptance-final.json), [26 existing tests](runs/2026-10-19T03-46-03.966Z/health-final.log), controller exit 0. The control retains the normal 600-second budget. Node syntax and Python AST checks passed; this experiment has no formatter/linter/IDE diagnostics integration.

Run `node supervisor-crash.mjs` from the experiment root. Expected shell exit is **1**, because the repair job fails. The existing-run recovery entry is `node trial.mjs --resume-supervisor <run-directory>`; the test invokes it automatically. Rerun the frozen audit with `node <run-directory>/source/supervisor-crash.mjs --audit <run-directory>`.

The run preserves partial Codex events, original input, immutable process ledger, crash and reparenting observations, recovery receipt, timeout source/diff, cleanup signals, SQLite, failed terminal records, source snapshots and a SHA-256 evidence manifest. The verifier remains unchanged at `63a8ebf449de340664b51fa0767f166dcb02da7c4d2e83fe9bf2742dc41958fd`. The live Homebase checker matches its captured original; only disposable fixtures contain the seeded bug and stall helper.

This proves this local supervisor-and-runner crash, two-second supervision gap, recovery before expiry, observed orphan cleanup and unchanged timeout failure. The replacement enforces a file-persisted absolute deadline; Pi supplies task persistence and the adapter supplies OS ownership/cleanup. The test does not establish recovery without an external restart, restart after an already-expired deadline, reboot/power loss, clock jumps, every spawn/PID-reuse race, daemonized descendants or remote provider cancellation. PID/start-time comparison is an OS metadata check, not an atomic kernel process handle. The normal budget remains ten minutes; this test shortens it to one minute.

Updated trial/worker/process code, new focused recovery and crash-driver modules, README, evidence reports and owner LOG remain **local and uncommitted** in the shared Agents checkout. No live Homebase, provider, installation, hook, service, schedule or publication changes were made.
