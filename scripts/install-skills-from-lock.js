// Prints or runs install commands from this repo's canonical skill manifest.
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const lockPath = process.env.SKILLS_LOCK || join(root, ".agents", ".skill-lock.json");
const apply = process.argv.includes("--apply");

const lock = JSON.parse(readFileSync(lockPath, "utf8"));
const skills = lock.skills || {};

const commands = Object.entries(skills)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([name, meta]) => {
    const source = meta.source || meta.sourceUrl;
    if (!source) {
      throw new Error(`missing source for ${name}`);
    }
    return ["npx", "skills", "add", source, "--skill", name, "-g", "-y", "--copy", "--full-depth"];
  });

if (!apply) {
  for (const command of commands) {
    console.log(command.join(" "));
  }
  console.log("\nRun with --apply to execute.");
  process.exit(0);
}

let failed = 0;
for (const command of commands) {
  const result = spawnSync(command[0], command.slice(1), {
    cwd: homedir(),
    stdio: "inherit",
  });
  if (result.status !== 0) {
    failed += 1;
  }
}

process.exit(failed === 0 ? 0 : 1);
