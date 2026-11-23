# Saved verification feedback survives a killed runner

**PASS.** One combined local run on 19 October 2026, 12:14:52–12:16:08 Brisbane time; 75.405 seconds. The first candidate was deliberately incomplete, as in the earlier feedback trial. The verifier returned genuine failures; neither the controller nor the parent chat repaired the source. No human intervention occurred after launch.

## Observed sequence

1. Codex submitted the incomplete candidate in session `01a151f0-ba15-7e73-b94c-8245683bea73`.
2. The unchanged external checker rejected it: [5/8 acceptance cases](runs/2026-10-19T02-14-51.937Z/acceptance-attempt-1.json) and [24/26 existing tests](runs/2026-10-19T02-14-51.937Z/health-attempt-1.log) passed. Required absent/dangling targets and a missing connection to an existing target incorrectly exited 0 instead of 1.
3. Pi committed the actual failure feedback into task 7, attempt 2, phase `repair-ready`. [Before-kill task record](runs/2026-10-19T02-14-51.937Z/feedback-crash-ready.json) and [retry checkpoint](runs/2026-10-19T02-14-51.937Z/retry-checkpoint-2.json) preserve it. At that boundary the second prompt and second Codex run did not exist.
4. At 12:15:20, the external controller SIGKILLed runner 13087. The first Codex process had already exited; only the runner was killed here. The controller observed its SIGKILL termination, then automatically launched replacement runner 13724.
5. The replacement opened the same SQLite database and read task 7 before resuming scheduling. [Recovered task](runs/2026-10-19T02-14-51.937Z/recovered-task.json) was pending in `repair-ready`, attempt 2, with the same session memo and feedback. [Recovered workspace hash](runs/2026-10-19T02-14-51.937Z/recovered-workspace.json) still matches the rejected candidate, so the fix did not happen before restart.
6. The worker generated the [second prompt](runs/2026-10-19T02-14-51.937Z/prompt-attempt-2.txt) from the recovered task checkpoint, then resumed that same Codex session. It did not rebuild the prompt from the saved report files. The controller independently asserted that the recovered feedback equals [the real rejection](runs/2026-10-19T02-14-51.937Z/feedback-attempt-1.json), and that the resumed prompt contains that exact feedback JSON.
7. Codex diagnosed the distinction between allowed optional absence and failing `MISSING` states, changed the source, and ran checks. The runner then independently checked the second candidate: [8/8 acceptance cases](runs/2026-10-19T02-14-51.937Z/acceptance-attempt-2.json), [26/26 existing tests and healthy portable result](runs/2026-10-19T02-14-51.937Z/health-attempt-2.log). Task 7 reached [terminal success](runs/2026-10-19T02-14-51.937Z/settled.json).

## Direct evidence

- [Full timeline](runs/2026-10-19T02-14-51.937Z/timeline.jsonl): verification rejection → durable retry → held checkpoint → SIGKILL → reopened task → restored feedback → second coding attempt → passing verification. Assertions require exactly two coding starts, generations/attempts `(1,1)` and `(2,2)`, and exactly two verification results, rejected then passed. The first candidate and first verification were not repeated after restart.
- [Controller result](runs/2026-10-19T02-14-51.937Z/result.json): `passed`, `interrupted`, and `persisted_feedback_recovered` are true. The second runner exited 0.
- [First patch](runs/2026-10-19T02-14-51.937Z/fix-attempt-1.patch) and [repaired patch](runs/2026-10-19T02-14-51.937Z/fix-attempt-2.patch), with separate [first](runs/2026-10-19T02-14-51.937Z/codex-attempt-1.jsonl) and [second](runs/2026-10-19T02-14-51.937Z/codex-attempt-2.jsonl) Codex logs.
- Rejected source SHA-256: `006f4ba0e7097a6ae458d37e145579a6419dff279ff10711e40c7e03a4fef749`. Repaired source: `d7ec15b114ab4cd5815c45c90e3b1dcb72a2a8a2b1b48e2b94c86e4eda96326e`.
- The protected oracle remained `63a8ebf449de340664b51fa0767f166dcb02da7c4d2e83fe9bf2742dc41958fd`. Verification also checks that each candidate stays unchanged during its checks and that the only workspace edit is `scripts/_homebase.py`.
- [Frozen implementation](runs/2026-10-19T02-14-51.937Z/source/), [input provenance](runs/2026-10-19T02-14-51.937Z/input.json), SQLite `state.sqlite`, and [evidence hashes](runs/2026-10-19T02-14-51.937Z/SHA256.json) remain beside the logs. A separate audit checks the equality of original, before-kill, reopened and prompted feedback, the artifact hashes, the live Homebase source hash, and that the recorded processes have exited.

## Run and limits

Run `npm run trial -- --feedback-crash` from this experiment's directory. There are at most two coding candidates and a ten-minute wall-clock budget. The deliberate hold before repair makes the crash point exact; the parent controller releases it by killing and restarting the runner, with no approval or manual continuation. Codex receives the saved failure details through the normal resume call.

This proves one combined controlled run at the boundary after feedback is committed and before repair starts. It does not establish recovery if killed before the feedback commit, mid-write or during repair, under repeated failures, across machine reboot/logout, or around external side effects. The earlier [crash](EVIDENCE.md) and [feedback-only](FEEDBACK-EVIDENCE.md) reports retain their own run evidence.

Updated `trial.mjs`, `worker.mjs`, `README.md`, this report, the feedback report's later-proof pointer, and the owner `LOG.md` remain local and uncommitted in the shared Agents checkout. Live Homebase, global integration, providers and schedules are unchanged.

A later [retry-limit test](LIMIT-EVIDENCE.md) separately verifies a still-failing second candidate, terminal failed reporting and no further attempt when the task is reopened. The combined success report above retains its original scope.
