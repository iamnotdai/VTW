import { paths } from '@/app/paths';
import type { Crumb } from '@/components/layout/PageHeader';
import { t } from '@/i18n';
import type { SpeakingScore } from '@/lib/speakingScore';
import type { Conversation } from '@/types/models';

/** A character of a conversation and how many lines they say. */
export interface ConversationRole {
  speakerId: string;
  lineCount: number;
}

/** The conversation's speakers in order of their first line (spec §9.5). */
export function conversationRoles(conversation: Conversation): ConversationRole[] {
  const roles = new Map<string, number>();
  for (const line of conversation.lines) {
    roles.set(line.speakerId, (roles.get(line.speakerId) ?? 0) + 1);
  }
  return [...roles].map(([speakerId, lineCount]) => ({ speakerId, lineCount }));
}

/** What the learner did with one of their lines. */
export type RoleLineResult =
  | { kind: 'scored'; latest: SpeakingScore; best: SpeakingScore }
  /** Listen & Repeat: said out loud without a microphone score. */
  | { kind: 'practiced' }
  | { kind: 'skipped' };

/** Keeps the latest score for display and the best one for the summary. */
export function addLineScore(
  current: RoleLineResult | undefined,
  score: SpeakingScore,
): RoleLineResult {
  const best =
    current?.kind === 'scored' && current.best.score >= score.score ? current.best : score;
  return { kind: 'scored', latest: score, best };
}

/** Average best score of the learner's scored lines, or `null` when none was scored. */
export function averageLineScore(results: Readonly<Record<string, RoleLineResult>>): number | null {
  const scores = Object.values(results).flatMap((result) =>
    result.kind === 'scored' ? [result.best.score] : [],
  );
  if (scores.length === 0) return null;
  return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
}

/** "Conversation › My Bedroom › Role-play". */
export function rolePlayCrumbs(conversation: Conversation, last: string): Crumb[] {
  return [
    { label: t('Conversation'), to: paths.conversations },
    { label: conversation.title, to: paths.conversation(conversation.id) },
    { label: last },
  ];
}
