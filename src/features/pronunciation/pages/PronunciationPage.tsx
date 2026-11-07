import { useMemo } from 'react';
import { paths } from '@/app/paths';
import { PageContainer, PageTitle, TopBar } from '@/components/layout/PageHeader';
import { getSceneGroups, isSceneAvailable } from '@/data/content';
import { SceneCard } from '@/features/vocabulary/components/SceneCard';
import { SceneGroupSection } from '@/features/vocabulary/components/SceneGroupSection';
import { VocabularyBackdrop } from '@/features/vocabulary/components/VocabularyBackdrop';
import { useOpenGroups } from '@/features/vocabulary/useOpenGroups';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { t } from '@/i18n';
import { getSceneSpeakingStats } from '@/lib/speakingProgress';
import { useSpeakingProgressStore } from '@/stores/speakingProgressStore';
import type { Scene } from '@/types/models';

/**
 * A scene with the share of its words said well (best score ≥ 80, spec §24.1). This is the
 * pronunciation figure only: it never changes the Vocabulary % or the Level.
 */
function PronunciationSceneCard({ scene }: { scene: Scene }) {
  const speaking = useSpeakingProgressStore((state) => state.speaking);
  const { total, saidWell, percent } = useMemo(
    () => getSceneSpeakingStats(speaking, scene.wordIds),
    [speaking, scene.wordIds],
  );
  return (
    <SceneCard
      scene={scene}
      to={isSceneAvailable(scene) ? paths.pronunciationScene(scene.id) : undefined}
      progress={{
        percent,
        valueText: `${percent}%`,
        srText: t('{count}/{total} words said well, {percent}%', {
          count: saidWell,
          total,
          percent,
        }),
      }}
    />
  );
}

/**
 * Pronunciation (`/pronunciation`, spec §24): the scenes, grouped like the Vocabulary list; a card
 * opens Word Speaking for that scene.
 */
export function PronunciationPage() {
  useDocumentTitle(t('Pronunciation'));
  const groups = getSceneGroups();
  const { isOpen, toggle } = useOpenGroups(groups);

  return (
    <div className="relative flex h-[calc(100dvh-var(--mobile-nav-height))] flex-col md:h-dvh">
      <VocabularyBackdrop />
      <TopBar variant="title" transparent>
        <PageTitle
          title={t('Pronunciation')}
          description={t('Say the words of each scene and get a speaking score.')}
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
                <PronunciationSceneCard key={scene.id} scene={scene} />
              ))}
            </SceneGroupSection>
          ))}
        </PageContainer>
      </div>
    </div>
  );
}
