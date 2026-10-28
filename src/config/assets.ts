import type { AvatarChoice } from '@/types/models';

/**
 * Brand and screen artwork. Paths are relative to `public/` and must be resolved with `assetUrl()`.
 *
 * The files currently in public/assets are development PLACEHOLDERS (spec §20). When the official
 * artwork arrives, drop the files in and update the paths here (all artwork is WebP).
 */
export const BRAND_ASSETS = {
  logo: '/assets/branding/logo-mark.webp',
  wordmark: '/assets/branding/logo-wordmark.webp',
} as const;

export const AVATAR_IMAGES: Record<AvatarChoice, string> = {
  boy: '/assets/branding/avatar-boy.webp',
  girl: '/assets/branding/avatar-girl.webp',
};

export const AVATAR_LABELS: Record<AvatarChoice, string> = {
  boy: 'Boy',
  girl: 'Girl',
};

/** Separate artwork per form factor (spec §5.1, §6, §13). `mobile` is used below 768px. */
export const BACKGROUNDS = {
  setup: {
    desktop: '/assets/backgrounds/setup-desktop.webp',
    mobile: '/assets/backgrounds/setup-mobile.webp',
  },
  home: {
    desktop: '/assets/backgrounds/home-desktop.webp',
    mobile: '/assets/backgrounds/home-mobile.webp',
  },
} as const;

/** Backdrop of the Vocabulary scene list (sky on top, soft cream below so the cards stay readable). */
export const VOCABULARY_BACKGROUND = '/assets/backgrounds/vocabulary-desktop.webp';

/** Portrait artwork behind the sidebar; the top is plain navy so the menu stays readable. */
export const SIDEBAR_BACKGROUND = '/assets/backgrounds/sidebar.webp';

/** Media query that switches to the mobile artwork. Keep in sync with Tailwind's `md` breakpoint. */
export const MOBILE_MEDIA_QUERY = '(max-width: 767.98px)';
