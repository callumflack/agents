# A real Homebase repair completed without supervision

On 19 October 2026, the existing Pi Durable/Codex runner completed a genuine repair in the **live shared Homebase checkout**, `/Users/callumflack/Repos/callumflack/homebase`. No source bug, bad patch, crash or stall was injected. The job completed in **95.311 seconds**, controller exit **0**, with zero human interventions after admission.

Run: [2026-10-19T04-44-31.793Z](runs/2026-10-19T04-44-31.793Z/input.json). The [result](runs/2026-10-19T04-44-31.793Z/result.json) and [independent audit](runs/2026-10-19T04-44-31.793Z/independent-audit.json) separate the real code repair from a later log-only correction.

## Real task and delivered result

The unmodified command `python3 -B scripts/check --config /private/tmp` raised an uncaught `IsADirectoryError` and exited 1 with a traceback. The shared config loader had the same defect for `scripts/setup`. The original implementation was clean and its saved bytes match the owning Git HEAD; it was not altered to manufacture the task. The [baseline acceptance](runs/2026-10-19T04-44-31.793Z/baseline-acceptance.json) passed six of eight cases and genuinely failed directory-config handling for both commands. Existing portable health passed 26 tests before admission.

The agent independently diagnosed the loader and added two lines to `scripts/_homebase.py`: convert filesystem read errors and invalid UTF-8 into the existing `ConfigError` reporting path, after the existing missing-file and TOML parsing handlers. The new `scripts/tests/test_config_errors.py` exercises real filesystem inputs and subprocess CLIs, including directory and invalid-encoding failures, preserved missing/malformed messages and valid config behavior. The task's existing Homebase LOG entry was resolved; no other Homebase path changed.

The actual [live command](runs/2026-10-19T04-44-31.793Z/live-command.json) now returns exit **2**, no traceback:

```text
ERROR    cannot read config /private/tmp: [Errno 21] Is a directory: '/private/tmp'
```

The [delivered patch](runs/2026-10-19T04-44-31.793Z/delivered.patch) and [final candidate files](runs/2026-10-19T04-44-31.793Z/candidate-2/) preserve the complete local change. The implementation and regression test in that candidate match the live files.

## Independent verification

| Check | Observed result |
| --- | --- |
| Protected external CLI acceptance | **8/8**: directory, missing, malformed and valid config for both check/setup |
| Homebase portable health | **29 tests passed**, exit 0 |
| Agent-authored regression against original source | Failed with the original directory/UTF-8 errors, establishing it detects the real defect |
| Same regression with the delivered code | Passed in portable health |
| Unrelated tracked/untracked Homebase work | Baseline file hashes/metadata unchanged |
| Git index | Exact staged/unmerged entries preserved |
| Previous log history | Preserved exactly |
| Protected verifier | Hash unchanged |
| Terminal task reopened with scheduling enabled | Identical completed outcome, zero live tasks, exit 0, no new coding call |

The external verifier resides in Agents, outside the coding process's Homebase write sandbox. It executes the real scripts in benign temporary filesystem fixtures; it does not edit or replace their logic. The original-source regression control uses the saved unmodified source with the agent's new test, not a deliberately damaged implementation. [Acceptance](runs/2026-10-19T04-44-31.793Z/acceptance-attempt-2.log), [health](runs/2026-10-19T04-44-31.793Z/health-attempt-2.log), [original-source regression failure](runs/2026-10-19T04-44-31.793Z/baselineRegression-attempt-2.log) and [verification receipt](runs/2026-10-19T04-44-31.793Z/verification-attempt-2.json) retain the actual outputs.

## Genuine automatic follow-up

The first submission already passed all eight external cases, all 29 tests and the original-source regression control. The [first verification](runs/2026-10-19T04-44-31.793Z/verification-attempt-1.json) rejected completion solely because the completed log entry still contained the **Active scope** label. It did not reject the code fix.

Pi stored that actual [feedback](runs/2026-10-19T04-44-31.793Z/feedback-attempt-1.json) in the [attempt-2 checkpoint](runs/2026-10-19T04-44-31.793Z/retry-checkpoint-2.json). The adapter resumed the same Codex session, `01a15279-bf84-74b2-a07c-d71185e063ad`, with that feedback verbatim. The agent changed only the current LOG entry, using Homebase's resolved heading and **Completed scope**. The implementation and test bytes were identical between submissions. It reran health, then external verification accepted the job. There were two coding-session launches and one automatic verification follow-up, with no parent-authored repair, manual hint, permission prompt or user intervention after launch.

Both [first transcript](runs/2026-10-19T04-44-31.793Z/codex-attempt-1.jsonl) and [resumed transcript](runs/2026-10-19T04-44-31.793Z/codex-attempt-2.jsonl), prompts, candidates and check results are retained. The agent ran the actual unittest suite and portable health successfully; the supervisor then verified independently. This is a successful real repair plus completion housekeeping, not evidence of a first incorrect code patch being repaired.

## Durable completion and preservation

The [settled Pi task](runs/2026-10-19T04-44-31.793Z/settled.json) is completed with the accepted verification and session identity. A [terminal reopen](runs/2026-10-19T04-44-31.793Z/terminal-reopen.json) preserved it exactly and scheduled no new work. The independent audit checked all recorded runner, Codex, administrative and supervisor PIDs absent after exit.

The inherited README merge conflict, existing dirty tests/context/manifest files and Git index entries were preserved. The only live task changes are `scripts/_homebase.py`, new `scripts/tests/test_config_errors.py` and the current `LOG.md` entry. No files were staged, committed, pushed or deployed; no live links, providers, services, schedules or global runtime configuration were changed.

The [frozen implementation](runs/2026-10-19T04-44-31.793Z/source/) and [SHA-256 manifest](runs/2026-10-19T04-44-31.793Z/SHA256.json) preserve the job's code and evidence. Its [rerunnable read-only audit](runs/2026-10-19T04-44-31.793Z/audit-real.mjs) checks the original Git source, both prompts/checkpoints, behavior results, delivered bytes, scope/index preservation and terminal record. Node syntax and Python AST checks passed. Both owners declare no applicable formatter/linter/IDE diagnostics gate for these files.

This proves one naturally existing small Homebase repair and an automatic housekeeping follow-up through the durable adapter. No crash was injected into this real task; the earlier controlled recovery and timeout trials remain separate evidence. It does not establish general coding quality or production readiness. The repair is **local and uncommitted in the shared Homebase checkout**, and the adapter/report updates are **local and uncommitted in shared Agents**. No active task handoff remains.
