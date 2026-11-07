import { useCallback, useMemo, useReducer, useState } from 'react';
import { paths } from '@/app/paths';
import { ProgressBar } from '@/components/common/ProgressBar';
import { Breadcrumb, PageContainer, TopBar } from '@/components/layout/PageHeader';
import { SpeakingScoreNote } from '@/components/speaking/SpeakingFeedback';
import { getSceneWords, getWord } from '@/data/content';
import { ComingSoonPage, NotFoundPage } from '@/features/misc/NotFoundPage';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { t } from '@/i18n';
import { playSfx } from '@/lib/sfx';
import { useSettingsStore } from '@/stores/settingsStore';
import { useSpeakingProgressStore } from '@/stores/speakingProgressStore';
import type { Scene } from '@/types/models';
import { WordSpeakingCard } from '../speaking/WordSpeakingCard';
import { WordSpeakingSummary } from '../speaking/WordSpeakingSummary';
import {
  createWordSpeakingState,
  wordSpeakingReducer,
  type WordSpeakingResult,
} from '../speaking/wordSpeakingSession';
import { useSceneParam } from '../useSceneParam';

/** Which menu opened Word Speaking: it decides the breadcrumb and where "back" leads. */
export type WordSpeakingMenu = 'vocabulary' | 'pronunciation';

/**
 * Word Speaking (spec §7.7): the learner says each word of the scene and gets a score with the
 * sounds to practise coloured. One screen, two ways in: after the flashcards
 * (`/vocabulary/:sceneId/speaking`) and from a scene card of the Pronunciation menu
 * (`/pronunciation/scene/:sceneId`). Each word's best score is saved for the Pronunciation menu.
 */
export function WordSpeakingPage({ menu = 'vocabulary' }: { menu?: WordSpeakingMenu }) {
  const result = useSceneParam();
  if (result.status === 'not-found') return <NotFoundPage />;
  if (result.status === 'coming-soon') return <ComingSoonPage title={result.scene.title} />;
  return <WordSpeaking key={result.scene.id} scene={result.scene} menu={menu} />;
}

function WordSpeaking({ scene, menu }: { scene: Scene; menu: WordSpeakingMenu }) {
  useDocumentTitle(t('Speaking · {scene}', { scene: scene.title }));
  const words = useMemo(() => getSceneWords(scene), [scene]);
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
        <Breadcrumb
          items={
            menu === 'pronunciation'
              ? [{ label: t('Pronunciation'), to: paths.pronunciation }, { label: scene.title }]
              : [
                  { label: t('Vocabulary'), to: paths.vocabulary },
                  { label: scene.title, to: paths.topic(scene.id) },
                  { label: t('Speaking') },
                ]
          }
        />
      </TopBar>
      <PageContainer width="narrow" className="flex flex-col gap-4">
        <h1 className="sr-only">{t('{scene} speaking practice', { scene: scene.title })}</h1>
        {state.finished ? (
          <WordSpeakingSummary
            scene={scene}
            words={words}
            results={state.results}
            menu={menu}
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
