import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getConversation } from '@/data/content';
import { readStoredProgress, renderApp, seedProfile, seedProgress } from '../helpers';

afterEach(() => {
  vi.unstubAllGlobals();
});

/** A browser voice that finishes each line at once; returns what it said. */
function installInstantSpeech(): string[] {
  const spoken: string[] = [];
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
  vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance);
  vi.stubGlobal('speechSynthesis', {
    speaking: false,
    pending: false,
    getVoices: () => [],
    speak: (utterance: FakeUtterance) => {
      spoken.push(utterance.text);
      setTimeout(() => utterance.onend?.(), 0);
    },
    cancel: () => {},
    resume: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
  });
  return spoken;
}

describe('Conversations (screens 09–15)', () => {
  it('Vocabulary and Conversation menus open the same conversation', async () => {
    seedProfile();
    renderApp('/vocabulary/bedroom/conversations');
    const row = await screen.findByRole('link', { name: /My Bedroom/ });
    expect(row).toHaveAttribute('href', '/conversation/my-bedroom/video');
    expect(screen.getAllByRole('link', { name: /^Conversation \d+:/ })).toHaveLength(10);
  });

  it('lists scenes by area without progress; a scene card opens its conversations', async () => {
    const user = userEvent.setup();
    seedProfile();
    renderApp('/conversation');
    expect(
      await screen.findByRole('heading', { name: 'Conversation', level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Home/ })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('button', { name: /^Garden/ })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    const houseExterior = screen.getByRole('link', { name: /House Exterior/ });
    expect(houseExterior).toHaveAttribute('href', '/conversation/scene/house-exterior');
    expect(within(houseExterior).queryByRole('progressbar')).toBeNull();

    await user.click(houseExterior);
    expect(
      await screen.findByRole('heading', { name: 'House Exterior Conversations' }),
    ).toBeInTheDocument();
    expect(screen.getByText('10 conversations in this scene.')).toBeInTheDocument();
    // The Conversation menu opens the shared detail page.
    expect(screen.getByRole('link', { name: /My House/ })).toHaveAttribute(
      'href',
      '/conversation/my-house',
    );
  });

  it('step ①: without a video, the conversation plays over the poster and the end finishes the step', async () => {
    const user = userEvent.setup();
    const spoken = installInstantSpeech();
    seedProfile();
    renderApp('/conversation/my-bedroom/video');

    expect(await screen.findByRole('link', { name: 'Next: Fill in the Blanks' })).toHaveAttribute(
      'href',
      '/conversation/my-bedroom/fill-blanks',
    );
    // Listening first: the words are hidden until the learner asks for them.
    expect(screen.getByRole('button', { name: 'Show the words' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    await user.click(screen.getByRole('button', { name: 'Show the words' }));
    expect(screen.getByRole('button', { name: 'Show the words' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await user.click(screen.getByRole('button', { name: 'Listen to the whole conversation' }));
    expect(
      await screen.findByText('Nice listening! Next, find the missing words.'),
    ).toBeInTheDocument();
    expect(spoken).toEqual(getConversation('my-bedroom')!.lines.map((line) => line.text));
    expect(readStoredProgress()?.conversationStepsById).toEqual({ 'my-bedroom': ['listen'] });
  });

  it('the detail page shows the four steps in order, with checks and "Up next"', async () => {
    seedProfile();
    seedProgress({ conversationStepsById: { 'my-bedroom': ['listen', 'fill'] } });
    renderApp('/conversation/my-bedroom');

    const path = await screen.findByRole('region', { name: 'Your learning path' });
    const steps = within(path).getAllByRole('link');
    expect(steps.map((step) => step.getAttribute('href'))).toEqual([
      '/conversation/my-bedroom/video',
      '/conversation/my-bedroom/fill-blanks',
      '/conversation/my-bedroom/transcript',
      '/conversation/my-bedroom/role-play',
    ]);
    expect(steps[0]).toHaveTextContent('Step 1 of 4, done');
    expect(steps[1]).toHaveTextContent('Step 2 of 4, done');
    expect(steps[2]).toHaveTextContent('Up next');
    expect(steps[3]).not.toHaveTextContent('done');
    // Fill in the Blanks practises listening, reading and writing.
    expect(
      within(within(steps[1]).getByRole('list', { name: 'Skills' }))
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual(['Listening', 'Reading', 'Writing']);
  });

  it('step ③: going on from the transcript finishes reading; step ④ is the completed conversation', async () => {
    const user = userEvent.setup();
    seedProfile();
    seedProgress({ completedConversationIds: ['my-bedroom'] });
    const { unmount } = renderApp('/conversation/my-bedroom/transcript');
    await user.click(await screen.findByRole('link', { name: 'Next: Role-play' }));
    expect(readStoredProgress()?.conversationStepsById).toEqual({ 'my-bedroom': ['read'] });
    unmount();

    renderApp('/conversation/my-bedroom');
    const path = await screen.findByRole('region', { name: 'Your learning path' });
    const steps = within(path).getAllByRole('link');
    expect(steps[2]).toHaveTextContent('Step 3 of 4, done');
    expect(steps[3]).toHaveTextContent('Step 4 of 4, done');
    expect(steps[0]).toHaveTextContent('Up next');
  });

  it('shows each line with speaker, audio button and an optional translation', async () => {
    const user = userEvent.setup();
    seedProfile();
    renderApp('/conversation/my-bedroom/transcript');
    const line = (await screen.findByText('Lily, is this your bedroom?')).closest('li')!;
    expect(within(line).getByText('Ben')).toBeInTheDocument();
    expect(
      within(line).getByRole('button', { name: 'Play: Lily, is this your bedroom?' }),
    ).toBeInTheDocument();
    await user.click(within(line).getByRole('button', { name: 'Translate' }));
    expect(within(line).getByText('Lily, đây là phòng ngủ của bạn à?')).toBeInTheDocument();
  });

  it('speaking practice falls back to Listen & Repeat and completes the lesson at the end', async () => {
    const user = userEvent.setup();
    seedProfile();
    const { router } = renderApp('/conversation/my-bedroom/practice');

    // jsdom has no SpeechRecognition — the learner must still be able to continue.
    expect(await screen.findByText(/can’t listen to your voice/)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'What is in the bedroom?' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Mark as Practiced' }));
    expect(
      await screen.findByRole('heading', { name: 'Well done for practicing!' }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Next Question' }));

    expect(
      await screen.findByRole('heading', { name: 'What is your favorite thing in your bedroom?' }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Mark as Practiced' }));
    await user.click(await screen.findByRole('button', { name: 'Finish Lesson' }));

    expect(await screen.findByText(/Lesson complete!/)).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/conversation/my-bedroom');
    expect(readStoredProgress().completedConversationIds).toEqual(['my-bedroom']);
  });
});
