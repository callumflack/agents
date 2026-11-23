# On-demand LOGFILE publisher

Run from any directory:

```sh
node /Users/callumflack/Repos/callumflack/agents/experiments/pi-durable-trial/log-publisher/run.mjs
```

This invokes the website's existing publisher through a persistent Pi Durable
1.3.0 task. It uses the dedicated `callum/log-publisher` checkout and the existing
inner KB vault by default. **Run only when Callum asks to publish LOGFILE.**
The existing 9am publishing heartbeat was paused on 20 October 2026 at his
request; do not resume it or add a schedule without a new explicit request.
The Pi job itself makes no model calls.

The website publisher changes were delivered by the —LOG chat as
`c19e35234e81d5f4882a8cc137df009fb8d1e603`. Keep the dedicated publisher checkout
clean; do not hide dirty files or relax that guard. These Agents runner files
remain local and uncommitted. Running the normal command publishes current LOGFILE changes. The first real
Pi invocation published the authored text in `3ef5b7c` and completed live
verification on 20 October 2026. A second invocation of the exact heartbeat
command completed unchanged, without another content commit or push. The
15-case acceptance record predates activation; see ACTIVATION.md for the real
publication and saved heartbeat proof.

## Operations

- `--status` prints the last Pi task/result and publisher phase without starting
  work or changing state.
- Repeating the normal command resumes an unfinished task from its SQLite
  checkpoint and retains its original deadline. After success, the next command
  admits a fresh daily task, imports current input and verifies the live site,
  including unchanged days.
- A blocked or failed task stays stopped. Inspect `--status` and its
  `publisher.log`, resolve the named cause, then use `--retry` to admit a new task
  and explicitly renew the publisher's budget. Never delete its journal to retry.
- `--workspace /path/to/publisher --vault /path/to/inner-vault` selects explicit
  local paths. Publisher branch/remote policy remains enforced.
- `--budget-ms 1200000` is the default twenty-minute absolute budget. Shorter
  budgets down to 1000 ms are allowed; restarts do not extend them. Transient
  Git/GitHub command failures get at most three publisher attempts within the
  budget, with a persisted one-second backoff. The runner separately permits three worker openings per task, including
  the initial opening; process replacement consumes that durable budget. Policy, unexpected state and validation failures require
  operator repair. An explicit retry never bypasses these guards.

Prerequisites: this Mac awake, Node with `node:sqlite` (tested 24.14.1), Bun
(tested 1.4.2), Python 3 with `fcntl` (tested 3.9.6), Git, authenticated `gh`, Git
push access, website dependencies and the parent's pinned Pi installation.
On a new installation run `npm ci --prefix <pi-durable-trial>` from its lockfile.
No 1Password access or new secrets are needed. This remains a local process;
a crash is recovered by the next invocation, not an installed background daemon.

## Recovery and ownership

Pi owns one task identity and its outcome, retries and deadline. The website
publisher owns the candidate, source/snapshot hashes, commit reconciliation,
remote reconciliation and live acceptance. The job is complete only after the
actual Vercel status and public Log checks succeed. Pi does not make an external
push transactional with SQLite.

The shared OS lock is `<git-common-dir>/log-publication.lock`. Both the original
`bun log:publish --vault ...` command and this Pi entrypoint acquire it before
work. Children inherit the lock: killing Pi alone cannot let another writer
race a surviving publisher. An overlap exits **75/busy** without admitting a task
or changing the candidate. There is no stale PID file to remove. If busy persists,
inspect the live owner; do not unlink the lock.

The publisher stores `active.json`, per-job frozen snapshots and receipts under
`<git-common-dir>/log-publication/`. Pi stores its active pointer, per-run SQLite,
logs and results in that directory's `pi/` child. These are private local Git
metadata, outside commits and KB Sync. Keep them for recovery. No retention job
was installed; archive old **completed** run directories as ordinary maintenance,
leaving active state intact.

Recovery recognises a matching commit even when interrupted before its journal
write. Before retrying a push it queries main, so a successful push whose receipt
was lost is verified rather than sent again. Verification uses the frozen
candidate, not a later KB edit. A source edit during verification is picked up
as a second distinct version, up to three versions per invocation. Continually
changing input stops for a later invocation. Unexpected staged work, candidate
changes or a different remote commit are preserved and block publication.

## Proof

```sh
cd /Users/callumflack/Repos/callumflack/agents
node --test experiments/pi-durable-trial/log-publisher/daily.test.mjs
```

The reusable matrix launches the normal runner with real pinned Pi/SQLite,
real disposable Git repositories, the unchanged importer and the publisher's
real recovery and verification code. It interrupts processes after import,
staging, commit, push, verification, and publisher completion before Pi receives
the result. It checks a single commit/push, retained task identity/deadline,
existing and newly assigned IDs, unchanged subsequent runs, overlaps through
both entrypoints, a surviving child's lock, an active deadline, separate source
versions, a real transient push rejection, and preservation of foreign staged
work and concurrent main updates. GitHub rules and Vercel are local fixture
substitutes; the local HTTP fixture renders the actually pushed snapshot.

[DAILY-EVIDENCE.md](DAILY-EVIDENCE.md) records results and proof limits. The earlier
one-off experiment and its failure/audit evidence remain in README/EVIDENCE.
