import { expect, test } from '@playwright/test';

const origin = 'http://127.0.0.1:4311';
const credentials = { username: 'johndoe', password: 'susiairtest' };

test('the SSR sign-in form cannot submit credentials before hydration', async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    baseURL,
  });
  try {
    const page = await context.newPage();
    await page.goto('/login');
    await expect(page.locator('form')).toHaveAttribute('method', 'post');
    await expect(page.getByLabel('Username')).toBeDisabled();
    await expect(page.getByLabel('Password', { exact: true })).toBeDisabled();
    await expect(
      page.getByRole('button', { name: 'Sign in', exact: true }),
    ).toBeDisabled();
    await expect(
      page.getByText('Enable JavaScript to sign in.'),
    ).toBeVisible();
    await expect(page).toHaveURL('/login');
  } finally {
    await context.close();
  }
});

test('sign-in controls become interactive only after delayed client hydration', async ({
  page,
}) => {
  let release: () => void = () => {};
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/_nuxt/*.js', async (route) => {
    await held;
    await route.continue();
  });
  try {
    await page.goto('/login', { waitUntil: 'commit' });
    await expect(page.getByLabel('Username')).toBeDisabled();
    await expect(
      page.getByRole('button', { name: 'Sign in', exact: true }),
    ).toBeDisabled();
    release();
    await expect(page.getByLabel('Username')).toBeEnabled();
    await page.getByLabel('Username').fill(credentials.username);
    await page
      .getByLabel('Password', { exact: true })
      .fill(credentials.password);
    await page
      .getByRole('button', { name: 'Show password', exact: true })
      .click();
    await expect(page.getByLabel('Password', { exact: true })).toHaveAttribute(
      'type',
      'text',
    );
    await expect(page).toHaveURL('/login');
  } finally {
    release();
    await page.unrouteAll({ behavior: 'wait' });
  }
});

test('sign-in handles errors, prevents duplicate submits, survives SSR reload, and signs out', async ({
  page,
  context,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page).toHaveURL('/login');
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: testInfo.outputPath('sign-in-mobile.png'),
    fullPage: true,
  });
  await page.getByLabel('Username').fill(credentials.username);
  await page.getByLabel('Password', { exact: true }).fill('incorrect');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.locator('#sign-in-error')).toHaveText(
    'Invalid username or password.',
  );

  let loginRequests = 0;
  await page.route('**/api/auth/login', async (route) => {
    loginRequests++;
    await new Promise((resolve) => setTimeout(resolve, 300));
    await route.continue();
  });
  await page.getByLabel('Password', { exact: true }).fill(credentials.password);
  await page.locator('form').evaluate((form: HTMLFormElement) => {
    form.requestSubmit();
    form.requestSubmit();
  });
  await expect(page.getByRole('button', { name: 'Signing in' })).toBeDisabled();
  await expect(page).toHaveURL('/');
  expect(loginRequests).toBe(1);
  await expect(
    page.getByRole('heading', { name: 'Welcome, John Doe' }),
  ).toBeVisible();
  await expect
    .poll(() =>
      page
        .locator('.profile-panel img')
        .evaluate((image: HTMLImageElement) => image.naturalWidth),
    )
    .toBeGreaterThan(0);
  await page.screenshot({
    path: testInfo.outputPath('profile-mobile.png'),
    fullPage: true,
  });
  const cookie = (await context.cookies()).find(
    (item) => item.name === 'pilot_session',
  );
  expect(cookie).toMatchObject({
    httpOnly: true,
    sameSite: 'Strict',
    path: '/',
  });
  expect(await page.evaluate(() => document.cookie)).not.toContain(
    'pilot_session',
  );
  expect(await page.evaluate(() => Object.keys(localStorage))).toEqual([]);
  expect(await page.content()).not.toContain(cookie!.value);
  let hydrationSessionRequests = 0;
  page.on('request', (request) => {
    if (new URL(request.url()).pathname === '/api/auth/session')
      hydrationSessionRequests++;
  });
  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'Welcome, John Doe' }),
  ).toBeVisible();
  expect(hydrationSessionRequests).toBe(0);
  expect((await page.request.get('/')).headers()['cache-control']).toContain(
    'no-store',
  );
  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page).toHaveURL('/login');
  await page.goto('/');
  await expect(page).toHaveURL('/login');
  expect(
    (await context.cookies()).some((item) => item.name === 'pilot_session'),
  ).toBe(false);
});

test('the server adapter enforces origin, JSON, private responses, and cookie-only tokens', async ({
  request,
}) => {
  expect(
    (await request.post('/api/auth/login', { data: credentials })).status(),
  ).toBe(403);
  expect(
    (
      await request.post('/api/auth/login', {
        headers: { Origin: 'https://untrusted.example' },
        data: credentials,
      })
    ).status(),
  ).toBe(403);
  expect(
    (
      await request.post('/api/auth/login', {
        headers: { Origin: origin, 'Content-Type': 'text/plain' },
        data: JSON.stringify(credentials),
      })
    ).status(),
  ).toBe(415);
  const result = await request.post('/api/auth/login', {
    headers: { Origin: origin },
    data: credentials,
  });
  expect(result.status()).toBe(200);
  expect(await result.json()).toEqual({ authenticated: true });
  expect(result.headers()['set-cookie']).toMatch(/HttpOnly/i);
  expect(result.headers()['set-cookie']).toMatch(/SameSite=Strict/i);
  expect(result.headers()['cache-control']).toContain('no-store');
  expect((await request.get('/api/auth/session')).status()).toBe(200);
  expect(
    (
      await request.post('/api/auth/logout', {
        headers: { Origin: 'https://untrusted.example' },
      })
    ).status(),
  ).toBe(403);
  expect((await request.get('/api/auth/session')).status()).toBe(200);
  expect(
    (
      await request.post('/api/auth/logout', { headers: { Origin: origin } })
    ).status(),
  ).toBe(204);
  expect((await request.get('/api/auth/session')).status()).toBe(401);
});

test('an invalid cookie is cleared and service failures give actionable feedback', async ({
  page,
  context,
}) => {
  await context.addCookies([
    {
      name: 'pilot_session',
      value: 'invalid-token',
      url: origin,
      httpOnly: true,
      sameSite: 'Strict',
    },
  ]);
  const result = await page.request.get('/api/auth/session');
  expect(result.status()).toBe(401);
  expect(
    (await context.cookies()).some((item) => item.name === 'pilot_session'),
  ).toBe(false);
  await context.addCookies([
    {
      name: 'pilot_session',
      value: 'invalid-token',
      url: origin,
      httpOnly: true,
      sameSite: 'Strict',
    },
  ]);
  await page.goto('/');
  await expect(page).toHaveURL('/login');
  expect(
    (await context.cookies()).some((item) => item.name === 'pilot_session'),
  ).toBe(false);
  await page.goto('/login');
  await page.route('**/api/auth/login', (route) =>
    route.fulfill({ status: 503, json: { message: 'Temporary failure' } }),
  );
  await page.getByLabel('Username').fill(credentials.username);
  await page.getByLabel('Password', { exact: true }).fill(credentials.password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.locator('#sign-in-error')).toHaveText(
    'The sign-in service is unavailable. Please try again.',
  );
  await expect(
    page.getByRole('button', { name: 'Sign in', exact: true }),
  ).toBeEnabled();
});

test('sessions are isolated between browser contexts', async ({
  browser,
  page,
}, testInfo) => {
  await page.goto('/login');
  await page.screenshot({
    path: testInfo.outputPath('sign-in-desktop.png'),
    fullPage: true,
  });
  await page.getByLabel('Username').fill(credentials.username);
  await page.getByLabel('Password', { exact: true }).fill(credentials.password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page).toHaveURL('/');
  const isolated = await browser.newContext();
  try {
    const other = await isolated.newPage();
    await other.goto(origin);
    await expect(other).toHaveURL(`${origin}/login`);
    await expect(
      page.getByRole('heading', { name: 'Welcome, John Doe' }),
    ).toBeVisible();
  } finally {
    await isolated.close();
  }
});
