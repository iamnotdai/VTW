import { useCallback, useEffect, useMemo, useRef } from 'react';
import { RECORDING_CONFIG, SPEAKING_SCORE } from '@/config/app';
import type { SpeechErrorKind } from '@/lib/speech';
import {
  scoreSpeaking,
  type HeardAlternative,
  type SpeakingScore,
  type SpeakingTarget,
} from '@/lib/speakingScore';
import { canRecordAlongsideRecognition, markRecordingConflict } from '@/lib/voiceRecorder';
import { usePinyinOf } from './usePinyinOf';
import { useSpeechRecognition, type SpeechStatus } from './useSpeechRecognition';
import { useVoiceRecorder } from './useVoiceRecorder';

export interface SpeakingAttempt {
  /** `result` once a score is ready; the other states come from the recognizer (spec §9.4). */
  status: SpeechStatus;
  error: SpeechErrorKind | null;
  supported: boolean;
  /** What the recognizer is hearing right now. */
  transcript: string;
  score: SpeakingScore | null;
  /**
   * The recognizer guesses behind `score` — a new array for every try. The score itself can be
   * recomputed for the same try (pinyin arriving), so compare this to react to new tries only.
   */
  heard: readonly HeardAlternative[] | null;
  /** The learner's last try, for "Listen to yourself" (`null` when it couldn't be recorded). */
  recordingUrl: string | null;
  start: () => void;
  stop: () => void;
  reset: () => void;
}

/**
 * One speaking try at a target (Word Speaking, Role-play): the recognizer listens — and, where the
 * browser allows both at once, the voice is recorded for "Listen to yourself" — then its guesses
 * are scored. Pass a memoized `target`: a new one re-scores the last try.
 */
export function useSpeakingAttempt(target: SpeakingTarget): SpeakingAttempt {
  const speech = useSpeechRecognition({ maxAlternatives: SPEAKING_SCORE.maxAlternatives });
  const recorder = useVoiceRecorder();
  const pinyinOf = usePinyinOf();
  const recordingRef = useRef(false);

  const { status: speechStatus, results, error, supported, transcript } = speech;
  const { start: startSpeech, stop: stopSpeech, reset: resetSpeech } = speech;
  const { start: startRecording, stop: stopRecording, cancel, discard } = recorder;

  const finishRecording = useCallback(
    (recognized: boolean, errorKind: SpeechErrorKind | null) => {
      if (!recordingRef.current) return;
      recordingRef.current = false;
      void stopRecording().then((recording) => {
        if (!recording) return;
        const voice = recording.peak >= RECORDING_CONFIG.silencePeak;
        // The recording stayed silent while the recognizer heard words, or caught a voice while
        // the recognizer heard nothing: here they can't share the microphone.
        const conflict = recognized
          ? !voice
          : voice && (errorKind === 'no-speech' || errorKind === 'audio-capture');
        if (conflict) markRecordingConflict();
        if (conflict || !voice) discard();
      });
    },
    [stopRecording, discard],
  );

  // The recognizer is done: so is the recording. Stopped before anything was heard (idle), it is
  // simply dropped — the microphone must never stay on.
  useEffect(() => {
    if (speechStatus === 'result') finishRecording(true, null);
    else if (speechStatus === 'error') finishRecording(false, error);
    else if ((speechStatus === 'idle' || speechStatus === 'unsupported') && recordingRef.current) {
      recordingRef.current = false;
      cancel();
      discard();
    }
  }, [speechStatus, error, finishRecording, cancel, discard]);

  const start = useCallback(() => {
    recordingRef.current = false;
    cancel();
    discard();
    if (canRecordAlongsideRecognition()) {
      recordingRef.current = true;
      startRecording();
    }
    startSpeech();
  }, [cancel, discard, startRecording, startSpeech]);

  const reset = useCallback(() => {
    recordingRef.current = false;
    cancel();
    discard();
    resetSpeech();
  }, [cancel, discard, resetSpeech]);

  const score = useMemo(
    () => (speechStatus === 'result' ? scoreSpeaking(target, results, pinyinOf) : null),
    [speechStatus, results, target, pinyinOf],
  );

  // Guesses that can't be scored (only punctuation, say) count as not heard.
  const unheard = speechStatus === 'result' && !score;
  const status: SpeechStatus = unheard ? 'error' : speechStatus;
  const errorKind = unheard ? 'no-speech' : error;

  return {
    status,
    error: errorKind,
    supported,
    transcript,
    score,
    heard: score ? results : null,
    recordingUrl: recorder.recording?.url ?? null,
    start,
    stop: stopSpeech,
    reset,
  };
}
