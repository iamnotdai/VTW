import type { Ref } from 'react';
import { AudioButton } from '@/components/common/AudioButton';
import { Pinyin } from '@/components/common/Pinyin';
import { ScoredText } from '@/components/speaking/ScoredText';
import { ScoreRing } from '@/components/speaking/ScoreRing';
import { getSpeaker } from '@/data/content';
import { useCourse } from '@/hooks/useCourse';
import { t } from '@/i18n';
import { cn } from '@/lib/cn';
import { useAudioStore } from '@/stores/audioStore';
import type { DialogueLine } from '@/types/models';
import type { RoleLineResult } from '../rolePlay';
import { SpeakerAvatar } from './SpeakerAvatar';

interface RolePlayLineProps {
  line: DialogueLine;
  /** The learner says this line. */
  mine: boolean;
  /** The line being played or waiting for the learner. */
  current: boolean;
  result?: RoleLineResult;
  showTranslation: boolean;
  /**
   * The listen button can be used. Off while another character's line plays by itself: a second
   * sound would cut that line off and stall the conversation.
   */
  replayable: boolean;
  ref?: Ref<HTMLLIElement>;
}

/**
 * One chat bubble of Role-play (spec §9.5): the other characters on the left, the learner's
 * character on the right with its score and coloured words once said.
 */
export function RolePlayLine({
  line,
  mine,
  current,
  result,
  showTranslation,
  replayable,
  ref,
}: RolePlayLineProps) {
  const course = useCourse();
  const speaker = getSpeaker(line.speakerId);
  const name = speaker?.name ?? line.speakerId;
  const playing = useAudioStore((state) => state.playingKey === `line:${line.id}`);
  const scored = result?.kind === 'scored' ? result.latest : null;

  return (
    <li
      ref={ref}
      aria-current={current ? 'step' : undefined}
      className={cn('flex animate-fade-in items-end gap-3', mine && 'flex-row-reverse')}
    >
      <SpeakerAvatar speakerId={line.speakerId} size={48} />
      <div
        className={cn(
          'flex max-w-[85%] min-w-0 items-center gap-2 rounded-2xl py-3 pr-2 pl-4 transition sm:max-w-[75%]',
          mine
            ? 'rounded-br-md bg-brand-50 ring-1 ring-brand-200'
            : 'rounded-bl-md bg-white shadow-soft ring-1 ring-navy-100',
          current && 'ring-2 ring-brand-400',
          playing && 'ring-4 ring-sun-300',
        )}
      >
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-bold text-navy-800">
            {mine ? t('{name} (you)', { name }) : name}
          </p>
          <p className="mt-0.5 text-[1.0625rem] leading-snug font-medium text-navy-700 sm:text-lg">
            <ScoredText text={line.text} parts={scored?.parts} lang={course.lang} />
          </p>
          <Pinyin text={line.pinyin} className="mt-0.5" />
          {showTranslation && line.textVi && (
            <p lang="vi" className="mt-0.5 animate-fade-in text-sm font-medium text-navy-400">
              {line.textVi}
            </p>
          )}
        </div>
        {scored ? (
          <ScoreRing score={scored.score} level={scored.level} size={44} />
        ) : result?.kind === 'practiced' ? (
          <span className="shrink-0 rounded-full bg-leaf-50 px-2.5 py-1 text-sm font-bold text-leaf-700">
            {t('Practiced')}
          </span>
        ) : (
          !mine &&
          (replayable ? (
            <AudioButton
              soundKey={`line:${line.id}`}
              text={line.text}
              src={line.audio}
              pitch={speaker?.voice?.pitch}
              rate={speaker?.voice?.rate}
              label={t('Play: {line}', { line: line.text })}
              variant="plain"
            />
          ) : (
            // Keeps the bubble's size while the button is away.
            <span aria-hidden className="size-11 shrink-0" />
          ))
        )}
      </div>
    </li>
  );
}
