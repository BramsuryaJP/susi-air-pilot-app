import { expect, test } from './support/pilot-test';

const message = 'Session expired. Please sign in again.';

test('production CSP allows application hydration and blocks untrusted inline scripts', async ({
  page,
  context,
  pilotState,
}) => {
  const violations: string[] = [];
  page.on('console', (event) => {
    if (
      event.type() === 'error' &&
      /content security policy|refused to/i.test(event.text())
    )
      violations.push(event.text());
  });
  const first = await page.goto('/login');
  const policy = first!.headers()['content-security-policy'] ?? '';
  const nonce = policy.match(/'nonce-([^']+)'/)?.[1];
  expect(nonce).toBeTruthy();
  expect(policy).toContain("frame-ancestors 'none'");
  expect(policy).toContain("object-src 'none'");
  expect(policy).not.toContain("script-src 'self' 'unsafe-inline'");
  const scripts = await page
    .locator('script')
    .evaluateAll((nodes) =>
      nodes.map((node) => (node as HTMLScriptElement).nonce),
    );
  expect(scripts.length).toBeGreaterThan(0);
  expect(scripts.every((value) => value === nonce)).toBe(true);
  await expect(
    page.getByRole('button', { name: 'Sign in', exact: true }),
  ).toBeEnabled();
  const second = await page.reload();
  expect(second!.headers()['content-security-policy']).not.toContain(
    `'nonce-${nonce}'`,
  );
  await context.addCookies(pilotState.cookies);
  for (const path of [
    '/',
    '/Schedule/',
    '/Duty/2026-05-15/',
    '/missing-security-page',
  ]) {
    const response = await page.goto(path);
    const headers = response!.headers();
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['x-frame-options']).toBe('DENY');
    expect(headers['referrer-policy']).toBe('no-referrer');
    expect(headers['content-security-policy']).toContain(
      "frame-ancestors 'none'",
    );
    if (path === '/')
      await expect(
        page.getByRole('button', { name: 'Refresh documents' }),
      ).toBeEnabled();
    if (path === '/Schedule/')
      await expect(
        page.getByRole('combobox', { name: 'Month', exact: true }),
      ).toBeEnabled();
  }
  expect(violations).toEqual([]);
  const blocked = await page.evaluate(async () => {
    const violation = new Promise<string>((resolve) =>
      document.addEventListener(
        'securitypolicyviolation',
        (event) => resolve(event.violatedDirective),
        { once: true },
      ),
    );
    const script = document.createElement('script');
    script.textContent =
      "document.documentElement.dataset.untrustedScript = 'executed'";
    document.head.append(script);
    return {
      directive: await violation,
      executed: document.documentElement.dataset.untrustedScript,
    };
  });
  expect(blocked.directive).toContain('script-src');
  expect(blocked.executed).toBeUndefined();
});

test('expired sessions explain automatic sign-out across SSR and client navigation without labelling manual logout expired', async ({
  page,
  context,
  pilotState,
}, testInfo) => {
  await page.goto('/login');
  await expect(page.getByText(message, { exact: true })).toHaveCount(0);
  await context.addCookies(
    pilotState.cookies.map((cookie) =>
      cookie.name === 'pilot_session'
        ? { ...cookie, value: 'expired-session' }
        : cookie,
    ),
  );
  await page.goto('/Schedule/');
  await expect(page).toHaveURL('/login');
  await expect(page.getByRole('alert').filter({ hasText: message })).toHaveText(
    message,
  );
  await page.reload();
  await expect(page.getByRole('alert').filter({ hasText: message })).toHaveText(
    message,
  );
  await page.setViewportSize({ width: 360, height: 800 });
  await page.screenshot({
    path: testInfo.outputPath('session-expired-mobile.png'),
    fullPage: true,
  });
  await page.getByLabel('Username').fill('johndoe');
  await page.getByLabel('Password', { exact: true }).fill('susiairtest');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page).toHaveURL('/');
  const hint = (await context.cookies()).find(
    (cookie) => cookie.name === 'pilot_session_hint',
  );
  expect(hint).toMatchObject({
    value: '1',
    httpOnly: true,
    sameSite: 'Strict',
  });
  expect(await page.evaluate(() => document.cookie)).not.toContain(
    'pilot_session_hint',
  );
  await context.clearCookies({ name: 'pilot_session' });
  const rejected = await page.request.get('/api/auth/session');
  expect(rejected.status()).toBe(401);
  expect((await rejected.json()).data.code).toBe('SESSION_EXPIRED');

  await page
    .getByRole('navigation', { name: 'Main navigation' })
    .getByRole('link', { name: 'Schedule', exact: true })
    .click();
  await expect(page).toHaveURL('/login');
  await expect(page.getByRole('alert').filter({ hasText: message })).toHaveText(
    message,
  );
  await page.reload();
  await expect(page.getByRole('alert').filter({ hasText: message })).toHaveText(
    message,
  );
  await page.getByLabel('Username').fill('johndoe');
  await page.getByLabel('Password', { exact: true }).fill('susiairtest');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page).toHaveURL('/');
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await expect(page).toHaveURL('/login');
  await expect(page.getByText(message, { exact: true })).toHaveCount(0);
  await page.reload();
  await expect(page.getByText(message, { exact: true })).toHaveCount(0);
});

test('expired feature reads show a notice but service failures do not end the session', async ({
  page,
  context,
  pilotState,
}) => {
  await context.addCookies(pilotState.cookies);
  await page.goto('/');
  await page.route('**/api/documents', (route) =>
    route.fulfill({ status: 503, json: { message: 'Temporary failure' } }),
  );
  await page.getByRole('button', { name: 'Refresh documents' }).click();
  await expect(
    page.getByRole('button', { name: 'Retry documents' }),
  ).toBeVisible();
  await expect(page).toHaveURL('/');
  await page.unrouteAll();
  await context.clearCookies({ name: 'pilot_session' });
  await page.getByRole('button', { name: 'Retry documents' }).click();
  await expect(page).toHaveURL('/login');
  await expect(page.getByRole('alert').filter({ hasText: message })).toHaveText(
    message,
  );
});

test('a late client session failure cannot label an explicit logout expired', async ({
  page,
  context,
  pilotState,
}) => {
  await context.addCookies(pilotState.cookies);
  await page.goto('/');
  let release: () => void = () => {};
  let started: () => void = () => {};
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  const seen = new Promise<void>((resolve) => {
    started = resolve;
  });
  let calls = 0;
  await page.route('**/api/auth/session', async (route) => {
    if (++calls !== 1) return route.continue();
    started();
    await held;
    await route.fulfill({
      status: 401,
      json: { data: { code: 'SESSION_EXPIRED' } },
    });
  });
  try {
    const navigation = page
      .getByRole('navigation', { name: 'Main navigation' })
      .getByRole('link', { name: 'Schedule', exact: true })
      .click();
    await seen;
    const signedOut = page.waitForResponse(
      (response) =>
        new URL(response.url()).pathname === '/api/auth/logout' &&
        response.status() === 204,
    );
    await page.getByRole('button', { name: 'Sign out', exact: true }).click();
    await signedOut;
    release();
    await navigation;
    await expect(page).toHaveURL('/login');
    await expect(
      page.getByRole('button', { name: 'Sign in', exact: true }),
    ).toBeEnabled();
    await expect(page.getByText(message, { exact: true })).toHaveCount(0);
    await page.reload();
    await expect(page.getByText(message, { exact: true })).toHaveCount(0);
  } finally {
    release();
    await page.unrouteAll({ behavior: 'wait' });
  }
});
