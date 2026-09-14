import {
  cpSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { createHash } from "node:crypto";
import { basename, dirname, join, relative, resolve, sep } from "node:path";

const LOCK_KEYS = ["bareSkillOwners", "install", "repository", "revision", "subpath", "version"];
const REPOSITORY = "https://github.com/cursor/plugins";
const SUBPATH = "pstack";
const REVISION_PATTERN = /^[0-9a-f]{40}$/;
const VERSION_PATTERN =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;
const NORMALIZED_ARTIFACT_VERSION = "0.0.0+codex.artifact";

function describePath(path) {
  return path.startsWith("/") ? path : resolve(path);
}

function readJson(path, label) {
  let contents;
  try {
    contents = readFileSync(path, "utf8");
  } catch (error) {
    throw new Error(`could not read ${label} at ${describePath(path)}: ${error.message}`);
  }

  try {
    return JSON.parse(contents);
  } catch (error) {
    throw new Error(`invalid JSON in ${label} at ${describePath(path)}: ${error.message}`);
  }
}

function assertPlainObject(value, label) {
  if (value === null || Array.isArray(value) || typeof value !== "object") {
    throw new Error(`${label} must be a JSON object`);
  }
}

function assertString(value, label) {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${label} must be a non-empty string`);
  }
  return value;
}

function assertStringArray(value, label) {
  if (!Array.isArray(value) || value.some((entry) => typeof entry !== "string")) {
    throw new Error(`${label} must be an array of strings`);
  }
  return [...value];
}

function assertRegularFile(path, label) {
  let stat;
  try {
    stat = lstatSync(path);
  } catch (error) {
    throw new Error(`could not inspect ${label} at ${describePath(path)}: ${error.message}`);
  }
  if (!stat.isFile()) {
    throw new Error(`${label} must be a regular file: ${describePath(path)}`);
  }
  return stat;
}

function regularTreeFiles(root, label) {
  let rootStat;
  try {
    rootStat = lstatSync(root);
  } catch (error) {
    throw new Error(`could not inspect ${label} at ${describePath(root)}: ${error.message}`);
  }
  if (!rootStat.isDirectory()) {
    throw new Error(`${label} must be a directory: ${describePath(root)}`);
  }

  const files = [];
  function visit(directory) {
    for (const entry of readdirSync(directory).sort()) {
      const path = join(directory, entry);
      const stat = lstatSync(path);
      if (stat.isDirectory()) {
        visit(path);
      } else if (stat.isFile()) {
        files.push({ path, stat });
      } else {
        throw new Error(`${label} contains a symlink or special entry: ${describePath(path)}`);
      }
    }
  }
  visit(root);
  return files;
}

function sourceManifest(path, lock) {
  const manifest = readJson(path, "upstream pstack manifest");
  assertPlainObject(manifest, "upstream pstack manifest");
  if (manifest.name !== "pstack") {
    throw new Error(`upstream pstack manifest has unsupported name: ${String(manifest.name)}`);
  }
  if (manifest.version !== lock.version) {
    throw new Error(
      `pstack lock version ${lock.version} does not match source version ${String(manifest.version)}`,
    );
  }
  if (manifest.repository !== lock.repository) {
    throw new Error("upstream pstack repository does not match the lock");
  }
  if (manifest.skills !== "./skills/") {
    throw new Error(`upstream pstack manifest has unsupported skills path: ${String(manifest.skills)}`);
  }

  assertPlainObject(manifest.author, "upstream pstack author");
  return {
    description: assertString(manifest.description, "upstream pstack description"),
    author: {
      name: assertString(manifest.author.name, "upstream pstack author name"),
    },
    homepage: assertString(manifest.homepage, "upstream pstack homepage"),
    repository: manifest.repository,
    license: assertString(manifest.license, "upstream pstack license"),
    keywords: assertStringArray(manifest.keywords, "upstream pstack keywords"),
  };
}

function skillFiles(root) {
  return regularTreeFiles(root, "pstack skills")
    .map(({ path }) => path)
    .filter((path) => basename(path) === "SKILL.md");
}

function updateDigest(hash, kind, name, mode, contents) {
  const label = Buffer.from(name, "utf8");
  hash.update(`${kind}\0${label.length}\0`);
  hash.update(label);
  hash.update(`\0${mode}\0${contents.length}\0`);
  hash.update(contents);
}

function normalizedPackageContents(path, pluginPath) {
  const contents = readFileSync(path);
  if (relative(pluginPath, path).split(sep).join("/") !== ".codex-plugin/plugin.json") {
    return contents;
  }

  const manifest = JSON.parse(contents.toString("utf8"));
  assertPlainObject(manifest, "generated pstack manifest");
  assertString(manifest.version, "generated pstack version");
  manifest.version = NORMALIZED_ARTIFACT_VERSION;
  return Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`);
}

function artifactDigest(pluginPath, packagerFiles) {
  if (!Array.isArray(packagerFiles) || packagerFiles.length === 0) {
    throw new Error("packagerFiles must name at least one tracked packager file");
  }

  const hash = createHash("sha256");
  const packagers = packagerFiles
    .map((path) => ({ name: basename(path), path, stat: assertRegularFile(path, "packager file") }))
    .sort((left, right) => (left.name < right.name ? -1 : left.name > right.name ? 1 : 0));
  if (new Set(packagers.map(({ name }) => name)).size !== packagers.length) {
    throw new Error("packager file names must be unique");
  }

  for (const packager of packagers) {
    updateDigest(
      hash,
      "packager",
      packager.name,
      packager.stat.mode & 0o111 ? "755" : "644",
      readFileSync(packager.path),
    );
  }

  for (const file of regularTreeFiles(pluginPath, "generated pstack plugin")) {
    const name = relative(pluginPath, file.path).split(sep).join("/");
    updateDigest(
      hash,
      "package",
      name,
      file.stat.mode & 0o111 ? "755" : "644",
      normalizedPackageContents(file.path, pluginPath),
    );
  }
  return hash.digest("hex");
}

function artifactVersion(lock, digest) {
  const upstreamVersion = lock.version.replace(/\+.*/, "");
  return `${upstreamVersion}+codex.${lock.revision}.${digest.slice(0, 16)}`;
}

function packagerFilesForRoot(root) {
  return [join(root, "scripts", "pstack-artifact.js"), join(root, "scripts", "sync-pstack-plugin.js")];
}

export function validatePstackLock(value, label = "pstack lock") {
  assertPlainObject(value, label);
  const keys = Object.keys(value).sort();
  if (keys.length !== LOCK_KEYS.length || keys.some((key, index) => key !== LOCK_KEYS[index])) {
    throw new Error(`${label} must contain exactly: ${LOCK_KEYS.join(", ")}`);
  }
  if (value.repository !== REPOSITORY) {
    throw new Error(`${label} has unsupported repository: ${String(value.repository)}`);
  }
  if (value.subpath !== SUBPATH) {
    throw new Error(`${label} has unsupported subpath: ${String(value.subpath)}`);
  }
  if (!REVISION_PATTERN.test(value.revision)) {
    throw new Error(`${label} revision must be a lowercase 40-character Git SHA`);
  }
  if (!VERSION_PATTERN.test(value.version)) {
    throw new Error(`${label} version must be valid SemVer`);
  }
  assertPlainObject(value.install, `${label} install record`);
  assertPlainObject(value.bareSkillOwners, `${label} bare skill owners`);
  for (const name of ["tdd", "teach"]) {
    if (value.bareSkillOwners[name] !== "mattpocock/skills") {
      throw new Error(`${label} must keep ${name} owned by mattpocock/skills`);
    }
  }
  return Object.freeze({
    repository: value.repository,
    subpath: value.subpath,
    revision: value.revision,
    version: value.version,
    install: value.install,
    bareSkillOwners: value.bareSkillOwners,
  });
}

export function readPstackLock(lockPath) {
  assertRegularFile(lockPath, "pstack lock");
  return validatePstackLock(readJson(lockPath, "pstack lock"), "pstack lock");
}

export function buildPstackArtifact({ lock, exportedPluginPath, destinationPath, packagerFiles }) {
  const validatedLock = validatePstackLock(lock);
  regularTreeFiles(exportedPluginPath, "exported pstack Git tree");
  try {
    lstatSync(destinationPath);
    throw new Error(`pstack artifact destination already exists: ${describePath(destinationPath)}`);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }

  const manifest = sourceManifest(
    join(exportedPluginPath, ".cursor-plugin", "plugin.json"),
    validatedLock,
  );
  const sourceSkills = join(exportedPluginPath, "skills");
  const destinationSkills = join(destinationPath, "skills");
  const destinationManifest = join(destinationPath, ".codex-plugin", "plugin.json");

  cpSync(sourceSkills, destinationSkills, {
    recursive: true,
    errorOnExist: true,
    force: false,
    preserveTimestamps: false,
  });
  for (const skillPath of skillFiles(destinationSkills)) {
    const body = readFileSync(skillPath, "utf8").replace(
      /^disable-model-invocation:\s*true\s*\n/m,
      "",
    );
    writeFileSync(skillPath, body);
  }

  mkdirSync(dirname(destinationManifest), { recursive: true });
  const generatedManifest = {
    name: "pstack",
    version: NORMALIZED_ARTIFACT_VERSION,
    description: manifest.description,
    author: manifest.author,
    homepage: manifest.homepage,
    repository: manifest.repository,
    license: manifest.license,
    keywords: manifest.keywords,
    skills: "./skills/",
    interface: {
      displayName: "pstack",
      shortDescription: "Use pstack workflows in Codex.",
      longDescription:
        "The upstream pstack skill package, kept separate from the flat global skill registry so provider names cannot collide.",
      developerName: manifest.author.name,
      category: "Developer tools",
      capabilities: ["Interactive", "Read", "Write"],
      websiteURL: manifest.homepage,
      defaultPrompt: ["Use pstack for this task."],
    },
  };
  writeFileSync(destinationManifest, `${JSON.stringify(generatedManifest, null, 2)}\n`, {
    mode: 0o644,
  });

  const digest = artifactDigest(destinationPath, packagerFiles);
  const version = artifactVersion(validatedLock, digest);
  generatedManifest.version = version;
  writeFileSync(destinationManifest, `${JSON.stringify(generatedManifest, null, 2)}\n`);
  regularTreeFiles(destinationPath, "generated pstack plugin");
  return { digest, version };
}

export function comparePstackArtifactFreshness({ root }) {
  const resolvedRoot = resolve(root);
  const lock = readPstackLock(join(resolvedRoot, ".agents", "plugins", "pstack.lock.json"));
  const pluginPath = join(resolvedRoot, "plugins", "pstack");
  regularTreeFiles(pluginPath, "generated pstack plugin");
  const manifest = readJson(
    join(pluginPath, ".codex-plugin", "plugin.json"),
    "generated pstack manifest",
  );
  assertPlainObject(manifest, "generated pstack manifest");
  const actualVersion = assertString(manifest.version, "generated pstack version");
  const digest = artifactDigest(pluginPath, packagerFilesForRoot(resolvedRoot));
  const expectedVersion = artifactVersion(lock, digest);
  return {
    fresh: actualVersion === expectedVersion,
    actualVersion,
    expectedVersion,
  };
}
