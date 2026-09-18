# Worklog

## 2026-09-18

- **Resolved:** committed the local skill inventory and global guidance, then
  merged the incoming inventory. The 119-skill lock keeps the local `retro`
  hash and two `flornkm` skills alongside the remote's three Plannotator
  skills and `agent-browser` metadata. Earlier no-commit notes applied to
  their prior tasks; this request superseded that boundary.

- **Post-merge route resolved:** bootstrap and Codex/Claude/Cursor instruction
  parity pass. Existing guidance edits remain intact; the external lock is
  byte-for-byte unchanged. The authored skills own reconciliation decisions.
  No staging, commits or pushes.

- **Post-merge route:** the shared plan fix needs global discovery when the user
  reports or the agent observes a relevant merge during authorized writable
  work. Keep the procedure in the authored plan skills; add only its trigger
  here. Preserve existing global guidance and external-lock edits. No commits
  or pushes. Next: regenerate runtime guidance and check parity.

## 2026-09-14

- **Resolved:** committed the remaining tracked worktree in two slices: the
  external skill registry update, then the global diagnostics guidance and
  accumulated owner-worklog history. The 114-skill manifest check, bootstrap,
  Codex/Claude/Cursor instruction parity, and diff checks pass. Push `master`
  directly after the guidance slice is committed.

- **Resolved:** made the personal Pstack marketplace durable across cleanup and
  fresh clones. The tracked record and marketplace now own a deterministic
  ignored-bundle rebuild and freshness check; bootstrap reconstructs the locked
  revision, and the weekly heartbeat advances, validates, and reinstalls only
  from a clean fast-forwarded checkout. Upgraded Pstack from `0.14.8` to
  `0.15.2`; remote-fallback rebuild, bootstrap, plugin validation, six
  compatibility tests, ownership checks, reinstall, and enabled-state proof
  pass. **Correction:** this supersedes the earlier same-day decision not to
  restore a materializer; Callum explicitly requested durability over time.

- **Resolved:** repaired the `personal` Codex marketplace at its existing Agents
  Pack owner. The tracked manifest points at the ignored adapted
  `plugins/pstack` bundle, and the duplicate explicit marketplace registration
  is removed. Marketplace and plugin listing pass; Pstack `0.14.8` validates,
  reinstalls, and reports enabled. No materializer or flat Pstack skill install
  was restored.

## 2026-09-08

- **Steer:** Callum approved putting the after-edit diagnostics trigger in
  global `.agents/AGENTS.md` (ReadLints / Problems, then that repo's
  format/lint on the touched set; no backlog sweep). Keep commands and debt
  exceptions repo-local. Re-run bootstrap. Do not paste Stake's oxlint
  paragraph.
- **Resolved:** trigger is in `.agents/AGENTS.md`. Bootstrap wrote Cursor
  `callum-agents.mdc`; Codex and Claude match the canonical body. Workspace
  `AGENTS.md` keeps only the nested-`.vscode` fact. Playbook non-applicability
  now says not to globalize commands/debt; the trigger is already global.
  Fresh Cursor chats load it; this chat still has the old prompt until
  restarted.

## 2026-09-07

- **Resolved:** the approved frontend reference, catalogue/queue entry, personal
  retrieval trigger, and KB list addendum are in place. Source preservation,
  all 15 rows, local links, and Codex/Claude/Cursor instruction parity checked.
  Behavioral promotion remains pending in the candidate queue. Callum approved
  committing this bounded change; unrelated work stays outside the slice.

- **Decision:** Callum approved a Fardeem frontend architecture candidate reference,
  conditional personal-agent retrieval, and a backlink from the KB harness list.
  Preserve all 15 source recommendations; candidate consultation is not adoption
  of its library preferences. Next: write the reference and verify retrieval links
  and runtime instruction parity.

- **Resolved:** documented the generic external-plugin decision and update
  contract, routed future agents to it, and made the Pstack record name its
  reference-only runtime, preflight, and proof. Bootstrap parity, the six
  `pstack-codex` hook tests, the 110-skill manifest, and ownership checks pass.
  **Unresolved:** select a supported Codex marketplace owner before the next
  Pstack update or reinstall. The cached plugin still loads, but the configured
  manifest-free `personal` marketplace fails both plugin-list commands; do not
  advance the pin, claim portability, or restore deleted machinery incidentally.

- **Resolved:** committed the approved Agents Pack cleanup in four slices:
  global guidance and CSS Playbook routing (`ea939f6`), external skill inventory
  (`927b9e7`), Codex link repair (`8bf3252`), and the retained collision research
  in this commit. Skills House stayed untouched and moved to a separate
  read-only overview task. Pstack remains reference-only; none of its deleted
  packaging machinery was restored.

- **Resolved:** replaced the pending Pstack packaging system with a
  reference-only record. The record pins the upstream plugin, describes the
  Codex adaptation, and names current bare-name owners. The external body stays
  ignored. The marketplace, materializer, checks, and bootstrap wiring were
  removed. Verification passed. No follow-up remains for this steer.

- **Steer:** Callum approved the reviewed worklog simplification and runtime
  refresh. Keep the significant-writable/chat-fragile trigger; remove routine
  playbook loading and the recovery-check workaround. **Resolved:** approved
  changes applied; runtime adapters match. No remaining action for this steer.

- **Handoff:** Callum requested moving `orchestrate-astra` and its provenance
  into the personal skills repo. That repo now owns the migration and global
  linking; the earlier instruction to retain the local source is superseded.
- **Resolved:** the existing runtime-linked skill now carries the approved
  arrangement; structural validation passed. Its source remains Git-ignored
  under the existing local installation policy. Fresh tasks load the update;
  no source migration or commit was requested.
- **Decision:** Callum approved adapting the existing `orchestrate-astra` skill
  so Astra leads and Sol/Terra/Luna execute, with task-specific handoffs and
  completion evidence. Keep its explicitly chosen local source location; no
  new mode or ambient rules. Next: validate the skill and installed link.

## 2026-09-05

- **Resolved:** all three approved clarifications are applied; bootstrap and
  adapter parity checks passed. No further investigation or commit made.
- **Updated steer:** Callum approved the other three review clarifications:
  log only significant work with chat-fragile state, protect the existing index
  and inspect the full commit diff, and read Git conventions for the relevant
  action. This supersedes the earlier instruction to leave them unadopted;
  no further experiments requested. Next: apply and refresh Cursor.
- **Resolved:** global guidance now limits cold-agent recovery checks to
  requested validation or promotion; regenerated adapters match. No further
  investigation or other rule changes made.
- **Steer:** stop expanding the investigation. Apply only the trial-supported
  recovery-check restriction to global guidance; leave other review proposals
  unadopted. Next: refresh Cursor and verify instruction parity.
- **Resolved:** three disposable tasks passed under both current and proposed
  guidance. Current worklog rules caused one extra recovery agent; candidate
  rules preserved the same checked outcomes without it. No live rule changes.
  **Still untested:** automatic worklog activation when all state is already
  durable. Stronger Git wording showed no advantage in this sample. Evidence:
  `/var/folders/sn/vwf7jqdd3xv71m1bymmn2xbm0000gn/T/agents-guidance-trials-z7hirxr0/report.md`.
- **Active:** run a small disposable comparison of current global guidance and
  the four review proposals. Live guidance and Playbooks stay unchanged. Check
  trivial-edit overhead, unresolved-decision preservation, and same-file staged
  work isolation; report observed behavior separately from static expectations.
- **Resolved:** global-guidance reduction is complete; the preserved worklog
  safeguards remain explicit, and Codex, Claude, and Cursor match the canonical
  body after bootstrap. No open follow-up for this change.
- **Decision:** shorten global guidance after Eric's article; retain first-write
  worklog updates, additive steers, unresolved-question protection, and rendered
  UI proof. Remove the mandatory scope announcement format. Move the friction
  template to README; keep other procedures in their existing owners. Next:
  update the global body, regenerate Cursor, and check adapter parity.
- **Resolved:** the requested standalone skill is created and structurally
  validated; the original remains intact. No open follow-up for this addition.
- **Decision:** Callum explicitly requested `orchestrate-astra` in this repo's
  `.agents/skills`, overriding the usual authored-skill source location for
  this addition. Use the tightened skill-creator draft and retain the original
  `orchestrate`. Next: create the standalone skill and validate its structure.

## 2026-09-04

- **Decision:** keep one small shared Pstack artifact module so sync and check
  cannot compute different identities. Keep flat-registry cleanup separate.
  Serialize materialization with the Mac's kernel `lockf`; do not add a plugin
  framework, cache store, generated receipt, or home-grown lease protocol.
- **Active:** fix the externally reviewed Pstack packaging defects before any
  commit. Contain lock-driven deletion and upstream symlinks, serialize
  materialization, make lock publication recoverable, bind artifact identity
  to the packager, and make the check reject stale output. Preserve the live
  Codex install, generated plugin route, unrelated dirty work, and empty index.
- **Completed:** Pstack's generated Codex body is ignored and rebuilt from the
  tracked upstream record. Locked local and remote-source rebuilds produced 123
  files with no `node_modules`; repeated bootstrap converged; plugin validation
  and all six Poteto hook tests passed. An isolated Codex home discovered the
  marketplace through `~/.agents` and installed the recorded cache-safe
  version. The live Codex installation was not changed.
- **Decision:** bootstrap always reruns the locked Pstack materializer. Checking
  only for an existing manifest would leave an old generated plugin after the
  recorded revision changes.
- **Correction:** Codex discovers the `personal` marketplace through the
  bootstrapped `~/.agents/plugins/marketplace.json`. Registering the repository
  as another marketplace duplicates `personal`; a new machine needs only
  `codex plugin add pstack@personal` after bootstrap.
- **Decision:** keep one Pstack record at
  `.agents/plugins/pstack.lock.json`. Normal sync advances it from the monitored
  checkout only after packaging succeeds; bootstrap recreates the recorded
  revision with `--locked`. Keep Codex marketplace registration and plugin
  installation as explicit one-time commands rather than hiding them in
  bootstrap.
- **Active:** make the Pstack Codex package disposable and ignored while this
  repo tracks the small record and scripts needed to recreate it. Preserve the
  existing `~/plugins/pstack` route used by the Poteto session hook. Do not add
  a Playbook or general plugin framework; mirror the existing external-skill
  install-home pattern and keep unrelated dirty work untouched.
- **Correction:** the cross-app worklog slice depends on the Cursor adapter in
  `scripts/link-home.sh` plus its README and repository-instruction pointers.
  Include only those Cursor hunks. Keep the adjacent Pstack plugin packaging,
  skill-manifest, history, and repair-task work outside this commit.
- **Completed:** isolated the owner-worklog policy, Playbooks route, and Cursor
  instruction adapter into one five-file commit slice. The staged-index
  bootstrap reproduces matching Codex, Claude, and Cursor instruction bodies.
  Older Pstack packaging, skill-manifest, repair-task, and history work remains
  outside the slice.
- **Completed:** added the narrow route from global Playbooks guidance to
  `maintain-owner-worklog`. The global body keeps the first-write and
  one-owner-log invariants and now names personal preferences, on-the-fly
  todos, decisions, and tradeoffs explicitly. Pstack and repository
  instructions remain unchanged. Bootstrap completed. Codex and Claude resolve
  to the canonical body, and Cursor's generated body matches it exactly.
- Completed correction: agents had been treating `LOG.md` as a post-hoc receipt. The global owner/oracle declaration now requires the owner log in allowed writes and makes it the first write for significant writable work. The Worklog rule now requires event-time updates and forbids closing an unanswered question with a completion summary. Codex and Claude resolve to the exact global body, Cursor's generated body matches it, and a cold Codex replay created `LOG.md` before its requested documents, updated it during progress, and preserved the exact unresolved question through completion.
- Routed Ultracite, Oxlint, Oxfmt, and Oxc editor installation or debugging to
  the local Playbooks reference. Re-run bootstrap after this edit.
- Pointed Cursor/Codex/Claude at the local Playbooks shelf (`/Users/callumflack/Workspaces/Playbooks`) from `.agents/AGENTS.md`. Callum-only Mac path; not for team clones. Re-run bootstrap after this edit.
- Worklog rule: newest date at the top; within a date, newest entry first.

## 2026-09-01

- Adopted package isolation for pstack: Cursor keeps its native plugin, Codex gets a namespaced personal plugin, and the flat global registry keeps Pocock's `tdd` and `teach`.
- Added a manifest check that rejects global `pstack/` lock entries and documented the explicit Cursor prompt that forces Pocock by canonical file path.
- During verification, a shell search with backticks accidentally executed the forbidden bulk install. Repaired the lock to 105 entries, restored Pocock and the authored links, removed all pstack global bodies, and reran the manifest, plugin, and link checks.
- Cursor now receives `.agents/AGENTS.md` via generated `~/.cursor/rules/callum-agents.mdc` (`alwaysApply: true`) from `scripts/link-home.sh`. Codex and Claude stay symlinks. Re-run bootstrap after editing the global body.

## 2026-08-31

- Investigating external skill-name collisions after pstack `tdd` and `teach` replaced Matt Pocock's same-named skills in the global registry.
- Confirmed the Skills CLI keys both installed directories and lock entries by the unqualified skill name, so the later source replaces the earlier one.
- Proposed direction: assign semantic ownership per capability, retain one canonical public name, and give only genuinely distinct behavior a deliberate alias. Add a preflight check so future installs cannot silently change the owner.
- Completed: globally re-pinned `tdd` and `teach` to `mattpocock/skills`; the targeted update path and manifest check passed. Fresh agent tasks now load Matt's versions. Coexistence with pstack remains a separate problem.
