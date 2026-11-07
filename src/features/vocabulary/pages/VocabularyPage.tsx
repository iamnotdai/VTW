import { paths } from '@/app/paths';
import { PageContainer, PageTitle, TopBar } from '@/components/layout/PageHeader';
import { getSceneGroups, isSceneAvailable } from '@/data/content';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { t } from '@/i18n';
import type { Scene } from '@/types/models';
import { SceneCard } from '../components/SceneCard';
import { SceneGroupSection } from '../components/SceneGroupSection';
import { useOpenGroups } from '../useOpenGroups';
import { VocabularyBackdrop } from '../components/VocabularyBackdrop';
import { useSceneProgress } from '../useSceneProgress';

/** A scene with its learned-word percentage (never hard-coded, spec §7.1). */
function VocabularySceneCard({ scene }: { scene: Scene }) {
  const { total, completed, percent } = useSceneProgress(scene);
  return (
    <SceneCard
      scene={scene}
      to={isSceneAvailable(scene) ? paths.topic(scene.id) : undefined}
      progress={{
        percent,
        valueText: `${percent}%`,
        srText: t('{completed}/{total} words learned, {percent}% completed', {
          completed,
          total,
          percent,
        }),
      }}
    />
  );
}

/** Screen 03 — Vocabulary Scene List (`/vocabulary`), grouped by area (spec §7.1). */
export function VocabularyPage() {
  useDocumentTitle(t('Vocabulary'));
  const groups = getSceneGroups();
  const { isOpen, toggle } = useOpenGroups(groups);

  return (
    <div className="relative flex h-[calc(100dvh-var(--mobile-nav-height))] flex-col md:h-dvh">
      <VocabularyBackdrop />
      <TopBar variant="title" transparent>
        <PageTitle
          title={t('Vocabulary')}
          description={t('Explore real-world scenes and learn English.')}
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
                <VocabularySceneCard key={scene.id} scene={scene} />
              ))}
            </SceneGroupSection>
          ))}
        </PageContainer>
      </div>
    </div>
  );
}
