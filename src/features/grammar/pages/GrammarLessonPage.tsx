import { PencilLine } from 'lucide-react';
import type { ReactNode } from 'react';
import { useParams } from 'react-router';
import { paths } from '@/app/paths';
import { AudioButton } from '@/components/common/AudioButton';
import { ButtonLink } from '@/components/common/Button';
import { ProgressBar } from '@/components/common/ProgressBar';
import { SkillBadges } from '@/components/common/SkillBadges';
import { Breadcrumb, PageContainer, TopBar } from '@/components/layout/PageHeader';
import { getGrammarTopic, getWord, isGrammarTopicAvailable } from '@/data/content';
import { NotFoundPage } from '@/features/misc/NotFoundPage';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { t } from '@/i18n';
import { assetUrl } from '@/lib/assets';
import { getGrammarTopicPercent } from '@/lib/grammar';
import { useGrammarProgressStore } from '@/stores/grammarProgressStore';
import { useSettingsStore } from '@/stores/settingsStore';
import type { GrammarTopic } from '@/types/models';
import { GrammarGuard } from '../components/GrammarGuard';
import { grammarFormLabel } from '../grammarText';

/** Shows a tense that has a lesson; a missing or unwritten one shows the right notice. */
export function GrammarTopicRoute({ render }: { render: (topic: GrammarTopic) => ReactNode }) {
  const { topicId } = useParams();
  const topic = getGrammarTopic(topicId);
  if (!topic) return <NotFoundPage />;
  if (!isGrammarTopicAvailable(topic)) {
    return (
      <NotFoundPage
        comingSoon
        title={t('{title} is coming soon', { title: topic.title })}
        message={t('This lesson is still being written. Try another tense for now!')}
      />
    );
  }
  return render(topic);
}

/**
 * Grammar Lesson (`/grammar/:topicId`, spec §25): when to use the tense, its three forms, signal
 * words and example sentences with the scene objects they talk about. Explanations are Vietnamese
 * content; sentences are English with a Listen button.
 */
export function GrammarLessonPage() {
  return (
    <GrammarGuard>
      <GrammarTopicRoute render={(topic) => <GrammarLesson key={topic.id} topic={topic} />} />
    </GrammarGuard>
  );
}

function GrammarLesson({ topic }: { topic: GrammarTopic }) {
  useDocumentTitle(topic.title);
  const showVietnamese = useSettingsStore((state) => state.settings.showVietnameseMeaning);
  const percent = useGrammarProgressStore((state) => getGrammarTopicPercent(state.grammar, topic));

  return (
    <>
      <TopBar>
        <Breadcrumb items={[{ label: t('Grammar'), to: paths.grammar }, { label: topic.title }]} />
      </TopBar>
      <PageContainer width="default" className="flex flex-col gap-5">
        <section className="flex flex-col gap-3 rounded-[1.25rem] bg-white p-6 shadow-lift sm:p-7">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-sm font-bold text-brand-700">
              {topic.level}
            </span>
            <SkillBadges skills={['listening', 'reading', 'writing']} />
          </div>
          <h1 lang="en" className="text-[2rem] leading-tight font-extrabold text-navy-900">
            {topic.title}
          </h1>
          <p lang="vi" className="-mt-2 text-lg font-semibold text-navy-500">
            {topic.titleVi}
          </p>
          <div className="flex items-center gap-3">
            <ProgressBar
              value={percent}
              label={t('{title}: {percent}% practiced', { title: topic.title, percent })}
            />
            <span className="text-sm font-bold text-leaf-600 tabular-nums">{percent}%</span>
          </div>
          <h2 className="mt-2 text-lg font-extrabold text-navy-900">{t('When to use it')}</h2>
          <ul lang="vi" className="flex list-disc flex-col gap-1 pl-5 font-medium text-navy-700">
            {topic.usageVi.map((use) => (
              <li key={use}>{use}</li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="grammar-forms">
          <h2 id="grammar-forms" className="mb-3 text-xl font-extrabold text-navy-900">
            {t('How to make it')}
          </h2>
          <ul className="grid gap-3 md:grid-cols-3">
            {topic.forms.map((form) => (
              <li
                key={form.kind}
                className="flex flex-col gap-2 rounded-2xl bg-white p-4 shadow-soft ring-1 ring-navy-100"
              >
                <h3 className="text-base font-extrabold text-brand-700">
                  {grammarFormLabel(form.kind)}
                </h3>
                <p
                  lang="vi"
                  className="rounded-xl bg-mist px-3 py-2 text-[15px] font-bold text-navy-800"
                >
                  {form.pattern}
                </p>
                <div className="mt-auto flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <p lang="en" className="font-semibold text-navy-900">
                      {form.example}
                    </p>
                    {showVietnamese && (
                      <p lang="vi" className="text-sm font-medium text-navy-400">
                        {form.exampleVi}
                      </p>
                    )}
                  </div>
                  <AudioButton
                    soundKey={`grammar:${topic.id}:${form.kind}`}
                    text={form.example}
                    label={t('Listen to “{word}”', { word: form.example })}
                    size="sm"
                    variant="plain"
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="grammar-signals">
          <h2 id="grammar-signals" className="mb-3 text-xl font-extrabold text-navy-900">
            {t('Signal words')}
          </h2>
          <ul className="flex flex-wrap gap-2">
            {topic.signalWords.map((word) => (
              <li
                key={word}
                lang="en"
                className="rounded-full bg-sun-100 px-3 py-1 font-bold text-navy-800"
              >
                {word}
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="grammar-examples">
          <h2 id="grammar-examples" className="mb-3 text-xl font-extrabold text-navy-900">
            {t('Examples')}
          </h2>
          <ul className="flex flex-col gap-2">
            {topic.examples.map((example) => {
              const word = getWord(example.wordIds?.[0]);
              return (
                <li
                  key={example.text}
                  className="flex items-center gap-3 rounded-2xl bg-white p-2.5 pr-3 shadow-soft ring-1 ring-navy-100"
                >
                  {word ? (
                    <img
                      src={assetUrl(word.image)}
                      alt=""
                      className="size-14 shrink-0 rounded-xl bg-cream-100 object-contain p-1"
                      draggable={false}
                    />
                  ) : (
                    <span className="size-14 shrink-0" aria-hidden />
                  )}
                  <div className="min-w-0 flex-1">
                    <p lang="en" className="font-bold text-navy-900">
                      {example.text}
                    </p>
                    {showVietnamese && (
                      <p lang="vi" className="text-sm font-medium text-navy-400">
                        {example.textVi}
                      </p>
                    )}
                  </div>
                  <AudioButton
                    soundKey={`grammar:${topic.id}:${example.text}`}
                    text={example.text}
                    label={t('Listen to “{word}”', { word: example.text })}
                  />
                </li>
              );
            })}
          </ul>
        </section>

        <ButtonLink
          to={paths.grammarPractice(topic.id)}
          size="lg"
          fullWidth
          leftIcon={<PencilLine aria-hidden className="size-5" />}
        >
          {t('Start Practice')}
        </ButtonLink>
      </PageContainer>
    </>
  );
}
