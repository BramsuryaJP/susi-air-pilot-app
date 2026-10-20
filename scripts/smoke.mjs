import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';

const apps = {
  nuxt: { entry: '.output/server/index.mjs', expected: /__NUXT/ },
  nest: { entry: 'dist/main.js', expected: /^Hello World!$/ },
};
const target = process.argv[2];
assert.ok(!target || Object.hasOwn(apps, target), 'Expected nuxt or nest.');

async function availablePort() {
  const server = createServer();
  await new Promise((resolve, reject) => {
    server.once('error', reject).listen(0, '127.0.0.1', resolve);
  });
  const { port } = server.address();
  await new Promise(resolve => server.close(resolve));
  return port;
}

for (const name of target ? [target] : Object.keys(apps)) {
  const app = apps[name];
  const port = await availablePort();
  let logs = '';
  let startError;
  const child = spawn(process.execPath, [app.entry], {
    cwd: fileURLToPath(new URL(`../${name}/`, import.meta.url)),
    env: { ...process.env, PORT: String(port), HOST: '127.0.0.1', NODE_ENV: 'production' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const append = chunk => { logs = (logs + chunk).slice(-12000); };
  child.stdout.on('data', append);
  child.stderr.on('data', append);
  child.on('error', error => { startError = error; });
  try {
    const deadline = Date.now() + 20000;
    let ready = false;
    while (Date.now() < deadline) {
      if (startError) throw startError;
      assert.ok(child.exitCode === null && child.signalCode === null, `${name} exited: ${logs}`);
      try {
        const response = await fetch(`http://127.0.0.1:${port}/`, { signal: AbortSignal.timeout(2000) });
        assert.equal(response.status, 200, `${name} production HTTP status`);
        assert.match(await response.text(), app.expected);
        ready = true;
        break;
      } catch (error) {
        if (error.name === 'AssertionError') throw error;
        await delay(150);
      }
    }
    assert.ok(ready, `${name} production startup timed out: ${logs}`);
    console.log(`${name}: production HTTP smoke check passed.`);
  } finally {
    if (child.exitCode === null && child.signalCode === null) {
      const exited = new Promise(resolve => child.once('exit', resolve));
      child.kill('SIGTERM');
      await Promise.race([exited, delay(5000, undefined, { ref: false })]);
      if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL');
    }
  }
}
