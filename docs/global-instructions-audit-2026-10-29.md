# Global instructions audit — 29 October 2026

The revised global guidance applies to thinking, research, writing, design,
software and operations across agents and models. `AGENTSX.md` is now audited
in place: all 15 original sections have an inline disposition, rationale and
active destination. Its useful constraints are retained, with specialist
procedures disclosed at their actual task triggers.

## Corrections to the first pass

The first pass read the disabled source, but treated preserving it as a backup
and making a shorter runtime file as sufficient. That did not give the source
itself an inspectable audit, and its Codex-focused framing missed broader work.

- It weakened the explicit component-slot requirement because the reference
  is labelled Candidate. That was incorrect: the reference says the global
  file owns the floor. The requirement is restored in project guidance.
- It replaced distinct specialist triggers with a generic catalogue pointer.
  The original triggers are restored in an explicit task table.
- It omitted useful details about completion at the real-use boundary,
  obsolete internal paths, worklog timing and the bounded learning-loop route.
  Those distinctions are restored at their appropriate owners.
- It overstated the IDE-tool issue. The original already said to skip an
  unavailable diagnostics surface. The revised wording preserves that existing
  boundary and avoids assuming one host's tool name.
- Retiring automatic learning integrations did not retire the existing bounded
  learning-loop skill. Selective repair remains available; no schedule is added.

At Callum's explicit direction during this revision, the concurrent removal of
the Chrome section from global guidance is preserved. This audit does not
reintroduce it in the root or a global browser reference.

## Broader source comparison

The original Provencher article is relevant, but it is not the only guide.
The Goals guide and October maintenance article are additional Codex matches;
Felix and Thariq provide the strongest broader frame for this revision.

| Source found in the KB | What informs this audit |
| --- | --- |
| [Felix Rieseberg — How to be more ambitious: A tutorial for humans with models](</Users/callumflack/Repos/callumflack/kb-2026/kb-2026/raw/_Felix Rieseberg — How to be more ambitious A tutorial for humans with models.md>) | Raw material, actual expert methods, and outside checks; improve depth within the requested scope. Explicitly model-independent. |
| [Thariq — The new rules of context engineering for Claude 5 models](</Users/callumflack/Repos/callumflack/kb-2026/kb-2026/raw/_@trq212 — The new rules of context engineering for Claude 5 models.md>) | Stable context differs from a task prompt. Preserve particular preferences and gotchas; disclose uncommon procedures and allow judgment. |
| [Thariq — A Field Guide to Fable: Finding Your Unknowns](</Users/callumflack/Repos/callumflack/kb-2026/kb-2026/raw/_@trq212 — A Field Guide to Fable Finding Your Unknowns.md>) | Discover consequential unknowns before and during work. Use concrete references, prototypes or questions according to the uncertainty. |
| [OpenAI — Using Goals in Codex (How to write a Goal)](</Users/callumflack/Repos/callumflack/kb-2026/kb-2026/raw/READ Using Goals in Codex (How to write a Goal) E6.md>) | Separate the desired end state, evidence, constraints, available resources and blocked finish. Also covers research. Host-specific Goal commands stay out of shared policy. |
| [OpenAI — Maintaining software with the GPT-6 family](</Users/callumflack/Repos/callumflack/kb-2026/kb-2026/raw/Open Ai Codex — Maintaining software with the GPT-6 family E6.md>) | Gather real evidence, preserve intentional safeguards, incorporate review, and expand a method only after useful bounded work. Captured 22 October. |
| [Eric Provencher — Rethinking skills and prompts for GPT-6 Astra](</Users/callumflack/Repos/callumflack/kb-2026/kb-2026/raw/@pvncher — Rethinking skills and prompts for GPT-6 Astra E6.md>) | Audit accumulated instructions, make reading conditional and define persistence without unnecessary approval stops. One source, not the entire audit frame. |
| [Lauren Tan — Restate my goals](</Users/callumflack/Repos/callumflack/kb-2026/kb-2026/raw/@poteto — restate in your own words what you think my goals are and what the problem i'm trying to solve is E6.md>) | Teach-back is useful when intent is uncertain; it is not a mandatory preamble for every task. |
| [Nate Berkopec and replies — Prompting power phrases](</Users/callumflack/Repos/callumflack/kb-2026/kb-2026/raw/@nateberkopec — prompting “power phrases” (a place to share them?) E6.md>) | Compact requests for evidence, prior art and a better question can direct a task without prescribing an entire workflow. |
| [Andrew Clark — Synthesize feedback into a rubric](</Users/callumflack/Repos/callumflack/kb-2026/kb-2026/raw/@acdlite — "Synthesize all the feedback I've given you so far into a rubric from which the feedback could be derived, then re-apply it to everything" — Prompt E7.md>) | Recover standards across feedback and reapply them. Preserve positive examples and judgment; do not turn every correction into a global prohibition. Captured 27 October. |
| [Shardul — I want a deeper version of this task](</Users/callumflack/Repos/callumflack/kb-2026/kb-2026/raw/@shardiban — I want a deeper version of this task — Prompt E6.md>) | Seek the relevant practitioners, raw sources, methods and independent evidence without silently broadening the task. |
| [Callum — PROMTP REFRAMING](</Users/callumflack/Repos/callumflack/kb-2026/kb-2026/wiki/PROMTP REFRAMING — List E7.md>) | Existing general-purpose collection: goal, method, agency, useful handoff, best next question and falsification. Already owned in the KB. |
| [Ryan Lopopolo — Harness engineering is just-in-time in-context learning](</Users/callumflack/Repos/callumflack/kb-2026/kb-2026/raw/@_lopopolo — harness engineering is tricks to provide JIT opportunities for ICL (in-context learning) E6.md>) | More capable models still need context about the user’s particular standards. Model capability is not a reason to discard accepted preferences. |
| [Code prompting audit — 14 July 2026](</Users/callumflack/Repos/callumflack/kb-2026/kb-2026/wiki/Code prompting audit 2026-07-14 — Audit E7.md>) | Local historical evidence about outcome clarity, stale task state, repeated ceremony and brevity that loses meaning; not a current model benchmark. |
| [Claude Opus 5.5 — Codex use review, finish lines and workflow pressure](</Users/callumflack/Repos/callumflack/kb-2026/kb-2026/raw/Claude Opus 5.5 — Codex use review, finish lines and workflow pressure.md>) | Historical review and Callum’s corrections distinguish authorization, delivery, cleanup and unnecessary machinery. Its rejected removal of pstack is not revived. |

Other material checked included Simon Last's long-running-agent advice,
selected passages from Steinberger's direct-prompting article, the
Karpathy-derived guidelines, Lauren's Cursor workflow, and Gabriel Chua's
email-drafting/context loops.
Their differences reinforce choosing technique for the work and host. They do
not establish a universal session length, orchestration setup, memory system,
or workflow. Gabriel's draft/review example also shows why a coding-only global
file misses the relevant context for writing, decks and other artifacts.

These are read local captures, including dated practitioner accounts. Their
proposals inform judgment; they do not override accepted user preferences.
No model ranking or current product-feature comparison is asserted here.

## Independent review and repairs

Astra reviewed the reconstructed original before reading its annotations and
the audit rationale, with no conversation history and no write authority. Its
recommendation was to keep the structure and make three focused repairs.
Callum then authorized applying all three and verifying the four agents.

| Review finding | Applied repair | Verification |
| --- | --- | --- |
| Preserved rules could be missed because outer reading triggers were narrower than the original | The root now explicitly routes production investigation, Homebase Learning/project overlook, repeated corrections, settled-choice revisits and coordination friction to their preserved guidance | Direct comparison of root triggers with the original and companion table |
| The extra-process threshold became only a learning-loop condition | Restore the explicit sentence “Add process only for a repeated or costly failure,” alongside the bounded skill trigger | Original wording restored in the active root and its source annotation |
| The runtime checker scanned only root skill pointers | Require the project companion and scan explicit skill pointers in both active files | Disposable fixtures for valid adapters, missing companion, missing root skill and missing companion skill |

The review distinguished present installation correctness from future checker
coverage. The earlier pointer checks were manual; they did not establish that
`runtime:check` would detect a missing companion or its relocated skill pointer.
Those two failures were reproduced against the old checker before repair.

## Audit of the original body

Each row corresponds to an inline annotation in
[AGENTSX.md](../.agents/AGENTSX.md). The original source wording remains between
those annotations, allowing a direct review of what each decision preserves.

| Original section | Decision and active destination |
| --- | --- |
| Voice | Retain idiomatic brevity, disagreement and source pressure. Add sufficient depth and explicit applicability to all kinds of work. `AGENTS.md` → Working together. |
| Outcome and delivery | Retain the real-use finish, necessary dependent updates, scope limits, permission boundary, UI proof and reporting of material decisions. General outcome stays in the root; all delivery words, CI/link requirements and worktree details stay in project guidance. |
| Task housekeeping | Retain task-owned cleanup, authorized delivery and unresolved obligations. No routine cleanup is transferred to Callum or Upkeep. Root → Carry work through; project guidance → Delivery and checkout ownership. |
| Standing Upkeep grant | Retain all three named repositories, accepted tasks and role amendments, permitted delivery routes, exclusions, local Playbooks allowance, KB publication limit and no new schedule. Root has an explicit invocation trigger; project guidance owns the full grant. |
| Scope and judgment | Retain ownership, write boundaries, real completion, expensive-assumption questions, live-state checks and translating analogy into local checks. Generalize to research, documents, design and services. Root → Working together / Judgment and evidence. |
| Instruction placement | Retain narrow ownership and task-triggered reading, including verification. Root → Context and continuity; project guidance retains the specialist routes. |
| Homebase learning | Retain selective use, resolution through `CALLUM_HOMEBASE`, authorized repair and read-only limits. Update the improvement trial to its actual closed state. Root → Context and continuity. |
| Research capture | Retain substantial reusable research capture while context is fresh, duplicate checks, KB ownership, and every routine/already-owned/read-only exclusion. Root → Context and continuity. |
| Project lookup | Retain full pre-testing/production lookup, unlisted skills, remote/access gaps and authorized delegation contents. Keep the original non-repository/simple-edit exclusion. The root explicitly includes production investigation. Project guidance → Locate the owner. |
| Code and proof | Retain existing-owner inspection, justified dependencies/abstractions, complete end-to-end behavior, obsolete-path cleanup, identified compatibility, diagnostics/formatting, test-audit, UI state proof and the composed-component slot floor. Project guidance → Code and proof. |
| Worklog | Retain the significant/chat-fragile trigger, first-write timing, event-time updates, decisions/questions/handoffs, local log conventions, final state resolution and no LOG-only delivery follow-up. Routine proof belongs at its owner. Root → Context and continuity. |
| Conditional references | Retain every branch and its exact owner, including ds-kit's proposal/write/commit distinction. Outer root triggers explicitly cover the role, recurring-correction and settled-choice branches. Project guidance → Task-triggered references. |
| Repeated failures | Retain the bounded learning-loop route, smallest owner/check and the explicit repeated-or-costly-failure threshold for adding any process. Preserve successful examples alongside corrections. Root → Context and continuity. |
| Defaults | Retain local guidance, tool preferences/fallbacks, dirty and staged work, live branch checks, protected-branch limits and exact staging. Root opening and project guidance → Locate the owner / Delivery. |
| Updating this file | Retain bootstrap and all four adapters; the existing runtime checker now requires the companion and checks required skills in both files. Root → Maintaining these instructions. |

The few substantive changes are explicit: the dated trial statement is
updated; uniform reporting ceremony becomes context-sensitive; and the general
scope now includes inquiry and artifacts. Existing technical constraints are
disclosed, not discarded. Callum separately directed removal of global browser
policy. Word count is not the acceptance criterion.

## Where the guidance now lives

- [AGENTS.md](../.agents/AGENTS.md): the working relationship, depth and scope,
  judgment, evidence, completion, authority, continuity and general learning.
- [Project work](../.agents/references/project-work.md): repository discovery,
  code/tests/UI, exact delivery vocabulary, checkout ownership, bounded Upkeep,
  skill maintenance and the original specialist reference triggers.
- [AGENTSX.md](../.agents/AGENTSX.md): the original source plus section-by-section
  audit decisions. Runtime adapters do not load it as another instruction body.

This uses the existing canonical `.agents` payload and adapter scripts. No
skill, plugin, lock, learning runtime or service deployment changes are included.
The existing adapter checker and its focused regression coverage are updated.

## Review cases

| Task | Intended route and completion |
| --- | --- |
| Explain or explore an idea | Work on the live question, sources and useful distinctions; no repository startup ritual. |
| Research unfamiliar practice | Establish actual practitioners, raw material, fitting methods and credible checks; keep material choices with Callum. |
| File supplied writing | Preserve its requested wording and apply the document owner's rules. |
| Draft or design an artifact | Use fitting references and inspect the real artifact; surface meaningful choices and actual limits. |
| A follow-up changes the constraints | Keep the underlying objective, reconcile accepted steering and inspect current state before consequential action. |
| Compose a React component | Follow project guidance; retain the root data-slot floor and narrow exceptions. |
| Ship under a local-only exception | Preserve the exception instead of treating the general word as a new publication grant. |
| Investigate production read-only | The root routes to project guidance for the original owner/skill/access lookup. |
| Run Homebase Learning or project overlook | The root routes to the role procedure without inferring Upkeep publication authority. |
| Revisit a settled choice or repeated correction | The root routes to the fitting existing reference; the task keeps its original scope. |
| Invoke Upkeep | Follow the full named grant, live repository path and exclusions. |
| Consider adding process after a miss | Apply the explicit repeated-or-costly threshold, then the bounded repair route when warranted; no automatic capture system or schedule. |

These are document-review cases. They are not independent fresh-agent runs.

## Verification and delivery

Verified in Callum's existing shared Agents checkout after applying all three
fresh-review repairs:

- Before the checker repair, `node --test` on the four isolated file-fixture
  cases produced two passes and two intended failures: the old checker returned
  success with the companion missing and with its required skill missing.
- After repair, `node --test scripts/check-home.test.js scripts/setup.test.js`
  passed **28/28 tests**: four runtime-check cases and 24 existing setup cases.
  The fixtures use disposable directories, existing path overrides and synthetic
  instruction/skill files. They launch no browser or agent host and are cleaned
  up after each case.
- `bash -n scripts/check-home.sh` and `git diff --check` passed. Whitespace and
  final-newline checks also covered untracked source and Markdown files. This
  repository has no configured formatter/linter or accessible IDE diagnostics
  surface for these files.
- `mise run bootstrap` regenerated the existing instruction adapters. Its normal
  locked Pstack rebuild retained the recorded version and lock.
- The strengthened `mise run runtime:check` passed: canonical instruction links,
  Cursor body parity, required companion presence and skill pointers in both
  active instruction files.

Direct installation checks also confirmed:

| Agent | Installed entry | Observed state |
| --- | --- | --- |
| Codex | `~/.codex/AGENTS.md` | Symlink resolves to the canonical updated file; exact content matches |
| Claude | `~/.claude/CLAUDE.md` | Symlink resolves to the canonical updated file; exact content matches |
| Pi | `~/.pi/agent/AGENTS.md` | Symlink resolves to the canonical updated file; exact content matches |
| Cursor | `~/.cursor/rules/callum-agents.mdc` | Generated body matches exactly and `alwaysApply: true` is present |

The canonical file is
`~/Repos/callumflack/agents/.agents/AGENTS.md`; all four entries can reach the
required companion through `~/.agents/references/project-work.md`. This chat
received the updated root instructions after the write.

The missing outer triggers and explicit process threshold were checked against
the original wording. All 15 source annotations remain present, and stripping
only audit annotations recovers the same original source text as before these
repairs. The companion body, external-skill/Pstack locks, staged content and
older worklog entries remain unchanged; unrelated dirty work is preserved.
The user-directed Chrome removal remains preserved in global guidance.

These checks establish the installed four-agent configuration and checker
behavior. Already-open sessions in the other hosts and comparative task quality
across models were not exercised. No performance claim follows from word count.

Verification above was completed locally before publication. Callum then
authorized a scoped commit and push of the instruction, audit and checker
changes, including only this task's log entry. Git history owns the current
commit and remote delivery state. No browser launch, credential access, skill
installation/removal or service deployment is part of this change.
