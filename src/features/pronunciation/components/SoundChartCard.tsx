import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router';
import { paths } from '@/app/paths';
import { getSoundChart } from '@/data/content';
import { t } from '@/i18n';
import type { SoundChartKind } from '@/types/models';
import { chartTitle } from '../soundChartText';

/** A few symbols on the card, to show what's inside. */
const PREVIEW: Readonly<Record<SoundChartKind, readonly string[]>> = {
  ipa: ['/æ/', '/θ/', '/ʃ/', '/oʊ/'],
  pinyin: ['zh', 'ü', 'ang', 'ǎ'],
};

/** The sound chart's topic card, at the top of the Pronunciation menu (spec §24). */
export function SoundChartCard() {
  const chart = getSoundChart();
  const total = chart.sounds.length;
  return (
    <Link
      to={paths.soundChart}
      className="group mb-5 flex items-center gap-4 rounded-2xl bg-white p-4 shadow-soft ring-1 ring-navy-100 transition outline-none hover:-translate-y-0.5 hover:shadow-lift focus-visible:ring-4 focus-visible:ring-brand-200 sm:p-5"
    >
      <span
        aria-hidden
        className="hidden shrink-0 grid-cols-2 gap-1.5 rounded-xl bg-brand-50 p-2.5 min-[30rem]:grid"
      >
        {PREVIEW[chart.kind].map((symbol) => (
          <span
            key={symbol}
            className="flex size-11 items-center justify-center rounded-lg bg-white text-lg font-extrabold text-brand-600 shadow-soft"
          >
            {symbol}
          </span>
        ))}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xl font-extrabold text-navy-900">{chartTitle(chart.kind)}</span>
        <span className="block font-medium text-navy-500">
          {chart.kind === 'ipa'
            ? t('The {count} sounds of American English, with words from the scenes.', {
                count: total,
              })
            : t('Initials, finals and tones, with words from the scenes.')}
        </span>
      </span>
      <ChevronRight
        aria-hidden
        className="size-6 shrink-0 text-navy-400 transition group-hover:translate-x-0.5"
      />
    </Link>
  );
}
