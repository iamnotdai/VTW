import { SCENE_GROUPS } from '@/config/app';
import { getActiveCourse } from '@/lib/course';
import { ipaSpellings, tokenizeIpa, type IpaSymbol } from '@/lib/ipa';
import { tokenizePinyin } from '@/lib/pinyinChart';
import type { SoundTokens } from '@/lib/soundChart';
import { t } from '@/i18n';
import type {
  Conversation,
  CourseId,
  GrammarTopic,
  ChartSound,
  Scene,
  SceneGroup,
  SceneHotspot,
  SoundChart,
  Speaker,
  Word,
} from '@/types/models';
import conversationsJson from './conversations.json';
import ipaJson from './pronunciation/ipa.json';
import speakersJson from './speakers.json';
import wordsJson from './words.json';
import zhConversationsJson from './zh/conversations.json';
import zhScenesJson from './zh/scenes.json';
import zhSpeakersJson from './zh/speakers.json';
import zhPinyinJson from './zh/pinyin.json';
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
/** English course grammar (spec §25): one file per tense, picked up automatically. */
const grammarModules = import.meta.glob<GrammarTopic>('./grammar/*.json', {
  eager: true,
  import: 'default',
});

export interface ContentBundle {
  scenes: readonly Scene[];
  words: Readonly<Record<string, Word>>;
  conversations: readonly Conversation[];
  speakers: Readonly<Record<string, Speaker>>;
  /** The sound chart of Pronunciation (spec §24.2): IPA (English) or pinyin (Chinese). */
  soundChart: SoundChart;
  /** The 12 tenses (spec §25); empty for courses without Grammar. */
  grammarTopics: readonly GrammarTopic[];
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

/** Chart order: past, present, future × simple, continuous, perfect, perfect continuous. */
export const GRAMMAR_TIMES = ['past', 'present', 'future'] as const;
export const GRAMMAR_ASPECTS = ['simple', 'continuous', 'perfect', 'perfect-continuous'] as const;

function sortGrammarTopics(topics: GrammarTopic[]): GrammarTopic[] {
  const rank = (topic: GrammarTopic) =>
    GRAMMAR_TIMES.indexOf(topic.time) * GRAMMAR_ASPECTS.length +
    GRAMMAR_ASPECTS.indexOf(topic.aspect);
  return [...topics].sort((a, b) => rank(a) - rank(b));
}

function translateScenes(texts: Readonly<Record<string, SceneText>>): Scene[] {
  return sharedScenes.map((scene) => ({ ...scene, ...texts[scene.id] }));
}

export const contentByCourse: Readonly<Record<CourseId, ContentBundle>> = {
  en: {
    scenes: sharedScenes,
    words: wordsJson as Record<string, Word>,
    conversations: conversationsJson as Conversation[],
    speakers: speakersJson as Record<string, Speaker>,
    soundChart: { kind: 'ipa', sounds: ipaJson as ChartSound[] },
    grammarTopics: sortGrammarTopics(Object.values(grammarModules)),
  },
  zh: {
    scenes: translateScenes(zhScenesJson as Record<string, SceneText>),
    words: zhWordsJson as Record<string, Word>,
    conversations: zhConversationsJson as Conversation[],
    speakers: zhSpeakersJson as Record<string, Speaker>,
    soundChart: { kind: 'pinyin', sounds: zhPinyinJson as ChartSound[] },
    grammarTopics: [],
  },
};

interface ContentIndex {
  scenesById: Map<string, Scene>;
  conversationsById: Map<string, Conversation>;
  allWordIds: readonly string[];
  /** IPA chart: its spellings, longest first. */
  ipaSpellings: readonly IpaSymbol[];
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
      ipaSpellings: bundle.soundChart.kind === 'ipa' ? ipaSpellings(bundle.soundChart.sounds) : [],
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

/* -------------------------------------------------------------------------------------------------
 * Sound chart (spec §24.2): IPA in the English course, pinyin in the Chinese course.
 * -----------------------------------------------------------------------------------------------*/

export function getSoundChart(): SoundChart {
  return getContent().soundChart;
}

export function getChartSounds(): readonly ChartSound[] {
  return getSoundChart().sounds;
}

export function getChartSound(soundId: string | undefined): ChartSound | undefined {
  return soundId ? getChartSounds().find((sound) => sound.id === soundId) : undefined;
}

const hanCount = (text: string) =>
  Array.from(text).filter((char) => /\p{Script=Han}/u.test(char)).length;

/** How a word (or extra example) is written in the chart: its IPA, or its pinyin. */
export function chartTranscription(entry: { ipa?: string; pinyin?: string }): string | undefined {
  return getSoundChart().kind === 'ipa' ? entry.ipa : entry.pinyin;
}

/**
 * A transcription cut into chart sounds. `text` (the word itself) tells how many syllables a
 * Chinese word has, which picks the right cut of joined pinyin.
 */
export function getSoundTokens(transcription: string, text?: string): SoundTokens {
  const chart = getSoundChart();
  if (chart.kind === 'ipa') return tokenizeIpa(transcription, getIndex().ipaSpellings);
  const syllables = text ? hanCount(text) : 0;
  return tokenizePinyin(transcription, chart.sounds, syllables > 0 ? syllables : undefined);
}

/**
 * Words of the open scenes that have the sound, in scene and flashcard order (each written word once):
 * the chart's example words, with their picture. IPA: words with the sound's own symbol come
 * first, words that only have an alias (the short "i" of "balcony" for /iː/) after.
 */
export function getChartSoundWords(sound: ChartSound, limit = Infinity): Word[] {
  const ipa = getSoundChart().kind === 'ipa';
  const main: Word[] = [];
  const aliasOnly: Word[] = [];
  // Each word once — also two scenes' words written the same ("window" in two scenes).
  const seen = new Set<string>();
  for (const scene of getScenes()) {
    if (!isSceneAvailable(scene)) continue;
    for (const word of getSceneWords(scene)) {
      const transcription = chartTranscription(word);
      const key = word.text.trim().toLowerCase();
      if (seen.has(key) || !transcription) continue;
      seen.add(key);
      const tokens = getSoundTokens(transcription, word.text).tokens.filter(
        (token) => token.soundId === sound.id,
      );
      if (tokens.length === 0) continue;
      const usesSymbol =
        !ipa ||
        tokens.some((token) => transcription.slice(token.start, token.end) === sound.symbol);
      (usesSymbol ? main : aliasOnly).push(word);
      if (main.length >= limit) return main;
    }
  }
  return [...main, ...aliasOnly].slice(0, limit);
}

/* -------------------------------------------------------------------------------------------------
 * Grammar (spec §25), English course only.
 * -----------------------------------------------------------------------------------------------*/

export function getGrammarTopics(): readonly GrammarTopic[] {
  return getContent().grammarTopics;
}

export function getGrammarTopic(topicId: string | undefined): GrammarTopic | undefined {
  return topicId ? getGrammarTopics().find((topic) => topic.id === topicId) : undefined;
}

/** A tense can be opened only when it has a lesson (like a scene, spec §7.1 "Coming soon"). */
export function isGrammarTopicAvailable(topic: GrammarTopic): boolean {
  return topic.status === 'available' && topic.exercises.length > 0;
}
