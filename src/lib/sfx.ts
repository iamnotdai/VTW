import { SFX_CONFIG } from '@/config/app';

/* -------------------------------------------------------------------------------------------------
 * Short feedback sounds, synthesized with the Web Audio API (no audio files to ship or license):
 * - correct:   a bright rising chime;
 * - wrong:     a soft "uh-oh" (two falling notes, never a harsh buzzer);
 * - completed: a little fanfare for finishing the flashcards or a whole scene.
 * Call them from user interactions so browsers allow audio.
 * -----------------------------------------------------------------------------------------------*/

export type SfxName = 'correct' | 'wrong' | 'completed';

export interface SfxNote {
  /** Hz. */
  frequency: number;
  /** Start, in seconds from the beginning of the sound. */
  at: number;
  /** Seconds until the note has faded out. */
  duration: number;
  /** 0–1, before the master volume. */
  gain: number;
  type: OscillatorType;
  /** Optional pitch slide (Hz reached at the end of the note). */
  glideTo?: number;
}

const C5 = 523.25;
const E5 = 659.25;
const G5 = 783.99;
const C6 = 1046.5;
const E6 = 1318.51;
const G6 = 1567.98;
const C7 = 2093;

export const SFX_NOTES: Record<SfxName, readonly SfxNote[]> = {
  correct: [C6, E6, G6, C7].map((frequency, index) => ({
    frequency,
    at: index * 0.09,
    duration: 0.35,
    gain: 0.35,
    type: 'triangle' as const,
  })),
  wrong: [
    { frequency: 392, at: 0, duration: 0.2, gain: 0.4, type: 'sine', glideTo: 370 },
    { frequency: 330, at: 0.22, duration: 0.38, gain: 0.4, type: 'sine', glideTo: 294 },
  ],
  completed: [
    // Rising arpeggio…
    ...[C5, E5, G5].map((frequency, index) => ({
      frequency,
      at: index * 0.12,
      duration: 0.3,
      gain: 0.3,
      type: 'triangle' as const,
    })),
    // …then a held major chord with a sparkle on top.
    ...[C6, E6, G6].map((frequency) => ({
      frequency,
      at: 0.36,
      duration: 1.1,
      gain: 0.18,
      type: 'triangle' as const,
    })),
    { frequency: C7, at: 0.48, duration: 0.5, gain: 0.12, type: 'sine' },
    { frequency: G6 * 2, at: 0.6, duration: 0.4, gain: 0.08, type: 'sine' },
  ],
};

type AudioContextConstructor = typeof AudioContext;

let context: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor: AudioContextConstructor | undefined =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: AudioContextConstructor }).webkitAudioContext;
  if (!Ctor) return null;
  context ??= new Ctor();
  return context;
}

/** Plays a feedback sound. Returns a function that fades it out early; no-op without Web Audio. */
export function playSfx(name: SfxName): () => void {
  if (!SFX_CONFIG.enabled) return () => {};
  const audio = getAudioContext();
  if (!audio) return () => {};
  if (audio.state === 'suspended') void audio.resume();

  const master = audio.createGain();
  master.gain.value = SFX_CONFIG.volume;
  master.connect(audio.destination);

  const start = audio.currentTime + 0.02;
  for (const note of SFX_NOTES[name]) {
    const at = start + note.at;
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = note.type;
    osc.frequency.setValueAtTime(note.frequency, at);
    if (note.glideTo) osc.frequency.linearRampToValueAtTime(note.glideTo, at + note.duration);
    gain.gain.setValueAtTime(0, at);
    gain.gain.linearRampToValueAtTime(note.gain, at + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, at + note.duration);
    osc.connect(gain).connect(master);
    osc.start(at);
    osc.stop(at + note.duration + 0.05);
  }

  let stopped = false;
  return () => {
    if (stopped) return;
    stopped = true;
    // Quick fade instead of a click.
    const now = audio.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(master.gain.value, now);
    master.gain.linearRampToValueAtTime(0, now + 0.1);
    setTimeout(() => master.disconnect(), 150);
  };
}
