import { test, expect } from './support/pilot-test';

const expiredMessage = 'Session expired. Please sign in again.';
const failureMessage = 'Sign out could not be completed. Please try again.';

const routes = [
  ['/', 'home'],
  ['/Schedule/', 'schedule'],
  ['/Duty/2026-05-15/', 'duty'],
  ['/LOGBOOK/', 'logbook'],
  ['/MORE/', 'more'],
] as const;

test('all protected workspace pages provide an accessible sign-out action that clears the session', async ({
  page,
  context,
  pilotState,
}, testInfo) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  let writes = 0;
  page.on('request', (request) => {
    if (new URL(request.url()).pathname === '/api/auth/logout') writes++;
  });
  for (const width of [320, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    for (const [path, name] of routes) {
      await context.clearCookies();
      await context.addCookies(pilotState.cookies);
      const response = await page.goto(path);
      expect((await response!.text()).includes('>Sign out<'), path).toBe(true);
      const button = page.getByRole('button', { name: 'Sign out', exact: true });
      await expect(button).toHaveCount(1);
      await expect(button).toBeEnabled();
      const bounds = (await button.boundingBox())!;
      expect(bounds.height).toBeGreaterThanOrEqual(44);
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(width);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      ).toBe(true);
      await button.focus();
      await expect(button).toHaveCSS('outline-style', 'solid');
      await page.screenshot({
        path: testInfo.outputPath(`${name}-${width}.png`),
        fullPage: true,
      });
      const before = writes;
      await page.keyboard.press('Enter');
      await expect(page).toHaveURL('/login');
      expect(writes).toBe(before + 1);
      expect(
        (await context.cookies()).some((cookie) =>
          ['pilot_session', 'pilot_session_hint'].includes(cookie.name),
        ),
      ).toBe(false);
      await expect(page.getByText(expiredMessage, { exact: true })).toHaveCount(0);
      expect((await page.request.get('/api/auth/session')).status()).toBe(401);
      await page.goto(path);
      await expect(page).toHaveURL('/login');
    }
  }
  expect(pageErrors).toEqual([]);
});

test('shared sign-out prevents duplicate writes and allows retry after a failed request', async ({
  page,
  context,
  pilotState,
}) => {
  await context.addCookies(pilotState.cookies);
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto('/schedule');
  const button = page.getByRole('button', { name: 'Sign out', exact: true });
  await expect(button).toBeEnabled();
  let release: () => void = () => {};
  const held = new Promise<void>((resolve) => { release = resolve; });
  let writes = 0;
  await page.route('**/api/auth/logout', async (route) => {
    writes++;
    await held;
    await route.fulfill({ status: 503, json: { message: 'Temporary failure' } });
  });
  try {
    await button.click();
    const pending = page.getByRole('button', { name: 'Signing out', exact: true });
    await expect(pending).toBeDisabled();
    await pending.dispatchEvent('click');
    expect(writes).toBe(1);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    ).toBe(true);
    release();
    await expect(
      page.getByRole('alert').filter({ hasText: failureMessage }),
    ).toHaveText(failureMessage);
    await expect(button).toBeEnabled();
    await expect(page).toHaveURL('/schedule');
    await expect(page.locator('[data-calendar-month]')).toBeVisible();
    expect((await page.request.get('/api/auth/session')).status()).toBe(200);
    await expect(page.getByText(expiredMessage, { exact: true })).toHaveCount(0);
  } finally {
    release();
    await page.unrouteAll({ behavior: 'wait' });
  }
  await button.click();
  await expect(page).toHaveURL('/login');
  await expect(page.getByText(expiredMessage, { exact: true })).toHaveCount(0);
});

test('shared header waits for hydration and hides sign-out on guest and error pages', async ({
  browser,
  baseURL,
  pilotState,
}) => {
  const context = await browser.newContext({ baseURL, javaScriptEnabled: false });
  try {
    await context.addCookies(pilotState.cookies);
    const page = await context.newPage();
    await page.goto('/schedule');
    const button = page.getByRole('button', { name: 'Sign out', exact: true });
    await expect(button).toBeVisible();
    await expect(button).toBeDisabled();
    await page.goto('/missing-sign-out-page');
    await expect(page.getByRole('heading', { name: 'Page not found', exact: true })).toBeVisible();
    await expect(button).toHaveCount(0);
    await context.clearCookies();
    await page.goto('/schedule');
    await expect(page).toHaveURL('/login');
    await expect(button).toHaveCount(0);
    await page.goto('/missing-sign-out-page');
    await expect(button).toHaveCount(0);
  } finally {
    await context.close();
  }
});
