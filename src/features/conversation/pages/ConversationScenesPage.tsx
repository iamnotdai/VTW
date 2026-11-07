import { paths } from '@/app/paths';
import { PageContainer, PageTitle, TopBar } from '@/components/layout/PageHeader';
import { getSceneConversations, getSceneGroups, isSceneAvailable } from '@/data/content';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { t } from '@/i18n';
import type { Scene } from '@/types/models';
import { SceneCard } from '@/features/vocabulary/components/SceneCard';
import { SceneGroupSection } from '@/features/vocabulary/components/SceneGroupSection';
import { useOpenGroups } from '@/features/vocabulary/useOpenGroups';
import { VocabularyBackdrop } from '@/features/vocabulary/components/VocabularyBackdrop';

/** A scene card without progress: it opens the scene's conversations. */
function ConversationSceneCard({ scene }: { scene: Scene }) {
  const available = isSceneAvailable(scene) && getSceneConversations(scene).length > 0;
  return <SceneCard scene={scene} to={available ? paths.conversationScene(scene.id) : undefined} />;
}

/**
 * Screen 14 — Conversation Scene List (`/conversation`): the same collapsible areas and scene cards
 * as the Vocabulary list, (no progress here).
 * A card opens the scene's conversations.
 */
export function ConversationScenesPage() {
  useDocumentTitle(t('Conversation'));
  const groups = getSceneGroups();
  const { isOpen, toggle } = useOpenGroups(groups);

  return (
    <div className="relative flex h-[calc(100dvh-var(--mobile-nav-height))] flex-col md:h-dvh">
      <VocabularyBackdrop />
      <TopBar variant="title" transparent>
        <PageTitle
          title={t('Conversation')}
          description={t('Watch, listen and practice real conversations.')}
          descriptionClassName="font-semibold text-navy-700"
        />
      </TopBar>
      <div className="relative min-h-0 flex-1 overflow-y-auto">
        <PageContainer width="full" className="flex flex-col">
          {groups.map((group) => (
            <SceneGroupSection
              key={group.id}
              group={group}
              open={isOpen(group.id)}
              onToggle={() => toggle(group.id)}
            >
              {group.scenes.map((scene) => (
                <ConversationSceneCard key={scene.id} scene={scene} />
              ))}
            </SceneGroupSection>
          ))}
        </PageContainer>
      </div>
    </div>
  );
}
