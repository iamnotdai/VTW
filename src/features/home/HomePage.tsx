import { ResponsivePicture } from '@/components/common/ResponsivePicture';
import { BACKGROUNDS } from '@/config/assets';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

/**
 * Screen 02 — Journey (`/`, menu label "Journey"; the scene group "Home" is a different thing). The content area shows ONLY the picture: no buttons, cards, links or
 * calls-to-action (spec §2.1, §5.1). Navigation happens through the app menu.
 */
export function HomePage() {
  useDocumentTitle('Journey');

  return (
    <div className="relative h-[calc(100dvh-var(--mobile-nav-height))] w-full overflow-hidden md:h-dvh">
      <h1 className="sr-only">Village to World — Explore Life. Learn English.</h1>
      <ResponsivePicture
        desktop={BACKGROUNDS.home.desktop}
        mobile={BACKGROUNDS.home.mobile}
        alt="A cozy, sunny village with a path that leads out to the wide world."
        className="absolute inset-0 block"
        imgClassName="h-full w-full object-cover"
        priority
      />
    </div>
  );
}
