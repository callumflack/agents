# Agents Pack

My Git-backed home for global Codex, Claude, and Cursor instructions, external skill install records, and the scripts that link them into each agent. Published as a reference, not a drop-in configuration.

## Purpose

- `.agents/AGENTS.md` owns global instructions for Codex, Claude, and Cursor
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
- `~/.cursor/rules/callum-agents.mdc` generated from `~/.agents/AGENTS.md` (`alwaysApply: true`; Cursor does not follow a symlink the way Codex/Claude do)

The script renames existing regular files or directories with a timestamped `.backup` suffix before linking. Set `AGENTS_HOME`, `CODEX_AGENTS_FILE`, `CLAUDE_AGENTS_FILE`, or `CURSOR_AGENTS_RULE` to override the default targets.

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

## External plugins

`.agents/plugins/*.lock.json` records external plugins. Keep plugin bodies out
of Git. Local plugin files under `plugins/` are ignored.

Classify an external capability before installing it:

1. A standalone Agent Skill belongs in `.agents/.skill-lock.json`.
2. A provider plugin stays plugin-owned and gets its own
   `.agents/plugins/<name>.lock.json`; do not flatten its skills into the global
   skill registry.
3. When the plugin assumes another host's tasks, models, hooks, or modes, put
   only the host translation in a Callum-authored compatibility skill. The
   plugin still owns the workflow.
4. When names collide, keep one bare-name owner and expose the plugin's version
   through its namespace. Add an alias only when both implementations need
   independent stable names, then record it in the plugin lock.

Each plugin record should name its upstream source, revision and version,
native install route, host adaptations, namespace, bare-name owners,
compatibility skill, stable runtime path, preflight, and completion checks.

### Updating a plugin

1. Read the plugin record and identify the upstream, runtime owner, namespace,
   compatibility skill, and bare-name owners.
2. Run the recorded plugin-manager preflight. If the manager cannot enumerate
   its marketplaces and plugins, stop. A working cache is not proof that the
   plugin can be updated or reinstalled.
3. Inspect the new upstream revision. Build any host adaptation only in its
   ignored runtime location; preserve upstream skill names inside the plugin.
4. Run the compatibility-skill tests and prove the flat registry still has the
   recorded bare-name owners and no flattened copy of the plugin.
5. Install or register through the host's supported plugin system. In a fresh
   host session, prove the plugin is reported at the intended version and its
   skills load as `<namespace>:<skill>`.
6. Update the plugin record last, after the installed result and checks agree.

Do not add a materializer, marketplace, or bootstrap wiring merely to make this
procedure automatic. Add machinery only when a selected plugin needs a
repeatable installer and its owner and completion check are explicit.

### Pstack

The Pstack record pins its upstream revision and records how Cursor and Codex
use it. Cursor installs the native plugin. Codex keeps its skills under the
`pstack:` namespace and uses `pstack-codex` for Codex-specific translation.

The Pstack record currently assigns bare `tdd` and `teach` to
`mattpocock/skills`; Pstack's variants load as `pstack:tdd` and
`pstack:teach`. `pstack-codex` is a separate compatibility skill, not a renamed
Pstack skill.

Before updating Pstack, run:

```sh
codex plugin marketplace list
codex plugin list
python3 "$HOME/Repos/callumflack/skills/pstack-codex/scripts/test-poteto-session-mode.py"
mise run skills:check
```

Then confirm `~/plugins/pstack` resolves to the ignored adapted bundle, a fresh
Codex task exposes `pstack:<skill>`, `.agents/.skill-lock.json` contains no
Pstack skills, and bare `tdd` and `teach` still resolve to `mattpocock/skills`.

Current blocker: the configured Codex `personal` marketplace points at this
repository, which intentionally has no marketplace manifest. The installed
Pstack cache still loads, but both plugin-list commands fail. Do not advance the
Pstack revision, run `codex plugin add pstack@personal`, or claim reinstall
proof until a supported marketplace owner is deliberately selected. Do not
restore the deleted marketplace or materializer as an incidental repair.

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

## Friction template

Use this when an agent-process failure repeats or costs enough that another
agent should not have to rediscover it. Ordinary iteration needs no rubric.
Any resulting change stays within the authorized task scope.

```text
Miss:
Repeated or expensive:
Owning surface:
Smallest constraint:
Nearest oracle:
Where this does not apply:
```
