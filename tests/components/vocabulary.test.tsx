import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { QUIZ_CONFIG, QUIZ_PROMPTS } from '@/config/app';
import { readStoredProgress, renderApp, seedProfile, seedProgress } from '../helpers';

describe('Vocabulary Scene List (screen 03)', () => {
  it('groups scenes, shows progress and marks unfinished scenes as coming soon', async () => {
    seedProfile();
    // Spec example: 6 of the 24 Bedroom words learned → 25%.
    seedProgress({
      completedWordIdsByScene: { bedroom: ['bed', 'lamp', 'pillow', 'desk', 'chair', 'turtle'] },
    });
    renderApp('/vocabulary');

    expect(await screen.findByRole('heading', { name: /^Home/, level: 2 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /^Garden/, level: 2 })).toBeInTheDocument();
    const bedroomLink = screen.getByRole('link', { name: /Bedroom/ });
    expect(within(bedroomLink).getByText(/25% completed/)).toBeInTheDocument();
    expect(within(bedroomLink).getByRole('progressbar')).toHaveAttribute('aria-valuenow', '25');
    expect(screen.getAllByText('Coming soon').length).toBeGreaterThanOrEqual(5);
    expect(screen.queryByRole('link', { name: /Kitchen/ })).toBeNull();
  });

  it('opens the first area and expands or collapses areas with their header', async () => {
    const user = userEvent.setup();
    seedProfile();
    renderApp('/vocabulary');

    const home = await screen.findByRole('button', { name: /^Home/ });
    const garden = screen.getByRole('button', { name: /^Garden/ });
    expect(home).toHaveAttribute('aria-expanded', 'true');
    expect(garden).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByText('Flower Garden')).not.toBeVisible();

    await user.click(garden);
    expect(garden).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Flower Garden')).toBeVisible();
    await user.click(home);
    expect(home).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('link', { name: /Bedroom/ })).toBeNull();
  });

  it('does not open a scene that has no content yet', async () => {
    seedProfile();
    renderApp('/vocabulary/kitchen/explore');
    expect(
      await screen.findByRole('heading', { name: 'Kitchen is coming soon' }),
    ).toBeInTheDocument();
  });
});

describe('Flashcards (screen 05)', () => {
  it('moves with Next / Previous and the arrow keys without completing words', async () => {
    const user = userEvent.setup();
    seedProfile();
    renderApp('/vocabulary/bedroom/flashcards');

    expect(await screen.findByText('1 / 24')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'bed', level: 2 })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByText('2 / 24')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Skip' })).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByText('3 / 24')).toBeInTheDocument();
    await user.keyboard('{ArrowLeft}');
    expect(screen.getByText('2 / 24')).toBeInTheDocument();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByText('3 / 24')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Show Meaning' }));
    expect(screen.getByText('cái chăn (mền)')).toBeInTheDocument();

    expect(readStoredProgress().completedWordIdsByScene).toEqual({});
    expect(readStoredProgress().lastFlashcardIndexByScene).toEqual({ bedroom: 2 });
  });

  it('the heart keeps a word as a favorite without learning it', async () => {
    const user = userEvent.setup();
    seedProfile();
    renderApp('/vocabulary/bedroom/flashcards');
    await user.click(await screen.findByRole('button', { name: 'Add to favorites' }));
    expect(screen.getByRole('button', { name: 'Remove from favorites' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(readStoredProgress().favoriteWordIds).toEqual(['bed']);
    expect(readStoredProgress().completedWordIdsByScene).toEqual({});
  });

  it('Finish offers a clear way into Explore', async () => {
    const user = userEvent.setup();
    seedProfile();
    renderApp('/vocabulary/bedroom/flashcards');
    await user.click(await screen.findByRole('button', { name: 'Finish' }));
    expect(screen.getByRole('link', { name: 'Explore the Bedroom' })).toHaveAttribute(
      'href',
      '/vocabulary/bedroom/explore',
    );
  });
});

describe('Explore → Quiz → Result (screens 06–08)', () => {
  it('renders one focusable hotspot per object', async () => {
    seedProfile();
    const { container } = renderApp('/vocabulary/bedroom/explore');
    await screen.findByRole('heading', { name: 'Explore the Bedroom' });
    const hotspots = container.querySelectorAll('[data-hotspot]');
    expect(hotspots).toHaveLength(24);
    for (const hotspot of hotspots) expect(hotspot).toHaveAttribute('tabindex', '0');
    expect(screen.getByText('0 / 24')).toBeInTheDocument();
  });

  it('learner who cannot type gets multiple choice; a correct answer counts exactly once', async () => {
    const user = userEvent.setup();
    seedProfile({ canTypeWords: false });
    const { container } = renderApp('/vocabulary/bedroom/explore');
    await screen.findByRole('heading', { name: 'Explore the Bedroom' });

    // Keyboard: focus the lamp and press Enter.
    const lamp = container.querySelector<SVGPathElement>('[data-hotspot="lamp"]')!;
    lamp.focus();
    await user.keyboard('{Enter}');

    // The prompt is one of the 10 questions, picked at random.
    const promptTexts: string[] = QUIZ_PROMPTS.map((prompt) => prompt.text);
    expect(
      await screen.findByRole('heading', { name: (name) => promptTexts.includes(name) }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).toBeNull();
    const group = screen.getByRole('group', { name: 'Choose the right word' });
    expect(within(group).getAllByRole('button')).toHaveLength(QUIZ_CONFIG.choiceCount);
    expect(screen.queryByRole('button', { name: 'Check Answer' })).toBeNull();

    // Tapping a choice checks it straight away.
    await user.click(within(group).getByRole('button', { name: 'Lamp' }));

    expect(await screen.findByRole('heading', { name: 'Correct!' })).toBeInTheDocument();
    expect(screen.getByText('It’s a lamp.')).toBeInTheDocument();
    expect(screen.getByText('/læmp/')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Show Meaning' }));
    expect(screen.getByText('cái đèn')).toBeInTheDocument();
    expect(screen.getByText('The lamp is on the nightstand.')).toBeInTheDocument();
    expect(readStoredProgress().completedWordIdsByScene.bedroom).toEqual(['lamp']);

    await user.click(screen.getByRole('button', { name: 'Next Object' }));
    expect(await screen.findByText('1 / 24')).toBeInTheDocument();
    expect(
      within(screen.getByRole('region', { name: 'Objects Found' })).getByRole('button', {
        name: /^lamp — found/,
      }),
    ).toBeInTheDocument();

    // Reviewing and practicing a learned object never adds progress again.
    await user.click(container.querySelector('[data-hotspot="lamp"]')!);
    expect(await screen.findByRole('heading', { name: 'Word details' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Practice Again' }));
    await user.click(await screen.findByRole('button', { name: 'Lamp' }));
    expect(await screen.findByText('You already knew this one. Great memory!')).toBeInTheDocument();
    expect(readStoredProgress().completedWordIdsByScene.bedroom).toEqual(['lamp']);
  });

  it('Enter on a correct answer moves on like the Next Object button', async () => {
    const user = userEvent.setup();
    seedProfile({ canTypeWords: false });
    renderApp('/vocabulary/bedroom/quiz/lamp');
    await user.click(await screen.findByRole('button', { name: 'Lamp' }));
    expect(await screen.findByRole('heading', { name: 'Correct!' })).toBeInTheDocument();

    await user.keyboard('{Enter}');
    expect(await screen.findByRole('heading', { name: 'Explore the Bedroom' })).toBeInTheDocument();
  });

  it('a wrong answer is gentle and never completes the word, even after Show Answer', async () => {
    const user = userEvent.setup();
    seedProfile({ canTypeWords: false });
    renderApp('/vocabulary/bedroom/quiz/lamp');

    const group = await screen.findByRole('group', { name: 'Choose the right word' });
    const wrong = within(group)
      .getAllByRole('button')
      .find((button) => !/lamp/i.test(button.textContent ?? ''))!;
    await user.click(wrong);
    expect(screen.getByText('Not quite — have another try!')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Show Answer' }));
    expect(await screen.findByRole('heading', { name: 'Here’s the answer' })).toBeInTheDocument();
    expect(readStoredProgress()).toBeNull();
  });

  it('learner who can type may get a typing question that accepts declared answers', async () => {
    const user = userEvent.setup();
    vi.spyOn(Math, 'random').mockReturnValue(0.1); // < 0.5 → typing
    seedProfile({ canTypeWords: true });
    renderApp('/vocabulary/bedroom/quiz/lamp');

    const input = await screen.findByRole('textbox', { name: 'Type the English word' });
    expect(screen.queryAllByRole('radio')).toHaveLength(0);
    await user.type(input, '  A Lamp {Enter}');
    expect(await screen.findByRole('heading', { name: 'Correct!' })).toBeInTheDocument();
  });

  it('changing "Can you type words?" in Settings applies to the next question', async () => {
    const user = userEvent.setup();
    vi.spyOn(Math, 'random').mockReturnValue(0.1);
    seedProfile({ canTypeWords: false });
    const { router } = renderApp('/settings');

    await user.click(await screen.findByRole('radio', { name: /Yes, I can type words/ }));
    await user.click(screen.getByRole('button', { name: 'Save Changes' }));
    expect(screen.getByText('Your changes are saved.')).toBeInTheDocument();

    await router.navigate('/vocabulary/bedroom/quiz/bed');
    expect(
      await screen.findByRole('textbox', { name: 'Type the English word' }),
    ).toBeInTheDocument();
  });
});
