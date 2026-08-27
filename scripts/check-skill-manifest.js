// Checks that this repo has one canonical skill install record.
import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join, resolve } from "node:path";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const canonical = join(root, ".agents", ".skill-lock.json");
const forbidden = [
  join(root, "skills-lock.json"),
  join(root, "skills.json"),
  join(root, ".agents", "skills-lock.json"),
  join(root, ".agents", "skills.json"),
];

let failed = false;

const authoredSourcePattern = /(?:^|[:/])callumflack\/skills(?:\.git)?\/?$/;

function isAuthoredSource(entry) {
  return [entry?.source, entry?.sourceUrl].some(
    (source) => typeof source === "string" && authoredSourcePattern.test(source),
  );
}

if (!existsSync(canonical)) {
  console.error(`missing canonical skill manifest: ${canonical}`);
  failed = true;
} else {
  const manifest = JSON.parse(readFileSync(canonical, "utf8"));
  if (!manifest.skills || typeof manifest.skills !== "object") {
    console.error(`canonical manifest has no skills object: ${canonical}`);
    failed = true;
  } else {
    console.log(`ok: ${Object.keys(manifest.skills).length} skills in .agents/.skill-lock.json`);

    for (const [name, entry] of Object.entries(manifest.skills)) {
      if (isAuthoredSource(entry)) {
        console.error(`authored skill must be linked, not npx-managed: ${name}`);
        failed = true;
      }
    }
  }
}

for (const path of forbidden) {
  if (existsSync(path)) {
    console.error(`remove stray skill manifest: ${path}`);
    failed = true;
  }
}

const tracked = spawnSync("git", ["ls-files", ".agents/skills"], {
  cwd: root,
  encoding: "utf8",
});

if (tracked.status !== 0) {
  console.error(tracked.stderr.trim());
  failed = true;
} else {
  const allowed = new Set([".agents/skills/.gitignore", ".agents/skills/README.md"]);
  const forbiddenSkillFiles = tracked.stdout
    .trim()
    .split("\n")
    .filter(Boolean)
    .filter((path) => !allowed.has(path));

  if (forbiddenSkillFiles.length > 0) {
    console.error("skill bodies are tracked but should be ignored:");
    for (const path of forbiddenSkillFiles) {
      console.error(`- ${path}`);
    }
    failed = true;
  }
}

process.exit(failed ? 1 : 0);
