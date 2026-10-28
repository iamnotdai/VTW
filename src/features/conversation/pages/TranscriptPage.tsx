import { ArrowRight } from 'lucide-react';
import { paths } from '@/app/paths';
import { ButtonLink } from '@/components/common/Button';
import { Breadcrumb, PageContainer, TopBar } from '@/components/layout/PageHeader';
import { NotFoundPage } from '@/features/misc/NotFoundPage';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import type { Conversation, Scene } from '@/types/models';
import { TranscriptViewer } from '../components/TranscriptViewer';
import { useConversationParam } from '../useConversationParam';

/** Screen 11 — Conversation Transcript (`/conversation/:conversationId/transcript`). */
export function TranscriptPage() {
  const params = useConversationParam();
  if (!params) return <NotFoundPage />;
  return <Transcript {...params} />;
}

function Transcript({ conversation, scene }: { conversation: Conversation; scene: Scene }) {
  useDocumentTitle(`${conversation.title} · Transcript`);

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
      {/* The content starts under the folded menu card, as in the design. */}
      <div className="md:pt-24">
        <PageContainer width="narrow">
          <h1 className="sr-only">{conversation.title} — transcript</h1>
          <TranscriptViewer conversation={conversation} />
          <ButtonLink
            to={paths.practice(conversation.id)}
            size="lg"
            fullWidth
            className="mt-8"
            rightIcon={<ArrowRight aria-hidden className="size-5" strokeWidth={2.5} />}
          >
            Practice Speaking
          </ButtonLink>
        </PageContainer>
      </div>
    </>
  );
}
