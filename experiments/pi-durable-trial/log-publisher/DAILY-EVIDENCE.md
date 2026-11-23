# Daily runner acceptance — 19 October 2026

The local runner and website publisher recovery changes pass the requested
bounded interruption and overlap proof. Website files were frozen and handed
to the existing —LOG chat, which committed and pushed them as
`c19e35234e81d5f4882a8cc137df009fb8d1e603`; the publisher checkout is clean and
remote main was checked at that revision. That chat owns primary-main sync
and new-revision live acceptance. Agents runner, tests and documentation remain local and uncommitted.
No schedule was added or changed.

## Repeatable acceptance

From `/Users/callumflack/Repos/callumflack/agents`:

```sh
node --test experiments/pi-durable-trial/log-publisher/daily.test.mjs
```

**15/15 passed**, zero skipped, in 59.5 seconds on Node 24.14.1, Bun 1.4.2,
Python 3.9.6 and the existing pinned Pi Durable/Chord/pi-ai 1.3.0 installation.
The complete final output is
`experiments/pi-durable-trial/runs/daily-2026-10-19/acceptance-matrix.log`.

| Boundary                                                                                            | Observed result                                                                                                                                                      |
| --------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| After import, stage, commit, push, live verification, and publisher completion before Pi completion | Same durable task/deadline recovered; one content commit and one successful push; subsequent unchanged run verifies without another publication.                     |
| Second Pi invocation and direct publisher during verification                                       | Both return 75/busy without replacing the active task or touching its candidate.                                                                                     |
| Pi parent dies while its publisher survives                                                         | Surviving child retains the inherited lock; overlap stays busy; recovery completes after that child exits.                                                           |
| LOGFILE edit during verification                                                                    | Frozen first candidate verified, later source admitted separately; exactly two distinct content commits/pushes, preserved existing ID and three unique final IDs.    |
| Active short budget expires                                                                         | Publisher process group stops; ordinary rerun leaves the failed task stopped; explicit retry renews the budget and verifies without another publication.             |
| Temporary Git rejection                                                                             | A real local pre-receive hook rejects the first push; persisted backoff retries within the same Pi task; two publisher attempts, one content commit/successful push. |
| Three interrupted worker openings                                                                   | Fourth opening is blocked without launching a publisher; explicit retry is required.                                                                                 |
| Foreign staged path, foreign staged bytes in the owned snapshot path, concurrent remote main        | Preserve those bytes/commits and stop without a push.                                                                                                                |
| Status inspection                                                                                   | No task creation, publisher invocation, event or pointer mutation.                                                                                                   |

The staged-byte regression **failed before its guard**: recovery overwrote the
alternate index bytes and published. The repaired candidate check verifies index
blob hashes _before_ restaging; the same case now preserves the exact staged
patch and stops. Its failing output remains in `staged-bytes-before.log`.

The suite uses real Pi SQLite and real OS process replacement/locking, real Git
repositories and bare remotes, the unchanged existing importer, and the actual
publisher recovery and live-verification modules. Tests assert the pushed
content independently against authored fixture text. GitHub policy and Vercel
status are local service fixtures; the fixture HTTP server renders the pushed
snapshot through the real renderer. No fixture content went to GitHub or Vercel.

Earlier development results remain in the same ignored run directory: first
11-case matrix; the failed lock canonicalisation matrix; a failed pinned-API
retry attempt; repaired 13- and 14-case runs; and final 15-case acceptance. The
installed SDK has `runtime.sleep`, not newer upstream `sleepUntil`, and no newer
SDK `restartLimit` option. The runner uses the installed API and persists its
own worker-opening budget. Those failures are not represented as passing proof.

## Website and live checks

In `/Users/callumflack/Repos/callumflack/worktrees/callum-website-log-publisher`:

- `bun log:test`: 7 importer cases and 4 renderer/selection cases pass.
- Scoped ESLint and Prettier checks for all five changed `.mjs` files, plus
  `PUBLISHING.md` formatting, pass. Node syntax checks and Python AST parsing pass.
- `bunx tsc --noEmit`, `bun run build` (95 generated pages), and `git diff --check`
  pass. There is no exposed IDE Problems/ReadLints integration in this task;
  command diagnostics supplied these checks.
- Read-only real deployment acceptance at commit
  `cf5af1c16397f814d80d5c810d41726e9583d804` passes: `/log` and four daily pages,
  all 11 top-level entries, rendered inline content, IDs, day separation,
  backlinks and any referenced image checks. Recorded in `live-check.json`.
  No real import, content commit or push was needed for that check.
- `frozen-website.json` records the exact eight website handoff files and SHA256s.
  The importer, dependencies and snapshot were not changed by this implementation.

The heartbeat TOML remained byte-identical through the handoff:
`1fd905c258775e84e73d2a2e45050284a51f34b80eb3df7a4920384e0319743b`.

## Review and limits

Independent autoreview produced **no report**. Automatic approval review rejected
sending private website source to an unspecified model destination without
explicit source-export approval. No alternate route or indirect execution was
used. This is a remaining review limitation, not a clean review result.

The tests establish the listed process/publication boundaries. They do not prove
power-loss/reboot recovery, unlimited unattended reliability, or automatic cleanup
at every instruction inside Git or the importer. Unexpected `.tmp` files or Git
index locks are preserved for inspection. Normal use requires a clean dedicated
website checkout with the recovery files present; that prerequisite is now delivered.
No background launcher, team notification, new credentials or retention job was
installed. A later invocation provides recovery after a process crash.

Production files for this change total 1,047 lines: website publisher/recovery/
verifier/lock 710 (including the extracted verifier), Pi entrypoint/task 337.
The new recovery tests and service fixture total 615 lines. The original publisher
was 227 lines. This is explicit recovery/operation code to maintain; it does not
establish that Pi has a better ROI than the existing heartbeat for this small job.

## Final real-input preflight

A non-publishing import to the ignored evidence directory found one intentional
edit to existing entry `log-fee318d6` (no added/removed IDs). The default normal
runner was therefore **not** started against the real vault: doing so would
publish that edit. `preflight.json` records the difference, and the real source
was verified unchanged during the import. The existing publisher/heartbeat
workflow retains that queued content; this task's 15-case runner acceptance is
local Git/HTTP proof plus the read-only real-deployment check above.
