# Learning archive and manual tools

The existing source-grounded Learning archive remains available for targeted lookup, explicit capture and backfill. Continuous per-turn assessment, case injection, native launch integration and the five-minute checker were retired on 21 October 2026 at Callum’s request. The replacement five-day improvement trial ended on 27 October 2026. Neither automatic system is active. This directory preserves evidence and manual tools; it is not automatically adopted policy.

Source and procedure owner: this Agents experiment. The visible data address is `Homebase/Learning/`, owned by the existing KB at `kb-2026/kb-2026/learning/`. Open its `README.md` or `cases.md` in Obsidian. The KB's existing notes-backup branch can archive the corpus; Homebase Git owns only its navigation route.

Native Codex transcripts remain the original history. The corpus preserves only selected visible source messages under `sources/`, with original line and turn references. It contains no tool output or model reasoning. Source paths are relative, so copying the entire corpus preserves its audit path. The schema source lives here; a matching format snapshot travels with the corpus.

## Historical daily-pass reader

During the closed five-day trial, the app heartbeat used the read-only `review` command below. It remains an on-demand reader. It reads local Codex and Pi history into a disposable result; it creates no ledger, hooks, watcher or schedule. Strict `inspect`, `capture` and `audit` evidence validation is unchanged.

```sh
python3 -B experiments/learning-corpus/learning_corpus.py review \
  --since '<previous successful review cutoff, ISO timestamp with timezone>' \
  --until '<this pass start time, ISO timestamp with timezone>' > /tmp/daily-review.json
```

The interval includes `since` and excludes `until`. Freeze the actual pass start time before running it; never use a future cutoff. Default discovery covers both the standard and configured `CODEX_HOME`, including `sessions/`, `archived_sessions/` and paths in the newest existing native index. Pi uses `~/.pi/agent/sessions` and `PI_CODING_AGENT_DIR/sessions` when configured. Repeated `--codex-home` or `--pi-root` arguments select additional/custom source sets explicitly (and replace defaults). This scope does not include remote-only chats, ChatGPT or Claude.

Every deduplicated path receives a disposition. Internal Codex workers and approval sessions are explicitly excluded; they are supporting evidence only when the parent chat needs them. Older missing index entries are listed as `outside_window_missing`, never counted as read. Missing sources that may belong to the interval, discovery errors, unsupported records, corrupt rows and unfinished final writes prevent a complete-coverage result. Valid messages around malformed rows survive with native line references. An unfinished final row is deferred until its writer completes it.

Each read uses a temporary snapshot of the initial byte boundary and verifies the original prefix before accepting it. Later appends stay outside that snapshot and mark the interval pending until a retry; rewrites, replacements and truncations invalidate it. All temporary snapshots close automatically. Sources are never edited. Full messages are retained rather than head/tail sampled. Only user messages and final assistant responses feed the review; open the native source or app reader for tool evidence or earlier goal context.

Inspect `counts`, `discovery_errors` and source dispositions to understand the material available. `coverage_complete` means the reader covered its declared local source scope; it does not establish a useful lesson or require an assessment of every chat. The closed trial curated selected experiences and research under `Homebase/Learning/README.md`; this command supplies source material, not an instruction to audit agents or repair their work. Open relevant messages and native evidence as needed to understand a candidate lesson.

Exit 2 retains partial results and forbids a claim of full source coverage. Retry a transient read failure when the missing source matters to the selected learning; state unresolved source limits honestly. A bounded selection is valid and is not a failed exhaustive review. Delete disposable extracts when finished. Keep continuity in the existing chat; no separate backlog or recurring user command is needed.

## Capture from any project

Use the installed `capture-learning` skill for an explicitly requested capture or when a consequential finding warrants preservation within the task’s authority. It interprets native evidence, appends through this importer and reconciles the readable account. Routine tasks have no mandatory capture or retrieval step. `Homebase/Learning/README.md` owns the current policy; the daily trial is closed, and a read-only task remains read-only.

The helper can inspect a source and append a curated selection to the corpus from any current directory:

```sh
python3 /Users/callumflack/Repos/callumflack/homebase/Tooling/agents/experiments/learning-corpus/learning_corpus.py inspect --thread "<thread UUID>"
python3 /Users/callumflack/Repos/callumflack/homebase/Tooling/agents/experiments/learning-corpus/learning_corpus.py capture --thread "<thread UUID>" --spec "<temporary extraction.jsonl>"
```

`inspect` pages eligible visible messages with native provenance. `capture` fills the source path, validates the owned schema and exact quotes, preserves only selected source messages, appends cases and extraction inputs, and audits the result. A later capture from the same thread retains earlier witnesses. Identical captures add no records. The agent still owns interpretation and the readable-page update, preserving human annotations. The returned `readable_update_required` field does not certify that the page has been updated; check it against the latest cases even on a retry.

Temporary capture serialization uses `Learning/.runtime/capture.lock`. It prevents concurrent captures from losing each other's archived evidence or extraction input. It holds no learning content and stays outside Git backups. For an isolated evaluation, use `capture --data-dir <temporary corpus>` and `audit --cases <temporary corpus>/cases.jsonl`.

## Import and reuse

From the Agents Git root:

```sh
python3 experiments/learning-corpus/learning_corpus.py mine \
  --spec "../homebase/Learning/extractions.jsonl"
python3 experiments/learning-corpus/learning_corpus.py audit
python3 experiments/learning-corpus/learning_corpus.py search \
  --query "read edit knowledge deliverable" --limit 2
python3 experiments/learning-corpus/learning_corpus.py request \
  --query "recovery story competing actions" --limit 2 \
  --task "The browser failed to open. The screen offers Open request, Try again and Copy link."
```

Defaults resolve the sibling Homebase checkout and its `Learning/` route. Set `CALLUM_HOMEBASE` for a different Homebase location, or supply `--cases`, `--output` or `--data-dir` explicitly. Corpus source paths stay relative regardless of the navigation route.

Python 3 with its standard library is sufficient. `request` prints an inference request; it neither sends it nor produces a classifier verdict. `jev-latest` is the proposed model alias, to resolve against the provider when actually used.

## The shape

`case.schema.json`, also included in the corpus, describes each `cases.jsonl` row. One case may span several turns. A changed interpretation appends a new revision of the same case; search uses the latest appended revision. Identical revision imports are no-ops.

| Field | Meaning | Who fills it |
| --- | --- | --- |
| `schema_version`, `id`, `revision`, `created_at` | Format, stable case identity, content hash and import time | Script, from the selected case key/source and current clock |
| `source` | Native harness, session, transcript path, original cwd and chat link | Script, from the native session header |
| `evidence` | Exact excerpts with message/turn identity, line, timestamp and text hash | Agent selects excerpts; script locates and verifies them |
| `story` | Goal, situation, needed next step and consequential cues | Agent interpretation, with unknown values allowed |
| `learning` | Candidate distinction, applicability, exceptions, owners and signal | Agent interpretation |
| `outcome` | Partial, reported resolved, user accepted or unresolved; basis and evidence keys | Agent interpretation grounded in the named source excerpts |
| `extraction` | Method and version | Script |

`extractions.jsonl` is the inspectable input the agent produced for this sample. It supplies literal excerpts and the proposed interpretation. `mine` requires every excerpt to occur in exactly one eligible message in its source. It rejects missing or ambiguous quotes before writing the batch. `audit` reopens the source and verifies the quotes, line references, metadata and content hashes.

These checks cannot establish that a selected excerpt supports the interpretation, that the agent found every important case, or that a reported repair worked. The sample marks all generalized lessons `candidate`. It retains partial and unresolved outcomes instead of equating an assistant report with success.

The transcript parser supports the observed Codex and pinned Pi 1.3.0 formats; it is not a stable universal transcript interface. It reads user messages and final assistant messages and skips injected workspace instructions. The first session header owns the log; parent headers copied into forked history cannot replace its identity or turn a subagent into a monitored user chat. Schema drift and malformed JSON fail visibly. Native message IDs differ from the display IDs returned by `read_thread`; evidence uses the native IDs and line/text hashes rather than treating those IDs as aliases.

## Retired runtime

The automatic Codex hooks, detached assessor, Pi learning extension, custom launch setting, login LaunchAgent and five-minute checker are retired. The now-closed daily trial used the app’s existing heartbeat scheduler. This archive adds no daemon, registry or scheduler and grants no authority to resume the trial. Do not reinstall the old runtime as a health repair.

The complete pre-retirement source and tests are preserved in [the 21 October archive](history/2026-10-21-runtime.tar.gz). Existing KB cases, extraction inputs, selected source evidence, Playbooks and evaluation packets remain at their owners. The archive includes the old runtime-only tests because their capture, injection and monitoring behavior is no longer an active contract. Manual corpus capture, native parsing, portability, quote validation and duplicate handling retain their active tests.

Small compatibility endpoints remain because already-open applications may hold old hook definitions or launcher paths:

- `learning_auto.py entry`, `stop` and `drain` return an empty object without reading their input or changing files. Installation refuses. `status` can inspect preserved historical jobs.
- `learning_entry.py` returns null, so an already-running proxy forwards a delegated request without adding context or receipts.
- `learning_hosts.py` returns an empty object, so a loaded Pi extension removes its old learning section and queues no work. The extension link is removed and its source registers no callbacks in new hosts.
- `learning_watch.sh` exits successfully and silently. The Python endpoint is also inert. Neither can alert or repair a connection.
- The cached launcher directly executes the native Codex CLI. The remaining JavaScript transport only forwards input, output, arguments and exit status. Existing in-memory proxies become passive through the null helper and can finish their ordinary lifetimes without a forced restart.

Retirement restored the installation receipt’s prior launch setting, removed only learning registrations, and preserved unrelated Plannotator, Pstack and tldraw hooks. Local recovery copies and a knowledge hash manifest are in `~/Library/Application Support/Callum/Learning Check/retired-2026-10-21/`. The existing installation receipts now identify the retirement. Incomplete assessment jobs, if any, must be explicitly cancelled with their prior status preserved; cancellation is never reported as a saved lesson. This installation had none outstanding.

The compatibility endpoints are not a supported way to reactivate the experiment. A future learning design needs a new explicit decision. Old source and historical evaluations remain available for inspection.

## Verification

From the Agents Git root, run the focused Python suite:

```sh
python3 -B -m unittest discover -s experiments/learning-corpus -p 'test_*.py' -v
```

The active suite protects manual capture/search/source preservation and silent retirement at the cached process boundaries. It does not establish that the closed daily trial improved development. The original reports and any later assessment retain their own evidence limits.

Archive validation on 23 November 2026: all 21 manual-capture and retirement tests passed, including the cached-proxy controls. Existing SQLite connection-cleanup `ResourceWarning` messages were observed; they did not fail the suite. No historical live Pi or publication trial was rerun.
