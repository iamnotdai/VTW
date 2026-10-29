import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SPEECH_CONFIG } from '@/config/app';
import { STORAGE_KEYS } from '@/lib/storage';
import { renderApp, seedProfile } from '../helpers';

/* jsdom has no Web Speech API: fake the browser voices and record what gets spoken. */

const voice = (name: string, lang = 'en-US', localService = true) =>
  ({ name, lang, localService, voiceURI: `uri:${name}`, default: false }) as SpeechSynthesisVoice;

const VOICES = [
  voice('Microsoft David - English (United States)'),
  voice('Microsoft Aria Online (Natural) - English (United States)', 'en-US', false),
  voice('Microsoft Guy Online (Natural) - English (United States)', 'en-US', false),
  voice('Microsoft Zira - English (United States)'),
  voice('Google UK English Female', 'en-GB'),
  voice('Microsoft HoaiMy - Vietnamese (Vietnam)', 'vi-VN'),
];

class FakeUtterance {
  lang = '';
  rate = 1;
  pitch = 1;
  voice: SpeechSynthesisVoice | null = null;
  onend: (() => void) | null = null;
  onerror: (() => void) | null = null;
  text: string;
  constructor(text: string) {
    this.text = text;
  }
}

function installSpeech(voices: SpeechSynthesisVoice[]) {
  const spoken: FakeUtterance[] = [];
  vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance);
  vi.stubGlobal('speechSynthesis', {
    speaking: false,
    pending: false,
    getVoices: () => voices,
    speak: (utterance: FakeUtterance) => spoken.push(utterance),
    cancel: () => {},
    resume: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
  });
  return spoken;
}

const VOICE_SELECT = 'American English voice for words and sentences';
const savedSettings = () => JSON.parse(localStorage.getItem(STORAGE_KEYS.settings)!);

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Settings › Reading voice', () => {
  it('says so when the browser cannot read aloud', async () => {
    seedProfile();
    renderApp('/settings');
    expect(
      await screen.findByText(
        'This browser cannot read words aloud, so there is no voice to choose.',
      ),
    ).toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: VOICE_SELECT })).toBeNull();
  });

  it('lists only American English voices, the most natural first', async () => {
    installSpeech(VOICES);
    seedProfile();
    renderApp('/settings');
    const select = await screen.findByRole('combobox', { name: VOICE_SELECT });
    expect(
      within(select)
        .getAllByRole('option')
        .map((option) => option.textContent),
    ).toEqual([
      'Automatic (best available)',
      'Microsoft Aria Online (Natural) - English (United States)',
      'Microsoft Guy Online (Natural) - English (United States)',
      'Microsoft David - English (United States)',
      'Microsoft Zira - English (United States)',
    ]);
    expect(screen.getByRole('radio', { name: 'Automatic' })).toBeChecked();
  });

  it('saves the chosen voice and uses it for the preview', async () => {
    const user = userEvent.setup();
    const spoken = installSpeech(VOICES);
    seedProfile();
    renderApp('/settings');
    const select = await screen.findByRole('combobox', { name: VOICE_SELECT });
    await user.selectOptions(select, 'Microsoft Zira - English (United States)');
    expect(savedSettings().voiceURI).toBe('uri:Microsoft Zira - English (United States)');

    await user.click(screen.getByRole('button', { name: 'Hear this voice' }));
    expect(spoken.at(-1)?.voice?.name).toBe('Microsoft Zira - English (United States)');
    expect(spoken.at(-1)?.lang).toBe('en-US');
    expect(spoken.at(-1)?.pitch).toBe(1);
  });

  it('Boy voice keeps only male voices, resets the choice and raises the pitch', async () => {
    const user = userEvent.setup();
    const spoken = installSpeech(VOICES);
    seedProfile();
    renderApp('/settings');
    const select = await screen.findByRole('combobox', { name: VOICE_SELECT });
    await user.selectOptions(select, 'Microsoft Zira - English (United States)');

    await user.click(screen.getByRole('radio', { name: 'Boy voice' }));
    expect(screen.getByRole('radio', { name: 'Boy voice' })).toBeChecked();
    expect(savedSettings()).toMatchObject({ voiceStyle: 'boy', voiceURI: null });
    expect(
      within(select)
        .getAllByRole('option')
        .map((option) => option.textContent),
    ).toEqual([
      'Automatic (best available)',
      'Microsoft Guy Online (Natural) - English (United States)',
      'Microsoft David - English (United States)',
    ]);
    expect(select).toHaveValue('');

    await user.click(screen.getByRole('button', { name: 'Hear this voice' }));
    expect(spoken.at(-1)?.voice?.name).toBe(
      'Microsoft Guy Online (Natural) - English (United States)',
    );
    expect(spoken.at(-1)?.pitch).toBe(SPEECH_CONFIG.stylePitch.boy);
  });

  it('falls back to every US voice when none matches the style', async () => {
    const user = userEvent.setup();
    installSpeech([voice('Microsoft David - English (United States)'), voice('Voice 7')]);
    seedProfile();
    renderApp('/settings');
    await user.click(await screen.findByRole('radio', { name: 'Girl voice' }));
    expect(
      within(screen.getByRole('combobox', { name: VOICE_SELECT }))
        .getAllByRole('option')
        .map((o) => o.textContent),
    ).toEqual([
      'Automatic (best available)',
      'Microsoft David - English (United States)',
      'Voice 7',
    ]);
  });
});
