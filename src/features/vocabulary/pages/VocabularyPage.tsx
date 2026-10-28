import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { PageContainer, PageTitle, TopBar } from '@/components/layout/PageHeader';
import { SCENE_GRID_CLASS } from '@/config/app';
import { getSceneGroups, type SceneGroupWithScenes } from '@/data/content';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { cn } from '@/lib/cn';
import { GroupIcon } from '../components/GroupIcon';
import { SceneCard } from '../components/SceneCard';
import { VocabularyBackdrop } from '../components/VocabularyBackdrop';

/** One collapsible area: a white bar (picture, title, scene count, chevron) over its scene cards. */
function GroupSection({
  group,
  open,
  onToggle,
}: {
  group: SceneGroupWithScenes;
  open: boolean;
  onToggle: () => void;
}) {
  const titleId = `group-${group.id}-title`;
  const panelId = `group-${group.id}-panel`;
  return (
    <section id={`group-${group.id}`} aria-labelledby={titleId} className="mb-4 scroll-mt-6">
      <h2 id={titleId}>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={onToggle}
          className="flex w-full items-center gap-3 rounded-2xl bg-white/95 px-4 py-3 text-left shadow-soft transition hover:bg-white"
        >
          <GroupIcon icon={group.icon} />
          <span className="min-w-0 flex-1 truncate text-[1.75rem] font-extrabold text-navy-900">
            {group.title}
          </span>
          <span className="text-base font-semibold text-navy-700">
            {group.scenes.length} {group.scenes.length === 1 ? 'scene' : 'scenes'}
          </span>
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
            <ChevronDown
              aria-hidden
              className={cn('size-6 transition-transform', open && 'rotate-180')}
              strokeWidth={2.5}
            />
          </span>
        </button>
      </h2>
      <div id={panelId} hidden={!open} className="mt-4">
        <div className={SCENE_GRID_CLASS}>
          {group.scenes.map((scene) => (
            <SceneCard key={scene.id} scene={scene} />
          ))}
        </div>
      </div>
    </section>
  );
}

/** Screen 03 — Vocabulary Scene List (`/vocabulary`), grouped by area (spec §7.1). */
export function VocabularyPage() {
  useDocumentTitle('Vocabulary');
  const groups = getSceneGroups();
  // The first group starts open; the learner opens and closes the others one by one.
  const [openIds, setOpenIds] = useState<ReadonlySet<string>>(
    () => new Set(groups.slice(0, 1).map((group) => group.id)),
  );

  const toggle = (id: string) =>
    setOpenIds((current) => {
      const next = new Set(current);
      if (!next.delete(id)) next.add(id);
      return next;
    });

  return (
    <div className="relative flex h-[calc(100dvh-var(--mobile-nav-height))] flex-col md:h-dvh">
      <VocabularyBackdrop />
      <TopBar variant="title" transparent>
        <PageTitle
          title="Vocabulary"
          description="Explore real-world scenes and learn English."
          descriptionClassName="font-semibold text-navy-700"
        />
      </TopBar>
      <div className="relative min-h-0 flex-1 overflow-y-auto">
        <PageContainer width="full" className="flex flex-col">
          {groups.map((group) => (
            <GroupSection
              key={group.id}
              group={group}
              open={openIds.has(group.id)}
              onToggle={() => toggle(group.id)}
            />
          ))}
        </PageContainer>
      </div>
    </div>
  );
}
