import { SPEECH_CONFIG } from '@/config/app';

/* -------------------------------------------------------------------------------------------------
 * Playback: recorded audio files first (consistent voice), browser text-to-speech as fallback.
 * Only one sound plays at a time. Nothing here auto-plays: callers run it from user interactions.
 * -----------------------------------------------------------------------------------------------*/

export interface SoundRequest {
  /** Spoken with the browser voice when there is no audio file or it cannot be played. */
  text: string;
  /** Recorded audio file URL (already resolved with `assetUrl`). */
  src?: string;
  rate?: number;
  pitch?: number;
}

export interface PlaybackCallbacks {
  onEnd?: () => void;
  onError?: () => void;
}

export function isSpeechSynthesisSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    typeof window.SpeechSynthesisUtterance === 'function'
  );
}

let cachedVoices: SpeechSynthesisVoice[] = [];

function getVoices(): SpeechSynthesisVoice[] {
  if (!isSpeechSynthesisSupported()) return [];
  const voices = window.speechSynthesis.getVoices();
  if (voices.length > 0) cachedVoices = voices;
  return cachedVoices;
}

if (isSpeechSynthesisSupported()) {
  // Voices load asynchronously in Chrome; refresh the cache when they arrive.
  window.speechSynthesis.addEventListener?.('voiceschanged', getVoices);
}

function pickVoice(lang: string): SpeechSynthesisVoice | null {
  const voices = getVoices();
  const normalized = (voice: SpeechSynthesisVoice) => voice.lang.replace('_', '-').toLowerCase();
  const target = lang.toLowerCase();
  return (
    voices.find((voice) => normalized(voice) === target && voice.localService) ??
    voices.find((voice) => normalized(voice) === target) ??
    voices.find((voice) => normalized(voice).startsWith(target.slice(0, 2))) ??
    null
  );
}

// Chrome may garbage-collect an utterance before `end` fires unless something references it.
let currentUtterance: SpeechSynthesisUtterance | null = null;

/** Speaks `text` with the browser voice. Returns a cancel function. */
export function speakText(
  text: string,
  options: { rate?: number; pitch?: number } & PlaybackCallbacks = {},
): () => void {
  if (!isSpeechSynthesisSupported() || !text.trim()) {
    options.onError?.();
    return () => {};
  }
  const synth = window.speechSynthesis;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = SPEECH_CONFIG.lang;
  utterance.rate = options.rate ?? SPEECH_CONFIG.rate;
  utterance.pitch = options.pitch ?? 1;
  const voice = pickVoice(SPEECH_CONFIG.lang);
  if (voice) utterance.voice = voice;

  let settled = false;
  utterance.onend = () => {
    if (settled) return;
    settled = true;
    currentUtterance = null;
    options.onEnd?.();
  };
  utterance.onerror = () => {
    if (settled) return;
    settled = true;
    currentUtterance = null;
    options.onError?.();
  };

  if (synth.speaking || synth.pending) synth.cancel();
  synth.resume();
  currentUtterance = utterance;
  synth.speak(utterance);

  return () => {
    settled = true;
    if (currentUtterance === utterance) {
      currentUtterance = null;
      synth.cancel();
    }
  };
}

/** Plays an audio file. Returns a stop function. */
export function playAudioFile(src: string, callbacks: PlaybackCallbacks = {}): () => void {
  if (typeof Audio === 'undefined') {
    callbacks.onError?.();
    return () => {};
  }
  const audio = new Audio(src);
  let settled = false;
  const settle = (callback?: () => void) => {
    if (settled) return;
    settled = true;
    callback?.();
  };
  audio.addEventListener('ended', () => settle(callbacks.onEnd));
  audio.addEventListener('error', () => settle(callbacks.onError));
  audio.play().catch(() => settle(callbacks.onError));
  return () => {
    settled = true;
    audio.pause();
    audio.removeAttribute('src');
    audio.load();
  };
}

let activeStop: (() => void) | null = null;

export function stopSound(): void {
  const stop = activeStop;
  activeStop = null;
  stop?.();
}

/**
 * Plays a recorded file when available, otherwise (or when it fails) speaks the text.
 * Stops whatever was playing before. Returns a stop function.
 */
export function playSound(request: SoundRequest, callbacks: PlaybackCallbacks = {}): () => void {
  stopSound();
  let settled = false;
  let cancelCurrent: () => void = () => {};

  function stop() {
    if (settled) return;
    settled = true;
    if (activeStop === stop) activeStop = null;
    cancelCurrent();
  }

  const settle = (callback?: () => void) => {
    if (settled) return;
    settled = true;
    if (activeStop === stop) activeStop = null;
    callback?.();
  };

  const speakFallback = () => {
    if (settled) return;
    cancelCurrent = speakText(request.text, {
      rate: request.rate,
      pitch: request.pitch,
      onEnd: () => settle(callbacks.onEnd),
      onError: () => settle(callbacks.onError),
    });
  };

  activeStop = stop;
  if (request.src) {
    cancelCurrent = playAudioFile(request.src, {
      onEnd: () => settle(callbacks.onEnd),
      onError: speakFallback,
    });
  } else {
    speakFallback();
  }
  return stop;
}

/* -------------------------------------------------------------------------------------------------
 * Speech recognition (optional, spec §9.4). Not available in every browser, may use an online
 * service, and only recognizes words — it is NOT a pronunciation score. Always offer a fallback.
 * -----------------------------------------------------------------------------------------------*/

export interface RecognitionAlternativeLike {
  transcript: string;
  confidence: number;
}

export interface RecognitionResultLike {
  readonly isFinal: boolean;
  readonly length: number;
  [index: number]: RecognitionAlternativeLike;
}

export interface RecognitionEventLike {
  readonly resultIndex: number;
  readonly results: { readonly length: number; [index: number]: RecognitionResultLike };
}

export interface RecognitionErrorEventLike {
  readonly error: string;
}

export interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onaudiostart: (() => void) | null;
  onspeechend: (() => void) | null;
  onresult: ((event: RecognitionEventLike) => void) | null;
  onerror: ((event: RecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

export type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

export function getSpeechRecognitionConstructor(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null;
  const scope = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return scope.SpeechRecognition ?? scope.webkitSpeechRecognition ?? null;
}

export function isSpeechRecognitionSupported(): boolean {
  return getSpeechRecognitionConstructor() !== null;
}

export type SpeechErrorKind = 'not-allowed' | 'no-speech' | 'audio-capture' | 'network' | 'unknown';

/** Maps a SpeechRecognition error code. Returns `null` for user aborts. */
export function toSpeechErrorKind(code: string): SpeechErrorKind | null {
  switch (code) {
    case 'aborted':
      return null;
    case 'not-allowed':
    case 'service-not-allowed':
      return 'not-allowed';
    case 'no-speech':
      return 'no-speech';
    case 'audio-capture':
      return 'audio-capture';
    case 'network':
      return 'network';
    default:
      return 'unknown';
  }
}
