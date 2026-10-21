import { test, expect } from './support/pilot-test';

test('dashboard keeps the trend and documents together on desktop and limits above mobile navigation', async ({
  page,
  context,
  pilotState,
}) => {
  await context.addCookies(pilotState.cookies);
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/');
  const trend = await page.locator('.trend-panel').boundingBox();
  const documents = await page
    .getByRole('region', {
      name: 'My documents',
      exact: true,
    })
    .boundingBox();
  expect(documents!.x).toBeGreaterThan(trend!.x + trend!.width);
  expect(Math.abs(documents!.y - trend!.y)).toBeLessThan(2);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => scrollTo(0, 0));
  const navigation = await page
    .getByRole('navigation', {
      name: 'Main navigation',
    })
    .boundingBox();
  for (const card of await page.locator('[data-testid="limit-card"]').all()) {
    const bounds = await card.boundingBox();
    expect(bounds!.y + bounds!.height).toBeLessThan(navigation!.y);
  }
});

test('pilot interface loads local brand assets and remains usable across screen sizes', async ({
  page,
  context,
  pilotState,
}, testInfo) => {
  const externalRequests: string[] = [];
  const pageErrors: string[] = [];
  const origin = new URL(testInfo.project.use.baseURL!).origin;
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('request', (request) => {
    if (new URL(request.url()).origin !== origin)
      externalRequests.push(request.url());
  });
  const logo = page.getByRole('img', { name: 'Susi Air', exact: true });
  await page.goto('/login');
  await expect(logo).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  expect(
    await page.evaluate(() =>
      document.fonts.check('600 16px "Plus Jakarta Sans"'),
    ),
  ).toBe(true);
  expect(
    await page.evaluate(() => getComputedStyle(document.body).fontFamily),
  ).toContain('Plus Jakarta Sans');
  await page.keyboard.press('Tab');
  const skip = page.getByRole('link', { name: 'Skip to content', exact: true });
  await expect(skip).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toBeFocused();
  await page.getByLabel('Username').focus();
  expect(
    await page
      .getByLabel('Username')
      .evaluate((element) => getComputedStyle(element).outlineStyle),
  ).toBe('solid');
  for (const width of [320, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: testInfo.outputPath(`login-${width}.png`),
      fullPage: true,
    });
  }
  await context.addCookies(pilotState.cookies);
  for (const path of ['/', '/schedule', '/duty/2026-05-15']) {
    await page.goto(path);
    await expect(logo).toBeVisible();
    expect(
      await logo.evaluate((image: HTMLImageElement) => image.naturalWidth),
    ).toBeGreaterThan(0);
    for (const width of [320, 390, 768, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      if (path === '/') {
        const plot = (await page.getByTestId('flight-chart').boundingBox())!;
        const legend = (await page.locator('.chart-legend').boundingBox())!;
        for (const date of await page.locator('.date-label:visible').all()) {
          const bounds = (await date.boundingBox())!;
          expect(bounds.y).toBeGreaterThan(plot.y + plot.height);
          expect(bounds.y + bounds.height).toBeLessThan(legend.y);
        }
      }
      const name =
        path === '/' ? 'home' : path.startsWith('/duty') ? 'duty' : 'schedule';
      await page.screenshot({
        path: testInfo.outputPath(`${name}-${width}.png`),
        fullPage: true,
      });
    }
  }
  expect(externalRequests).toEqual([]);
  expect(pageErrors).toEqual([]);
});
