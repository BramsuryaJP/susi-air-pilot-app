import { expect, test } from './support/pilot-test';

test('month and year choices support direct jumps, history, reload, and the business date', async ({
  page,
  context,
  pilotState,
}) => {
  await context.addCookies(pilotState.cookies);
  await page.goto('/schedule');
  const month = page.getByRole('combobox', { name: 'Month', exact: true });
  const year = page.getByRole('combobox', { name: 'Year', exact: true });
  await expect(month).toHaveValue('5');
  await expect(year).toHaveValue('2026');
  await expect(month.locator('option')).toHaveCount(12);
  await expect(
    page.getByRole('button', { name: 'This month', exact: true }),
  ).toBeDisabled();
  await year.selectOption('2024');
  await expect(page).toHaveURL('/schedule?month=2024-05');
  await month.selectOption('2');
  await expect(page.locator('[data-date]')).toHaveCount(29);
  await expect(page).toHaveURL('/schedule?month=2024-02');
  await page.reload();
  await expect(month).toHaveValue('2');
  await expect(year).toHaveValue('2024');
  await page.getByRole('button', { name: 'Next month', exact: true }).click();
  await expect(page).toHaveURL('/schedule?month=2024-03');
  await expect(month).toHaveValue('3');
  await page.goBack();
  await expect(page.locator('[data-calendar-month]')).toHaveAttribute(
    'data-calendar-month',
    '2024-02',
  );
  await expect(month).toHaveValue('2');
  await page.getByRole('button', { name: 'This month', exact: true }).click();
  await expect(page).toHaveURL('/schedule?month=2026-05');
  await expect(page.locator('[data-calendar-month]')).toHaveAttribute(
    'data-calendar-month',
    '2026-05',
  );
  await expect(year).toHaveValue('2026');
});

test('quick month and year changes retain both choices while session validation is pending', async ({
  page,
  context,
  pilotState,
}) => {
  await context.addCookies(pilotState.cookies);
  await page.goto('/schedule');
  let release: () => void = () => {};
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  let started: () => void = () => {};
  const pending = new Promise<void>((resolve) => {
    started = resolve;
  });
  await page.route('**/api/auth/session', async (route) => {
    started();
    await held;
    await route.continue();
  });
  try {
    await page
      .getByRole('combobox', { name: 'Month', exact: true })
      .selectOption('2');
    await pending;
    await page
      .getByRole('combobox', { name: 'Year', exact: true })
      .selectOption('2024');
    release();
    await expect(page).toHaveURL('/schedule?month=2024-02');
    await expect(page.locator('[data-calendar-month]')).toHaveAttribute(
      'data-calendar-month',
      '2024-02',
    );
    await expect(page.locator('[data-date]')).toHaveCount(29);
  } finally {
    release();
    await page.unrouteAll({ behavior: 'wait' });
  }
});

test('month picker stays bounded, keyboard accessible, and responsive', async ({
  page,
  context,
  pilotState,
}, testInfo) => {
  await context.addCookies(pilotState.cookies);
  for (const [key, disabled] of [
    ['1000-01', 'Previous month'],
    ['9999-12', 'Next month'],
  ] as const) {
    await page.goto(`/schedule?month=${key}`);
    await expect(
      page.getByRole('combobox', { name: 'Year', exact: true }),
    ).toHaveValue(key.slice(0, 4));
    await expect(
      page.getByRole('button', { name: disabled, exact: true }),
    ).toBeDisabled();
    expect(
      await page
        .getByRole('combobox', { name: 'Year', exact: true })
        .locator('option')
        .count(),
    ).toBeLessThanOrEqual(22);
  }
  await page.goto('/schedule');
  const month = page.getByRole('combobox', { name: 'Month', exact: true });
  await expect(month).toBeEnabled();
  await month.focus();
  // Native typeahead selects June after May without relying on an OS popup.
  await page.keyboard.press('j');
  await expect(page).toHaveURL('/schedule?month=2026-06');
  for (const width of [320, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    for (const name of ['Month', 'Year']) {
      const bounds = await page
        .getByRole('combobox', { name, exact: true })
        .boundingBox();
      expect(bounds!.height).toBeGreaterThanOrEqual(44);
    }
    await page.screenshot({
      path: testInfo.outputPath(`month-picker-${width}.png`),
      fullPage: true,
    });
  }
});

test('SSR renders the selected month and year without client JavaScript', async ({
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
    await page.goto('/schedule?month=2024-02');
    await expect(
      page.getByRole('combobox', { name: 'Month', exact: true }),
    ).toHaveValue('2');
    await expect(
      page.getByRole('combobox', { name: 'Year', exact: true }),
    ).toHaveValue('2024');
    await expect(
      page.getByRole('combobox', { name: 'Month', exact: true }),
    ).toBeDisabled();
    await expect(
      page.getByText('Enable JavaScript to change the calendar month.'),
    ).toBeVisible();
  } finally {
    await context.close();
  }
});

test('calendar controls wait for hydration and retain the first enabled selection', async ({
  page,
  context,
  pilotState,
}) => {
  await context.addCookies(pilotState.cookies);
  let release: () => void = () => {};
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/_nuxt/*.js', async (route) => {
    await held;
    await route.continue();
  });
  try {
    await page.goto('/schedule', { waitUntil: 'commit' });
    const month = page.getByRole('combobox', { name: 'Month', exact: true });
    await expect(month).toHaveValue('5');
    await expect(month).toBeDisabled();
    await expect(
      page.getByRole('combobox', { name: 'Year', exact: true }),
    ).toBeDisabled();
    await expect(
      page.getByRole('button', { name: 'Next month', exact: true }),
    ).toBeDisabled();
    release();
    await expect(month).toBeEnabled();
    await month.selectOption('6');
    await expect(page).toHaveURL('/schedule?month=2026-06');
    await expect(page.locator('[data-calendar-month]')).toHaveAttribute(
      'data-calendar-month',
      '2026-06',
    );
  } finally {
    release();
    await page.unrouteAll({ behavior: 'wait' });
  }
});
