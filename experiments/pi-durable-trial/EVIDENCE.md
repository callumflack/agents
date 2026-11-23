# Observed local trial — 19 October 2026

**PASS.** The complete controller run took 56.337 seconds, from 11:54:37 to 11:55:33 Brisbane time. After launch the parent chat only observed files; no code, prompts or state were changed to rescue the run. The controller supplied the recovery message automatically.

All links below refer to `runs/2026-10-19T01-54-36.599Z/`.

## What happened

1. [Baseline acceptance](runs/2026-10-19T01-54-36.599Z/acceptance-before.json): 6/8 passed. Exactly the two missing-optional cases failed. The [first Codex log](runs/2026-10-19T01-54-36.599Z/codex-1.jsonl) also records one existing behavioral-test failure before the edit.
2. Codex changed only `scripts/_homebase.py`.
3. [Timeline](runs/2026-10-19T01-54-36.599Z/timeline.jsonl): at 11:55:04 Brisbane, the supervisor sent SIGKILL to the Codex process group and runner 2341. `verification_existed` was false. It observed SIGKILL termination before starting runner 3039.
4. [Recovered Pi task](runs/2026-10-19T01-54-36.599Z/recovered-task.json): reopened SQLite returned task 7 in pending `code`, retaining memo `codex-session = 01a151de-2de0-7f70-9d5f-3fb59b16c5ae`. The [second Codex log](runs/2026-10-19T01-54-36.599Z/codex-2.jsonl) records the same thread ID, inspection of the surviving patch, and successful checks.
5. [Final acceptance](runs/2026-10-19T01-54-36.599Z/acceptance-final.json): 8/8 passed. [Independent portable health](runs/2026-10-19T01-54-36.599Z/health-final.log): 26 tests passed and Homebase health succeeded. The worker ran these independently after the agent's checks.
6. [Terminal Pi receipt](runs/2026-10-19T01-54-36.599Z/settled.json): task 7 completed. [Controller result](runs/2026-10-19T01-54-36.599Z/result.json): same session, interruption observed, all gates passed, replacement runner exited 0.

## Delivered artifact

- [One-line patch](runs/2026-10-19T01-54-36.599Z/fix.patch), applied only inside the disposable workspace.
- Fixed file SHA-256: `d7ec15b114ab4cd5815c45c90e3b1dcb72a2a8a2b1b48e2b94c86e4eda96326e`.
- Unchanged external oracle SHA-256: `63a8ebf449de340664b51fa0767f166dcb02da7c4d2e83fe9bf2742dc41958fd`.
- A separate final audit checked Git status including untracked files: exactly one changed source file. The live Homebase checker still matches the captured original hash.
- [Input provenance](runs/2026-10-19T01-54-36.599Z/input.json), SQLite `state.sqlite` and [file hashes](runs/2026-10-19T01-54-36.599Z/SHA256.json) remain beside the logs. Runs/dependencies are ignored local evidence. Source and lockfile remain local and uncommitted in the shared Agents checkout.

## Setup failures retained

Two preflight attempts stopped before any agent launch: the seed assertion initially matched two functions instead of only `run_check`; the first acceptance manifest omitted the required Agents section and placed its targets inside the workspace. Both fixture mistakes were corrected before the successful run. The rejected manifest output is retained in [setup-manifest-rejection.json](setup-manifest-rejection.json). Incomplete workspace copies were removed. Neither preflight counts as an agent recovery pass.

The result is limited to the task and interruption point described in [README](README.md#proof-boundary).

Historical source hashes in the original manifest refer to the files now preserved under `runs/2026-10-19T01-54-36.599Z/source/`; the runner has since been extended for [verification-feedback recovery](FEEDBACK-EVIDENCE.md). Original run logs and the original manifest are unchanged.
