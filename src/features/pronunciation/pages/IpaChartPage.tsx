import { CircleCheck, Languages } from 'lucide-react';
import { Link } from 'react-router';
import { paths } from '@/app/paths';
import { ButtonLink } from '@/components/common/Button';
import { EmptyState } from '@/components/common/EmptyState';
import { Breadcrumb, PageContainer, TopBar } from '@/components/layout/PageHeader';
import { SPEAKING_SCORE } from '@/config/app';
import { getIpaSounds } from '@/data/content';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { t } from '@/i18n';
import { cn } from '@/lib/cn';
import { useSpeakingProgressStore } from '@/stores/speakingProgressStore';
import type { IpaSound, IpaSoundGroup } from '@/types/models';
import { getSoundExampleWords, ipaGroupLabel, slashed, soundKeyWord } from '../ipaText';

const GROUPS: readonly IpaSoundGroup[] = ['vowel', 'diphthong', 'consonant'];

/** A sound counts as practised once one of its example words was said well (spec §24.1). */
function useSaidWell(sound: IpaSound): boolean {
  const scores = useSpeakingProgressStore((state) => state.speaking.bestScoreByWordId);
  return getSoundExampleWords(sound).some(
    (word) => (scores[word.id] ?? -1) >= SPEAKING_SCORE.great,
  );
}

function SoundTile({ sound }: { sound: IpaSound }) {
  const saidWell = useSaidWell(sound);
  const keyWord = soundKeyWord(sound);
  return (
    <li className="flex">
      <Link
        to={paths.ipaSound(sound.id)}
        className={cn(
          'relative flex flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl bg-white px-2 py-4 text-center shadow-soft ring-1 transition outline-none hover:-translate-y-0.5 hover:shadow-lift focus-visible:ring-4 focus-visible:ring-brand-200',
          saidWell ? 'ring-leaf-300' : 'ring-navy-100',
        )}
      >
        <span className="text-[1.75rem] leading-none font-extrabold text-navy-900">
          {slashed(sound.symbol)}
        </span>
        {keyWord && (
          <span lang="en" className="text-sm font-semibold text-navy-500">
            {keyWord}
          </span>
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
 * IPA Sounds (`/pronunciation/sounds`, spec §24.2): the American English chart — vowels,
 * diphthongs, consonants. A sound opens its card. English course only.
 */
export function IpaChartPage() {
  useDocumentTitle(t('IPA Sounds'));
  const sounds = getIpaSounds();

  return (
    <>
      <TopBar>
        <Breadcrumb
          items={[
            { label: t('Pronunciation'), to: paths.pronunciation },
            { label: t('IPA Sounds') },
          ]}
        />
      </TopBar>
      <PageContainer width="wide" className="flex flex-col gap-6">
        {sounds.length === 0 ? (
          <>
            <h1 className="sr-only">{t('IPA Sounds')}</h1>
            <NoChart />
          </>
        ) : (
          <>
            <div>
              <h1 className="text-[1.875rem] leading-tight font-extrabold text-navy-900 sm:text-[2.25rem]">
                {t('IPA Sounds')}
              </h1>
              <p className="mt-1 text-base font-medium text-navy-500 sm:text-lg">
                {t('The sounds of American English. Tap a sound to hear and say words with it.')}
              </p>
            </div>
            {GROUPS.map((group) => (
              <section key={group} aria-labelledby={`ipa-${group}`}>
                <h2 id={`ipa-${group}`} className="mb-3 text-xl font-extrabold text-navy-900">
                  {ipaGroupLabel(group)}
                </h2>
                <ul className="grid grid-cols-3 gap-3 min-[30rem]:grid-cols-4 sm:grid-cols-6 lg:grid-cols-8">
                  {sounds
                    .filter((sound) => sound.group === group)
                    .map((sound) => (
                      <SoundTile key={sound.id} sound={sound} />
                    ))}
                </ul>
              </section>
            ))}
          </>
        )}
      </PageContainer>
    </>
  );
}

/** The Chinese course has no IPA chart (it uses pinyin). */
export function NoChart() {
  return (
    <EmptyState
      icon={<Languages aria-hidden />}
      title={t('IPA sounds are part of the English course')}
      message={t('Practice the words of each scene in Pronunciation.')}
      actions={<ButtonLink to={paths.pronunciation}>{t('Back to Pronunciation')}</ButtonLink>}
    />
  );
}
