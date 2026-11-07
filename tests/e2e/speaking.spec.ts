import { expect, test, type Page } from '@playwright/test';

/**
 * Speaking extensions (spec §7.7, §9.5, §9.6) on desktop and phone: Word Speaking after the
 * flashcards, Role-play with a chosen character, Fill in the Blanks for a learner who can type.
 * The tests can't speak into a microphone, so they take the Listen & Repeat path where needed.
 */

async function completeSetup(page: Page, { canType }: { canType: boolean }) {
  await page.goto('/');
  await expect(page).toHaveURL(/\/setup$/);
  await page.getByLabel('Full Name').fill('Lily');
  await page.locator('label', { hasText: /^6–8$/ }).click();
  await page
    .getByText(canType ? 'Yes, I can type words' : 'Not yet, I prefer choosing answers')
    .click();
  await page.locator('label', { hasText: /^Girl$/ }).click();
  await page.getByRole('button', { name: 'Start My Journey' }).click();
  await expect(page).toHaveURL(/\/$/);
}

/** Chromium has a speech recognizer (microphone button); otherwise Listen & Repeat shows directly. */
async function useListenAndRepeat(page: Page) {
  const listenInstead = page.getByRole('button', { name: 'No microphone? Listen & Repeat' });
  if (await listenInstead.isVisible()) await listenInstead.click();
}

test('Word Speaking follows the flashcards', async ({ page }) => {
  await completeSetup(page, { canType: false });
  await page.goto('/vocabulary/bedroom/flashcards');
  await page.getByRole('button', { name: 'Finish' }).first().click();
  await page.getByRole('link', { name: 'Practice Speaking' }).click();

  await expect(page).toHaveURL(/\/vocabulary\/bedroom\/speaking$/);
  await expect(page.getByText('Word 1 of 24')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'bed', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Listen slowly' })).toBeVisible();

  await useListenAndRepeat(page);
  await page.getByRole('button', { name: 'I said it!' }).click();
  await expect(page.getByText('Word 2 of 24')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'pillow', exact: true })).toBeVisible();
});

test('Role-play: choose a character, play it, change character', async ({ page }) => {
  await completeSetup(page, { canType: false });
  await page.goto('/conversation/my-bedroom/transcript');
  await page.getByRole('link', { name: 'Role-play' }).click();
  await expect(page.getByRole('heading', { name: 'Who do you want to be?' })).toBeVisible();
  // Not offered to a learner who can't type.
  await expect(page.getByRole('link', { name: 'Fill in the Blanks' })).toHaveCount(0);

  await page.getByRole('button', { name: /Be Ben/ }).click();
  await expect(page).toHaveURL(/role-play\?as=ben$/);
  await page.getByRole('button', { name: 'Start' }).click();

  // Ben speaks first: it is the learner's turn straight away.
  const turn = page.getByRole('region', { name: 'Your turn' });
  await expect(turn).toBeVisible();
  await useListenAndRepeat(page);
  await turn.getByRole('button', { name: 'I said it!' }).click();
  // Lily answers by herself (or the learner skips her line), then Ben's next line comes.
  await expect(page.getByText('Yes, it is. Come in!')).toBeVisible();
  const skip = page.getByRole('button', { name: 'Skip' });
  if (await skip.isVisible()) await skip.click();
  await expect(turn).toBeVisible();

  await page.getByRole('button', { name: 'Change Character' }).click();
  await expect(page.getByRole('heading', { name: 'Who do you want to be?' })).toBeVisible();
  await page.getByRole('button', { name: /Be Lily/ }).click();
  await expect(page.getByRole('heading', { name: 'You are Lily!' })).toBeVisible();
});

test('Fill in the Blanks for a learner who can type', async ({ page }) => {
  await completeSetup(page, { canType: true });
  await page.goto('/conversation/my-bedroom');
  await page.getByRole('link', { name: 'Fill in the Blanks' }).click();
  await expect(page.getByRole('heading', { name: 'Fill in the Blanks' })).toBeVisible();

  const blanks = page.getByRole('textbox');
  await expect(blanks.first()).toBeVisible();
  await blanks.first().fill('not the word');
  await page.getByRole('button', { name: 'Check Answers' }).click();
  await expect(page.getByText(/right\. Fix the yellow words and check again!/)).toBeVisible();
  await page.getByRole('button', { name: 'Show Answers' }).click();
  await expect(page.getByText(/Here are the answers\./)).toBeVisible();
  await expect(page.getByRole('button', { name: 'New Blanks' })).toBeVisible();
});
