# Agents Pack

My Git-backed home for global Codex, Claude, Cursor, and Pi instructions, external skill install records, and the scripts that link them into each agent. Published as a reference, not a drop-in configuration.

## Purpose

- `.agents/AGENTS.md` owns global instructions for Codex, Claude, Cursor, and Pi
- `.agents/.skill-lock.json` records external skill installs
- `scripts/` owns bootstrap, reinstall, validation, and link repair

This repo is an install home. My authored skills live in [callumflack/skills](https://github.com/callumflack/skills).

## Bootstrap

Bootstrap requires Bash, Node.js 24.22.1 with `npx`, and [mise](https://mise.jdx.dev/).

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
- `~/.pi/agent/AGENTS.md` to `~/.agents/AGENTS.md`
- `~/.cursor/rules/callum-agents.mdc` generated from `~/.agents/AGENTS.md` (`alwaysApply: true`; Cursor does not follow a symlink the way Codex/Claude do)

After bootstrap, verify that every adapter points at the canonical owner and that Cursor's generated copy is current:

```sh
mise run runtime:check
```

The script renames existing regular files or directories with a timestamped `.backup` suffix before linking. Set `AGENTS_HOME`, `CODEX_AGENTS_FILE`, `CLAUDE_AGENTS_FILE`, `PI_AGENTS_FILE`, or `CURSOR_AGENTS_RULE` to override the default targets.

## Portable replica setup

On another Mac or a Linux devbox, install mise, Git, Bash and tar first; Linux also needs `flock` (util-linux). Clone this Agents repository at the same accepted revision as your other machines, then run:

```sh
mise trust
mise run setup
mise run setup:check
```

Mise supplies Node 24.22.1 and obtains the authored Skills checkout at the full commit recorded in `mise.toml`. Setup links instructions, rebuilds the locked Pstack artifact, restores exact external skill trees, runs the existing Skills linker and Pi adapter, and verifies content and links. Use `mise run setup`, not bare `mise bootstrap`, for the complete sequence and its preflight checks.

The committed Skills baseline currently predates the local Pi linker edits; Agents supplies the Pi adapter explicitly. Unpublished authored changes are not part of this baseline. Setup rejects dirty Agents or Skills checkouts (including staged and untracked work), a clean Skills checkout at a different commit, and an existing `~/.agents` owned by another location before cloning, restoring or relinking anything. Existing Skills checkouts are never automatically switched to the pin. Setup uses the standard home and lock paths; conflicting `AGENTS_HOME` or `SKILLS_LOCK` overrides are rejected. On the authoring Mac, keep using the existing bootstrap and Skills linker while editing; do not reset or stash your work to make replica setup pass. After publishing an accepted Skills change, deliberately advance the Skills `ref` in `[bootstrap.repos]` and apply the same Agents revision elsewhere.

The external lock's `skillFolderHash` is the upstream Git tree SHA, covering every file and executable mode. Accepted local variants have an `adaptation` record and a tracked patch in `.agents/skill-patches/`. Restoration fetches the upstream tree, verifies and applies its patch, checks the accepted result hash, and stages and verifies all missing skills before installation. It never rewrites the lock or substitutes latest. Existing matching skills are left alone. An offline preflight checks existing external files and executable modes before setup changes repositories or links; missing recorded skills are allowed and restored afterward. Differing directories, symlinks and runtime ownership conflicts stop setup. Leave conflicting entries in place while reviewing them: preserve accepted variants as tracked adaptation patches, or publish authored changes and deliberately advance the Skills pin. Do not delete, reset, stash or move local work aside merely to make setup pass. Unrelated registry and runtime entries remain untouched, so parity covers the managed skill set, not every provider-owned skill on a machine.

```sh
mise run skills:sources:check  # retrieve all recorded trees without installing
mise run skills:content:check # offline comparison of installed external content
```

Unadapted skill updates remain deliberate `npx skills` operations followed by inspection of the lock and content check. Adapted skills require review against their pinned upstream base; do not overwrite them through `npx skills`. Follow the maintenance procedure below. Commit/push the accepted records only when authorized, then reproduce that baseline on other machines. Setup does not advance versions, register provider plugins, copy credentials, or transport Homebase/KB content. Pstack still needs its recorded native registration and a fresh-session load check.

For an existing Mac, update Agents explicitly, then use the guarded setup command:

```sh
cd ~/Repos/callumflack/agents &&
git pull --ff-only &&
mise trust &&
mise run setup
```

Run these commands in order and stop if any fails. Git updates stay separate from setup; it does not pull, merge or publish either repository. A successful setup already performs the full verification; `mise run setup:check` repeats the checks without installation. Run setup with other writers to these repositories paused.

Local verification: [portable setup evidence](docs/portable-setup-verification.md). Run the restoration and setup-preservation regressions with `mise exec -- node --test scripts/install-skills-from-lock.test.js scripts/setup.test.js`.

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
mise run skills:discover
mise run skills:print
mise run skills:install
```

`skills:discover` performs a read-only scan of every GitHub source and skill
collection already represented in the lock. A collection is the directory
containing sibling skill folders, such as `skills/` or
`cursor-team-kit/skills/`; unrelated repository-local and provider-plugin
trees are not inferred as global candidates merely because they contain a
`SKILL.md`. The command reports unrecorded paths and labels bare-name
collisions with their current owner. Discovery does not install, rename, or
overwrite anything; review each candidate and use an explicit
`npx skills add owner/repo --skill name -g` import when wanted.
`.agents/.skill-discovery.json` records deliberate collection exclusions and
reviewed candidate conflicts so the weekly report stays actionable. Exclude a
collection only when the selected skill was an explicit one-off from a
repository-local or provider-owned tree; acknowledge a candidate only with its
owner/path decision.

Inspect `skills:print` before running `skills:install`. It lists the exact source and tree for each skill. The install task restores missing recorded trees into the global registry, refuses differing existing content, and leaves the lock unchanged.

## Weekly skill maintenance

For updates, repairs and verification, `mise run skills:check` is the entry and completion check. It checks both manifest ownership and every installed file and executable mode against the accepted tree. Upstream-versus-lock comparisons establish available updates; file existence and working links do not establish installed content parity. Run `mise run runtime:check` and the Skills link checker as well; include Pi alongside Codex, Claude and Cursor.

1. Before writes, snapshot the working tree/index and installed entries being updated. Run `mise run skills:check`. Diagnose any drift before reinstalling; preserve unrecorded local changes. Read the lock's `adaptation` records and the discovery policy's `retiredSkills`.
2. Compare upstream versions and discover candidates. Do not bulk-update adapted skills: preserve their live variants and report an upstream change for a deliberate patch review. Do not reinstall retired names. Missing paths on upstream HEAD do not mean a locked historical tree is unavailable; use `skills:sources:check` to check retrievability.
3. For unadapted skills, use the supported global installer selectively. Inspect its output and lock, then run `mise run skills:check`. Some installer versions omit upstream metadata; compare against the exact tree before repairing omissions. Never change the expected hash merely to hide an unexplained mismatch.
4. For an accepted adaptation update, review the patch against its new upstream base, retain its reason, and verify its accepted tree and patch digest. Exercise fresh restoration and repeated setup in a disposable home. The lock records upstream provenance and the expected installed result separately.
5. Finish the authorized delivery only after content, instruction, link and applicable plugin checks pass. Report partial failures as partial; preserve unrelated work and existing publication boundaries.

The 19 October maintenance run checked upstream hashes, body presence and host links but did not hash installed contents. That missed local variants and omitted support files. The four missing Matt Pocock skills were reported and retained under the old preservation instruction; Callum explicitly retired those records on 22 October. The full content gate now prevents either condition being called healthy.

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

`mise run bootstrap` reconstructs the ignored plugin from the immutable Pstack
record before linking `~/plugins/pstack`. To deliberately advance Pstack, first
fast-forward the clean `~/Repos/cursor/plugins` checkout, then run:

```sh
mise run plugin:pstack:sync
mise run plugin:pstack:check
codex plugin add pstack@personal
```

`plugin:pstack:sync` publishes a package only from Git-tracked upstream files,
rejects symlinks and a dirty monitored checkout, removes Cursor-only
`disable-model-invocation` fields, and gives the generated package a version
derived from the upstream revision and packager content. The generated body
remains ignored; the lock, marketplace, materializer, and checks are tracked.

Then confirm `~/plugins/pstack` resolves to the ignored adapted bundle, a fresh
Codex task exposes `pstack:<skill>`, `.agents/.skill-lock.json` contains no
Pstack skills, and bare `tdd` and `teach` still resolve to `mattpocock/skills`.

Codex discovers the `personal` marketplace from
`~/.agents/plugins/marketplace.json`; its Pstack entry points at the ignored
adapted bundle through `./plugins/pstack`. Do not also register this repository
as an explicit `personal` marketplace in `~/.codex/config.toml`: that creates a
duplicate owner. A working update must pass both plugin-list commands before it
advances the Pstack record or reinstalls `pstack@personal`.

## Authored skills

On my authoring machine, the skills repo links authored skills into the shared registry:

```sh
cd "$HOME/Repos/callumflack/skills"
scripts/link-skills.sh
```

Do not manage authored skills with `npx skills` or add them to `.agents/.skill-lock.json`. For Callum’s other machines, use the pinned replica setup above. Public consumers can use the install instructions in [callumflack/skills](https://github.com/callumflack/skills).

## Repair links

Normal installs and the authored-skills linker create the required links. Repair a runtime when it has missing or stale entries. After installing external skills, run `repair:pi` to expose new entries to Pi: its shared-directory discovery respects the registry’s ignore rules.

```sh
mise run repair:cursor
mise run repair:claude
mise run repair:codex
mise run repair:pi
```

These commands leave unrelated entries, including Pi-only skills, alone. The `repair:*:prune` variants also remove stale links previously managed from `~/.agents/skills`.

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
