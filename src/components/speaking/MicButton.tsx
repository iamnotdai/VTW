import { Headphones, LoaderCircle, Mic, Square } from 'lucide-react';
import type { SpeechStatus } from '@/hooks/useSpeechRecognition';
import { t } from '@/i18n';
import { cn } from '@/lib/cn';

/** Functions, so the copy is looked up in the active course when it is shown. */
const MIC_LABEL: Partial<Record<SpeechStatus, () => string>> = {
  'requesting-permission': () => t('Please allow the microphone…'),
  listening: () => t('Listening… tap to stop'),
  processing: () => t('Checking what you said…'),
};

const SIZES = {
  lg: {
    halo: 'size-44',
    inner: 'inset-5',
    ping: 'inset-7',
    button: 'size-24',
    icon: 'size-10',
    stop: 'size-8',
    label: 'text-lg',
  },
  md: {
    halo: 'size-32',
    inner: 'inset-4',
    ping: 'inset-5',
    button: 'size-18',
    icon: 'size-8',
    stop: 'size-6',
    label: 'text-base',
  },
} as const;

/**
 * Big round microphone with its light-blue halo (spec §9.4): tap to speak, tap again to stop.
 * The line under it says what is happening.
 */
export function MicButton({
  status,
  onStart,
  onStop,
  idleLabel = t('Tap to speak'),
  size = 'lg',
}: {
  status: SpeechStatus;
  onStart: () => void;
  onStop: () => void;
  idleLabel?: string;
  size?: keyof typeof SIZES;
}) {
  const busy = status === 'requesting-permission' || status === 'processing';
  const listening = status === 'listening';
  const label = listening || busy ? MIC_LABEL[status]?.() : idleLabel;
  const s = SIZES[size];
  return (
    <div className="flex flex-col items-center">
      <div className={cn('relative flex items-center justify-center', s.halo)}>
        <span aria-hidden className="absolute inset-0 rounded-full bg-brand-50" />
        <span aria-hidden className={cn('absolute rounded-full bg-brand-100/80', s.inner)} />
        {listening && (
          <span
            aria-hidden
            className={cn('absolute rounded-full bg-coral-400/60 motion-safe:animate-ping', s.ping)}
          />
        )}
        <button
          type="button"
          onClick={listening ? onStop : onStart}
          disabled={busy}
          aria-label={listening ? t('Stop listening') : idleLabel}
          className={cn(
            'relative flex items-center justify-center rounded-full text-white transition active:scale-95 disabled:opacity-80',
            s.button,
            listening
              ? 'bg-coral-500 shadow-[0_10px_22px_-10px_rgb(239_106_74/0.8)]'
              : 'bg-brand-500 shadow-cta hover:bg-brand-600',
          )}
        >
          {busy ? (
            <LoaderCircle aria-hidden className={cn('motion-safe:animate-spin', s.icon)} />
          ) : listening ? (
            <Square aria-hidden className={cn('fill-current', s.stop)} />
          ) : (
            <Mic aria-hidden className={s.icon} />
          )}
        </button>
      </div>
      <p role="status" className={cn('mt-1 min-h-7 font-bold text-navy-900', s.label)}>
        {label}
      </p>
    </div>
  );
}

/** The Listen & Repeat fallback in place of the microphone (spec §9.4). */
export function ListenRepeatBadge({ size = 'lg' }: { size?: keyof typeof SIZES }) {
  const s = SIZES[size];
  return (
    <div className="flex flex-col items-center">
      <div className={cn('relative flex items-center justify-center', s.halo)}>
        <span aria-hidden className="absolute inset-0 rounded-full bg-brand-50" />
        <span aria-hidden className={cn('absolute rounded-full bg-brand-100/80', s.inner)} />
        <span
          className={cn(
            'relative flex items-center justify-center rounded-full bg-brand-500 text-white shadow-cta',
            s.button,
          )}
        >
          <Headphones aria-hidden className={s.icon} />
        </span>
      </div>
      <h3 className={cn('mt-1 font-bold text-navy-900', s.label)}>{t('Listen & Repeat')}</h3>
    </div>
  );
}
