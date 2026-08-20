const { test, expect } = require('@playwright/test');

const onePixelPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64',
);

test('publishes three images and likes the new takeout record', async ({ page }) => {
  const nickname = `测试用户${Date.now()}`;
  await page.goto('/');
  await page.getByLabel('昵称').fill(nickname);
  await page.getByRole('button', { name: '进入分享墙' }).click();
  await expect(page.locator('#identityName')).toHaveText(nickname);
  await page.reload();
  await expect(page.locator('#loginDialog')).not.toBeVisible();
  await expect(page.locator('#identityName')).toHaveText(nickname);
  await page.getByRole('button', { name: '发布今天吃的' }).click();
  await page.locator('#photoInput').setInputFiles([1, 2, 3].map((number) => ({
    name: `takeout-${number}.png`,
    mimeType: 'image/png',
    buffer: onePixelPng,
  })));
  await page.getByLabel('一句话文案').fill('今天的外卖很下饭');
  await page.getByRole('button', { name: '提交分享' }).click();

  const card = page.locator('.meal-card').filter({ hasText: nickname }).first();
  await expect(card).toBeVisible();
  await expect(card.locator('.meal-actions')).toContainText('3 张图片');
  const like = card.getByRole('button', { name: '点赞' });
  await like.click();
  await expect(like).toHaveAttribute('aria-pressed', 'true');
});

test('mobile feed keeps date cards in a flat grid', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith('mobile'), 'Mobile-only layout assertion');
  await page.goto('/');
  const display = await page.locator('.card-track').first().evaluate((element) => getComputedStyle(element).display);
  expect(display).toBe('grid');
});

test('shows every like in a card detail view and ranks liked cards first within a date', async ({ page }) => {
  const nickname = `点赞测试${Date.now()}`;
  await page.goto('/');
  await page.getByLabel('昵称').fill(nickname);
  await page.getByRole('button', { name: '进入分享墙' }).click();

  for (const description of ['排序低赞', '排序高赞']) {
    await page.getByRole('button', { name: '发布今天吃的' }).click();
    await page.locator('#photoInput').setInputFiles({ name: `${description}.png`, mimeType: 'image/png', buffer: onePixelPng });
    await page.getByLabel('一句话文案').fill(description);
    await page.getByRole('button', { name: '提交分享' }).click();
  }

  const likedCard = page.locator('.meal-card').filter({ hasText: '排序高赞' }).first();
  await likedCard.getByRole('button', { name: '点赞' }).click();
  await likedCard.locator('.meal-copy p').click();
  await expect(page.locator('#detailDialog')).toBeVisible();
  await expect(page.locator('#likeDetail .detail-photo')).toHaveCount(1);
  await expect(page.locator('#likeDetail .detail-photo')).toHaveAttribute('src', /\/uploads\//);
  await expect(page.locator('#likeDetail')).toContainText(nickname);
  await page.getByRole('button', { name: '关闭' }).last().click();
  await expect(page.locator('.date-group').first().locator('.meal-card').first()).toContainText('排序高赞');
});
