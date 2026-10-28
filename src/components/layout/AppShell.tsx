import { useState } from 'react';
import { cn } from '@/lib/cn';
import { Outlet, ScrollRestoration } from 'react-router';
import { useAppFullscreen } from '@/hooks/useAppFullscreen';
import { MobileNav } from './MobileNav';
import { Sidebar } from './Sidebar';

/** Desktop width and up: the menu starts expanded. Keep in sync with Tailwind's `lg`. */
const MENU_EXPANDED_MEDIA = '(min-width: 1024px)';

/** Shared layout (spec §5.1): sidebar on tablet/desktop, bottom navigation on phones. */
export function AppShell() {
  // Fullscreen (started from the Explore picture) hides the menus; it stays on across screens.
  const fullscreen = useAppFullscreen();
  // The menu starts expanded on desktop and collapsed to icons on tablets.
  const [menuCollapsed, setMenuCollapsed] = useState(
    () => !window.matchMedia(MENU_EXPANDED_MEDIA).matches,
  );

  return (
    <div className="flex min-h-dvh bg-canvas">
      <a
        href="#main"
        className="sr-only z-50 rounded-full bg-white px-4 py-2 font-bold text-brand-700 shadow-lift focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      {!fullscreen && (
        <Sidebar collapsed={menuCollapsed} onToggle={() => setMenuCollapsed((value) => !value)} />
      )}
      <main
        id="main"
        tabIndex={-1}
        className={cn(
          'relative flex min-w-0 flex-1 flex-col outline-none',
          !fullscreen && 'pb-(--mobile-nav-height) md:pb-0',
        )}
      >
        <Outlet />
      </main>
      {!fullscreen && <MobileNav />}
      <ScrollRestoration />
    </div>
  );
}
