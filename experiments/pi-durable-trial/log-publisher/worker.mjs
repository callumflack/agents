import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawn, spawnSync } from 'node:child_process';
import { appendFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { BACKGROUND_CONTEXT as context } from '@earendil-works/chord/context';
import { createModels } from '@earendil-works/pi-ai/models';
import { Harness, createRegistry, defineExtension, defineTask } from '@earendil-works/pi-durable';
import { openNodeSqliteStorage } from '@earendil-works/pi-durable/storage/sqlite/node';

const [run, generationText] = process.argv.slice(2);
const generation = Number(generationText);
const input = JSON.parse(readFileSync(join(run, 'input.json')));
const json = (name, value) => writeFileSync(join(run, name), JSON.stringify(value, null, 2) + '\n');
const hash = path => createHash('sha256').update(readFileSync(path)).digest('hex');
const event = (kind, data = {}) => appendFileSync(join(run, 'timeline.jsonl'), JSON.stringify({ at: new Date().toISOString(), kind, generation, pid: process.pid, ...data }) + '\n');
const git = (...args) => {
  const result = spawnSync(input.git, args, { cwd: input.workspace, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim();
};

const job = defineTask({
  name: 'trial.logfile-publication', version: 1,
  initial: () => ({ phase: 'publish' }),
  phases: {
    publish: async (task, runtime) => {
      assert.ok(Date.now() < input.deadline, 'Original task deadline expired');
      assert.equal(hash(join(input.workspace, 'scripts/publish-logfile.mjs')), input.publisher_sha256, 'Publisher changed');
      if (generation > 1) {
        const receipt = JSON.parse(readFileSync(join(run, 'push-receipt.json')));
        const remote = git('ls-remote', 'origin', 'refs/heads/main').split(/\s+/)[0];
        assert.equal(remote, receipt.commit, 'Remote advanced: stop rather than publish or verify a different candidate');
        assert.equal(git('rev-parse', 'HEAD'), receipt.commit);
        assert.equal(git('status', '--porcelain'), '');
        assert.equal(hash(input.source), receipt.source_sha256, 'LOGFILE changed after publication');
        assert.equal(hash(join(input.workspace, input.snapshot)), receipt.snapshot_sha256);
        json('reconciliation.json', { task_id: task.id, remote, receipt, clean: true, decision: 'rerun unchanged publisher to perform its no-change live verification' });
        event('external-publication-reconciled', { commit: remote });
      }
      event('publisher-start', { task_id: task.id });
      const child = spawn(input.bun, ['log:publish', '--vault', input.vault], {
        cwd: input.workspace, stdio: ['ignore', 'pipe', 'pipe'],
        env: { ...process.env, PATH: join(run, 'bin') + ':' + process.env.PATH, PI_LOG_RUN: run, PI_LOG_GENERATION: String(generation) },
      });
      json(`publisher-${generation}.json`, { pid: child.pid, task_id: task.id });
      for (const stream of [child.stdout, child.stderr]) stream.on('data', bytes => appendFileSync(join(run, `publisher-${generation}.log`), bytes));
      const code = await new Promise((resolve, reject) => { child.once('error', reject); child.once('close', (code, signal) => resolve({ code, signal })); });
      event('publisher-exit', code);
      assert.equal(code.code, 0, `Publisher failed; inspect publisher-${generation}.log`);
      assert.ok(Date.now() < input.deadline, 'Original deadline exceeded');
      const commit = git('rev-parse', 'HEAD');
      if (generation > 1) assert.equal(commit, JSON.parse(readFileSync(join(run, 'push-receipt.json'))).commit);
      await runtime.commit(() => ({ status: 'terminal', outcome: { status: 'completed', result: { commit, verification_generation: generation, source_sha256: hash(input.source), snapshot_sha256: hash(join(input.workspace, input.snapshot)) } } }), context);
    },
  },
  abort: async (_task, runtime) => runtime.commit(() => ({ status: 'terminal', outcome: { status: 'aborted' } }), context),
});

const registry = createRegistry();
registry.install(defineExtension({ name: 'logfile-trial', tasks: [job] }));
const harness = await Harness.open(await openNodeSqliteStorage(join(run, 'state.sqlite')), { models: createModels(), registry }, context);
let id;
if (generation === 1) {
  assert.equal(existsSync(join(run, 'job.json')), false);
  const root = await harness.root(context);
  id = await root.commit(tx => tx.createTask(job, {}, { ownership: { kind: 'conversation' } }), context);
  json('job.json', { id });
} else {
  id = JSON.parse(readFileSync(join(run, 'job.json'))).id;
  json(`recovered-${generation}.json`, await harness.getTask(id, context));
}
event('worker-open', { id, deadline: input.deadline });
try {
  harness.resume();
  const settled = await harness.waitForTask(id, context);
  json(`settled-${generation}.json`, settled);
  assert.equal(settled.state.outcome.status, 'completed');
  await harness.waitForIdle(context);
  json(`inspection-${generation}.json`, await harness.inspect(context));
} finally { await harness.close(context); }
