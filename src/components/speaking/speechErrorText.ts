import { t } from '@/i18n';
import type { SpeechErrorKind } from '@/lib/speech';

/** Friendly microphone messages of the speaking screens (spec §9.4). */
export function speechErrorText(error: SpeechErrorKind): string {
  switch (error) {
    case 'no-speech':
      return t('We didn’t hear anything. Tap the microphone and try again!');
    case 'not-allowed':
      return t('The microphone is blocked, so let’s practice by listening and repeating.');
    case 'audio-capture':
      return t('No microphone was found, so let’s practice by listening and repeating.');
    case 'network':
      return t('Speech recognition isn’t available right now. Let’s listen and repeat instead.');
    case 'unknown':
      return t('Something went wrong with the microphone. Let’s listen and repeat instead.');
  }
}

/** Errors after which the microphone can't be used: switch to Listen & Repeat. */
export function isBlockingSpeechError(error: SpeechErrorKind | null): boolean {
  return error !== null && error !== 'no-speech';
}
