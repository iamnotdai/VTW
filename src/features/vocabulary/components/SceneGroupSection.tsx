import { ChevronDown } from 'lucide-react';
import type { ReactNode } from 'react';
import { SCENE_GRID_CLASS } from '@/config/app';
import type { SceneGroupWithScenes } from '@/data/content';
import { t } from '@/i18n';
import { cn } from '@/lib/cn';
import { GroupIcon } from './GroupIcon';

/**
 * One collapsible area: a white bar (picture, title, scene count, chevron) over its scene cards.
 * Used by the Vocabulary and Conversation scene lists; `children` are the cards.
 */
export function SceneGroupSection({
  group,
  open,
  onToggle,
  children,
}: {
  group: SceneGroupWithScenes;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  const titleId = `group-${group.id}-title`;
  const panelId = `group-${group.id}-panel`;
  const count = group.scenes.length;
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
            {count === 1 ? t('{count} scene', { count }) : t('{count} scenes', { count })}
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
        <div className={SCENE_GRID_CLASS}>{children}</div>
      </div>
    </section>
  );
}
