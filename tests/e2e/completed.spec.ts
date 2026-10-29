import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';

/** "Completed!" popup of Explore: boy/girl picture, Keep exploring, Play again, Conversations. */

const BEDROOM_WORDS: string[] = JSON.parse(
  readFileSync('src/data/scenes/bedroom.json', 'utf8'),
).wordIds;

async function completeSetup(page: Page, avatar: 'Boy' | 'Girl') {
  await page.goto('/');
  await page.getByLabel('Full Name').fill('Lily');
  await page.locator('label', { hasText: /^6–8$/ }).click();
  await page.getByText('Not yet, I prefer choosing answers').click();
  await page.locator('label', { hasText: new RegExp(`^${avatar}$`) }).click();
  await page.getByRole('button', { name: 'Start My Journey' }).click();
  await expect(page).toHaveURL(/\/$/);
}

/** Every bedroom object learned, popup not shown yet. */
async function seedAllFound(page: Page) {
  await page.evaluate((wordIds) => {
    localStorage.setItem(
      'vtw:v1:progress',
      JSON.stringify({
        completedWordIdsByScene: { bedroom: wordIds },
        foundWordIdsByScene: { bedroom: wordIds },
        completedConversationIds: [],
        lastFlashcardIndexByScene: {},
        favoriteWordIds: [],
        celebratedSceneIds: [],
        updatedAt: new Date().toISOString(),
      }),
    );
  }, BEDROOM_WORDS);
  await page.goto('/vocabulary/bedroom/explore');
}

for (const avatar of ['Boy', 'Girl'] as const) {
  test(`Completed popup shows the ${avatar} picture`, async ({ page }) => {
    await completeSetup(page, avatar);
    await seedAllFound(page);
    const dialog = page.getByRole('dialog', { name: 'Completed!' });
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('img')).toHaveAttribute(
      'src',
      new RegExp(`completed-${avatar.toLowerCase()}`),
    );
  });
}

test('Keep exploring closes it for good; Play again resets Objects Found but not progress', async ({
  page,
}) => {
  await completeSetup(page, 'Girl');
  await seedAllFound(page);
  const dialog = page.getByRole('dialog', { name: 'Completed!' });
  await dialog.getByRole('button', { name: 'Keep exploring' }).click();
  await expect(dialog).toBeHidden();

  // Shown once: reloading does not bring it back.
  await page.reload();
  await expect(page.getByText('24 / 24')).toBeVisible();
  await expect(dialog).toBeHidden();

  await page.getByRole('button', { name: 'Play again' }).click();
  await expect(page.getByText('0 / 24')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Play again' })).toBeHidden();

  const stored = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('vtw:v1:progress') ?? '{}'),
  );
  expect(stored.completedWordIdsByScene.bedroom).toHaveLength(BEDROOM_WORDS.length);
  expect(stored.foundWordIdsByScene.bedroom).toHaveLength(0);
});

test('Play again in the popup restarts the round; Go to Conversations leaves', async ({ page }) => {
  await completeSetup(page, 'Boy');
  await seedAllFound(page);
  const dialog = page.getByRole('dialog', { name: 'Completed!' });
  await dialog.getByRole('button', { name: 'Play again' }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByText('0 / 24')).toBeVisible();

  await seedAllFound(page);
  await page
    .getByRole('dialog', { name: 'Completed!' })
    .getByRole('link', {
      name: 'Go to Conversations',
    })
    .click();
  await expect(page).toHaveURL(/\/vocabulary\/bedroom\/conversations$/);
});

test('Objects Found keeps its scroll position after opening an object and coming back', async ({
  page,
}) => {
  await completeSetup(page, 'Boy');
  await seedAllFound(page);
  await page
    .getByRole('dialog', { name: 'Completed!' })
    .getByRole('button', { name: 'Keep exploring' })
    .click();

  const list = page
    .getByRole('list')
    .filter({ has: page.getByRole('button', { name: /Review it/ }) });
  await list.evaluate((el) => (el.scrollLeft = el.scrollWidth));
  const before = await list.evaluate((el) => el.scrollLeft);
  expect(before).toBeGreaterThan(0);

  await list.getByRole('button').last().click();
  await expect(page).toHaveURL(/\/result\//);
  await page.goBack();
  await expect(page).toHaveURL(/\/explore$/);
  expect(await list.evaluate((el) => el.scrollLeft)).toBeGreaterThan(before - 5);
});
