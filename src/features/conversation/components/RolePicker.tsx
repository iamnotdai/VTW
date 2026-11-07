import { ArrowLeft, Check } from 'lucide-react';
import { paths } from '@/app/paths';
import { ButtonLink } from '@/components/common/Button';
import { getSpeaker } from '@/data/content';
import { t } from '@/i18n';
import { cn } from '@/lib/cn';
import type { Conversation } from '@/types/models';
import type { ConversationRole } from '../rolePlay';
import { SpeakerAvatar } from './SpeakerAvatar';

const lineCountText = (count: number) =>
  count === 1 ? t('1 line') : t('{count} lines', { count });

/** "Who do you want to be?" — one card per character of the conversation (spec §9.5). */
export function RolePicker({
  conversation,
  roles,
  current,
  onChoose,
}: {
  conversation: Conversation;
  roles: readonly ConversationRole[];
  /** The character played last, when switching. */
  current?: string;
  onChoose: (speakerId: string) => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h1 className="text-[1.875rem] leading-tight font-extrabold text-navy-900 sm:text-[2.25rem]">
          {t('Who do you want to be?')}
        </h1>
        <p className="mx-auto mt-1 max-w-md text-base font-medium text-navy-500 sm:text-lg">
          {t('You say the lines of your character. The others speak by themselves.')}
        </p>
      </div>
      <ul
        className={cn(
          'grid grid-cols-2 gap-3 sm:gap-4',
          roles.length >= 3 && 'sm:grid-cols-3',
          roles.length >= 4 && 'lg:grid-cols-4',
        )}
      >
        {roles.map((role) => {
          const name = getSpeaker(role.speakerId)?.name ?? role.speakerId;
          const selected = role.speakerId === current;
          return (
            <li key={role.speakerId}>
              <button
                type="button"
                onClick={() => onChoose(role.speakerId)}
                aria-pressed={selected}
                className={cn(
                  'flex h-full w-full flex-col items-center gap-2 rounded-card border bg-white px-3 pt-5 pb-4 shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift sm:px-5',
                  selected ? 'border-brand-400 ring-2 ring-brand-300' : 'border-navy-100',
                )}
              >
                <SpeakerAvatar speakerId={role.speakerId} size={88} />
                <span className="mt-1 text-xl font-extrabold text-navy-900">{name}</span>
                <span className="text-[15px] font-medium text-navy-500">
                  {lineCountText(role.lineCount)}
                </span>
                <span className="mt-1 inline-flex h-10 items-center gap-1.5 rounded-full bg-brand-500 px-4 text-[0.9375rem] font-bold text-white shadow-cta">
                  {selected && <Check aria-hidden className="size-4" strokeWidth={3} />}
                  {t('Be {name}', { name })}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <ButtonLink
        to={paths.conversation(conversation.id)}
        variant="ghost"
        className="self-center"
        leftIcon={<ArrowLeft aria-hidden className="size-5" strokeWidth={2.5} />}
      >
        {t('Back to the Conversation')}
      </ButtonLink>
    </div>
  );
}
