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
    let lastUpstreamUrl;
    const upstream = createServer((request, response) => {
      upstreamCalls++;
      lastUpstreamUrl = request.url;
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
          JSON.stringify(
            request.url === '/documents'
              ? { today: '2026-05-15', warningDays: 30, documents: [] }
              : request.url?.startsWith('/schedules?')
                ? {
                    today: '2026-05-15',
                    year: 2026,
                    month: 5,
                    legend: [],
                    schedules: [],
                  }
                : {
                    name: 'Contract Pilot',
                    totalFlightHours: 12,
                    avatarUrl: '/pilot-avatar.svg',
                    today: '2026-05-15',
                  },
          ),
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
        'login is guest-only and validates sessions without cookie writes on SSR',
        async () => {
          mode = 'healthy';
          const before = upstreamCalls;
          const guest = await fetch(`${base}/login`, { redirect: 'manual' });
          assert.equal(guest.status, 200);
          assert.equal(upstreamCalls, before);
          const signedIn = await fetch(`${base}/login`, {
            headers: { Cookie: cookie },
            redirect: 'manual',
          });
          assert.equal(signedIn.status, 302);
          assert.equal(signedIn.headers.get('location'), '/');
          assert.match(signedIn.headers.get('cache-control'), /no-store/);
          assert.match(signedIn.headers.get('vary'), /Cookie/i);
          assert.equal(signedIn.headers.get('set-cookie'), null);
          mode = 'unauthorized';
          const expired = await fetch(`${base}/login`, {
            headers: { Cookie: cookie },
            redirect: 'manual',
          });
          assert.equal(expired.status, 200);
          assert.equal(expired.headers.get('set-cookie'), null);
          mode = 'healthy';
        },
      );
      await t.test(
        'login session-validation failures preserve the cookie and return a safe service error',
        async () => {
          for (const failure of ['unavailable', 'disconnected']) {
            mode = failure;
            const response = await fetch(`${base}/login`, {
              headers: { Cookie: cookie },
              redirect: 'manual',
              signal: AbortSignal.timeout(7000),
            });
            assert.equal(response.status, 503);
            assert.equal(response.headers.get('set-cookie'), null);
            assert.match(response.headers.get('cache-control'), /no-store/);
            const body = await response.text();
            assert.doesNotMatch(body, /Private upstream diagnostic/);
            assert.ok(!body.includes(upstreamOrigin));
          }
          mode = 'healthy';
        },
      );
      await t.test(
        'flight-hour reads forward only validated query fields and the private cookie token',
        async () => {
          mode = 'healthy';
          const before = upstreamCalls;
          const anonymous = await fetch(
            `${base}/api/flight-hours/summary?range=1w`,
          );
          assert.equal(anonymous.status, 401);
          assert.equal(upstreamCalls, before);
          const invalid = await fetch(
            `${base}/api/flight-hours/summary?range=1w&target=https://untrusted.example`,
            { headers: { Cookie: cookie } },
          );
          assert.equal(invalid.status, 400);
          assert.equal(upstreamCalls, before);
          const valid = await fetch(
            `${base}/api/flight-hours/summary?range=1w`,
            {
              headers: {
                Cookie: cookie,
                Authorization: 'Bearer untrusted-browser-value',
              },
            },
          );
          assert.equal(valid.status, 200);
          assert.equal(lastUpstreamUrl, '/flight-hours/summary?range=1w');
          assert.match(valid.headers.get('cache-control'), /no-store/);
        },
      );
      await t.test(
        'document reads keep tokens private and do not forward browser clock overrides',
        async () => {
          mode = 'healthy';
          const before = upstreamCalls;
          const anonymous = await fetch(`${base}/api/documents`);
          assert.equal(anonymous.status, 401);
          assert.equal(upstreamCalls, before);
          const response = await fetch(
            `${base}/api/documents?today=2099-01-01&warningDays=0`,
            {
              headers: {
                Cookie: cookie,
                Authorization: 'Bearer untrusted-browser-value',
              },
            },
          );
          assert.equal(response.status, 200);
          assert.equal(lastUpstreamUrl, '/documents');
          assert.deepEqual(await response.json(), {
            today: '2026-05-15',
            warningDays: 30,
            documents: [],
          });
          assert.match(response.headers.get('cache-control'), /no-store/);
        },
      );
      await t.test(
        'schedule reads validate a bounded month and forward only the private token and allowed parameters',
        async () => {
          mode = 'healthy';
          const before = upstreamCalls;
          const anonymous = await fetch(
            `${base}/api/schedules?year=2026&month=05`,
          );
          assert.equal(anonymous.status, 401);
          for (const query of [
            'year=2026&month=13',
            'year=2026&month=5&extra=x',
            'year=2026&month=5&month=6',
          ]) {
            const invalid = await fetch(`${base}/api/schedules?${query}`, {
              headers: { Cookie: cookie },
            });
            assert.equal(invalid.status, 400);
          }
          assert.equal(upstreamCalls, before);
          const response = await fetch(
            `${base}/api/schedules?year=2026&month=05`,
            {
              headers: {
                Cookie: cookie,
                Authorization: 'Bearer untrusted-browser-value',
              },
            },
          );
          assert.equal(response.status, 200);
          assert.equal(lastUpstreamUrl, '/schedules?year=2026&month=05');
          assert.deepEqual(await response.json(), {
            today: '2026-05-15',
            year: 2026,
            month: 5,
            legend: [],
            schedules: [],
          });
          assert.match(response.headers.get('cache-control'), /no-store/);
        },
      );
      await t.test(
        'upstream faults preserve the cookie and hide private diagnostics',
        async () => {
          for (const [failure, path] of ['unavailable', 'disconnected'].flatMap(
            (mode) =>
              [
                '/api/auth/session',
                '/api/flight-hours/summary?range=1w',
                '/api/documents',
                '/api/schedules?year=2026&month=5',
              ].map((path) => [mode, path]),
          )) {
            mode = failure;
            const result = await fetch(`${base}${path}`, {
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
          const documentCalls = upstreamCalls;
          const documents = await fetch(`${base}/api/documents`, {
            headers: { Cookie: cookie },
          });
          assert.equal(documents.status, 429);
          assert.equal(upstreamCalls, documentCalls + 1);
          assert.equal(documents.headers.get('set-cookie'), null);
        },
      );
      await t.test(
        'invalid upstream sessions are rejected without mutating browser cookies',
        async () => {
          mode = 'unauthorized';
          for (const path of [
            '/api/auth/session',
            '/api/flight-hours/summary?range=1w',
            '/api/documents',
            '/api/schedules?year=2026&month=5',
          ]) {
            const result = await fetch(`${base}${path}`, {
              headers: { Cookie: cookie },
            });
            assert.equal(result.status, 401);
            assert.equal(result.headers.get('set-cookie'), null);
            assert.match(result.headers.get('cache-control'), /no-store/);
          }
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
