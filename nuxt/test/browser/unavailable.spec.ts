import { expect, test } from './support/pilot-test';

test('Logbook and More open clear unavailable pages and recover through working navigation', async ({
  page,
  context,
  pilotState,
}, testInfo) => {
  await context.addCookies(pilotState.cookies);
  await page.goto('/');
  for (const [name, path] of [
    ['Logbook', '/logbook'],
    ['More', '/more'],
  ] as const) {
    const tab = page
      .getByRole('navigation', { name: 'Main navigation' })
      .getByRole('link', { name, exact: true });
    await tab.click();
    await expect(page).toHaveURL(path);
    await expect(
      page.getByRole('heading', { name: 'Page unavailable', exact: true }),
    ).toBeVisible();
    await expect(tab).toHaveAttribute('aria-current', 'page');
    for (const url of [path, `${path}/`, path.toUpperCase()]) {
      const response = await page.request.get(url);
      expect(response.status()).toBe(200);
      expect(response.headers()['cache-control']).toContain('no-store');
      expect(response.headers().vary).toMatch(/Cookie/i);
    }
    for (const width of [320, 390, 768, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await page.screenshot({
        path: testInfo.outputPath(`${name.toLowerCase()}-${width}.png`),
        fullPage: true,
      });
    }
    await page.getByRole('link', { name: 'Back to Home', exact: true }).click();
    await expect(
      page.getByRole('heading', { name: 'Welcome, John Doe' }),
    ).toBeVisible();
  }
  await page
    .getByRole('navigation', { name: 'Main navigation' })
    .getByRole('link', { name: 'More', exact: true })
    .click();
  await page
    .getByRole('navigation', { name: 'Main navigation' })
    .getByRole('link', { name: 'Schedule', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Schedule', exact: true }),
  ).toBeVisible();
});

test('unavailable routes remain protected for missing, invalid, and removed sessions', async ({
  page,
  context,
  pilotState,
}) => {
  for (const path of ['/logbook', '/more', '/LOGBOOK/', '/MORE/']) {
    const response = await page.request.get(path, { maxRedirects: 0 });
    expect(response.status()).toBe(302);
    expect(response.headers().location).toBe('/login');
  }
  await context.addCookies(
    pilotState.cookies.map((cookie) => ({
      ...cookie,
      value: 'invalid-session',
    })),
  );
  await page.goto('/logbook');
  await expect(page).toHaveURL('/login');
  expect(
    (await context.cookies()).some((cookie) => cookie.name === 'pilot_session'),
  ).toBe(false);
  await context.addCookies(pilotState.cookies);
  await page.goto('/more');
  await expect(
    page.getByRole('heading', { name: 'Page unavailable', exact: true }),
  ).toBeVisible();
  await context.clearCookies();
  await page.getByRole('link', { name: 'Back to Home', exact: true }).click();
  await expect(page).toHaveURL('/login');
  await expect(page.getByLabel('Username')).toBeEnabled();
});
