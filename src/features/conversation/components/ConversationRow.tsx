import { Check, ChevronRight } from 'lucide-react';
import { Link } from 'react-router';
import { cn } from '@/lib/cn';
import type { Conversation } from '@/types/models';

/**
 * Numbered conversation row (design screen 09): number box + title pill with an arrow. The
 * conversation to watch next is highlighted in blue; finished ones get a green tick.
 */
export function ConversationRow({
  conversation,
  to,
  completed,
  upNext,
}: {
  conversation: Conversation;
  to: string;
  completed: boolean;
  upNext: boolean;
}) {
  return (
    <Link
      to={to}
      aria-label={`Conversation ${conversation.order}: ${conversation.title}${completed ? ' (completed)' : ''}`}
      className="group flex items-center gap-2.5 rounded-xl"
    >
      <span
        className={cn(
          'flex size-14 shrink-0 items-center justify-center rounded-xl border text-xl font-bold transition',
          upNext
            ? 'border-brand-500 bg-brand-500 text-white'
            : 'border-navy-100 bg-white text-navy-800 group-hover:border-brand-300',
        )}
      >
        {conversation.order}
      </span>
      <span
        className={cn(
          'flex h-14 min-w-0 flex-1 items-center justify-between gap-3 rounded-xl pr-3 pl-5 text-lg font-semibold transition sm:text-xl',
          upNext
            ? 'bg-brand-500 text-white shadow-cta'
            : 'bg-mist text-navy-800 group-hover:bg-brand-100',
        )}
      >
        <span className="truncate">{conversation.title}</span>
        <span className="flex shrink-0 items-center gap-2">
          {completed && (
            <span className="flex size-6 items-center justify-center rounded-full bg-leaf-500 text-white">
              <Check aria-hidden className="size-4" strokeWidth={3} />
            </span>
          )}
          <span
            className={cn(
              'flex size-8 items-center justify-center rounded-full',
              upNext ? 'bg-white/25 text-white' : 'text-brand-500',
            )}
          >
            <ChevronRight aria-hidden className="size-6" strokeWidth={2.5} />
          </span>
        </span>
      </span>
    </Link>
  );
}
