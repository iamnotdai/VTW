import { describe, expect, it } from 'vitest';
import { getWord } from '@/data/content';
import { describeWord, describeWordPinyin } from '@/lib/text';

describe('describeWord', () => {
  it('uses "a" / "an" for one thing', () => {
    expect(describeWord({ text: 'lamp' })).toBe('It’s a lamp.');
    expect(describeWord({ text: 'armchair' })).toBe('It’s an armchair.');
    expect(describeWord({ text: 'teddy bear' })).toBe('It’s a teddy bear.');
  });

  it('uses "They’re" for words marked plural', () => {
    expect(describeWord({ text: 'curtains', plural: true })).toBe('They’re curtains.');
    expect(describeWord(getWord('slippers')!)).toBe('They’re slippers.');
  });

  it('uses no article for words marked uncountable', () => {
    expect(describeWord({ text: 'milk', uncountable: true })).toBe('It’s milk.');
    expect(describeWord(getWord('toothpaste')!)).toBe('It’s toothpaste.');
  });
});

describe('describeWord (Chinese course)', () => {
  it('uses the measure word: 这是一盏台灯。', () => {
    expect(describeWord({ text: '台灯', measure: '盏' }, 'zh')).toBe('这是一盏台灯。');
  });

  it('uses no measure word for mass nouns: 这是牙膏。', () => {
    expect(describeWord({ text: '牙膏' }, 'zh')).toBe('这是牙膏。');
  });
});

describe('describeWordPinyin', () => {
  it('reads the Chinese answer sentence with 一 tone sandhi', () => {
    expect(describeWordPinyin({ pinyin: 'táidēng', measure: '盏' }, 'zh')).toBe(
      'Zhè shì yì zhǎn táidēng.',
    );
    expect(describeWordPinyin({ pinyin: 'zhěntou', measure: '个' }, 'zh')).toBe(
      'Zhè shì yí ge zhěntou.',
    );
    expect(describeWordPinyin({ pinyin: 'yágāo' }, 'zh')).toBe('Zhè shì yágāo.');
    expect(describeWordPinyin({ pinyin: 'lamp' }, 'en')).toBeUndefined();
  });
});
