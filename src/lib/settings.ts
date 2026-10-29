import { DEFAULT_SETTINGS } from '@/config/app';
import type { AppSettings } from '@/types/models';

/** Validates settings read from storage, filling missing or invalid fields with defaults. */
export function sanitizeSettings(raw: unknown): AppSettings | null {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return null;
  const value = raw as Record<string, unknown>;
  const probability = value.quizTypingProbability;
  return {
    soundEnabled:
      typeof value.soundEnabled === 'boolean' ? value.soundEnabled : DEFAULT_SETTINGS.soundEnabled,
    showVietnameseMeaning:
      typeof value.showVietnameseMeaning === 'boolean'
        ? value.showVietnameseMeaning
        : DEFAULT_SETTINGS.showVietnameseMeaning,
    quizTypingProbability:
      typeof probability === 'number' && probability >= 0 && probability <= 1
        ? probability
        : DEFAULT_SETTINGS.quizTypingProbability,
    voiceURI:
      typeof value.voiceURI === 'string' && value.voiceURI !== ''
        ? value.voiceURI
        : DEFAULT_SETTINGS.voiceURI,
    voiceStyle:
      value.voiceStyle === 'boy' || value.voiceStyle === 'girl'
        ? value.voiceStyle
        : DEFAULT_SETTINGS.voiceStyle,
  };
}
