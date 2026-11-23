import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { appendFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const run = process.env.PI_LOG_RUN;
const generation = Number(process.env.PI_LOG_GENERATION);
const input = JSON.parse(readFileSync(join(run, 'input.json')));
const args = process.argv.slice(2);
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const json = (name, value) => writeFileSync(join(run, name), JSON.stringify(value, null, 2) + '\n');
const git = (...args) => {
  const result = spawnSync(input.git, args, { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim();
};
const event = (kind, data = {}) => appendFileSync(join(run, 'git-events.jsonl'), JSON.stringify({ at: new Date().toISOString(), generation, kind, ...data }) + '\n');
if (args[0] === 'commit') {
  const patch = git('diff', '--cached', '--binary');
  writeFileSync(join(run, 'staged.patch'), patch + '\n');
  const digest = hash(patch);
  json('review-ready.json', { generation, sha256: digest, files: git('diff', '--cached', '--name-only').split('\n') });
  const wait = new Int32Array(new SharedArrayBuffer(4));
  while (!existsSync(join(run, 'reviewed.json'))) {
    assert.ok(Date.now() < input.deadline, 'Staged review deadline expired');
    Atomics.wait(wait, 0, 0, 100);
  }
  const reviewed = JSON.parse(readFileSync(join(run, 'reviewed.json')));
  assert.equal(reviewed.sha256, digest, 'Reviewed staged patch differs');
  assert.equal(hash(git('diff', '--cached', '--binary')), digest, 'Index changed after review');
}
const result = spawnSync(input.git, args, { stdio: 'inherit' });
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);
if (args[0] === 'commit') event('commit', { commit: git('rev-parse', 'HEAD') });
if (args[0] === 'push') {
  assert.deepEqual(args, ['push', 'origin', 'HEAD:main']);
  const receipt = { commit: git('rev-parse', 'HEAD'), generation, at: new Date().toISOString(),
    source_sha256: hash(readFileSync(input.source)), snapshot_sha256: hash(readFileSync(input.snapshot)), shim_pid: process.pid };
  event('push-succeeded', receipt);
  json('push-receipt.json', receipt);
  // The actual Git push has returned success. Hold before the publisher sees its exit,
  // so the controller can kill the whole task before Pi records completion.
  if (generation === 1) process.kill(process.pid, 'SIGSTOP');
}
