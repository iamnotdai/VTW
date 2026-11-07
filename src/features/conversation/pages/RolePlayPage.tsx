import { ArrowLeftRight, ArrowRight, Languages, Play, SkipForward } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { Button } from '@/components/common/Button';
import { Breadcrumb, PageContainer, TopBar } from '@/components/layout/PageHeader';
import { SpeakingScoreNote } from '@/components/speaking/SpeakingFeedback';
import { ROLE_PLAY_CONFIG } from '@/config/app';
import { getSpeaker } from '@/data/content';
import { NotFoundPage } from '@/features/misc/NotFoundPage';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { usePrefersReducedMotion } from '@/hooks/useMediaQuery';
import { t } from '@/i18n';
import { optionalAssetUrl } from '@/lib/assets';
import { playSfx } from '@/lib/sfx';
import type { SpeakingScore } from '@/lib/speakingScore';
import { useAudioStore } from '@/stores/audioStore';
import { useProgressStore } from '@/stores/progressStore';
import { useSettingsStore } from '@/stores/settingsStore';
import type { Conversation } from '@/types/models';
import { RolePicker } from '../components/RolePicker';
import { RolePlayLine } from '../components/RolePlayLine';
import { RolePlaySummary } from '../components/RolePlaySummary';
import { RolePlayTurn } from '../components/RolePlayTurn';
import { SpeakerAvatar } from '../components/SpeakerAvatar';
import { addLineScore, conversationRoles, rolePlayCrumbs, type RoleLineResult } from '../rolePlay';
import { useConversationParam } from '../useConversationParam';

/**
 * Role-play (`/conversation/:conversationId/role-play?as=<speakerId>`, spec §9.5): the learner picks
 * a character and says that character's lines; the other characters speak by themselves. Every
 * line said into the microphone gets a score. The character can be changed at any time.
 */
export function RolePlayPage() {
  const params = useConversationParam();
  if (!params) return <NotFoundPage />;
  return <RolePlay key={params.conversation.id} conversation={params.conversation} />;
}

function RolePlay({ conversation }: { conversation: Conversation }) {
  useDocumentTitle(t('{title} · Role-play', { title: conversation.title }));
  const [searchParams, setSearchParams] = useSearchParams();
  const [lastRole, setLastRole] = useState<string>();
  const roles = useMemo(() => conversationRoles(conversation), [conversation]);
  const role = roles.find((item) => item.speakerId === searchParams.get('as'))?.speakerId;
  // Replace, so Back leaves the role-play instead of walking through every pick.
  const choose = (speakerId?: string) =>
    setSearchParams(speakerId ? { as: speakerId } : {}, { replace: true });

  return (
    <>
      <TopBar>
        <Breadcrumb items={rolePlayCrumbs(conversation, t('Role-play'))} />
      </TopBar>
      <PageContainer width="narrow" className="flex flex-col gap-5">
        {role ? (
          <RolePlaySession
            key={role}
            conversation={conversation}
            role={role}
            canSwitch={roles.length > 1}
            onChangeRole={() => {
              setLastRole(role);
              choose();
            }}
          />
        ) : (
          <RolePicker
            conversation={conversation}
            roles={roles}
            current={lastRole}
            onChoose={choose}
          />
        )}
      </PageContainer>
    </>
  );
}

type Phase = 'ready' | 'playing' | 'done';

function RolePlaySession({
  conversation,
  role,
  canSwitch,
  onChangeRole,
}: {
  conversation: Conversation;
  role: string;
  canSwitch: boolean;
  onChangeRole: () => void;
}) {
  const soundEnabled = useSettingsStore((state) => state.settings.soundEnabled);
  const showVietnamese = useSettingsStore((state) => state.settings.showVietnameseMeaning);
  const completeConversation = useProgressStore((state) => state.completeConversation);
  const reducedMotion = usePrefersReducedMotion();
  const [phase, setPhase] = useState<Phase>('ready');
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<Record<string, RoleLineResult>>({});
  const [listenMode, setListenMode] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const chainRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const endRef = useRef<HTMLDivElement>(null);

  const lines = conversation.lines;
  const name = getSpeaker(role)?.name ?? role;
  const line = phase === 'playing' ? lines[index] : undefined;
  const myTurn = !!line && line.speakerId === role;
  // Another character's line is playing by itself: replaying a line now would cut it off.
  const autoPlaying = !!line && !myTurn && soundEnabled;

  // Leaving (or switching character) stops the conversation.
  useEffect(
    () => () => {
      chainRef.current += 1;
      clearTimeout(timerRef.current);
      useAudioStore.getState().stop();
    },
    [],
  );

  // Keep the newest line (and the learner's panel) in view.
  useEffect(() => {
    if (phase !== 'playing') return;
    endRef.current?.scrollIntoView?.({
      block: 'nearest',
      behavior: reducedMotion ? 'auto' : 'smooth',
    });
  }, [phase, index, reducedMotion]);

  const finish = useCallback(() => {
    setPhase('done');
    completeConversation(conversation.id);
    if (useSettingsStore.getState().settings.soundEnabled) playSfx('completed');
  }, [completeConversation, conversation.id]);

  /**
   * Shows line `start`. The other characters' lines play one after another until it is the
   * learner's turn. Called from taps (Start, Continue), so browsers allow the speech.
   */
  const playFrom = useCallback(
    (start: number) => {
      chainRef.current += 1;
      const chain = chainRef.current;
      clearTimeout(timerRef.current);
      // A skipped line (or the learner's example) stops talking.
      useAudioStore.getState().stop();
      const step = (i: number) => {
        if (chain !== chainRef.current) return;
        if (i >= lines.length) {
          finish();
          return;
        }
        setIndex(i);
        const current = lines[i];
        // The learner's line waits for them; with sound off, a button moves on.
        if (current.speakerId === role || !useSettingsStore.getState().settings.soundEnabled) {
          return;
        }
        const voice = getSpeaker(current.speakerId)?.voice;
        const next = () => {
          if (chain !== chainRef.current) return;
          timerRef.current = setTimeout(() => step(i + 1), ROLE_PLAY_CONFIG.lineGapMs);
        };
        useAudioStore.getState().play(
          `line:${current.id}`,
          {
            text: current.text,
            src: optionalAssetUrl(current.audio),
            pitch: voice?.pitch,
            rate: voice?.rate,
          },
          next,
          next,
        );
      };
      step(start);
    },
    [lines, role, finish],
  );

  const begin = () => {
    setResults({});
    setPhase('playing');
    playFrom(0);
  };

  const onScore = useCallback(
    (score: SpeakingScore) => {
      if (!line) return;
      setResults((current) => ({ ...current, [line.id]: addLineScore(current[line.id], score) }));
    },
    [line],
  );

  const onContinue = (result?: 'practiced' | 'skipped') => {
    if (line && result) {
      setResults((current) =>
        current[line.id] ? current : { ...current, [line.id]: { kind: result } },
      );
    }
    playFrom(index + 1);
  };

  if (phase === 'done') {
    return (
      <>
        <h1 className="sr-only">{t('Role-play: {title}', { title: conversation.title })}</h1>
        <RolePlaySummary
          conversation={conversation}
          role={role}
          results={results}
          canSwitch={canSwitch}
          onReplay={begin}
          onChangeRole={onChangeRole}
        />
      </>
    );
  }

  const speakerName = line ? (getSpeaker(line.speakerId)?.name ?? line.speakerId) : '';

  return (
    <>
      {/* On phones the buttons drop to their own row, on the right. */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-white p-2 pr-3 shadow-soft ring-1 ring-navy-100">
        {/* Grows but never shrinks under its content, so the buttons wrap instead of covering it. */}
        <div className="flex flex-auto items-center gap-2">
          <SpeakerAvatar speakerId={role} size={40} />
          <p className="font-bold whitespace-nowrap text-navy-800">
            {t('You are {name}', { name })}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {showVietnamese && phase === 'playing' && (
            <Button
              variant="ghost"
              size="sm"
              aria-pressed={showTranslation}
              leftIcon={<Languages aria-hidden className="size-4" />}
              onClick={() => setShowTranslation((shown) => !shown)}
            >
              {showTranslation ? t('Hide') : t('Translate')}
            </Button>
          )}
          {canSwitch && (
            <Button
              variant="soft"
              size="sm"
              leftIcon={<ArrowLeftRight aria-hidden className="size-4" />}
              onClick={onChangeRole}
            >
              {t('Change Character')}
            </Button>
          )}
        </div>
      </div>

      {phase === 'ready' ? (
        <section className="flex animate-pop-in flex-col items-center gap-4 rounded-[1.25rem] bg-white p-6 text-center shadow-lift sm:p-8">
          <SpeakerAvatar speakerId={role} size={104} />
          <h1 className="text-[1.875rem] leading-tight font-extrabold text-navy-900">
            {t('You are {name}!', { name })}
          </h1>
          <ol className="list-inside list-decimal space-y-1 text-left text-base font-medium text-navy-600 sm:text-lg">
            <li>{t('Listen to the other characters.')}</li>
            <li>{t('When it’s your turn, tap the microphone and say your line.')}</li>
            <li>{t('Each line you say gets a score.')}</li>
          </ol>
          <Button
            size="lg"
            className="min-w-48"
            leftIcon={<Play aria-hidden className="size-5 fill-current" />}
            onClick={begin}
          >
            {t('Start')}
          </Button>
        </section>
      ) : (
        <>
          <h1 className="sr-only">{t('Role-play: {title}', { title: conversation.title })}</h1>
          <ol className="flex flex-col gap-3" aria-label={t('Conversation')}>
            {lines.slice(0, index + 1).map((item) => (
              <RolePlayLine
                key={item.id}
                line={item}
                mine={item.speakerId === role}
                current={item.id === line?.id}
                result={results[item.id]}
                showTranslation={showVietnamese && showTranslation}
                replayable={!autoPlaying}
              />
            ))}
          </ol>
          {line &&
            (myTurn ? (
              <RolePlayTurn
                key={line.id}
                line={line}
                last={index === lines.length - 1}
                listenMode={listenMode}
                onListenModeChange={setListenMode}
                onScore={onScore}
                onContinue={onContinue}
              />
            ) : (
              <div className="flex flex-wrap items-center justify-center gap-3 rounded-2xl bg-mist px-4 py-3">
                <p className="text-[15px] font-semibold text-navy-600" role="status">
                  {soundEnabled
                    ? t('{name} is speaking…', { name: speakerName })
                    : t('Sound is off: read {name}’s line, then continue.', { name: speakerName })}
                </p>
                <Button
                  variant={soundEnabled ? 'ghost' : 'primary'}
                  size="sm"
                  rightIcon={
                    soundEnabled ? (
                      <SkipForward aria-hidden className="size-4" />
                    ) : (
                      <ArrowRight aria-hidden className="size-4" strokeWidth={2.5} />
                    )
                  }
                  onClick={() => playFrom(index + 1)}
                >
                  {soundEnabled ? t('Skip') : t('Continue')}
                </Button>
              </div>
            ))}
        </>
      )}
      <div ref={endRef} />
      <SpeakingScoreNote />
    </>
  );
}
