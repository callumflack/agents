# Worklog

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
