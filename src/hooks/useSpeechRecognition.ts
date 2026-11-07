import { useCallback, useEffect, useRef, useState } from 'react';
import { getCourseConfig } from '@/lib/course';
import {
  getSpeechRecognitionConstructor,
  toSpeechErrorKind,
  type SpeechErrorKind,
  type SpeechRecognitionLike,
} from '@/lib/speech';
import type { HeardAlternative } from '@/lib/speakingScore';
import { useAudioStore } from '@/stores/audioStore';

/** idle → requesting-permission → listening → processing → result (spec §9.4). */
export type SpeechStatus =
  | 'unsupported'
  | 'idle'
  | 'requesting-permission'
  | 'listening'
  | 'processing'
  | 'result'
  | 'error';

export interface SpeechRecognitionState {
  status: SpeechStatus;
  /** Live transcript while listening, then the best final alternative. */
  transcript: string;
  /** Final alternatives, best first. */
  alternatives: string[];
  /** The same alternatives with the recognizer's confidence (0 = not reported). */
  results: HeardAlternative[];
  error: SpeechErrorKind | null;
}

const empty = (): Omit<SpeechRecognitionState, 'status'> => ({
  transcript: '',
  alternatives: [],
  results: [],
  error: null,
});

export interface SpeechRecognitionOptions {
  /** How many guesses the recognizer should return (default 3). */
  maxAlternatives?: number;
}

/**
 * Wraps the browser SpeechRecognition API. The microphone permission is requested by the browser
 * only when `start()` is called from a user action. Nothing is recorded, uploaded or stored by
 * the app (the browser vendor may process audio online — see spec §9.4).
 */
export function useSpeechRecognition({ maxAlternatives = 3 }: SpeechRecognitionOptions = {}) {
  const supported = getSpeechRecognitionConstructor() !== null;
  const [state, setState] = useState<SpeechRecognitionState>(() => ({
    status: supported ? 'idle' : 'unsupported',
    ...empty(),
  }));
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const stoppedByUserRef = useRef(false);

  const abortCurrent = useCallback(() => {
    const recognition = recognitionRef.current;
    recognitionRef.current = null;
    if (!recognition) return;
    recognition.onaudiostart = null;
    recognition.onspeechend = null;
    recognition.onresult = null;
    recognition.onerror = null;
    recognition.onend = null;
    try {
      recognition.abort();
    } catch {
      // Already stopped.
    }
  }, []);

  useEffect(() => abortCurrent, [abortCurrent]);

  const start = useCallback(() => {
    const Recognition = getSpeechRecognitionConstructor();
    if (!Recognition) {
      setState({ status: 'unsupported', ...empty() });
      return;
    }
    abortCurrent();
    // A word still playing would be heard by the microphone.
    useAudioStore.getState().stop();

    const recognition = new Recognition();
    recognition.lang = getCourseConfig().lang;
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = maxAlternatives;
    stoppedByUserRef.current = false;

    let finalResults: HeardAlternative[] = [];
    let error: SpeechErrorKind | null = null;

    recognition.onaudiostart = () =>
      setState((s) => (s.status === 'requesting-permission' ? { ...s, status: 'listening' } : s));
    recognition.onspeechend = () =>
      setState((s) => (s.status === 'listening' ? { ...s, status: 'processing' } : s));
    recognition.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        if (result.isFinal) {
          finalResults = Array.from({ length: result.length }, (_, k) => ({
            transcript: result[k].transcript.trim(),
            confidence: Number.isFinite(result[k].confidence) ? result[k].confidence : 0,
          })).filter((alternative) => alternative.transcript !== '');
        } else {
          interim += result[0]?.transcript ?? '';
        }
      }
      const transcript = finalResults[0]?.transcript ?? interim.trim();
      setState((s) => ({ ...s, transcript }));
    };
    recognition.onerror = (event) => {
      error = toSpeechErrorKind(event.error);
    };
    recognition.onend = () => {
      if (recognitionRef.current !== recognition) return;
      recognitionRef.current = null;
      if (finalResults.length > 0) {
        setState({
          status: 'result',
          transcript: finalResults[0].transcript,
          alternatives: finalResults.map((alternative) => alternative.transcript),
          results: finalResults,
          error: null,
        });
      } else if (error) {
        setState({ status: 'error', ...empty(), error });
      } else if (stoppedByUserRef.current) {
        setState({ status: 'idle', ...empty() });
      } else {
        setState({ status: 'error', ...empty(), error: 'no-speech' });
      }
    };

    recognitionRef.current = recognition;
    setState({ status: 'requesting-permission', ...empty() });
    try {
      recognition.start();
    } catch {
      recognitionRef.current = null;
      setState({ status: 'error', ...empty(), error: 'unknown' });
    }
  }, [abortCurrent, maxAlternatives]);

  /** Stops listening; whatever was heard so far is still processed. */
  const stop = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;
    stoppedByUserRef.current = true;
    setState((s) => ({ ...s, status: 'processing' }));
    try {
      recognition.stop();
    } catch {
      abortCurrent();
      setState({ status: 'idle', ...empty() });
    }
  }, [abortCurrent]);

  const reset = useCallback(() => {
    abortCurrent();
    setState({ status: getSpeechRecognitionConstructor() ? 'idle' : 'unsupported', ...empty() });
  }, [abortCurrent]);

  return { ...state, supported, start, stop, reset };
}
