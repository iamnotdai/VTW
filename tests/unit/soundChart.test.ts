import { afterEach, describe, expect, it } from 'vitest';
import { contentByCourse, getChartSound, getChartSoundWords } from '@/data/content';
import { validateContent } from '@/data/validateContent';
import { setActiveCourse } from '@/lib/course';
import { ipaSpellings, tokenizeIpa } from '@/lib/ipa';
import { parsePinyinSyllable, splitPinyin, tokenizePinyin } from '@/lib/pinyinChart';
import { highlightSound } from '@/lib/soundChart';

const english = contentByCourse.en;
const chinese = contentByCourse.zh;
const spellings = ipaSpellings(english.soundChart.sounds);
const ipaSounds = (ipa: string) => tokenizeIpa(ipa, spellings).tokens.map((token) => token.soundId);

afterEach(() => setActiveCourse('en'));

describe('IPA chart (spec §24.2)', () => {
  it('splits a transcription into chart sounds, longest first', () => {
    expect(ipaSounds('/læmp/')).toEqual(['l', 'ae', 'm', 'p']);
    expect(ipaSounds('/tʃer/')).toEqual(['ch', 'e', 'r']);
    expect(ipaSounds('/ˈpɪktʃər/')).toEqual(['p', 'ih', 'k', 'ch', 'er']);
    expect(ipaSounds('/ˈtɜːrtəl/')).toEqual(['t', 'ur', 't', 'schwa', 'l']);
  });

  it('ignores stress marks and spaces, and reads the happy "i" as /iː/', () => {
    expect(ipaSounds('/ˈpensəl ˌkʌp/')).toEqual(['p', 'e', 'n', 's', 'schwa', 'l', 'k', 'uh', 'p']);
    expect(ipaSounds('/ˈbʌni/')).toEqual(['b', 'uh', 'n', 'ee']);
  });

  it('reports symbols outside the chart', () => {
    expect(tokenizeIpa('/ˈmɪr.ɚ/', spellings).unknown).toEqual(['.', 'ɚ']);
    expect(tokenizeIpa('/ˈtɝː.t̬əl/', spellings).unknown).toEqual(['ɝ', 'ː', '.', '̬']);
  });

  it('highlights the studied sound', () => {
    const tokens = tokenizeIpa('/læmp/', spellings).tokens;
    expect(highlightSound('/læmp/', tokens, 'ae')).toEqual([
      { text: '/l', highlight: false },
      { text: 'æ', highlight: true },
      { text: 'mp/', highlight: false },
    ]);
  });

  it('finds scene words with the sound; alias-only words come last', () => {
    // Two scenes have a "garage door": it is listed once.
    expect(getChartSoundWords(getChartSound('zh')!).map((word) => word.id)).toEqual([
      'garage-door',
    ]);
    expect(getChartSoundWords(getChartSound('ae')!, 3)).toHaveLength(3);
    const ee = getChartSoundWords(getChartSound('ee')!);
    expect(ee[0].ipa).toContain('iː');
    expect(ee.findIndex((word) => word.id === 'balcony')).toBeGreaterThan(0);
    // No scene word has /ð/: the chart gives extra words instead.
    expect(getChartSoundWords(getChartSound('dh')!)).toEqual([]);
  });

  it('content:check rejects a transcription outside the chart and a sound without words', () => {
    const errors = validateContent({
      ...english,
      words: { ...english.words, mirror: { ...english.words.mirror, ipa: '/ˈmɪr.ɚ/' } },
      soundChart: {
        kind: 'ipa',
        sounds: english.soundChart.sounds.map((sound) =>
          sound.id === 'dh' ? { ...sound, extraExamples: undefined } : sound,
        ),
      },
    });
    expect(errors).toContain(
      'words.json › "mirror": "ipa" /ˈmɪr.ɚ/ has parts outside the chart: . ɚ',
    );
    expect(errors).toContain(
      'pronunciation/ipa.json › "dh": no word has this sound — add "extraExamples"',
    );
  });
});

describe('pinyin chart (spec §24.2)', () => {
  const syllables = (pinyin: string, expected?: number) =>
    splitPinyin(pinyin, expected)?.map(
      (item) =>
        `${pinyin.slice(item.start, item.end)}:${item.initial || '∅'}+${item.final}${item.tone}`,
    );

  it('reads initial, final (full spelling) and tone of a syllable', () => {
    expect(parsePinyinSyllable('chuang')).toEqual({ initial: 'ch', final: 'uang' });
    expect(parsePinyinSyllable('liu')).toEqual({ initial: 'l', final: 'iou' });
    expect(parsePinyinSyllable('gui')).toEqual({ initial: 'g', final: 'uei' });
    expect(parsePinyinSyllable('dun')).toEqual({ initial: 'd', final: 'uen' });
    expect(parsePinyinSyllable('xue')).toEqual({ initial: 'x', final: 'üe' });
    expect(parsePinyinSyllable('shi')).toEqual({ initial: 'sh', final: '-i' });
    expect(parsePinyinSyllable('yuan')).toEqual({ initial: '', final: 'üan' });
    expect(parsePinyinSyllable('wo')).toEqual({ initial: '', final: 'uo' });
    expect(parsePinyinSyllable('bbb')).toBeNull();
  });

  it('cuts joined pinyin into syllables, with tones', () => {
    expect(syllables('táidēng')).toEqual(['tái:t+ai2', 'dēng:d+eng1']);
    expect(syllables('chuángtóuguì', 3)).toEqual(['chuáng:ch+uang2', 'tóu:t+ou2', 'guì:g+uei4']);
    expect(syllables('ěrduo')).toEqual(['ěr:∅+er3', 'duo:d+uo5']);
    // A syllable starting with a, o or e inside a word needs an apostrophe: dàngāo = dàn + gāo.
    expect(syllables('dàngāo')).toEqual(['dàn:d+an4', 'gāo:g+ao1']);
    expect(syllables("Xī'ān")).toEqual(['Xī:x+i1', 'ān:∅+an1']);
    expect(splitPinyin('táidēng', 3)).toBeNull();
    expect(splitPinyin('hello')).toBeNull();
  });

  it('tokens: initial, final and tone (the whole syllable) per syllable', () => {
    const tokens = tokenizePinyin('chuáng', chinese.soundChart.sounds, 1).tokens;
    expect(tokens).toEqual([
      { soundId: 'ch', start: 0, end: 2 },
      { soundId: 'uang', start: 2, end: 6 },
      { soundId: 'tone2', start: 0, end: 6 },
    ]);
    expect(highlightSound('chuáng', tokens, 'uang')).toEqual([
      { text: 'ch', highlight: false },
      { text: 'uáng', highlight: true },
    ]);
  });

  it('finds Chinese scene words for initials, finals and tones', () => {
    setActiveCourse('zh');
    const zhWords = getChartSoundWords(getChartSound('zh')!);
    expect(zhWords.length).toBeGreaterThan(0);
    expect(zhWords.every((word) => /zh/i.test(word.pinyin ?? ''))).toBe(true);
    expect(getChartSoundWords(getChartSound('tone3')!).length).toBeGreaterThan(0);
    // "er" is in no scene word: the chart has extra words (二, 耳朵…).
    expect(getChartSoundWords(getChartSound('er')!)).toEqual([]);
    expect(getChartSound('er')!.extraExamples?.map((example) => example.text)).toContain('二');
  });

  it('content:check rejects pinyin that is not one syllable per character', () => {
    const errors = validateContent({
      ...chinese,
      words: { ...chinese.words, bed: { ...chinese.words.bed, pinyin: 'chuángg' } },
    });
    expect(errors.some((error) => error.startsWith('words.json › "bed": "pinyin" chuángg'))).toBe(
      true,
    );
  });
});

describe('example words', () => {
  it('never list the same written word twice (the same word in two scenes)', () => {
    for (const course of ['en', 'zh'] as const) {
      setActiveCourse(course);
      for (const sound of contentByCourse[course].soundChart.sounds) {
        const texts = getChartSoundWords(sound).map((word) => word.text.toLowerCase());
        expect(new Set(texts).size, `${course} ${sound.id}`).toBe(texts.length);
      }
    }
  });
});
