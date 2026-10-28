import { MOBILE_MEDIA_QUERY } from '@/config/assets';
import { assetUrl } from '@/lib/assets';

interface ResponsivePictureProps {
  desktop: string;
  mobile: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  priority?: boolean;
}

/** Separate artwork for phones vs. tablet/desktop (spec §6 "Quy tắc responsive"). */
export function ResponsivePicture({
  desktop,
  mobile,
  alt,
  className,
  imgClassName,
  priority = false,
}: ResponsivePictureProps) {
  return (
    <picture className={className}>
      <source media={MOBILE_MEDIA_QUERY} srcSet={assetUrl(mobile)} />
      <img
        src={assetUrl(desktop)}
        alt={alt}
        className={imgClassName}
        draggable={false}
        fetchPriority={priority ? 'high' : undefined}
      />
    </picture>
  );
}
