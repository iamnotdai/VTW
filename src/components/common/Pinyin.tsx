import { cn } from '@/lib/cn';

interface PinyinProps {
  /** Nothing renders without it (the English course has no pinyin). */
  text?: string;
  /** `span` inside phrasing content (buttons, paragraphs); it still renders as its own line. */
  as?: 'p' | 'span';
  className?: string;
}

/** Pinyin line under Chinese course text, e.g. "Wǒ ài wǒ de wòshì!". */
export function Pinyin({ text, as: Tag = 'p', className }: PinyinProps) {
  if (!text) return null;
  return (
    <Tag lang="zh-Latn-pinyin" className={cn('block text-sm font-medium text-navy-400', className)}>
      {text}
    </Tag>
  );
}
