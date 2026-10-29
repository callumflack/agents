# Project work and maintenance

Read only the sections matching the task. This reference is part of Callum's
global guidance. Local repository rules and the current conversation specialize
its defaults; skill playbooks do not override those delivery boundaries.

## Locate the owner

Before choosing or delegating repository testing or production investigation,
locate the owning repository, read its applicable `AGENTS.md`, and discover and
read the relevant project skills, including `.agents/skills` when absent from
the runtime catalogue. On this Mac, route an unknown checkout through
`~/Repos/callumflack/homebase/AGENTS.md`. In remote work, use the available
checkout and instructions. Report inaccessible required guidance and access
limits before claiming project-specific verification. Include loaded skill
paths, selected procedure, proof limits, and access gaps in an authorized
handoff. Ordinary non-repository work and simple edits need no project detour.
Prefer `rg`, `fd`, `eza`, and `bat`; fall back when unavailable.

## Code and proof

Make the smallest complete change, preserving a working end-to-end path and
contracts outside the change. Inspect existing owners, docs, and types before
adding dependencies or abstractions; require a concrete capability, risk, or
reduction in owned code. Delete obsolete internal paths once callers are gone;
retain compatibility for identified external or persisted contracts. Put
implementation claims in code, types, tests, or the nearest architecture owner.

Use the narrowest real completion check. Read available IDE diagnostics for
changed files, fix change-related diagnostics, and run the repository's
format/lint for those paths from its Git root. Resolve formatting and required
checks on touched work; disclose inherited failures and unavailable surfaces.
Do not sweep an inherited backlog. Stop after relevant checks pass unless new
changes, failures, or unresolved evidence warrant more checking.

Before writing, changing, or reviewing tests, read
`~/.agents/skills/test-audit/SKILL.md`. Test the behavior or contract at risk;
reversible low-impact edits do not justify implementation-mirroring tests.

For visible UI changes, render the exact changed route and state in its real
app. Report the URL, state, and objectively observed behavior. Tests and
typechecks do not establish appearance or an authenticated journey. Follow
applicable project testing rules and name the actual test environment.

Composed React components carry a `data-slot` so they can be found in the DOM.
Default one on the root; add inner slots only when a region earns tracing.
Read `references/component-data-slots.md` in the Playbooks library for the
judgment and primitive exceptions. This is Callum's explicit component rule;
the task-triggered table below routes to the same owner.

## Delivery and checkout ownership

- `Commit` adds a scoped local commit. `Push` adds a remote push. `PR this`
  delivers a green, reviewable pull request. `Ship` continues through the
  repository's normal delivery path, required green CI, and a link to the
  remote result. Honor narrower session or repository exceptions, including
  local-only delivery. `Deploy production` adds the named deployment and live
  verification. These words grant no provider, environment, domain, or contract
  changes. Complete steps already authorized without asking again.
- Use the current checkout with one writer. Use an isolated worktree for
  explicitly parallel work or when the repository requires it. Preserve dirty
  and unrelated work, concurrent writers, and the existing index.
- Before changing branches, committing, opening PRs, or releasing, read the
  relevant repository conventions. Check live branch and remote state rather
  than assuming protection. Never push protected branches directly or bypass
  a repository guard without explicit authorization.
- Before staging, inspect the existing index and preserve user-staged changes.
  Stage exact paths or hunks; inspect the full staged diff for authorized scope.
- Own task-created temporary artifacts and obsolete handoff state. Archive or
  remove a task-created worktree only when clean and its work is integrated
  or deliberately abandoned. Preserve recoverable work and local rules.

## Standing Upkeep grant

When Callum invokes Upkeep, finish, verify, commit and push routine changes in
Homebase, Skills and Agents through each repository's normal delivery path.
Use its default branch when direct delivery is permitted; follow a required
branch/PR path otherwise. Check live branch rules. This grant covers complete
bounded changes traceable to accepted tasks, including accepted role amendments.
Ready Playbooks candidates may be applied locally in the KB-owned library;
content follows KB Sync and backup rules. This does not authorize KB publication.

The grant excludes active work, explicit holds, unresolved product decisions,
and unknown ownership. Preserve narrower source instructions and future timing.
It grants no blanket merge, deployment, deletion, reset, or history rewrite and
creates no schedule. Do not ask again for covered publication steps. Read
`playbooks/homebase-learning-and-upkeep.md` for the role procedure.

## Global skills and plugins

For global skill installation, provider collisions, external plugins, updates,
host adaptation, or the friction template, read the relevant section of
`~/Repos/callumflack/agents/README.md`. Preserve accepted local adaptations and
use its owning checks. A prompting-guide audit does not authorize bulk skill
removal, provider changes, or a plugin migration.

## Task-triggered references

Resolve Homebase through `CALLUM_HOMEBASE` or
`~/Repos/callumflack/homebase`; `Learning/Playbooks/` is the KB-owned library.
Paths below are relative to it. Keep personal Mac paths out of team repos.
Consult the current owner before applying a method; Candidate methods are
advisory unless an explicit user instruction adopts a particular rule.

| Task trigger | Read |
| --- | --- |
| The same correction recurs, a settled choice is revisited, or a fix adds coordination machinery to coordination friction | `README.md` catalogue; select the fitting entry, apply or reject it explicitly, preserve valid work and resume the outcome |
| Run Homebase Learning, Upkeep, or project overlook | `playbooks/homebase-learning-and-upkeep.md` |
| Create or repair agent guidance, outcome, finish, or delivery vocabulary | `playbooks/maintain-agent-harness.md` |
| Design or repair a worklog convention | `playbooks/maintain-owner-worklog.md` |
| Author a repository format/lint/diagnostics gate | `playbooks/author-repo-verify-gate.md` |
| Align editor or formatter settings across repositories | `playbooks/copy-editor-settings-by-role.md` |
| Meaningfully change copied `ui-presentation` primitives; assess a ds-kit backfill | `playbooks/propose-ds-kit-backfill.md`; assessment is read-only, writing needs explicit confirmation, and a ds-kit commit needs a request naming that repository |
| Diagnose CSS layout symptoms that contradict declared styles | `references/css-pitfalls.md` |
| A route needs a different html/body/footer background and chrome utilities win | `references/page-background.md` |
| Plan a frontend app or change API contracts, routing, state ownership, sync/streaming, or design-system foundations | `references/frontend-architecture.md`; ordinary component and styling work does not trigger an architecture audit |
| Choose an edge for an elevated card, button, or container | `references/ui-surfaces.md` |
| Compose or trace a React component, or add `data-slot` | `references/component-data-slots.md` |
| Install or debug Ultracite, Oxlint, Oxfmt, or Oxc's editor extension | `references/ultracite-oxc-cursor.md` |
