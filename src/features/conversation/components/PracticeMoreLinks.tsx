import { Drama, PencilLine } from 'lucide-react';
import { paths } from '@/app/paths';
import { ButtonLink } from '@/components/common/Button';
import { t } from '@/i18n';
import { cn } from '@/lib/cn';
import { useProfileStore } from '@/stores/profileStore';
import type { Conversation } from '@/types/models';

/**
 * "Role-play" and — for learners who can type — "Fill in the Blanks" (spec §9.5, §9.6), offered
 * once the learner knows the conversation (detail and transcript screens).
 */
export function PracticeMoreLinks({
  conversation,
  className,
}: {
  conversation: Conversation;
  className?: string;
}) {
  const canType = useProfileStore((state) => state.profile?.canTypeWords ?? false);
  return (
    <div className={cn('grid gap-3 sm:grid-cols-2', className)}>
      <ButtonLink
        to={paths.rolePlay(conversation.id)}
        size="lg"
        variant="warm"
        className={cn(!canType && 'sm:col-span-2')}
        leftIcon={<Drama aria-hidden className="size-5" />}
      >
        {t('Role-play')}
      </ButtonLink>
      {canType && (
        <ButtonLink
          to={paths.fillBlanks(conversation.id)}
          size="lg"
          variant="secondary"
          leftIcon={<PencilLine aria-hidden className="size-5" />}
        >
          {t('Fill in the Blanks')}
        </ButtonLink>
      )}
    </div>
  );
}
