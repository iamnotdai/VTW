import { useParams } from 'react-router';
import { getScene, getWord, isSceneAvailable } from '@/data/content';
import type { Scene, Word } from '@/types/models';

export type SceneParamResult =
  | { status: 'ok'; scene: Scene }
  | { status: 'coming-soon'; scene: Scene }
  | { status: 'not-found' };

/** Reads `:sceneId` and tells whether the scene can be opened. */
export function useSceneParam(): SceneParamResult {
  const { sceneId } = useParams();
  const scene = getScene(sceneId);
  if (!scene) return { status: 'not-found' };
  return isSceneAvailable(scene) ? { status: 'ok', scene } : { status: 'coming-soon', scene };
}

/** Reads `:wordId` and checks that the word belongs to the scene. */
export function useSceneWordParam(scene: Scene | undefined): Word | undefined {
  const { wordId } = useParams();
  if (!scene || !wordId || !scene.wordIds.includes(wordId)) return undefined;
  return getWord(wordId);
}
