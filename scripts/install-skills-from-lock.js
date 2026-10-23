// Restore recorded Git trees; setup never advances the external-skill lock.
import { createHash } from "node:crypto";
import {
  chmodSync, cpSync, lstatSync, mkdirSync, mkdtempSync, readFileSync,
  readdirSync, renameSync, rmSync, writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const lockPath = resolve(process.env.SKILLS_LOCK || join(root, ".agents", ".skill-lock.json"));
const registry = join(dirname(lockPath), "skills");
const mode = process.argv[2] || "--print";
if (process.argv.length > 3 || !["--print", "--apply", "--check", "--preflight", "--verify-sources"].includes(mode)) {
  throw new Error("usage: install-skills-from-lock.js [--print|--apply|--check|--preflight|--verify-sources]");
}
const lockBytes = readFileSync(lockPath);
const lock = JSON.parse(lockBytes);
if (lock.version !== 3 || !lock.skills || !Object.keys(lock.skills).length) {
  throw new Error("expected a non-empty version 3 external-skill lock");
}
const patches = new Map();
const skills = Object.entries(lock.skills).sort(([a], [b]) => a.localeCompare(b));
for (const [name, entry] of skills) {
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(name) ||
      entry.sourceType !== "github" ||
      !/^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/.test(entry.source) ||
      !/^[0-9a-f]{40}$/.test(entry.skillFolderHash)) {
    throw new Error(`invalid recorded Git tree: ${name}`);
  }
  const patchPath = join(dirname(lockPath), "skill-patches", `${name}.patch`);
  if (entry.adaptation) {
    const adaptation = entry.adaptation;
    if (adaptation.baseTree !== entry.skillFolderHash ||
        !/^[0-9a-f]{40}$/.test(adaptation.tree) ||
        !/^[0-9a-f]{64}$/.test(adaptation.patchSha256)) {
      throw new Error(`adaptation must be reviewed against the recorded upstream tree: ${name}`);
    }
    const patch = readFileSync(patchPath);
    if (createHash("sha256").update(patch).digest("hex") !== adaptation.patchSha256) {
      throw new Error(`adaptation patch changed without review: ${name}`);
    }
    patches.set(name, patch);
  } else if (stat(patchPath)) {
    throw new Error(`adaptation record missing; preserve the local patch: ${name}`);
  }
}
// Removing a lock entry must never silently orphan its accepted adaptation.
const patchDirectory = join(dirname(lockPath), "skill-patches");
if (stat(patchDirectory)) {
  for (const file of readdirSync(patchDirectory).filter((name) => name.endsWith(".patch"))) {
    if (!patches.has(file.slice(0, -6))) throw new Error(`orphan adaptation patch: ${file}`);
  }
}
function expectedTree(entry) { return entry.adaptation?.tree || entry.skillFolderHash; }


function run(args, cwd) {
  const result = spawnSync("git", args, {
    cwd, encoding: null, maxBuffer: 64 * 1024 * 1024, timeout: 240_000,
    env: { ...process.env, GIT_TERMINAL_PROMPT: "0" },
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(result.stderr.toString().trim() || `git ${args[0]} failed`);
  return result.stdout;
}

function stat(path) {
  try { return lstatSync(path); }
  catch (error) { if (error.code === "ENOENT") return undefined; throw error; }
}

function objectHash(kind, bytes) {
  return createHash("sha1").update(`${kind} ${bytes.length}\0`).update(bytes).digest();
}

// Git's tree format gives us an offline content + executable-mode check, without
// touching an index, applying clean filters, or trusting installer metadata.
function treeHash(directory) {
  if (!stat(directory)?.isDirectory()) throw new Error(`expected a real skill directory: ${directory}`);
  const entries = readdirSync(directory).map((name) => {
    const path = join(directory, name);
    const info = lstatSync(path);
    if (name === ".git" || (!info.isDirectory() && !info.isFile())) {
      throw new Error(`unsupported entry in skill: ${path}`);
    }
    const folder = info.isDirectory();
    return {
      name, sortName: Buffer.from(name + (folder ? "/" : "")),
      mode: folder ? "40000" : info.mode & 0o111 ? "100755" : "100644",
      hash: folder ? treeHash(path) : objectHash("blob", readFileSync(path)),
    };
  }).sort((a, b) => Buffer.compare(a.sortName, b.sortName));
  return objectHash("tree", Buffer.concat(entries.map(({ mode, name, hash }) =>
    Buffer.concat([Buffer.from(`${mode} ${name}\0`), hash]))));
}

function matches(name, entry) {
  const target = join(registry, name);
  if (!stat(target)) return false;
  if (treeHash(target).toString("hex") !== expectedTree(entry)) {
    throw new Error(`preserving differing skill: ${target}; review and preserve local changes before restoring`);
  }
  return true;
}

function exportTree(repository, hash, destination) {
  if (run(["cat-file", "-t", hash], repository).toString().trim() !== "tree") {
    throw new Error(`recorded object is not a tree: ${hash}`);
  }
  const listing = run(["ls-tree", "-r", "-z", hash], repository).toString("utf8");
  const files = listing.split("\0").filter(Boolean).map((line) => {
    const separator = line.indexOf("\t");
    const [mode, type, object] = line.slice(0, separator).split(" ");
    const path = line.slice(separator + 1);
    if (!["100644", "100755"].includes(mode) || type !== "blob" ||
        !/^[0-9a-f]{40}$/.test(object) || path.includes("\\") ||
        path.split("/").some((part) => !part || [".", "..", ".git"].includes(part))) {
      throw new Error(`unsupported Git tree entry: ${path}`);
    }
    return { mode, object, path };
  });
  if (!files.some(({ path }) => path === "SKILL.md")) throw new Error(`tree has no SKILL.md: ${hash}`);
  mkdirSync(destination);
  for (const { mode, object, path } of files) {
    const target = join(destination, path);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, run(["cat-file", "blob", object], repository), { flag: "wx" });
    chmodSync(target, mode === "100755" ? 0o755 : 0o644);
  }
  if (treeHash(destination).toString("hex") !== hash) throw new Error(`export differs from recorded tree: ${hash}`);
}

if (mode === "--print") {
  for (const [name, entry] of skills) console.log(`${name}\t${entry.source}\t${entry.skillFolderHash}${entry.adaptation ? `\tadapted:${entry.adaptation.tree}` : ""}`);
} else if (mode === "--check" || mode === "--preflight") {
  if (stat(registry) && !stat(registry).isDirectory()) throw new Error(`registry must be a real directory: ${registry}`);
  const failures = [];
  let missing = 0;
  for (const [name, entry] of skills) {
    try {
      if (!matches(name, entry)) {
        missing++;
        if (mode === "--check") failures.push(`missing recorded skill: ${name}`);
      }
    }
    catch (error) { failures.push(error.message); }
  }
  if (failures.length) throw new Error(failures.join("\n"));
  console.log(`ok: ${skills.length - missing} external skills match their accepted trees (${patches.size} adapted)${missing ? `; ${missing} missing skills may be restored` : ""}`);
} else {
  if (stat(registry) && !stat(registry).isDirectory()) throw new Error(`registry must be a real directory: ${registry}`);
  // Check all existing destinations before any fetch or installation.
  const pending = mode === "--verify-sources" ? skills : skills.filter(([name, entry]) => !matches(name, entry));
  const staging = mkdtempSync(join(tmpdir(), "agents-skill-trees-"));
  try {
    const sources = new Map();
    for (const skill of pending) {
      const source = skill[1].source;
      if (!sources.has(source)) sources.set(source, []);
      sources.get(source).push(skill);
    }
    for (const [source, entries] of sources) {
      const repository = join(staging, source.replace("/", "--"));
      run(["init", "--bare", repository]);
      const hashes = [...new Set(entries.map(([, entry]) => entry.skillFolderHash))];
      run(["fetch", "--quiet", "--depth=1", `https://github.com/${source}.git`, ...hashes], repository);
      for (const [name, entry] of entries) {
        const destination = join(staging, name);
        exportTree(repository, entry.skillFolderHash, destination);
        if (patches.has(name)) {
          const patchPath = join(staging, `${name}.patch`);
          writeFileSync(patchPath, patches.get(name));
          run(["apply", "--no-index", "--check", patchPath], destination);
          run(["apply", "--no-index", patchPath], destination);
          if (treeHash(destination).toString("hex") !== expectedTree(entry)) {
            throw new Error(`adapted tree differs from accepted content: ${name}`);
          }
        }
      }
      console.log(`retrieved ${entries.length} recorded trees from ${source}`);
    }
    if (!readFileSync(lockPath).equals(lockBytes)) throw new Error("skill lock changed during restoration; nothing installed");
    if (mode === "--apply") {
      // Recheck the entire destination set before publishing any staged skills.
      for (const [name, entry] of skills) matches(name, entry);
      mkdirSync(registry, { recursive: true });
      // Verify the whole batch on the destination filesystem before publishing:
      // shared filesystems can lose executable modes even when the fetch is exact.
      const localStage = mkdtempSync(join(registry, ".restore-"));
      try {
        for (const [name, entry] of pending) {
          cpSync(join(staging, name), join(localStage, name), { recursive: true, errorOnExist: true, force: false });
          if (treeHash(join(localStage, name)).toString("hex") !== expectedTree(entry)) throw new Error(`staged skill differs: ${name}`);
        }
        for (const [name, entry] of pending) {
          if (!matches(name, entry)) renameSync(join(localStage, name), join(registry, name));
        }
      } finally { rmSync(localStage, { recursive: true, force: true }); }
    }
    console.log(`ok: ${mode === "--apply" ? "restored" : "retrievable"} ${pending.length} recorded skills; lock unchanged`);
  } finally { rmSync(staging, { recursive: true, force: true }); }
}
