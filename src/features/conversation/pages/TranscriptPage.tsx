import { ArrowRight, Mic } from 'lucide-react';
import { paths } from '@/app/paths';
import { ButtonLink } from '@/components/common/Button';
import { Breadcrumb, PageContainer, TopBar } from '@/components/layout/PageHeader';
import { NotFoundPage } from '@/features/misc/NotFoundPage';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { t } from '@/i18n';
import { useProgressStore } from '@/stores/progressStore';
import type { Conversation, Scene } from '@/types/models';
import { TranscriptViewer } from '../components/TranscriptViewer';
import { useConversationParam } from '../useConversationParam';

/**
 * Screen 11 — Conversation Transcript (`/conversation/:conversationId/transcript`), step ③ of the
 * path (spec §9.7): read every line. Going on to speak at the end finishes the step.
 */
export function TranscriptPage() {
  const params = useConversationParam();
  if (!params) return <NotFoundPage />;
  return <Transcript {...params} />;
}

function Transcript({ conversation, scene }: { conversation: Conversation; scene: Scene }) {
  useDocumentTitle(t('{title} · Transcript', { title: conversation.title }));
  const finishReading = () =>
    useProgressStore.getState().completeConversationStep(conversation.id, 'read');

  return (
    <>
      <TopBar>
        <Breadcrumb
          items={[
            { label: t('Conversation'), to: paths.conversations },
            { label: scene.title, to: paths.conversationScene(scene.id) },
            { label: conversation.title, to: paths.conversation(conversation.id) },
          ]}
        />
      </TopBar>
      {/* The content starts under the folded menu card, as in the design. */}
      <div className="md:pt-24">
        <PageContainer width="narrow">
          <h1 className="sr-only">{t('{title} — transcript', { title: conversation.title })}</h1>
          <TranscriptViewer conversation={conversation} />
          <ButtonLink
            to={paths.rolePlay(conversation.id)}
            onClick={finishReading}
            size="lg"
            fullWidth
            className="mt-8"
            rightIcon={<ArrowRight aria-hidden className="size-5" strokeWidth={2.5} />}
          >
            {t('Next: Role-play')}
          </ButtonLink>
          <ButtonLink
            to={paths.practice(conversation.id)}
            onClick={finishReading}
            size="lg"
            variant="secondary"
            fullWidth
            className="mt-3"
            leftIcon={<Mic aria-hidden className="size-5" />}
          >
            {t('Practice Speaking')}
          </ButtonLink>
        </PageContainer>
      </div>
    </>
  );
}
