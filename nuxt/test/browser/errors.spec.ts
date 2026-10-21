import { expect, test } from './support/pilot-test';

test('an unknown page recovers the complete authenticated dashboard', async ({
  page,
  context,
  pilotState,
}, testInfo) => {
  await context.addCookies(pilotState.cookies);
  const response = await page.goto('/this-page-does-not-exist');
  expect(response!.status()).toBe(404);
  await page.getByRole('link', { name: /back.*home/i }).click();
  await expect(page).toHaveURL('/');
  await expect(
    page.getByRole('heading', { name: 'Welcome, John Doe' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'My Documents' }),
  ).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath('recovered-home.png'),
    fullPage: true,
  });
});

test('error recovery rechecks a session removed while the error page is open', async ({
  page,
  context,
  pilotState,
}) => {
  await context.addCookies(pilotState.cookies);
  expect((await page.goto('/this-page-does-not-exist'))!.status()).toBe(404);
  await context.clearCookies();
  await page.getByRole('link', { name: /back.*home/i }).click();
  await expect(page).toHaveURL('/login');
  await expect(page.getByLabel('Username')).toBeEnabled();
  await expect(
    page.getByRole('navigation', { name: 'Main navigation' }),
  ).toHaveCount(0);
  expect((await page.request.get('/api/auth/session')).status()).toBe(401);
});

test('missing pages have a branded, responsive error screen with no protected navigation', async ({
  page,
  context,
  pilotState,
}, testInfo) => {
  await context.addCookies(pilotState.cookies);
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  for (const path of ['/this-page-does-not-exist', '/duty/not-a-date']) {
    expect((await page.goto(path))!.status()).toBe(404);
    await expect(page).toHaveTitle('Page not found | Susi Air');
    await expect(
      page.getByRole('heading', { name: 'Page not found', exact: true }),
    ).toBeVisible();
    await expect(page.getByRole('img', { name: 'Susi Air' })).toBeVisible();
    await expect(
      page.getByRole('navigation', { name: 'Main navigation' }),
    ).toHaveCount(0);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      'content',
      'noindex, nofollow',
    );
    await page.keyboard.press('Tab');
    await expect(
      page.getByRole('link', { name: 'Skip to main content' }),
    ).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('main')).toBeFocused();
  }
  for (const width of [320, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.getByRole('link', { name: /back.*home/i }).focus();
    await expect(page.getByRole('link', { name: /back.*home/i })).toBeFocused();
    await page.screenshot({
      path: testInfo.outputPath(`not-found-${width}.png`),
      fullPage: true,
    });
  }
  await page.getByRole('link', { name: /back.*home/i }).click();
  await expect(
    page.getByRole('heading', { name: 'Welcome, John Doe' }),
  ).toBeVisible();
  expect(pageErrors).toEqual([]);
});

test('other page errors keep their status and recover without exposing diagnostics', async ({
  page,
  context,
  pilotState,
}, testInfo) => {
  await context.addCookies(pilotState.cookies);
  expect((await page.goto('/schedule?month=2026-13'))!.status()).toBe(400);
  await expect(
    page.getByRole('heading', { name: 'Unable to load this page' }),
  ).toBeVisible();
  await expect(page.locator('main')).not.toContainText(
    'Choose a valid calendar month.',
  );
  await expect(
    page.getByRole('navigation', { name: 'Main navigation' }),
  ).toHaveCount(0);
  await page.screenshot({
    path: testInfo.outputPath('page-error.png'),
    fullPage: true,
  });
  await page.getByRole('link', { name: /back.*home/i }).click();
  await expect(
    page.getByRole('heading', { name: 'Welcome, John Doe' }),
  ).toBeVisible();
});

test('anonymous and invalid sessions cannot use error recovery to enter the workspace', async ({
  page,
  context,
  pilotState,
}) => {
  await page.goto('/this-page-does-not-exist');
  await expect(page).toHaveURL('/login');
  await context.addCookies(pilotState.cookies);
  expect((await page.goto('/this-page-does-not-exist'))!.status()).toBe(404);
  await context.addCookies(
    pilotState.cookies.map((cookie) => ({
      ...cookie,
      value: 'invalid-session',
    })),
  );
  await page.getByRole('link', { name: /back.*home/i }).click();
  await expect(page).toHaveURL('/login');
  await expect(page.getByLabel('Username')).toBeEnabled();
  expect(
    (await context.cookies()).some((cookie) => cookie.name === 'pilot_session'),
  ).toBe(true);
});

test('error recovery also works without JavaScript', async ({
  browser,
  baseURL,
  pilotState,
}) => {
  const context = await browser.newContext({
    baseURL,
    javaScriptEnabled: false,
    storageState: pilotState,
  });
  try {
    const page = await context.newPage();
    expect((await page.goto('/this-page-does-not-exist'))!.status()).toBe(404);
    await page.getByRole('link', { name: /back.*home/i }).click();
    await expect(page).toHaveURL('/');
    await expect(
      page.getByRole('heading', { name: 'Welcome, John Doe' }),
    ).toBeVisible();
  } finally {
    await context.close();
  }
});
