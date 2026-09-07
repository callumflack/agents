# External skill name collisions: `tdd` and `teach`

**Status:** superseded on 2026-09-07 by the reference-only Pstack record in
[`pstack.lock.json`](../../.agents/plugins/pstack.lock.json) and the current
installation policy in [`README.md`](../../README.md). The collision analysis
below remains evidence for that decision; its state snapshot is dated
2026-08-31.

## Verdict

Yes: in the global registry, pstack has replaced Matt Pocock's `tdd` and `teach`. The upstream sources still exist, but only pstack's bodies are installed, registered, and update-tracked.

This is deterministic last-install-wins behaviour, not package isolation. `npx skills add` has a source selector, but no install alias, namespace, or collision policy that can retain both variants.

## Current state

| Name | pstack source | Matt Pocock source | Globally installed and locked on 2026-08-31 |
| --- | --- | --- | --- |
| `tdd` | Narrow bug-fix workflow for a cheap failing regression test ([source](https://github.com/cursor/plugins/blob/fd878692de15a3069c21c8f429eb0b9f2fe178fa/pstack/skills/tdd/SKILL.md#L1-L11)) | General red-green TDD at agreed public seams ([source](https://github.com/mattpocock/skills/blob/6654f6b60cd9d5be8b54c6fafe44346dabeb3b76/skills/engineering/tdd/SKILL.md#L1-L10)) | pstack, from `cursor/plugins` |
| `teach` | One-shot code explanation composed from pstack `how` and `why` ([source](https://github.com/cursor/plugins/blob/fd878692de15a3069c21c8f429eb0b9f2fe178fa/pstack/skills/teach/SKILL.md#L1-L11)) | Stateful, multi-session teaching workspace ([source](https://github.com/mattpocock/skills/blob/6654f6b60cd9d5be8b54c6fafe44346dabeb3b76/skills/productivity/teach/SKILL.md#L1-L12)) | pstack, from `cursor/plugins` |

`~/.agents` resolves to this repository's `.agents`. The `tdd` and `teach` entries under `~/.codex/skills`, `~/.cursor/skills`, and `~/.claude/skills` all resolve back to those same two canonical directories. There is therefore no hidden Matt copy available to any of those clients.

## Why the overwrite happens

1. Both packages publish the bare frontmatter names `tdd` and `teach`.
2. The CLI installs a normal Git skill to `.agents/skills/<sanitized skill.name>`. If that path already exists, the summary says `overwrites`, but confirmation proceeds; `-y` skips confirmation. Installation then recursively removes and recreates the directory ([add flow](https://github.com/vercel-labs/skills/blob/435076e78988e1e6ec40d00b0b1d76bdbbc5419a/src/add.ts#L1616-L1676), [installer](https://github.com/vercel-labs/skills/blob/435076e78988e1e6ec40d00b0b1d76bdbbc5419a/src/installer.ts#L265-L300), [replacement](https://github.com/vercel-labs/skills/blob/435076e78988e1e6ec40d00b0b1d76bdbbc5419a/src/installer.ts#L336-L360)).
3. The v3 global lock is `Record<skill name, entry>`. `addSkillToLock(name, entry)` assigns the new entry to that one key, preserving only the old `installedAt` timestamp ([schema and write](https://github.com/vercel-labs/skills/blob/435076e78988e1e6ec40d00b0b1d76bdbbc5419a/src/skill-lock.ts#L49-L59), [assignment](https://github.com/vercel-labs/skills/blob/435076e78988e1e6ec40d00b0b1d76bdbbc5419a/src/skill-lock.ts#L174-L193)). Source, path, hash, and update ownership all become the last install's values.
4. `skills update` iterates the surviving lock keys and reinstalls each from its surviving source. Once pstack owns `tdd` and `teach` in the lock, normal updates cannot rediscover or update Matt's variants ([update selection](https://github.com/vercel-labs/skills/blob/435076e78988e1e6ec40d00b0b1d76bdbbc5419a/src/update.ts#L480-L523), [reinstall](https://github.com/vercel-labs/skills/blob/435076e78988e1e6ec40d00b0b1d76bdbbc5419a/src/update.ts#L680-L711)).

`owner/repo@tdd` and `--skill tdd` only select which upstream skill to fetch. They do not change its installed name ([source parser](https://github.com/vercel-labs/skills/blob/435076e78988e1e6ec40d00b0b1d76bdbbc5419a/src/source-parser.ts#L433-L450), [exact-name filter](https://github.com/vercel-labs/skills/blob/435076e78988e1e6ec40d00b0b1d76bdbbc5419a/src/skills.ts#L323-L339)). `pluginName` is grouping metadata, not part of the install identity.

This also reflects the underlying Agent Skills model: the standard requires `name` to match the parent directory, and its client guidance stores skills in a map keyed by name. It recommends deterministic precedence for collisions rather than a package namespace ([specification](https://agentskills.io/specification#name-field), [client collision guidance](https://agentskills.io/client-implementation/adding-skills-support#handling-name-collisions)).

## Options

### 1. Immediate, local, and controllable: maintain renamed owned imports

Keep one provider on the bare generic names and publish renamed copies of the other two from the Callum-owned skills repository, then link them through its existing authoring workflow. Do not hand-edit `.agents/skills` or the lockfile; the next external update would erase that work.

The semantic split suggests:

- keep Matt's general `tdd`; rename pstack's narrower variant to `bugfix-tdd` or reuse the already-owned `bug-repro-test-first` contract;
- keep Matt's stateful `teach`; rename pstack's code-explanation variant to `teach-code`.

This is the fastest way to expose both behaviours today, but it creates owned maintenance. It must also account for package-internal calls. Pstack's [`poteto-mode`](https://github.com/cursor/plugins/blob/fd878692de15a3069c21c8f429eb0b9f2fe178fa/pstack/skills/poteto-mode/playbooks/bug-fix.md#L9-L12) and [Benny](https://github.com/cursor/plugins/blob/fd878692de15a3069c21c8f429eb0b9f2fe178fa/pstack/automations/benny/skills/reproduce-and-fix-issues/SKILL.md#L260-L264) refer to bare `tdd`; Matt's [`implement`](https://github.com/mattpocock/skills/blob/6654f6b60cd9d5be8b54c6fafe44346dabeb3b76/skills/engineering/implement/SKILL.md#L7-L11) and [`ask-matt`](https://github.com/mattpocock/skills/blob/6654f6b60cd9d5be8b54c6fafe44346dabeb3b76/skills/engineering/ask-matt/SKILL.md#L24-L26) do too. Renaming only the two leaf skills makes direct invocation work but does not preserve both packages' internal graphs.

### 2. Fix the package names upstream

Ask one provider to adopt semantically specific public names and update its internal callers. This is the cleanest result under the current standard because every client sees stable, unique identities. Pstack is the more obvious rename candidate: its `tdd` is specifically a bug-regression workflow, and its `teach` is specifically code explanation, while Matt's variants claim the broader concepts.

The cost is external coordination and a breaking rename for that provider's users.

### 3. Improve the Vercel CLI

Two upstream changes are worthwhile:

- **Fail on a cross-source collision by default.** Show existing source and incoming source, then require an explicit `--overwrite`. This prevents silent loss, especially under `-y` and bulk installs.
- **Add an explicit single-skill alias**, for example `--skill tdd --as pstack-bugfix-tdd`. A correct implementation must rewrite both the destination directory and the installed frontmatter `name`, because the standard requires them to match. The lock entry must be keyed by the alias while retaining `upstreamName: tdd` for updates.

Aliasing solves direct coexistence, but not bare-name references inside other skills. Full package isolation would require source-qualified dependency references and client/runtime support, which the current Agent Skills format does not define. The CLI should not pretend folder renaming alone provides that.

## Historical recommendation

The recommendation below was not adopted. The current policy records Pstack
once as an external plugin, keeps Matt Pocock on the bare `tdd` and `teach`
names, and considers explicit aliases only when a future collision needs both
behaviours.

Use two layers:

1. **Now:** create owned, semantically renamed imports for the missing variants, with an explicit decision about which package's internal dependency graph keeps each bare name.
2. **Upstream:** propose collision refusal plus `--as` to `vercel-labs/skills`; separately propose specific public names to pstack. Treat CLI aliasing as coexistence for direct invocation, not package dependency isolation.

Install order, manual lock edits, or renaming only the installed directory are not solutions. They remain fragile, destroy provenance, or violate the name/directory contract.

## Sources and commands

Primary sources were checked at these upstream commits:

- `vercel-labs/skills` `435076e78988e1e6ec40d00b0b1d76bdbbc5419a` (v1.5.23, 2026-08-18)
- `cursor/plugins` `fd878692de15a3069c21c8f429eb0b9f2fe178fa` (2026-08-30)
- `mattpocock/skills` `6654f6b60cd9d5be8b54c6fafe44346dabeb3b76` (2026-08-24)
- [Agent Skills specification](https://agentskills.io/specification) and [official client implementation guide](https://agentskills.io/client-implementation/adding-skills-support)

Local checks:

```sh
jq '{version, tdd:.skills.tdd, teach:.skills.teach}' .agents/.skill-lock.json
realpath ~/.agents ~/.agents/skills/tdd ~/.agents/skills/teach
realpath ~/.codex/skills/tdd ~/.cursor/skills/tdd ~/.claude/skills/tdd
realpath ~/.codex/skills/teach ~/.cursor/skills/teach ~/.claude/skills/teach
sed -n '1,18p' .agents/skills/tdd/SKILL.md
sed -n '1,18p' .agents/skills/teach/SKILL.md
rg -n --glob '*.md' --glob '*.json' '\btdd\b|\bteach\b' \
  /Users/callumflack/Repos/cursor/plugins/pstack \
  /Users/callumflack/Repos/mattpocock/skills
```
