import { SCENE_GROUPS } from '@/config/app';
import { sentenceTiles } from '@/lib/grammar';
import { ipaSpellings, tokenizeIpa } from '@/lib/ipa';
import { tokenizePinyin } from '@/lib/pinyinChart';
import { getPathPoints } from '@/lib/svgPath';
import { normalizeAnswer } from '@/lib/text';
import type { SoundChartKind } from '@/types/models';
import { GRAMMAR_ASPECTS, GRAMMAR_TIMES, type ContentBundle } from './content';

/**
 * Checks the static content (spec §10.3 "Data validation"): references between words, scenes,
 * conversations and speakers; duplicates; hotspot geometry inside the scene's coordinate box.
 * Asset files on disk are checked separately in tests/unit/content.test.ts.
 * Returns human-readable error messages; an empty list means the content is valid.
 */
export function validateContent(bundle: ContentBundle): string[] {
  const errors: string[] = [];
  const wordIds = new Set(Object.keys(bundle.words));
  const groupIds = new Set<string>(SCENE_GROUPS.map((group) => group.id));

  // Words ------------------------------------------------------------------------------------
  for (const [key, word] of Object.entries(bundle.words)) {
    const at = `words.json › "${key}"`;
    if (word.id !== key) errors.push(`${at}: "id" (${word.id}) must equal its key`);
    if (!word.text?.trim()) errors.push(`${at}: "text" is required`);
    if (!word.meaningVi?.trim()) errors.push(`${at}: "meaningVi" is required`);
    if (!word.image?.trim()) errors.push(`${at}: "image" is required`);

    if (!Array.isArray(word.acceptedAnswers) || word.acceptedAnswers.length === 0) {
      errors.push(`${at}: "acceptedAnswers" needs at least one answer`);
    } else {
      const normalized = word.acceptedAnswers.map(normalizeAnswer);
      if (!normalized.includes(normalizeAnswer(word.text ?? '')))
        errors.push(`${at}: "acceptedAnswers" must include the word text "${word.text}"`);
      const duplicates = normalized.filter((value, i) => normalized.indexOf(value) !== i);
      if (duplicates.length > 0)
        errors.push(`${at}: duplicate accepted answers: ${duplicates.join(', ')}`);
    }

    if (!Array.isArray(word.examples) || word.examples.length === 0)
      errors.push(`${at}: needs at least one example sentence`);
    else if (word.examples.some((example) => !example.text?.trim()))
      errors.push(`${at}: every example needs a "text" sentence`);
    else if (word.examples.some((example) => needsPinyin(example.text, example.pinyin)))
      errors.push(`${at}: every Chinese example needs "pinyin" (npm run content:pinyin)`);

    if (
      word.soundsLike !== undefined &&
      (!Array.isArray(word.soundsLike) || word.soundsLike.some((item) => !item?.trim()))
    )
      errors.push(`${at}: "soundsLike" must be a list of words, e.g. ["pair"]`);

    if (needsPinyin(word.text, word.pinyin)) errors.push(`${at}: Chinese words need "pinyin"`);
    if (word.measure !== undefined && !/^\p{Script=Han}$/u.test(word.measure))
      errors.push(`${at}: "measure" must be one Chinese character, e.g. "张"`);

    for (const field of ['relatedWordIds', 'distractorWordIds'] as const) {
      for (const id of word[field] ?? []) {
        if (id === key) errors.push(`${at}: "${field}" must not contain the word itself`);
        else if (!wordIds.has(id)) errors.push(`${at}: "${field}" references unknown word "${id}"`);
      }
    }
  }

  // Speakers ---------------------------------------------------------------------------------
  for (const [key, speaker] of Object.entries(bundle.speakers)) {
    if (speaker.id !== key) errors.push(`speakers.json › "${key}": "id" must equal its key`);
    if (!speaker.name?.trim()) errors.push(`speakers.json › "${key}": "name" is required`);
  }

  // Conversations ----------------------------------------------------------------------------
  const conversationIds = new Set<string>();
  const sceneIds = new Set(bundle.scenes.map((scene) => scene.id));
  for (const conversation of bundle.conversations) {
    const at = `conversations.json › "${conversation.id}"`;
    if (conversationIds.has(conversation.id)) errors.push(`${at}: duplicate conversation id`);
    conversationIds.add(conversation.id);
    if (!conversation.title?.trim()) errors.push(`${at}: "title" is required`);
    if (!conversation.poster?.trim()) errors.push(`${at}: "poster" is required`);
    if (!sceneIds.has(conversation.sceneId))
      errors.push(`${at}: unknown sceneId "${conversation.sceneId}"`);

    if (!Array.isArray(conversation.lines) || conversation.lines.length === 0) {
      errors.push(`${at}: needs at least one dialogue line`);
    } else {
      const lineIds = new Set<string>();
      for (const line of conversation.lines) {
        if (lineIds.has(line.id)) errors.push(`${at}: duplicate line id "${line.id}"`);
        lineIds.add(line.id);
        if (!bundle.speakers[line.speakerId])
          errors.push(`${at} › ${line.id}: unknown speakerId "${line.speakerId}"`);
        if (!line.text?.trim()) errors.push(`${at} › ${line.id}: "text" is required`);
        else if (needsPinyin(line.text, line.pinyin))
          errors.push(`${at} › ${line.id}: Chinese lines need "pinyin" (npm run content:pinyin)`);
        if (
          line.startSeconds !== undefined &&
          line.endSeconds !== undefined &&
          line.startSeconds > line.endSeconds
        )
          errors.push(`${at} › ${line.id}: startSeconds is after endSeconds`);
      }
    }

    const questionIds = new Set<string>();
    for (const question of conversation.practiceQuestions ?? []) {
      if (questionIds.has(question.id))
        errors.push(`${at}: duplicate question id "${question.id}"`);
      questionIds.add(question.id);
      if (!question.prompt?.trim() || !question.suggestedAnswer?.trim())
        errors.push(`${at} › ${question.id}: "prompt" and "suggestedAnswer" are required`);
      else if (
        needsPinyin(question.prompt, question.promptPinyin) ||
        needsPinyin(question.suggestedAnswer, question.suggestedAnswerPinyin)
      )
        errors.push(
          `${at} › ${question.id}: Chinese questions need "promptPinyin" and "suggestedAnswerPinyin"`,
        );
    }
  }

  // Scenes -----------------------------------------------------------------------------------
  const seenScenes = new Set<string>();
  for (const scene of bundle.scenes) {
    const at = `scenes/${scene.id}.json`;
    if (seenScenes.has(scene.id)) errors.push(`${at}: duplicate scene id`);
    seenScenes.add(scene.id);
    if (!groupIds.has(scene.group)) errors.push(`${at}: unknown group "${scene.group}"`);
    if (scene.status !== 'available' && scene.status !== 'coming-soon')
      errors.push(`${at}: "status" must be "available" or "coming-soon"`);
    if (!(scene.width > 0 && scene.height > 0))
      errors.push(`${at}: "width"/"height" must be the background's natural size`);

    const sceneWordIds = new Set<string>();
    for (const id of scene.wordIds) {
      if (sceneWordIds.has(id)) errors.push(`${at}: duplicate word "${id}" in wordIds`);
      sceneWordIds.add(id);
      if (!wordIds.has(id)) errors.push(`${at}: wordIds references unknown word "${id}"`);
    }

    for (const id of scene.conversationIds) {
      const conversation = bundle.conversations.find((item) => item.id === id);
      if (!conversation) errors.push(`${at}: conversationIds references unknown "${id}"`);
      else if (conversation.sceneId !== scene.id)
        errors.push(`${at}: conversation "${id}" belongs to scene "${conversation.sceneId}"`);
    }

    const hotspotWordIds = new Set<string>();
    for (const hotspot of scene.hotspots) {
      const hs = `${at} › hotspot "${hotspot.wordId}"`;
      if (hotspotWordIds.has(hotspot.wordId)) errors.push(`${hs}: duplicate hotspot`);
      hotspotWordIds.add(hotspot.wordId);
      if (!sceneWordIds.has(hotspot.wordId))
        errors.push(`${hs}: word is not in the scene's wordIds`);

      const points = hotspot.svgPath ? getPathPoints(hotspot.svgPath) : null;
      if (!points) {
        errors.push(`${hs}: "svgPath" is missing or malformed`);
      } else if (points.some((p) => !isInside(p.x, p.y, scene.width, scene.height))) {
        errors.push(
          `${hs}: "svgPath" goes outside the ${scene.width}×${scene.height} viewBox — was it traced on a different image size?`,
        );
      }

      if (hotspot.spriteBounds) {
        const { x, y, width, height } = hotspot.spriteBounds;
        if (
          !(width > 0 && height > 0) ||
          !isInside(x, y, scene.width, scene.height) ||
          !isInside(x + width, y + height, scene.width, scene.height)
        )
          errors.push(`${hs}: "spriteBounds" must lie inside the scene`);
      }
      if (hotspot.sprite && !hotspot.spriteBounds)
        errors.push(`${hs}: "sprite" needs "spriteBounds" to be positioned`);
      if (hotspot.touchPadding !== undefined && !(hotspot.touchPadding >= 0))
        errors.push(`${hs}: "touchPadding" must be ≥ 0`);
      if (
        hotspot.anchor &&
        !isInside(hotspot.anchor.x, hotspot.anchor.y, scene.width, scene.height)
      )
        errors.push(`${hs}: "anchor" must lie inside the scene`);
    }

    if (scene.status === 'available') {
      if (scene.wordIds.length === 0) errors.push(`${at}: an available scene needs words`);
      for (const id of scene.wordIds) {
        if (!hotspotWordIds.has(id)) errors.push(`${at}: word "${id}" has no hotspot`);
      }
    }
  }

  errors.push(...validateSoundChart(bundle));
  errors.push(...validateGrammar(bundle));
  return errors;
}

const CHART_GROUPS: Readonly<Record<SoundChartKind, ReadonlySet<string>>> = {
  ipa: new Set(['vowel', 'diphthong', 'consonant']),
  pinyin: new Set(['initial', 'final', 'tone']),
};

/**
 * The sound chart (spec §24.2): every sound is complete, every word's transcription is made of
 * the chart's sounds only (IPA: no "ɚ", "ɝ", "t̬", syllable dots…; pinyin: one valid syllable per
 * character), and every sound has an example word.
 */
function validateSoundChart(bundle: ContentBundle): string[] {
  const errors: string[] = [];
  const { kind, sounds } = bundle.soundChart;
  const file = kind === 'ipa' ? 'pronunciation/ipa.json' : 'zh/pinyin.json';
  const field = kind === 'ipa' ? 'ipa' : 'pinyin';
  const spellings = ipaSpellings(sounds);
  const hanCount = (text: string) =>
    Array.from(text).filter((char) => /\p{Script=Han}/u.test(char)).length;
  const tokenize = (transcription: string, text: string) =>
    kind === 'ipa'
      ? tokenizeIpa(transcription, spellings)
      : tokenizePinyin(transcription, sounds, hanCount(text) || undefined);
  const seenIds = new Set<string>();
  const seenSpellings = new Set<string>();
  const used = new Set<string>();

  for (const word of Object.values(bundle.words)) {
    const transcription = kind === 'ipa' ? word.ipa : word.pinyin;
    if (!transcription) {
      if (kind === 'ipa') errors.push(`words.json › "${word.id}": "ipa" is required`);
      continue;
    }
    if (kind === 'ipa' && (!transcription.startsWith('/') || !transcription.endsWith('/')))
      errors.push(`words.json › "${word.id}": "ipa" must be written between slashes`);
    const { tokens, unknown } = tokenize(transcription, word.text);
    if (unknown.length > 0)
      errors.push(
        `words.json › "${word.id}": "${field}" ${transcription} has parts outside the chart: ${[...new Set(unknown)].join(' ')}`,
      );
    for (const token of tokens) used.add(token.soundId);
  }

  for (const sound of sounds) {
    const at = `${file} › "${sound.id}"`;
    if (!/^[a-z0-9]+$/.test(sound.id)) errors.push(`${at}: "id" must be lower-case letters/digits`);
    if (seenIds.has(sound.id)) errors.push(`${at}: duplicate id`);
    seenIds.add(sound.id);
    for (const spelling of [sound.symbol, ...(sound.aliases ?? [])]) {
      const key = `${sound.group}:${spelling}`;
      if (!spelling) errors.push(`${at}: empty symbol`);
      if (seenSpellings.has(key)) errors.push(`${at}: "${spelling}" belongs to two sounds`);
      seenSpellings.add(key);
    }
    if (!CHART_GROUPS[kind].has(sound.group)) errors.push(`${at}: unknown group "${sound.group}"`);
    if (sound.group === 'tone' && !(sound.tone && sound.tone >= 1 && sound.tone <= 5))
      errors.push(`${at}: a tone needs "tone" 1–5`);
    if (!sound.tipVi?.trim()) errors.push(`${at}: "tipVi" is required`);
    for (const example of sound.extraExamples ?? []) {
      const transcription = (kind === 'ipa' ? example.ipa : example.pinyin) ?? '';
      const { tokens, unknown } = tokenize(transcription, example.text);
      if (!example.text?.trim() || !example.meaningVi?.trim())
        errors.push(`${at}: extra examples need "text" and "meaningVi"`);
      if (unknown.length > 0 || !tokens.some((token) => token.soundId === sound.id))
        errors.push(`${at}: extra example "${example.text}" must contain the sound (${field})`);
    }
    if (!used.has(sound.id) && !sound.extraExamples?.length)
      errors.push(`${at}: no word has this sound — add "extraExamples"`);
  }
  return errors;
}

const GRAMMAR_LEVELS = new Set(['A1', 'A2', 'B1', 'B2']);
const FORM_KINDS = ['affirmative', 'negative', 'question'] as const;

/**
 * Grammar (spec §25): the 12 tenses, one per cell of the chart; an available tense has a full
 * lesson; every exercise can be answered (the answer is among the options, options differ, the
 * words of an "order" sentence make it back); example words exist.
 */
function validateGrammar(bundle: ContentBundle): string[] {
  const errors: string[] = [];
  if (bundle.grammarTopics.length === 0) return errors;
  const wordIds = new Set(Object.keys(bundle.words));
  const topicIds = new Set<string>();
  const exerciseIds = new Set<string>();
  const cells = new Set<string>();
  const norm = (value: string) => normalizeAnswer(value);

  for (const topic of bundle.grammarTopics) {
    const at = `grammar/${topic.id}.json`;
    if (topicIds.has(topic.id)) errors.push(`${at}: duplicate id`);
    topicIds.add(topic.id);
    const cell = `${topic.time}/${topic.aspect}`;
    if (!(GRAMMAR_TIMES as readonly string[]).includes(topic.time))
      errors.push(`${at}: unknown time "${topic.time}"`);
    if (!(GRAMMAR_ASPECTS as readonly string[]).includes(topic.aspect))
      errors.push(`${at}: unknown aspect "${topic.aspect}"`);
    if (cells.has(cell)) errors.push(`${at}: another tense is already "${cell}"`);
    cells.add(cell);
    if (!topic.title?.trim() || !topic.titleVi?.trim())
      errors.push(`${at}: "title" and "titleVi" are required`);
    if (!GRAMMAR_LEVELS.has(topic.level)) errors.push(`${at}: unknown level "${topic.level}"`);
    if (topic.status !== 'available' && topic.status !== 'coming-soon')
      errors.push(`${at}: "status" must be "available" or "coming-soon"`);
    if (topic.status !== 'available') continue;

    if (topic.usageVi.length === 0) errors.push(`${at}: "usageVi" needs at least one use`);
    for (const kind of FORM_KINDS) {
      const form = topic.forms.find((item) => item.kind === kind);
      if (!form) errors.push(`${at}: needs the "${kind}" form`);
      else if (!form.pattern?.trim() || !form.example?.trim() || !form.exampleVi?.trim())
        errors.push(`${at}: the "${kind}" form needs "pattern", "example" and "exampleVi"`);
    }
    if (topic.signalWords.length === 0) errors.push(`${at}: "signalWords" is empty`);
    if (topic.examples.length < 3) errors.push(`${at}: needs at least 3 examples`);
    for (const example of topic.examples) {
      if (!example.text?.trim() || !example.textVi?.trim())
        errors.push(`${at}: every example needs "text" and "textVi"`);
      for (const id of example.wordIds ?? []) {
        if (!wordIds.has(id))
          errors.push(`${at}: example "${example.text}" uses unknown word "${id}"`);
      }
    }
    if (topic.exercises.length < 6) errors.push(`${at}: needs at least 6 exercises`);
    for (const exercise of topic.exercises) {
      const ex = `${at} › ${exercise.id}`;
      if (exerciseIds.has(exercise.id)) errors.push(`${ex}: duplicate exercise id`);
      exerciseIds.add(exercise.id);
      if (!exercise.sentence?.trim() || !exercise.textVi?.trim())
        errors.push(`${ex}: "sentence" and "textVi" are required`);
      if (exercise.kind === 'order') {
        const count = sentenceTiles(exercise.sentence).length;
        if (count < 3 || count > 9) errors.push(`${ex}: an "order" sentence needs 3–9 words`);
        continue;
      }
      const options = exercise.options ?? [];
      if (options.length < 2 || options.length > 4) errors.push(`${ex}: needs 2–4 options`);
      if (new Set(options.map(norm)).size !== options.length)
        errors.push(`${ex}: two options are the same`);
      const answer = exercise.kind === 'choose' ? exercise.answer : exercise.sentence;
      if (options.filter((option) => norm(option) === norm(answer)).length !== 1)
        errors.push(`${ex}: the answer must be one of the options`);
      if (exercise.kind === 'choose' && exercise.sentence.split('___').length !== 2)
        errors.push(`${ex}: the sentence needs exactly one "___"`);
    }
  }
  for (const time of GRAMMAR_TIMES) {
    for (const aspect of GRAMMAR_ASPECTS) {
      if (!cells.has(`${time}/${aspect}`))
        errors.push(`grammar: no tense for "${time}/${aspect}" (the chart has 12 tenses)`);
    }
  }
  return errors;
}

/** Lists every local asset path referenced by the content, for existence checks. */
export function collectAssetPaths(bundle: ContentBundle): string[] {
  const paths = new Set<string>();
  const add = (path: string | undefined) => {
    if (path && path.startsWith('/')) paths.add(path);
  };
  for (const sound of bundle.soundChart.sounds) {
    add(sound.audio);
    add(sound.mouthImage);
  }
  for (const scene of bundle.scenes) {
    add(scene.thumbnail);
    add(scene.background);
    for (const hotspot of scene.hotspots) add(hotspot.sprite);
  }
  for (const word of Object.values(bundle.words)) {
    add(word.image);
    add(word.audio);
    for (const example of word.examples) add(example.audio);
  }
  for (const conversation of bundle.conversations) {
    add(conversation.poster);
    add(conversation.videoSrc);
    add(conversation.captionsSrc);
    for (const line of conversation.lines) add(line.audio);
    for (const question of conversation.practiceQuestions) add(question.audio);
  }
  for (const speaker of Object.values(bundle.speakers)) add(speaker.avatar);
  return [...paths].sort();
}

/** Chinese course text is always shown with its pinyin. */
function needsPinyin(text: string | undefined, pinyin: string | undefined): boolean {
  return !!text && /\p{Script=Han}/u.test(text) && !pinyin?.trim();
}

const TOLERANCE = 1;

function isInside(x: number, y: number, width: number, height: number): boolean {
  return x >= -TOLERANCE && y >= -TOLERANCE && x <= width + TOLERANCE && y <= height + TOLERANCE;
}
