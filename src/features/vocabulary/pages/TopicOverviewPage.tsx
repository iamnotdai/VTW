import { ArrowLeft, ArrowRight, BookOpenText, CircleCheck, MessagesSquare } from 'lucide-react';
import { useEffect, type ReactNode } from 'react';
import { Link } from 'react-router';
import { paths } from '@/app/paths';
import { ButtonLink } from '@/components/common/Button';
import { ProgressRing } from '@/components/common/ProgressBar';
import { PageContainer } from '@/components/layout/PageHeader';
import { getSceneConversations } from '@/data/content';
import { ComingSoonPage, NotFoundPage } from '@/features/misc/NotFoundPage';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { assetUrl } from '@/lib/assets';
import { cn } from '@/lib/cn';
import { useProgressStore } from '@/stores/progressStore';
import type { Scene } from '@/types/models';
import { VocabularyBackdrop } from '../components/VocabularyBackdrop';
import { useSceneParam } from '../useSceneParam';
import { useSceneProgress } from '../useSceneProgress';

/** Screen 04 — Topic Overview (`/vocabulary/:sceneId`): picture + facts card, Back below it. */
export function TopicOverviewPage() {
  const result = useSceneParam();
  if (result.status === 'not-found') return <NotFoundPage />;
  if (result.status === 'coming-soon') return <ComingSoonPage title={result.scene.title} />;
  return <TopicOverview scene={result.scene} />;
}

const STAT =
  'flex min-h-28 flex-col items-center justify-center gap-1 rounded-xl px-2 py-3 text-center';

function Value({ children }: { children: ReactNode }) {
  return <span className="text-2xl leading-none font-extrabold text-navy-900">{children}</span>;
}

function Label({ children }: { children: ReactNode }) {
  return <span className="text-sm font-medium text-navy-500">{children}</span>;
}

function StatLink({ to, tone, children }: { to: string; tone: string; children: ReactNode }) {
  return (
    <Link to={to} className={cn(STAT, tone, 'transition hover:brightness-95')}>
      {children}
    </Link>
  );
}

function TopicOverview({ scene }: { scene: Scene }) {
  useDocumentTitle(`${scene.title} · Vocabulary`);
  const { total, completed, percent } = useSceneProgress(scene);
  const lastIndex = useProgressStore((state) => state.progress.lastFlashcardIndexByScene[scene.id]);
  const visitScene = useProgressStore((state) => state.visitScene);
  const conversationCount = getSceneConversations(scene).length;

  useEffect(() => visitScene(scene.id), [scene.id, visitScene]);

  // "Start Learning" goes to flashcards the first time, then resumes where the learner left off.
  const primary =
    completed === total
      ? { label: 'Review Flashcards', to: paths.flashcards(scene.id) }
      : completed > 0 || (lastIndex ?? 0) >= total - 1
        ? { label: 'Continue Exploring', to: paths.explore(scene.id) }
        : (lastIndex ?? 0) > 0
          ? { label: 'Resume Learning', to: paths.flashcards(scene.id) }
          : { label: 'Start Learning', to: paths.flashcards(scene.id) };

  return (
    <div className="relative flex flex-1 flex-col">
      <VocabularyBackdrop />
      {/* No header here: the card fills the screen with the same margin on every side. */}
      <PageContainer width="full" className="relative flex flex-col gap-5 md:h-dvh">
        <div className="grid gap-5 rounded-3xl bg-white p-4 shadow-soft sm:p-6 md:min-h-0 md:flex-1 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] md:grid-rows-1 md:gap-8">
          <div className="relative overflow-hidden rounded-2xl bg-cream-100">
            <img
              src={assetUrl(scene.background)}
              alt={`The ${scene.title.toLowerCase()} scene`}
              className="aspect-[16/10] size-full object-cover md:absolute md:inset-0 md:aspect-auto"
              draggable={false}
            />
            {percent === 100 && (
              <span className="absolute top-4 left-4 inline-flex items-center gap-2 rounded-full bg-leaf-500 px-4 py-2 font-bold text-white shadow-lift">
                <CircleCheck aria-hidden className="size-5" /> All words learned!
              </span>
            )}
          </div>

          <div className="flex min-h-0 min-w-0 flex-col justify-center md:overflow-y-auto">
            <h1 className="text-[2.25rem] leading-tight font-extrabold text-navy-900">
              {scene.title}
            </h1>
            <p className="mt-1 text-lg font-medium text-navy-400">{scene.description}</p>

            <div className="mt-6 grid grid-cols-3 gap-3">
              <StatLink to={paths.flashcards(scene.id)} tone="bg-brand-50 text-brand-500">
                <BookOpenText aria-hidden className="size-6" />
                <Value>{total}</Value>
                <Label>Words</Label>
              </StatLink>
              <StatLink to={paths.topicConversations(scene.id)} tone="bg-violet-50 text-violet-500">
                <MessagesSquare aria-hidden className="size-6" />
                <Value>{conversationCount}</Value>
                <Label>Conversations</Label>
              </StatLink>
              <div className={cn(STAT, 'bg-leaf-50')}>
                <div className="relative">
                  <ProgressRing value={percent} label={`${scene.title} progress`} size={60} />
                  <span
                    aria-hidden
                    className="absolute inset-0 flex items-center justify-center text-sm font-extrabold text-navy-900"
                  >
                    {percent}%
                  </span>
                </div>
                <Label>Completed</Label>
                <span className="sr-only">
                  {completed}/{total} words learned, {percent}%
                </span>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3">
              <ButtonLink
                to={primary.to}
                size="lg"
                fullWidth
                rightIcon={<ArrowRight aria-hidden className="size-5" strokeWidth={2.5} />}
              >
                {primary.label}
              </ButtonLink>
              <ButtonLink
                to={paths.topicConversations(scene.id)}
                variant="secondary"
                size="lg"
                fullWidth
                rightIcon={<ArrowRight aria-hidden className="size-5" strokeWidth={2.5} />}
              >
                View Conversations
              </ButtonLink>
              <ButtonLink
                to={paths.vocabulary}
                variant="soft"
                size="lg"
                fullWidth
                leftIcon={<ArrowLeft aria-hidden className="size-5" strokeWidth={2.5} />}
              >
                Back
              </ButtonLink>
            </div>
          </div>
        </div>
      </PageContainer>
    </div>
  );
}
