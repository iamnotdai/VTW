import { SCENE_GROUPS } from '@/config/app';
import { getActiveCourse } from '@/lib/course';
import { t } from '@/i18n';
import type {
  Conversation,
  CourseId,
  Scene,
  SceneGroup,
  SceneHotspot,
  Speaker,
  Word,
} from '@/types/models';
import conversationsJson from './conversations.json';
import speakersJson from './speakers.json';
import wordsJson from './words.json';
import zhConversationsJson from './zh/conversations.json';
import zhScenesJson from './zh/scenes.json';
import zhSpeakersJson from './zh/speakers.json';
import zhWordsJson from './zh/words.json';

/**
 * Static learning content bundled with the app (spec §10): no API, no database.
 * Add a scene by dropping a JSON file into `src/data/scenes/` — it is picked up automatically.
 * `npm run content:check` validates every reference and asset path.
 *
 * Courses (Settings › Course) share the scenes: pictures, hotspots and word ids. Each course has its
 * own words, conversations and speakers; the English course lives in `src/data/*.json`, the Chinese
 * course in `src/data/zh/` (`scenes.json` there only translates scene titles and descriptions).
 * The lookups below read the active course.
 */

const sceneModules = import.meta.glob<Scene>('./scenes/*.json', { eager: true, import: 'default' });

export interface ContentBundle {
  scenes: readonly Scene[];
  words: Readonly<Record<string, Word>>;
  conversations: readonly Conversation[];
  speakers: Readonly<Record<string, Speaker>>;
}

/** Per-course text of a shared scene. */
type SceneText = Pick<Scene, 'title' | 'description'>;

const groupIndex = (group: SceneGroup) => SCENE_GROUPS.findIndex((item) => item.id === group);

function compareScenes(a: Scene, b: Scene): number {
  return (
    groupIndex(a.group) - groupIndex(b.group) || a.order - b.order || a.title.localeCompare(b.title)
  );
}

const sharedScenes = Object.values(sceneModules).sort(compareScenes);

function translateScenes(texts: Readonly<Record<string, SceneText>>): Scene[] {
  return sharedScenes.map((scene) => ({ ...scene, ...texts[scene.id] }));
}

export const contentByCourse: Readonly<Record<CourseId, ContentBundle>> = {
  en: {
    scenes: sharedScenes,
    words: wordsJson as Record<string, Word>,
    conversations: conversationsJson as Conversation[],
    speakers: speakersJson as Record<string, Speaker>,
  },
  zh: {
    scenes: translateScenes(zhScenesJson as Record<string, SceneText>),
    words: zhWordsJson as Record<string, Word>,
    conversations: zhConversationsJson as Conversation[],
    speakers: zhSpeakersJson as Record<string, Speaker>,
  },
};

interface ContentIndex {
  scenesById: Map<string, Scene>;
  conversationsById: Map<string, Conversation>;
  allWordIds: readonly string[];
}

const indexes = new Map<CourseId, ContentIndex>();

function getIndex(): ContentIndex {
  const course = getActiveCourse();
  let index = indexes.get(course);
  if (!index) {
    const bundle = contentByCourse[course];
    index = {
      scenesById: new Map(bundle.scenes.map((scene) => [scene.id, scene])),
      conversationsById: new Map(bundle.conversations.map((item) => [item.id, item])),
      allWordIds: Object.keys(bundle.words),
    };
    indexes.set(course, index);
  }
  return index;
}

/** Content of the active course. */
export function getContent(): ContentBundle {
  return contentByCourse[getActiveCourse()];
}

export function getScenes(): readonly Scene[] {
  return getContent().scenes;
}

export function getScene(sceneId: string | undefined): Scene | undefined {
  return sceneId ? getIndex().scenesById.get(sceneId) : undefined;
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
  const group = SCENE_GROUPS.find((item) => item.id === scene.group);
  return group ? t(group.title) : scene.group;
}

/** Scene groups in display order, skipping empty groups. */
export function getSceneGroups(): SceneGroupWithScenes[] {
  return SCENE_GROUPS.map((group) => ({
    ...group,
    title: t(group.title),
    scenes: getScenes().filter((scene) => scene.group === group.id),
  })).filter((group) => group.scenes.length > 0);
}

export function getWord(wordId: string | undefined): Word | undefined {
  return wordId ? getContent().words[wordId] : undefined;
}

export function getAllWordIds(): readonly string[] {
  return getIndex().allWordIds;
}

/** Words of a scene in the scene's order (flashcard order). */
export function getSceneWords(scene: Scene): Word[] {
  const { words } = getContent();
  return scene.wordIds.map((id) => words[id]).filter((word): word is Word => !!word);
}

export function getHotspot(scene: Scene, wordId: string): SceneHotspot | undefined {
  return scene.hotspots.find((hotspot) => hotspot.wordId === wordId);
}

export function getConversation(conversationId: string | undefined): Conversation | undefined {
  return conversationId ? getIndex().conversationsById.get(conversationId) : undefined;
}

/** Conversations of a scene, sorted by `order`. Shared by Vocabulary and Conversation menus. */
export function getSceneConversations(scene: Scene): Conversation[] {
  const { conversationsById } = getIndex();
  return scene.conversationIds
    .map((id) => conversationsById.get(id))
    .filter((item): item is Conversation => !!item)
    .sort((a, b) => a.order - b.order);
}

export function getSpeaker(speakerId: string): Speaker | undefined {
  return getContent().speakers[speakerId];
}
