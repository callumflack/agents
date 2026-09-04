# Agents Pack

This repo is the global install home (`~/.agents` → `.agents`). It is not a skill source.

The globally loaded instruction body is [`.agents/AGENTS.md`](.agents/AGENTS.md). This file is its canonical Workspace entry point at `Personal/repos/agents/AGENTS.md`. After editing `.agents/AGENTS.md`, run `mise run bootstrap` so Cursor’s generated `~/.cursor/rules/callum-agents.mdc` matches.

## Skill installs

`npx skills add` is scoped by cwd, not by the `~/.agents` symlink.

Callum-authored skills are the exception: `$HOME/Repos/callumflack/skills` owns them and its `scripts/link-skills.sh` links them into this home. Never install `callumflack/skills` with `npx skills` on this machine or record it in `.agents/.skill-lock.json`. The lockfile is for external skills.

Always install from `$HOME`. Never from this repo:

```sh
z ~
npx skills add <owner/repo>
```

From `~`: global lock → `.agents/.skill-lock.json` (this repo, via the symlink).
From this repo: project lock → stray root `skills-lock.json`. Bodies look the same either way; the lock is the miss.

Already in this repo? Pass `-g`: `npx skills add <owner/repo> -g`

If root `skills-lock.json` appears, merge it into `.agents/.skill-lock.json` and delete it. Do not commit both.
