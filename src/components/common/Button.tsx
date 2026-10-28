import type { ComponentProps, ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router';
import { cn } from '@/lib/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'soft' | 'ghost' | 'success' | 'warm';
export type ButtonSize = 'sm' | 'md' | 'lg';

const BASE =
  'inline-flex select-none items-center justify-center gap-2.5 whitespace-nowrap font-bold transition duration-150 active:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50';

/** Flat, bright buttons of the design board. `secondary` is the white outlined button. */
const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-brand-500 text-white shadow-cta hover:bg-brand-600',
  secondary: 'bg-white text-brand-700 ring-[1.5px] ring-brand-300 ring-inset hover:bg-brand-50',
  soft: 'bg-brand-50 text-brand-600 hover:bg-brand-100',
  ghost: 'text-navy-700 hover:bg-navy-50 active:bg-navy-100',
  success:
    'bg-leaf-500 text-white shadow-[0_10px_22px_-10px_rgb(18_181_115/0.7)] hover:bg-leaf-600',
  warm: 'bg-sun-400 text-navy-900 hover:bg-sun-300',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-10 px-4 text-[0.9375rem]',
  md: 'h-12 px-6 text-[1.0625rem]',
  lg: 'h-14 px-7 text-lg',
};

interface ButtonStyleProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** `rounded` = 12px corners (default), `pill` = fully rounded. */
  shape?: 'rounded' | 'pill';
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

function buttonClasses({
  variant = 'primary',
  size = 'md',
  shape = 'rounded',
  fullWidth = false,
  className,
}: ButtonStyleProps & { className?: string }): string {
  return cn(
    BASE,
    VARIANTS[variant],
    SIZES[size],
    shape === 'pill' ? 'rounded-full' : 'rounded-xl',
    fullWidth && 'w-full',
    className,
  );
}

export function Button({
  variant,
  size,
  shape,
  fullWidth,
  leftIcon,
  rightIcon,
  className,
  children,
  type = 'button',
  ...props
}: ButtonStyleProps & ComponentProps<'button'>) {
  return (
    <button
      type={type}
      className={buttonClasses({ variant, size, shape, fullWidth, className })}
      {...props}
    >
      {leftIcon}
      {children}
      {rightIcon}
    </button>
  );
}

/** A router link that looks like a button. */
export function ButtonLink({
  variant,
  size,
  shape,
  fullWidth,
  leftIcon,
  rightIcon,
  className,
  children,
  ...props
}: ButtonStyleProps & LinkProps) {
  return (
    <Link className={buttonClasses({ variant, size, shape, fullWidth, className })} {...props}>
      {leftIcon}
      {children}
      {rightIcon}
    </Link>
  );
}
