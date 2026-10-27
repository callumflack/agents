# tstack methods integrated with existing skills

Dated assessment and local integration: 27 October 2026. Callum requested comparison and selective adoption without duplicate implementations, and installed tstack globally through skills.sh. Source: tstack [`7de017b3fc9d50c03cf3ecb98fb71e0ca65a78bd`](https://github.com/t3dotgg/tstack/tree/7de017b3fc9d50c03cf3ecb98fb71e0ca65a78bd).

## Comparison and ownership

| tstack method | Existing coverage | Integration |
| --- | --- | --- |
| `modernize` | `resolving-merge-conflicts` traces conflicting changes' intent; `resolve-merge-conflicts` extracts compact conflict context; `make-pr-easy-to-review` protects intended content during history cleanup. | Keep `modernize` as the specialist deciding whether an old PR still belongs before rebasing. Its disposition, `range-diff`, and observed-head lease fill a real gap. `review-and-ship` routes to it rather than copying its procedure. Existing conflict skills retain their mechanics. |
| `takeover` | `handoff` writes continuation context; `thread-homebase` finds unresolved work and later steering; `review-and-ship` finishes changes. | Keep `takeover` as the receiving side: reconcile the handoff with live code, preserve authors and original commits, honor the chosen continuation route, and recheck the source. It already composes with `modernize`; `review-and-ship` uses that route. |
| `sol-loop` | `autoreview` already owns independent review, explicit targets, immutable inputs, engines, severity, isolation, and validated results. `ask-astra` supplies bounded read-only advice. | Keep `sol-loop` as the outer fix-and-review cycle, and adapt it to use `autoreview` for the actual Sol review. Preserve the three-round default, evidence-based extension to five, stable findings, focused follow-up, and no approval by exhaustion. Do not add another review engine. |

The user's installed specialist commands remain available. This integration creates no skill names. Two existing skills have recorded adaptations: `review-and-ship` routes phases and retains authorized delivery; `sol-loop` composes its review cycle with `autoreview`. The independent-review cycle lives only in `sol-loop`, and inherited-work procedures remain with `modernize` and `takeover`.

## Deliberate boundaries

- Repository checks and existing task authority decide delivery; a review invocation does not itself grant permission to push, rewrite history, merge, close PRs, or post comments.
- An explicit requested model remains exact. The supported Sol route uses `autoreview`; missing model access or a dependency is a reported blocker, not silent substitution or an installation of a second helper.
- Independent review runs when requested or required, with the caller's priority policy. A round is distinct from the helper's internal pass budget and retries. Serious uncommon security or data-loss findings stay material.
- Later review rounds focus on changed code and open findings while retaining the complete target/context the helper requires. Narrative opinions do not acquire machine-validated status.
- `sol-loop` returns proof and findings to the caller for delivery. Specialist phases invoked from `review-and-ship` return their local result before later review or delivery steps.
- The user's other tstack commands and choice of tstack `council` are preserved. No watcher, conflict extractor, handoff exporter, or review helper is duplicated by this integration.

## Persistence and verification

The external-skill lock retains the original Cursor and tstack upstream trees. [Accepted adaptation patches](../.agents/skill-patches/README.md) record the two changes; each lock record separately identifies its result tree and patch digest. Bundled notices preserve tstack provenance and MIT attribution. Restore them through the existing locked installer, not by copying edited skill directories.

Validate exact restoration of both adapted trees in a disposable home, repeat restoration without changes, check that unexpected local edits are preserved, and run external content parity, Markdown paragraph/format checks, and runtime link checks. These establish packaging and availability; they do not prove better outcomes in subsequent work. No PR or independent model review needs to run to validate this documentation change.

The initial runtime instruction check reported a stale generated Cursor rule at `~/.cursor/rules/callum-agents.mdc`. On the subsequent repair request, `mise run bootstrap` regenerated the copy from the current canonical instruction body, and `mise run runtime:check` passed for Codex, Claude, Cursor, and Pi. The canonical body was left unchanged; the earlier Cursor copy was backed up before regeneration.
