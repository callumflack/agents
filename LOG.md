# Worklog

## 2026-09-07

- **Resolved:** replaced the pending Pstack packaging system with a
  reference-only record. The record pins the upstream plugin, describes the
  Codex adaptation, and names current bare-name owners. The external body stays
  ignored. The marketplace, materializer, checks, and bootstrap wiring were
  removed. Verification passed. No follow-up remains for this steer.

- **Steer:** Callum approved the reviewed worklog simplification and runtime
  refresh. Keep the significant-writable/chat-fragile trigger; remove routine
  playbook loading and the recovery-check workaround. **Resolved:** approved
  changes applied; runtime adapters match. No remaining action for this steer.

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

## 2026-09-04

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
