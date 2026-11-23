# External skills source audit

This audit records where each external skill source appears in the Field Guide and why individual skills were selected. The [external skill lockfile](../.agents/.skill-lock.json) owns installed names and provenance. The [Pstack plugin lock](../.agents/plugins/pstack.lock.json) owns Pstack. Callum’s authored skill bodies live in the separate [Skills repository](https://github.com/callumflack/skills).

## Refresh the Field Guide

1. From the Agents checkout, use `mise run skills:print` or read the live lockfile directly. Group by exact source repository and sort by source, then skill name. Compare with the audit below and note added, removed, and moved skills. Check Pstack separately against its plugin lock and installed plugin.
2. Read the installed `SKILL.md` descriptions for each new or changed skill, and revisit existing entries where the page’s description is unclear. Verify the author and public link for new or changed sources. Record the exact skill names the page names or specifically describes. List the remaining names as inventory only and explain the choice for each source. A collection link alone gives no individual skill credit.
3. Preserve the accepted page order. Lead with Pstack, Matt Pocock, and tstack as three bullets with room for their descriptions. Keep React Doctor under runtime and framework skills, hosting, deployment, and security in their own section, and the personal note about frequent use of HumanLayer’s `show-me`. Distinguish tools from the skills that teach an agent to use them. Flag material changes in placement, attribution, or recommendations in the diff.
4. Reconcile the audit with the live lockfile. Every locked source and skill should appear once in the source audit. Report Pstack separately. Update the standalone and Obsidian editions together and verify them using the Field Guide’s maintainer instructions. Keep installation, upgrades, and publication within their separately authorized scope.

## Current catalogue exclusions — 23 Nov 2026

Callum removed Cursor Team Kit and OpenClaw’s agent-skills entry from the Field Guide but explicitly retained their installed skills. Preserve that distinction when refreshing: installed inventory membership does not automatically qualify a source for the public catalogue. Warp, ast-grep and I Have ADHD were uninstalled and their names are retired in the discovery policy.

## Deliberate exception

Keep [Modern Web Guidance](https://developer.chrome.com/docs/modern-web-guidance) under **Runtime and framework skills** in both editions. It is listed for reference outside the managed installed-skill inventory. Preserve the entry and its install command during refreshes.

## Source audit

Current installed membership was reconciled on 23 November 2026: 190 locked
skills from 24 sources, with Pstack recorded separately. The five later skill
additions below receive inventory coverage only; their Field Guide placement
has not been re-reviewed in this Agents-only reconciliation. The 11 November
page-credit totals remain historical. Cursor Team Kit and OpenClaw exclusions
are applied explicitly below; this does not uninstall their skills.


Reviewed 11 Nov 2026 against 215 locked skills from 27 sources. The Field Guide names or specifically describes 81 skills. The other 134 appear below under **Left to the inventory**.

Pstack is under **Complete agent coding methods**. The separate plugin inventory had 58 installed skills at this review.

### ast-grep/agent-skill — removed 23 Nov 2026

Callum uninstalled this source because he does not use it. Removed its Field Guide entry in both editions; names are retired in `.agents/.skill-discovery.json`. Earlier review totals remain historical.

### ayghri/i-have-adhd — removed 23 Nov 2026

Callum uninstalled this source because he does not use it. Removed its Field Guide entry in both editions; names are retired in `.agents/.skill-discovery.json`. Earlier review totals remain historical.

### backnotprop/plannotator (3)

**On the page** under Smart utilities and their companion skills. [Plannotator](https://github.com/backnotprop/plannotator).

- **Named or described.** `plannotator-compound`, `plannotator-setup-goal`, `plannotator-visual-explainer`
- **Left to the inventory.** None
- **Editorial choice.** All three companion tasks are described in one tool entry.

### benjitaylor/skills (1)

**On the page** under UI and design engineering. [Benji Taylor](https://github.com/benjitaylor/skills).

- **Named or described.** `stageshow`
- **Left to the inventory.** None
- **Editorial choice.** The source contributes one skill.

### cloudflare/skills (22)

**On the page** under Hosting, deployment, and security. [Cloudflare](https://github.com/cloudflare/skills).

- **Named or described.** `agents-sdk`, `cloudflare`, `cloudflare-one`, `durable-objects`, `turnstile-spin`
- **Left to the inventory.** `basin`, `cf-cli`, `cloudflare-app-bootstrap`, `cloudflare-email-service`, `cloudflare-one-migrations`, `frameworks-on-cloudflare`, `gateway-workers`, `k2`, `nextjs-on-cloudflare`, `sandbox-migrate-to-next`, `sandbox-next`, `sandbox-stable`, `web-perf`, `workers-best-practices`, `workers-development`, `workers-profiling`, `wrangler`
- **Editorial choice.** The entry gives starting points for Workers, state, agents, sandboxes, and security. The remaining skills cover specific services, framework migrations, CLI tooling, or performance work. Broad references to a family of tasks leave the individual skills in the inventory.

### cursor/plugins (30)

**Excluded from the public catalogue on 23 November 2026; installed source retained.**

- **Named or described.** None in the current catalogue.
- **Left to the inventory.** `cancel-ralph`, `check-compiler-errors`, `cli-for-agents`, `control-cli`, `control-ui`, `create-learning-path`, `create-plugin-scaffold`, `cursor-sdk`, `deslop`, `docs-canvas`, `fix-ci`, `fix-merge-conflicts`, `get-pr-comments`, `loop-on-ci`, `make-pr-easy-to-review`, `new-branch-and-pr`, `pr-review-canvas`, `ralph-loop`, `ralph-loop-help`, `review-and-ship`, `review-plugin-submission`, `run-learning-retrospective`, `run-smoke-tests`, `thermo-nuclear-code-quality-review`, `thermo-nuclear-review`, `thermos`, `verify-this`, `weekly-review`, `what-did-i-get-done`, `workflow-from-chats`
- **Editorial choice.** Retain the installed collection while honoring its explicit catalogue exclusion. The earlier page placement is historical.

### emilkowalski/skills (19)

**On the page** under UI and design engineering. [Emil Kowalski](https://github.com/emilkowalski/skills).

- **Named or described.** `animate`, `choreograph`, `gestures`, `remove-animations`, `review-animations`
- **Left to the inventory.** `animate-expo`, `animation-performance`, `animation-vocabulary`, `apple-design`, `ask-sonner`, `break-ui`, `emil-design-eng`, `find-animation-opportunities`, `improve-animations`, `mobile-native`, `pick-ui-library`, `write-swift`, `ask-emil`, `learn-taste`
- **Editorial choice.** The entry focuses on the motion workflow. Expo, Apple design, Swift, Sonner, performance, and related review skills stay in the inventory.

Added to inventory coverage on 23 November: `ask-emil`, `learn-taste`. No new page-credit claim is made.

### flornkm/skills (3)

**On the page** under UI and design engineering. [Florian Kiem](https://raw.githubusercontent.com/flornkm/skills/main/skills/prefer-container-queries/SKILL.md).

- **Named or described.** `prefer-container-queries`, `webgl-components`
- **Left to the inventory.** `charts`
- **Editorial choice.** Both skills are linked individually.

Added to inventory coverage on 23 November: `charts`. No new page-credit claim is made.

### humanlayer/skills (5)

**On the page** under Focused agent workflows. [HumanLayer](https://github.com/humanlayer/skills).

- **Named or described.** `build-iterated-agentic-loop`, `design-control-loop`, `show-me`
- **Left to the inventory.** `improve-claude-md`, `narrow-react-prop-types`
- **Editorial choice.** The entry covers control loops and now calls out the skill you said you use often. Instruction maintenance and React prop type work are separate tasks.

### jakubkrehel/skills (18)

**On the page** under UI and design engineering. [Jakub Krehel](https://github.com/jakubkrehel/skills).

- **Named or described.** `better-accessibility`, `better-colors`, `better-interface`, `better-layout`, `better-typography`, `better-ui`, `better-writing`, `build-design`, `state-machine`
- **Left to the inventory.** `afk`, `break`, `explain-interface`, `interface-review`, `teardown`, `technical-drawing`, `variant`, `better-motion`, `upskill`
- **Editorial choice.** The entry covers the interface review, its design disciplines, and implementation. Alternate reviews, variants, illustration, and autonomous improvement stay in the inventory.

Added to inventory coverage on 23 November: `better-motion`, `upskill`. No new page-credit claim is made.

### kitlangton/2password (1)

**On the page** under Smart utilities and their companion skills. [Kit Langton’s 2password](https://github.com/kitlangton/2password).

- **Named or described.** `2password`
- **Left to the inventory.** None
- **Editorial choice.** The source contributes the utility's companion skill.

### kitlangton/motel (1)

**On the page** under Smart utilities and their companion skills. [Kit Langton’s Motel](https://github.com/kitlangton/motel).

- **Named or described.** `motel-debug`
- **Left to the inventory.** None
- **Editorial choice.** The entry names the Motel utility and its debugging skill.

### kitlangton/scrawl (1)

**On the page** under Smart utilities and their companion skills. [Kit Langton’s Scrawl](https://github.com/kitlangton/scrawl).

- **Named or described.** `scrawl`
- **Left to the inventory.** None
- **Editorial choice.** The entry describes the capture tool. The lockfile skill teaches the agent to read its captures.

### kitlangton/skills (1)

**On the page** under Runtime and framework skills. [Kit Langton’s Effect skill](https://github.com/kitlangton/skills).

- **Named or described.** `effect`
- **Left to the inventory.** None
- **Editorial choice.** The source contributes one skill.

### mattpocock/skills (47)

**On the page** under Complete agent coding methods. [Matt Pocock](https://github.com/mattpocock/skills).

- **Named or described.** `code-review`, `codebase-design`, `diagnosing-bugs`, `grill-with-docs`, `tdd`, `to-spec`, `to-tickets`
- **Left to the inventory.** `ask-matt`, `batch-grill-me`, `chief-of-staff`, `claude-handoff`, `design-an-interface` (deprecated path), `domain-modeling`, `edit-article`, `git-guardrails-claude-code`, `grill-me`, `grilling`, `handoff`, `implement`, `implement-spec`, `improve-codebase-architecture`, `loop-me`, `migrate-to-shoehorn`, `pr`, `prototype`, `qa` (deprecated path), `request-refactor-plan` (deprecated path), `research`, `resolving-merge-conflicts`, `retro`, `scaffold-exercises`, `setup-matt-pocock-skills`, `setup-pre-commit`, `setup-ts-deep-modules`, `software-factory`, `teach`, `to-questionnaire`, `triage`, `ubiquitous-language` (deprecated path), `wait-what`, `wayfinder`, `wizard`, `writing-beats`, `writing-for-agents`, `writing-fragments`, `writing-great-skills`, `writing-shape`
- **Editorial choice.** The seven examples explain the coding method. Other planning and delivery routes, writing, teaching, agent setup, and deprecated entries stay in the inventory.

### millionco/react-doctor (4)

**On the page** under Runtime and framework skills. [React Doctor](https://github.com/millionco/react-doctor).

- **Named or described.** `improve-react`, `improve-threejs`, `performance`, `react-doctor`
- **Left to the inventory.** None
- **Editorial choice.** All four jobs are described. React Doctor has moved here from UI.

### multica-ai/andrej-karpathy-skills (1)

**On the page** under Focused agent workflows. [Multica’s Karpathy Guidelines](https://github.com/multica-ai/andrej-karpathy-skills).

- **Named or described.** `karpathy-guidelines`
- **Left to the inventory.** None
- **Editorial choice.** The source contributes one skill derived from Karpathy’s observations.

### openclaw/agent-skills (8)

**Excluded from the public catalogue on 23 November 2026; installed source retained.**

- **Named or described.** None in the current catalogue.
- **Left to the inventory.** `agent-transcript`, `autoreview`, `beam`, `behavior-validator`, `crabbox`, `readme-standard`, `session-viewer`, `team-handoff`
- **Editorial choice.** Retain the installed collection while honoring its explicit catalogue exclusion. The earlier page placement is historical.

### openclaw/openclaw (1)

**On the page** under Focused agent workflows. [OpenClaw’s test-audit](https://github.com/openclaw/openclaw/tree/main/.agents/skills/test-audit).

- **Named or described.** `test-audit`
- **Left to the inventory.** None
- **Editorial choice.** The page links directly to the single imported skill from this repository.

### provencher/codex-skills (1)

**On the page** under Focused agent workflows. [Eric Provencher’s Orchestrate](https://github.com/provencher/codex-skills/tree/main/orchestrate).

- **Named or described.** `orchestrate`
- **Left to the inventory.** None
- **Editorial choice.** The source contributes one skill.

### rauchg/skills (1)

**On the page** under Smart utilities and their companion skills. [Guillermo Rauch](https://github.com/rauchg/skills).

- **Named or described.** `ui-recording-timeline`
- **Left to the inventory.** None
- **Editorial choice.** The source contributes one skill.

### shadcn-ui/ui (2)

**On the page** under UI and design engineering. [shadcn/ui](https://github.com/shadcn-ui/ui).

- **Named or described.** `migrate-radix-to-base`, `shadcn`
- **Left to the inventory.** None
- **Editorial choice.** The entry covers both registry work and migration.

### t3dotgg/tstack (9)

**On the page** under Complete agent coding methods. [Theo Browne’s tstack](https://github.com/t3dotgg/tstack).

- **Named or described.** `babysit-pr`, `file-pr`, `full-send`, `full-stop`, `modernize`, `sol-loop`, `takeover`
- **Left to the inventory.** `council`, `leaving-pr-comments`
- **Editorial choice.** The seven examples explain how a PR moves through review and delivery. Council review and comment formatting are adjacent practices.

### vercel-labs/agent-browser (1)

**On the page** under Smart utilities and their companion skills. [Vercel’s agent-browser](https://github.com/vercel-labs/agent-browser).

- **Named or described.** `agent-browser`
- **Left to the inventory.** None
- **Editorial choice.** The entry describes the browser CLI and its companion skill.

### vercel-labs/agent-skills (9)

**On the page** under UI and design engineering, Runtime and framework skills, and Hosting, deployment, and security. [Vercel’s agent skills](https://github.com/vercel-labs/agent-skills).

- **Named or described.** `deploy-to-vercel`, `vercel-composition-patterns`, `vercel-optimize`, `vercel-react-best-practices`, `vercel-react-native-skills`, `vercel-react-view-transitions`, `web-design-guidelines`
- **Left to the inventory.** `vercel-cli-with-tokens`, `writing-guidelines`
- **Editorial choice.** The page covers UI review, React engineering, and deployment. Writing guidance and token-authenticated CLI operation are narrower tasks.

### vojtaholik/good-css (1)

**On the page** under UI and design engineering. [Vojtěch Holík’s Good CSS](https://github.com/vojtaholik/good-css).

- **Named or described.** `good-css`
- **Left to the inventory.** None
- **Editorial choice.** The source contributes one skill.

### warpdotdev/common-skills — removed 23 Nov 2026

Callum uninstalled all 27 skills because he does not use this collection. Removed its Field Guide entry in both editions and recorded each retired name in `.agents/.skill-discovery.json`. The 11 Nov review totals above remain historical; this is not a full inventory refresh.
