import { CircleCheck } from 'lucide-react';
import { Link } from 'react-router';
import { paths } from '@/app/paths';
import { Pinyin } from '@/components/common/Pinyin';
import { Breadcrumb, PageContainer, TopBar } from '@/components/layout/PageHeader';
import { SPEAKING_SCORE } from '@/config/app';
import { getSoundChart } from '@/data/content';
import { useCourse } from '@/hooks/useCourse';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { t } from '@/i18n';
import { cn } from '@/lib/cn';
import { useSpeakingProgressStore } from '@/stores/speakingProgressStore';
import type { ChartSound } from '@/types/models';
import {
  CHART_GROUPS,
  chartGroupLabel,
  chartSymbol,
  chartTitle,
  getSoundExampleWords,
  soundKeyWord,
} from '../soundChartText';

/** A sound counts as practiced once one of its example words was said well (spec §24.1). */
function useSaidWell(sound: ChartSound): boolean {
  const scores = useSpeakingProgressStore((state) => state.speaking.bestScoreByWordId);
  return getSoundExampleWords(sound).some(
    (word) => (scores[word.id] ?? -1) >= SPEAKING_SCORE.great,
  );
}

function SoundTile({ sound }: { sound: ChartSound }) {
  const course = useCourse();
  const saidWell = useSaidWell(sound);
  const keyWord = soundKeyWord(sound);
  return (
    <li className="flex">
      <Link
        to={paths.chartSound(sound.id)}
        className={cn(
          'relative flex flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl bg-white px-2 py-4 text-center shadow-soft ring-1 transition outline-none hover:-translate-y-0.5 hover:shadow-lift focus-visible:ring-4 focus-visible:ring-brand-200',
          saidWell ? 'ring-leaf-300' : 'ring-navy-100',
        )}
      >
        <span className="text-[1.75rem] leading-none font-extrabold text-navy-900">
          {chartSymbol(sound)}
        </span>
        {sound.nameVi && (
          <span lang="vi" className="text-xs font-bold text-brand-600">
            {sound.nameVi}
          </span>
        )}
        {keyWord && (
          <span lang={course.lang} className="text-sm font-semibold text-navy-500">
            {keyWord.text}
          </span>
        )}
        {keyWord?.transcription && (
          <Pinyin as="span" text={keyWord.transcription} className="text-xs" />
        )}
        {saidWell && (
          <span className="absolute top-1.5 right-1.5 text-leaf-500">
            <CircleCheck aria-hidden className="size-5" />
            <span className="sr-only">{t('said well')}</span>
          </span>
        )}
      </Link>
    </li>
  );
}

/**
 * Sound chart (`/pronunciation/sounds`, spec §24.2–24.3): the American English IPA chart (vowels,
 * diphthongs, consonants) or, in the Chinese course, the pinyin chart (initials, finals, tones).
 * A sound opens its card.
 */
export function SoundChartPage() {
  const chart = getSoundChart();
  const title = chartTitle(chart.kind);
  useDocumentTitle(title);

  return (
    <>
      <TopBar>
        <Breadcrumb
          items={[{ label: t('Pronunciation'), to: paths.pronunciation }, { label: title }]}
        />
      </TopBar>
      <PageContainer width="wide" className="flex flex-col gap-6">
        <div>
          <h1 className="text-[1.875rem] leading-tight font-extrabold text-navy-900 sm:text-[2.25rem]">
            {title}
          </h1>
          <p className="mt-1 text-base font-medium text-navy-500 sm:text-lg">
            {chart.kind === 'ipa'
              ? t('The sounds of American English. Tap a sound to hear and say words with it.')
              : t(
                  'The initials, finals and tones of Mandarin. Tap one to hear and say words with it.',
                )}
          </p>
        </div>
        {CHART_GROUPS[chart.kind].map((group) => (
          <section key={group} aria-labelledby={`chart-${group}`}>
            <h2 id={`chart-${group}`} className="mb-3 text-xl font-extrabold text-navy-900">
              {chartGroupLabel(group)}
            </h2>
            <ul className="grid grid-cols-3 gap-3 min-[30rem]:grid-cols-4 sm:grid-cols-6 lg:grid-cols-8">
              {chart.sounds
                .filter((sound) => sound.group === group)
                .map((sound) => (
                  <SoundTile key={sound.id} sound={sound} />
                ))}
            </ul>
          </section>
        ))}
      </PageContainer>
    </>
  );
}
