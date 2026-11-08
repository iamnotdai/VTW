import { Lock } from 'lucide-react';
import { Link } from 'react-router';
import { paths } from '@/app/paths';
import { ProgressBar } from '@/components/common/ProgressBar';
import { PageContainer, PageTitle, TopBar } from '@/components/layout/PageHeader';
import { GRAMMAR_TIMES, getGrammarTopics, isGrammarTopicAvailable } from '@/data/content';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { t } from '@/i18n';
import { getGrammarTopicPercent } from '@/lib/grammar';
import { useGrammarProgressStore } from '@/stores/grammarProgressStore';
import type { GrammarTopic } from '@/types/models';
import { GrammarGuard } from '../components/GrammarGuard';
import { grammarTimeLabel } from '../grammarText';

function TopicCard({ topic }: { topic: GrammarTopic }) {
  const grammar = useGrammarProgressStore((state) => state.grammar);
  const available = isGrammarTopicAvailable(topic);
  const percent = available ? getGrammarTopicPercent(grammar, topic) : 0;

  const content = (
    <>
      <span className="flex items-start justify-between gap-2">
        <span lang="en" className="text-lg leading-tight font-extrabold text-navy-900">
          {topic.title}
        </span>
        <span className="shrink-0 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-bold text-brand-700">
          {topic.level}
        </span>
      </span>
      <span lang="vi" className="text-[15px] font-medium text-navy-500">
        {topic.titleVi}
      </span>
      {available ? (
        <span className="mt-auto flex items-center gap-2 pt-2">
          <ProgressBar
            value={percent}
            size="sm"
            label={t('{title}: {percent}% practiced', { title: topic.title, percent })}
          />
          <span className="text-sm font-bold text-leaf-600 tabular-nums">{percent}%</span>
        </span>
      ) : (
        <span className="mt-auto flex items-center gap-1.5 pt-2 text-sm font-bold text-navy-400">
          <Lock aria-hidden className="size-4" /> {t('Coming soon')}
        </span>
      )}
    </>
  );

  const box = 'flex flex-1 flex-col gap-1 rounded-2xl p-4 ring-1';
  return (
    <li className="flex">
      {available ? (
        <Link
          to={paths.grammarTopic(topic.id)}
          className={`${box} bg-white shadow-soft ring-navy-100 transition outline-none hover:-translate-y-0.5 hover:shadow-lift focus-visible:ring-4 focus-visible:ring-brand-200`}
        >
          {content}
        </Link>
      ) : (
        <div className={`${box} bg-white/60 ring-navy-100`}>{content}</div>
      )}
    </li>
  );
}

/**
 * Grammar (`/grammar`, spec §25): the 12 tenses — past, present, future × simple, continuous,
 * perfect, perfect continuous. Optional: nothing is locked except lessons not written yet.
 */
export function GrammarPage() {
  useDocumentTitle(t('Grammar'));
  return (
    <GrammarGuard>
      <Grammar />
    </GrammarGuard>
  );
}

function Grammar() {
  const topics = getGrammarTopics();
  return (
    <>
      <TopBar variant="title">
        <PageTitle
          title={t('Grammar')}
          description={t('The 12 English tenses. Choose any tense you want to learn.')}
        />
      </TopBar>
      <PageContainer width="wide" className="flex flex-col gap-6">
        {GRAMMAR_TIMES.map((time) => (
          <section key={time} aria-labelledby={`grammar-${time}`}>
            <h2 id={`grammar-${time}`} className="mb-3 text-xl font-extrabold text-navy-900">
              {grammarTimeLabel(time)}
            </h2>
            <ul className="grid gap-3 min-[30rem]:grid-cols-2 lg:grid-cols-4">
              {topics
                .filter((topic) => topic.time === time)
                .map((topic) => (
                  <TopicCard key={topic.id} topic={topic} />
                ))}
            </ul>
          </section>
        ))}
      </PageContainer>
    </>
  );
}
