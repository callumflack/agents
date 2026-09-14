import { lstatSync, readFileSync, realpathSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { comparePstackArtifactFreshness } from "./pstack-artifact.js";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const pluginPath = join(root, "plugins", "pstack");
const runtimePath = resolve(
  process.env.PSTACK_CODEX_PLUGIN || join(homedir(), "plugins", "pstack"),
);
const marketplacePath = join(root, ".agents", "plugins", "marketplace.json");

const freshness = comparePstackArtifactFreshness({ root });
if (!freshness.fresh) {
  throw new Error(
    `stale pstack artifact: expected ${freshness.expectedVersion}, found ${freshness.actualVersion}`,
  );
}

const runtimeStat = lstatSync(runtimePath);
if (!runtimeStat.isSymbolicLink()) {
  throw new Error(`pstack runtime path must be a symlink: ${runtimePath}`);
}
if (realpathSync(runtimePath) !== realpathSync(pluginPath)) {
  throw new Error(`pstack runtime path does not resolve to ${pluginPath}`);
}

const marketplace = JSON.parse(readFileSync(marketplacePath, "utf8"));
const entries = marketplace.plugins?.filter(({ name }) => name === "pstack") ?? [];
if (
  marketplace.name !== "personal" ||
  entries.length !== 1 ||
  entries[0]?.source?.source !== "local" ||
  entries[0]?.source?.path !== "./plugins/pstack"
) {
  throw new Error(`personal marketplace must contain one local ./plugins/pstack entry`);
}

console.log(`ok: pstack ${freshness.actualVersion} is fresh and linked`);
