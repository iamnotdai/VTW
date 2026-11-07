import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getConversation, getScene, getSceneWords, getSpeaker } from '@/data/content';
import { buildBlankLines } from '@/lib/fillBlanks';
import { installFakeSpeechRecognition } from '../fakeSpeechRecognition';
import { readStoredProgress, renderApp, seedProfile, seedSettings } from '../helpers';

let uninstall: (() => void) | null = null;
afterEach(() => {
  uninstall?.();
  uninstall = null;
});

const SLOW = { timeout: 3000 };

describe('Word Speaking (after the flashcards)', () => {
  it('the flashcards end offers speaking practice', async () => {
    const user = userEvent.setup();
    seedProfile();
    renderApp('/vocabulary/bedroom/flashcards');
    await user.click(await screen.findByRole('button', { name: 'Finish' }));
    expect(screen.getByRole('link', { name: 'Practice Pronunciation' })).toHaveAttribute(
      'href',
      '/vocabulary/bedroom/speaking',
    );
  });

  it('scores a word, colours its sounds and moves on', async () => {
    const user = userEvent.setup();
    seedProfile();
    uninstall = installFakeSpeechRecognition(
      { guesses: ['bad'] },
      { guesses: ['bed'], confidence: 0.95 },
    );
    renderApp('/vocabulary/bedroom/speaking');

    expect(await screen.findByText('Word 1 of 24')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'bed' })).toBeInTheDocument();
    expect(screen.getByText('/bed/')).toBeInTheDocument();
    expect(screen.getByText('cái giường')).toBeInTheDocument();

    // First try: the recognizer heard "bad" — close, with the vowel marked.
    await user.click(screen.getByRole('button', { name: 'Tap and say the word' }));
    expect(await screen.findByRole('heading', { name: 'Almost there!' })).toBeInTheDocument();
    expect(screen.getByText('bad')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'bed — practice: e' })).toBeInTheDocument();

    // Second try: right.
    await user.click(screen.getByRole('button', { name: 'Try Again' }));
    expect(await screen.findByRole('heading', { name: 'Excellent!' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /^Score: \d+ out of 100$/ })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Next Word' }));
    expect(await screen.findByText('Word 2 of 24')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'pillow' })).toBeInTheDocument();
    // Speaking never counts as learning the word (only a correct quiz answer does).
    expect(readStoredProgress()?.completedWordIdsByScene ?? {}).toEqual({});
  });

  it('falls back to Listen & Repeat without speech recognition and ends with a summary', async () => {
    const user = userEvent.setup();
    seedProfile();
    renderApp('/vocabulary/bedroom/speaking');

    expect(await screen.findByText(/can’t listen to your voice/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Listen slowly' })).toBeInTheDocument();
    for (let word = 0; word < 24; word += 1) {
      await user.click(screen.getByRole('button', { name: 'I said it!' }));
    }
    expect(
      await screen.findByRole('heading', { name: 'Speaking practice done!' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Well done for saying every word out loud!')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Explore the Bedroom' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Practice All Words Again' }));
    expect(await screen.findByText('Word 1 of 24')).toBeInTheDocument();
  });
});

describe('Word Speaking in the Chinese course', () => {
  it('counts a homophone as right and points out a tone slip', async () => {
    const user = userEvent.setup();
    seedProfile();
    seedSettings({ course: 'zh' });
    // 窗 (chuāng) instead of 床 (chuáng): same syllable, another tone.
    uninstall = installFakeSpeechRecognition({ guesses: ['窗'] });
    renderApp('/vocabulary/bedroom/speaking');

    expect(await screen.findByText('第1个词，共24个')).toBeInTheDocument();
    expect(screen.getByText('chuáng')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '点一下，说出这个词' }));
    expect(await screen.findByText('注意黄色汉字的声调哦。', {}, SLOW)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '差一点点就对了！' })).toBeInTheDocument();
  });
});

describe('Role-play', () => {
  it('lets the learner pick a character, say its lines and change character', async () => {
    const user = userEvent.setup();
    seedProfile();
    uninstall = installFakeSpeechRecognition(
      { guesses: ['yes it is come in'] },
      { guesses: ['and this is my money her name is bobo'] },
      { guesses: ['a laptop and a book I love my bedroom'] },
    );
    const { router } = renderApp('/conversation/my-bedroom/role-play');

    expect(
      await screen.findByRole('heading', { name: 'Who do you want to be?' }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Be Lily/ }));
    expect(router.state.location.search).toBe('?as=lily');
    expect(screen.getByRole('heading', { name: 'You are Lily!' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Start' }));
    // Ben speaks by himself (jsdom has no voice, so his line simply moves on), then it is Lily's turn.
    expect(screen.getByText('Lily, is this your bedroom?')).toBeInTheDocument();
    const turn = await screen.findByRole('region', { name: 'Your turn' }, SLOW);
    await user.click(within(turn).getByRole('button', { name: 'Tap and say your line' }));
    expect(await within(turn).findByRole('heading', { name: 'Excellent!' })).toBeInTheDocument();
    await user.click(within(turn).getByRole('button', { name: 'Continue' }));

    // Second turn: "bunny" was heard as "money" → almost, with the word marked.
    const second = await screen.findByRole('region', { name: 'Your turn' }, SLOW);
    expect(screen.getByText('Wow, your bed is so big!')).toBeInTheDocument();
    await user.click(within(second).getByRole('button', { name: 'Tap and say your line' }));
    expect(await within(second).findByText(/We heard:/)).toBeInTheDocument();
    expect(
      screen.getByText('And this is my bunny. Her name is Bobo. — practice: bunny'),
    ).toBeInTheDocument();
    await user.click(within(second).getByRole('button', { name: 'Continue' }));

    const third = await screen.findByRole('region', { name: 'Your turn' }, SLOW);
    await user.click(within(third).getByRole('button', { name: 'Tap and say your line' }));
    await user.click(await within(third).findByRole('button', { name: 'Finish' }));

    expect(await screen.findByRole('heading', { name: 'Role-play complete!' })).toBeInTheDocument();
    expect(screen.getByText('You played Lily in “My Bedroom”.')).toBeInTheDocument();
    expect(readStoredProgress().completedConversationIds).toEqual(['my-bedroom']);

    // Change character: back to the picker, Lily marked as the last one played.
    await user.click(screen.getByRole('button', { name: 'Change Character' }));
    expect(router.state.location.search).toBe('');
    expect(screen.getByRole('button', { name: /Be Lily/ })).toHaveAttribute('aria-pressed', 'true');
    await user.click(screen.getByRole('button', { name: /Be Ben/ }));
    expect(screen.getByRole('heading', { name: 'You are Ben!' })).toBeInTheDocument();
  });

  it('works with Listen & Repeat when the browser cannot listen', async () => {
    const user = userEvent.setup();
    seedProfile();
    renderApp('/conversation/my-bedroom/role-play?as=ben');
    await user.click(await screen.findByRole('button', { name: 'Start' }));
    // Ben starts: his turn comes right away.
    const turn = await screen.findByRole('region', { name: 'Your turn' });
    await user.click(within(turn).getByRole('button', { name: 'I said it!' }));
    expect(await screen.findByText('Yes, it is. Come in!', {}, SLOW)).toBeInTheDocument();
  });

  it('the transcript leads on to Role-play; the path offers Fill in the Blanks to every learner', async () => {
    seedProfile({ canTypeWords: false });
    const { unmount } = renderApp('/conversation/my-bedroom/transcript');
    expect(await screen.findByRole('link', { name: 'Next: Role-play' })).toHaveAttribute(
      'href',
      '/conversation/my-bedroom/role-play',
    );
    unmount();

    renderApp('/conversation/my-bedroom');
    expect(await screen.findByRole('link', { name: /Fill in the Blanks/ })).toHaveAttribute(
      'href',
      '/conversation/my-bedroom/fill-blanks',
    );
  });
});

describe('Fill in the Blanks', () => {
  /** The blanks the screen picks when Math.random always returns 0. */
  function expectedAnswers(): string[] {
    const conversation = getConversation('my-bedroom')!;
    return buildBlankLines(conversation.lines, {
      vocabulary: getSceneWords(getScene('bedroom')!).map((word) => word.text),
      names: conversation.lines.map((line) => getSpeaker(line.speakerId)?.name ?? ''),
      lang: 'en-US',
      random: () => 0,
    }).flatMap((line) =>
      line.pieces.flatMap((piece) => (piece.kind === 'blank' ? [piece.answer] : [])),
    );
  }

  it('learners who can’t type choose the words: a tap checks at once', async () => {
    const user = userEvent.setup();
    vi.spyOn(Math, 'random').mockReturnValue(0);
    seedProfile({ canTypeWords: false });
    renderApp('/conversation/my-bedroom/fill-blanks');
    const answers = expectedAnswers();

    expect(
      await screen.findByText('Listen to each line and choose the missing word.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Type the words instead' })).toBeNull();
    const groups = screen.getAllByRole('group', { name: /^Choices for missing word \d+$/ });
    expect(groups).toHaveLength(answers.length);
    for (const group of groups) expect(within(group).getAllByRole('button')).toHaveLength(3);

    // A wrong word first: it turns yellow and can't be picked again.
    const first = groups[0];
    const wrong = within(first)
      .getAllByRole('button')
      .find((button) => button.textContent !== answers[0])!;
    await user.click(wrong);
    expect(wrong).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Show Answers' })).toBeInTheDocument();

    // Then every right word: the choices go away and the round ends.
    for (const [index, answer] of answers.entries()) {
      const group = screen.getByRole('group', { name: `Choices for missing word ${index + 1}` });
      await user.click(within(group).getByRole('button', { name: answer }));
    }
    expect(screen.queryAllByRole('group', { name: /^Choices for missing word/ })).toHaveLength(0);
    expect(await screen.findByText(/All the words are right/)).toBeInTheDocument();
    expect(
      screen.getByText(
        new RegExp(`${answers.length - 1} of ${answers.length} right on the first try`),
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'New Blanks' })).toBeInTheDocument();
    // Fill in the Blanks never counts as learning words, but it finishes step ② (spec §9.7).
    expect(readStoredProgress()?.completedWordIdsByScene ?? {}).toEqual({});
    expect(readStoredProgress()?.conversationStepsById).toEqual({ 'my-bedroom': ['fill'] });
    expect(screen.getByRole('link', { name: 'Next: Read the Conversation' })).toHaveAttribute(
      'href',
      '/conversation/my-bedroom/transcript',
    );
  });

  it('choice mode: Show Answers reveals what was missing', async () => {
    const user = userEvent.setup();
    vi.spyOn(Math, 'random').mockReturnValue(0);
    seedProfile({ canTypeWords: false });
    renderApp('/conversation/my-bedroom/fill-blanks');
    const answers = expectedAnswers();
    const [first] = await screen.findAllByRole('group', { name: /^Choices for missing word/ });
    await user.click(
      within(first)
        .getAllByRole('button')
        .find((button) => button.textContent !== answers[0])!,
    );
    await user.click(screen.getByRole('button', { name: 'Show Answers' }));
    expect(screen.getByText('Here are the answers.', { exact: false })).toBeInTheDocument();
    expect(screen.getByText(answers[0])).toBeInTheDocument();
    // Shown answers don't finish the step.
    expect(readStoredProgress()?.conversationStepsById ?? {}).toEqual({});
  });

  it('learners who can type may switch to typing the words', async () => {
    const user = userEvent.setup();
    seedProfile({ canTypeWords: true });
    renderApp('/conversation/my-bedroom/fill-blanks');
    expect(
      await screen.findAllByRole('group', { name: /^Choices for missing word/ }),
    ).not.toHaveLength(0);
    await user.click(screen.getByRole('button', { name: 'Type the words instead' }));
    expect(screen.getByText('Listen to each line and type the missing word.')).toBeInTheDocument();
    expect(screen.getAllByRole('textbox').length).toBeGreaterThan(3);
    await user.click(screen.getByRole('button', { name: 'Choose the words instead' }));
    expect(screen.queryByRole('textbox')).toBeNull();
  });

  it('checks the typed words, lets the learner fix them and shows the answers', async () => {
    const user = userEvent.setup();
    vi.spyOn(Math, 'random').mockReturnValue(0);
    seedProfile({ canTypeWords: true });
    renderApp('/conversation/my-bedroom/fill-blanks');
    await user.click(await screen.findByRole('button', { name: 'Type the words instead' }));
    const answers = expectedAnswers();
    expect(answers.length).toBeGreaterThan(3);

    const inputs = await screen.findAllByRole('textbox');
    expect(inputs).toHaveLength(answers.length);
    expect(inputs[0]).toHaveAccessibleName('Missing word 1');

    // One wrong word.
    for (const [index, input] of inputs.entries()) {
      await user.type(input, index === 0 ? 'xyz' : answers[index]);
    }
    await user.click(screen.getByRole('button', { name: 'Check Answers' }));
    expect(
      screen.getByText(
        `${answers.length - 1} of ${answers.length} right. Fix the yellow words and check again!`,
      ),
    ).toBeInTheDocument();
    expect(inputs[0]).toHaveAttribute('aria-invalid', 'true');

    // Fixed.
    await user.clear(inputs[0]);
    await user.type(inputs[0], answers[0].toUpperCase());
    await user.click(screen.getByRole('button', { name: 'Check Again' }));
    expect(await screen.findByText(/All the words are right/)).toBeInTheDocument();
    expect(
      screen.getByText(
        new RegExp(`${answers.length - 1} of ${answers.length} right on the first try`),
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'New Blanks' })).toBeInTheDocument();
  });

  it('typing mode: Show Answers reveals what was missing', async () => {
    const user = userEvent.setup();
    vi.spyOn(Math, 'random').mockReturnValue(0);
    seedProfile({ canTypeWords: true });
    renderApp('/conversation/my-bedroom/fill-blanks');
    await user.click(await screen.findByRole('button', { name: 'Type the words instead' }));
    const [first] = await screen.findAllByRole('textbox');
    await user.type(first, 'nope');
    await user.click(screen.getByRole('button', { name: 'Check Answers' }));
    await user.click(screen.getByRole('button', { name: 'Show Answers' }));
    expect(screen.getByText('Here are the answers.', { exact: false })).toBeInTheDocument();
    expect(screen.getByText(`(${expectedAnswers()[0]})`)).toBeInTheDocument();
  });
});
