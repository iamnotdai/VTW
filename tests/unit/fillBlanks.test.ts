import { describe, expect, it } from 'vitest';
import {
  blankLinePinyin,
  buildBlankLines,
  isBlankAnswerCorrect,
  normalizeBlankAnswer,
  type BlankPiece,
} from '@/lib/fillBlanks';
import { createSeededRandom } from '@/lib/random';
import type { DialogueLine } from '@/types/models';

const line = (id: string, text: string): DialogueLine => ({ id, speakerId: 'ben', text });

const answers = (pieces: BlankPiece[]) =>
  pieces.flatMap((piece) => (piece.kind === 'blank' ? [piece.answer] : []));

const english = {
  vocabulary: ['bed', 'bunny', 'laptop', 'book', 'desk', 'pencil cup'],
  names: ['Lily', 'Ben'],
  lang: 'en-US',
};

describe('buildBlankLines', () => {
  it('hides a vocabulary word first and keeps the rest of the line', () => {
    const [result] = buildBlankLines([line('l1', 'Wow, your bed is so big!')], {
      ...english,
      random: createSeededRandom(1),
    });
    expect(result.pieces).toEqual([
      { kind: 'text', text: 'Wow, your ' },
      { kind: 'blank', id: 'l1:blank', answer: 'bed' },
      { kind: 'text', text: ' is so big!' },
    ]);
  });

  it('finds plurals and phrases of the vocabulary', () => {
    const [plural, phrase] = buildBlankLines(
      [line('l1', 'I have two books.'), line('l2', 'The pencil cup is blue.')],
      { ...english, random: createSeededRandom(2) },
    );
    expect(answers(plural.pieces)).toEqual(['books']);
    expect(answers(phrase.pieces)).toEqual(['pencil cup']);
  });

  it('otherwise hides one of the longest content words, never names or little words', () => {
    for (let seed = 0; seed < 20; seed += 1) {
      const [result] = buildBlankLines([line('l1', 'Lily, is this your bedroom?')], {
        ...english,
        vocabulary: [],
        random: createSeededRandom(seed),
      });
      expect(answers(result.pieces)).toEqual(['bedroom']);
    }
  });

  it('leaves a line without a good word as it is', () => {
    const [result] = buildBlankLines([line('l1', 'Yes, it is.')], english);
    expect(result.pieces).toEqual([{ kind: 'text', text: 'Yes, it is.' }]);
  });

  it('works with Chinese lines', () => {
    const chinese = { vocabulary: ['床', '书桌'], names: ['莉莉', '小本'], lang: 'zh-CN' };
    const [vocab, content] = buildBlankLines(
      [line('l1', '哇，你的床好大呀！'), line('l2', '莉莉，这是你的卧室吗？')],
      { ...chinese, random: createSeededRandom(3) },
    );
    expect(answers(vocab.pieces)).toEqual(['床']);
    expect(answers(content.pieces)).toEqual(['卧室']);
  });
});

describe('isBlankAnswerCorrect', () => {
  it('ignores case, spaces and punctuation only', () => {
    expect(isBlankAnswerCorrect('bed', ' Bed ')).toBe(true);
    expect(isBlankAnswerCorrect('pencil cup', 'pencil  cup.')).toBe(true);
    expect(isBlankAnswerCorrect('bed', 'bad')).toBe(false);
    expect(isBlankAnswerCorrect('bed', '')).toBe(false);
    expect(isBlankAnswerCorrect('床', '床')).toBe(true);
  });

  it('treats curly and straight apostrophes the same', () => {
    expect(normalizeBlankAnswer('It’s')).toBe("it's");
  });
});

describe('blanks to avoid', () => {
  it('never hides a speaker name, even when it is also a vocabulary word', () => {
    for (let seed = 0; seed < 10; seed += 1) {
      const [result] = buildBlankLines([line('l1', 'Lily, come here! Look at this leaf.')], {
        vocabulary: ['lily', 'leaf'],
        names: ['Lily', 'Ben'],
        lang: 'en-US',
        random: createSeededRandom(seed),
      });
      expect(answers(result.pieces)).toEqual(['leaf']);
    }
  });

  it('never leaves the answer written elsewhere in the line', () => {
    const [result] = buildBlankLines([line('l1', 'I clean the toilet with the toilet brush.')], {
      vocabulary: ['toilet', 'toilet brush'],
      names: [],
      lang: 'en-US',
      random: createSeededRandom(4),
    });
    expect(answers(result.pieces)).toEqual(['toilet brush']);
  });

  it('Chinese: a vocabulary character inside another word is not a blank', () => {
    const chinese = { names: ['小本'], lang: 'zh-CN', random: createSeededRandom(5) };
    const [getUp, cartoon, onDesk] = buildBlankLines(
      [
        line('l1', '小本，该起床了！'),
        line('l2', '我们看动画片吧。'),
        line('l3', '书桌上有什么？'),
      ],
      { ...chinese, vocabulary: ['床', '画', '书桌'] },
    );
    expect(answers(getUp.pieces)).not.toContain('床');
    expect(answers(cartoon.pieces)).not.toContain('画');
    // A place word after the noun is fine: 书桌上.
    expect(answers(onDesk.pieces)).toEqual(['书桌']);
  });
});

describe('blankLinePinyin', () => {
  const blank = (text: string, answer: string) => {
    const start = text.indexOf(answer);
    return {
      lineId: 'l1',
      pieces: [
        { kind: 'text' as const, text: text.slice(0, start) },
        { kind: 'blank' as const, id: 'b', answer },
        { kind: 'text' as const, text: text.slice(start + answer.length) },
      ],
    };
  };

  it('hides the syllables of the blank only', () => {
    const text = '哇，你的床好大呀！';
    expect(blankLinePinyin(blank(text, '床'), text, 'Wā, nǐ de chuáng hǎo dà ya!')).toBe(
      'Wā, nǐ de ___ hǎo dà ya!',
    );
  });

  it('keeps 儿 on the syllable before it (哪儿 = nǎr)', () => {
    const text = '我的书在哪儿？';
    expect(blankLinePinyin(blank(text, '书'), text, 'Wǒ de shū zài nǎr?')).toBe(
      'Wǒ de ___ zài nǎr?',
    );
  });

  it('shows the pinyin as it is when it cannot be matched, and nothing without pinyin', () => {
    const text = '我的书在这里。';
    expect(blankLinePinyin(blank(text, '书'), text, 'Wǒ de shū zài zhèlǐ.')).toBe(
      'Wǒ de shū zài zhèlǐ.',
    );
    expect(blankLinePinyin(blank(text, '书'), text, undefined)).toBeUndefined();
  });
});
