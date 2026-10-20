import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import http from 'node:http';
import { once } from 'node:events';

process.env.NODE_ENV = 'production';
process.env.JWT_SECRET = randomBytes(32).toString('hex');
process.env.BUSINESS_DATE = '2026-05-15';

// Vercel captures listen() during import and starts the server afterward.
const originalListen = http.Server.prototype.listen;
let capturedServer;
let notifyServer;
const serverFound = new Promise((resolve) => {
  notifyServer = resolve;
});
http.Server.prototype.listen = function () {
  capturedServer = this;
  http.Server.prototype.listen = originalListen;
  notifyServer();
  return this;
};

let timeout;
try {
  await Promise.race([
    Promise.all([import('../nest/dist/main.js'), serverFound]),
    new Promise((_, reject) => {
      timeout = setTimeout(
        () =>
          reject(
            new Error(
              'Server import timed out while listen() was captured by the serverless adapter.',
            ),
          ),
        5000,
      );
    }),
  ]);
  clearTimeout(timeout);
  assert.ok(capturedServer, 'The adapter must capture an HTTP server.');
  const listening = once(capturedServer, 'listening');
  originalListen.call(capturedServer, 0, '127.0.0.1');
  await listening;
  const origin = `http://127.0.0.1:${capturedServer.address().port}`;
  const health = await fetch(`${origin}/health`, {
    signal: AbortSignal.timeout(5000),
  });
  assert.equal(health.status, 200);
  assert.deepEqual(await health.json(), { status: 'ok' });
  assert.equal(health.headers.get('cache-control'), 'no-store');
  assert.equal((await fetch(`${origin}/pilot/me`)).status, 401);
  const login = await fetch(`${origin}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'johndoe', password: 'susiairtest' }),
    signal: AbortSignal.timeout(5000),
  });
  assert.equal(login.status, 200);
  const { accessToken } = await login.json();
  const profile = await fetch(`${origin}/pilot/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    signal: AbortSignal.timeout(5000),
  });
  assert.equal(profile.status, 200);
  assert.equal((await profile.json()).name, 'John Doe');
  console.log('nest: captured-listener production smoke check passed.');
} finally {
  clearTimeout(timeout);
  http.Server.prototype.listen = originalListen;
  if (capturedServer?.listening) {
    await new Promise((resolve, reject) =>
      capturedServer.close((error) => (error ? reject(error) : resolve())),
    );
  }
}
