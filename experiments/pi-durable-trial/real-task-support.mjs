import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, lstatSync, existsSync, mkdirSync, copyFileSync, cpSync, mkdtempSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';

export const hash = path => createHash('sha256').update(readFileSync(path)).digest('hex');
const python = '/opt/homebrew/opt/python@3.14/bin/python3.14';
export function git(root, args) {
  const result = spawnSync('git', args, { cwd: root, encoding: 'utf8' });
  if (result.status !== 0) throw new Error(result.stderr);
  return result.stdout;
}
export function snapshot(root) {
  const paths = [...new Set(git(root, ['ls-files', '-z', '--cached', '--others', '--exclude-standard']).split('\0').filter(Boolean))];
  return Object.fromEntries(paths.sort().map(name => {
    const path = join(root, name);
    if (!existsSync(path)) { try { lstatSync(path); } catch { return [name, { kind: 'absent' }]; } }
    const stat = lstatSync(path);
    return [name, stat.isSymbolicLink() ? { kind: 'symlink', size: stat.size, mtime: stat.mtimeMs }
      : stat.isFile() ? { kind: 'file', sha256: hash(path) } : { kind: 'other' }];
  }));
}
function execute(executable, args, cwd, timeout = 120000) {
  const result = spawnSync(executable, args, { cwd, encoding: 'utf8', timeout,
    env: { ...process.env, PYTHONDONTWRITEBYTECODE: '1' } });
  return { exit: result.status, signal: result.signal, error: result.error?.message ?? null,
    stdout: result.stdout ?? '', stderr: result.stderr ?? '' };
}
export function verifyRealTask(run, attempt) {
  const input = JSON.parse(readFileSync(join(run, 'input.json')));
  const root = input.workspace;
  const before = JSON.parse(readFileSync(join(run, 'workspace-before.json')));
  const candidate = snapshot(root);
  const allowed = input.allowed_paths;
  const changes = [...new Set([...Object.keys(before), ...Object.keys(candidate)])]
    .filter(name => JSON.stringify(before[name]) !== JSON.stringify(candidate[name]));
  const scopeSafe = changes.every(name => allowed.includes(name));
  const indexSafe = git(root, ['ls-files', '--stage', '-z']) === readFileSync(join(run, 'index-before.txt'), 'utf8');
  const oracleSafe = hash(input.verifier) === input.oracle_sha256;
  const log = readFileSync(join(root, 'LOG.md'), 'utf8');
  const history = readFileSync(join(run, 'homebase-log-history.txt'), 'utf8');
  const historySafe = log.endsWith(history);
  const entry = log.slice(0, -history.length);
  const logResolved = entry.includes('Local unattended config-read repair') && /resolved/i.test(entry) && !entry.includes('**Active scope:**');
  const acceptance = execute(python, ['-B', input.verifier, root], root, 90000);
  const health = execute(python, ['-B', 'scripts/health', '--portable'], root);
  let baselineRegression = { exit: null, stdout: '', stderr: '', error: 'Agent regression test missing' };
  if (existsSync(join(root, 'scripts/tests/test_config_errors.py'))) {
    const temporary = mkdtempSync(join(tmpdir(), 'homebase-original-regression-'));
    try {
      cpSync(join(root, 'scripts'), join(temporary, 'scripts'), { recursive: true });
      copyFileSync(join(root, 'workspace.toml'), join(temporary, 'workspace.toml'));
      copyFileSync(join(run, 'before/scripts/_homebase.py'), join(temporary, 'scripts/_homebase.py'));
      baselineRegression = execute(python, ['-B', '-m', 'unittest', 'discover', '-s', 'scripts/tests', '-p', 'test_config_errors.py', '-v'], temporary);
    } finally { rmSync(temporary, { recursive: true, force: true }); }
  }
  const regressionDetectsOriginal = baselineRegression.exit !== null && baselineRegression.exit !== 0
    && /Ran [1-9]\d* tests?/.test(baselineRegression.stderr)
    && /IsADirectoryError/.test(baselineRegression.stdout + baselineRegression.stderr)
    && !/ImportError|SyntaxError|ModuleNotFoundError/.test(baselineRegression.stderr);
  const after = snapshot(root);
  const stable = JSON.stringify(candidate) === JSON.stringify(after);
  const report = { attempt, acceptance_exit: acceptance.exit, health_exit: health.exit, changed_paths: changes,
    scope_preserved: scopeSafe, index_preserved: indexSafe, inherited_log_preserved: historySafe,
    task_log_resolved: logResolved, external_verifier_unchanged: oracleSafe,
    artifact_unchanged_during_verification: stable, regression_detects_original_bug: regressionDetectsOriginal,
    baseline_regression_exit: baselineRegression.exit,
    passed: scopeSafe && indexSafe && historySafe && logResolved && oracleSafe && stable
      && changes.includes('scripts/_homebase.py') && changes.includes('scripts/tests/test_config_errors.py')
      && acceptance.exit === 0 && health.exit === 0 && regressionDetectsOriginal };
  for (const [name, value] of Object.entries({ acceptance, health, baselineRegression })) {
    writeFileSync(join(run, `${name}-attempt-${attempt}.json`), JSON.stringify(value, null, 2) + '\n');
    writeFileSync(join(run, `${name}-attempt-${attempt}.log`), value.stdout + value.stderr);
  }
  writeFileSync(join(run, `verification-attempt-${attempt}.json`), JSON.stringify(report, null, 2) + '\n');
  writeFileSync(join(run, 'verification.json'), JSON.stringify(report, null, 2) + '\n');
  writeFileSync(join(run, `fix-attempt-${attempt}.patch`), git(root, ['diff', '--', 'scripts/_homebase.py']));
  for (const name of allowed) if (existsSync(join(root, name))) {
    const target = join(run, `candidate-${attempt}`, name);
    mkdirSync(dirname(target), { recursive: true }); copyFileSync(join(root, name), target);
  }
  return { report, feedback: { verification: report, acceptance: acceptance.stdout,
    health: (health.stdout + health.stderr).slice(-10000), baseline_regression: (baselineRegression.stdout + baselineRegression.stderr).slice(-8000) } };
}
