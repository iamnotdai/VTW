import { SOUND_CHART_CONFIG } from '@/config/app';
import { chartTranscription, getChartSoundWords, getSoundChart } from '@/data/content';
import { t } from '@/i18n';
import type { ChartSound, ChartSoundGroup, SoundChartKind, Word } from '@/types/models';

/** The groups of a chart, in display order. */
export const CHART_GROUPS: Readonly<Record<SoundChartKind, readonly ChartSoundGroup[]>> = {
  ipa: ['vowel', 'diphthong', 'consonant'],
  pinyin: ['initial', 'final', 'tone'],
};

/** How a sound is written on the chart: "/æ/" (IPA) or "zh" (pinyin). */
export function chartSymbol(sound: ChartSound): string {
  return getSoundChart().kind === 'ipa' ? `/${sound.symbol}/` : sound.symbol;
}

export function chartTitle(kind: SoundChartKind): string {
  return kind === 'ipa' ? t('IPA Sounds') : t('Pinyin Chart');
}

export function chartGroupLabel(group: ChartSoundGroup): string {
  switch (group) {
    case 'vowel':
      return t('Vowels');
    case 'diphthong':
      return t('Diphthongs');
    case 'consonant':
      return t('Consonants');
    case 'initial':
      return t('Initials');
    case 'final':
      return t('Finals');
    case 'tone':
      return t('Tones');
  }
}

/** The example words of a sound card and of its speaking round: scene words, with pictures. */
export function getSoundExampleWords(sound: ChartSound): Word[] {
  return getChartSoundWords(sound, SOUND_CHART_CONFIG.exampleWords);
}

export interface KeyWord {
  text: string;
  /** Pinyin chart: the word's pinyin, shown under the characters. */
  transcription?: string;
}

/** The word shown under a sound on the chart. */
export function soundKeyWord(sound: ChartSound): KeyWord | undefined {
  const pinyin = getSoundChart().kind === 'pinyin';
  const word = getChartSoundWords(sound, 1)[0] ?? sound.extraExamples?.[0];
  if (!word) return undefined;
  return { text: word.text, transcription: pinyin ? chartTranscription(word) : undefined };
}
