import { useMemo } from 'react';
import { getCompletedCount, getCompletedWordIds, getSceneProgressPercent } from '@/lib/progress';
import { useProgressStore } from '@/stores/progressStore';
import type { Scene } from '@/types/models';

const NONE: readonly string[] = Object.freeze([]);

/** Learned-word statistics of a scene, computed from the stored completed ids (never hard-coded). */
export function useSceneProgress(scene: Scene | undefined) {
  const completedIds = useProgressStore((state) =>
    scene ? getCompletedWordIds(state.progress, scene.id) : NONE,
  );
  return useMemo(() => {
    const total = scene?.wordIds.length ?? 0;
    const completed = scene ? getCompletedCount(scene.wordIds, completedIds) : 0;
    const percent = scene ? getSceneProgressPercent(scene.wordIds, completedIds) : 0;
    return { total, completed, percent, completedIds: new Set(completedIds) };
  }, [scene, completedIds]);
}
