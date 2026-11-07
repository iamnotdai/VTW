import { expect, test, type Page } from '@playwright/test';

/**
 * Pronunciation menu (spec §24) on desktop and phone: the menu entry, the scene list, the shared
 * Word Speaking screen and the IPA chart. The tests can't speak into a microphone, so they take
 * Listen & Repeat.
 */

async function completeSetup(page: Page) {
  await page.goto('/');
  await expect(page).toHaveURL(/\/setup$/);
  await page.getByLabel('Full Name').fill('Lily');
  await page.locator('label', { hasText: /^6–8$/ }).click();
  await page.getByText('Not yet, I prefer choosing answers').click();
  await page.locator('label', { hasText: /^Girl$/ }).click();
  await page.getByRole('button', { name: 'Start My Journey' }).click();
  await expect(page).toHaveURL(/\/$/);
}

test('Pronunciation: menu → scene → Word Speaking → back to Pronunciation', async ({ page }) => {
  await completeSetup(page);

  // Every menu entry stays inside the screen, on the phone too.
  const menu = page.getByRole('navigation', { name: 'Main' }).locator('visible=true');
  const width = page.viewportSize()?.width ?? 0;
  for (const link of await menu.getByRole('link').all()) {
    const box = await link.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(width);
  }

  await menu.getByRole('link', { name: 'Pronunciation' }).click();
  await expect(page).toHaveURL(/\/pronunciation$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Pronunciation' })).toBeVisible();

  await page.getByRole('link', { name: /Bedroom/ }).click();
  await expect(page).toHaveURL(/\/pronunciation\/scene\/bedroom$/);
  await expect(page.getByText('Word 1 of 24')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'bed', exact: true })).toBeVisible();

  const listenInstead = page.getByRole('button', { name: 'No microphone? Listen & Repeat' });
  if (await listenInstead.isVisible()) await listenInstead.click();
  for (let word = 0; word < 24; word += 1) {
    await page.getByRole('button', { name: 'I said it!' }).click();
  }
  await expect(page.getByRole('heading', { name: 'Speaking practice done!' })).toBeVisible();
  await page.getByRole('link', { name: 'Back to Pronunciation' }).click();
  await expect(page).toHaveURL(/\/pronunciation$/);
});

test('IPA Sounds: chart → sound card → say its words → back to the sound', async ({ page }) => {
  await completeSetup(page);
  await page.goto('/pronunciation');
  await page.getByRole('link', { name: /IPA Sounds/ }).click();
  await expect(page).toHaveURL(/\/pronunciation\/sounds$/);
  // The chart fits the screen: no sideways scrolling, on the phone too.
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);

  await page.getByRole('link', { name: /\/æ\// }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Sound /æ/' })).toBeVisible();
  await expect(
    page.getByRole('region', { name: 'Words with /æ/' }).getByRole('listitem'),
  ).toHaveCount(6);
  await page.getByRole('link', { name: 'Say These Words' }).click();
  await expect(page.getByText('Word 1 of 6')).toBeVisible();

  const listenInstead = page.getByRole('button', { name: 'No microphone? Listen & Repeat' });
  if (await listenInstead.isVisible()) await listenInstead.click();
  for (let word = 0; word < 6; word += 1) {
    await page.getByRole('button', { name: 'I said it!' }).click();
  }
  await page.getByRole('link', { name: 'Back to the Sound /æ/' }).click();
  await expect(page).toHaveURL(/\/pronunciation\/sounds\/ae$/);
});
