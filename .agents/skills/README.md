# Skills Registry

Skills are lazy-loaded workflow bundles. This README is the local map: what is active here, what is external, and where the canonical source lives.

## Policy

- Owned public skills live in `callumflack/skills` and are linked from its local checkout on Callum's machine.
- Project-local skills live in that project's `.agents/skills`.
- External skills are accounted for here and in `.agents/.skill-lock.json`; do not commit skill bodies.
- Git tracks only `.agents/skills/README.md` and `.agents/skills/.gitignore` under `.agents/skills`.
- External directories under `.agents/skills` are installer material; Callum-authored entries are links to their source repo.
- GitHub skill repos are installable with `npx skills add <owner/repo>`.
- Public skills can be browsed at `https://www.skills.sh/`.
- Callum-authored skills under `.agents/skills` must be symlinks and must not appear in `.agents/.skill-lock.json`. The lockfile is for external skills.
- `npx skills add` is scoped by cwd. Always from `~` (or pass `-g`). Never from this repo root — that writes a stray `skills-lock.json` instead of `.agents/.skill-lock.json`.

## Callum's public Skills

Canonical repo:
- Local default: `$HOME/Repos/callumflack/skills`
- GitHub: `https://github.com/callumflack/skills`

Local paths vary across machines; use GitHub as the portable reference.

Set up or refresh Callum's local authored-skill links:

```sh
cd "$HOME/Repos/callumflack/skills"
scripts/link-skills.sh
```

Do not run `npx skills add callumflack/skills` on this machine. Public consumers and other machines can use the install commands published by the skills repository.

Archive:
- `$HOME/Repos/callumflack/skills/archive`

Archived skill bodies are preserved for review, not treated as current public skills.

## Skill Manifest

This repo has one manifest for external skills:

- `.agents/.skill-lock.json`

There is no root `skills-lock.json` and no `skills.json`.

If root `skills-lock.json` appears, it means someone ran `npx skills add` from this repo root. Merge it into `.agents/.skill-lock.json`, remove it, and do not commit both.

Check:

```sh
mise run skills:check
```

## Mass Install From Lock

Print install commands:

```sh
mise run skills:print
```

Apply install commands:

```sh
mise run skills:install
```
