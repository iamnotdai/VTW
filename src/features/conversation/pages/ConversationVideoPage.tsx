import { ArrowRight, PartyPopper } from 'lucide-react';
import { useState } from 'react';
import { paths } from '@/app/paths';
import { ButtonLink } from '@/components/common/Button';
import { Breadcrumb, PageContainer, TopBar } from '@/components/layout/PageHeader';
import { getSceneConversations } from '@/data/content';
import { NotFoundPage } from '@/features/misc/NotFoundPage';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { t } from '@/i18n';
import { useProgressStore } from '@/stores/progressStore';
import type { Conversation, Scene } from '@/types/models';
import { ConversationPlayer } from '../components/ConversationPlayer';
import { ListenPlayer } from '../components/ListenPlayer';
import { rolePlayCrumbs } from '../rolePlay';
import { useConversationParam } from '../useConversationParam';

/**
 * Screen 10 — Conversation Video (`/conversation/:conversationId/video`), step ① of the path (spec
 * §9.7): the video, or — while the conversation has none — the whole conversation played over its
 * poster. Watching or listening to the end finishes the step.
 */
export function ConversationVideoPage() {
  const params = useConversationParam();
  if (!params) return <NotFoundPage />;
  return <ConversationVideo {...params} />;
}

function ConversationVideo({ conversation, scene }: { conversation: Conversation; scene: Scene }) {
  useDocumentTitle(t('{title} · Video', { title: conversation.title }));
  const [ended, setEnded] = useState(false);
  const total = getSceneConversations(scene).length;
  const hasVideo = !!(conversation.videoSrc || conversation.youtubeId);

  const finish = () => {
    setEnded(true);
    useProgressStore.getState().completeConversationStep(conversation.id, 'listen');
  };

  return (
    <>
      <TopBar>
        <Breadcrumb items={rolePlayCrumbs(conversation, t('Listen & Watch'))} />
      </TopBar>
      <PageContainer width="default" className="flex flex-col">
        {hasVideo ? (
          <ConversationPlayer conversation={conversation} onEnded={finish} />
        ) : (
          <ListenPlayer conversation={conversation} onEnded={finish} />
        )}

        <h1 className="mt-5 text-[2rem] leading-tight font-extrabold text-navy-900">
          {conversation.title}
        </h1>
        <p className="text-lg font-medium text-navy-400">
          {t('Conversation {number} of {total}', { number: conversation.order, total })}
        </p>

        {ended && (
          <p
            role="status"
            className="mt-4 flex animate-pop-in items-center gap-2 font-bold text-navy-800"
          >
            <PartyPopper aria-hidden className="size-5 text-sun-500" />
            {t('Nice listening! Next, find the missing words.')}
          </p>
        )}

        <ButtonLink
          to={paths.fillBlanks(conversation.id)}
          size="lg"
          fullWidth
          className="mt-5"
          rightIcon={<ArrowRight aria-hidden className="size-5" strokeWidth={2.5} />}
        >
          {t('Next: Fill in the Blanks')}
        </ButtonLink>
      </PageContainer>
    </>
  );
}
