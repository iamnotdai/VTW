import type {
  RecognitionErrorEventLike,
  RecognitionEventLike,
  SpeechRecognitionLike,
} from '@/lib/speech';

/**
 * A stand-in for the browser's SpeechRecognition (jsdom has none). Each `start()` "hears" the next
 * queued answer: recognizer guesses (best first), an error code such as "no-speech", or `hold` —
 * it keeps listening until `stop()`, then ends without having heard anything.
 */
export type FakeHeard =
  { guesses: string[]; confidence?: number } | { error: string } | { hold: true };

const queue: FakeHeard[] = [];

class FakeSpeechRecognition implements SpeechRecognitionLike {
  lang = '';
  continuous = false;
  interimResults = false;
  maxAlternatives = 1;
  onaudiostart: (() => void) | null = null;
  onspeechend: (() => void) | null = null;
  onresult: ((event: RecognitionEventLike) => void) | null = null;
  onerror: ((event: RecognitionErrorEventLike) => void) | null = null;
  onend: (() => void) | null = null;
  private holding = false;

  start() {
    const heard = queue.shift() ?? { error: 'no-speech' };
    if ('hold' in heard) {
      this.holding = true;
      setTimeout(() => this.onaudiostart?.(), 0);
      return;
    }
    setTimeout(() => {
      this.onaudiostart?.();
      if ('error' in heard) {
        this.onerror?.({ error: heard.error });
      } else {
        const result = Object.assign(
          heard.guesses.map((transcript, index) => ({
            transcript,
            confidence: index === 0 ? (heard.confidence ?? 0.9) : 0,
          })),
          { isFinal: true },
        );
        this.onresult?.({ resultIndex: 0, results: [result] });
      }
      this.onspeechend?.();
      this.onend?.();
    }, 0);
  }

  stop() {
    if (!this.holding) return;
    this.holding = false;
    setTimeout(() => this.onend?.(), 0);
  }

  abort() {
    this.holding = false;
  }
}

/** Installs the fake recognizer; the answers are heard one per `start()`. Returns an uninstall function. */
export function installFakeSpeechRecognition(...answers: FakeHeard[]): () => void {
  queue.splice(0, queue.length, ...answers);
  const scope = window as unknown as { SpeechRecognition?: unknown };
  scope.SpeechRecognition = FakeSpeechRecognition;
  return () => {
    delete scope.SpeechRecognition;
    queue.length = 0;
  };
}

/** Queues more answers for the installed fake. */
export function queueHeard(...answers: FakeHeard[]) {
  queue.push(...answers);
}
