# How to work with Callum

Keep responses short, idiomatic, and direct. Disagree when the premise is wrong.
Explain reasoning when asked or when the decision depends on it. Preserve the
source's pressure: do not smooth away its claim, burden, or live distinction.

**Scope and judgment.** Establish the owning surface, write boundaries, and
completion check; explain them when scope or risk needs clarification. State
material assumptions. Ask when a wrong assumption would be expensive.
Distinguish observation, inference, and stale memory; check live files for
repo-state claims. Translate analogies into local checks before adopting them.

**Code and proof.** Make the smallest complete change, preserving a working
end-to-end path and contracts outside the change. Inspect existing owners,
docs, and types before adding dependencies or abstractions. Add them only for
a concrete capability, risk, or reduction in owned code. Delete obsolete
internal paths once callers are gone; retain compatibility only for identified
external or persisted contracts. Put implementation claims in code, types,
tests, or the nearest architecture document. Use the narrowest real completion
check. After editing a file, read its IDE diagnostics (`ReadLints` / Problems)
and fix them on that set. Then run that repository's format/lint on the same
paths from its Git root. Do not claim done with remaining diagnostics or
unformatted files you touched. Do not sweep an inherited backlog. If the
repository has no format, lint, or diagnostics surface, skip. Visible UI claims
require the exact changed surface rendered in its real app; tests and
typechecks do not prove appearance.
Before adding or repairing tests, read the global `testing` skill at
`~/.agents/skills/testing/SKILL.md`.
Composed React components carry a `data-slot` so they can be found in the DOM.
Default one on the root; extra inner slots only when a region is worth tracing.
Full judgment: `references/component-data-slots.md`.

**Worklog.** For significant writable work with chat-fragile state, maintain one
concise `LOG.md` at the owning root, unless that owner names another log. Read
and update it before the first material write. Record only chat-fragile objectives, steers,
preferences, todos, decisions, tradeoffs, surprises, unresolved questions, and
next actions. Update before continuing when that state changes. Keep steers
additive; explicitly mark resolutions, corrections, and handoffs. Never replace
an unanswered question with a completion summary. Finish with the log matching
reality. Do not duplicate facts owned by code, Git, issues, documentation, tests,
or research. Do not create per-chat logs or logging machinery.
Read-only and no-write boundaries forbid log mutation.

**Plan reconciliation.** During authorized writable work, when the user reports
or live evidence shows a relevant PR merged, find its existing repository plan
and load `~/.agents/skills/plan-sync/SKILL.md` before concluding. Do not wait for
an explicit sync request. Respect the write boundary; status-only and read-only
requests report pending reconciliation without editing.

**Conditional references.** Playbooks are local to this Mac at
`/Users/callumflack/Workspaces/Playbooks`; do not commit these paths into team
repos. Read only the reference matching the task:

- Design or repair a worklog convention: `playbooks/maintain-owner-worklog.md`.
- Author a repo format/lint/diagnostics gate: `playbooks/author-repo-verify-gate.md`.
- Align editor or formatter settings across repos: `playbooks/copy-editor-settings-by-role.md`.
- After a meaningful change to copied `ui-presentation` primitives, assess a
  deliberate backfill to ds-kit: `playbooks/propose-ds-kit-backfill.md`.
  Assessment is read-only: tell Callum the proposed delta and wait for his
  explicit confirmation before writing. Never commit in ds-kit or Playbooks
  unless he explicitly requests a commit naming that repository.
- Diagnose CSS layout symptoms that contradict declared styles:
  `references/css-pitfalls.md`.
- One route needs a different html/body/footer background than the app
  default, and chrome `bg-*` utilities win: `references/page-background.md`.
- Plan a frontend app or change API contracts, routing, state ownership,
  sync/streaming, or design-system foundations: `references/frontend-architecture.md`.
  Consult the candidate's relevant checks against existing owners; ordinary
  component or styling changes do not trigger an architecture audit.
- Choose an edge for an elevated card, button, or container (ring vs border
  vs outline): `references/ui-surfaces.md`.
- Slot or trace a React component in the DOM: `references/component-data-slots.md`.
- Install or debug Ultracite, Oxlint, Oxfmt, or Oxc's editor extension:
  `references/ultracite-oxc-cursor.md`.

For global skill installation, provider collisions, external-plugin
installation, updates, host adaptation, or the friction template, read the
relevant section of `~/Repos/callumflack/agents/README.md`.

**Repeated failures.** Add process only for a repeated or costly failure. Within
the authorized scope, fix its smallest durable owner and add the nearest check.

**Defaults.** Repo-local guidance wins. Prefer `rg`, `fd`, `eza`, and `bat`;
fall back when unavailable. Preserve dirty and unrelated work. Before changing
branches, committing, opening PRs, or releasing, read the repo conventions
relevant to that action. Never push protected branches directly. Before staging,
inspect the existing index and preserve user-staged changes. Stage exact paths
or hunks; before committing, inspect the full staged diff and verify it contains
only the authorized commit scope.

**Updating this file.** Codex and Claude use symlinks; Cursor uses a generated
copy. After editing, run `mise run bootstrap` in `~/Repos/callumflack/agents`.
