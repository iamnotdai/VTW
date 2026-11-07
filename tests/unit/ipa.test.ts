import { describe, expect, it } from 'vitest';
import { contentByCourse, getIpaSound, getIpaSoundWords } from '@/data/content';
import { validateContent } from '@/data/validateContent';
import { highlightIpaSound, ipaSpellings, tokenizeIpa } from '@/lib/ipa';

const english = contentByCourse.en;
const spellings = ipaSpellings(english.ipaSounds);
const sounds = (ipa: string) => tokenizeIpa(ipa, spellings).tokens.map((token) => token.soundId);

describe('tokenizeIpa (spec §24.2)', () => {
  it('splits a transcription into chart sounds, longest first', () => {
    expect(sounds('/læmp/')).toEqual(['l', 'ae', 'm', 'p']);
    expect(sounds('/tʃer/')).toEqual(['ch', 'e', 'r']);
    expect(sounds('/ˈpɪktʃər/')).toEqual(['p', 'ih', 'k', 'ch', 'er']);
    expect(sounds('/ˈtɜːrtəl/')).toEqual(['t', 'ur', 't', 'schwa', 'l']);
  });

  it('ignores stress marks and spaces, and reads the happy "i" as /iː/', () => {
    expect(sounds('/ˈpensəl ˌkʌp/')).toEqual(['p', 'e', 'n', 's', 'schwa', 'l', 'k', 'uh', 'p']);
    expect(sounds('/ˈbʌni/')).toEqual(['b', 'uh', 'n', 'ee']);
  });

  it('reports symbols outside the chart', () => {
    expect(tokenizeIpa('/ˈmɪr.ɚ/', spellings).unknown).toEqual(['.', 'ɚ']);
    expect(tokenizeIpa('/ˈtɝː.t̬əl/', spellings).unknown).toEqual(['ɝ', 'ː', '.', '̬']);
  });

  it('highlights the studied sound', () => {
    expect(highlightIpaSound('/læmp/', 'ae', spellings)).toEqual([
      { text: '/l', highlight: false },
      { text: 'æ', highlight: true },
      { text: 'mp/', highlight: false },
    ]);
    expect(highlightIpaSound('/ˈbʌni/', 'ee', spellings).filter((part) => part.highlight)).toEqual([
      { text: 'i', highlight: true },
    ]);
  });
});

describe('the chart and its example words', () => {
  it('finds scene words with the sound, in scene order, without repeats', () => {
    const words = getIpaSoundWords(getIpaSound('zh')!);
    expect(words.map((word) => word.id)).toEqual(['garage-door', 'garage-overhead-door']);
    expect(getIpaSoundWords(getIpaSound('ae')!, 3)).toHaveLength(3);
    // No scene word has /ð/: the chart gives extra words instead.
    expect(getIpaSoundWords(getIpaSound('dh')!)).toEqual([]);
    expect(getIpaSound('dh')!.extraExamples?.map((example) => example.text)).toContain('mother');
  });

  it('the Chinese course has no IPA chart', () => {
    expect(contentByCourse.zh.ipaSounds).toEqual([]);
  });

  it('content:check rejects a transcription outside the chart and a sound without words', () => {
    const broken = {
      ...english,
      words: { ...english.words, mirror: { ...english.words.mirror, ipa: '/ˈmɪr.ɚ/' } },
      ipaSounds: english.ipaSounds.map((sound) =>
        sound.id === 'dh' ? { ...sound, extraExamples: undefined } : sound,
      ),
    };
    const errors = validateContent(broken);
    expect(errors).toContain(
      'words.json › "mirror": "ipa" /ˈmɪr.ɚ/ has symbols outside the chart: . ɚ',
    );
    expect(errors).toContain(
      'pronunciation/ipa.json › "dh": no word has this sound — add "extraExamples"',
    );
  });
});
