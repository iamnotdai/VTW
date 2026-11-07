import { paths } from '@/app/paths';
import type { Crumb } from '@/components/layout/PageHeader';
import { t } from '@/i18n';
import type { Conversation } from '@/types/models';

/** "Conversation › My Bedroom › Practice" (design screen 12). */
export function practiceCrumbs(conversation: Conversation): Crumb[] {
  return [
    { label: t('Conversation'), to: paths.conversations },
    { label: conversation.title, to: paths.conversation(conversation.id) },
    { label: t('Practice') },
  ];
}
