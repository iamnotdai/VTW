import { useState } from 'react';
import type { SceneGroupWithScenes } from '@/data/content';

/** Which areas are open. The first starts open; the learner opens and closes the others. */
export function useOpenGroups(groups: readonly SceneGroupWithScenes[]) {
  const [openIds, setOpenIds] = useState<ReadonlySet<string>>(
    () => new Set(groups.slice(0, 1).map((group) => group.id)),
  );
  const toggle = (id: string) =>
    setOpenIds((current) => {
      const next = new Set(current);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  return { isOpen: (id: string) => openIds.has(id), toggle };
}
