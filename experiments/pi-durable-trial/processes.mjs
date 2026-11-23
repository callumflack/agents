import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

export function processTable() {
  const result = spawnSync('/bin/ps', ['-axo', 'pid=,ppid=,pgid=,stat=,lstart=,comm='], { encoding: 'utf8', env: { ...process.env, LC_ALL: 'C' } });
  if (result.status !== 0) throw new Error(`Cannot inspect processes: ${result.stderr}`);
  return result.stdout.trim().split('\n').filter(Boolean).map(line => {
    const [pid, ppid, pgid, state, ...fields] = line.trim().split(/\s+/);
    return { pid: Number(pid), ppid: Number(ppid), pgid: Number(pgid), state,
      started: fields.slice(0, 5).join(' '), command: fields.slice(5).join(' ') };
  });
}

export function ownedTree(rootPid, requiredPids = []) {
  const table = processTable();
  const ids = new Set([rootPid]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const row of table) if (ids.has(row.ppid) && !ids.has(row.pid)) { ids.add(row.pid); changed = true; }
  }
  const rows = table.filter(row => ids.has(row.pid));
  assert.ok(rows.some(row => row.pid === rootPid), 'Owned runner must exist');
  assert.equal(ids.has(process.pid), false, 'Supervisor cannot own itself');
  for (const pid of requiredPids) assert.ok(rows.some(row => row.pid === pid && !row.state.startsWith('Z')), `Required process ${pid} must be a live descendant`);
  return rows;
}

export function sameProcess(saved, current) {
  return Boolean(current && saved.pid === current.pid && saved.started === current.started &&
    saved.pgid === current.pgid && saved.command === current.command);
}

export async function stopOwned(saved) {
  const table = processTable();
  const current = new Map(table.map(row => [row.pid, row]));
  for (const row of saved) {
    assert.notEqual(row.pid, process.pid, 'Never target the recovery supervisor');
    if (current.has(row.pid) && !current.get(row.pid).state.startsWith('Z')) assert.ok(sameProcess(row, current.get(row.pid)), `Refuse reused or changed process identity ${row.pid}`);
  }
  // Reparenting is expected. Seed ownership with identities persisted before
  // the crash, then include descendants of those still-matching processes.
  const ids = new Set(saved.filter(row => current.has(row.pid)).map(row => row.pid));
  let changed = true;
  while (changed) {
    changed = false;
    for (const row of table) if (ids.has(row.ppid) && !ids.has(row.pid)) { ids.add(row.pid); changed = true; }
  }
  assert.equal(ids.has(process.pid), false);
  const before = table.filter(row => ids.has(row.pid));
  const signals = [];
  for (const row of [...before].reverse()) {
    const observed = processTable().find(candidate => candidate.pid === row.pid);
    if (!observed || observed.state.startsWith('Z')) { signals.push({ pid: row.pid, result: 'already_exited', state: observed?.state ?? 'absent' }); continue; }
    if (!sameProcess(row, observed)) {
      // A child exit can make its waiting parent exit while cleanup walks the
      // snapshot. Never signal changed identity; finish other owned processes
      // and require this PID to have stopped as well before reporting success.
      signals.push({ pid: row.pid, result: 'identity_changed_not_signalled', expected: row, observed });
      continue;
    }
    try { process.kill(row.pid, 'SIGKILL'); signals.push({ pid: row.pid, signal: 'SIGKILL', result: 'sent' }); }
    catch (error) { if (error.code !== 'ESRCH') throw error; signals.push({ pid: row.pid, signal: 'SIGKILL', result: 'already_exited' }); }
  }
  const allIds = [...new Set([...saved, ...before].map(row => row.pid))];
  let after;
  const until = Date.now() + 5000;
  do {
    const now = new Map(processTable().map(row => [row.pid, row]));
    after = allIds.map(pid => ({ pid, state: now.get(pid)?.state ?? 'absent' }));
    if (after.every(row => row.state === 'absent' || row.state.startsWith('Z'))) break;
    await new Promise(resolve => setTimeout(resolve, 50));
  } while (Date.now() < until);
  return { persisted: saved, before, signals, after, stopped: after.every(row => row.state === 'absent' || row.state.startsWith('Z')) };
}

export async function stopTree(rootPid, requiredPids = []) {
  const table = processTable();
  const ids = new Set([rootPid]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const row of table) if (ids.has(row.ppid) && !ids.has(row.pid)) { ids.add(row.pid); changed = true; }
  }
  const before = table.filter(row => ids.has(row.pid));
  assert.ok(before.some(row => row.pid === rootPid), 'The owned runner must still exist');
  assert.equal(ids.has(process.pid), false, 'Never target the supervisor');
  for (const pid of requiredPids) assert.ok(before.some(row => row.pid === pid && !row.state.startsWith('Z')), `Stall process ${pid} must be a live runner descendant`);
  const signals = [];
  // Stop the SQLite writer first; then kill its already-discovered descendants.
  for (const pid of [rootPid, ...before.map(row => row.pid).filter(pid => pid !== rootPid).reverse()]) {
    try { process.kill(pid, 'SIGKILL'); signals.push({ pid, signal: 'SIGKILL', result: 'sent' }); }
    catch (error) { if (error.code !== 'ESRCH') throw error; signals.push({ pid, signal: 'SIGKILL', result: 'already_exited' }); }
  }
  const until = Date.now() + 5000;
  let after;
  do {
    const current = new Map(processTable().map(row => [row.pid, row]));
    after = before.map(row => ({ pid: row.pid, state: current.get(row.pid)?.state ?? 'absent' }));
    if (after.every(row => row.state === 'absent' || row.state.startsWith('Z'))) break;
    await new Promise(resolve => setTimeout(resolve, 50));
  } while (Date.now() < until);
  const stopped = after.every(row => row.state === 'absent' || row.state.startsWith('Z'));
  return { root_pid: rootPid, required_pids: requiredPids, before, signals, after, stopped };
}
