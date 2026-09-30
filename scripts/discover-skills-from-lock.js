// Finds upstream Agent Skills that are not represented in the canonical lock.
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const lockPath = join(root, ".agents", ".skill-lock.json");
const policyPath = join(root, ".agents", ".skill-discovery.json");
const asJson = process.argv.includes("--json");

const manifest = JSON.parse(readFileSync(lockPath, "utf8"));
const policy = JSON.parse(readFileSync(policyPath, "utf8"));
const excludedCollections = policy.excludedCollections ?? {};
const acknowledgedCandidates = policy.acknowledgedCandidates ?? {};
const lockedSkills = Object.entries(manifest.skills ?? {}).map(([name, entry]) => ({
  name,
  source: entry.source,
  sourceUrl: entry.sourceUrl,
  skillPath: entry.skillPath,
}));

const sources = new Map();
const collectionRoots = new Map();
for (const skill of lockedSkills) {
  if (!skill.source || !skill.sourceUrl || !skill.skillPath) {
    throw new Error(`incomplete source metadata for locked skill: ${skill.name}`);
  }
  if (!sources.has(skill.source)) {
    sources.set(skill.source, skill.sourceUrl);
  } else if (sources.get(skill.source) !== skill.sourceUrl) {
    throw new Error(`conflicting source URLs for ${skill.source}`);
  }

  const roots = collectionRoots.get(skill.source) ?? new Set();
  roots.add(dirname(dirname(skill.skillPath)));
  collectionRoots.set(skill.source, roots);
}

const lockedPaths = new Set(
  lockedSkills.map((skill) => `${skill.source}\0${skill.skillPath}`),
);
const lockedOwners = new Map(lockedSkills.map((skill) => [skill.name, skill]));
const workspace = mkdtempSync(join(tmpdir(), "skill-discovery-"));
const candidates = [];

function runGit(args, cwd) {
  const result = spawnSync("git", args, {
    cwd,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  if (result.status !== 0) {
    const detail = result.stderr.trim() || result.stdout.trim();
    throw new Error(`git ${args[0]} failed${detail ? `: ${detail}` : ""}`);
  }
  return result.stdout;
}

function readSkillName(checkout, skillPath) {
  const body = runGit(["show", `HEAD:${skillPath}`], checkout);
  const frontmatter = body.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)?.[1] ?? "";
  const declared = frontmatter.match(/^name:\s*(.*?)\s*$/m)?.[1];
  if (!declared) throw new Error(`missing declared skill name in ${skillPath}`);

  let name;
  if (declared.startsWith('"')) {
    const match = declared.match(/^("(?:\\.|[^"\\])*")\s*(?:#.*)?$/);
    if (!match) throw new Error(`cannot parse quoted skill name in ${skillPath}`);
    name = JSON.parse(match[1]);
  } else if (declared.startsWith("'")) {
    const match = declared.match(/^'((?:''|[^'])*)'\s*(?:#.*)?$/);
    if (!match) throw new Error(`cannot parse quoted skill name in ${skillPath}`);
    name = match[1].replaceAll("''", "'");
  } else {
    name = declared.replace(/\s+#.*$/, "").trim();
  }

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name)) {
    throw new Error(`invalid declared skill name ${JSON.stringify(name)} in ${skillPath}`);
  }
  return name;
}

try {
  let sourceIndex = 0;
  for (const [source, sourceUrl] of [...sources].sort(([a], [b]) => a.localeCompare(b))) {
    const checkout = join(workspace, String(sourceIndex++));
    runGit(
      ["clone", "--quiet", "--filter=blob:none", "--depth=1", "--no-checkout", sourceUrl, checkout],
      root,
    );
    const paths = runGit(["ls-tree", "-r", "--name-only", "HEAD"], checkout)
      .split("\n")
      .filter((path) => path.endsWith("/SKILL.md"))
      .filter((path) => collectionRoots.get(source).has(dirname(dirname(path))))
      .filter((path) => !(dirname(dirname(path)) in (excludedCollections[source] ?? {})));

    for (const skillPath of paths) {
      if (lockedPaths.has(`${source}\0${skillPath}`)) continue;
      if (`${source}:${skillPath}` in acknowledgedCandidates) continue;

      const name = readSkillName(checkout, skillPath);
      const owner = lockedOwners.get(name);
      candidates.push({
        name,
        source,
        sourceUrl,
        skillPath,
        collision: owner
          ? { name: owner.name, source: owner.source, skillPath: owner.skillPath }
          : null,
      });
    }
  }
} finally {
  rmSync(workspace, { recursive: true, force: true });
}

candidates.sort(
  (a, b) => a.source.localeCompare(b.source) || a.skillPath.localeCompare(b.skillPath),
);

if (asJson) {
  console.log(
    JSON.stringify(
      {
        sourcesChecked: sources.size,
        excludedCollections,
        acknowledgedCandidateCount: Object.keys(acknowledgedCandidates).length,
        candidates,
      },
      null,
      2,
    ),
  );
} else if (candidates.length === 0) {
  console.log(
    `ok: ${sources.size} sources checked; no new upstream skill candidates ` +
      `(${Object.keys(acknowledgedCandidates).length} acknowledged)`,
  );
} else {
  console.log(`new upstream skill candidates (${candidates.length} across ${sources.size} sources):`);
  for (const candidate of candidates) {
    const collision = candidate.collision
      ? `; collision: ${candidate.name} is owned by ${candidate.collision.source}:${candidate.collision.skillPath}`
      : "";
    console.log(`- ${candidate.name} <- ${candidate.source}:${candidate.skillPath}${collision}`);
  }
}
