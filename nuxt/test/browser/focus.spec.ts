import { expect, test } from './support/pilot-test';

function luminance(rgb: number[]): number {
  const linear = rgb.map((value) => {
    const channel = value / 255;
    return channel <= 0.04045
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return linear[0]! * 0.2126 + linear[1]! * 0.7152 + linear[2]! * 0.0722;
}

test('interactive controls share visible inset focus across light, red, and navy surfaces', async ({
  page,
  context,
  pilotState,
}, testInfo) => {
  for (const path of [
    '/login',
    '/',
    '/schedule',
    '/duty/2026-05-15',
    '/logbook',
    '/more',
    '/missing-focus-page',
  ]) {
    if (path === '/') await context.addCookies(pilotState.cookies);
    await page.goto(path);
    if (path === '/login')
      await expect(
        page.getByRole('button', { name: 'Sign in', exact: true }),
      ).toBeEnabled();
    if (path === '/')
      await expect(
        page.getByRole('button', { name: 'Refresh documents' }),
      ).toBeEnabled();
    if (path === '/schedule')
      await expect(
        page.getByRole('combobox', { name: 'Month', exact: true }),
      ).toBeEnabled();
    for (const width of [320, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      // Keep keyboard modality when moving focus programmatically between controls.
      await page.keyboard.press('Tab');
      let checked = 0;
      for (const control of await page
        .locator('a[href], button, input, select, summary')
        .all()) {
        if (!(await control.isVisible()) || !(await control.isEnabled()))
          continue;
        await control.focus();
        const paint = await control.evaluate((element) => {
          const style = getComputedStyle(element);
          let background = style.backgroundColor;
          let surface: Element | null = element;
          while (
            surface &&
            (background === 'transparent' || background === 'rgba(0, 0, 0, 0)')
          ) {
            surface = surface.parentElement;
            if (surface) background = getComputedStyle(surface).backgroundColor;
          }
          return {
            name:
              element.getAttribute('aria-label') ??
              element.textContent?.trim() ??
              element.tagName,
            visible: element.matches(':focus-visible'),
            width: style.outlineWidth,
            offset: style.outlineOffset,
            style: style.outlineStyle,
            color: style.outlineColor
              .match(/[\d.]+/g)!
              .slice(0, 3)
              .map(Number),
            background: background
              .match(/[\d.]+/g)!
              .slice(0, 3)
              .map(Number),
          };
        });
        expect.soft(paint.visible, paint.name).toBe(true);
        expect.soft(paint.width, paint.name).toBe('2px');
        expect.soft(paint.offset, paint.name).toBe('-2px');
        expect.soft(paint.style, paint.name).toBe('solid');
        const colors = [
          luminance(paint.color),
          luminance(paint.background),
        ].sort((a, b) => a - b);
        expect
          .soft((colors[1]! + 0.05) / (colors[0]! + 0.05), paint.name)
          .toBeGreaterThanOrEqual(3);
        checked++;
      }
      for (const action of await page
        .locator('.primary-button, .home-link')
        .all()) {
        await action.focus();
        await action.hover();
        const colors = await action.evaluate((element) => {
          const style = getComputedStyle(element);
          return [style.outlineColor, style.backgroundColor].map((color) =>
            color
              .match(/[\d.]+/g)!
              .slice(0, 3)
              .map(Number),
          );
        });
        const light = colors.map(luminance).sort((a, b) => a - b);
        expect((light[1]! + 0.05) / (light[0]! + 0.05)).toBeGreaterThanOrEqual(
          3,
        );
      }
      expect(checked).toBeGreaterThan(0);
      const name = path === '/' ? 'home' : path.slice(1).replaceAll('/', '-');
      await page.screenshot({
        path: testInfo.outputPath(`focus-${name}-${width}.png`),
        fullPage: true,
      });
    }
  }
});
