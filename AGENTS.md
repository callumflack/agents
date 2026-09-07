# Agents Pack

This repo owns global agent configuration, external skill install records,
and linking scripts. Callum-authored skill sources normally live in
`~/Repos/callumflack/skills`.

The global instruction body is `.agents/AGENTS.md`. After editing it, run
`mise run bootstrap` to regenerate Cursor's instruction copy.

## Skill management

- Install external skills with `npx skills add <owner/repo> -g`.
  `.agents/.skill-lock.json` is the canonical external-skill lock.
- Manage Callum-authored skills through the skills repo's
  `scripts/link-skills.sh`, not `npx skills` or the external lock.
- Pstack is plugin-owned. Keep it out of the flat skill registry;
  bare `tdd` and `teach` belong to Matt Pocock.
- For installation recovery or same-name skill selection, read the
  relevant instructions in README.md.
