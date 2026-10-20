import { expect, test } from '@playwright/test';

test('flight-hour dashboard uses real summaries, keeps the latest range, and supports retry', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of [
    '/api/flight-hours?from=2026-05-15&to=2026-05-16',
    '/api/flight-hours/summary?range=1w',
  ]) {
    const unauthenticated = await page.request.get(path);
    expect(unauthenticated.status()).toBe(401);
    expect(unauthenticated.headers()['cache-control']).toContain('no-store');
  }
  const login = await page.request.post('/api/auth/login', {
    headers: { Origin: 'http://127.0.0.1:4311' },
    data: { username: 'johndoe', password: 'susiairtest' },
  });
  expect(login.status()).toBe(200);
  let hydrationReads = 0;
  page.on('request', (request) => {
    if (new URL(request.url()).pathname === '/api/flight-hours/summary')
      hydrationReads++;
  });
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'Hours to limit', exact: true }),
  ).toBeVisible();
  await expect(page.locator('[data-testid="limit-card"]')).toHaveCount(4);
  await expect(page.locator('[data-testid="flight-chart"] circle')).toHaveCount(
    15,
  );
  expect(hydrationReads).toBe(0);
  const initial = await (
    await page.request.get('/api/flight-hours/summary?range=1w')
  ).json();
  for (const card of initial.cards) {
    await expect(
      page.locator(`[data-card="${card.key}"] [data-testid="card-hours"]`),
    ).toHaveText(card.hours.toFixed(1));
  }
  for (const range of ['1m', '3m', '6m', '1y', '1w']) {
    await page.getByRole('button', { name: range, exact: true }).click();
    const expected = await (
      await page.request.get(`/api/flight-hours/summary?range=${range}`)
    ).json();
    await expect(page.locator('[data-testid="flight-chart"]')).toHaveAttribute(
      'data-range',
      range,
    );
    await expect(page.locator('[data-testid="flight-chart"]')).toHaveAttribute(
      'data-y-max',
      String(expected.yMax),
    );
  }
  await expect(
    page.getByText('Future values include supplied planned hours.'),
  ).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath('flight-hours-mobile.png'),
    fullPage: true,
  });

  let staleHandled: () => void = () => {};
  const staleDone = new Promise<void>((resolve) => {
    staleHandled = resolve;
  });
  let release: () => void = () => {};
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  let firstStarted: () => void = () => {};
  const started = new Promise<void>((resolve) => {
    firstStarted = resolve;
  });
  const reorder = async (route: import('@playwright/test').Route) => {
    if (new URL(route.request().url()).searchParams.get('range') !== '1m')
      return route.continue();
    const real = await route.fetch();
    firstStarted();
    await held;
    await route.fulfill({ response: real });
    staleHandled();
  };
  await page.route('**/api/flight-hours/summary?*', reorder);
  await page.getByRole('button', { name: '1m', exact: true }).click();
  await started;
  await page.getByRole('button', { name: '1y', exact: true }).click();
  await expect(page.locator('[data-testid="flight-chart"]')).toHaveAttribute(
    'data-range',
    '1y',
  );
  release();
  await staleDone;
  await page.unroute('**/api/flight-hours/summary?*', reorder);
  await expect(
    page.getByRole('button', { name: '1y', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[data-testid="flight-chart"]')).toHaveAttribute(
    'data-range',
    '1y',
  );

  await page.route('**/api/flight-hours/summary?*', (route) =>
    route.fulfill({ status: 503, json: { message: 'Temporary failure' } }),
  );
  await page.getByRole('button', { name: '3m', exact: true }).click();
  await expect(page.locator('#flight-hours-error')).toBeVisible();
  await expect(page.locator('[data-testid="flight-chart"]')).toHaveCount(0);
  await page.unroute('**/api/flight-hours/summary?*');
  await page.getByRole('button', { name: 'Try again', exact: true }).click();
  await expect(page.locator('[data-testid="flight-chart"]')).toHaveAttribute(
    'data-range',
    '3m',
  );
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.screenshot({
    path: testInfo.outputPath('flight-hours-desktop.png'),
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByText('View daily values', { exact: true }).click();
  await expect(
    page
      .getByRole('table', { name: 'Rolling flight-hour values' })
      .getByRole('row'),
  ).toHaveCount(16);

  await page.setViewportSize({ width: 320, height: 740 });
  const overflow = await page.evaluate(() =>
    [...document.querySelectorAll('main *')]
      .map((element) => ({
        tag: element.tagName,
        class: element.getAttribute('class'),
        right: element.getBoundingClientRect().right,
        width: element.getBoundingClientRect().width,
      }))
      .filter((entry) => entry.right > innerWidth),
  );
  expect(overflow, JSON.stringify(overflow)).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: testInfo.outputPath('flight-hours-narrow.png'),
    fullPage: true,
  });
  const daily = await page.request.get(
    '/api/flight-hours?from=2026-05-15&to=2026-05-16',
  );
  expect(daily.status()).toBe(200);
  expect((await daily.json()).days).toHaveLength(2);
  expect(daily.headers()['cache-control']).toContain('no-store');
  for (const query of [
    'from=2026-02-29&to=2026-03-01',
    'from=2026-05-16&to=2026-05-15',
    'from=2024-01-01&to=2026-05-15',
    'from=2026-05-15&to=2026-05-15&extra=x',
  ]) {
    expect(
      (await page.request.get(`/api/flight-hours?${query}`)).status(),
    ).toBe(400);
  }
  for (const query of [
    'range=invalid',
    'range=1w&range=1m',
    'range=1w&extra=x',
  ]) {
    expect(
      (await page.request.get(`/api/flight-hours/summary?${query}`)).status(),
    ).toBe(400);
  }
});
