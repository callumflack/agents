We do not rename Pstack’s source skills. Codex namespaces them at the plugin boundary.

```text
cursor/plugins/pstack                 # external upstream
        │
        ├── Cursor: native Pstack plugin
        │
        └── Codex: adapted Pstack plugin
                  namespace = "pstack"
                  │
                  ├── tdd   → pstack:tdd
                  ├── teach → pstack:teach
                  ├── how   → pstack:how
                  └── ...
```

Name ownership is therefore:

```text
tdd             Matt Pocock's general TDD skill
pstack:tdd      Pstack's narrower bug-fix TDD workflow

teach           Matt Pocock's stateful teaching skill
pstack:teach    Pstack's one-shot code explanation workflow

pstack-codex    Our separate Codex compatibility adapter
```

The three owners are deliberately separate:

```text
agents/
├── .agents/.skill-lock.json
│   └── Flat external skills
│       ├── tdd   → mattpocock/skills
│       └── teach → mattpocock/skills
│
└── .agents/plugins/pstack.lock.json
    └── Pstack upstream revision, version,
        Codex adaptation recipe and namespace policy

skills/
└── pstack-codex/
    └── Our authored adapter for translating Pstack's
        Cursor models, Task calls and session modes into Codex
```

The governing files are:

- [pstack.lock.json](/Users/callumflack/Repos/callumflack/agents/.agents/plugins/pstack.lock.json:8) pins Pstack `0.14.8`, the upstream commit, the `pstack:` namespace, and bare-name ownership.
- [README.md](/Users/callumflack/Repos/callumflack/agents/README.md:59) says plugin bodies stay out of Git and collisions use plugin namespaces.
- [AGENTS.md](/Users/callumflack/Repos/callumflack/agents/AGENTS.md:10) keeps Pstack out of the flat skill registry.
- [pstack-codex/SKILL.md](/Users/callumflack/Repos/callumflack/skills/pstack-codex/SKILL.md:1) is our authored compatibility layer, linked globally from the skills repo.

At runtime:

```text
use pstack:architect
  + automatically/explicitly load pstack-codex
  → Pstack owns the workflow
  → pstack-codex translates execution into Codex primitives
```

For Poteto’s persistent thread mode, the one-time setup is:

```sh
python3 ~/.agents/skills/pstack-codex/scripts/poteto-session-mode.py install
```

One important limitation: the current Agents Pack record is reference-only. It records exactly how the Codex adaptation works, but it does not contain an automated materializer or updater. The adapted plugin is currently installed in Codex’s plugin cache; recreating it elsewhere still requires following the recorded adaptation/install process.

The rule for future collisions is:

```text
same bare name from two providers
  keep one bare-name owner
  namespace the plugin-owned implementation
  only invent an alias if both need independent public names
  record that alias in the plugin lock
```

No files changed in this explanation.