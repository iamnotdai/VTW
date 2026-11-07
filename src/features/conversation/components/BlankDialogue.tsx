import { ArrowLeft, CircleCheck, Drama, Shuffle } from 'lucide-react';
import type { ReactNode } from 'react';
import { paths } from '@/app/paths';
import { AudioButton } from '@/components/common/AudioButton';
import { Button, ButtonLink } from '@/components/common/Button';
import { Pinyin } from '@/components/common/Pinyin';
import { getSpeaker } from '@/data/content';
import { useCourse } from '@/hooks/useCourse';
import { t } from '@/i18n';
import { cn } from '@/lib/cn';
import { blankLinePinyin, blanksOf, type Blank, type BlankLine } from '@/lib/fillBlanks';
import { useSettingsStore } from '@/stores/settingsStore';
import type { Conversation } from '@/types/models';
import { SpeakerAvatar } from './SpeakerAvatar';

/**
 * The dialogue of Fill in the Blanks: each line with its speaker, a Listen button, the blank drawn
 * by `renderBlank` and, under the line, whatever `renderBelow` adds (the choices). Chinese: the
 * pinyin shows without the blank's syllables until the round is done.
 */
export function BlankDialogue({
  conversation,
  blankLines,
  done,
  renderBlank,
  renderBelow,
}: {
  conversation: Conversation;
  blankLines: readonly BlankLine[];
  done: boolean;
  renderBlank: (blank: Blank, number: number) => ReactNode;
  renderBelow?: (blank: Blank, number: number) => ReactNode;
}) {
  const course = useCourse();
  const showVietnamese = useSettingsStore((state) => state.settings.showVietnameseMeaning);
  const numbers = new Map(blanksOf(blankLines).map((blank, index) => [blank.id, index + 1]));

  return (
    <ol className="flex flex-col gap-3">
      {conversation.lines.map((line, index) => {
        const speaker = getSpeaker(line.speakerId);
        const blankLine: BlankLine = blankLines[index] ?? {
          lineId: line.id,
          pieces: [{ kind: 'text', text: line.text }],
        };
        const blank = blankLine.pieces.find((piece): piece is Blank => piece.kind === 'blank');
        const pinyin = done ? line.pinyin : blankLinePinyin(blankLine, line.text, line.pinyin);
        return (
          <li key={line.id} className="flex items-start gap-3">
            <SpeakerAvatar speakerId={line.speakerId} size={44} className="mt-1" />
            <div className="min-w-0 flex-1 rounded-2xl rounded-tl-md bg-white py-3 pr-2 pl-4 shadow-soft ring-1 ring-navy-100">
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-bold text-navy-800">
                    {speaker?.name ?? line.speakerId}
                  </p>
                  <p
                    lang={course.lang}
                    className="mt-0.5 text-[1.0625rem] leading-11 font-medium text-navy-700 sm:text-lg"
                  >
                    {blankLine.pieces.map((piece, pieceIndex) =>
                      piece.kind === 'text' ? (
                        <span key={pieceIndex}>{piece.text}</span>
                      ) : (
                        <span key={piece.id}>{renderBlank(piece, numbers.get(piece.id) ?? 0)}</span>
                      ),
                    )}
                  </p>
                  <Pinyin text={pinyin} />
                  {showVietnamese && line.textVi && (
                    <p lang="vi" className="mt-0.5 text-sm font-medium text-navy-400">
                      {line.textVi}
                    </p>
                  )}
                </div>
                <AudioButton
                  soundKey={`blank:${line.id}`}
                  text={line.text}
                  src={line.audio}
                  pitch={speaker?.voice?.pitch}
                  rate={speaker?.voice?.rate}
                  label={t('Listen to line {number}', { number: index + 1 })}
                  variant="plain"
                />
              </div>
              {blank && renderBelow?.(blank, numbers.get(blank.id) ?? 0)}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/** "All the words are right" / "Here are the answers", with the first-try count. */
export function BlanksResult({
  allRight,
  firstTry,
  total,
}: {
  allRight: boolean;
  firstTry: number | null;
  total: number;
}) {
  return (
    <div
      role="status"
      className={cn(
        'flex animate-pop-in items-center gap-3 rounded-2xl p-4 font-bold shadow-soft',
        allRight ? 'bg-leaf-500 text-white' : 'bg-sun-100 text-navy-800',
      )}
    >
      <CircleCheck aria-hidden className="size-6 shrink-0" />
      <span>
        {allRight ? t('All the words are right. Great job!') : t('Here are the answers.')}{' '}
        {firstTry !== null &&
          t('{count} of {total} right on the first try.', { count: firstTry, total })}
      </span>
    </div>
  );
}

/** What to do once a round is done: new blanks, Role-play, back to the conversation. */
export function BlanksEndActions({
  conversation,
  onRestart,
}: {
  conversation: Conversation;
  onRestart: () => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          size="lg"
          className="sm:flex-1"
          leftIcon={<Shuffle aria-hidden className="size-5" />}
          onClick={onRestart}
        >
          {t('New Blanks')}
        </Button>
        <ButtonLink
          to={paths.rolePlay(conversation.id)}
          size="lg"
          variant="warm"
          className="sm:flex-1"
          leftIcon={<Drama aria-hidden className="size-5" />}
        >
          {t('Role-play')}
        </ButtonLink>
      </div>
      <ButtonLink
        to={paths.conversation(conversation.id)}
        size="lg"
        variant="soft"
        fullWidth
        leftIcon={<ArrowLeft aria-hidden className="size-5" strokeWidth={2.5} />}
      >
        {t('Back to the Conversation')}
      </ButtonLink>
    </div>
  );
}
