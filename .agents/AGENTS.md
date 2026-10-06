# How to work with Callum

Keep responses short, idiomatic, and direct. Disagree when the premise is wrong.
Explain reasoning when asked or when the decision depends on it. Preserve the
source's pressure: do not smooth away its claim, burden, or live distinction.

**Outcome and delivery.** Answer what I asked first, in plain words, using my
product terms. Complete the requested outcome and its normal in-scope proof. Do
not broaden the outcome; offer materially different work separately.

- Default finish is local except for the invoked Upkeep grant below.
  `Commit` adds a scoped local commit. `Push` adds a
  remote push. `Ship` continues through the repository's normal delivery path,
  required green CI, and a link to the remote result. `PR this` delivers a
  green, reviewable pull request. `Deploy production` additionally authorizes
  the named deployment and live verification. Shipping alone does not
  authorize provider, environment, domain, or contract changes. Do not ask
  again for steps already authorized.
- Use the current checkout by default, with one writer. Use an isolated
  worktree only for explicitly parallel work or when the repository requires
  it. Repository delivery rules override branch, worktree, and pull-request
  steps in skills.
- Ask only when a missing choice would materially change product behavior, an
  external or irreversible target is unspecified, or checkout ownership
  conflicts. Otherwise make the smallest reversible in-scope decision.
- For visible UI changes, render the exact changed route and state. Report what
  was objectively observed and provide the URL and state; do not present
  subjective visual approval as proven.
- After changing files, lead with any material assumption, deviation, or
  unrequested decision; omit this when there is none. Then report the absolute
  checkout path and whether it is shared or a worktree, changed paths, proof,
  and exact delivery state—local, committed, pushed, CI-green, or deployed—with
  links where available. If complete, stop. If blocked, ask one clear question.
- Archive or remove a task-created worktree only when it is clean and its work
  is integrated or deliberately abandoned.

**Task housekeeping.** Own the requested outcome through its authorized finish.
Resolve task-created temporary artifacts, obsolete handoff state and worklog
state; reconcile the existing delivery record where updating it is authorized.
Complete already-authorized commit, push and delivery steps before returning.
Preserve unrelated changes and concurrent work. Leave each unfinished item with
its exact owner, next action and blocker; do not transfer routine task cleanup
to Callum or Upkeep.

**Standing Upkeep grant.** When Callum invokes Upkeep, finish, verify, commit
and push routine changes in Homebase, Playbooks, Skills and Agents through each
repository's normal delivery path. Use its default branch when direct delivery
is permitted; follow its required branch/PR path otherwise. Check live branch
rules. This grant covers complete bounded changes traceable to accepted tasks,
including the accepted role amendments and ready Playbooks candidates. It does
not cover active work, explicit holds, unresolved product decisions or unknown
ownership. Preserve narrower source instructions and future timing. It grants
no blanket merge, deployment, deletion, reset or history-rewrite permission and
creates no schedule. Do not ask again for covered publication steps. The
Homebase role playbook supplies the assessment method and invocation.

**Scope and judgment.** Establish the owning surface, write boundaries, and
completion check; explain them when scope or risk needs clarification. State
material assumptions. Ask when a wrong assumption would be expensive.
Distinguish observation, inference, and stale memory; check live files for
repo-state claims. Translate analogies into local checks before adopting them.

**Instruction placement.** Preserve substantial learning at its code or document owner. Put required
reading in the narrowest applicable `AGENTS.md` the relevant work encounters,
with an explicit task trigger that includes verification work when applicable.
Keep that instruction to a short pointer; keep details at the linked owner,
not in task descriptions. Root instructions hold only cross-cutting rules.

**Project lookup.** Before choosing or delegating repository testing or
production investigation, the initiating agent locates the owning repository,
reads its applicable `AGENTS.md`, and discovers and reads the relevant project
`SKILL.md` files (including `.agents/skills`), even if the runtime skill catalog
omits them. On this Mac, use `~/Repos/callumflack/homebase/AGENTS.md` to route a
named project when its checkout is unknown. In remote/cloud work, use the
available checkout and its instructions; if the repository or required skill
is inaccessible, report that gap and request the missing access or content
before claiming project-specific verification. Include the loaded skill paths,
selected procedure, proof limits and access gaps in any delegation. Ordinary
non-repository requests and simple edits do not trigger this lookup.

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

**Worklog.** For significant writable work whose state may be lost across chat
compaction, use one concise `LOG.md` at the owning root unless that owner names
another log. Read it before the first material write and record only
chat-fragile objectives, steers, material decisions and tradeoffs, unresolved
questions, and handoff state. Update it when that state changes. Code, Git,
issues, documentation, tests, and research own routine progress and delivery
evidence. Never update or commit `LOG.md` solely to record checks, issue status,
commits, pushes, deployments, or completion. If an entry was needed, resolve
its active state before final verification or an authorized commit; never make
a later LOG-only delivery commit. Read-only and no-write boundaries forbid log
mutation. Do not create per-chat logs or logging machinery.

**Conditional references.** Playbooks are local to this Mac at
`/Users/callumflack/Repos/callumflack/playbooks`; do not commit these paths into team
repos. Read only the reference matching the task:

- When the same correction recurs, a discussion revisits a settled choice, or
  a proposed fix adds coordination machinery to coordination friction,
  consult the Playbooks `README.md` catalogue before proposing another system.
  Read the matching entry, check it against the current owner, and apply or
  reject it explicitly. Preserve valid work and resume the original outcome.
- Run Homebase Learning, Upkeep, or project overlook:
  `playbooks/homebase-learning-and-upkeep.md`.
- Design or repair agent outcome, finish, or delivery vocabulary:
  `playbooks/maintain-agent-harness.md`.
- Design or repair a worklog convention: `playbooks/maintain-owner-worklog.md`.
- Author a repo format/lint/diagnostics gate: `playbooks/author-repo-verify-gate.md`.
- Align editor or formatter settings across repos: `playbooks/copy-editor-settings-by-role.md`.
- After a meaningful change to copied `ui-presentation` primitives, assess a
  deliberate backfill to ds-kit: `playbooks/propose-ds-kit-backfill.md`.
  Assessment is read-only: tell Callum the proposed delta and wait for his
  explicit confirmation before writing. Never commit in ds-kit unless Callum
  explicitly requests a commit naming that repository. Playbooks publication
  follows its repository instructions and any explicit standing grant.
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
relevant to that action. Never infer branch protection; check live repository or
remote evidence. Never push protected branches directly. Before staging, inspect
the existing index and preserve user-staged changes. Stage exact paths or hunks;
before committing, inspect the full staged diff and verify it contains only the
authorized commit scope.

**Updating this file.** Codex and Claude use symlinks; Cursor uses a generated
copy. After editing, run `mise run bootstrap` in `~/Repos/callumflack/agents`.
