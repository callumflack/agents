# Portable setup verification — 22 October 2026

The implementation checks below ran locally in the shared Agents checkout before publication was requested. The existing dirty Agents and Skills work and staged index were preserved. Replica setup uses the committed Skills baseline `c2d215b081353424fb3134594218f5926fe45298` (25 authored skills); unpublished authoring changes remain outside that baseline.

## Recorded sources

Before implementation, all 180 external skill trees from 22 GitHub repositories were retrieved, including their blobs. The original external lock had SHA-256 `4c1ce48bf9bf05c70c5052ce116a8b0cacb5eb054ecde512f84656432f3f8128`.

## Checks

- Fresh and repeated setup passed in a disposable macOS home and on a disposable Linux container's native filesystem, using mise 2026.9.7 and Node 24.14.1.
- Both produced 180 external and 25 authored skills linked into Codex, Claude, Cursor and Pi. The second runs preserved content and lock records.
- Independent comparison against the fetched Git blobs matched all 825 external files and executable modes across Mac and Linux. Generated Pstack file bytes and artifact identity also matched.
- The four real-Git restoration tests passed on Mac and Linux: upstream advancement does not change the recorded install; missing later sources install nothing; changed content and executable modes are detected; symlink destinations/trees are refused.
- Disposable Mac fault checks preserved a dirty Skills checkout, rejected a conflicting runtime-owned skill, and retained an unrelated Pi-only skill.
- A Docker bind mount of the Mac filesystem lost executable modes during copying. Verification rejected it. The installer now stages and verifies the entire batch on the destination filesystem before publishing any skill; final focused tests cover the revised implementation. Native Linux storage passed.
- The existing local instruction adapters passed their check. The generated Pstack artifact was rebuilt for the updated packager and passed freshness/ownership checks. Provider registration and fresh-session plugin loading were not performed.
- JavaScript syntax checks and `git diff --check` passed. Agents has no repository formatter/linter configuration or exposed IDE diagnostics tool for this change.

Run the retained tests with `node --test scripts/install-skills-from-lock.test.js`. On a clean replica, `mise run setup:check` verifies the installed baseline. The root README owns installation and update instructions.

After Callum explicitly approved the scoped export, the independent Codex review (GPT-6.1 Sol, medium reasoning) completed with `scoped-clean` status and no P0 or P1 findings. It covered all changed source and supplied supporting context. This was a static review: the reviewer did not execute project code, and the unchanged authored Skills linker internals were not supplied. The Mac/Linux execution checks above provide separate operational evidence. No code changes were required by the review.

## Initial live differences (superseded by the reconciliation below)

The initial read-only comparison found 156 exact matches and the following 24 missing/differing entries. The first portability change preserved them. Callum subsequently authorized the reconciliation recorded below. The dirty authored Skills checkout remains intentionally outside clean replica setup.

- `to-issues`: missing `SKILL.md`
- `to-prd`: missing `SKILL.md`
- `decision-mapping`: missing `SKILL.md`
- `review`: missing `SKILL.md`
- `vercel-composition-patterns`: missing `metadata.json`
- `vercel-react-best-practices`: missing `metadata.json`
- `vercel-react-view-transitions`: missing `metadata.json`
- `animate`: content `SKILL.md`
- `animate-expo`: content `SKILL.md`
- `animation-vocabulary`: content `SKILL.md`
- `apple-design`: content `SKILL.md`
- `ask-sonner`: content `SKILL.md`
- `emil-design-eng`: content `SKILL.md`
- `find-animation-opportunities`: content `SKILL.md`
- `improve-animations`: content `SKILL.md`
- `pick-ui-library`: content `SKILL.md`
- `review-animations`: content `SKILL.md`
- `show-me`: content `SKILL.md`, missing `agents/openai.yaml`
- `retro`: content `SKILL.md`
- `plannotator-compound`: content `SKILL.md`
- `plannotator-setup-goal`: content `SKILL.md`
- `plannotator-visual-explainer`: content `SKILL.md`, content `SKILL.test.ts`, missing `references/diagram-shell.md`
- `vercel-react-native-skills`: missing `metadata.json`
- `vercel-optimize`: missing `metadata.json`

## Live-baseline reconciliation — 22 October 2026

Callum authorized preserving the 13 local variants, checking Mermaid compatibility, restoring missing metadata, retiring four absent skills and verifying the portable result without disturbing existing uncommitted work. The implementation uses small tracked patches in Agents rather than moving variants into the separately pinned Skills repo: one Agents revision now carries the adaptations without requiring publication of a dirty Skills checkout. The external lock retains upstream source hashes and separately pins each adapted result and patch digest.

- All 13 accepted local variants are byte-for-byte unchanged. A fourteenth patch reconciles `plannotator-visual-explainer`: implicit invocation and Mermaid 11 remain, while the upstream diagram-shell reference and checks are restored.
- Installed Plannotator reports 0.27.14. Its source tag `v0.27.14`, commit `421c6af4cde06e8c12e75b3c6a86e6765f469009`, locks Mermaid 11.17.2. The reconciled skill passed all ten retained checks in a disposable source-layout fixture using that version and Happy DOM 20.14.0, including four SVG renders across light/dark palettes. This is renderer compatibility evidence, not visual approval of a generated Plannotator page.
- Restored five upstream `metadata.json` files and the recorded `emil-design-eng` body. Removed `to-issues`, `to-prd`, `decision-mapping` and `review` from the lock. Discovery now respects their explicit retirement, including when an upstream path returns; a local Git fixture proved retired names remain excluded while a new candidate is still found.
- The live content gate passes for 176 external skills, including 14 adaptations. Instruction adapters, Pstack and all four runtime link checks pass. The live authored Skills checkout remains at its existing dirty state with 28 linked skills; the portable pinned baseline still contains 25 authored skills.
- Fresh and repeated `mise run setup`, followed by `setup:check`, passed in a disposable Mac home with mise 2026.9.7 and Node 24.14.1: 176 external plus 25 pinned authored skills, linked to four runtimes. Git transport used temporary bare caches of the upstream trees fetched for this reconciliation. An independent file-by-file comparison matched all 820 external files and executable modes against the live registry.
- All six restoration regressions passed on macOS and in a disposable Linux container using Node 24.21.0. They cover exact source restoration, repeats, missing sources, content/mode drift, symlink refusal, accepted adaptations and rejected stale/tampered adaptation records. Full Linux setup was verified for the original portability change; this reconciliation reran the changed restoration path on Linux, not the full mise setup.
- A missing metadata file in the disposable replica now fails `mise run skills:check` even while `SKILL.md` and host links remain present. Restoring the metadata returns that same gate to green.
- The 19 October weekly run compared upstream hashes to lock hashes and checked body presence/links; it never hashed installed content. It separately reported the four absent skills as unavailable at upstream HEAD and retained their records. The existing `skills:check` task now includes content verification; root guidance points maintenance and verification work to the README procedure. The heartbeat already reads both owners, so its schedule and publication grant remain unchanged. A future autonomous run has not yet demonstrated use of the repaired gate.
- Inherited Agents files outside the authorized changes and the original index matched the pre-write snapshot. The dirty Skills checkout’s status and diff were unchanged. Live-registry comparison confirmed only approved file changes; all 13 variants remained identical. No commit, push, provider registration or authored Skills publication occurred.

After Callum approved the scoped reconciliation export, independent Codex review (GPT-6.1 Sol, medium reasoning) completed with `scoped-clean` status and no P0/P1 findings. The review was static; it did not independently execute the reported checks, and only the supplied unchanged context was available. No code changes were required. Temporary snapshots, fetched trees, test homes, dependency probes and review fixtures were removed. JavaScript syntax, all 21 mise task definitions and `git diff --check` pass; Agents has no configured formatter/linter or exposed IDE diagnostics surface for these paths.

## Publication candidate verification

Before the requested commit and push, the exact staged snapshot (excluding unrelated global instruction edits and experiments) passed fresh and repeated setup plus `setup:check` in a disposable Mac home on the separately advanced Node 24.22.1 pin. All 176 external skills were fetched from their recorded GitHub trees, and an independent comparison matched all 820 installed files and executable modes with the live registry. The six restoration tests, live content/instruction/Pstack checks, all 21 mise task definitions, media audit and installed pre-commit hook passed. A directory-local Git attribute preserves required blank-context whitespace in the unified patch files; patch bytes and accepted result hashes are unchanged.
