const { test, expect } = require('@playwright/test');

const onePixelPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64',
);

test('publishes three images and likes the new takeout record', async ({ page }) => {
  const nickname = `测试用户${Date.now()}`;
  await page.goto('/');
  await page.getByRole('button', { name: '发布今天吃的' }).click();
  await page.locator('#image-input').setInputFiles([1, 2, 3].map((number) => ({
    name: `takeout-${number}.png`,
    mimeType: 'image/png',
    buffer: onePixelPng,
  })));
  await page.getByLabel('怎么称呼你').fill(nickname);
  await page.getByLabel('说说这一餐').fill('今天的外卖很下饭');
  await page.getByRole('button', { name: '发布', exact: true }).click();

  const card = page.locator('.post-card').filter({ hasText: nickname }).first();
  await expect(card).toBeVisible();
  await expect(card.locator('.image-count')).toHaveText('3 张');
  const like = card.getByRole('button', { name: '点赞' });
  await like.click();
  await expect(like).toHaveAttribute('aria-pressed', 'true');
});

test('mobile feed uses horizontal date tracks', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith('mobile'), 'Mobile-only layout assertion');
  await page.goto('/');
  const overflow = await page.locator('.day-track').first().evaluate((element) => getComputedStyle(element).overflowX);
  expect(overflow).toBe('auto');
});
