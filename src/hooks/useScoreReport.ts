import { useEffect, useLayoutEffect, useRef } from 'react';
import { playSfx } from '@/lib/sfx';
import type { SpeakingScore } from '@/lib/speakingScore';
import { useSettingsStore } from '@/stores/settingsStore';
import type { SpeakingAttempt } from './useSpeakingAttempt';

/**
 * Passes every score of a speaking attempt to `onScore` (the session keeps the best one) and plays
 * a gentle sound once per try — not again when the same try is re-scored (pinyin arriving late).
 */
export function useScoreReport(
  attempt: Pick<SpeakingAttempt, 'score' | 'heard'>,
  onScore: (score: SpeakingScore) => void,
) {
  const onScoreRef = useRef(onScore);
  useLayoutEffect(() => {
    onScoreRef.current = onScore;
  }, [onScore]);
  const soundedRef = useRef<unknown>(null);
  const { score, heard } = attempt;

  useEffect(() => {
    if (!score) return;
    onScoreRef.current(score);
    if (soundedRef.current === heard) return;
    soundedRef.current = heard;
    if (!useSettingsStore.getState().settings.soundEnabled) return;
    if (score.level === 'great') playSfx('correct');
    else if (score.level === 'try-again') playSfx('wrong');
  }, [score, heard]);
}
