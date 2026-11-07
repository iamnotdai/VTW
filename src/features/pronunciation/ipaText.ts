import { IPA_CONFIG } from '@/config/app';
import { getIpaSoundWords } from '@/data/content';
import { t } from '@/i18n';
import type { IpaSound, IpaSoundGroup, Word } from '@/types/models';

/** "/æ/" — how a sound is written on the chart. */
export const slashed = (symbol: string) => `/${symbol}/`;

export function ipaGroupLabel(group: IpaSoundGroup): string {
  switch (group) {
    case 'vowel':
      return t('Vowels');
    case 'diphthong':
      return t('Diphthongs');
    case 'consonant':
      return t('Consonants');
  }
}

/** The example words of a sound card and of its speaking round: scene words, with pictures. */
export function getSoundExampleWords(sound: IpaSound): Word[] {
  return getIpaSoundWords(sound, IPA_CONFIG.exampleWords);
}

/** The word shown under a sound on the chart. */
export function soundKeyWord(sound: IpaSound): string | undefined {
  return getIpaSoundWords(sound, 1)[0]?.text ?? sound.extraExamples?.[0]?.text;
}
