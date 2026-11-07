import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { STORAGE_KEYS } from '@/lib/storage';
import { useSpeakingProgressStore } from '@/stores/speakingProgressStore';
import { installFakeSpeechRecognition } from '../fakeSpeechRecognition';
import { readStoredProgress, renderApp, seedProfile } from '../helpers';

let uninstall: (() => void) | null = null;

afterEach(() => {
  uninstall?.();
  uninstall = null;
});

const storedSpeaking = () => {
  const raw = localStorage.getItem(STORAGE_KEYS.speaking);
  return raw ? JSON.parse(raw) : null;
};

describe('Pronunciation menu (spec §24)', () => {
  it('lists the scenes with the share of words said well', async () => {
    seedProfile();
    localStorage.setItem(
      STORAGE_KEYS.speaking,
      JSON.stringify({
        bestScoreByWordId: { bed: 92, pillow: 81, blanket: 85, lamp: 80, desk: 79, chair: 40 },
        updatedAt: new Date().toISOString(),
      }),
    );
    useSpeakingProgressStore.getState().reload();
    renderApp('/pronunciation');

    expect(await screen.findByRole('heading', { level: 1, name: 'Pronunciation' })).toBeVisible();
    // 4 of the Bedroom's 24 words reach 80 → 17%.
    const bedroom = screen.getByRole('link', { name: /Bedroom/ });
    expect(bedroom).toHaveAttribute('href', '/pronunciation/scene/bedroom');
    expect(within(bedroom).getByText('17%')).toBeInTheDocument();
    // The Pronunciation entry of the menu is the current one.
    const [menu] = screen.getAllByRole('navigation', { name: 'Main' });
    expect(within(menu).getByRole('link', { name: 'Pronunciation' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('opens the same Word Speaking screen and saves the best score, never as a learned word', async () => {
    const user = userEvent.setup();
    seedProfile();
    uninstall = installFakeSpeechRecognition(
      { guesses: ['bed'], confidence: 0.95 },
      { guesses: ['bad'] },
    );
    renderApp('/pronunciation/scene/bedroom');

    expect(await screen.findByText('Word 1 of 24')).toBeInTheDocument();
    const crumbs = screen.getByRole('navigation', { name: /breadcrumb/i });
    expect(within(crumbs).getByRole('link', { name: 'Pronunciation' })).toHaveAttribute(
      'href',
      '/pronunciation',
    );

    await user.click(screen.getByRole('button', { name: 'Tap and say the word' }));
    expect(await screen.findByRole('heading', { name: 'Excellent!' })).toBeInTheDocument();
    const best = storedSpeaking()?.bestScoreByWordId.bed;
    expect(best).toBeGreaterThanOrEqual(80);

    // A worse try keeps the best score.
    await user.click(screen.getByRole('button', { name: 'Try Again' }));
    expect(await screen.findByRole('heading', { name: 'Almost there!' })).toBeInTheDocument();
    expect(storedSpeaking()?.bestScoreByWordId.bed).toBe(best);

    // Speaking never counts as learning the word.
    expect(readStoredProgress()?.completedWordIdsByScene ?? {}).toEqual({});
  });
});
