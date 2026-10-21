import { expect, test } from './support/pilot-test';

test('SSR route variants keep private headers for pilot pages, redirects, and invalid input', async ({
  page,
  context,
  pilotState,
}) => {
  await context.addCookies(pilotState.cookies);
  for (const [path, status] of [
    ['/', 200],
    ['/schedule', 200],
    ['/schedule/', 200],
    ['/Schedule', 200],
    ['/SCHEDULE/?month=2026-06', 200],
    ['/duty/2026-05-15', 200],
    ['/duty/2026-05-15/', 200],
    ['/Duty/2026-05-15', 200],
    ['/DUTY/2026-05-15/', 200],
    ['/LOGBOOK/', 200],
    ['/MORE/', 200],
    ['/Schedule?month=invalid', 400],
    ['/Duty/2026-02-30', 404],
    ['/missing-route-privacy', 404],
  ] as const) {
    const response = await page.request.get(path, { maxRedirects: 0 });
    expect.soft(response.status(), path).toBe(status);
    expect
      .soft(response.headers()['cache-control'] ?? '', path)
      .toContain('no-store');
    expect
      .soft(response.headers()['cache-control'] ?? '', path)
      .toContain('private');
    expect.soft(response.headers().vary ?? '', path).toMatch(/Cookie/i);
  }
  for (const invalid of [false, true]) {
    await context.clearCookies();
    for (const path of ['/Schedule/', '/Duty/2026-05-15/']) {
      if (invalid)
        await context.addCookies(
          pilotState.cookies.map((cookie) => ({
            ...cookie,
            value: 'invalid-session',
          })),
        );
      const response = await page.request.get(path, { maxRedirects: 0 });
      expect(response.status()).toBe(302);
      expect(response.headers().location).toBe('/login');
      expect
        .soft(response.headers()['cache-control'] ?? '', path)
        .toContain('private');
      expect
        .soft(response.headers()['cache-control'] ?? '', path)
        .toContain('no-store');
      expect.soft(response.headers().vary ?? '', path).toMatch(/Cookie/i);
    }
  }
  const asset = await page.request.get(
    '/fonts/plus-jakarta-sans-latin-variable.woff2',
  );
  expect(asset.status()).toBe(200);
  expect(asset.headers()['cache-control'] ?? '').not.toContain('private');
  expect(asset.headers()['cache-control'] ?? '').not.toContain('no-store');
});

test('login variants hide workspace navigation before hydration and retain guest-only redirects', async ({
  page,
  context,
  pilotState,
}) => {
  await page.route('**/_nuxt/*.js', (route) => route.abort());
  for (const path of ['/login', '/login/', '/Login', '/LOGIN/']) {
    const response = await page.goto(path);
    expect(response!.status()).toBe(200);
    expect(response!.headers()['cache-control']).toContain('private');
    expect(response!.headers()['cache-control']).toContain('no-store');
    await expect(
      page.getByRole('heading', { name: 'Welcome back', exact: true }),
    ).toBeVisible();
    expect
      .soft(
        await page.getByRole('navigation', { name: 'Main navigation' }).count(),
        path,
      )
      .toBe(0);
  }
  await page.unrouteAll();
  await context.addCookies(pilotState.cookies);
  for (const path of ['/login', '/login/', '/Login', '/LOGIN/']) {
    const response = await page.request.get(path, { maxRedirects: 0 });
    expect(response.status()).toBe(302);
    expect(response.headers().location).toBe('/');
    expect(response.headers()['cache-control']).toContain('private');
    expect(response.headers()['cache-control']).toContain('no-store');
    expect(response.headers().vary).toMatch(/Cookie/i);
  }
});

test('schedule variants synchronize calendar and active navigation through Back and Forward', async ({
  page,
  context,
  pilotState,
}) => {
  await context.addCookies(pilotState.cookies);
  const calendar = page.locator('[data-calendar-month]');
  const scheduleTab = page
    .getByRole('navigation', { name: 'Main navigation' })
    .getByRole('link', { name: 'Schedule', exact: true });
  for (const path of ['/schedule/', '/Schedule/']) {
    await page.goto(`${path}?month=2026-05`);
    await expect(calendar).toHaveAttribute('data-calendar-month', '2026-05');
    await expect.soft(scheduleTab).toHaveAttribute('aria-current', 'page');
    await page.getByRole('button', { name: 'Next month', exact: true }).click();
    await expect(page).toHaveURL('/schedule?month=2026-06');
    await expect(calendar).toHaveAttribute('data-calendar-month', '2026-06');
    await page.goBack();
    await expect(page).toHaveURL(`${path}?month=2026-05`);
    await expect(calendar).toHaveAttribute('data-calendar-month', '2026-05');
    await expect(
      page.getByRole('combobox', { name: 'Month', exact: true }),
    ).toHaveValue('5');
    await page.goForward();
    await expect(page).toHaveURL('/schedule?month=2026-06');
    await expect(calendar).toHaveAttribute('data-calendar-month', '2026-06');
  }
  await page.goto('/Duty/2026-05-15/');
  await expect(
    page.getByRole('heading', { name: 'Detail page coming soon', exact: true }),
  ).toBeVisible();
  await expect(scheduleTab).toHaveAttribute('aria-current', 'page');
  await scheduleTab.click();
  await expect(page).toHaveURL('/schedule?month=2026-05');
  await expect(calendar).toHaveAttribute('data-calendar-month', '2026-05');
});
