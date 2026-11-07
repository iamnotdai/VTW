import { Keyboard, ListChecks } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/common/Button';
import { Breadcrumb, PageContainer, TopBar } from '@/components/layout/PageHeader';
import { getSceneWords, getSpeaker } from '@/data/content';
import { NotFoundPage } from '@/features/misc/NotFoundPage';
import { useCourse } from '@/hooks/useCourse';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { t } from '@/i18n';
import {
  buildBlankChoices,
  buildBlankLines,
  type BlankChoice,
  type BlankLine,
} from '@/lib/fillBlanks';
import { useProfileStore } from '@/stores/profileStore';
import { useProgressStore } from '@/stores/progressStore';
import type { Conversation, Scene } from '@/types/models';
import { ChoiceBlanks } from '../components/ChoiceBlanks';
import { TypedBlanks } from '../components/TypedBlanks';
import { rolePlayCrumbs } from '../rolePlay';
import { useConversationParam } from '../useConversationParam';

/**
 * Fill in the Blanks (`/conversation/:conversationId/fill-blanks`, spec §9.6): the dialogue with one
 * word missing per line; the learner listens and chooses the missing words. Learners who can type
 * (Profile › "Yes, I can type words") may type them instead.
 */
export function FillBlanksPage() {
  const params = useConversationParam();
  if (!params) return <NotFoundPage />;
  return <FillBlanks key={params.conversation.id} {...params} />;
}

type Mode = 'choose' | 'type';

interface Round {
  blankLines: BlankLine[];
  choices: Record<string, BlankChoice[]>;
}

function FillBlanks({ conversation, scene }: { conversation: Conversation; scene: Scene }) {
  useDocumentTitle(t('{title} · Fill in the Blanks', { title: conversation.title }));
  const course = useCourse();
  const canType = useProfileStore((state) => state.profile?.canTypeWords ?? false);
  const crumbs = rolePlayCrumbs(conversation, t('Fill in the Blanks'));

  // Random blanks and options, picked once per round (like quiz options).
  const createRound = (): Round => {
    const words = getSceneWords(scene);
    const blankLines = buildBlankLines(conversation.lines, {
      vocabulary: words.map((word) => word.text),
      names: conversation.lines.map((line) => getSpeaker(line.speakerId)?.name ?? line.speakerId),
      lang: course.lang,
    });
    const choices = buildBlankChoices(conversation.lines, blankLines, {
      vocabulary: words.map((word) => ({
        text: word.text,
        ...(word.pinyin ? { pinyin: word.pinyin } : {}),
      })),
      lang: course.lang,
    });
    return { blankLines, choices };
  };
  const [round, setRound] = useState<Round>(createRound);
  const [roundNumber, setRoundNumber] = useState(0);
  const [preferredMode, setPreferredMode] = useState<Mode>('choose');
  // Learners who can't type never see a text box.
  const mode: Mode = canType ? preferredMode : 'choose';

  const finishStep = () =>
    useProgressStore.getState().completeConversationStep(conversation.id, 'fill');

  const restart = () => {
    setRound(createRound());
    setRoundNumber((value) => value + 1);
  };
  // Switching mode starts the same blanks over.
  const switchMode = () => {
    setPreferredMode(mode === 'choose' ? 'type' : 'choose');
    setRoundNumber((value) => value + 1);
  };

  return (
    <>
      <TopBar>
        <Breadcrumb items={crumbs} />
      </TopBar>
      <PageContainer width="narrow" className="flex flex-col gap-5">
        <div className="flex flex-col items-center text-center">
          <h1 className="text-[1.875rem] leading-tight font-extrabold text-navy-900 sm:text-[2.25rem]">
            {t('Fill in the Blanks')}
          </h1>
          <p className="mt-1 text-base font-medium text-navy-500 sm:text-lg">
            {mode === 'choose'
              ? t('Listen to each line and choose the missing word.')
              : t('Listen to each line and type the missing word.')}
          </p>
          {canType && (
            <Button
              variant="ghost"
              className="mt-1"
              leftIcon={
                mode === 'choose' ? (
                  <Keyboard aria-hidden className="size-5" />
                ) : (
                  <ListChecks aria-hidden className="size-5" />
                )
              }
              onClick={switchMode}
            >
              {mode === 'choose' ? t('Type the words instead') : t('Choose the words instead')}
            </Button>
          )}
        </div>

        {mode === 'choose' ? (
          <ChoiceBlanks
            key={roundNumber}
            conversation={conversation}
            blankLines={round.blankLines}
            choices={round.choices}
            onAllRight={finishStep}
            onRestart={restart}
          />
        ) : (
          <TypedBlanks
            key={roundNumber}
            conversation={conversation}
            blankLines={round.blankLines}
            onAllRight={finishStep}
            onRestart={restart}
          />
        )}
      </PageContainer>
    </>
  );
}
