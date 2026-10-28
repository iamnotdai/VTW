import { ArrowRight, CircleCheck, Mic, Play } from 'lucide-react';
import { Link, useLocation } from 'react-router';
import { paths } from '@/app/paths';
import { ButtonLink } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { Breadcrumb, PageContainer, TopBar } from '@/components/layout/PageHeader';
import { getSceneConversations } from '@/data/content';
import { NotFoundPage } from '@/features/misc/NotFoundPage';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { assetUrl } from '@/lib/assets';
import { useProgressStore } from '@/stores/progressStore';
import type { Conversation, Scene } from '@/types/models';
import { ConversationPlayer } from '../components/ConversationPlayer';
import { PlayConversationButton } from '../components/PlayConversationButton';
import { TranscriptViewer } from '../components/TranscriptViewer';
import { useConversationParam } from '../useConversationParam';

/** Screen 15 — Conversation Detail (`/conversation/:conversationId`). */
export function ConversationDetailPage() {
  const params = useConversationParam();
  if (!params) return <NotFoundPage />;
  return <ConversationDetail {...params} />;
}

function ConversationDetail({ conversation, scene }: { conversation: Conversation; scene: Scene }) {
  useDocumentTitle(conversation.title);
  const location = useLocation();
  const justCompleted = (location.state as { completed?: boolean } | null)?.completed === true;
  const completed = useProgressStore((state) =>
    state.progress.completedConversationIds.includes(conversation.id),
  );
  const total = getSceneConversations(scene).length;

  return (
    <>
      <TopBar>
        <Breadcrumb
          items={[
            { label: 'Conversation', to: paths.conversations },
            { label: scene.title, to: paths.topicConversations(scene.id) },
            { label: conversation.title },
          ]}
        />
      </TopBar>
      <PageContainer width="wide" className="flex flex-col gap-5">
        {justCompleted && (
          <div
            role="status"
            className="flex animate-pop-in items-center gap-3 rounded-2xl bg-leaf-500 p-4 font-bold text-white shadow-soft"
          >
            <CircleCheck aria-hidden className="size-6 shrink-0" />
            Lesson complete! You practiced every question in “{conversation.title}”.
          </div>
        )}

        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          <Card className="overflow-hidden p-3">
            {conversation.videoSrc || conversation.youtubeId ? (
              <ConversationPlayer conversation={conversation} />
            ) : (
              <Link
                to={paths.conversationVideo(conversation.id)}
                className="group relative block aspect-video overflow-hidden rounded-xl bg-navy-900"
              >
                <img
                  src={assetUrl(conversation.poster)}
                  alt=""
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                  draggable={false}
                />
                <span className="absolute inset-0 flex items-center justify-center bg-navy-950/10">
                  <span className="flex h-14 w-20 items-center justify-center rounded-2xl bg-brand-500 text-white shadow-lift transition group-hover:scale-110">
                    <Play aria-hidden className="ml-1 size-7 fill-current" />
                  </span>
                </span>
                <span className="sr-only">Watch the video</span>
              </Link>
            )}
            <div className="flex items-center gap-3 px-2 pt-3 pb-1">
              <div className="min-w-0 flex-1">
                <h1 className="truncate text-xl font-extrabold text-navy-900">
                  {conversation.title}
                </h1>
                <p className="text-[15px] font-medium text-navy-400">
                  Conversation {conversation.order} of {total}
                  {completed && (
                    <span className="ml-2 inline-flex items-center gap-1 font-bold text-leaf-600">
                      <CircleCheck aria-hidden className="size-4" /> Completed
                    </span>
                  )}
                </p>
              </div>
              <PlayConversationButton conversation={conversation} />
            </div>
          </Card>

          <Card className="p-5 sm:p-6">
            <h2 className="sr-only">Transcript</h2>
            <TranscriptViewer conversation={conversation} variant="compact" />
          </Card>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <ButtonLink
            to={paths.transcript(conversation.id)}
            size="lg"
            rightIcon={<ArrowRight aria-hidden className="size-5" strokeWidth={2.5} />}
          >
            View Conversation
          </ButtonLink>
          <ButtonLink
            to={paths.practice(conversation.id)}
            size="lg"
            variant="secondary"
            leftIcon={<Mic aria-hidden className="size-5" />}
          >
            Practice Speaking
          </ButtonLink>
        </div>
      </PageContainer>
    </>
  );
}
