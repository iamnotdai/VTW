import { SCENE_GROUPS } from '@/config/app';
import { getPathPoints } from '@/lib/svgPath';
import { normalizeAnswer } from '@/lib/text';
import type { ContentBundle } from './content';

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
    else if (word.examples.some((example) => !example.en?.trim()))
      errors.push(`${at}: every example needs an "en" sentence`);

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
        if (!line.textEn?.trim()) errors.push(`${at} › ${line.id}: "textEn" is required`);
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

  return errors;
}

/** Lists every local asset path referenced by the content, for existence checks. */
export function collectAssetPaths(bundle: ContentBundle): string[] {
  const paths = new Set<string>();
  const add = (path: string | undefined) => {
    if (path && path.startsWith('/')) paths.add(path);
  };
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

const TOLERANCE = 1;

function isInside(x: number, y: number, width: number, height: number): boolean {
  return x >= -TOLERANCE && y >= -TOLERANCE && x <= width + TOLERANCE && y <= height + TOLERANCE;
}
