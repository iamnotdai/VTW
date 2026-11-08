import { ArrowLeft, ArrowRight, LayoutGrid, PartyPopper, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { paths } from '@/app/paths';
import { Button, ButtonLink } from '@/components/common/Button';
import { ProgressBar } from '@/components/common/ProgressBar';
import { Breadcrumb, PageContainer, TopBar } from '@/components/layout/PageHeader';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { t } from '@/i18n';
import { playSfx } from '@/lib/sfx';
import { useGrammarProgressStore } from '@/stores/grammarProgressStore';
import { useSettingsStore } from '@/stores/settingsStore';
import type { GrammarTopic } from '@/types/models';
import { ChooseQuestion, type GrammarResult } from '../components/ChooseQuestion';
import { GrammarGuard } from '../components/GrammarGuard';
import { OrderQuestion } from '../components/OrderQuestion';
import { GrammarTopicRoute } from './GrammarLessonPage';

/**
 * Grammar Practice (`/grammar/:topicId/practice`, spec §25): the tense's exercises one by one,
 * then how many were right on the first try. An exercise counts toward the tense's progress once,
 * after a right answer — never when the answer was shown.
 */
export function GrammarPracticePage() {
  return (
    <GrammarGuard>
      <GrammarTopicRoute render={(topic) => <GrammarPractice key={topic.id} topic={topic} />} />
    </GrammarGuard>
  );
}

function GrammarPractice({ topic }: { topic: GrammarTopic }) {
  useDocumentTitle(t('{title} · Practice', { title: topic.title }));
  const [round, setRound] = useState(0);
  return (
    <>
      <TopBar>
        <Breadcrumb
          items={[
            { label: t('Grammar'), to: paths.grammar },
            { label: topic.title, to: paths.grammarTopic(topic.id) },
            { label: t('Practice') },
          ]}
        />
      </TopBar>
      <PageContainer width="narrow" className="flex flex-col gap-5">
        <h1 className="sr-only">{t('{title} · Practice', { title: topic.title })}</h1>
        <PracticeRound key={round} topic={topic} onAgain={() => setRound((value) => value + 1)} />
      </PageContainer>
    </>
  );
}

function PracticeRound({ topic, onAgain }: { topic: GrammarTopic; onAgain: () => void }) {
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<Record<string, GrammarResult>>({});
  const total = topic.exercises.length;
  const exercise = topic.exercises[index];
  const finished = index >= total;

  const onResult = (result: GrammarResult) => {
    if (!exercise) return;
    setResults((current) => ({ ...current, [exercise.id]: result }));
    if (result !== 'shown') {
      useGrammarProgressStore.getState().completeExercise(topic.id, exercise.id);
    }
  };
  const next = () => {
    if (index === total - 1 && useSettingsStore.getState().settings.soundEnabled) {
      playSfx('completed');
    }
    setIndex((value) => value + 1);
  };

  if (finished) {
    const firstTry = Object.values(results).filter((result) => result === 'first-try').length;
    return (
      <section className="flex animate-pop-in flex-col items-center gap-4 rounded-[1.25rem] bg-white p-6 text-center shadow-lift sm:p-8">
        <PartyPopper aria-hidden className="size-12 text-sun-500" />
        <h2 className="text-3xl font-extrabold text-navy-900">{t('Practice done!')}</h2>
        <p role="status" className="text-lg font-semibold text-navy-600">
          {t('{count} of {total} right on the first try.', { count: firstTry, total })}
        </p>
        <div className="mt-2 flex w-full flex-col gap-3">
          <Button
            size="lg"
            fullWidth
            leftIcon={<RotateCcw aria-hidden className="size-5" />}
            onClick={onAgain}
          >
            {t('Practice Again')}
          </Button>
          <div className="flex flex-col gap-3 sm:flex-row">
            <ButtonLink
              to={paths.grammarTopic(topic.id)}
              size="lg"
              variant="secondary"
              className="sm:flex-1"
              leftIcon={<ArrowLeft aria-hidden className="size-5" strokeWidth={2.5} />}
            >
              {t('Back to the Lesson')}
            </ButtonLink>
            <ButtonLink
              to={paths.grammar}
              size="lg"
              variant="soft"
              className="sm:flex-1"
              leftIcon={<LayoutGrid aria-hidden className="size-5" />}
            >
              {t('All Tenses')}
            </ButtonLink>
          </div>
        </div>
      </section>
    );
  }

  const answered = exercise.id in results;
  return (
    <>
      <div className="flex items-center gap-4">
        <p className="shrink-0 text-base font-bold text-navy-800">
          {t('Question {number} of {total}', { number: index + 1, total })}
        </p>
        <ProgressBar value={(index / total) * 100} label={t('Practice progress')} />
      </div>
      <section className="rounded-[1.25rem] bg-white p-5 shadow-lift sm:p-7">
        {exercise.kind === 'order' ? (
          <OrderQuestion key={exercise.id} exercise={exercise} onResult={onResult} />
        ) : (
          <ChooseQuestion key={exercise.id} exercise={exercise} onResult={onResult} />
        )}
      </section>
      {answered && (
        <Button
          size="lg"
          fullWidth
          rightIcon={<ArrowRight aria-hidden className="size-5" strokeWidth={2.5} />}
          onClick={next}
          autoFocus
        >
          {index === total - 1 ? t('See My Result') : t('Next Question')}
        </Button>
      )}
    </>
  );
}
