import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import test from 'node:test';
import { request } from '@playwright/test';

test(
  'protected read failures cannot overwrite a newer browser session',
  { timeout: 30000 },
  async (t) => {
    let release = () => {};
    let started = () => {};
    let held = Promise.resolve();
    const profile = {
      name: 'Contract Pilot',
      totalFlightHours: 12,
      avatarUrl: '/pilot-avatar.svg',
      today: '2026-05-15',
    };
    const upstream = createServer(async (req, res) => {
      req.resume();
      res.setHeader('Content-Type', 'application/json');
      if (req.url === '/auth/login')
        return res.end(
          JSON.stringify({
            accessToken: 'new-contract-session',
            tokenType: 'Bearer',
            expiresIn: 1800,
          }),
        );
      if (req.headers.authorization === 'Bearer old-contract-session') {
        started();
        await held;
        res.writeHead(401);
        return res.end('{}');
      }
      res.end(JSON.stringify(profile));
    });
    await new Promise((resolve) => upstream.listen(0, '127.0.0.1', resolve));
    const reservation = createServer();
    await new Promise((resolve) => reservation.listen(0, '127.0.0.1', resolve));
    const port = reservation.address().port;
    await new Promise((resolve) => reservation.close(resolve));
    const base = `http://127.0.0.1:${port}`;
    const child = spawn(process.execPath, ['.output/server/index.mjs'], {
      cwd: fileURLToPath(new URL('../../', import.meta.url)),
      env: {
        ...process.env,
        NODE_ENV: 'production',
        PORT: String(port),
        HOST: '127.0.0.1',
        NUXT_API_BASE: `http://127.0.0.1:${upstream.address().port}`,
        NUXT_APP_ORIGIN: base,
      },
      stdio: 'ignore',
    });
    try {
      let ready = false;
      for (let i = 0; i < 100; i++) {
        try {
          ready =
            (
              await fetch(`${base}/login`, {
                signal: AbortSignal.timeout(1000),
              })
            ).status === 200;
        } catch {
          /* Wait for the owned server. */
        }
        if (ready) break;
        await delay(100);
      }
      assert.ok(ready);
      for (const path of ['/api/auth/session', '/login']) {
        await t.test(
          `a delayed ${path} 401 leaves the new cookie intact`,
          async () => {
            held = new Promise((resolve) => {
              release = resolve;
            });
            const seen = new Promise((resolve) => {
              started = resolve;
            });
            const context = await request.newContext({
              baseURL: base,
              storageState: {
                cookies: [
                  {
                    name: 'pilot_session',
                    value: 'old-contract-session',
                    domain: '127.0.0.1',
                    path: '/',
                    expires: -1,
                    httpOnly: true,
                    secure: false,
                    sameSite: 'Strict',
                  },
                ],
                origins: [],
              },
            });
            try {
              const stale = context.get(path);
              await seen;
              const login = await context.post('/api/auth/login', {
                headers: { Origin: base },
                data: { username: 'contract', password: 'contract' },
              });
              assert.equal(login.status(), 200);
              assert.ok(
                (await context.storageState()).cookies.some(
                  (cookie) =>
                    cookie.name === 'pilot_session' &&
                    cookie.value === 'new-contract-session',
                ),
              );
              release();
              const response = await stale;
              assert.equal(response.status(), path === '/login' ? 200 : 401);
              assert.equal(
                response.headers()['set-cookie'],
                undefined,
                'An old read must never mutate cookies.',
              );
              assert.ok(
                (await context.storageState()).cookies.some(
                  (cookie) =>
                    cookie.name === 'pilot_session' &&
                    cookie.value === 'new-contract-session',
                ),
              );
              assert.equal(
                (await context.get('/api/auth/session')).status(),
                200,
              );
              assert.equal(
                (
                  await context.post('/api/auth/logout', {
                    headers: { Origin: base },
                  })
                ).status(),
                204,
              );
              assert.ok(
                !(await context.storageState()).cookies.some(
                  (cookie) =>
                    cookie.name === 'pilot_session' ||
                    cookie.name === 'pilot_session_hint',
                ),
              );
            } finally {
              release();
              await context.dispose();
            }
          },
        );
      }
    } finally {
      release();
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
