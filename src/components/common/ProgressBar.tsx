import { cn } from '@/lib/cn';

interface ProgressBarProps {
  /** 0–100 */
  value: number;
  /** Accessible name, e.g. "Bedroom progress". */
  label: string;
  size?: 'sm' | 'md';
  className?: string;
}

const clampPercent = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

export function ProgressBar({ value, label, size = 'md', className }: ProgressBarProps) {
  const percent = clampPercent(value);
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      aria-valuetext={`${percent}%`}
      className={cn(
        'w-full overflow-hidden rounded-full bg-[#e7eef9]',
        size === 'sm' ? 'h-1.5' : 'h-2',
        className,
      )}
    >
      <div
        className="h-full rounded-full bg-leaf-500 transition-[width] duration-500 ease-out"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

/** Green progress ring of the Topic Overview ("35% Completed"). */
export function ProgressRing({
  value,
  label,
  size = 44,
  stroke = 6,
  className,
}: {
  value: number;
  label: string;
  size?: number;
  stroke?: number;
  className?: string;
}) {
  const percent = clampPercent(value);
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  return (
    <svg
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      aria-valuetext={`${percent}%`}
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={cn('shrink-0 -rotate-90', className)}
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#e2f3ea"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--color-leaf-500)"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - percent / 100)}
        className="transition-[stroke-dashoffset] duration-700 ease-out"
      />
    </svg>
  );
}
