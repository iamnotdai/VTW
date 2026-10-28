import { ChevronLeft, ChevronRight, CircleCheck, MessagesSquare } from 'lucide-react';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { ButtonLink } from '@/components/common/Button';
import { IconButton } from '@/components/common/IconButton';
import { getWord } from '@/data/content';
import { assetUrl } from '@/lib/assets';
import { cn } from '@/lib/cn';

interface ObjectsFoundBarProps {
  /** Every object of the scene, in scene order. */
  wordIds: readonly string[];
  foundWordIds: ReadonlySet<string>;
  /** Opens an object: review for a found one, its question for the others. */
  onOpen: (wordId: string) => void;
  /** Highlights the object in the picture while a tile is hovered or focused. */
  onHighlight: (wordId: string | null) => void;
  /** Shown when every object is found. */
  conversationsHref?: string;
  /** Left end of the header row, e.g. a Back button. */
  leading?: ReactNode;
  className?: string;
}

/** Share of the visible tile row a Previous / Next press scrolls by. */
const PAGE_SHARE = 0.8;

/** Whether the tile row can scroll further to the left / right, kept fresh on scroll and resize. */
function useScrollEdges() {
  const ref = useRef<HTMLUListElement>(null);
  const [edges, setEdges] = useState({ start: true, end: true });

  const update = useCallback(() => {
    const element = ref.current;
    if (!element) return;
    const start = element.scrollLeft <= 1;
    const end = element.scrollLeft + element.clientWidth >= element.scrollWidth - 1;
    setEdges((current) =>
      current.start === start && current.end === end ? current : { start, end },
    );
  }, []);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    update();
    element.addEventListener('scroll', update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => {
      element.removeEventListener('scroll', update);
      observer.disconnect();
    };
  }, [update]);

  const scrollPage = (direction: 1 | -1) => {
    const element = ref.current;
    if (!element) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    element.scrollBy({
      left: direction * element.clientWidth * PAGE_SHARE,
      behavior: reduceMotion ? 'auto' : 'smooth',
    });
  };

  return { ref, edges, scrollPage };
}

/**
 * Layer 6 (spec §7.4 item 7; design screen 06): one tile per object — its picture once found,
 * a "?" before. The tiles double as the text alternative to the picture for keyboard and
 * screen-reader users (spec §13): unfound objects stay anonymous ("Object 3").
 */
export function ObjectsFoundBar({
  wordIds,
  foundWordIds,
  onOpen,
  onHighlight,
  conversationsHref,
  leading,
  className,
}: ObjectsFoundBarProps) {
  const total = wordIds.length;
  const found = wordIds.filter((id) => foundWordIds.has(id)).length;
  const complete = total > 0 && found === total;
  const { ref: listRef, edges, scrollPage } = useScrollEdges();

  return (
    <section
      aria-labelledby="objects-found-title"
      className={cn('rounded-2xl bg-white px-3 pt-3 pb-3 shadow-lift sm:px-5', className)}
    >
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-1">
        <div className="flex items-center justify-start">{leading}</div>
        <h2
          id="objects-found-title"
          className="text-center text-lg font-bold text-navy-900 sm:text-xl"
        >
          Objects Found
        </h2>
        <div className="flex items-center justify-end gap-3">
          {complete && conversationsHref && (
            <ButtonLink
              to={conversationsHref}
              variant="soft"
              size="sm"
              shape="pill"
              leftIcon={<MessagesSquare aria-hidden className="size-4" />}
            >
              View Conversations
            </ButtonLink>
          )}
          <p
            className={cn(
              'flex items-center gap-1.5 text-lg font-bold sm:text-xl',
              complete ? 'text-leaf-600' : 'text-navy-900',
            )}
          >
            {complete && <CircleCheck aria-hidden className="size-5" />}
            {found} / {total}
            <span className="sr-only"> found</span>
          </p>
        </div>
      </div>

      <div className="mt-2.5 flex items-center gap-2">
        <IconButton
          label="Previous objects"
          size="sm"
          disabled={edges.start}
          onClick={() => scrollPage(-1)}
        >
          <ChevronLeft aria-hidden strokeWidth={2.5} />
        </IconButton>
        <ul
          ref={listRef}
          className="vtw-no-scrollbar flex min-w-0 flex-1 snap-x gap-2.5 overflow-x-auto p-1"
        >
          {wordIds.map((wordId, index) => {
            const word = foundWordIds.has(wordId) ? getWord(wordId) : undefined;
            return (
              <li key={wordId} className="shrink-0 snap-start">
                <button
                  type="button"
                  onClick={() => onOpen(wordId)}
                  onFocus={() => onHighlight(wordId)}
                  onBlur={() => onHighlight(null)}
                  onMouseEnter={() => onHighlight(wordId)}
                  onMouseLeave={() => onHighlight(null)}
                  aria-label={
                    word
                      ? `${word.text} — found. Review it.`
                      : `Object ${index + 1} — not found yet`
                  }
                  className={cn(
                    'flex size-14 items-center justify-center rounded-xl transition hover:ring-2 hover:ring-brand-300 sm:size-16',
                    word ? 'bg-leaf-50' : 'bg-mist',
                  )}
                >
                  {word ? (
                    <img
                      src={assetUrl(word.image)}
                      alt=""
                      className="max-h-[78%] max-w-[78%] object-contain"
                      loading="lazy"
                      draggable={false}
                    />
                  ) : (
                    <span aria-hidden className="text-2xl font-extrabold text-navy-800">
                      ?
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
        <IconButton
          label="Next objects"
          size="sm"
          disabled={edges.end}
          onClick={() => scrollPage(1)}
        >
          <ChevronRight aria-hidden strokeWidth={2.5} />
        </IconButton>
      </div>
    </section>
  );
}
