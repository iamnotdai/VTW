import { ArrowLeft, ArrowRight, Mic } from 'lucide-react';
import { useParams } from 'react-router';
import { paths } from '@/app/paths';
import { AudioButton } from '@/components/common/AudioButton';
import { ButtonLink } from '@/components/common/Button';
import { Breadcrumb, PageContainer, TopBar } from '@/components/layout/PageHeader';
import { chartTranscription, getChartSound, getChartSounds, getSoundChart } from '@/data/content';
import { NotFoundPage } from '@/features/misc/NotFoundPage';
import { useCourse } from '@/hooks/useCourse';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { t } from '@/i18n';
import { assetUrl } from '@/lib/assets';
import { useSettingsStore } from '@/stores/settingsStore';
import type { ChartSound } from '@/types/models';
import { HighlightedSound } from '../components/HighlightedSound';
import { SoundButton, SoundSaidAs } from '../components/SoundButton';
import { chartGroupLabel, chartSymbol, chartTitle, getSoundExampleWords } from '../soundChartText';

/**
 * Sound Card (`/pronunciation/sounds/:soundId`, spec §24.2): one sound of the course's chart (IPA
 * or pinyin) — how to make it, and words from the scenes that have it, each with its picture and
 * the sound marked in its IPA or pinyin. A browser voice can't say a sound on its own, so the
 * sound itself only plays from a recording; the words are spoken and practiced in a Word Speaking
 * round.
 */
export function SoundCardPage() {
  const { soundId } = useParams();
  const sound = getChartSound(soundId);
  if (!sound) return <NotFoundPage />;
  return <SoundCard key={sound.id} sound={sound} />;
}

function SoundCard({ sound }: { sound: ChartSound }) {
  const course = useCourse();
  const chart = getSoundChart();
  const symbol = chartSymbol(sound);
  useDocumentTitle(t('Sound {symbol}', { symbol }));
  const showVietnamese = useSettingsStore((state) => state.settings.showVietnameseMeaning);
  const sounds = getChartSounds();
  const index = sounds.findIndex((item) => item.id === sound.id);
  const previous = sounds[index - 1];
  const next = sounds[index + 1];
  const words = getSoundExampleWords(sound);
  const extras = words.length > 0 ? [] : (sound.extraExamples ?? []);

  const row = (text: string, transcription: string | undefined, meaningVi: string) => (
    <div className="min-w-0 flex-1">
      <p lang={course.lang} className="text-lg font-extrabold text-navy-900">
        {text}
      </p>
      {transcription && (
        <p>
          <HighlightedSound transcription={transcription} text={text} soundId={sound.id} />
        </p>
      )}
      {showVietnamese && (
        <p lang="vi" className="text-sm font-medium text-navy-400">
          {meaningVi}
        </p>
      )}
    </div>
  );

  return (
    <>
      <TopBar>
        <Breadcrumb
          items={[
            { label: t('Pronunciation'), to: paths.pronunciation },
            { label: chartTitle(chart.kind), to: paths.soundChart },
            { label: symbol },
          ]}
        />
      </TopBar>
      <PageContainer width="narrow" className="flex flex-col gap-5">
        <section className="relative flex flex-col items-center gap-3 rounded-[1.25rem] bg-white p-6 text-center shadow-lift sm:p-8">
          <SoundButton sound={sound} className="absolute top-3 right-3 sm:top-5 sm:right-5" />
          <p className="text-sm font-bold tracking-wide text-brand-600 uppercase">
            {chartGroupLabel(sound.group)} ·{' '}
            {t('{number} of {total}', { number: index + 1, total: sounds.length })}
          </p>
          <h1 className="text-[4rem] leading-none font-extrabold text-navy-900">
            <span className="sr-only">{t('Sound {symbol}', { symbol })}</span>
            <span aria-hidden>{symbol}</span>
          </h1>
          {sound.nameVi && (
            <p lang="vi" className="-mt-1 text-lg font-bold text-navy-600">
              {sound.nameVi}
            </p>
          )}
          <SoundSaidAs sound={sound} />
          {sound.mouthImage && (
            <img
              src={assetUrl(sound.mouthImage)}
              alt={t('Mouth position for {symbol}', { symbol })}
              className="h-40 w-auto object-contain"
              draggable={false}
            />
          )}
          <div className="w-full rounded-2xl bg-mist p-4 text-left">
            <h2 className="text-base font-extrabold text-navy-900">{t('How to say it')}</h2>
            <p lang="vi" className="mt-1 text-[1.0625rem] font-medium text-navy-700">
              {sound.tipVi}
            </p>
          </div>
        </section>

        <section aria-labelledby="sound-words" className="flex flex-col gap-3">
          <h2 id="sound-words" className="text-xl font-extrabold text-navy-900">
            {t('Words with {symbol}', { symbol })}
          </h2>
          <ul className="flex flex-col gap-2">
            {words.map((word) => (
              <li
                key={word.id}
                className="flex items-center gap-3 rounded-2xl bg-white p-2.5 pr-3 shadow-soft ring-1 ring-navy-100"
              >
                <img
                  src={assetUrl(word.image)}
                  alt=""
                  className="size-14 shrink-0 rounded-xl bg-cream-100 object-contain p-1"
                  draggable={false}
                />
                {row(word.text, chartTranscription(word), word.meaningVi)}
                <AudioButton
                  soundKey={`chart:${sound.id}:${word.id}`}
                  text={word.text}
                  src={word.audio}
                  label={t('Listen to “{word}”', { word: word.text })}
                />
              </li>
            ))}
            {extras.map((example) => (
              <li
                key={example.text}
                className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-soft ring-1 ring-navy-100"
              >
                {row(example.text, chartTranscription(example), example.meaningVi)}
                <AudioButton
                  soundKey={`chart:${sound.id}:${example.text}`}
                  text={example.text}
                  label={t('Listen to “{word}”', { word: example.text })}
                />
              </li>
            ))}
          </ul>
          {words.length > 0 && (
            <ButtonLink
              to={paths.chartSoundSpeaking(sound.id)}
              size="lg"
              variant="warm"
              fullWidth
              leftIcon={<Mic aria-hidden className="size-5" />}
            >
              {t('Say These Words')}
            </ButtonLink>
          )}
        </section>

        <nav aria-label={t('Other sounds')} className="grid grid-cols-2 gap-3">
          {previous ? (
            <ButtonLink
              to={paths.chartSound(previous.id)}
              size="lg"
              variant="soft"
              leftIcon={<ArrowLeft aria-hidden className="size-5" strokeWidth={2.5} />}
            >
              {t('Previous')} <span aria-hidden>{chartSymbol(previous)}</span>
              <span className="sr-only">
                {t('Sound {symbol}', { symbol: chartSymbol(previous) })}
              </span>
            </ButtonLink>
          ) : (
            <span />
          )}
          {next && (
            <ButtonLink
              to={paths.chartSound(next.id)}
              size="lg"
              variant="soft"
              rightIcon={<ArrowRight aria-hidden className="size-5" strokeWidth={2.5} />}
            >
              {t('Next')} <span aria-hidden>{chartSymbol(next)}</span>
              <span className="sr-only">{t('Sound {symbol}', { symbol: chartSymbol(next) })}</span>
            </ButtonLink>
          )}
        </nav>
      </PageContainer>
    </>
  );
}
