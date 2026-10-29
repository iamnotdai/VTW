import { SPEECH_CONFIG } from '@/config/app';
import type { VoiceStyle } from '@/types/models';
import { isChildVoice, voiceStyleOf } from './voices';

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
  /** Preferred browser voice (`SpeechSynthesisVoice.voiceURI`); ignored when a recorded file plays. */
  voiceURI?: string | null;
  /** Boy/girl voice from Settings; its pitch applies only when `pitch` is not set (e.g. by a speaker). */
  voiceStyle?: VoiceStyle | null;
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

const normalizedLang = (voice: SpeechSynthesisVoice) => voice.lang.replace('_', '-').toLowerCase();

/** Higher = clearer, more natural-sounding voices first (neural/Google/Apple voices over robotic ones). */
function voiceQuality(voice: SpeechSynthesisVoice): number {
  const name = voice.name.toLowerCase();
  let score = 0;
  if (/natural|neural|online/.test(name)) score += 4;
  if (/google|samantha|aria|jenny|ava|emma|andrew|brian|guy|allison|ana\b/.test(name)) score += 2;
  if (voice.localService) score += 1;
  return score;
}

/**
 * US-English browser voices only (spec: American accent), best sounding first. With a `style`, only
 * voices that sound like it; when the device has none, all US voices (better than silence).
 */
export function listUsVoices(style?: VoiceStyle | null): SpeechSynthesisVoice[] {
  const target = SPEECH_CONFIG.lang.toLowerCase();
  const all = getVoices()
    .filter((voice) => normalizedLang(voice) === target)
    .sort((a, b) => voiceQuality(b) - voiceQuality(a) || a.name.localeCompare(b.name));
  if (!style) return all;
  const matching = all.filter((voice) => voiceStyleOf(voice.name) === style);
  return matching.length > 0 ? matching : all;
}

/** The voice chosen in Settings if it is still available, else the best US voice, else any English one. */
function pickVoice(
  voiceURI?: string | null,
  style?: VoiceStyle | null,
): SpeechSynthesisVoice | null {
  const usVoices = listUsVoices(style);
  return (
    usVoices.find((voice) => voice.voiceURI === voiceURI) ??
    usVoices[0] ??
    getVoices().find((voice) => normalizedLang(voice).startsWith('en')) ??
    null
  );
}

/** Subscribes to the (asynchronous) arrival of voices. Returns an unsubscribe function. */
export function onVoicesChanged(listener: () => void): () => void {
  if (!isSpeechSynthesisSupported()) return () => {};
  const synth = window.speechSynthesis;
  const handler = () => {
    getVoices();
    listener();
  };
  synth.addEventListener?.('voiceschanged', handler);
  return () => synth.removeEventListener?.('voiceschanged', handler);
}

// Chrome may garbage-collect an utterance before `end` fires unless something references it.
let currentUtterance: SpeechSynthesisUtterance | null = null;

/** Speaks `text` with the browser voice. Returns a cancel function. */
export function speakText(
  text: string,
  options: {
    rate?: number;
    pitch?: number;
    voiceURI?: string | null;
    voiceStyle?: VoiceStyle | null;
  } & PlaybackCallbacks = {},
): () => void {
  if (!isSpeechSynthesisSupported() || !text.trim()) {
    options.onError?.();
    return () => {};
  }
  const synth = window.speechSynthesis;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = SPEECH_CONFIG.lang;
  utterance.rate = options.rate ?? SPEECH_CONFIG.rate;
  const voice = pickVoice(options.voiceURI, options.voiceStyle);
  const raisePitch = options.voiceStyle && !(voice && isChildVoice(voice.name));
  utterance.pitch =
    options.pitch ??
    (raisePitch && options.voiceStyle ? SPEECH_CONFIG.stylePitch[options.voiceStyle] : 1);
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
      voiceURI: request.voiceURI,
      voiceStyle: request.voiceStyle,
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
