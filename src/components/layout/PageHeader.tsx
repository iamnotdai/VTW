import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { cn } from '@/lib/cn';

export interface Crumb {
  label: string;
  to?: string;
}

export function Breadcrumb({ items, className }: { items: Crumb[]; className?: string }) {
  return (
    <nav aria-label="Breadcrumb" className={cn('min-w-0', className)}>
      <ol className="flex min-w-0 items-center gap-1.5 text-base font-semibold whitespace-nowrap">
        {items.map((item, index) => {
          const last = index === items.length - 1;
          return (
            <li
              key={`${item.label}-${index}`}
              className={cn(
                'min-w-0 items-center gap-1.5',
                last ? 'flex shrink' : 'shrink-0',
                // Phones keep the last two steps only.
                !last && (index < items.length - 2 ? 'hidden sm:flex' : 'flex'),
              )}
            >
              {item.to && !last ? (
                <Link
                  to={item.to}
                  className="rounded-md px-0.5 text-brand-700 hover:text-brand-500 hover:underline"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  aria-current={last ? 'page' : undefined}
                  className={cn(
                    'truncate px-0.5',
                    last ? 'font-bold text-navy-900' : 'text-brand-700',
                  )}
                >
                  {item.label}
                </span>
              )}
              {!last && <ChevronRight aria-hidden className="size-4 shrink-0 text-navy-400" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/** "‹ Back" link of the Topic Overview top bar. */
export function BackLink({ to, label = 'Back' }: { to: string; label?: string }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-1.5 rounded-lg py-1 pr-2 text-lg font-semibold text-brand-600 hover:text-brand-500"
    >
      <ChevronLeft aria-hidden className="size-5" strokeWidth={2.5} />
      {label}
    </Link>
  );
}

/** Big page title with its one-line description (Vocabulary, Conversation, Settings…). */
export function PageTitle({
  title,
  description,
  id,
  className,
  descriptionClassName = 'font-medium text-navy-400',
}: {
  title: ReactNode;
  description?: ReactNode;
  id?: string;
  className?: string;
  /** Replaces the default muted weight and colour, e.g. on top of artwork. */
  descriptionClassName?: string;
}) {
  return (
    <div className={cn('min-w-0', className)}>
      <h1
        id={id}
        className="text-[1.875rem] leading-tight font-extrabold text-navy-900 sm:text-[2.25rem]"
      >
        {title}
      </h1>
      {description && (
        <p className={cn('mt-0.5 text-base sm:text-lg', descriptionClassName)}>{description}</p>
      )}
    </div>
  );
}

/**
 * Top of every screen except Journey: breadcrumb / back link / page title. The learner chip lives
 * only in the sidebar.
 */
export function TopBar({
  children,
  variant = 'bar',
  transparent = false,
  className,
}: {
  children?: ReactNode;
  /** `bar` = slim white bar over the content, `title` = taller block for a page title. */
  variant?: 'bar' | 'title';
  /** No white fill (keeps the thin divider), for screens whose artwork shows through the header. */
  transparent?: boolean;
  className?: string;
}) {
  return (
    <header
      className={cn(
        'relative z-30 flex items-center gap-4 px-4 sm:px-6 md:pl-6 lg:pr-8 lg:pl-8',
        'border-b border-navy-100',
        !transparent && 'bg-white',
        variant === 'bar' ? 'min-h-(--top-bar-height) py-2' : 'py-5 lg:py-6',
        className,
      )}
    >
      <div className="min-w-0 flex-1">{children}</div>
    </header>
  );
}

export function PageContainer({
  className,
  children,
  width = 'default',
}: {
  className?: string;
  children: ReactNode;
  width?: 'default' | 'narrow' | 'wide' | 'full';
}) {
  return (
    <div
      className={cn(
        'mx-auto w-full px-4 py-6 sm:px-6 lg:px-8 lg:py-7',
        width === 'narrow' && 'max-w-3xl',
        width === 'default' && 'max-w-5xl',
        width === 'wide' && 'max-w-6xl',
        className,
      )}
    >
      {children}
    </div>
  );
}
