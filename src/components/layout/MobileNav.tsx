import { NavLink } from 'react-router';
import { cn } from '@/lib/cn';
import { NAV_ITEMS } from './navItems';

/** Bottom navigation for phones (< md). Large touch targets, safe-area aware. */
export function MobileNav() {
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-navy-100 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-nav backdrop-blur md:hidden"
    >
      <ul className="mx-auto flex h-18 max-w-lg items-stretch justify-around px-2">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <li key={to} className="flex flex-1">
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex flex-1 flex-col items-center justify-center gap-1 rounded-2xl text-xs font-semibold transition',
                  isActive ? 'text-brand-600' : 'text-navy-400 hover:text-navy-700',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={cn(
                      'flex h-8 w-14 items-center justify-center rounded-xl transition',
                      isActive &&
                        'bg-brand-500 text-white shadow-[0_6px_14px_-6px_rgb(11_127_254/0.9)]',
                    )}
                  >
                    <Icon aria-hidden className="size-5.5" />
                  </span>
                  {label}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
