# How to work with Callum

Keep responses short, idiomatic, and direct. Disagree when the premise is wrong.
Don’t explain reasoning unless asked or the decision depends on it.

**Owner and oracle.** Before nontrivial action, name the owner surface, allowed writes, forbidden surfaces, done gate, and first real check. For significant writable work, include the owning worklog in allowed writes and make reading then updating it the first real check, before any other material write. An explicit read-only or no-write boundary forbids that side write. Skip for trivial chat or one-line commands.

**Epistemics.** Don’t ask agents to know what they cannot sense, measure, or verify.
Do not turn analogy into architecture: translate into repo-local checks before claiming they apply.
Prefer the smallest constraint that prevents the miss. Do not add process unless a repeated failure or high-cost footgun proves it.
When using memory, distinguish confirmed-current from stale. Re-check live files when the answer depends on repo state.
If a task is ambiguous, make one concrete assumption and state it briefly. Ask only when the wrong assumption would be expensive.

**Code.**

- Make the smallest complete change that meets the current requirement end to end. Avoid speculative abstractions, config, and indirection. Do not leave a stopgap marked for later replacement.
- Preserve a working end-to-end path. Do not replace it with unfinished architecture.
- Delete an obsolete internal path once no remaining caller depends on it. Add a shim, fallback, or migration only for an identified external or persisted contract. Keep contracts outside the change intact.
- Inspect the existing surface before adding a dependency, layer, or abstraction. Use what the project already has; read its docs and types before assuming a gap. Add a library only when it replaces code the project would otherwise own, closes a named risk, or provides a required capability the current stack lacks.
- Put implementation and architecture claims in the nearest durable owner: code, type, test, narrow comment, ADR, `CONTEXT.md`, or Git. Keep prose for user guidance, decisions, domain language, and navigation.
- Prove done with the narrowest real oracle: typecheck, test, lint, browser truth, runtime-boundary check, or exact file inspection.
- Visible UI claims require the exact changed surface rendered in its real app. Tests and typechecks do not prove appearance.

**Writing.** Preserve the source's pressure. Do not smooth language until the claim, burden, and live distinction are clear.

**Worklog.** For significant writable work, maintain one concise `LOG.md` at the owning root unless that owner already names another log; never create one per chat. Read it and write or refresh the current dated entry before the first material write. Record only chat-fragile state: the objective, material steers and personal preferences, on-the-fly todos, decisions and tradeoffs, surprises, unresolved questions, and next action. Update it before continuing whenever that state changes, not merely at completion. Keep steers additive; mark items resolved, corrected, or handed off explicitly; never delete or replace an unanswered question with a completion summary. Work is not done until the log matches reality. Newest date goes at the top; within a date, newest entry goes first. Do not duplicate detail recoverable from code, Git, issues, documentation, or test output. An explicit read-only or no-write boundary forbids log mutation. This is a pilot: do not invent log types, archives, hooks, or extra routing rules.

**Playbooks.** Callum-only shelf on this Mac, not in team clones. Catalogue: `/Users/callumflack/Workspaces/Playbooks`. Git home: `/Users/callumflack/Repos/callumflack/playbooks`. When adopting, repairing, or reconciling an owner worklog, read `/Users/callumflack/Workspaces/Playbooks/playbooks/maintain-owner-worklog.md`. When writing a repo format/lint/diagnostics done-gate, read `/Users/callumflack/Workspaces/Playbooks/playbooks/author-repo-verify-gate.md`. When aligning `.vscode` or formatter editor config across repos, read `/Users/callumflack/Workspaces/Playbooks/playbooks/copy-editor-settings-by-role.md`. When installing, reinstalling, or debugging Ultracite, Oxlint, Oxfmt, or the Oxc editor extension, read `/Users/callumflack/Workspaces/Playbooks/references/ultracite-oxc-cursor.md`. Do not commit these paths into a team repo.

**Cursor copy.** Codex and Claude symlink this file. Cursor does not: `mise run bootstrap` (agents repo) writes `~/.cursor/rules/callum-agents.mdc` from it. After any edit to this file, run that again or Cursor keeps the old body.

## Friction Promotion Rubric (when a miss repeats or costs too much)

Treat friction as evidence: when it repeats or costs too much, find where you are guessing, then add the smallest constraint and nearest check.

This is not a second operating rule. It is the diagnostic shape for that line: use it only when friction repeats or costs enough that the next agent should not have to rediscover it.

Miss:
Repeated or expensive:
Owning surface:
Smallest constraint:
Nearest oracle:
Where this does not apply:

If the issue is normal iteration, keep working. If it is repeated agent-process failure, patch the smallest surface the next cold agent will actually read or run: prompt, `AGENTS.md`, router, resolver, gate, skill, tool schema, test, snapshot, or runtime check.

## Defaults (repo-local AGENTS.md wins)

### CLI

Prefer `rg` over `grep`, `fd` over `find`, `eza` over `ls`, and `bat` over `cat`; fall back to standard tools when unavailable.

### Git

Preserve dirty and unrelated work. Before git work, inspect the repo's own branch, commit, PR, and release conventions. Never push protected branches directly. Stage exact paths only, then verify with `git diff --cached --name-only` before committing.
