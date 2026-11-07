import type { PinyinOf } from './speakingScore';

/* -------------------------------------------------------------------------------------------------
 * Pinyin of any Chinese text, for scoring what the recognizer heard (spec §7.7): homophones count
 * as right and tone slips are spotted. The dictionary is big (~140 kB gzipped), so it is its own
 * chunk, loaded the first time a Chinese speaking screen opens. Until then — or if it fails —
 * scoring simply compares characters.
 * -----------------------------------------------------------------------------------------------*/

let loaded: PinyinOf | null = null;
let loading: Promise<PinyinOf | null> | null = null;

export function loadPinyinOf(): Promise<PinyinOf | null> {
  loading ??= import('pinyin-pro')
    .then(({ pinyin }) => {
      loaded = (text) => pinyin(text, { type: 'array', toneType: 'num' });
      return loaded;
    })
    .catch(() => {
      loading = null;
      return null;
    });
  return loading;
}

/** The loaded lookup, or `null` while it hasn't arrived. */
export function getLoadedPinyinOf(): PinyinOf | null {
  return loaded;
}
