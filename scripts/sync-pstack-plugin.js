import {
  closeSync,
  existsSync,
  fsyncSync,
  lstatSync,
  mkdtempSync,
  mkdirSync,
  openSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import { homedir, tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildPstackArtifact,
  readPstackLock,
  validatePstackLock,
} from "./pstack-artifact.js";

const scriptPath = fileURLToPath(import.meta.url);
const here = dirname(scriptPath);
const root = resolve(here, "..");
const lockPath = join(root, ".agents", "plugins", "pstack.lock.json");
const pluginParent = join(root, "plugins");
const pluginPath = join(pluginParent, "pstack");
const processLockPath = join(pluginParent, ".pstack-sync.lock");
const ownershipMarker = ".pstack-artifact-owner";
const ownershipMarkerContents = "agents-pstack-artifact-v1\n";
const packagerFiles = [join(here, "pstack-artifact.js"), scriptPath];
const source = resolve(
  process.env.PSTACK_SOURCE || join(homedir(), "Repos", "cursor", "plugins", "pstack"),
);
const argumentsList = process.argv.slice(2);
if (
  argumentsList.length > 1 ||
  (argumentsList.length === 1 && argumentsList[0] !== "--locked")
) {
  throw new Error("usage: node scripts/sync-pstack-plugin.js [--locked]");
}
const locked = argumentsList[0] === "--locked";

function pathExists(path) {
  try {
    lstatSync(path);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}

function assertDirectory(path, label) {
  let stat;
  try {
    stat = lstatSync(path);
  } catch (error) {
    throw new Error(`could not inspect ${label} at ${path}: ${error.message}`);
  }
  if (!stat.isDirectory()) throw new Error(`${label} must be a directory: ${path}`);
}

function ownedTemporaryDirectory(prefix) {
  const path = mkdtempSync(join(pluginParent, prefix));
  try {
    writeFileSync(join(path, ownershipMarker), ownershipMarkerContents, {
      flag: "wx",
      mode: 0o600,
    });
    return path;
  } catch (error) {
    rmSync(path, { recursive: true, force: true });
    throw error;
  }
}

function cleanOwnedStaleDirectories(currentStagingRoot) {
  for (const entry of readdirSync(pluginParent).sort()) {
    if (!entry.startsWith(".pstack-staging-") && !entry.startsWith(".pstack-previous-")) {
      continue;
    }
    const path = join(pluginParent, entry);
    if (path === currentStagingRoot || !lstatSync(path).isDirectory()) continue;
    const marker = join(path, ownershipMarker);
    if (!pathExists(marker) || !lstatSync(marker).isFile()) continue;
    if (readFileSync(marker, "utf8") !== ownershipMarkerContents) continue;
    rmSync(path, { recursive: true, force: true });
  }
}

function run(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(result.stderr.trim() || `${command} ${args.join(" ")} failed`);
  }
  return result.stdout.trim();
}

function runLocked() {
  const lockMarker = "PSTACK_SYNC_LOCK_HELD";
  if (process.env[lockMarker] === processLockPath) return;
  assertDirectory(pluginParent, "pstack plugin parent");
  const result = spawnSync(
    "/usr/bin/lockf",
    ["-k", processLockPath, process.execPath, scriptPath, ...argumentsList],
    {
      stdio: "inherit",
      env: { ...process.env, [lockMarker]: processLockPath },
    },
  );
  if (result.error) throw result.error;
  process.exit(result.status ?? 1);
}

runLocked();

function parseJson(contents, label) {
  try {
    return JSON.parse(contents);
  } catch (error) {
    throw new Error(`invalid JSON in ${label}: ${error.message}`);
  }
}

function sourceRepositoryRoot() {
  return run("git", ["-C", source, "rev-parse", "--show-toplevel"]);
}

function revisionExists(repository, revision) {
  const result = spawnSync(
    "git",
    ["-C", repository, "cat-file", "-e", `${revision}^{commit}`],
    { encoding: "utf8" },
  );
  return !result.error && result.status === 0;
}

function lockFromMonitoredCheckout() {
  if (locked) return readPstackLock(lockPath);
  if (!existsSync(source)) {
    throw new Error(`missing monitored pstack checkout: ${source}`);
  }

  const repositoryRoot = sourceRepositoryRoot();
  const status = run("git", ["-C", repositoryRoot, "status", "--porcelain"]);
  if (status) {
    throw new Error(`monitored pstack checkout must be clean: ${repositoryRoot}`);
  }
  const currentLock = readPstackLock(lockPath);
  const revision = run("git", [
    "-C",
    repositoryRoot,
    "log",
    "-1",
    "--format=%H",
    "HEAD",
    "--",
    "pstack",
  ]);
  const manifest = parseJson(
    run(
      "git",
      ["-C", repositoryRoot, "show", `${revision}:pstack/.cursor-plugin/plugin.json`],
      repositoryRoot,
    ),
    `pstack manifest at ${revision}`,
  );
  return validatePstackLock({
    ...currentLock,
    repository: manifest.repository,
    subpath: "pstack",
    revision,
    version: manifest.version,
  });
}

function repositoryFor(lock) {
  if (existsSync(source) && revisionExists(source, lock.revision)) {
    return { path: source, cleanup: () => {} };
  }

  const checkout = mkdtempSync(join(tmpdir(), "agents-pstack-"));
  try {
    run("git", ["clone", "--quiet", "--no-checkout", lock.repository, checkout]);
    if (!revisionExists(checkout, lock.revision)) {
      run("git", ["fetch", "--quiet", "--depth=1", "origin", lock.revision], checkout);
    }
    if (!revisionExists(checkout, lock.revision)) {
      throw new Error(`recorded pstack revision is unavailable: ${lock.revision}`);
    }
    return { path: checkout, cleanup: () => rmSync(checkout, { recursive: true, force: true }) };
  } catch (error) {
    rmSync(checkout, { recursive: true, force: true });
    throw error;
  }
}

function validateGitTree(repository, lock) {
  const repositoryRoot = run("git", ["-C", repository, "rev-parse", "--show-toplevel"]);
  const result = spawnSync(
    "git",
    ["-C", repositoryRoot, "ls-tree", "-r", "-z", "--full-tree", lock.revision, "--", lock.subpath],
    { encoding: null, maxBuffer: 64 * 1024 * 1024 },
  );
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(
      result.stderr?.toString().trim() || `could not inspect pstack at ${lock.revision}`,
    );
  }

  const entries = result.stdout.toString("utf8").split("\0").filter(Boolean);
  if (entries.length === 0) {
    throw new Error(`recorded pstack revision has no files at ${lock.subpath}`);
  }
  for (const entry of entries) {
    const separator = entry.indexOf("\t");
    const header = separator === -1 ? [] : entry.slice(0, separator).split(" ");
    const path = separator === -1 ? entry : entry.slice(separator + 1);
    const [mode, type, object] = header;
    if (
      header.length !== 3 ||
      !["100644", "100755"].includes(mode) ||
      type !== "blob" ||
      !/^[0-9a-f]{40}$/.test(object) ||
      !path.startsWith(`${lock.subpath}/`)
    ) {
      throw new Error(`pstack Git tree contains a symlink or special entry: ${path}`);
    }
  }
}

function exportRevision(repository, lock, destination) {
  const repositoryRoot = run("git", ["-C", repository, "rev-parse", "--show-toplevel"]);
  validateGitTree(repositoryRoot, lock);
  const archive = spawnSync(
    "git",
    ["-C", repositoryRoot, "archive", "--format=tar", lock.revision, "--", lock.subpath],
    { encoding: null, maxBuffer: 64 * 1024 * 1024 },
  );
  if (archive.error) throw archive.error;
  if (archive.status !== 0) {
    throw new Error(
      archive.stderr?.toString().trim() || `could not archive pstack at ${lock.revision}`,
    );
  }

  const extraction = spawnSync(
    "tar",
    ["-x", "-f", "-", "--strip-components=1", "-C", destination],
    { input: archive.stdout, encoding: "utf8" },
  );
  if (extraction.error) throw extraction.error;
  if (extraction.status !== 0) {
    throw new Error(extraction.stderr.trim() || "could not extract the pstack archive");
  }
}

function assertLockPublicationTarget() {
  if (!pathExists(lockPath)) return;
  const stat = lstatSync(lockPath);
  if (!stat.isFile()) {
    throw new Error(`pstack lock publication target must be a regular file: ${lockPath}`);
  }
}

function publishLock(lock) {
  assertLockPublicationTarget();
  const candidate = join(
    dirname(lockPath),
    `.${basename(lockPath)}.candidate-${randomUUID()}`,
  );
  let descriptor;
  let owned = false;
  try {
    descriptor = openSync(candidate, "wx", 0o644);
    owned = true;
    writeFileSync(descriptor, `${JSON.stringify(lock, null, 2)}\n`);
    fsyncSync(descriptor);
    closeSync(descriptor);
    descriptor = undefined;
    renameSync(candidate, lockPath);
    owned = false;
  } finally {
    if (descriptor !== undefined) closeSync(descriptor);
    if (owned) rmSync(candidate, { force: true });
  }
}

function publishPlugin(stagingPlugin) {
  let previousRoot;
  let previousPlugin;
  if (pathExists(pluginPath)) {
    previousRoot = ownedTemporaryDirectory(".pstack-previous-");
    previousPlugin = join(previousRoot, "pstack");
    try {
      renameSync(pluginPath, previousPlugin);
    } catch (error) {
      rmSync(previousRoot, { recursive: true, force: true });
      throw error;
    }
  }

  try {
    renameSync(stagingPlugin, pluginPath);
  } catch (error) {
    if (previousPlugin && pathExists(previousPlugin) && !pathExists(pluginPath)) {
      try {
        renameSync(previousPlugin, pluginPath);
        rmSync(previousRoot, { recursive: true, force: true });
      } catch (rollbackError) {
        throw new Error(
          `pstack cache publication failed and the previous cache remains at ${previousPlugin}: ${rollbackError.message}`,
          { cause: error },
        );
      }
    }
    throw error;
  }

  if (previousRoot) rmSync(previousRoot, { recursive: true, force: true });
}

const lock = lockFromMonitoredCheckout();
const repository = repositoryFor(lock);
const stagingRoot = ownedTemporaryDirectory(".pstack-staging-");
const exportedPlugin = join(stagingRoot, "upstream");
const stagingPlugin = join(stagingRoot, "pstack");
try {
  mkdirSync(exportedPlugin);
  exportRevision(repository.path, lock, exportedPlugin);
  const { version } = buildPstackArtifact({
    lock,
    exportedPluginPath: exportedPlugin,
    destinationPath: stagingPlugin,
    packagerFiles,
  });
  if (!locked) publishLock(lock);
  publishPlugin(stagingPlugin);
  cleanOwnedStaleDirectories(stagingRoot);
  console.log(`packaged pstack ${version} from ${lock.revision} into ${pluginPath}`);
} finally {
  try {
    repository.cleanup();
  } finally {
    rmSync(stagingRoot, { recursive: true, force: true });
  }
}
