import { paths } from '@/app/paths';
import { Breadcrumb, PageContainer, PageTitle, TopBar } from '@/components/layout/PageHeader';
import { getSceneConversations, getSceneGroupTitle } from '@/data/content';
import { ConversationRow } from '@/features/conversation/components/ConversationRow';
import { ComingSoonPage, NotFoundPage } from '@/features/misc/NotFoundPage';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useProgressStore } from '@/stores/progressStore';
import type { Scene } from '@/types/models';
import { useSceneParam } from '../useSceneParam';

/**
 * Screen 09 — Topic Conversations List (`/vocabulary/:sceneId/conversations`).
 * Opens the same conversation pages as the Conversation menu (one shared dataset, spec §4).
 */
export function TopicConversationsPage() {
  const result = useSceneParam();
  if (result.status === 'not-found') return <NotFoundPage />;
  if (result.status === 'coming-soon') return <ComingSoonPage title={result.scene.title} />;
  return <TopicConversations scene={result.scene} />;
}

function TopicConversations({ scene }: { scene: Scene }) {
  useDocumentTitle(`${scene.title} · Conversations`);
  const completedIds = useProgressStore((state) => state.progress.completedConversationIds);
  const conversations = getSceneConversations(scene);
  const upNextId = conversations.find((item) => !completedIds.includes(item.id))?.id;

  return (
    <>
      <TopBar>
        <Breadcrumb
          items={[
            { label: 'Vocabulary', to: paths.vocabulary },
            { label: getSceneGroupTitle(scene), to: `${paths.vocabulary}#group-${scene.group}` },
            { label: scene.title, to: paths.topic(scene.id) },
            { label: 'Conversations' },
          ]}
        />
      </TopBar>
      <PageContainer width="full" className="max-w-4xl lg:mx-0">
        <PageTitle
          title={`${scene.title} Conversations`}
          description={`${conversations.length} conversations in this scene.`}
        />
        <ol className="mt-6 flex flex-col gap-2.5">
          {conversations.map((conversation) => (
            <li key={conversation.id}>
              <ConversationRow
                conversation={conversation}
                to={paths.conversationVideo(conversation.id)}
                completed={completedIds.includes(conversation.id)}
                upNext={conversation.id === upNextId}
              />
            </li>
          ))}
        </ol>
      </PageContainer>
    </>
  );
}
