import { ArrowRight, PartyPopper } from 'lucide-react';
import { useState } from 'react';
import { paths } from '@/app/paths';
import { ButtonLink } from '@/components/common/Button';
import { Breadcrumb, PageContainer, TopBar } from '@/components/layout/PageHeader';
import { getSceneConversations } from '@/data/content';
import { NotFoundPage } from '@/features/misc/NotFoundPage';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import type { Conversation, Scene } from '@/types/models';
import { ConversationPlayer } from '../components/ConversationPlayer';
import { useConversationParam } from '../useConversationParam';

/** Screen 10 — Conversation Video (`/conversation/:conversationId/video`). */
export function ConversationVideoPage() {
  const params = useConversationParam();
  if (!params) return <NotFoundPage />;
  return <ConversationVideo {...params} />;
}

function ConversationVideo({ conversation, scene }: { conversation: Conversation; scene: Scene }) {
  useDocumentTitle(`${conversation.title} · Video`);
  const [ended, setEnded] = useState(false);
  const total = getSceneConversations(scene).length;

  return (
    <>
      <TopBar>
        <Breadcrumb
          items={[
            { label: 'Conversation', to: paths.conversations },
            { label: scene.title, to: paths.topicConversations(scene.id) },
            { label: `${conversation.order}. ${conversation.title}` },
          ]}
        />
      </TopBar>
      <PageContainer width="default" className="flex flex-col">
        <ConversationPlayer conversation={conversation} onEnded={() => setEnded(true)} />

        <h1 className="mt-5 text-[2rem] leading-tight font-extrabold text-navy-900">
          {conversation.title}
        </h1>
        <p className="text-lg font-medium text-navy-400">
          Conversation {conversation.order} of {total}
        </p>

        {ended && (
          <p
            role="status"
            className="mt-4 flex animate-pop-in items-center gap-2 font-bold text-navy-800"
          >
            <PartyPopper aria-hidden className="size-5 text-sun-500" />
            Nice watching! Now read the conversation.
          </p>
        )}

        <ButtonLink
          to={paths.transcript(conversation.id)}
          size="lg"
          fullWidth
          className="mt-5"
          rightIcon={<ArrowRight aria-hidden className="size-5" strokeWidth={2.5} />}
        >
          View Conversation
        </ButtonLink>
      </PageContainer>
    </>
  );
}
