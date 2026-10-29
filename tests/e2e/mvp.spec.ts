import { expect, test, type Locator, type Page } from '@playwright/test';

/**
 * The MVP journey of spec §22, on desktop (mouse) and phone (touch):
 * setup → Home (picture only) → Vocabulary → Bedroom → Flashcards → Explore → highlight the lamp
 * → quiz that matches the setting → result "lamp" → Objects Found +1 → reload keeps progress →
 * My Bedroom video → transcript → speaking practice, all without a backend.
 */

/**
 * A point inside a hotspot, relative to its box. The default (box centre) can fall between the
 * sub-paths of a multi-part object — the lamp is two lamps, and its centre lies on the pillow.
 */
async function pointOn(hotspot: Locator, x: number, y: number) {
  return hotspot.evaluate(
    (element, [px, py]) => {
      const path = element as SVGGraphicsElement;
      const point = path.ownerSVGElement!.createSVGPoint();
      point.x = px;
      point.y = py;
      const screen = point.matrixTransform(path.getScreenCTM()!);
      const box = path.getBoundingClientRect();
      return { x: screen.x - box.left, y: screen.y - box.top };
    },
    [x, y],
  );
}

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

test('MVP journey: setup → explore → quiz → progress → conversation', async ({
  page,
  isMobile,
}) => {
  await completeSetup(page);

  // Home: only the picture in the content area.
  const main = page.getByRole('main');
  await expect(main.getByRole('img')).toBeVisible();
  await expect(main.getByRole('link')).toHaveCount(0);
  await expect(main.getByRole('button')).toHaveCount(0);

  // Vocabulary → Bedroom → Flashcards.
  await page.getByRole('link', { name: 'Vocabulary' }).click();
  await page.getByRole('link', { name: /Bedroom/ }).click();
  await expect(page.getByRole('progressbar', { name: 'Bedroom progress' })).toHaveAttribute(
    'aria-valuenow',
    '0',
  );
  await page.getByRole('link', { name: 'Start Learning' }).click();
  await expect(page.getByText('1 / 24')).toBeVisible();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(page.getByText('2 / 24')).toBeVisible();
  await page.getByRole('button', { name: 'Finish' }).click();
  await page.getByRole('link', { name: 'Explore the Bedroom' }).click();
  const objectsFound = page.getByRole('region', { name: 'Objects Found' });
  await expect(objectsFound.getByText('0 / 24')).toBeVisible();

  // Explore: highlight the lamp, then open its question.
  const lamp = page.locator('[data-hotspot="lamp"]');
  // The shade of the lamp on the left nightstand (viewBox units).
  const lampShade = await pointOn(lamp, 205, 380);
  if (isMobile) {
    await lamp.tap({ position: lampShade });
    await expect(page.getByText('What is this?')).toBeVisible();
    await page.getByRole('button', { name: 'Learn', exact: true }).tap();
  } else {
    await lamp.hover({ position: lampShade });
    await expect(page.locator('.vtw-outline')).toHaveCount(1);
    // The glowing outline is the lamp's own contour (sprites are optional; Bedroom has none).
    await expect(page.locator('.vtw-outline')).toHaveAttribute(
      'd',
      (await lamp.getAttribute('d'))!,
    );
    await lamp.click({ position: lampShade });
  }

  // "Not yet" → multiple choice only.
  await expect(page.getByRole('heading', { name: 'What is this?' })).toBeVisible();
  await expect(page.getByRole('textbox')).toHaveCount(0);
  await page
    .getByRole('group', { name: 'Choose the right word' })
    .getByRole('button', { name: 'Lamp' })
    .click();
  await expect(page.getByRole('heading', { name: 'Correct!' })).toBeVisible();
  await expect(page.getByText('/læmp/')).toBeVisible();
  await page.getByRole('button', { name: 'Next Object' }).click();

  await expect(objectsFound.getByText('1 / 24')).toBeVisible();
  await expect(objectsFound.getByRole('button', { name: /^lamp — found/ })).toBeVisible();

  // Progress survives a reload (localStorage, no server).
  await page.reload();
  await expect(objectsFound.getByText('1 / 24')).toBeVisible();

  // Conversation: video → transcript → speaking practice (Listen & Repeat works everywhere).
  await page.getByRole('link', { name: 'Conversation', exact: true }).click();
  await page.getByRole('link', { name: /My Bedroom/ }).click();
  await page.getByRole('link', { name: 'Watch the video' }).click();
  await page.getByRole('link', { name: 'View Conversation' }).click();
  await expect(page.getByText('Lily, is this your bedroom?')).toBeVisible();
  await page.getByRole('link', { name: 'Practice Speaking' }).click();

  for (let question = 0; question < 2; question += 1) {
    await expect(page.getByRole('heading', { name: 'Speaking Practice' })).toBeVisible();
    // Chromium has SpeechRecognition (mic button); other browsers show Listen & Repeat directly.
    const markPracticed = page.getByRole('button', { name: 'Mark as Practiced' });
    if (!(await markPracticed.isVisible())) {
      await page.getByRole('button', { name: /Listen & Repeat instead/ }).click();
    }
    await markPracticed.click();
    await expect(page.getByRole('heading', { name: 'Well done for practicing!' })).toBeVisible();
    if (question === 0) await page.getByRole('button', { name: 'Next Question' }).click();
  }
  await page.getByRole('button', { name: 'Finish Lesson' }).click();
  await expect(page.getByText(/Lesson complete!/)).toBeVisible();
});

test('deep links work on the static build', async ({ page }) => {
  await completeSetup(page);
  await page.goto('/vocabulary/bedroom/explore');
  await expect(page.getByRole('heading', { name: 'Explore the Bedroom' })).toBeVisible();
  await page.goto('/conversation/my-bedroom/transcript');
  await expect(page.getByText('Lily, is this your bedroom?')).toBeVisible();
});

test('zooming keeps hotspots on the picture', async ({ page }) => {
  await completeSetup(page);
  await page.goto('/vocabulary/bedroom/explore');
  const lamp = page.locator('[data-hotspot="lamp"]');
  const before = await lamp.boundingBox();
  await page.getByRole('button', { name: 'Zoom in' }).click();
  await page.getByRole('button', { name: 'Zoom in' }).click();
  const after = await lamp.boundingBox();
  expect(after!.width).toBeGreaterThan(before!.width * 1.9);
  // The background and the hotspot layer share one transform.
  const layer = page.getByTestId('scene-viewport').locator('div').first();
  await expect(layer).toHaveAttribute('style', /scale\(2\)/);
});

test('the app keeps working when the browser blocks storage', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      get() {
        throw new DOMException('Blocked', 'SecurityError');
      },
    });
  });
  await completeSetup(page);
  await page.getByRole('link', { name: 'Settings' }).click();
  await expect(page.getByText(/blocking storage/)).toBeVisible();
});
