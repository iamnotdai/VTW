import { t } from '@/i18n';
import { cn } from '@/lib/cn';
import type { SpeakingLevel } from '@/lib/speakingScore';

const LEVEL_COLOR: Record<SpeakingLevel, string> = {
  great: 'var(--color-leaf-500)',
  good: 'var(--color-sun-500)',
  'try-again': 'var(--color-coral-500)',
};

/** Round speaking score, 0–100, coloured by level (green / yellow / coral). */
export function ScoreRing({
  score,
  level,
  size = 64,
  className,
}: {
  score: number;
  level: SpeakingLevel;
  size?: number;
  className?: string;
}) {
  const stroke = Math.max(4, Math.round(size / 11));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const value = Math.max(0, Math.min(100, Math.round(score)));
  return (
    <span
      role="img"
      aria-label={t('Score: {score} out of 100', { score: value })}
      className={cn('relative inline-flex shrink-0 items-center justify-center', className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="white"
          stroke="var(--color-navy-100)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={LEVEL_COLOR[level]}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - value / 100)}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <span
        aria-hidden
        className="absolute font-extrabold text-navy-900 tabular-nums"
        style={{ fontSize: Math.round(size * 0.34) }}
      >
        {value}
      </span>
    </span>
  );
}
