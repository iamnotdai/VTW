import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { BACKGROUNDS, AVATAR_IMAGES, BRAND_ASSETS } from '@/config/assets';
import { content, getScene, getSceneConversations, getSceneWords } from '@/data/content';
import { collectAssetPaths, validateContent } from '@/data/validateContent';
import { getPathBounds } from '@/lib/svgPath';

/**
 * Content check (spec §10.3): run with `npm run content:check` after editing JSON or assets.
 */
const ROOT = resolve(__dirname, '../..');
const PUBLIC = join(ROOT, 'public');
const DATA = join(ROOT, 'src/data');

describe('static content', () => {
  it('has no broken references, duplicates or out-of-bounds hotspots', () => {
    expect(validateContent(content)).toEqual([]);
  });

  it('points only at asset files that exist (no 404s)', () => {
    const appAssets = [
      ...Object.values(BRAND_ASSETS),
      ...Object.values(AVATAR_IMAGES),
      ...Object.values(BACKGROUNDS).flatMap((pair) => [pair.desktop, pair.mobile]),
    ];
    const missing = [...collectAssetPaths(content), ...appAssets].filter(
      (path) => !existsSync(join(PUBLIC, decodeURIComponent(path))),
    );
    expect(missing).toEqual([]);
  });

  it('has no duplicate ids hidden by JSON parsing', () => {
    const duplicatesIn = (file: string) => {
      const ids = [...readFileSync(file, 'utf8').matchAll(/"id":\s*"([^"]+)"/g)].map(
        (match) => match[1],
      );
      return ids.filter((id, index) => ids.indexOf(id) !== index);
    };
    expect(duplicatesIn(join(DATA, 'words.json'))).toEqual([]);
    expect(duplicatesIn(join(DATA, 'conversations.json'))).toEqual([]);
    expect(duplicatesIn(join(DATA, 'speakers.json'))).toEqual([]);
    const sceneIds = readdirSync(join(DATA, 'scenes')).map(
      (file) => JSON.parse(readFileSync(join(DATA, 'scenes', file), 'utf8')).id as string,
    );
    expect(new Set(sceneIds).size).toBe(sceneIds.length);
  });
});

describe('Bedroom (the complete MVP scene)', () => {
  const bedroom = getScene('bedroom')!;

  it('has 24 words, 10 conversations and one hotspot per word (spec §2.2, §18)', () => {
    expect(getSceneWords(bedroom)).toHaveLength(24);
    expect(getSceneConversations(bedroom)).toHaveLength(10);
    expect(bedroom.hotspots.map((hotspot) => hotspot.wordId).sort()).toEqual(
      [...bedroom.wordIds].sort(),
    );
  });

  it('starts with the conversations named in the design', () => {
    expect(
      getSceneConversations(bedroom)
        .slice(0, 3)
        .map((item) => item.title),
    ).toEqual(['My Bedroom', 'Making the Bed', 'Where Is My Book?']);
  });

  it('uses traced contours, not one big box around the picture', () => {
    const oversized = bedroom.hotspots.filter((hotspot) => {
      const bounds = getPathBounds(hotspot.svgPath)!;
      return (bounds.width * bounds.height) / (bedroom.width * bedroom.height) >= 0.35;
    });
    expect(oversized.map((hotspot) => hotspot.wordId)).toEqual([]);
  });
});

describe('Bathroom', () => {
  const bathroom = getScene('bathroom')!;

  it('is available with 24 words, 10 conversations and one hotspot per word', () => {
    expect(bathroom.status).toBe('available');
    expect(getSceneWords(bathroom)).toHaveLength(24);
    expect(getSceneConversations(bathroom)).toHaveLength(10);
    expect(bathroom.hotspots.map((hotspot) => hotspot.wordId).sort()).toEqual(
      [...bathroom.wordIds].sort(),
    );
  });

  it('uses traced contours, not one big box around the picture', () => {
    const oversized = bathroom.hotspots.filter((hotspot) => {
      const bounds = getPathBounds(hotspot.svgPath)!;
      return (bounds.width * bounds.height) / (bathroom.width * bathroom.height) >= 0.35;
    });
    expect(oversized.map((hotspot) => hotspot.wordId)).toEqual([]);
  });
});
