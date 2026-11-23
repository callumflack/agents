/** Transparent compatibility transport for cached launcher paths. */
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const REAL_CLI = '/Applications/ChatGPT.app/Contents/Resources/codex-cli/CodexCLI.app/Contents/MacOS/codex';

export async function run(command) {
  const child = spawn(command[0], command.slice(1), { stdio: 'inherit' });
  const onTerm = () => child.kill('SIGTERM');
  const onInt = () => child.kill('SIGINT');
  process.on('SIGTERM', onTerm);
  process.on('SIGINT', onInt);
  try {
    return await new Promise((resolve, reject) => {
      child.once('error', reject);
      child.once('close', code => resolve(code ?? 1));
    });
  } finally {
    process.off('SIGTERM', onTerm);
    process.off('SIGINT', onInt);
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  process.exitCode = await run([REAL_CLI, ...process.argv.slice(2)]);
}
