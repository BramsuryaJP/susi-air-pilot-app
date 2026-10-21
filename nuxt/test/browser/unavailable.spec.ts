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
    for (const width of [320, 360, 390, 768, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      const navigation = page.getByRole('navigation', {
        name: 'Main navigation',
      });
      const navBounds = (await navigation.boundingBox())!;
      for (const link of await navigation.getByRole('link').all()) {
        const bounds = (await link.boundingBox())!;
        expect(bounds.width).toBeGreaterThanOrEqual(60);
        expect(bounds.height).toBeGreaterThanOrEqual(width < 768 ? 60 : 48);
        await expect(link.locator('svg')).toHaveCSS(
          'width',
          width < 768 ? '24px' : '21px',
        );
        await expect(link).toHaveCSS(
          'font-size',
          width < 768 ? '13px' : '11.2px',
        );
        const label = (await link.locator('span').boundingBox())!;
        expect(label.x).toBeGreaterThanOrEqual(bounds.x);
        expect(label.x + label.width).toBeLessThanOrEqual(bounds.x + bounds.width);
      }
      await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
      const recovery = (await page
        .getByRole('link', { name: 'Back to Home', exact: true })
        .boundingBox())!;
      expect(recovery.y + recovery.height).toBeLessThan(navBounds.y);
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
  ).toBe(true);
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
