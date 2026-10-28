import { AVATAR_IMAGES } from '@/config/assets';
import { assetUrl } from '@/lib/assets';
import { cn } from '@/lib/cn';
import type { AvatarChoice } from '@/types/models';

interface AvatarProps {
  avatar: AvatarChoice;
  /** Diameter in px. */
  size?: number;
  alt?: string;
  /** `white` on the dark menu, `brand` (blue ring) on light surfaces. */
  ring?: 'white' | 'brand';
  className?: string;
}

/**
 * Round face avatar for menus/headers. The circle is a CSS crop (object-fit + zoom on the face) of
 * the full-body character artwork — the source image itself is never altered (spec §2.1).
 */
export function Avatar({ avatar, size = 48, alt = '', ring = 'white', className }: AvatarProps) {
  return (
    <span
      className={cn(
        'inline-block shrink-0 overflow-hidden rounded-full bg-linear-to-b from-[#d6ecff] to-[#9fcdfb]',
        ring === 'white' ? 'ring-[3px] ring-white/90' : 'ring-[3px] ring-brand-400',
        className,
      )}
      style={{ width: size, height: size }}
    >
      <img
        src={assetUrl(AVATAR_IMAGES[avatar])}
        alt={alt}
        className="h-full w-full object-cover object-top"
        draggable={false}
      />
    </span>
  );
}
