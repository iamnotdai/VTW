import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { NavLink } from 'react-router';
import { SIDEBAR_BACKGROUND } from '@/config/assets';
import { assetUrl } from '@/lib/assets';
import { cn } from '@/lib/cn';
import { useProfileStore } from '@/stores/profileStore';
import { LearnerChip } from './LearnerChip';
import { Logo } from './Logo';
import { NAV_ITEMS } from './navItems';

function MenuList({ iconOnly }: { iconOnly: boolean }) {
  return (
    <ul className={cn('flex flex-col gap-3', iconOnly && 'items-center')}>
      {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
        <li key={to} className={iconOnly ? undefined : 'w-full'}>
          <NavLink
            to={to}
            end={end}
            title={iconOnly ? label : undefined}
            className={({ isActive }) =>
              cn(
                'flex h-14 items-center rounded-xl font-semibold transition',
                iconOnly ? 'w-14 justify-center' : 'gap-4 px-4 text-lg',
                isActive
                  ? 'bg-linear-to-r from-[#2a90ff] to-brand-500 text-white shadow-[0_10px_20px_-10px_rgb(11_127_254/0.9)]'
                  : 'text-white/90 hover:bg-white/10 hover:text-white',
              )
            }
          >
            <Icon aria-hidden className="size-6.5 shrink-0" />
            <span className={iconOnly ? 'sr-only' : undefined}>{label}</span>
          </NavLink>
        </li>
      ))}
    </ul>
  );
}

/**
 * Vertical menu (spec §5.1) on tablet/desktop, hidden on phones where MobileNav takes over. The
 * logo is pinned on top with a collapse button beside it (like ChatGPT); collapsed to icons only,
 * the logo itself is the button that expands the menu again.
 */
export function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const profile = useProfileStore((state) => state.profile);
  const ToggleIcon = collapsed ? PanelLeftOpen : PanelLeftClose;

  return (
    <aside
      className={cn(
        'sticky top-0 hidden h-dvh shrink-0 flex-col overflow-hidden bg-linear-to-b from-sidebar to-sidebar-deep text-white transition-[width] duration-300 md:flex',
        collapsed ? 'w-20' : 'w-64',
      )}
    >
      <img
        src={assetUrl(SIDEBAR_BACKGROUND)}
        alt=""
        aria-hidden
        className="pointer-events-none absolute inset-0 size-full object-cover object-bottom"
      />
      <div
        className={cn(
          'relative flex h-28 items-center px-3',
          collapsed ? 'justify-center' : 'justify-between gap-1',
        )}
      >
        {collapsed ? (
          <button
            type="button"
            aria-expanded={false}
            aria-label="Expand menu"
            title="Expand menu"
            onClick={onToggle}
            className="group relative flex size-14 items-center justify-center rounded-xl transition hover:bg-white/10"
          >
            <Logo
              variant="mark"
              className="transition group-hover:opacity-0 group-focus-visible:opacity-0"
            />
            <ToggleIcon
              aria-hidden
              className="absolute size-6 opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100"
            />
          </button>
        ) : (
          <>
            <Logo size="sm" />
            <button
              type="button"
              aria-expanded
              aria-label="Collapse menu"
              title="Collapse menu"
              onClick={onToggle}
              className="flex size-10 shrink-0 items-center justify-center rounded-xl text-white/80 transition hover:bg-white/10 hover:text-white"
            >
              <ToggleIcon aria-hidden className="size-6" />
            </button>
          </>
        )}
      </div>

      <nav aria-label="Main" className="relative flex-1 px-3 pt-1">
        <MenuList iconOnly={collapsed} />
      </nav>

      <div className={cn('relative flex p-3 pb-6', collapsed ? 'justify-center' : 'px-6')}>
        {profile && <LearnerChip tone="dark" compact={collapsed} />}
      </div>
    </aside>
  );
}
