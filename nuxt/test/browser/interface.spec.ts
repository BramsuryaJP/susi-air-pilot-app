import { test, expect } from './support/pilot-test';

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
    await page.getByLabel('Username').evaluate(
      (element) => getComputedStyle(element).outlineStyle,
    ),
  ).toBe('solid');
  for (const width of [320, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
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
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      ).toBe(true);
      if (path === '/') {
        const today = await page.locator('.today-label').boundingBox();
        const zero = await page.locator('.chart-grid text').first().boundingBox();
        const dates = await page.locator('.date-label').all();
        for (const date of dates) {
          const bounds = await date.boundingBox();
          expect(bounds!.y + bounds!.height).toBeLessThan(today!.y);
          expect(zero!.y + zero!.height).toBeLessThan(bounds!.y);
        }
      }
      const name = path === '/' ? 'home' : path.startsWith('/duty') ? 'duty' : 'schedule';
      await page.screenshot({
        path: testInfo.outputPath(`${name}-${width}.png`),
        fullPage: true,
      });
    }
  }
  expect(externalRequests).toEqual([]);
  expect(pageErrors).toEqual([]);
});
