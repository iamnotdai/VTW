import { expect, test, type Page } from '@playwright/test';

/** Grammar (spec §25) on desktop and phone: menu → tense chart → lesson → practice → progress. */

async function completeSetup(page: Page) {
  await page.goto('/');
  await expect(page).toHaveURL(/\/setup$/);
  await page.getByLabel('Full Name').fill('Lily');
  await page.locator('label', { hasText: /^9–12$/ }).click();
  await page.getByText('Not yet, I prefer choosing answers').click();
  await page.locator('label', { hasText: /^Boy$/ }).click();
  await page.getByRole('button', { name: 'Start My Journey' }).click();
  await expect(page).toHaveURL(/\/$/);
}

test('Grammar: chart → Present Simple → practice a question → progress shows', async ({ page }) => {
  await completeSetup(page);
  const menu = page.getByRole('navigation', { name: 'Main' }).locator('visible=true');
  await menu.getByRole('link', { name: 'Grammar' }).click();
  await expect(page).toHaveURL(/\/grammar$/);
  await expect(page.getByText('Coming soon')).toHaveCount(8);

  await page.getByRole('link', { name: /Present Simple/ }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Present Simple' })).toBeVisible();
  await page.getByRole('link', { name: 'Start Practice' }).click();
  await expect(page.getByText('Question 1 of 10')).toBeVisible();

  // Question 1: "She ___ her teeth every morning."
  await page
    .getByRole('group', { name: 'Choices' })
    .getByRole('button', { name: 'brushes' })
    .click();
  await expect(page.getByRole('status')).toContainText('She brushes her teeth every morning.');
  await page.getByRole('button', { name: 'Next Question' }).click();
  await expect(page.getByText('Question 2 of 10')).toBeVisible();

  await page.getByRole('link', { name: 'Present Simple' }).click();
  await expect(page.getByText('10%')).toBeVisible();
});
