import type { ComponentProps } from 'react';
import { cn } from '@/lib/cn';

type IconButtonVariant = 'light' | 'brand' | 'soft' | 'plain' | 'ghost' | 'dark';

const VARIANTS: Record<IconButtonVariant, string> = {
  /** White circle with a blue glyph (flashcard arrows). */
  light: 'bg-white text-brand-600 shadow-soft ring-1 ring-navy-100 hover:bg-brand-50',
  /** Solid blue circle (listen buttons next to a word). */
  brand: 'bg-brand-500 text-white shadow-[0_6px_14px_-6px_rgb(11_127_254/0.8)] hover:bg-brand-600',
  /** Pale blue circle (speaking question). */
  soft: 'bg-brand-50 text-brand-500 hover:bg-brand-100',
  /** Glyph only (example sentences, dialogue lines). */
  plain: 'text-brand-500 hover:bg-brand-50',
  ghost: 'text-navy-700 hover:bg-navy-50',
  /** Navy circle over pictures (zoom controls). */
  dark: 'bg-sidebar/90 text-white shadow-soft backdrop-blur hover:bg-sidebar',
};

const SIZES = {
  sm: 'size-10 [&_svg]:size-5',
  md: 'size-11 [&_svg]:size-6',
  lg: 'size-14 [&_svg]:size-7',
  /** md on phones, lg from the `sm` breakpoint (buttons over pictures). */
  fluid: 'size-11 [&_svg]:size-6 sm:size-14 sm:[&_svg]:size-7',
} as const;

interface IconButtonProps extends ComponentProps<'button'> {
  /** Accessible name — icon-only buttons must always have one. */
  label: string;
  variant?: IconButtonVariant;
  size?: keyof typeof SIZES;
}

export function IconButton({
  label,
  variant = 'light',
  size = 'md',
  className,
  type = 'button',
  children,
  ...props
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full transition duration-150 active:scale-95 disabled:cursor-not-allowed disabled:opacity-45',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
