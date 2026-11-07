import { Drama, PencilLine } from 'lucide-react';
import { paths } from '@/app/paths';
import { ButtonLink } from '@/components/common/Button';
import { t } from '@/i18n';
import { cn } from '@/lib/cn';
import type { Conversation } from '@/types/models';

/**
 * "Role-play" and "Fill in the Blanks" (spec §9.5, §9.6), offered once the learner knows the
 * conversation (detail and transcript screens). Fill in the Blanks is for everyone: learners who
 * can't type choose the missing words.
 */
export function PracticeMoreLinks({
  conversation,
  className,
}: {
  conversation: Conversation;
  className?: string;
}) {
  return (
    <div className={cn('grid gap-3 sm:grid-cols-2', className)}>
      <ButtonLink
        to={paths.rolePlay(conversation.id)}
        size="lg"
        variant="warm"
        leftIcon={<Drama aria-hidden className="size-5" />}
      >
        {t('Role-play')}
      </ButtonLink>
      <ButtonLink
        to={paths.fillBlanks(conversation.id)}
        size="lg"
        variant="secondary"
        leftIcon={<PencilLine aria-hidden className="size-5" />}
      >
        {t('Fill in the Blanks')}
      </ButtonLink>
    </div>
  );
}
