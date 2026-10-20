import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import test from 'node:test';

test(
  'production authentication adapter failure boundaries',
  { timeout: 30000 },
  async (t) => {
    let mode = 'healthy';
    let upstreamCalls = 0;
    const upstream = createServer((request, response) => {
      upstreamCalls++;
      request.resume();
      if (mode === 'disconnected') {
        request.socket.destroy();
        return;
      }
      response.setHeader('Content-Type', 'application/json');
      if (mode === 'unavailable') {
        response
          .writeHead(500)
          .end(JSON.stringify({ message: 'Private upstream diagnostic' }));
      } else if (mode === 'unauthorized') {
        response.writeHead(401).end('{}');
      } else if (mode === 'throttled') {
        response.writeHead(429).end('{}');
      } else if (request.url === '/auth/login') {
        response.end(
          JSON.stringify({
            accessToken: 'contract-test-token',
            tokenType: 'Bearer',
            expiresIn: 1800,
          }),
        );
      } else {
        assert.equal(
          request.headers.authorization,
          'Bearer contract-test-token',
        );
        assert.equal(request.headers.cookie, undefined);
        response.end(
          JSON.stringify({
            name: 'Contract Pilot',
            totalFlightHours: 12,
            avatarUrl: '/pilot-avatar.svg',
            today: '2026-05-15',
          }),
        );
      }
    });
    await new Promise((resolve) => upstream.listen(0, '127.0.0.1', resolve));
    const upstreamOrigin = `http://127.0.0.1:${upstream.address().port}`;
    const reservation = createServer();
    await new Promise((resolve) => reservation.listen(0, '127.0.0.1', resolve));
    const port = reservation.address().port;
    await new Promise((resolve) => reservation.close(resolve));
    const base = `http://127.0.0.1:${port}`;
    const trustedOrigin = 'https://pilot.example';
    const child = spawn(process.execPath, ['.output/server/index.mjs'], {
      cwd: fileURLToPath(new URL('../../', import.meta.url)),
      env: {
        ...process.env,
        NODE_ENV: 'production',
        PORT: String(port),
        HOST: '127.0.0.1',
        NUXT_API_BASE: upstreamOrigin,
        NUXT_APP_ORIGIN: trustedOrigin,
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let logs = '';
    const capture = (chunk) => {
      logs = (logs + chunk).slice(-8000);
    };
    child.stdout.on('data', capture);
    child.stderr.on('data', capture);
    const post = () =>
      fetch(`${base}/api/auth/login`, {
        method: 'POST',
        headers: { Origin: trustedOrigin, 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'contract', password: 'contract' }),
        signal: AbortSignal.timeout(7000),
      });
    let cookie;
    try {
      let ready = false;
      for (let attempt = 0; attempt < 100; attempt++) {
        assert.equal(child.exitCode, null, logs);
        try {
          ready =
            (
              await fetch(`${base}/login`, {
                signal: AbortSignal.timeout(1000),
              })
            ).status === 200;
        } catch {
          /* Wait for the owned server to bind its port. */
        }
        if (ready) break;
        await delay(100);
      }
      assert.ok(ready, logs);
      await t.test(
        'HTTPS deployments issue a private, host-only Secure cookie',
        async () => {
          const result = await post();
          assert.equal(result.status, 200);
          assert.deepEqual(await result.json(), { authenticated: true });
          const header = result.headers.get('set-cookie');
          assert.match(header, /; Secure/i);
          assert.match(header, /; HttpOnly/i);
          assert.match(header, /; SameSite=Strict/i);
          assert.doesNotMatch(header, /Domain=/i);
          assert.match(result.headers.get('cache-control'), /no-store/);
          cookie = header.split(';')[0];
          assert.equal(
            (
              await fetch(`${base}/api/auth/session`, {
                headers: { Cookie: cookie, Origin: trustedOrigin },
              })
            ).status,
            200,
          );
        },
      );
      await t.test(
        'upstream faults preserve the cookie and hide private diagnostics',
        async () => {
          for (const failure of ['unavailable', 'disconnected']) {
            mode = failure;
            const result = await fetch(`${base}/api/auth/session`, {
              headers: { Cookie: cookie },
              signal: AbortSignal.timeout(7000),
            });
            assert.equal(result.status, 503);
            assert.equal(result.headers.get('set-cookie'), null);
            const body = await result.text();
            assert.doesNotMatch(body, /Private upstream/);
            assert.ok(
              !body.includes(upstreamOrigin),
              'The private backend address must not be returned.',
            );
          }
          mode = 'healthy';
          assert.equal(
            (
              await fetch(`${base}/api/auth/session`, {
                headers: { Cookie: cookie },
              })
            ).status,
            200,
          );
        },
      );
      await t.test(
        'upstream rate limits are preserved without retrying sign-in',
        async () => {
          mode = 'throttled';
          const before = upstreamCalls;
          const result = await post();
          assert.equal(result.status, 429);
          assert.equal(upstreamCalls, before + 1);
          assert.equal(result.headers.get('set-cookie'), null);
        },
      );
      await t.test(
        'an invalid upstream session clears the browser cookie',
        async () => {
          mode = 'unauthorized';
          const result = await fetch(`${base}/api/auth/session`, {
            headers: { Cookie: cookie },
          });
          assert.equal(result.status, 401);
          assert.match(result.headers.get('set-cookie'), /Max-Age=0/i);
          assert.match(result.headers.get('cache-control'), /no-store/);
        },
      );
    } finally {
      const exited = new Promise((resolve) => child.once('exit', resolve));
      child.kill('SIGTERM');
      await Promise.race([exited, delay(5000, undefined, { ref: false })]);
      if (child.exitCode === null && child.signalCode === null)
        child.kill('SIGKILL');
      upstream.closeAllConnections();
      await new Promise((resolve) => upstream.close(resolve));
    }
  },
);
