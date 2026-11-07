import { useCallback, useEffect, useRef, useState } from 'react';
import { RECORDING_CONFIG } from '@/config/app';
import { isVoiceRecordingSupported, peakLevel, pickRecordingMimeType } from '@/lib/voiceRecorder';

export interface VoiceRecording {
  /** Object URL of the recording; revoked when it is replaced or the screen closes. */
  url: string;
  /** Loudest moment, 0–1: tells a voice from silence. */
  peak: number;
}

interface Session {
  cancelled: boolean;
  stopRequested: boolean;
  stream: MediaStream | null;
  recorder: MediaRecorder | null;
  chunks: Blob[];
  peak: number;
  context: AudioContext | null;
  timer: ReturnType<typeof setInterval> | null;
  done: Promise<VoiceRecording | null>;
  resolve: (recording: VoiceRecording | null) => void;
}

function createAudioContext(): AudioContext | null {
  const scope = window as unknown as {
    AudioContext?: typeof AudioContext;
    webkitAudioContext?: typeof AudioContext;
  };
  const Context = scope.AudioContext ?? scope.webkitAudioContext;
  try {
    return Context ? new Context() : null;
  } catch {
    return null;
  }
}

function release(session: Session) {
  if (session.timer) clearInterval(session.timer);
  session.timer = null;
  session.stream?.getTracks().forEach((track) => track.stop());
  session.stream = null;
  void session.context?.close().catch(() => {});
  session.context = null;
}

/**
 * Records the learner's voice for "Listen to yourself" (see `src/lib/voiceRecorder.ts`). The
 * recording only lives in memory and is thrown away on the next try or when the screen closes.
 * Every failure (no permission, no recorder) is silent: the button simply doesn't appear.
 */
export function useVoiceRecorder() {
  const [recording, setRecording] = useState<VoiceRecording | null>(null);
  const sessionRef = useRef<Session | null>(null);
  const urlRef = useRef<string | null>(null);

  const discard = useCallback(() => {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = null;
    setRecording(null);
  }, []);

  /** Stops and forgets the recording in progress, if any. */
  const cancel = useCallback(() => {
    const session = sessionRef.current;
    sessionRef.current = null;
    if (!session) return;
    session.cancelled = true;
    if (session.recorder && session.recorder.state !== 'inactive') {
      try {
        session.recorder.stop();
      } catch {
        // Already stopped.
      }
    }
    release(session);
    session.resolve(null);
  }, []);

  useEffect(
    () => () => {
      cancel();
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    },
    [cancel],
  );

  /** Starts recording. Call it from the same tap that starts the recognizer. */
  const start = useCallback(() => {
    if (!isVoiceRecordingSupported()) return;
    cancel();
    discard();
    let resolve: (recording: VoiceRecording | null) => void = () => {};
    const done = new Promise<VoiceRecording | null>((settle) => (resolve = settle));
    const session: Session = {
      cancelled: false,
      stopRequested: false,
      stream: null,
      recorder: null,
      chunks: [],
      peak: 0,
      // Created during the tap: Safari only runs audio contexts started by a user action.
      context: createAudioContext(),
      timer: null,
      done,
      resolve,
    };
    sessionRef.current = session;
    void session.context?.resume().catch(() => {});

    navigator.mediaDevices
      .getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } })
      .then((stream) => {
        session.stream = stream;
        if (session.cancelled || session.stopRequested) {
          release(session);
          session.resolve(null);
          return;
        }
        const mimeType = pickRecordingMimeType();
        const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
        session.recorder = recorder;
        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) session.chunks.push(event.data);
        };
        recorder.onstop = () => {
          release(session);
          if (session.cancelled || session.chunks.length === 0) {
            session.resolve(null);
            return;
          }
          const type = recorder.mimeType || mimeType || 'audio/webm';
          const blob = new Blob(session.chunks, { type });
          session.resolve({ url: URL.createObjectURL(blob), peak: session.peak });
        };
        recorder.start();

        if (session.context) {
          const analyser = session.context.createAnalyser();
          analyser.fftSize = 1024;
          session.context.createMediaStreamSource(stream).connect(analyser);
          const samples = new Float32Array(analyser.fftSize);
          session.timer = setInterval(() => {
            analyser.getFloatTimeDomainData(samples);
            session.peak = Math.max(session.peak, peakLevel(samples));
          }, RECORDING_CONFIG.levelSampleMs);
        }
      })
      .catch(() => {
        release(session);
        session.resolve(null);
      });
  }, [cancel, discard]);

  /** Stops recording. Resolves with the recording (also kept in `recording`), or `null`. */
  const stop = useCallback(async (): Promise<VoiceRecording | null> => {
    const session = sessionRef.current;
    if (!session) return null;
    session.stopRequested = true;
    if (session.recorder && session.recorder.state !== 'inactive') session.recorder.stop();
    const result = await session.done;
    if (sessionRef.current === session) sessionRef.current = null;
    if (!result) return null;
    if (session.cancelled) {
      URL.revokeObjectURL(result.url);
      return null;
    }
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = result.url;
    setRecording(result);
    return result;
  }, []);

  return { recording, start, stop, cancel, discard };
}
