# Verification failure followed by automatic repair

**PASS.** Local run on 19 October 2026, 12:07:56–12:08:57 Brisbane time, 61.557 seconds. This is a controlled fault-injection test: the first Codex prompt explicitly requires an incomplete candidate. The rejection is real; the controller does not alter the candidate or fabricate a checker failure. Neither Callum nor the parent chat intervened in the repair after launch.

## Observed outcomes

| Candidate | External acceptance | Existing tests | Outcome |
| --- | --- | --- | --- |
| First, deliberately incomplete | 5/8 passed | 24/26 passed; health exit 1 | Rejected; actual failure evidence returned to Codex |
| Second, repaired by the same session | 8/8 passed | 26/26 passed; health exit 0 | Pi task completed |

The first candidate incorrectly returned success for a missing required target, a dangling required link, and a missing connection to an existing target. The rejected [acceptance report](runs/2026-10-19T02-07-55.667Z/acceptance-attempt-1.json) records expected exit 1 versus actual exit 0 for all three. [First health output](runs/2026-10-19T02-07-55.667Z/health-attempt-1.log) records the two existing-test failures. Codex itself had exited 0, which did not satisfy the completion gate.

The runner stored the actual failures, rejected artifact hash and health log tail in the [Pi task checkpoint](runs/2026-10-19T02-07-55.667Z/retry-checkpoint-2.json). Its [feedback JSON](runs/2026-10-19T02-07-55.667Z/feedback-attempt-1.json) equals that checkpoint's feedback and appears verbatim in the [second prompt](runs/2026-10-19T02-07-55.667Z/prompt-attempt-2.txt). The second request resumes session `01a151ea-5f06-7e53-84de-38da2af03a8b`; both log files record that same ID. The task ID remains 7 throughout.

At the beginning of the [second Codex log](runs/2026-10-19T02-07-55.667Z/codex-attempt-2.jsonl), the agent says:

> The failures show that `MISSING` covers both allowed absence and broken connections.

It inspected `State` and `inspect_link`, then replaced the status-only aggregation with `state.failing`. [First patch](runs/2026-10-19T02-07-55.667Z/fix-attempt-1.patch) and [repaired patch](runs/2026-10-19T02-07-55.667Z/fix-attempt-2.patch) show different artifacts. The runner checked the second candidate independently after Codex's own tests: [final acceptance](runs/2026-10-19T02-07-55.667Z/acceptance-attempt-2.json), [final health](runs/2026-10-19T02-07-55.667Z/health-attempt-2.log), [verification](runs/2026-10-19T02-07-55.667Z/verification-attempt-2.json), [terminal Pi receipt](runs/2026-10-19T02-07-55.667Z/settled.json), and [controller result](runs/2026-10-19T02-07-55.667Z/result.json).

## Evidence boundaries and integrity

- [Timeline](runs/2026-10-19T02-07-55.667Z/timeline.jsonl): two coding attempts, a failed verification, a durable retry transition and a passing verification, followed by terminal success. No crash was injected in this run; the earlier crash path was tested separately.
- The first candidate is `006f4ba0e7097a6ae458d37e145579a6419dff279ff10711e40c7e03a4fef749`; the passing candidate is `d7ec15b114ab4cd5815c45c90e3b1dcb72a2a8a2b1b48e2b94c86e4eda96326e`.
- The oracle stayed at `63a8ebf449de340664b51fa0767f166dcb02da7c4d2e83fe9bf2742dc41958fd` throughout. Every attempt also checked that its candidate stayed unchanged during verification and that Git status contained only the allowed source edit.
- [Frozen source](runs/2026-10-19T02-07-55.667Z/source/) and [evidence hashes](runs/2026-10-19T02-07-55.667Z/SHA256.json) retain the implementation used. The live Homebase checker still matches the captured original; only disposable copies were repaired.
- The shared runner was subsequently checked with the original crash scenario: [passing regression result](runs/2026-10-19T02-09-11.790Z/result.json). Its restarted session also passed the unchanged eight acceptance cases and 26-test portable health gate.
- Two total candidates and a ten-minute wall-clock budget bound the feedback mode. A further failure settles as failed; no unbounded retry or user continuation is built into this loop. Budget exhaustion itself was not exercised here.
- This establishes one controlled repair from actual verification feedback. It does not measure the rate of naturally occurring agent mistakes, prove arbitrary debugging competence, or combine crash recovery with failed-verification recovery in a single run.

## Local delivery

Run again with `npm run trial -- --feedback` from this experiment's directory. [README](README.md) owns the procedure and scope. Updated paths are `trial.mjs`, `worker.mjs`, `README.md`, this evidence report, the earlier report's source-snapshot pointer, and the owning root `LOG.md`. Delivery remains local and uncommitted in the shared Agents checkout; no global integration, schedule, provider or live Homebase file was changed.

A later [combined trial](COMBINED-EVIDENCE.md) separately proves a runner kill after saved rejection and repair from reopened feedback. This report above retains its original feedback-only scope.
