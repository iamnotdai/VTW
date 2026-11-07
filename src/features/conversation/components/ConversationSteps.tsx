import { Check } from 'lucide-react';
import { Link } from 'react-router';
import { SkillBadges } from '@/components/common/SkillBadges';
import { t } from '@/i18n';
import { cn } from '@/lib/cn';
import { getConversationSteps } from '@/lib/progress';
import { useProgressStore } from '@/stores/progressStore';
import type { Conversation } from '@/types/models';
import { getConversationStepInfos } from '../conversationSteps';

/**
 * The conversation's path (spec §9.7): four step cards in order, each with its skills and a check
 * once finished. Nothing is locked; the first unfinished step is marked "Up next".
 */
export function ConversationSteps({ conversation }: { conversation: Conversation }) {
  const progress = useProgressStore((state) => state.progress);
  const done = getConversationSteps(progress, conversation.id);
  const steps = getConversationStepInfos();
  const next = steps.find((step) => !done.has(step.id))?.id;

  return (
    <section aria-labelledby="conversation-steps-title">
      <h2 id="conversation-steps-title" className="mb-3 text-xl font-extrabold text-navy-900">
        {t('Your learning path')}
      </h2>
      <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step, index) => {
          const finished = done.has(step.id);
          const upNext = step.id === next;
          return (
            <li key={step.id} className="flex">
              <Link
                to={step.to(conversation.id)}
                className={cn(
                  'flex flex-1 flex-col gap-2 rounded-2xl bg-white p-4 shadow-soft ring-1 transition outline-none hover:-translate-y-0.5 hover:shadow-lift focus-visible:ring-4 focus-visible:ring-brand-200',
                  upNext ? 'ring-2 ring-brand-400' : 'ring-navy-100',
                )}
              >
                <span className="flex items-center gap-3">
                  <span
                    aria-hidden
                    className={cn(
                      'flex size-9 shrink-0 items-center justify-center rounded-full text-lg font-extrabold',
                      finished ? 'bg-leaf-500 text-white' : 'bg-brand-50 text-brand-600',
                    )}
                  >
                    {finished ? <Check className="size-5" strokeWidth={3} /> : index + 1}
                  </span>
                  <span className="min-w-0 flex-1 text-lg leading-tight font-extrabold text-navy-900">
                    {step.title}
                  </span>
                  {upNext && (
                    <span className="shrink-0 rounded-full bg-brand-500 px-2.5 py-0.5 text-xs font-bold text-white">
                      {t('Up next')}
                    </span>
                  )}
                </span>
                <span className="text-[15px] font-medium text-navy-500">{step.description}</span>
                <span className="sr-only">
                  {t('Step {number} of {total}', { number: index + 1, total: steps.length })}
                  {finished ? `, ${t('done')}` : ''}
                </span>
                <SkillBadges skills={step.skills} className="mt-auto pt-1" />
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
