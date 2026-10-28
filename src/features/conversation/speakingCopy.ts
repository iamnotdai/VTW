import { paths } from '@/app/paths';
import type { Crumb } from '@/components/layout/PageHeader';
import type { SpeechErrorKind } from '@/lib/speech';
import type { Conversation } from '@/types/models';

/** Friendly microphone messages of the speaking screens (spec §9.4). */
export const SPEECH_ERROR_TEXT: Record<SpeechErrorKind, string> = {
  'no-speech': 'We didn’t hear anything. Tap the microphone and try again!',
  'not-allowed': 'The microphone is blocked, so let’s practice by listening and repeating.',
  'audio-capture': 'No microphone was found, so let’s practice by listening and repeating.',
  network: 'Speech recognition isn’t available right now. Let’s listen and repeat instead.',
  unknown: 'Something went wrong with the microphone. Let’s listen and repeat instead.',
};

/** "Conversation › My Bedroom › Practice" (design screen 12). */
export function practiceCrumbs(conversation: Conversation): Crumb[] {
  return [
    { label: 'Conversation', to: paths.conversations },
    { label: conversation.title, to: paths.conversation(conversation.id) },
    { label: 'Practice' },
  ];
}
