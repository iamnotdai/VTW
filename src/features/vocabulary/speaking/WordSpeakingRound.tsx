import { useCallback, useReducer, useState } from 'react';
import { ProgressBar } from '@/components/common/ProgressBar';
import { Breadcrumb, PageContainer, TopBar, type Crumb } from '@/components/layout/PageHeader';
import { SpeakingScoreNote } from '@/components/speaking/SpeakingFeedback';
import { getWord } from '@/data/content';
import { t } from '@/i18n';
import { playSfx } from '@/lib/sfx';
import { useSettingsStore } from '@/stores/settingsStore';
import { useSpeakingProgressStore } from '@/stores/speakingProgressStore';
import type { Word } from '@/types/models';
import { WordSpeakingCard } from './WordSpeakingCard';
import { WordSpeakingSummary, type SummaryLink } from './WordSpeakingSummary';
import {
  createWordSpeakingState,
  wordSpeakingReducer,
  type WordSpeakingResult,
} from './wordSpeakingSession';

/**
 * A Word Speaking round over any list of words (spec §7.7): a scene's words, or the example words
 * of a sound (spec §24.2). Each word's best score is saved for the Pronunciation menu — it never
 * counts as a learned word.
 */
export function WordSpeakingRound({
  words,
  crumbs,
  heading,
  explore,
  back,
}: {
  words: readonly Word[];
  crumbs: Crumb[];
  /** Page heading for screen readers. */
  heading: string;
  /** Optional "Explore the scene" link on the summary. */
  explore?: SummaryLink;
  /** Where the summary's last button leads. */
  back: SummaryLink;
}) {
  const [state, dispatch] = useReducer(wordSpeakingReducer, words, (list) =>
    createWordSpeakingState(list.map((word) => word.id)),
  );
  const [listenMode, setListenMode] = useState(false);
  const word = state.finished ? undefined : getWord(state.queue[state.position]);
  const last = state.position === state.queue.length - 1;

  const record = useCallback(
    (result: WordSpeakingResult) => {
      if (word) dispatch({ type: 'record', wordId: word.id, result });
    },
    [word],
  );
  const next = useCallback(() => {
    if (last && useSettingsStore.getState().settings.soundEnabled) playSfx('completed');
    dispatch({ type: 'next' });
  }, [last]);
  const onScore = useCallback(
    (score: number) => {
      record({ kind: 'scored', score });
      if (word) useSpeakingProgressStore.getState().recordScore(word.id, score);
    },
    [record, word],
  );

  return (
    <>
      <TopBar>
        <Breadcrumb items={crumbs} />
      </TopBar>
      <PageContainer width="narrow" className="flex flex-col gap-4">
        <h1 className="sr-only">{heading}</h1>
        {state.finished ? (
          <WordSpeakingSummary
            words={words}
            results={state.results}
            explore={explore}
            back={back}
            onRestart={(queue) => dispatch({ type: 'restart', queue })}
          />
        ) : (
          word && (
            <>
              <div className="flex items-center gap-4">
                <p className="shrink-0 text-base font-bold text-navy-800">
                  {t('Word {number} of {total}', {
                    number: state.position + 1,
                    total: state.queue.length,
                  })}
                </p>
                <ProgressBar
                  value={(state.position / state.queue.length) * 100}
                  label={t('Speaking progress')}
                />
              </div>
              <WordSpeakingCard
                key={`${state.round}:${word.id}`}
                word={word}
                last={last}
                listenMode={listenMode}
                onListenModeChange={setListenMode}
                onScore={onScore}
                onNext={next}
                onSkip={() => {
                  record({ kind: 'skipped' });
                  next();
                }}
                onPracticed={() => {
                  record({ kind: 'practiced' });
                  next();
                }}
              />
            </>
          )
        )}
        <SpeakingScoreNote />
      </PageContainer>
    </>
  );
}
