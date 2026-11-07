import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { BACKGROUNDS, AVATAR_IMAGES, BRAND_ASSETS } from '@/config/assets';
import { contentByCourse, getScene, getSceneConversations, getSceneWords } from '@/data/content';
import { collectAssetPaths, validateContent } from '@/data/validateContent';
import { getPathBounds } from '@/lib/svgPath';
import { describeWordPinyin } from '@/lib/text';

/**
 * Content check (spec §10.3): run with `npm run content:check` after editing JSON or assets.
 */
const ROOT = resolve(__dirname, '../..');
const PUBLIC = join(ROOT, 'public');
const DATA = join(ROOT, 'src/data');

describe.each(Object.entries(contentByCourse))('static content (%s course)', (_course, content) => {
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
});

describe('content files', () => {
  it('has no duplicate ids hidden by JSON parsing', () => {
    const duplicatesIn = (file: string) => {
      const ids = [...readFileSync(file, 'utf8').matchAll(/"id":\s*"([^"]+)"/g)].map(
        (match) => match[1],
      );
      return ids.filter((id, index) => ids.indexOf(id) !== index);
    };
    for (const dir of [DATA, join(DATA, 'zh')]) {
      expect(duplicatesIn(join(dir, 'words.json'))).toEqual([]);
      expect(duplicatesIn(join(dir, 'conversations.json'))).toEqual([]);
      expect(duplicatesIn(join(dir, 'speakers.json'))).toEqual([]);
    }
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

describe('Living Room', () => {
  const livingRoom = getScene('living-room')!;

  it('is available with 30 words, 10 conversations and one hotspot per word', () => {
    expect(livingRoom.status).toBe('available');
    expect(getSceneWords(livingRoom)).toHaveLength(30);
    expect(getSceneConversations(livingRoom)).toHaveLength(10);
    expect(livingRoom.hotspots.map((hotspot) => hotspot.wordId).sort()).toEqual(
      [...livingRoom.wordIds].sort(),
    );
  });

  it('uses traced contours, not one big box around the picture', () => {
    const oversized = livingRoom.hotspots.filter((hotspot) => {
      const bounds = getPathBounds(hotspot.svgPath)!;
      return (bounds.width * bounds.height) / (livingRoom.width * livingRoom.height) >= 0.35;
    });
    expect(oversized.map((hotspot) => hotspot.wordId)).toEqual([]);
  });
});

describe('Kitchen', () => {
  const kitchen = getScene('kitchen')!;

  it('is available with 24 words, 10 conversations and one hotspot per word', () => {
    expect(kitchen.status).toBe('available');
    expect(getSceneWords(kitchen)).toHaveLength(24);
    expect(getSceneConversations(kitchen)).toHaveLength(10);
    expect(kitchen.hotspots.map((hotspot) => hotspot.wordId).sort()).toEqual(
      [...kitchen.wordIds].sort(),
    );
  });

  it('uses traced contours, not one big box around the picture', () => {
    const oversized = kitchen.hotspots.filter((hotspot) => {
      const bounds = getPathBounds(hotspot.svgPath)!;
      return (bounds.width * bounds.height) / (kitchen.width * kitchen.height) >= 0.35;
    });
    expect(oversized.map((hotspot) => hotspot.wordId)).toEqual([]);
  });
});

describe('Chinese course', () => {
  const { scenes, words } = contentByCourse.zh;
  const available = scenes.filter((scene) => scene.status === 'available');

  it('has every word and conversation of the English scenes', () => {
    for (const scene of available) {
      expect(scene.wordIds.filter((id) => !words[id])).toEqual([]);
      expect(scene.title).toMatch(/\p{Script=Han}/u);
    }
  });

  it('gives each word of a scene a different text (they are quiz options)', () => {
    for (const scene of available) {
      const texts = scene.wordIds.map((id) => words[id].text);
      expect(texts.filter((text, index) => texts.indexOf(text) !== index)).toEqual([]);
    }
  });

  it('reads every answer sentence aloud with pinyin (known measure words)', () => {
    const missing = Object.values(words).filter((word) => !describeWordPinyin(word, 'zh'));
    expect(missing.map((word) => `${word.id} (${word.measure})`)).toEqual([]);
  });

  it('accepts only Chinese characters as typed answers', () => {
    const notChinese = Object.values(words).flatMap((word) =>
      word.acceptedAnswers.filter((answer) => !/^\p{Script=Han}+$/u.test(answer)),
    );
    expect(notChinese).toEqual([]);
  });
});

describe('House Exterior', () => {
  const houseExterior = getScene('house-exterior')!;

  it('is available with 24 words, 10 conversations and one hotspot per word', () => {
    expect(houseExterior.status).toBe('available');
    expect(getSceneWords(houseExterior)).toHaveLength(24);
    expect(getSceneConversations(houseExterior)).toHaveLength(10);
    expect(houseExterior.hotspots.map((hotspot) => hotspot.wordId).sort()).toEqual(
      [...houseExterior.wordIds].sort(),
    );
  });

  it('uses traced contours, not one big box around the picture', () => {
    // Bushes and fence sections are spread over the yard, so each sub-path is checked on its own.
    const oversized = houseExterior.hotspots.filter((hotspot) =>
      hotspot.svgPath.split(/(?=M)/).some((subPath) => {
        const bounds = getPathBounds(subPath)!;
        return (
          (bounds.width * bounds.height) / (houseExterior.width * houseExterior.height) >= 0.35
        );
      }),
    );
    expect(oversized.map((hotspot) => hotspot.wordId)).toEqual([]);
  });
});

describe('Dining Room', () => {
  const diningRoom = getScene('dining-room')!;

  it('is available with 30 words, 10 conversations and one hotspot per word', () => {
    expect(diningRoom.status).toBe('available');
    expect(getSceneWords(diningRoom)).toHaveLength(30);
    expect(getSceneConversations(diningRoom)).toHaveLength(10);
    expect(diningRoom.hotspots.map((hotspot) => hotspot.wordId).sort()).toEqual(
      [...diningRoom.wordIds].sort(),
    );
  });

  it('uses traced contours, not one big box around the picture', () => {
    // The tablecloth covers the whole table, so it is the one big shape; the two place settings
    // (placemats, plates, cutlery…) are checked sub-path by sub-path.
    const oversized = diningRoom.hotspots.filter(
      (hotspot) =>
        hotspot.wordId !== 'tablecloth' &&
        hotspot.svgPath.split(/(?=M)/).some((subPath) => {
          const bounds = getPathBounds(subPath)!;
          return (bounds.width * bounds.height) / (diningRoom.width * diningRoom.height) >= 0.35;
        }),
    );
    expect(oversized.map((hotspot) => hotspot.wordId)).toEqual([]);
  });
});

describe('Garage', () => {
  const garage = getScene('garage')!;

  it('is the last Home scene, available with 24 words, 10 conversations and one hotspot per word', () => {
    expect(garage.status).toBe('available');
    const home = contentByCourse.en.scenes.filter((scene) => scene.group === 'home');
    expect(home.at(-1)?.id).toBe('garage');
    expect(getSceneWords(garage)).toHaveLength(24);
    expect(getSceneConversations(garage)).toHaveLength(10);
    expect(garage.hotspots.map((hotspot) => hotspot.wordId).sort()).toEqual(
      [...garage.wordIds].sort(),
    );
  });

  it('uses traced contours, not one big box around the picture', () => {
    const oversized = garage.hotspots.filter((hotspot) =>
      hotspot.svgPath.split(/(?=M)/).some((subPath) => {
        const bounds = getPathBounds(subPath)!;
        return (bounds.width * bounds.height) / (garage.width * garage.height) >= 0.35;
      }),
    );
    expect(oversized.map((hotspot) => hotspot.wordId)).toEqual([]);
  });
});

describe('Flower Garden', () => {
  const garden = getScene('flower-garden')!;

  it('is an available Garden scene with 24 words, 10 conversations and one hotspot per word', () => {
    expect(garden.status).toBe('available');
    expect(garden.group).toBe('garden');
    expect(getSceneWords(garden)).toHaveLength(24);
    expect(getSceneConversations(garden)).toHaveLength(10);
    expect(garden.hotspots.map((hotspot) => hotspot.wordId).sort()).toEqual(
      [...garden.wordIds].sort(),
    );
  });

  it('uses traced contours, not one big box around the picture', () => {
    const oversized = garden.hotspots.filter((hotspot) =>
      hotspot.svgPath.split(/(?=M)/).some((subPath) => {
        const bounds = getPathBounds(subPath)!;
        return (bounds.width * bounds.height) / (garden.width * garden.height) >= 0.35;
      }),
    );
    expect(oversized.map((hotspot) => hotspot.wordId)).toEqual([]);
  });
});

describe('Vegetable Garden', () => {
  const garden = getScene('vegetable-garden')!;

  it('is an available Garden scene with 24 words, 10 conversations and one hotspot per word', () => {
    expect(garden.status).toBe('available');
    expect(garden.group).toBe('garden');
    expect(getSceneWords(garden)).toHaveLength(24);
    expect(getSceneConversations(garden)).toHaveLength(10);
    expect(garden.hotspots.map((hotspot) => hotspot.wordId).sort()).toEqual(
      [...garden.wordIds].sort(),
    );
  });

  it('uses traced contours, not one big box around the picture', () => {
    const oversized = garden.hotspots.filter((hotspot) =>
      hotspot.svgPath.split(/(?=M)/).some((subPath) => {
        const bounds = getPathBounds(subPath)!;
        return (bounds.width * bounds.height) / (garden.width * garden.height) >= 0.35;
      }),
    );
    expect(oversized.map((hotspot) => hotspot.wordId)).toEqual([]);
  });
});

describe('Fruit Garden', () => {
  const garden = getScene('fruit-garden')!;

  it('is an available Garden scene with 24 words, 10 conversations and one hotspot per word', () => {
    expect(garden.status).toBe('available');
    expect(garden.group).toBe('garden');
    expect(getSceneWords(garden)).toHaveLength(24);
    expect(getSceneConversations(garden)).toHaveLength(10);
    expect(garden.hotspots.map((hotspot) => hotspot.wordId).sort()).toEqual(
      [...garden.wordIds].sort(),
    );
  });

  it('uses traced contours, not one big box around the picture', () => {
    const oversized = garden.hotspots.filter((hotspot) =>
      hotspot.svgPath.split(/(?=M)/).some((subPath) => {
        const bounds = getPathBounds(subPath)!;
        return (bounds.width * bounds.height) / (garden.width * garden.height) >= 0.35;
      }),
    );
    expect(oversized.map((hotspot) => hotspot.wordId)).toEqual([]);
  });
});

describe('Tool Shed', () => {
  const shed = getScene('tool-shed')!;

  it('is an available Garden scene with 24 words, 10 conversations and one hotspot per word', () => {
    expect(shed.status).toBe('available');
    expect(shed.group).toBe('garden');
    expect(getSceneWords(shed)).toHaveLength(24);
    expect(getSceneConversations(shed)).toHaveLength(10);
    expect(shed.hotspots.map((hotspot) => hotspot.wordId).sort()).toEqual([...shed.wordIds].sort());
  });

  it('uses traced contours, not one big box around the picture', () => {
    const oversized = shed.hotspots.filter((hotspot) =>
      hotspot.svgPath.split(/(?=M)/).some((subPath) => {
        const bounds = getPathBounds(subPath)!;
        return (bounds.width * bounds.height) / (shed.width * shed.height) >= 0.35;
      }),
    );
    expect(oversized.map((hotspot) => hotspot.wordId)).toEqual([]);
  });
});
