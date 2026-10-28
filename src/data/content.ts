import { SCENE_GROUPS } from '@/config/app';
import type { Conversation, Scene, SceneGroup, SceneHotspot, Speaker, Word } from '@/types/models';
import conversationsJson from './conversations.json';
import speakersJson from './speakers.json';
import wordsJson from './words.json';

/**
 * Static learning content bundled with the app (spec §10): no API, no database.
 * Add a scene by dropping a JSON file into `src/data/scenes/` — it is picked up automatically.
 * `npm run content:check` validates every reference and asset path.
 */

const sceneModules = import.meta.glob<Scene>('./scenes/*.json', { eager: true, import: 'default' });

export interface ContentBundle {
  scenes: readonly Scene[];
  words: Readonly<Record<string, Word>>;
  conversations: readonly Conversation[];
  speakers: Readonly<Record<string, Speaker>>;
}

const groupIndex = (group: SceneGroup) => SCENE_GROUPS.findIndex((item) => item.id === group);

function compareScenes(a: Scene, b: Scene): number {
  return (
    groupIndex(a.group) - groupIndex(b.group) || a.order - b.order || a.title.localeCompare(b.title)
  );
}

export const content: ContentBundle = {
  scenes: Object.values(sceneModules).sort(compareScenes),
  words: wordsJson as Record<string, Word>,
  conversations: conversationsJson as Conversation[],
  speakers: speakersJson as Record<string, Speaker>,
};

const scenesById = new Map(content.scenes.map((scene) => [scene.id, scene]));
const conversationsById = new Map(content.conversations.map((item) => [item.id, item]));
const allWordIds = Object.keys(content.words);

export function getScenes(): readonly Scene[] {
  return content.scenes;
}

export function getScene(sceneId: string | undefined): Scene | undefined {
  return sceneId ? scenesById.get(sceneId) : undefined;
}

/** A scene can be opened only when it has real content (spec §7.1 "Coming soon"). */
export function isSceneAvailable(scene: Scene): boolean {
  return scene.status === 'available' && scene.wordIds.length > 0;
}

export interface SceneGroupWithScenes {
  id: SceneGroup;
  title: string;
  icon?: string;
  scenes: Scene[];
}

/** Title of the scene's group, e.g. "Home" for the Bedroom (breadcrumbs). */
export function getSceneGroupTitle(scene: Scene): string {
  return SCENE_GROUPS.find((group) => group.id === scene.group)?.title ?? scene.group;
}

/** Scene groups in display order, skipping empty groups. */
export function getSceneGroups(): SceneGroupWithScenes[] {
  return SCENE_GROUPS.map((group) => ({
    ...group,
    scenes: content.scenes.filter((scene) => scene.group === group.id),
  })).filter((group) => group.scenes.length > 0);
}

export function getWord(wordId: string | undefined): Word | undefined {
  return wordId ? content.words[wordId] : undefined;
}

export function getAllWordIds(): readonly string[] {
  return allWordIds;
}

/** Words of a scene in the scene's order (flashcard order). */
export function getSceneWords(scene: Scene): Word[] {
  return scene.wordIds.map((id) => content.words[id]).filter((word): word is Word => !!word);
}

export function getHotspot(scene: Scene, wordId: string): SceneHotspot | undefined {
  return scene.hotspots.find((hotspot) => hotspot.wordId === wordId);
}

export function getConversation(conversationId: string | undefined): Conversation | undefined {
  return conversationId ? conversationsById.get(conversationId) : undefined;
}

/** Conversations of a scene, sorted by `order`. Shared by Vocabulary and Conversation menus. */
export function getSceneConversations(scene: Scene): Conversation[] {
  return scene.conversationIds
    .map((id) => conversationsById.get(id))
    .filter((item): item is Conversation => !!item)
    .sort((a, b) => a.order - b.order);
}

export function getSpeaker(speakerId: string): Speaker | undefined {
  return content.speakers[speakerId];
}
