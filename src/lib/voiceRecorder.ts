/* -------------------------------------------------------------------------------------------------
 * "Listen to yourself" (spec §7.7, §9.5): while the speech recognizer listens, the page may also
 * record the learner's voice so they can hear themselves next to the example. The recording only
 * lives in memory (an object URL) and is thrown away on the next try or when the screen closes —
 * nothing is saved or uploaded (spec §9.4).
 * -----------------------------------------------------------------------------------------------*/

export function isVoiceRecordingSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.MediaRecorder === 'function' &&
    typeof navigator !== 'undefined' &&
    typeof navigator.mediaDevices?.getUserMedia === 'function'
  );
}

/** A format this browser can record and play back: Opus/WebM (Chrome, Firefox) or MP4 (Safari). */
export function pickRecordingMimeType(): string | undefined {
  if (!isVoiceRecordingSupported()) return undefined;
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'];
  return candidates.find((type) => window.MediaRecorder.isTypeSupported?.(type));
}

/**
 * Android hands the microphone to either the speech service or the page, never both, so recording
 * there would leave the recognizer deaf. Elsewhere both can listen at once.
 */
export function canRecordAlongsideRecognition(
  userAgent: string = typeof navigator === 'undefined' ? '' : navigator.userAgent,
): boolean {
  return isVoiceRecordingSupported() && !hasRecordingConflict() && !/android/i.test(userAgent);
}

let recordingConflict = false;

/**
 * Remembers (for this visit only) that recording got in the way of the recognizer — it heard
 * nothing while the recording caught a voice, or the recording stayed silent. From then on only
 * the recognizer listens.
 */
export function markRecordingConflict(): void {
  recordingConflict = true;
}

export function hasRecordingConflict(): boolean {
  return recordingConflict;
}

/** Test helper. */
export function resetRecordingConflictForTests(): void {
  recordingConflict = false;
}

/** Loudest absolute sample of a waveform buffer (0–1). */
export function peakLevel(samples: ArrayLike<number>): number {
  let peak = 0;
  for (let i = 0; i < samples.length; i += 1) {
    const value = Math.abs(samples[i]);
    if (value > peak) peak = value;
  }
  return peak;
}
