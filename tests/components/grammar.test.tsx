import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { getGrammarTopic } from '@/data/content';
import { exerciseAnswer, sentenceTiles } from '@/lib/grammar';
import { STORAGE_KEYS } from '@/lib/storage';
import type { GrammarExercise } from '@/types/models';
import { readStoredProgress, renderApp, seedProfile, seedSettings } from '../helpers';

const storedGrammar = () => {
  const raw = localStorage.getItem(STORAGE_KEYS.grammar);
  return raw ? JSON.parse(raw) : null;
};

type User = ReturnType<typeof userEvent.setup>;

/** Answers the question on screen right (after one wrong choice when `wrongFirst`). */
async function answer(user: User, exercise: GrammarExercise, wrongFirst = false) {
  if (exercise.kind === 'order') {
    const words = screen.getByRole('group', { name: 'Words' });
    for (const word of sentenceTiles(exercise.sentence)) {
      await user.click(within(words).getByRole('button', { name: word }));
    }
    await user.click(screen.getByRole('button', { name: 'Check' }));
    return;
  }
  const choices = screen.getByRole('group', { name: 'Choices' });
  const right = exerciseAnswer(exercise);
  if (wrongFirst) {
    const wrong = exercise.options.find((option) => option !== right)!;
    await user.click(within(choices).getByRole('button', { name: wrong }));
  }
  await user.click(within(choices).getByRole('button', { name: right }));
}

describe('Grammar (spec §25)', () => {
  it('lists the 12 tenses by time; only written lessons open', async () => {
    seedProfile();
    renderApp('/grammar');
    expect(await screen.findByRole('heading', { level: 1, name: 'Grammar' })).toBeVisible();
    const sections = ['Past', 'Present', 'Future'].map((name) =>
      screen.getByRole('region', { name }),
    );
    for (const section of sections)
      expect(within(section).getAllByRole('listitem')).toHaveLength(4);
    expect(
      screen
        .getAllByRole('link', { name: /Simple|Continuous/ })
        .map((link) => link.getAttribute('href')),
    ).toEqual([
      '/grammar/past-simple',
      '/grammar/present-simple',
      '/grammar/present-continuous',
      '/grammar/future-simple',
    ]);
    expect(within(sections[1]).getByText('Present Perfect').closest('a')).toBeNull();
    expect(screen.getAllByText('Coming soon')).toHaveLength(8);
  });

  it('a lesson shows when to use the tense, its forms, signal words and examples', async () => {
    seedProfile();
    renderApp('/grammar/present-simple');
    expect(await screen.findByRole('heading', { level: 1, name: 'Present Simple' })).toBeVisible();
    expect(screen.getByText('Thì hiện tại đơn')).toBeInTheDocument();
    expect(screen.getByText('Thói quen, việc làm lặp lại hằng ngày.')).toBeInTheDocument();
    for (const form of ['Affirmative', 'Negative', 'Question'])
      expect(screen.getByRole('heading', { level: 3, name: form })).toBeInTheDocument();
    expect(screen.getByText('every day')).toBeInTheDocument();
    const examples = screen.getByRole('region', { name: 'Examples' });
    expect(within(examples).getAllByRole('listitem')).toHaveLength(6);
    expect(
      within(examples).getByRole('button', { name: 'Listen to “I brush my teeth every morning.”' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Start Practice' })).toHaveAttribute(
      'href',
      '/grammar/present-simple/practice',
    );
  });

  it('a lesson not written yet is "coming soon"', async () => {
    seedProfile();
    renderApp('/grammar/present-perfect');
    expect(await screen.findByText('Present Perfect is coming soon')).toBeInTheDocument();
  });

  it('practice: every exercise once, progress only for right answers, then the result', async () => {
    const user = userEvent.setup();
    seedProfile();
    renderApp('/grammar/present-simple/practice');
    const topic = getGrammarTopic('present-simple')!;
    expect(await screen.findByText('Question 1 of 10')).toBeInTheDocument();

    for (const [index, exercise] of topic.exercises.entries()) {
      expect(screen.getByText(`Question ${index + 1} of 10`)).toBeInTheDocument();
      await answer(user, exercise, index === 0);
      expect(await screen.findByText(/Right!/)).toBeInTheDocument();
      await user.click(
        screen.getByRole('button', { name: index === 9 ? 'See My Result' : 'Next Question' }),
      );
    }

    expect(await screen.findByRole('heading', { name: 'Practice done!' })).toBeInTheDocument();
    expect(screen.getByText('9 of 10 right on the first try.')).toBeInTheDocument();
    expect(storedGrammar().correctExerciseIdsByTopic['present-simple']).toHaveLength(10);
    // Grammar never counts as learned words (nor toward the Level).
    expect(readStoredProgress()?.completedWordIdsByScene ?? {}).toEqual({});
  });

  it('a shown answer does not count; an order sentence can be fixed', async () => {
    const user = userEvent.setup();
    seedProfile();
    renderApp('/grammar/present-simple/practice');
    const [first] = getGrammarTopic('present-simple')!.exercises;
    const choices = await screen.findByRole('group', { name: 'Choices' });
    const wrong =
      first.kind === 'choose' ? first.options.find((option) => option !== first.answer)! : '';
    await user.click(within(choices).getByRole('button', { name: wrong }));
    expect(within(choices).getByRole('button', { name: wrong })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Show Answer' }));
    expect(screen.getByRole('status')).toHaveTextContent('She brushes her teeth every morning.');
    expect(storedGrammar()).toBeNull();
  });

  it('the Chinese course has no Grammar', async () => {
    seedProfile();
    seedSettings({ course: 'zh' });
    renderApp('/grammar');
    expect(await screen.findByText('语法属于英语课程')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '打开设置' })).toHaveAttribute('href', '/settings');
  });
});
