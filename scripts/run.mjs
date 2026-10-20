import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const [task, project] = process.argv.slice(2);
const checks = {
  nuxt: ['lint', 'typecheck', 'test', 'build', 'test:server'],
  nest: ['lint', 'typecheck', 'test', 'test:e2e', 'build'],
};
const tasks = new Set(['setup', 'check', 'build', 'lint', 'typecheck', 'test']);

if (!tasks.has(task) || (project && !Object.hasOwn(checks, project))) {
  console.error('Usage: npm run <setup|check|build|lint|typecheck|test> -- [nuxt|nest]');
  process.exit(1);
}

function run(executable, args) {
  const result = spawnSync(executable, args, { cwd: root, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

function npm(args) {
  if (process.env.npm_execpath) {
    run(process.execPath, [process.env.npm_execpath, ...args]);
  } else {
    run(process.platform === 'win32' ? 'npm.cmd' : 'npm', args);
  }
}

for (const app of project ? [project] : Object.keys(checks)) {
  console.log(`\nChecking ${app}: ${task}`);
  if (task === 'setup') {
    npm(['ci', '--prefix', app, '--no-fund']);
    continue;
  }
  const commands = task === 'check' ? checks[app] : [task];
  for (const command of commands) {
    npm(['--prefix', app, 'run', command]);
  }
  if (task === 'check') {
    run(process.execPath, ['scripts/smoke.mjs', app]);
    if (app === 'nest') {
      run(process.execPath, ['scripts/smoke-serverless.mjs']);
    }
  }
}
