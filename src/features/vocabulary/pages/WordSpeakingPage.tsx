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
import type { Scene } from '@/types/models';
import { WordSpeakingCard } from '../speaking/WordSpeakingCard';
import { WordSpeakingSummary } from '../speaking/WordSpeakingSummary';
import {
  createWordSpeakingState,
  wordSpeakingReducer,
  type WordSpeakingResult,
} from '../speaking/wordSpeakingSession';
import { useSceneParam } from '../useSceneParam';

/**
 * Word Speaking (`/vocabulary/:sceneId/speaking`, spec §7.7): after the flashcards, the learner says
 * each word of the scene and gets a score with the sounds to practise coloured.
 */
export function WordSpeakingPage() {
  const result = useSceneParam();
  if (result.status === 'not-found') return <NotFoundPage />;
  if (result.status === 'coming-soon') return <ComingSoonPage title={result.scene.title} />;
  return <WordSpeaking key={result.scene.id} scene={result.scene} />;
}

function WordSpeaking({ scene }: { scene: Scene }) {
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
  const onScore = useCallback((score: number) => record({ kind: 'scored', score }), [record]);

  return (
    <>
      <TopBar>
        <Breadcrumb
          items={[
            { label: t('Vocabulary'), to: paths.vocabulary },
            { label: scene.title, to: paths.topic(scene.id) },
            { label: t('Speaking') },
          ]}
        />
      </TopBar>
      <PageContainer width="narrow" className="flex flex-col gap-4">
        <h1 className="sr-only">{t('{scene} speaking practice', { scene: scene.title })}</h1>
        {state.finished ? (
          <WordSpeakingSummary
            scene={scene}
            words={words}
            results={state.results}
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
