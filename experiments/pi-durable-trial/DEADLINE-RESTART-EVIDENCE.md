# Original deadline survives a stalled repair restart

Later proof: the [supervisor-crash trial](SUPERVISOR-CRASH-EVIDENCE.md) additionally kills the supervisor and runner, leaves repair descendants orphaned, restarts supervision from persisted identities, and observes the original deadline and orphan cleanup. The earlier run below is unchanged.

Observed locally on 19 October 2026 in the shared Agents checkout, `/Users/callumflack/Repos/callumflack/agents/experiments/pi-durable-trial`. The test of timeout handling passed; the repair job correctly remained **failed**. No user intervention occurred between launch and its terminal probe.

This test deliberately kills the runner **and its observed descendants** at the midpoint to avoid overlapping repair processes. The replacement resumes the same Pi task, Codex session and attempt, but starts a fresh helper command because the original command was killed. This proves deadline preservation across an active restart with process cleanup; it does not prove reattachment to a command left alive after a runner-only crash.

## Observed timing

Run: [2026-10-19T03-20-51.655Z](runs/2026-10-19T03-20-51.655Z/input.json). Its persisted budget is 60 seconds; other modes retain ten minutes.

| Boundary | Time from original admission | Evidence |
| --- | ---: | --- |
| Admission | 0 ms | [Original input](runs/2026-10-19T03-20-51.655Z/input.json), admission `1792380052227`, deadline `1792380112227` |
| SIGKILL during first real stall | 30,014 ms | [Timeline](runs/2026-10-19T03-20-51.655Z/timeline.jsonl), [first stall](runs/2026-10-19T03-20-51.655Z/stall-before-restart.json), [first tree cleanup](runs/2026-10-19T03-20-51.655Z/restart-cleanup.json) |
| Replacement reads original deadline | 30,331 ms | [Generation 2 receipt](runs/2026-10-19T03-20-51.655Z/runner-deadline-2.json): **29,669 ms remaining** |
| Deadline observed | 60,020 ms | Timeline `deadline-exceeded`: **20 ms late**, rather than another minute after restart |
| Timeout tree observed stopped | 60,234 ms | [Second tree cleanup](runs/2026-10-19T03-20-51.655Z/timeout-cleanup.json), timeline `timeout-processes-stopped` |

The [independent audit](runs/2026-10-19T03-20-51.655Z/independent-audit.json) reads the saved raw events, both Codex transcripts, task records and the live OS process table. Its [rerunnable script](runs/2026-10-19T03-20-51.655Z/audit.mjs) checks the original 60-second interval, midpoint crash, same session/attempt, all four generations' deadline receipts, timing at expiry and terminal state. The trial itself also requires the original `input.json` bytes to remain unchanged.

## Same work, remaining time

The replacement recovered [Pi task 7](runs/2026-10-19T03-20-51.655Z/recovered-task-2.json) with checkpoint `code`, attempt **1**, and memo identifying Codex session `01a1522d-242b-7c92-a3cb-8fd7a1e1b53b`. Both [first](runs/2026-10-19T03-20-51.655Z/codex-1.jsonl) and [resumed](runs/2026-10-19T03-20-51.655Z/codex-2.jsonl) transcripts report that session ID. Both commands created real Python helpers with real sleeping children. The [second stall marker](runs/2026-10-19T03-20-51.655Z/stall-at-timeout.json) identifies a different helper and child from the first, proving active stalled work after restart rather than a stale marker.

There were **two Codex process launches within one repair attempt**, zero verification retries, and zero coding launches after the deadline. The remaining second-attempt allowance was unused. Generation 3 reopened after expiry only to commit timeout failure; generation 4 resumed the terminal task's scheduler and found zero live tasks. All four receipts retain the identical admission and deadline.

## Cleanup and honest failure

The two cleanup reports each record five processes: runner, Codex, code-mode host, Python helper and child. These include distinct process groups. All ten observed repair-process PIDs were absent at the final [process audit](runs/2026-10-19T03-20-51.655Z/process-audit.json). The independent audit also found the supervisor and administrative runners absent. SIGKILL and observed absence establish local process termination, not external provider cancellation.

The [controller result](runs/2026-10-19T03-20-51.655Z/result.json), [failed job outcome](runs/2026-10-19T03-20-51.655Z/job-outcome.json) and [settled SQLite task record](runs/2026-10-19T03-20-51.655Z/settled.json) agree: `passed: false`, `status: failed`, `reason: time_limit_exceeded`, attempt 1, limit 2. The controller returned exit **1**. A [separate proof receipt](runs/2026-10-19T03-20-51.655Z/deadline-restart-proof.json) reports that the stop test passed; it does not turn the failed repair into success.

The [terminal reopen](runs/2026-10-19T03-20-51.655Z/terminal-reopen.json) preserves the exact terminal record, original deadline, partial evidence and cleanup details. It returned exit 1 without a coding call. No second-attempt prompt, candidate or verification artifact exists, and no completed outcome was recorded. The seeded source remains unchanged and unaccepted; the timeout snapshot and correctly empty diff remain preserved.

## Rejected first run

The first run, [2026-10-19T03-19-27.102Z](runs/2026-10-19T03-19-27.102Z/result.json), did **not** prove this outcome. It stopped the initial tree and resumed the same session with 29,260 ms left, but the agent [returned early](runs/2026-10-19T03-19-27.102Z/codex-2.jsonl), reporting that its previous tool session was unavailable. It did not start a fresh stall. Independent verification rejected the unchanged seeded source and the trial failed before expiry. That result and its frozen implementation are preserved, rather than relabelled as a timeout pass.

The adapter's resumed prompt was then made explicit: the old processes are gone; continue attempt 1 by starting a fresh foreground helper within the original deadline. The successful stop test above was a new run from admission, with no mid-run repair, manual continuation or changed deadline. This instruction handles this deliberate local replay boundary; it is not a general guarantee that arbitrary interrupted commands are safe to replay.

## Preservation and limits

The same final implementation also passed a real `--feedback-crash` valid-repair control: [result](runs/2026-10-19T03-22-00.396Z/result.json), [8/8 acceptance cases](runs/2026-10-19T03-22-00.396Z/acceptance-final.json), [26 existing tests](runs/2026-10-19T03-22-00.396Z/health-final.log), controller exit 0. The control retains the normal 600-second budget. This checks that the updated adapter can still complete and verify a valid repair.

The run retains SQLite, both transcripts and prompts, each recovery snapshot and deadline receipt, both stall/process reports, baseline rejection, timeout source/diff, terminal records, [frozen source](runs/2026-10-19T03-20-51.655Z/source/) and [SHA-256 manifest](runs/2026-10-19T03-20-51.655Z/SHA256.json). The external verifier remains SHA-256 `63a8ebf449de340664b51fa0767f166dcb02da7c4d2e83fe9bf2742dc41958fd`; the live Homebase checker matches its captured original. The trial modifies only disposable fixtures.

This is one observed active restart and expiry on a live local clock, with a supervisor that stays running. It does not cover supervisor death, reboot, clock jumps, every process-spawn race, daemonized descendants, general command idempotency or production readiness. The deadline is persisted in the run's input file and copied into terminal failure details; it is not stored as a Pi-native cancellation guarantee. Automatic restart and OS cleanup belong to this experiment's host adapter.

Repeat with `npm run trial -- --timeout-restart`; expected shell exit is 1. Updated `trial.mjs`, `worker.mjs`, README, this report, the earlier timeout report pointer and owner LOG remain **local and uncommitted** in the shared Agents checkout. No live Homebase, provider, installation, hook, service, schedule or publication change is part of this trial.
