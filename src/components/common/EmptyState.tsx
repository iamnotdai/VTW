import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Card } from './Card';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  message?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, message, actions, className }: EmptyStateProps) {
  return (
    <Card
      className={cn('mx-auto flex max-w-lg flex-col items-center gap-3 p-8 text-center', className)}
    >
      {icon && (
        <span className="flex size-16 items-center justify-center rounded-full bg-sun-100 text-sun-600 [&_svg]:size-8">
          {icon}
        </span>
      )}
      <h2 className="text-2xl font-extrabold text-navy-900">{title}</h2>
      {message && <div className="font-semibold text-navy-500">{message}</div>}
      {actions && <div className="mt-2 flex flex-wrap justify-center gap-3">{actions}</div>}
    </Card>
  );
}
