# Agents Pack

My Git-backed home for global Codex and Claude instructions, external skill install records, and the scripts that link them into each agent. Published as a reference, not a drop-in configuration.

## Purpose

- `.agents/AGENTS.md` owns global instructions for Codex and Claude
- `.agents/.skill-lock.json` records external skill installs
- `scripts/` owns bootstrap, reinstall, validation, and link repair

This repo is an install home. My authored skills live in [callumflack/skills](https://github.com/callumflack/skills).

## Bootstrap

Bootstrap requires Bash, Node.js with `npx`, and [mise](https://mise.jdx.dev/).

Setup:

```sh
git clone https://github.com/callumflack/agents.git
cd agents
mise run bootstrap
```

To adapt the configuration, fork the repo and clone the fork instead. Replace `.agents/AGENTS.md` before running bootstrap.

Bootstrap creates these links:

- `~/.agents` to this checkout's `.agents` directory
- `~/.codex/AGENTS.md` to `~/.agents/AGENTS.md`
- `~/.claude/CLAUDE.md` to `~/.agents/AGENTS.md`

The script renames existing regular files or directories with a timestamped `.backup` suffix before linking. Set `AGENTS_HOME`, `CODEX_AGENTS_FILE`, or `CLAUDE_AGENTS_FILE` to override the default targets.

## External skills

Do not install the Skills CLI globally. Invoke it through `npx` from `$HOME`:

```sh
cd "$HOME"
npx skills add owner/repo
```

From this repo, run `npx skills add owner/repo -g`. A global install writes skill bodies to `~/.agents/skills/` and records them in `~/.agents/.skill-lock.json`.

Running the command here without `-g` can create a stray root `skills-lock.json`. Do not commit it. Rerun the install with `-g`, check the canonical lock, then delete the stray file.

Use the manifest tasks from this repo root:

```sh
mise run skills:check
mise run skills:print
mise run skills:install
```

Inspect `skills:print` before running `skills:install`. The install task executes every printed command and writes all locked external skills into the global registry.

## Authored skills

On my authoring machine, the skills repo links authored skills into the shared registry:

```sh
cd "$HOME/Repos/callumflack/skills"
scripts/link-skills.sh
```

Do not manage authored skills with `npx skills` or add them to `.agents/.skill-lock.json`. Other machines should follow the install instructions in [callumflack/skills](https://github.com/callumflack/skills).

## Repair links

Normal installs and the authored-skills linker create the required links. Repair them only when Cursor or Claude has missing or stale entries:

```sh
mise run repair:cursor
mise run repair:claude
```

These commands leave unrelated entries alone. The `repair:*:prune` variants also remove stale links previously managed from `~/.agents/skills`.

## Design rule

`AGENTS.md` carries orientation. Skills carry uncommon procedures. Scripts encode repeated actions. Checks prove the result. The full rules live in [`.agents/AGENTS.md`](.agents/AGENTS.md).
