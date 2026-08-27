# Agents Pack
Job: keep one small, git-backed home for global agent instructions, the external skill registry, and tiny distribution scripts.

`~/.agents` should symlink to this repo's `.agents` payload.

> AGENTS tells the agent where to look.
>
> Skills teach uncommon procedures just in time.
>
> Scripts and tools expose actions.
>
> Tests, browser truth and runtime checks prove reality.
>
> Repetition—not aspiration—earns new machinery.

## Prerequisites
- `bash`
- `node`
- `mise`

`AGENTS_HOME` can override the default `~/.agents` link target.

Run bootstrap and mise tasks from this repo root. Install skills from `$HOME`, not from this repo.

## Global Agents

Source: `.agents/AGENTS.md` (global, linked into Codex/Claude). Pack-local workflow: this repo's root `AGENTS.md`.

`AGENTS.md` is always-loaded orientation, not a workflow manual. When an agent is guessing, put the smallest constraint at the authoritative owner and prove it with the nearest oracle. Repeated friction earns a guardrail; ordinary iteration does not.

- **Owner:** the surface with authority over the decision or behavior.
- **Oracle:** the closest check that can prove the claim touched reality.

`mise run bootstrap` creates one canonical home and thin runtime adapters:

- `~/.agents` → this repo's `.agents`
- `~/.codex/AGENTS.md` → `~/.agents/AGENTS.md`
- `~/.claude/CLAUDE.md` → `~/.agents/AGENTS.md`

Existing regular instruction files are moved to timestamped backups before linking. No instruction copies or publish state are maintained.

## Commands

- Bootstrap canonical home:
  - `mise run bootstrap`
- Emergency repair for missing or stale agent-specific skill links:
  - `mise run repair:cursor`
  - `mise run repair:claude`

Direct script calls still work:
- `bash scripts/link-home.sh`
- `node scripts/sync-skills.js --target="$HOME/.cursor/skills"`
- `node scripts/sync-skills.js --target="$HOME/.claude/skills"`

Normal installs and the authored-skills linker create the required links. Do not run these repair commands as routine setup.

Use `sync-skills.js` when an agent-specific skills directory has lost or stale links to the canonical `.agents/skills` registry.

It links everything under `.agents/skills` without removing existing links. The `repair:*:prune` tasks also remove stale links previously managed from that registry; they leave unrelated files and links alone.

## Skills

`npx skills add` is scoped by cwd, not by the `~/.agents` symlink. Always from `$HOME`. Never from this repo.

```sh
z ~
npx skills add <owner/repo>
```

Already in this repo? `npx skills add <owner/repo> -g`

From `~` it writes:

- skill bodies: `.agents/skills/<skill>/`
- install record: `.agents/.skill-lock.json`

From this repo it still writes bodies here (same files, accidentally) and a stray root `skills-lock.json`. Do not commit that. Merge it into `.agents/.skill-lock.json` and delete it.

This repo is the global install home, not a skill source. External installed skill bodies are not git-tracked; `.agents/.skill-lock.json` records those external installs. Do not commit root `skills-lock.json` or `skills.json`.

Authored skills live in [callumflack/skills](https://github.com/callumflack/skills). On Callum's authoring machine they are linked from the local checkout, not installed or refreshed with `npx skills`:

```sh
cd "$HOME/Repos/callumflack/skills"
scripts/link-skills.sh
```

The global manifest records external skills only. Public consumers and other machines can still use the install commands published by the skills repository.

Check manifest discipline:

```sh
mise run skills:check
```

Reinstall from the canonical manifest:

```sh
mise run skills:print
mise run skills:install
```
