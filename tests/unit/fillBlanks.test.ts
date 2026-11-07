import { describe, expect, it } from 'vitest';
import {
  blankLinePinyin,
  buildBlankChoices,
  buildBlankLines,
  isBlankAnswerCorrect,
  normalizeBlankAnswer,
  type BlankLine,
  type BlankPiece,
} from '@/lib/fillBlanks';
import { contentByCourse } from '@/data/content';
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

describe('buildBlankChoices (choice mode)', () => {
  const dialogue = (lines: [string, string, string?][]): DialogueLine[] =>
    lines.map(([id, text, pinyin]) => ({
      id,
      speakerId: 'ben',
      text,
      ...(pinyin ? { pinyin } : {}),
    }));

  const englishLines = dialogue([
    ['l1', 'Wow, your bed is so big!'],
    ['l2', 'And this is my bunny.'],
    ['l3', 'I read my book at the desk.'],
  ]);

  it('gives each blank the answer once and distinct distractors from the other blanks first', () => {
    const random = createSeededRandom(7);
    const blankLines = buildBlankLines(englishLines, { ...english, random });
    const choices = buildBlankChoices(englishLines, blankLines, {
      vocabulary: [{ text: 'lamp' }, { text: 'pillow' }],
      lang: 'en-US',
      random,
    });
    const blanks = blankLines.flatMap((blankLine) =>
      blankLine.pieces.filter((piece) => piece.kind === 'blank'),
    );
    expect(blanks).toHaveLength(3);
    for (const blank of blanks) {
      const texts = choices[blank.id].map((choice) => choice.text);
      expect(texts).toHaveLength(3);
      expect(texts.filter((text) => text === blank.answer)).toHaveLength(1);
      expect(new Set(texts).size).toBe(3);
      // Two other blanks exist: they come before the vocabulary.
      const others = blanks.filter((other) => other.id !== blank.id).map((other) => other.answer);
      expect(texts.filter((text) => text !== blank.answer).sort()).toEqual(others.sort());
    }
  });

  it('writes distractors like the answer and never offers "book" with "books"', () => {
    const lines = dialogue([['l1', 'Books are fun.']]);
    const blankLines: BlankLine[] = [
      {
        lineId: 'l1',
        pieces: [
          { kind: 'blank', id: 'b1', answer: 'Books' },
          { kind: 'text', text: ' are fun.' },
        ],
      },
    ];
    for (let seed = 0; seed < 10; seed += 1) {
      const texts = buildBlankChoices(lines, blankLines, {
        vocabulary: [{ text: 'book' }, { text: 'lamp' }, { text: 'desk' }],
        lang: 'en-US',
        random: createSeededRandom(seed),
      }).b1.map((choice) => choice.text);
      expect(texts).toContain('Books');
      expect(texts).not.toContain('Book');
      expect(texts.every((text) => /^[A-Z]/.test(text))).toBe(true);
    }
  });

  it('Chinese: Han distractors only, each with word-style pinyin', () => {
    const lines = dialogue([
      ['l1', '哇，你的床好大呀！', 'Wā, nǐ de chuáng hǎo dà ya!'],
      ['l2', '莉莉，这是你的卧室吗？', 'Lì li, zhè shì nǐ de wò shì ma?'],
    ]);
    const random = createSeededRandom(3);
    const blankLines = buildBlankLines(lines, {
      vocabulary: ['床'],
      names: ['莉莉'],
      lang: 'zh-CN',
      random,
    });
    const choices = buildBlankChoices(lines, blankLines, {
      vocabulary: [{ text: '台灯', pinyin: 'táidēng' }, { text: 'lamp' }],
      lang: 'zh-CN',
      random,
    });
    expect(choices['l1:blank']).toEqual(
      expect.arrayContaining([
        { text: '床', pinyin: 'chuáng' },
        { text: '卧室', pinyin: 'wòshì' },
        { text: '台灯', pinyin: 'táidēng' },
      ]),
    );
    expect(choices['l2:blank'].map((choice) => choice.text)).toContain('卧室');
    expect(choices['l2:blank'].every((choice) => /\p{Script=Han}/u.test(choice.text))).toBe(true);
  });

  it.each(['en', 'zh'] as const)(
    'every real conversation gets full options for every blank (%s course)',
    (course) => {
      const bundle = contentByCourse[course];
      const lang = course === 'en' ? 'en-US' : 'zh-CN';
      for (const conversation of bundle.conversations) {
        const scene = bundle.scenes.find((item) => item.id === conversation.sceneId);
        const vocabulary = (scene?.wordIds ?? []).flatMap((id) => {
          const word = bundle.words[id];
          return word ? [{ text: word.text, pinyin: word.pinyin }] : [];
        });
        for (let seed = 0; seed < 3; seed += 1) {
          const random = createSeededRandom(seed);
          const blankLines = buildBlankLines(conversation.lines, {
            vocabulary: vocabulary.map((word) => word.text),
            names: conversation.lines.map(
              (item) => bundle.speakers[item.speakerId]?.name ?? item.speakerId,
            ),
            lang,
            random,
          });
          const choices = buildBlankChoices(conversation.lines, blankLines, {
            vocabulary,
            lang,
            random,
          });
          for (const [id, options] of Object.entries(choices)) {
            const texts = options.map((option) => normalizeBlankAnswer(option.text));
            expect(options, `${conversation.id} ${id}`).toHaveLength(3);
            expect(new Set(texts).size, `${conversation.id} ${id}`).toBe(3);
            // Chinese options always show pinyin; English ones never have any.
            const withoutPinyin = options.filter((option) => !option.pinyin).length;
            expect(withoutPinyin, `${conversation.id} ${id}`).toBe(course === 'zh' ? 0 : 3);
          }
        }
      }
    },
    // Goes through every conversation of the course (slow next to the other unit tests).
    30_000,
  );
});
