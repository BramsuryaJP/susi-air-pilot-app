import { test, expect } from './support/pilot-test';

test('documents show API urgency, reuse SSR data, and recover from errors without breaking Home', async ({
  page,
  context,
  pilotState,
}, testInfo) => {
  expect((await page.request.get('/api/documents')).status()).toBe(401);
  await context.addCookies(pilotState.cookies);
  let hydrationReads = 0;
  page.on('request', (request) => {
    if (new URL(request.url()).pathname === '/api/documents') hydrationReads++;
  });
  await page.goto('/');
  const section = page.getByRole('region', {
    name: 'My documents',
    exact: true,
  });
  await expect(section).toBeVisible();
  const response = await page.request.get('/api/documents');
  expect(response.status()).toBe(200);
  expect(response.headers()['cache-control']).toContain('no-store');
  const data = await response.json();
  expect(data.today).toBe('2026-05-15');
  expect(hydrationReads).toBe(0);
  await expect(section.getByRole('listitem')).toHaveCount(
    data.documents.length,
  );
  for (const document of data.documents) {
    const row = section.locator(`[data-document-id="${document.id}"]`);
    await expect(row).toContainText(document.label);
    await expect(row.locator('time')).toHaveAttribute(
      'datetime',
      document.expiryDate,
    );
    await expect(row.locator('[data-testid="expiry-badge"]')).toHaveAttribute(
      'data-status',
      document.status,
    );
  }
  await expect(section.locator('[data-status="safe"]')).toHaveCount(2);
  await expect(section.locator('[data-status="soon"]')).toHaveCount(2);
  await expect(section.locator('[data-status="expired"]')).toHaveCount(1);
  await expect(section.getByText('Expired', { exact: true })).toBeVisible();
  await expect(section.getByText('Due soon', { exact: true })).toHaveCount(2);
  await page.setViewportSize({ width: 390, height: 844 });
  await section.screenshot({
    path: testInfo.outputPath('documents-mobile.png'),
  });
  await page.setViewportSize({ width: 320, height: 740 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await section.screenshot({
    path: testInfo.outputPath('documents-narrow.png'),
  });
  await page.setViewportSize({ width: 1280, height: 900 });
  await section.screenshot({
    path: testInfo.outputPath('documents-desktop.png'),
  });

  await page.route('**/api/documents', (route) =>
    route.fulfill({ status: 503, json: { message: 'Temporary failure' } }),
  );
  await section
    .getByRole('button', { name: 'Refresh documents', exact: true })
    .click();
  await expect(section.locator('#documents-error')).toBeVisible();
  await expect(section.getByRole('listitem')).toHaveCount(0);
  await expect(
    page.getByRole('heading', { name: 'Hours to limit', exact: true }),
  ).toBeVisible();
  await page.unroute('**/api/documents');
  await section
    .getByRole('button', { name: 'Retry documents', exact: true })
    .click();
  await expect(section.getByRole('listitem')).toHaveCount(5);

  await page.route('**/api/documents', async (route) => {
    const real = await route.fetch();
    const body = await real.json();
    await route.fulfill({ response: real, json: { ...body, documents: [] } });
  });
  await section
    .getByRole('button', { name: 'Refresh documents', exact: true })
    .click();
  await expect(
    section.getByText('No documents are available.', { exact: true }),
  ).toBeVisible();
  await page.unroute('**/api/documents');
  await section
    .getByRole('button', { name: 'Refresh documents', exact: true })
    .click();
  await expect(section.getByRole('listitem')).toHaveCount(5);
});
