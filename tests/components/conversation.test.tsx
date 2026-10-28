import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { readStoredProgress, renderApp, seedProfile } from '../helpers';

describe('Conversations (screens 09–15)', () => {
  it('Vocabulary and Conversation menus open the same conversation', async () => {
    seedProfile();
    renderApp('/vocabulary/bedroom/conversations');
    const row = await screen.findByRole('link', { name: /My Bedroom/ });
    expect(row).toHaveAttribute('href', '/conversation/my-bedroom/video');
    expect(screen.getAllByRole('link', { name: /^Conversation \d+:/ })).toHaveLength(10);
  });

  it('lists conversations by scene with a completed count', async () => {
    seedProfile();
    renderApp('/conversation');
    expect(
      await screen.findByRole('heading', { name: 'Conversation', level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Bedroom/, pressed: true })).toBeInTheDocument();
    expect(screen.getByText('0/10')).toBeInTheDocument();
    // The chosen place lists its conversations, opening the shared detail page.
    expect(screen.getByRole('link', { name: /My Bedroom/ })).toHaveAttribute(
      'href',
      '/conversation/my-bedroom',
    );
  });

  it('the video screen always leads to the transcript, even without a video file', async () => {
    seedProfile();
    renderApp('/conversation/my-bedroom/video');
    expect(await screen.findByText('Video coming soon')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View Conversation' })).toHaveAttribute(
      'href',
      '/conversation/my-bedroom/transcript',
    );
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
