import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { getIpaSound } from '@/data/content';
import { getSoundExampleWords } from '@/features/pronunciation/ipaText';
import { STORAGE_KEYS } from '@/lib/storage';
import { useSpeakingProgressStore } from '@/stores/speakingProgressStore';
import { installFakeSpeechRecognition } from '../fakeSpeechRecognition';
import { readStoredProgress, renderApp, seedProfile, seedSettings } from '../helpers';

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

describe('IPA Sounds (spec §24.2)', () => {
  it('the Pronunciation menu opens the chart; every sound links to its card', async () => {
    const user = userEvent.setup();
    seedProfile();
    renderApp('/pronunciation');
    await user.click(await screen.findByRole('link', { name: /IPA Sounds/ }));

    expect(await screen.findByRole('heading', { level: 1, name: 'IPA Sounds' })).toBeVisible();
    const vowels = screen.getByRole('region', { name: 'Vowels' });
    const diphthongs = screen.getByRole('region', { name: 'Diphthongs' });
    const consonants = screen.getByRole('region', { name: 'Consonants' });
    expect(within(vowels).getAllByRole('link')).toHaveLength(12);
    expect(within(diphthongs).getAllByRole('link')).toHaveLength(5);
    expect(within(consonants).getAllByRole('link')).toHaveLength(24);
    expect(within(vowels).getByRole('link', { name: /\/æ\// })).toHaveAttribute(
      'href',
      '/pronunciation/sounds/ae',
    );
  });

  it('a sound is checked once one of its words was said well', async () => {
    seedProfile();
    const [first] = getSoundExampleWords(getIpaSound('sh')!);
    localStorage.setItem(
      STORAGE_KEYS.speaking,
      JSON.stringify({
        bestScoreByWordId: { [first.id]: 90 },
        updatedAt: new Date().toISOString(),
      }),
    );
    useSpeakingProgressStore.getState().reload();
    renderApp('/pronunciation/sounds');
    expect(await screen.findByRole('link', { name: /\/ʃ\/.*said well/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /\/æ\// })).not.toHaveTextContent('said well');
  });

  it('a sound card shows how to say it and scene words with the sound marked', async () => {
    seedProfile();
    renderApp('/pronunciation/sounds/ae');
    const words = getSoundExampleWords(getIpaSound('ae')!);
    expect(words).toHaveLength(6);

    expect(await screen.findByRole('heading', { level: 1, name: 'Sound /æ/' })).toBeVisible();
    expect(screen.getByText(/Hạ hàm dưới/)).toBeInTheDocument();
    const list = screen.getByRole('region', { name: 'Words with /æ/' });
    const items = within(list).getAllByRole('listitem');
    expect(items).toHaveLength(6);
    expect(within(items[0]).getByText(words[0].text)).toBeInTheDocument();
    expect(items[0].querySelector('mark')).toHaveTextContent('æ');
    // A browser voice can't say a sound alone: no sound button without a recording.
    expect(screen.queryByRole('button', { name: /Listen to the sound/ })).toBeNull();
    expect(screen.getByRole('link', { name: 'Say These Words' })).toHaveAttribute(
      'href',
      '/pronunciation/sounds/ae/speaking',
    );
    expect(screen.getByRole('link', { name: /Next/ })).toHaveAttribute(
      'href',
      '/pronunciation/sounds/ah',
    );
  });

  it('/ð/ has no scene word: its card shows extra words to listen to', async () => {
    seedProfile();
    renderApp('/pronunciation/sounds/dh');
    const list = await screen.findByRole('region', { name: 'Words with /ð/' });
    expect(within(list).getByText('mother')).toBeInTheDocument();
    expect(within(list).getByRole('button', { name: 'Listen to “mother”' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Say These Words' })).toBeNull();
  });

  it('the words of a sound are practised in a Word Speaking round and the best score is saved', async () => {
    const user = userEvent.setup();
    seedProfile();
    const [first] = getSoundExampleWords(getIpaSound('ae')!);
    uninstall = installFakeSpeechRecognition({ guesses: [first.text], confidence: 0.95 });
    renderApp('/pronunciation/sounds/ae/speaking');

    expect(await screen.findByText('Word 1 of 6')).toBeInTheDocument();
    const crumbs = screen.getByRole('navigation', { name: /breadcrumb/i });
    expect(within(crumbs).getByRole('link', { name: '/æ/' })).toHaveAttribute(
      'href',
      '/pronunciation/sounds/ae',
    );
    await user.click(screen.getByRole('button', { name: 'Tap and say the word' }));
    expect(await screen.findByRole('heading', { name: 'Excellent!' })).toBeInTheDocument();
    expect(storedSpeaking()?.bestScoreByWordId[first.id]).toBeGreaterThanOrEqual(80);
  });

  it('the Chinese course has no IPA chart', async () => {
    seedProfile();
    seedSettings({ course: 'zh' });
    renderApp('/pronunciation');
    expect(await screen.findByRole('heading', { level: 1, name: '发音' })).toBeVisible();
    expect(screen.queryByRole('link', { name: /国际音标/ })).toBeNull();
  });
});
