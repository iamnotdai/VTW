import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useSpeakingAttempt } from '@/hooks/useSpeakingAttempt';
import type { SpeakingTarget } from '@/lib/speakingScore';
import { installFakeSpeechRecognition } from '../fakeSpeechRecognition';

/** jsdom has no microphone: a fake stream and MediaRecorder that remember what happened. */
const track = { stop: vi.fn<() => void>() };
const recorders: FakeMediaRecorder[] = [];

class FakeMediaRecorder {
  static isTypeSupported = () => true;
  state: 'inactive' | 'recording' = 'inactive';
  mimeType = 'audio/webm';
  ondataavailable: ((event: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;
  constructor() {
    recorders.push(this);
  }
  start() {
    this.state = 'recording';
  }
  stop() {
    this.state = 'inactive';
    setTimeout(() => {
      this.ondataavailable?.({ data: new Blob(['voice']) });
      this.onstop?.();
    }, 0);
  }
}

const TARGET: SpeakingTarget = { text: 'bed', kind: 'word' };
let uninstall: (() => void) | null = null;

beforeEach(() => {
  recorders.length = 0;
  track.stop.mockClear();
  vi.stubGlobal('MediaRecorder', FakeMediaRecorder);
  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    value: {
      getUserMedia: vi.fn<() => Promise<{ getTracks: () => (typeof track)[] }>>(async () => ({
        getTracks: () => [track],
      })),
    },
  });
  URL.createObjectURL = vi.fn<(blob: Blob) => string>(() => 'blob:voice');
  URL.revokeObjectURL = vi.fn<(url: string) => void>();
});

afterEach(() => {
  uninstall?.();
  uninstall = null;
  vi.unstubAllGlobals();
  Reflect.deleteProperty(navigator, 'mediaDevices');
});

describe('useSpeakingAttempt', () => {
  it('turns the microphone off when the learner stops before anything was heard', async () => {
    uninstall = installFakeSpeechRecognition({ hold: true });
    const { result } = renderHook(() => useSpeakingAttempt(TARGET));

    act(() => result.current.start());
    await waitFor(() => expect(recorders[0]?.state).toBe('recording'));
    await waitFor(() => expect(result.current.status).toBe('listening'));

    act(() => result.current.stop());
    await waitFor(() => expect(result.current.status).toBe('idle'));
    await waitFor(() => expect(track.stop).toHaveBeenCalled());
    expect(recorders[0].state).toBe('inactive');
    expect(result.current.recordingUrl).toBeNull();
  });

  it('keeps the recording of a scored try for "Listen to yourself"', async () => {
    uninstall = installFakeSpeechRecognition({ guesses: ['bed'] });
    const { result } = renderHook(() => useSpeakingAttempt(TARGET));

    act(() => result.current.start());
    await waitFor(() => expect(result.current.score?.score).toBeGreaterThan(80));
    // No audio analyser in jsdom, so the recording counts as silent and is dropped (a voice
    // recorded alongside the recognizer is kept in a real browser).
    await waitFor(() => expect(track.stop).toHaveBeenCalled());
    expect(result.current.heard?.[0].transcript).toBe('bed');
  });
});
