import {
  ArrowLeft,
  CircleCheck,
  Drama,
  Eye,
  Keyboard,
  PencilLine,
  Settings,
  Shuffle,
} from 'lucide-react';
import { useMemo, useState, type FormEvent, type KeyboardEvent } from 'react';
import { paths } from '@/app/paths';
import { AudioButton } from '@/components/common/AudioButton';
import { Button, ButtonLink } from '@/components/common/Button';
import { EmptyState } from '@/components/common/EmptyState';
import { Pinyin } from '@/components/common/Pinyin';
import { Breadcrumb, PageContainer, TopBar } from '@/components/layout/PageHeader';
import { getSceneWords, getSpeaker } from '@/data/content';
import { NotFoundPage } from '@/features/misc/NotFoundPage';
import { useCourse } from '@/hooks/useCourse';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { t } from '@/i18n';
import { cn } from '@/lib/cn';
import {
  blankLinePinyin,
  buildBlankLines,
  isBlankAnswerCorrect,
  type BlankLine,
  type BlankPiece,
} from '@/lib/fillBlanks';
import { playSfx } from '@/lib/sfx';
import { useProfileStore } from '@/stores/profileStore';
import { useSettingsStore } from '@/stores/settingsStore';
import type { Conversation, Scene } from '@/types/models';
import { SpeakerAvatar } from '../components/SpeakerAvatar';
import { rolePlayCrumbs } from '../rolePlay';
import { useConversationParam } from '../useConversationParam';

/**
 * Fill in the Blanks (`/conversation/:conversationId/fill-blanks`, spec §9.6): the dialogue with one
 * word missing per line; the learner listens and types the words back. Only for learners who can
 * type (Profile › "Yes, I can type words") — others never see it offered.
 */
export function FillBlanksPage() {
  const params = useConversationParam();
  if (!params) return <NotFoundPage />;
  return <FillBlanks key={params.conversation.id} {...params} />;
}

type BlankStatus = 'right' | 'wrong';

function FillBlanks({ conversation, scene }: { conversation: Conversation; scene: Scene }) {
  useDocumentTitle(t('{title} · Fill in the Blanks', { title: conversation.title }));
  const canType = useProfileStore((state) => state.profile?.canTypeWords ?? false);
  const crumbs = rolePlayCrumbs(conversation, t('Fill in the Blanks'));

  return (
    <>
      <TopBar>
        <Breadcrumb items={crumbs} />
      </TopBar>
      <PageContainer width="narrow" className="flex flex-col gap-5">
        {canType ? (
          <BlanksExercise conversation={conversation} scene={scene} />
        ) : (
          <>
            <h1 className="sr-only">{t('Fill in the Blanks')}</h1>
            <EmptyState
              icon={<Keyboard aria-hidden />}
              title={t('This exercise is for learners who can type')}
              message={t('Choose “Yes, I can type words” in Settings to fill in the blanks.')}
              actions={
                <div className="flex flex-col gap-3 sm:flex-row">
                  <ButtonLink
                    to={paths.settings}
                    leftIcon={<Settings aria-hidden className="size-5" />}
                  >
                    {t('Open Settings')}
                  </ButtonLink>
                  <ButtonLink to={paths.conversation(conversation.id)} variant="secondary">
                    {t('Back to the Conversation')}
                  </ButtonLink>
                </div>
              }
            />
          </>
        )}
      </PageContainer>
    </>
  );
}

function BlanksExercise({ conversation, scene }: { conversation: Conversation; scene: Scene }) {
  const course = useCourse();
  const showVietnamese = useSettingsStore((state) => state.settings.showVietnameseMeaning);
  const vocabulary = useMemo(() => getSceneWords(scene).map((word) => word.text), [scene]);
  const createLines = () =>
    buildBlankLines(conversation.lines, {
      vocabulary,
      names: conversation.lines.map((line) => getSpeaker(line.speakerId)?.name ?? line.speakerId),
      lang: course.lang,
    });
  // Random blanks, picked once per round (like quiz options).
  const [blankLines, setBlankLines] = useState<BlankLine[]>(createLines);
  const [values, setValues] = useState<Record<string, string>>({});
  const [statuses, setStatuses] = useState<Record<string, BlankStatus>>({});
  const [firstTry, setFirstTry] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);

  const blanks = blankLines.flatMap((line) =>
    line.pieces.filter(
      (piece): piece is Extract<BlankPiece, { kind: 'blank' }> => piece.kind === 'blank',
    ),
  );
  const blankNumbers = new Map(blanks.map((blank, index) => [blank.id, index + 1]));
  const rightCount = blanks.filter((blank) => statuses[blank.id] === 'right').length;
  const allRight = blanks.length > 0 && rightCount === blanks.length;
  const done = allRight || revealed;
  const checked = Object.keys(statuses).length > 0;

  const check = (event: FormEvent) => {
    event.preventDefault();
    if (done) return;
    const next = Object.fromEntries(
      blanks.map((blank) => [
        blank.id,
        isBlankAnswerCorrect(blank.answer, values[blank.id] ?? '') ? 'right' : 'wrong',
      ]),
    ) as Record<string, BlankStatus>;
    const right = Object.values(next).filter((status) => status === 'right').length;
    setStatuses(next);
    setFirstTry((current) => current ?? right);
    if (useSettingsStore.getState().settings.soundEnabled) {
      playSfx(right === blanks.length ? 'completed' : 'wrong');
    }
  };

  const restart = () => {
    setBlankLines(createLines());
    setValues({});
    setStatuses({});
    setFirstTry(null);
    setRevealed(false);
  };

  // A Chinese pinyin keyboard's Enter only picks characters: it never checks the answers.
  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && (event.nativeEvent.isComposing || event.keyCode === 229)) {
      event.preventDefault();
    }
  };

  return (
    <form onSubmit={check} className="flex flex-col gap-5" noValidate>
      <div className="text-center">
        <h1 className="text-[1.875rem] leading-tight font-extrabold text-navy-900 sm:text-[2.25rem]">
          {t('Fill in the Blanks')}
        </h1>
        <p className="mt-1 text-base font-medium text-navy-500 sm:text-lg">
          {t('Listen to each line and type the missing word.')}
        </p>
      </div>

      {done && (
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
              t('{count} of {total} right on the first try.', {
                count: firstTry,
                total: blanks.length,
              })}
          </span>
        </div>
      )}

      <ol className="flex flex-col gap-3">
        {conversation.lines.map((line, index) => {
          const speaker = getSpeaker(line.speakerId);
          const blankLine: BlankLine = blankLines[index] ?? {
            lineId: line.id,
            pieces: [{ kind: 'text', text: line.text }],
          };
          const { pieces } = blankLine;
          // Chinese: the pinyin shows, but not the blank's syllables (they give the answer away).
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
                      {pieces.map((piece, pieceIndex) => {
                        if (piece.kind === 'text')
                          return <span key={pieceIndex}>{piece.text}</span>;
                        const status = statuses[piece.id];
                        const showAnswer = revealed && status !== 'right';
                        const han = /\p{Script=Han}/u.test(piece.answer);
                        const length = Array.from(piece.answer).length;
                        return (
                          <span key={piece.id} className="inline-flex items-baseline gap-1">
                            <input
                              type="text"
                              aria-label={t('Missing word {number}', {
                                number: blankNumbers.get(piece.id) ?? 0,
                              })}
                              aria-invalid={status === 'wrong' ? true : undefined}
                              value={values[piece.id] ?? ''}
                              onChange={(event) => {
                                const value = event.target.value;
                                setValues((current) => ({ ...current, [piece.id]: value }));
                                // Changing a checked word clears its mark until the next check.
                                setStatuses((current) => {
                                  if (!(piece.id in current)) return current;
                                  const next = { ...current };
                                  delete next[piece.id];
                                  return next;
                                });
                              }}
                              onKeyDown={onKeyDown}
                              readOnly={done}
                              lang={course.lang}
                              autoComplete="off"
                              autoCorrect="off"
                              autoCapitalize="none"
                              spellCheck={false}
                              enterKeyHint="done"
                              style={{
                                width: han
                                  ? `${Math.max(length, 2) * 1.15 + 1.2}em`
                                  : `${Math.max(length, 4) + 2}ch`,
                              }}
                              className={cn(
                                'mx-0.5 h-10 max-w-full rounded-lg border-2 px-2 text-center align-baseline font-bold text-navy-900 transition outline-none focus:ring-4 focus:ring-brand-100',
                                status === 'right'
                                  ? 'border-leaf-500 bg-leaf-50 text-leaf-700'
                                  : status === 'wrong'
                                    ? 'animate-wiggle border-sun-400 bg-sun-50'
                                    : 'border-dashed border-brand-300 bg-brand-50/60 focus:border-solid focus:border-brand-500',
                              )}
                            />
                            {showAnswer && (
                              <span className="font-extrabold text-coral-600">
                                ({piece.answer})
                              </span>
                            )}
                          </span>
                        );
                      })}
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
              </div>
            </li>
          );
        })}
      </ol>

      {!done && checked && (
        <p role="status" className="text-center font-semibold text-navy-600">
          {t('{count} of {total} right. Fix the yellow words and check again!', {
            count: rightCount,
            total: blanks.length,
          })}
        </p>
      )}

      {done ? (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              size="lg"
              className="sm:flex-1"
              leftIcon={<Shuffle aria-hidden className="size-5" />}
              onClick={restart}
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
      ) : (
        <div className="flex flex-col gap-2">
          <Button
            type="submit"
            size="lg"
            fullWidth
            leftIcon={<PencilLine aria-hidden className="size-5" />}
            disabled={blanks.every((blank) => !(values[blank.id] ?? '').trim())}
          >
            {checked ? t('Check Again') : t('Check Answers')}
          </Button>
          {checked && (
            <Button
              variant="ghost"
              leftIcon={<Eye aria-hidden className="size-5" />}
              onClick={() => setRevealed(true)}
            >
              {t('Show Answers')}
            </Button>
          )}
        </div>
      )}
    </form>
  );
}
