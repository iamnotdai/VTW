import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type BadgeTone = 'brand' | 'leaf' | 'sun' | 'coral' | 'navy' | 'white';

const TONES: Record<BadgeTone, string> = {
  brand: 'bg-brand-50 text-navy-800',
  leaf: 'bg-leaf-50 text-leaf-700',
  sun: 'bg-sun-100 text-sun-700',
  coral: 'bg-coral-100 text-coral-700',
  navy: 'bg-navy-100 text-navy-700',
  white: 'bg-white/95 text-navy-800 shadow-sm',
};

export function Badge({
  tone = 'brand',
  size = 'md',
  icon,
  children,
  className,
}: {
  tone?: BadgeTone;
  size?: 'sm' | 'md';
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-bold',
        size === 'sm' ? 'px-2 py-0.5 text-xs [&_svg]:size-3.5' : 'px-3 py-1 text-sm [&_svg]:size-4',
        TONES[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}
