import { paths } from '@/app/paths';
import {
  Breadcrumb,
  PageContainer,
  PageTitle,
  TopBar,
  type Crumb,
} from '@/components/layout/PageHeader';
import { getSceneConversations, getSceneGroupTitle } from '@/data/content';
import { ConversationRow } from '@/features/conversation/components/ConversationRow';
import { ComingSoonPage, NotFoundPage } from '@/features/misc/NotFoundPage';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { t } from '@/i18n';
import { useProgressStore } from '@/stores/progressStore';
import type { Scene } from '@/types/models';
import { useSceneParam } from '../useSceneParam';

/** Which menu the list was opened from: it decides the breadcrumb and where a row leads. */
export type ConversationListMenu = 'vocabulary' | 'conversation';

/**
 * Screen 09 — Topic Conversations List: the conversations of one scene. Reached from the Topic
 * Overview (`/vocabulary/:sceneId/conversations`) and from a scene card of the Conversation menu
 * (`/conversation/scene/:sceneId`). Both open the same conversation pages (one dataset, spec §4).
 */
export function TopicConversationsPage({ menu = 'vocabulary' }: { menu?: ConversationListMenu }) {
  const result = useSceneParam();
  if (result.status === 'not-found') return <NotFoundPage />;
  if (result.status === 'coming-soon') return <ComingSoonPage title={result.scene.title} />;
  return <TopicConversations scene={result.scene} menu={menu} />;
}

function TopicConversations({ scene, menu }: { scene: Scene; menu: ConversationListMenu }) {
  useDocumentTitle(t('{scene} · Conversations', { scene: scene.title }));
  const completedIds = useProgressStore((state) => state.progress.completedConversationIds);
  const conversations = getSceneConversations(scene);
  const upNextId = conversations.find((item) => !completedIds.includes(item.id))?.id;

  const crumbs: Crumb[] =
    menu === 'conversation'
      ? [
          { label: t('Conversation'), to: paths.conversations },
          { label: getSceneGroupTitle(scene) },
          { label: scene.title },
        ]
      : [
          { label: t('Vocabulary'), to: paths.vocabulary },
          { label: getSceneGroupTitle(scene), to: `${paths.vocabulary}#group-${scene.group}` },
          { label: scene.title, to: paths.topic(scene.id) },
          { label: t('Conversations') },
        ];

  return (
    <>
      <TopBar>
        <Breadcrumb items={crumbs} />
      </TopBar>
      <PageContainer width="full" className="max-w-4xl lg:mx-0">
        <PageTitle
          title={t('{scene} Conversations', { scene: scene.title })}
          description={t('{count} conversations in this scene.', {
            count: conversations.length,
          })}
        />
        <ol className="mt-6 flex flex-col gap-2.5">
          {conversations.map((conversation) => (
            <li key={conversation.id}>
              <ConversationRow
                conversation={conversation}
                to={
                  menu === 'conversation'
                    ? paths.conversation(conversation.id)
                    : paths.conversationVideo(conversation.id)
                }
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
