import { test, expect } from './support/pilot-test';

test('schedule calendar preserves API colors and counts, owns month requests, and opens date details', async ({
  page,
  context,
  pilotState,
}, testInfo) => {
  await page.goto('/schedule');
  await expect(page).toHaveURL('/login');
  expect(
    (await page.request.get('/api/schedules?year=2026&month=5')).status(),
  ).toBe(401);
  await context.addCookies(pilotState.cookies);
  let browserReads = 0;
  page.on('request', (request) => {
    if (new URL(request.url()).pathname === '/api/schedules') browserReads++;
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/schedule');
  await expect(
    page.getByRole('heading', { name: 'May 2026', exact: true }),
  ).toBeVisible();
  const calendar = page.getByRole('table', { name: 'May 2026', exact: true });
  await expect(calendar.locator('[data-date]')).toHaveCount(31);
  expect(browserReads).toBe(0);
  await expect(calendar.locator('[data-date="2026-05-15"]')).toHaveAttribute(
    'aria-current',
    'date',
  );
  await expect(
    calendar.locator('[data-date="2026-05-15"] .duty-badge svg.lucide-check'),
  ).toHaveCount(1);
  await expect(
    calendar.locator('[data-date="2026-05-19"] .duty-badge'),
  ).toHaveText('2');
  const data = await (
    await page.request.get('/api/schedules?year=2026&month=5')
  ).json();
  for (const entry of data.schedules) {
    const cell = calendar.locator(`[data-date="${entry.duty_date}"]`);
    const channels = entry.base_color
      .slice(1)
      .match(/../g)!
      .map((value: string) => parseInt(value, 16));
    await expect(cell.locator('.duty-event')).toHaveCSS(
      'background-color',
      `rgb(${channels.join(', ')})`,
    );
    await expect(cell).toContainText(entry.base_name);
    await expect(cell.locator('.duty-type')).toHaveText(entry.duty_type);
    await expect(cell).toHaveCSS('background-color', 'rgb(255, 255, 255)');
    const badge = cell.locator('.duty-badge');
    await expect(badge).toHaveAttribute('data-complete', String(entry.isComplete));
    if (entry.isComplete) {
      await expect(badge.locator('svg.lucide-check')).toHaveCount(1);
      await expect(cell).toHaveAccessibleName(/all duties logged/);
    } else {
      await expect(badge).toHaveText(String(entry.remainingDuties));
      await expect(badge.locator('svg')).toHaveCount(0);
    }
  }
  await expect(
    page.getByRole('list', { name: 'Duty legend' }).getByRole('listitem'),
  ).toHaveCount(10);
  await expect(
    page
      .getByRole('navigation', { name: 'Main navigation' })
      .getByRole('link', { name: 'Schedule', exact: true }),
  ).toHaveAttribute('aria-current', 'page');
  for (const [width, name] of [
    [390, 'schedule-mobile.png'],
    [320, 'schedule-narrow.png'],
    [1280, 'schedule-desktop.png'],
  ] as const) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    const calendarBounds = await calendar.boundingBox();
    const legendBounds = await page
      .getByRole('region', { name: 'Duty legend', exact: true })
      .boundingBox();
    expect(legendBounds!.y).toBeGreaterThan(
      calendarBounds!.y + calendarBounds!.height,
    );
    const currentDate = calendar.locator('[aria-current="date"]');
    await expect(currentDate).not.toContainText('Today');
    await expect(currentDate).toHaveCSS('outline-style', 'solid');
    await expect(currentDate).toHaveCSS('outline-width', '2px');
    await expect(currentDate).toHaveCSS('outline-color', 'rgb(230, 55, 87)');
    for (const cell of await calendar
      .locator('[data-date]:has(.duty-event)')
      .all()) {
      const day = (await cell.boundingBox())!;
      const band = (await cell.locator('.duty-event').boundingBox())!;
      expect(band.height).toBeLessThan(day.height / 2);
      const date = (await cell.locator('.day-number').boundingBox())!;
      const badge = (await cell.locator('.duty-badge').boundingBox())!;
      expect(date.x + date.width).toBeLessThanOrEqual(badge.x);
    }
    await page.screenshot({ path: testInfo.outputPath(name), fullPage: true });
  }
  const lastLegend = page
    .getByRole('list', { name: 'Duty legend' })
    .getByRole('listitem')
    .last();
  await lastLegend.scrollIntoViewIfNeeded();
  const legendBounds = await lastLegend.boundingBox();
  const navigationBounds = await page
    .getByRole('navigation', { name: 'Main navigation' })
    .boundingBox();
  expect(legendBounds!.y + legendBounds!.height).toBeLessThan(
    navigationBounds!.y,
  );
  expect(
    (await page.request.get('/schedule')).headers()['cache-control'],
  ).toContain('no-store');
  await page
    .getByRole('button', { name: 'Previous month', exact: true })
    .click();
  await expect(page.locator('[data-calendar-month]')).toHaveAttribute(
    'data-calendar-month',
    '2026-04',
  );
  await expect(page.locator('[data-date="2026-04-13"] .duty-badge')).toHaveText(
    '2',
  );
  await page.getByRole('button', { name: 'Next month', exact: true }).click();
  await expect(page.locator('[data-calendar-month]')).toHaveAttribute(
    'data-calendar-month',
    '2026-05',
  );
  await page.getByRole('button', { name: 'Next month', exact: true }).click();
  await expect(page.locator('[data-calendar-month]')).toHaveAttribute(
    'data-calendar-month',
    '2026-06',
  );
  await expect(page.locator('[data-date="2026-06-04"] .duty-event')).toHaveCSS(
    'background-color',
    'rgb(251, 165, 119)',
  );
  await page.locator('[data-date="2026-06-04"]').focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL('/duty/2026-06-04');
  await expect(
    page.getByRole('heading', { name: 'Detail page coming soon', exact: true }),
  ).toBeVisible();
  expect(
    (await page.request.get('/duty/2026-06-04')).headers()['cache-control'],
  ).toContain('no-store');
  await page
    .getByRole('link', { name: 'Back to schedule', exact: true })
    .click();
  await expect(page.locator('[data-calendar-month]')).toHaveAttribute(
    'data-calendar-month',
    '2026-06',
  );
  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'June 2026', exact: true }),
  ).toBeVisible();

  let release: () => void = () => {};
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  let started: () => void = () => {};
  const firstStarted = new Promise<void>((resolve) => {
    started = resolve;
  });
  let settled: () => void = () => {};
  const firstSettled = new Promise<void>((resolve) => {
    settled = resolve;
  });
  const reorder = async (route: import('@playwright/test').Route) => {
    if (new URL(route.request().url()).searchParams.get('month') !== '5')
      return route.continue();
    const real = await route.fetch();
    started();
    await held;
    await route.fulfill({ response: real });
    settled();
  };
  await page.route('**/api/schedules?*', reorder);
  await page
    .getByRole('button', { name: 'Previous month', exact: true })
    .click();
  await firstStarted;
  await page.getByRole('button', { name: 'Next month', exact: true }).click();
  await expect(page.locator('[data-calendar-month]')).toHaveAttribute(
    'data-calendar-month',
    '2026-06',
  );
  release();
  await firstSettled;
  await page.unroute('**/api/schedules?*', reorder);
  await expect(page.locator('[data-calendar-month]')).toHaveAttribute(
    'data-calendar-month',
    '2026-06',
  );

  await page.route('**/api/schedules?*', (route) =>
    route.fulfill({ status: 503, json: { message: 'Temporary failure' } }),
  );
  await page.getByRole('button', { name: 'Next month', exact: true }).click();
  await expect(page.locator('#schedule-error')).toBeVisible();
  await expect(page.locator('[data-calendar-month]')).toHaveCount(0);
  await page.unroute('**/api/schedules?*');
  await page
    .getByRole('button', { name: 'Retry schedule', exact: true })
    .click();
  await expect(
    page.getByText('No duties scheduled for this month.', { exact: true }),
  ).toBeVisible();
  await expect(page.locator('[data-date]')).toHaveCount(31);

  await page.goto('/schedule?month=2024-02');
  await expect(page.locator('[data-date]')).toHaveCount(29);
  await page.goto('/schedule?month=2025-12');
  await page.getByRole('button', { name: 'Next month', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'January 2026', exact: true }),
  ).toBeVisible();
  await expect(page.locator('[data-calendar-month]')).toHaveAttribute(
    'data-calendar-month',
    '2026-01',
  );
  await page
    .getByRole('button', { name: 'Previous month', exact: true })
    .click();
  await expect(page.locator('[data-calendar-month]')).toHaveAttribute(
    'data-calendar-month',
    '2025-12',
  );
  expect((await page.request.get('/duty/2026-02-30')).status()).toBe(404);
  expect((await page.request.get('/schedule?month=2026-13')).status()).toBe(
    400,
  );
  await page
    .getByRole('navigation', { name: 'Main navigation' })
    .getByRole('link', { name: 'Home', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Welcome, John Doe' }),
  ).toBeVisible();
  for (const [name, path] of [
    ['Logbook', '/logbook'],
    ['More', '/more'],
  ] as const) {
    await expect(
      page
        .getByRole('navigation', { name: 'Main navigation' })
        .getByRole('link', { name, exact: true }),
    ).toHaveAttribute('href', path);
  }
});
