import { paths } from '@/app/paths';
import { t } from '@/i18n';
import type { ConversationStep, Skill } from '@/types/models';

export interface ConversationStepInfo {
  id: ConversationStep;
  title: string;
  description: string;
  skills: readonly Skill[];
  to: (conversationId: string) => string;
}

/**
 * The four steps of a conversation, in order (spec §9.7): listen, fill in the missing words, read,
 * speak. None is locked. Built at render time so the copy follows the course.
 */
export function getConversationStepInfos(): ConversationStepInfo[] {
  return [
    {
      id: 'listen',
      title: t('Listen & Watch'),
      description: t('Listen to the whole conversation.'),
      skills: ['listening'],
      to: paths.conversationVideo,
    },
    {
      id: 'fill',
      title: t('Fill in the Blanks'),
      description: t('Listen again and find the missing words.'),
      skills: ['listening', 'reading', 'writing'],
      to: paths.fillBlanks,
    },
    {
      id: 'read',
      title: t('Read'),
      description: t('Read every line, with its meaning.'),
      skills: ['listening', 'reading'],
      to: paths.transcript,
    },
    {
      id: 'speak',
      title: t('Speak'),
      description: t('Play a character and say their lines.'),
      skills: ['listening', 'speaking', 'reading'],
      to: (conversationId) => paths.rolePlay(conversationId),
    },
  ];
}
