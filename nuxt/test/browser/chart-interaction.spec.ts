import { expect, test } from './support/pilot-test';
import type { FlightSummary } from '../../shared/types/flight-hours';

const dateLabel = (date: string) =>
  new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${date}T00:00:00Z`));

test('hover inspection preserves exact API values and stays within the plot at every range and width', async ({
  page,
  context,
  pilotState,
}, testInfo) => {
  await context.addCookies(pilotState.cookies);
  const summaries = new Map<string, FlightSummary>();
  for (const range of ['1w', '1m', '3m', '6m', '1y']) {
    const response = await page.request.get(
      `/api/flight-hours/summary?range=${range}`,
    );
    expect(response.status()).toBe(200);
    summaries.set(range, await response.json());
  }
  await page.goto('/');
  const plot = page.getByRole('group', {
    name: 'Explore flight-hour values',
    exact: true,
  });
  const chart = page.getByTestId('flight-chart');
  const tooltip = page.getByRole('tooltip');
  let summaryRequests = 0;
  page.on('request', (request) => {
    if (request.url().includes('/api/flight-hours/summary')) summaryRequests++;
  });
  for (const width of [320, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: 1400 });
    for (const range of ['1w', '1m', '3m', '6m', '1y']) {
      await page.getByRole('button', { name: range, exact: true }).click();
      await expect(chart).toHaveAttribute('data-range', range);
      await expect(tooltip).toHaveCount(0);
      await plot.scrollIntoViewIfNeeded();
      const bounds = (await plot.boundingBox())!;
      const requestsBeforeHover = summaryRequests;
      for (const index of [0, 7, 14]) {
        const point = summaries.get(range)!.series[index]!;
        await page.mouse.move(bounds.x - 5, bounds.y - 5);
        await page.mouse.move(
          bounds.x + bounds.width * (0.02 + (index / 14) * 0.96),
          bounds.y + bounds.height - 2,
        );
        await expect(tooltip).toBeVisible();
        await expect(
          tooltip.getByText(dateLabel(point.date), { exact: true }),
        ).toBeVisible();
        await expect(
          tooltip.getByText(`${point.hours.toFixed(1)} h`, { exact: true }),
        ).toBeVisible();
        await expect(tooltip).toContainText(
          point.isProjection ? 'Planned' : 'Recorded',
        );
        const tip = (await tooltip.boundingBox())!;
        expect(tip.x).toBeGreaterThanOrEqual(bounds.x);
        expect(tip.x + tip.width).toBeLessThanOrEqual(
          bounds.x + bounds.width + 1,
        );
        expect(tip.y).toBeGreaterThanOrEqual(bounds.y);
        expect(tip.y + tip.height).toBeLessThanOrEqual(
          bounds.y + bounds.height + 1,
        );
        await tooltip.hover();
        await expect(tooltip).toContainText(dateLabel(point.date));
        if (range === '1w' && index === 7)
          await plot.screenshot({
            path: testInfo.outputPath(`chart-hover-${width}.png`),
          });
        await page.keyboard.press('Escape');
        await expect(tooltip).toHaveCount(0);
      }
      expect(summaryRequests).toBe(requestsBeforeHover);
      await page.mouse.move(
        bounds.x + bounds.width / 2,
        bounds.y + bounds.height - 2,
      );
      await expect(tooltip).toBeVisible();
      await page.mouse.move(bounds.x - 5, bounds.y - 5);
      await expect(tooltip).toHaveCount(0);
    }
  }
});

test('chart inspection supports keyboard, touch, range resets and exact above-scale values', async ({
  page,
  context,
  browser,
  baseURL,
  pilotState,
}) => {
  await context.addCookies(pilotState.cookies);
  const response = await page.request.get('/api/flight-hours/summary?range=1m');
  const summary: FlightSummary = await response.json();
  summary.series[14]!.hours = summary.yMax + 12.3;
  await page.goto('/');
  const plot = page.getByRole('group', {
    name: 'Explore flight-hour values',
    exact: true,
  });
  const tooltip = page.getByRole('tooltip');
  await page.keyboard.press('Tab');
  await plot.focus();
  await expect(tooltip).toContainText('Today');
  await page.keyboard.press('ArrowRight');
  await expect(tooltip).toContainText('Planned');
  await page.keyboard.press('Home');
  await expect(tooltip).toContainText('8 May 2026');
  await page.keyboard.press('End');
  await expect(tooltip).toContainText('22 May 2026');
  await page.keyboard.press('ArrowRight');
  await expect(tooltip).toContainText('22 May 2026');
  await page.keyboard.press('Escape');
  await expect(tooltip).toHaveCount(0);
  await page.keyboard.press('ArrowLeft');
  await expect(tooltip).toContainText('21 May 2026');
  await expect(page.locator('.chart-announcement')).toContainText(
    '21 May 2026',
  );
  await page.keyboard.press('Tab');
  await expect(tooltip).toHaveCount(0);
  await page.route('**/api/flight-hours/summary?range=1m', (route) =>
    route.fulfill({ json: summary }),
  );
  await page.getByRole('button', { name: '1m', exact: true }).click();
  await expect(page.getByTestId('flight-chart')).toHaveAttribute(
    'data-range',
    '1m',
  );
  await expect(tooltip).toHaveCount(0);
  await plot.focus();
  await expect(tooltip).toContainText(dateLabel(summary.series[7]!.date));
  await page.keyboard.press('End');
  await expect(tooltip).toContainText(
    `${summary.series[14]!.hours.toFixed(1)} h`,
  );
  await expect(tooltip).toContainText('Above chart scale');
  await page.getByRole('button', { name: '1w', exact: true }).click();
  await expect(page.getByTestId('flight-chart')).toHaveAttribute(
    'data-range',
    '1w',
  );
  await expect(tooltip).toHaveCount(0);

  const touch = await browser.newContext({
    baseURL,
    hasTouch: true,
    isMobile: true,
    viewport: { width: 390, height: 844 },
    storageState: pilotState,
  });
  try {
    const mobile = await touch.newPage();
    await mobile.goto('/');
    const touchPlot = mobile.getByRole('group', {
      name: 'Explore flight-hour values',
      exact: true,
    });
    await touchPlot.scrollIntoViewIfNeeded();
    const bounds = (await touchPlot.boundingBox())!;
    await mobile.touchscreen.tap(
      bounds.x + bounds.width * 0.98,
      bounds.y + bounds.height / 2,
    );
    await expect(mobile.getByRole('tooltip')).toContainText('22 May 2026');
    await mobile
      .getByRole('heading', { name: 'Flight hours trend', exact: true })
      .tap();
    await expect(mobile.getByRole('tooltip')).toHaveCount(0);
  } finally {
    await touch.close();
  }
});
