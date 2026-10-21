import { expect, type Page } from '@playwright/test';

export async function expectStatusPanelLayout(page: Page, width: number) {
  const copy = page.locator('.status-copy');
  const visual = page.locator('.status-visual');
  await expect(visual).toBeVisible();
  const content = (await copy.boundingBox())!;
  const illustration = (await visual.boundingBox())!;
  if (width <= 640) {
    expect(illustration.y).toBeGreaterThanOrEqual(content.y + content.height);
  } else {
    expect(illustration.x).toBeGreaterThanOrEqual(content.x + content.width);
  }
}
