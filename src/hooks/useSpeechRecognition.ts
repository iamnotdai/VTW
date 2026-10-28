import { useCallback, useEffect, useRef, useState } from 'react';
import { SPEECH_CONFIG } from '@/config/app';
import {
  getSpeechRecognitionConstructor,
  toSpeechErrorKind,
  type SpeechErrorKind,
  type SpeechRecognitionLike,
} from '@/lib/speech';

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
  error: SpeechErrorKind | null;
}

/**
 * Wraps the browser SpeechRecognition API. The microphone permission is requested by the browser
 * only when `start()` is called from a user action. Nothing is recorded, uploaded or stored by
 * the app (the browser vendor may process audio online — see spec §9.4).
 */
export function useSpeechRecognition() {
  const supported = getSpeechRecognitionConstructor() !== null;
  const [state, setState] = useState<SpeechRecognitionState>(() => ({
    status: supported ? 'idle' : 'unsupported',
    transcript: '',
    alternatives: [],
    error: null,
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
      setState({ status: 'unsupported', transcript: '', alternatives: [], error: null });
      return;
    }
    abortCurrent();

    const recognition = new Recognition();
    recognition.lang = SPEECH_CONFIG.lang;
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 3;
    stoppedByUserRef.current = false;

    let finalAlternatives: string[] = [];
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
          finalAlternatives = Array.from({ length: result.length }, (_, k) => result[k].transcript)
            .map((text) => text.trim())
            .filter(Boolean);
        } else {
          interim += result[0]?.transcript ?? '';
        }
      }
      const transcript = finalAlternatives[0] ?? interim.trim();
      setState((s) => ({ ...s, transcript }));
    };
    recognition.onerror = (event) => {
      error = toSpeechErrorKind(event.error);
    };
    recognition.onend = () => {
      if (recognitionRef.current !== recognition) return;
      recognitionRef.current = null;
      if (finalAlternatives.length > 0) {
        setState({
          status: 'result',
          transcript: finalAlternatives[0],
          alternatives: finalAlternatives,
          error: null,
        });
      } else if (error) {
        setState({ status: 'error', transcript: '', alternatives: [], error });
      } else if (stoppedByUserRef.current) {
        setState({ status: 'idle', transcript: '', alternatives: [], error: null });
      } else {
        setState({ status: 'error', transcript: '', alternatives: [], error: 'no-speech' });
      }
    };

    recognitionRef.current = recognition;
    setState({ status: 'requesting-permission', transcript: '', alternatives: [], error: null });
    try {
      recognition.start();
    } catch {
      recognitionRef.current = null;
      setState({ status: 'error', transcript: '', alternatives: [], error: 'unknown' });
    }
  }, [abortCurrent]);

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
      setState({ status: 'idle', transcript: '', alternatives: [], error: null });
    }
  }, [abortCurrent]);

  const reset = useCallback(() => {
    abortCurrent();
    setState({
      status: getSpeechRecognitionConstructor() ? 'idle' : 'unsupported',
      transcript: '',
      alternatives: [],
      error: null,
    });
  }, [abortCurrent]);

  return { ...state, supported, start, stop, reset };
}
