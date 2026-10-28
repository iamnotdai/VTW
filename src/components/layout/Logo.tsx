import { APP_NAME } from '@/config/app';
import { BRAND_ASSETS } from '@/config/assets';
import { assetUrl } from '@/lib/assets';
import { cn } from '@/lib/cn';

interface LogoProps {
  /** `full` = wordmark + slogan, `mark` = small picture mark (narrow menu rail). */
  variant?: 'full' | 'mark';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZES = {
  sm: 'w-44',
  md: 'w-52',
  lg: 'w-72',
} as const;

/** "Village to World — Explore Life. Learn English." logo picture (it has its own white outline). */
export function Logo({ variant = 'full', size = 'md', className }: LogoProps) {
  if (variant === 'mark') {
    return (
      <img
        src={assetUrl(BRAND_ASSETS.logo)}
        alt={APP_NAME}
        className={cn('size-12 shrink-0 drop-shadow-md', className)}
        draggable={false}
      />
    );
  }

  return (
    <img
      src={assetUrl(BRAND_ASSETS.wordmark)}
      alt={APP_NAME}
      className={cn('h-auto max-w-full select-none', SIZES[size], className)}
      draggable={false}
    />
  );
}
