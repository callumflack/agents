# Supervisor recovery after the original deadline

Observed locally on 19 October 2026 in the shared Agents checkout, `/Users/callumflack/Repos/callumflack/agents/experiments/pi-durable-trial`. The late-restart test passed. The repair job remained **failed**, `time_limit_exceeded`, exit **1**. No human intervention or mid-run source changes occurred after launch.

Run: [2026-10-19T04-06-22.924Z](runs/2026-10-19T04-06-22.924Z/input.json). [Raw proof](runs/2026-10-19T04-06-22.924Z/supervisor-crash-proof.json) and [timeline](runs/2026-10-19T04-06-22.924Z/timeline.jsonl) preserve the actual observations.

## Observed boundaries

| Boundary | Time from original admission | Evidence |
| --- | ---: | --- |
| Admission | 0 ms | Saved admission `1792382783555`, original deadline `1792382843555`, 60-second budget |
| Kill supervisor and runner only | 30,011 ms | [Injected SIGKILL](runs/2026-10-19T04-06-22.924Z/injected-crash.json); original repair descendants left alive |
| Observe both controllers still absent, original orphans alive | 65,094 ms | [Post-deadline OS observation](runs/2026-10-19T04-06-22.924Z/orphan-after-deadline.json) |
| Replacement supervisor recovers saved run | 65,204 ms | [Recovery receipt](runs/2026-10-19T04-06-22.924Z/supervisor-recovered.json): **−5,204 ms remaining** |
| Recognise existing timeout | 65,205 ms | Timeline `deadline-exceeded`, **1 ms after recovery** |
| Cleanup confirmed | 65,691 ms | [Cleanup report](runs/2026-10-19T04-06-22.924Z/timeout-cleanup.json), **487 ms after recovery** |

The supervisor was absent when the original deadline elapsed. No cleanup happened at 60 seconds: the test intentionally left the original processes alive until restart. The replacement recognised an already-expired deadline and cleaned up immediately, rather than granting another minute. The raw proof's `expiry_after_ms` and `expiry_lateness_ms` describe when expiry was observed after the outage, not an on-time watchdog firing.

## Same deadline, original orphans

The fault driver saved its [late-restart plan](runs/2026-10-19T04-06-22.924Z/restart-plan.json), killed supervisor PID 78638 and runner PID 78697 at the midpoint, and withheld restart until at least five seconds after the original deadline. It did not signal the repair descendants or enforce cleanup during the outage. The original supervisor's [exit receipt](runs/2026-10-19T04-06-22.924Z/supervisor-1.exit.json) records SIGKILL.

At 65,094 ms, the original Codex process 78698, code-mode host 78825, Python helper 78826 and child 78827 were all alive while both controllers were absent. Their PID, OS start time, process group and executable matched the [ownership ledger saved before the crash](runs/2026-10-19T04-06-22.924Z/owned-processes.json). The replacement used those saved identities; it did not replay a coding command. Cleanup preserved each signal/refusal and observed all ledger PIDs absent. The later [final OS audit](runs/2026-10-19T04-06-22.924Z/process-final-audit.json) also checks the controllers, administrative workers and fault driver have gone.

The replacement and both administrative worker generations retained the original admission/deadline. The input file's SHA-256 still matches its pre-crash ledger hash, and the ledger hash matches the recovery receipt. Neither file was rewritten to admit a new job or reset the budget.

## Failed outcome, no further attempt

After cleanup, the same [Pi task 7](runs/2026-10-19T04-06-22.924Z/recovered-task-2.json) reopened with checkpoint `code`, attempt **1**, and its original Codex session memo. The existing phase guard recorded timeout before calling Codex.

The [job outcome](runs/2026-10-19T04-06-22.924Z/job-outcome.json), [controller result](runs/2026-10-19T04-06-22.924Z/result.json) and [terminal task](runs/2026-10-19T04-06-22.924Z/settled.json) agree: `passed: false`, `status: failed`, `reason: time_limit_exceeded`, attempt 1 of a permitted 2. Settlement worker, terminal probe, replacement supervisor and fault driver returned exit **1**. The separate test-proof receipt says the stop test passed; it does not claim a completed repair.

There was **one coding launch**, zero verification retries and no coding after the original deadline. No second-attempt prompt, candidate or verification artifact exists. [Terminal reopening](runs/2026-10-19T04-06-22.924Z/terminal-reopen.json), with scheduling enabled, preserved the identical failed record and original deadline, and found zero live tasks. The fixture remains the rejected seed; its correctly empty timeout patch and source snapshot are preserved.

## Repeat and proof limits

Run `node supervisor-crash.mjs --after-deadline`; expected shell exit is 1. The test invokes the existing `trial.mjs --resume-supervisor <saved-run>` entry automatically. Run the frozen audit with `node <run-directory>/source/supervisor-crash.mjs --audit <run-directory>`. This audit was rerun successfully against the saved raw events, task records and OS process table after the fault driver exited.

Only the fault driver and documentation changed. Hash comparison confirms that `trial.mjs`, `worker.mjs`, `supervisor.mjs`, `processes.mjs` and `verify.py` match the previously verified supervisor-recovery implementation. Its earlier [valid-repair control](runs/2026-10-19T03-46-03.966Z/result.json) remains preserved; no new valid-repair run was needed for this added fault timing. Node syntax checks passed. This owner has no formatter/linter/IDE diagnostics integration.

Partial Codex logs, prompts, input and plan, immutable ownership ledger, observations on both sides of expiry, cleanup records, SQLite, terminal failure/probe, [frozen source](runs/2026-10-19T04-06-22.924Z/source/) and [SHA-256 evidence manifest](runs/2026-10-19T04-06-22.924Z/SHA256.json) remain local. The live Homebase checker matches its captured original and the protected verifier is unchanged.

This proves one live-clock restart five seconds after expiry, using an external fault driver to restart supervision. It does not provide enforcement while the supervisor is dead or recovery without a restart. Reboot, clock changes, every ownership/spawn race and remote provider cancellation remain outside this trial. The normal job budget remains ten minutes; this test uses one minute.

Updated crash driver, README, this report, the earlier report's later-proof pointer and owner LOG remain **local and uncommitted** in the shared Agents checkout. No active trial handoff or surviving test process remains. No live Homebase, provider, installation, hook, service, schedule or publication change was made.
