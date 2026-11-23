# LOGFILE: one publication, interrupted and recovered

On 19 October 2026 the local Pi Durable task published the designated LOGFILE update, was killed after GitHub accepted its commit but before the publisher’s push command returned, reopened the same persisted task, reconciled the remote effect and completed the original publisher’s deployment/live verification. Terminal reopening started no publisher.

- Published commit: [`1f7025c2c1ea22b25c17dd1d21242fefa3fd397d`](https://github.com/callumflack/callum-website-2025/commit/1f7025c2c1ea22b25c17dd1d21242fefa3fd397d). Baseline: `7bc5b6ce5e2c1e13c6917a6216b3cedd0cd1af93`.
- **Exactly one new commit and one successful push**, changing only `src/app/log/_data/log.json`. The publisher script’s hash is unchanged.
- The source actually contained **two unpublished top-level entries**, Pi Durable and the authored `XXX` source link. Both were preserved verbatim and published in that one commit. Their new permanent IDs are [`log-56caa86d`](https://www.callum.website/log#log-56caa86d) and [`log-fee318d6`](https://www.callum.website/log#log-fee318d6). Nine existing entry IDs and all source prose are preserved.
- The current heartbeat’s configuration is byte-for-byte unchanged. No service, schedule, model call or new credential access was added.

## Observed sequence

1. Existing LOG chat finished its separately authorised punctuation publication. The dedicated publisher worktree was clean at the current main revision before this trial began.
2. Pi Durable 1.3.0 admitted task `7` into local SQLite. It launched the unchanged real `bun log:publish --vault …` command. Existing importer, renderer/selection tests, formatting, TypeScript and production build passed. The full staged public-snapshot patch was inspected before its commit.
3. Actual Git commit and push completed. The shim retained the commit/source/snapshot receipt and held before returning to the publisher. At `06:30:42.310 UTC` the push had succeeded. The controller SIGKILLed the observed worker/publisher/shim tree; Pi had not recorded completion. No fake Git, deployment or website response was supplied.
4. The replacement opened the same task at `06:30:44.459 UTC`, still pending in phase `publish`. It confirmed the exact remote commit, clean checkout, unchanged source/snapshot and original absolute deadline.
5. It reran the original publisher, which imported the same 11 entries, found no content change, waited for the same Vercel deployment and verified the live index, each daily page, text and images. It exited zero with `LOGFILE unchanged; no commit or deployment.` At `06:31:49.766 UTC` Pi recorded terminal completion.
6. A third open preserved that exact terminal record and launched no publisher. Independent audit confirms the interrupted processes are absent, one new remote commit, one push, all existing IDs/prose preserved and unchanged heartbeat/publisher hashes.
7. A real browser opened `https://www.callum.website/log/2026-10-19#log-56caa86d` and rendered both new entries with their source links and permanent entry links. GitHub’s Vercel status was success for the same commit.

## Audit correction, preserved failure

The initial controller’s final entry-count check assumed the user’s “one new node” meant one unpublished node. The saved source and inspected staged patch contained two. After recovery and terminal reopening had already succeeded, that controller exited 1 on `2 !== 1`. Its original source and failure are retained.

The independent audit was corrected to derive expected entry count from the saved authored input and prior public snapshot. It passes without rerunning publication or modifying the worker or publisher. The current controller source uses that corrected check for future runs. This is a post-run checker correction, not a second publication or an agent-assisted recovery.

## Evidence and repeatable inspection

Run folder: [`../runs/logfile-2026-10-19T06-28-53.761Z/`](../runs/logfile-2026-10-19T06-28-53.761Z/).

- [`independent-audit.json`](../runs/logfile-2026-10-19T06-28-53.761Z/independent-audit.json) and [`SHA256.json`](../runs/logfile-2026-10-19T06-28-53.761Z/SHA256.json).
- `input.json`, `job.json`, `state.sqlite`, `recovered-2.json`, `reconciliation.json`, `settled-2.json` and identical `settled-3.json`.
- Actual `publisher-1.log`, `publisher-2.log`, `git-events.jsonl`, `push-receipt.json`, `timeline.jsonl`, `crash-cleanup.json` and `published.patch`.
- Original/final LOGFILE and public snapshots, original publisher/worker, original controller and final audit sources.
- `controller-exit.json` preserves the count-check rejection. `review-ready.json`, `staged.patch` and `reviewed.json` preserve the exact staged review.

Read-only audit from the parent experiment:

```sh
node log-publisher/audit.mjs runs/logfile-2026-10-19T06-28-53.761Z
```

Its current-main equality check will intentionally reject after a later legitimate publication; the retained commit and evidence remain historical proof.

## Scope and delivery

This proves one controlled interruption **after a successful push and external receipt, before command return/Pi completion**, followed by reconciliation, no-change replay and verified completion. It does not establish all mid-import/commit/push races, recovery when an effect succeeds before its external receipt is saved, host reboot recovery, concurrent-writer safety or replacement of the heartbeat.

The real publisher retained authority over import, validation, staging, Git publication and live checks. Pi supplied durable task state; the small adapter/controller supplied external-process reconciliation, the controlled stop/restart and the original deadline. No reasoning agent was necessary for this deterministic publishing job.

Runner, audit and report remain **local and uncommitted** in the shared Agents checkout. The content snapshot is **committed, pushed, deployed and live-verified** through the existing website publisher worktree. The original heartbeat remains unchanged; no active task handoff remains.
