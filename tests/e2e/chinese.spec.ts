import { expect, test, type Page } from '@playwright/test';

/**
 * The Chinese course: choosing 中文 at the top of Profile Setup switches the whole app — menu,
 * content with pinyin, quiz and answer sentence — and keeps its own progress.
 */

async function completeSetupInChinese(page: Page) {
  await page.goto('/');
  await expect(page).toHaveURL(/\/setup$/);
  await page.locator('label', { hasText: '中文' }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');
  await page.getByLabel('你的名字').fill('莉莉');
  await page.locator('label', { hasText: /^6–8$/ }).click();
  await page.getByText('还不会，我想选答案').click();
  await page.locator('label', { hasText: /^女孩$/ }).click();
  await page.getByRole('button', { name: '开始我的旅程' }).click();
  await expect(page).toHaveURL(/\/$/);
}

test('Chinese course: setup → bedroom quiz → answer with pinyin → transcript', async ({ page }) => {
  await completeSetupInChinese(page);

  // The menu in Chinese (no Grammar in the Chinese course).
  for (const label of ['旅程', '词汇', '发音', '对话', '设置'])
    await expect(page.getByRole('link', { name: label, exact: true }).first()).toBeVisible();

  await page.getByRole('link', { name: '词汇', exact: true }).first().click();
  await page.getByRole('link', { name: /卧室/ }).click();
  await expect(page.getByRole('progressbar', { name: '卧室的学习进度' })).toHaveAttribute(
    'aria-valuenow',
    '0',
  );

  // Quiz in Chinese ("can't type yet" → multiple choice).
  await page.goto('/vocabulary/bedroom/quiz/lamp');
  await expect(page.locator('#quiz-title')).toHaveText(/\p{Script=Han}/u);
  await page
    .getByRole('group', { name: '选出正确的词语' })
    .getByRole('button', { name: '台灯' })
    .click();
  await expect(page.getByRole('heading', { name: '答对了！' })).toBeVisible();
  await expect(page.getByText('这是一盏台灯。')).toBeVisible();
  await expect(page.getByText('Zhè shì yì zhǎn táidēng.')).toBeVisible();

  // Progress is saved for the Chinese course and survives a reload.
  await page.goto('/vocabulary/bedroom');
  await page.reload();
  await expect(page.getByRole('progressbar', { name: '卧室的学习进度' })).not.toHaveAttribute(
    'aria-valuenow',
    '0',
  );

  // Transcript with pinyin.
  await page.goto('/conversation/my-bedroom/transcript');
  await expect(page.getByText('莉莉，这是你的卧室吗？').first()).toBeVisible();
  await expect(page.getByText('Lì li, zhè shì nǐ de wò shì ma?').first()).toBeVisible();
});
