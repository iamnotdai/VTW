import type { ComponentProps } from 'react';
import { cn } from '@/lib/cn';

/** White card with a hairline border and a soft shadow. Don't pass another border width. */
export function Card({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn('rounded-card border border-navy-100 bg-white shadow-soft', className)}
      {...props}
    />
  );
}
