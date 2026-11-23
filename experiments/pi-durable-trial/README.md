# Pi Durable + Codex: local recovery trial

> Archived source and historical reports. No trial is scheduled or activated by
> this archive. The commands below can run real coding sessions or publish
> content; use them only under a separately authorized task. Raw run artifacts
> remain local and are not a portable evidence bundle.

Built and run locally on 19 October 2026. Agents owns this experiment; Homebase exposes it through Tooling/agents. No desktop integration, hook, service, schedule or provider was installed.

The real Codex process reproduced a seeded Homebase checker regression, edited one file, was killed together with the Pi runner, resumed the same session under a replacement runner, and finished. External acceptance passed 8/8 cases and Homebase portable health passed all 26 tests. See [observed crash evidence](EVIDENCE.md). A second trial deliberately submitted an incomplete candidate, received genuine verification failures, and automatically repaired it in the same Codex session: [feedback evidence](FEEDBACK-EVIDENCE.md). The [combined trial](COMBINED-EVIDENCE.md) then killed the runner after saving that rejection and proved repair from the recovered SQLite feedback. The [retry-limit trial](LIMIT-EVIDENCE.md) then kept the second candidate incorrect and observed a terminal failed job, exit 1, preserved evidence and no new attempt when reopened. The [timeout trial](TIMEOUT-EVIDENCE.md) stalls a real repair and child, reaches a 60-second test deadline, stops the observed process tree and keeps the job failed without another coding call.

## Run

Use Node 24 or newer, the recorded Python 3.14 path, and this Mac's existing signed Codex CLI/login:

```sh
npm ci --ignore-scripts
npm run trial                    # forced crash and recovery
npm run trial -- --feedback       # rejected first patch and automatic repair
npm run trial -- --feedback-crash # save rejection, kill, restart, repair
npm run trial -- --retry-limit    # expected failed job: second candidate still fails, exit 1
npm run trial -- --timeout        # expected failed job: real stall, 60-second deadline, exit 1
npm run trial -- --timeout-restart # kill stalled repair at 30s; same original 60s deadline, exit 1
node supervisor-crash.mjs         # kill supervisor + runner; recover orphan ownership/deadline, exit 1
node supervisor-crash.mjs --after-deadline # keep supervisor dead until 5s after expiry, exit 1
node real-task.mjs                # one-time admission of the real config-read task, exit 0 on verified completion
```

The feedback mode allows two candidates total. It deliberately instructs the agent to produce an incomplete first patch; the acceptance checker itself is unchanged. It saves the rejected candidate, all actual failures and the passing candidate separately. The failures are committed into the Pi task checkpoint, then supplied verbatim as JSON to the same Codex session. A second failed verification terminates the job; the loop cannot keep retrying. No external code repair or user prompt is supplied after launch.

The retry-limit mode includes the combined crash boundary, but deliberately asks Codex for a different, still-failing second candidate. A failed job is written as `passed: false`, `status: failed`, `reason: retry_limit_exhausted`, with exit code 1. A separate `limit-proof.json` reports whether the test of that stop behavior passed; it does not mark the repair successful. The controller reopens the terminal failed task with scheduling enabled and requires its outcome/evidence to stay identical, no live tasks, and no third coding call.

Timeout mode uses a 60-second whole-job budget, while other modes retain ten minutes. The absolute admission time and deadline are stored in `input.json` once and reused across runner restarts. The same watchdog handles expiry for every mode: it snapshots the current source and observed process ancestry, stops that owned process tree, then reopens only to commit `time_limit_exceeded`. Task phases check the saved deadline before calling Codex, verification or further repair, and again after synchronous verification. Reopening a terminal timeout must preserve the outcome and start no coding call.

`stall.py` is the timeout-only fault: the real Codex command waits on a real sleeping Python child. `processes.mjs` reads OS PID/parent/group/state metadata without collecting command arguments, targets only the observed runner descendants, and verifies they are absent or exited zombies. The final audit checks that those PIDs have disappeared. No process outside the observed trial tree is targeted. The fixture scratch marker is ignored and the live source stays untouched.

The [deadline-restart trial](DEADLINE-RESTART-EVIDENCE.md) uses the same 60-second timeout path, with a forced SIGKILL at 30 seconds while the repair is stalled. It stops the runner and its observed descendants before resuming the same SQLite task, Codex session and attempt. The resumed prompt explicitly starts a fresh foreground helper because the old tool process was killed; this is a resumed invocation, not a second candidate or verification retry. The replacement reads the original admission/deadline file and gets only the remaining time. At expiry, both generations' cleanup records and per-generation deadline receipts are retained, and a final OS audit requires every observed repair PID to be absent. Administrative reopening settles and probes terminal failure without calling Codex. The first attempt at this new trial returned early on resume and was rejected; that failed run remains linked in the report.

The experiment pins Pi Durable 1.3.0. Re-running uses normal Codex account usage.

The [real Homebase pilot](REAL-TASK-EVIDENCE.md) used the live shared Homebase checkout and its existing config-directory traceback, without seeded source, scripted bad candidates, interruptions or stalls. The real-task adapter uses the same Pi task, Codex session memo, feedback checkpoint and terminal reopening path, while accepting an explicit live workspace and a protected task-specific verifier. Its eight external CLI cases, portable health, real regression control against the original source and inherited-work/index checks determine completion. The agent's first code fix passed all behavior checks; one automatic follow-up removed a stale Active scope label from the finished log entry. Both submissions are preserved. The local fix is delivered in Homebase, rather than only in a disposable copy.

`real-task.mjs` is this one task's admission script, not a recurring job. It deliberately refuses to overwrite the now-existing regression file or rerun against an already-fixed baseline. To inspect the result, use its report and frozen audit. This pilot left all inherited Homebase changes and the unresolved README index conflict untouched. No service or default Codex workflow was installed.

The [supervisor-crash trial](SUPERVISOR-CRASH-EVIDENCE.md) additionally kills the supervisor and runner at 30 seconds while leaving the real repair descendants alive. Before the crash, the supervisor saves an ownership ledger with PID, process start time, process group and executable. A fault driver injects the crash, confirms surviving orphans, then starts `trial.mjs --resume-supervisor <existing-run>` after a two-second gap. The replacement reads the original input and ownership ledger, watches that same work until its original deadline, stops matching processes, and only then opens Pi to settle timeout failure. It launches no replacement Codex command. The driver waits for the result; deadline enforcement belongs to the replacement supervisor. No permanent restart service is installed.

Orphan cleanup validates live process identities before signalling and includes descendants of still-matching owned processes. Already absent or zombie processes have exited and need no signal. A changed live identity causes signal refusal. If an identity changes during the signal walk, cleanup records the mismatch, continues the other owned processes, and still requires every recorded PID to stop before success. This covers the observed waiting parent's intermediate exit metadata without signalling a changed executable. The report preserves both failed cleanup-race runs and the corrected unattended rerun.

The [late-restart trial](LATE-RESTART-EVIDENCE.md) uses `--after-deadline` to keep both controllers dead until at least five seconds past the original 60-second deadline. It records the original orphans still alive while both controllers are absent, then restarts the same recovery code over the saved run. The replacement must see a negative remaining budget, begin timeout cleanup immediately, and settle failed before any coding call. The audit measures response from recovery separately from lateness relative to the original deadline: no watchdog is present during the outage, so cleanup happens after restart rather than at expiry.

`trial.mjs` snapshots Homebase's tracked working files into ignored `runs/`, seeds the bug, proves that the external oracle rejects it, starts the worker, kills the worker and Codex process group after the first edit, and automatically starts a replacement. Feedback mode skips the forced crash and instead requires a rejected first candidate and a different passing second candidate. Combined mode commits the rejection into a `repair-ready` checkpoint and holds there until the external controller kills the runner. The replacement must reopen that exact feedback and session before starting the second candidate. All modes preserve their source snapshots beside the run. Its normal budget is ten minutes; the timeout test shortens it to one minute and exercises process-tree cleanup. The disposable fixture has its own local Git baseline for inspecting the patch; this is not a delivery commit in either owner repository.

`worker.mjs` persists a custom Pi Durable task in SQLite. Its `code` phase launches Codex and stores the session ID in a durable memo. Recovery reads that memo and resumes the exact session. Its `verify` phase runs fixed acceptance checks and the repository health command before deciding terminal success or failure. With this pinned Pi version, terminal task records do not retain live task memos. The failed outcome therefore stores the original rejection and final verification details in `error.detail`, as well as preserving full candidate files and reports on disk. Reopening the failed task verifies those details survive. Pi makes no model calls; Codex uses the existing login. Nested learning collection is suppressed for these synthetic jobs.

`verify.py` lives outside Codex's workspace-write sandbox. It exercises the actual Homebase CLI using eight independent filesystem fixtures: optional/required absent targets, optional/required dangling links, a correct link, a wrong link, a directory conflict, and an existing target lacking its connection. Its hash must be unchanged at completion.

The original seeded trials left the live Homebase checkout unchanged and kept their patches in disposable snapshots. The separately documented real Homebase pilot used the live checkout; see `REAL-TASK-EVIDENCE.md`. These are historical delivery statements, not claims about the current state of another repository.

## Proof boundary

This proves one seeded local bug and recovery after a file edit, before independent final verification. The edit had landed before the crash; the resumed agent inspected it and completed verification. It does not prove recovery during a partially applied edit, every process-start/checkpoint race, autonomous operation across logout or reboot, concurrent writers, external side-effect idempotency, broad coding quality, or production readiness.

Codex remains opaque to Pi: the adapter resumes a recorded session at this tested boundary. It is not declared generally safe to replay. One foreground supervisor supplies automatic restart; no permanent service was installed. The original crash mode still terminates on independent verification failure. The feedback mode permits one corrective attempt, then terminates visibly on further failure. The feedback and combined runs each prove one controlled incomplete-candidate repair; they do not establish how often agents diagnose naturally occurring mistakes correctly. The combined stop point is after the failure and feedback commit, before repair starts. The hold is solely the experiment's deliberate crash boundary; it is not a human approval or a permanent service.

Dependencies and lockfile are pinned; the run records the Node version, Homebase revision and input/final hashes. Agents has no formatter/linter/IDE diagnostics integration for this experiment. Node syntax and Python AST checks passed, followed by the actual end-to-end trial.
