import { pinyin } from 'pinyin-pro';
import { describe, expect, it } from 'vitest';
import { SPEAKING_SCORE } from '@/config/app';
import {
  letterSimilarity,
  scoreSpeaking,
  soundGroupLengths,
  speakingLevel,
  type HeardAlternative,
  type PinyinOf,
  type SpeakingScore,
} from '@/lib/speakingScore';

const heard = (...transcripts: string[]): HeardAlternative[] =>
  transcripts.map((transcript) => ({ transcript, confidence: 0 }));

const word = (text: string, variants?: string[]) => ({ text, kind: 'word' as const, variants });
const sentence = (text: string) => ({ text, kind: 'sentence' as const });

/** "th|ea|t|er" → "th:bad ea:good …", for readable expectations. */
const colours = (result: SpeakingScore | null) =>
  result?.parts
    .filter((part) => part.status !== null)
    .map((part) => `${part.text}:${part.status}`)
    .join(' ');

const pinyinOf: PinyinOf = (text) => pinyin(text, { type: 'array', toneType: 'num' });

describe('soundGroupLengths', () => {
  it('keeps letters that make one sound together', () => {
    expect(soundGroupLengths('theater')).toEqual([2, 2, 1, 2]);
    expect(soundGroupLengths('pillow')).toEqual([1, 1, 2, 2]);
    expect(soundGroupLengths('nightstand')).toEqual([1, 3, 1, 1, 1, 1, 1, 1]);
  });
});

describe('scoreSpeaking — vocabulary words', () => {
  it('a word heard exactly scores 100, all green', () => {
    const result = scoreSpeaking(word('pillow'), heard('pillow'));
    expect(result?.score).toBe(100);
    expect(result?.level).toBe('great');
    expect(colours(result)).toBe('p:good i:good ll:good ow:good');
  });

  it('finds the word inside a longer answer and across split words', () => {
    expect(scoreSpeaking(word('lamp'), heard("It's a lamp."))?.score).toBe(100);
    expect(scoreSpeaking(word('nightstand'), heard('night stand'))?.score).toBe(100);
    expect(scoreSpeaking(word('Wi-Fi router'), heard('wifi router'))?.score).toBe(100);
  });

  it('colours the sounds that were heard differently', () => {
    const result = scoreSpeaking(word('theater'), heard('teeter'));
    expect(result?.level).not.toBe('great');
    expect(colours(result)).toMatch(/^th:(bad|fair) /);
    expect(result?.heard).toBe('teeter');
  });

  it('marks a dropped ending sound', () => {
    const result = scoreSpeaking(word('slippers'), heard('slipper'));
    expect(colours(result)).toBe('s:good l:good i:good pp:good er:good s:bad');
    expect(result?.score).toBe(Math.round((7 / 8) * SPEAKING_SCORE.nearMissMax));
    expect(result?.level).toBe('good');
  });

  it('a different word scores low', () => {
    const result = scoreSpeaking(word('rug'), heard('rock'));
    expect(result?.level).toBe('try-again');
    expect(colours(result)).toBe('r:good u:bad g:bad');
  });

  it('does not take a longer word for a short one', () => {
    expect(scoreSpeaking(word('pea'), heard('peanut'))?.level).toBe('try-again');
  });

  it('counts accepted answers and words that sound the same as exact', () => {
    expect(scoreSpeaking(word('pear', ['a pear', 'pair']), heard('pair'))?.score).toBe(100);
    expect(scoreSpeaking(word('pear'), heard('pair'))?.score).toBeLessThan(100);
  });

  it('a word that was only a later guess scores lower and shows the slip gently', () => {
    const result = scoreSpeaking(word('lamp'), heard('lamb', 'lamp'));
    expect(result?.score).toBe(100 - SPEAKING_SCORE.rankPenalty.word[1]);
    expect(result?.heard).toBe('lamp');
    expect(colours(result)).toBe('l:good a:good m:good p:fair');
  });

  it('follows the recognizer confidence a little', () => {
    const sure = scoreSpeaking(word('desk'), [{ transcript: 'desk', confidence: 0.95 }]);
    const unsure = scoreSpeaking(word('desk'), [{ transcript: 'desk', confidence: 0.4 }]);
    expect(sure!.score).toBeGreaterThan(unsure!.score);
    expect(unsure!.level).toBe('great');
  });

  it('returns null when nothing was heard', () => {
    expect(scoreSpeaking(word('bed'), heard('', ' '))).toBeNull();
    expect(scoreSpeaking(word('bed'), [])).toBeNull();
  });
});

describe('scoreSpeaking — sentences', () => {
  const line = 'Wow, your bed is so big!';

  it('a line read exactly scores 100 and keeps its punctuation', () => {
    const result = scoreSpeaking(sentence(line), heard('wow your bed is so big'));
    expect(result?.score).toBe(100);
    expect(result?.parts.map((part) => part.text).join('')).toBe(line);
  });

  it('marks a close word as almost and a missing word as bad', () => {
    const result = scoreSpeaking(sentence(line), heard('wow you bed is big'));
    expect(colours(result)).toBe('Wow,:good your:fair bed:good is:good so:bad big!:good');
    expect(result?.level).toBe('good');
  });

  it('understands contractions and extra words around the line', () => {
    expect(scoreSpeaking(sentence('It’s on the desk.'), heard('um it is on the desk'))?.score).toBe(
      100,
    );
  });
});

describe('scoreSpeaking — Chinese', () => {
  it('matches each character; homophones count as right', () => {
    expect(scoreSpeaking(word('台灯'), heard('台灯'), pinyinOf)?.score).toBe(100);
    expect(scoreSpeaking(word('台灯'), heard('这是台灯'), pinyinOf)?.score).toBe(100);
    // 抬 sounds exactly like 台 (tái).
    expect(colours(scoreSpeaking(word('台灯'), heard('抬灯'), pinyinOf))).toBe('台:good 灯:good');
  });

  it('spots a tone mistake', () => {
    // 窗 chuāng instead of 床 chuáng.
    const result = scoreSpeaking(word('床'), heard('窗'), pinyinOf);
    expect(result?.toneHint).toBe(true);
    expect(colours(result)).toBe('床:fair');
    expect(result?.level).not.toBe('great');
  });

  it('without pinyin, characters must match', () => {
    expect(colours(scoreSpeaking(word('床'), heard('窗')))).toBe('床:bad');
  });

  it('scores a sentence character by character with punctuation attached', () => {
    const result = scoreSpeaking(sentence('我有两本书。'), heard('我有2本书'), pinyinOf);
    expect(result?.score).toBe(100);
    expect(result?.parts.at(-1)?.text).toBe('书。');
  });
});

describe('helpers', () => {
  it('letterSimilarity', () => {
    expect(letterSimilarity('your', 'you')).toBe(0.75);
    expect(letterSimilarity('bed', 'bed')).toBe(1);
  });

  it('speakingLevel', () => {
    expect(speakingLevel(SPEAKING_SCORE.great)).toBe('great');
    expect(speakingLevel(SPEAKING_SCORE.good)).toBe('good');
    expect(speakingLevel(SPEAKING_SCORE.good - 1)).toBe('try-again');
  });
});

describe('scoreSpeaking — numbers and accepted answers', () => {
  it('a number the recognizer wrote in digits is still right', () => {
    expect(
      scoreSpeaking(
        sentence('OK. You can watch for thirty minutes.'),
        heard('OK you can watch for 30 minutes'),
      )?.score,
    ).toBe(100);
    expect(
      scoreSpeaking(sentence('三十秒。叮！给你。'), heard('30秒叮给你'), pinyinOf)?.score,
    ).toBe(100);
  });

  it('a Chinese accepted answer counts as exact', () => {
    expect(scoreSpeaking(word('被子', ['棉被']), heard('棉被'), pinyinOf)?.score).toBe(100);
  });

  it('a missed word keeps the score under Excellent', () => {
    const result = scoreSpeaking(
      sentence('And this is my bunny. Her name is Bobo.'),
      heard('and this is my money her name is bobo'),
    );
    expect(result?.score).toBe(SPEAKING_SCORE.great - 1);
    expect(result?.level).toBe('good');
  });
});
