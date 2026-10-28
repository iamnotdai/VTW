import { assetUrl } from '@/lib/assets';

/** Decorative picture of a scene group (Home, Garden…); groups without artwork yet render nothing. */
export function GroupIcon({ icon }: { icon?: string }) {
  if (!icon) return null;
  return (
    <img
      src={assetUrl(icon)}
      alt=""
      aria-hidden
      draggable={false}
      className="size-12 shrink-0 object-contain"
    />
  );
}
