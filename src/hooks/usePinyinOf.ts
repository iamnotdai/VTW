import { useEffect, useState } from 'react';
import { getLoadedPinyinOf, loadPinyinOf } from '@/lib/pinyin';
import type { PinyinOf } from '@/lib/speakingScore';
import { useCourse } from './useCourse';

/** The pinyin lookup in the Chinese course (loaded on first use), `null` otherwise or while loading. */
export function usePinyinOf(): PinyinOf | null {
  const chinese = useCourse().id === 'zh';
  const [pinyinOf, setPinyinOf] = useState<PinyinOf | null>(getLoadedPinyinOf);

  useEffect(() => {
    if (!chinese || pinyinOf) return;
    let active = true;
    void loadPinyinOf().then((lookup) => {
      if (active && lookup) setPinyinOf(() => lookup);
    });
    return () => {
      active = false;
    };
  }, [chinese, pinyinOf]);

  return chinese ? pinyinOf : null;
}
