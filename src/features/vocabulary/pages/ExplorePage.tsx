import { ArrowLeft, RotateCcw } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useNavigate } from 'react-router';
import { paths, type NavigationState } from '@/app/paths';
import { Button, ButtonLink } from '@/components/common/Button';
import { InteractiveScene } from '@/components/scene/InteractiveScene';
import { getWord } from '@/data/content';
import { ComingSoonPage, NotFoundPage } from '@/features/misc/NotFoundPage';
import { useAppFullscreen } from '@/hooks/useAppFullscreen';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { cn } from '@/lib/cn';
import { getFoundWordIds } from '@/lib/progress';
import { useProfileStore } from '@/stores/profileStore';
import { useProgressStore } from '@/stores/progressStore';
import type { Scene } from '@/types/models';
import { ObjectsFoundBar } from '../components/ObjectsFoundBar';
import { SceneCompletedDialog } from '../components/SceneCompletedDialog';
import { VocabularyBackdrop } from '../components/VocabularyBackdrop';
import { useQuizSessionStore } from '../quiz/quizSession';
import { startQuestion } from '../quiz/startQuestion';
import { useSceneParam } from '../useSceneParam';

/** Screen 06 — Explore Scene (`/vocabulary/:sceneId/explore`). */
export function ExplorePage() {
  const result = useSceneParam();
  if (result.status === 'not-found') return <NotFoundPage />;
  if (result.status === 'coming-soon') return <ComingSoonPage title={result.scene.title} />;
  return <Explore scene={result.scene} />;
}

const FROM_EXPLORE: NavigationState = { from: 'explore' };

function Explore({ scene }: { scene: Scene }) {
  useDocumentTitle(`Explore the ${scene.title}`);
  const navigate = useNavigate();
  const fullscreen = useAppFullscreen();
  const foundIds = useProgressStore((state) => getFoundWordIds(state.progress, scene.id));
  const visitScene = useProgressStore((state) => state.visitScene);
  const celebrated = useProgressStore((state) =>
    state.progress.celebratedSceneIds.includes(scene.id),
  );
  const celebrateScene = useProgressStore((state) => state.celebrateScene);
  const resetScene = useProgressStore((state) => state.resetScene);
  const avatar = useProfileStore((state) => state.profile?.avatar ?? 'boy');
  const [tileHighlight, setTileHighlight] = useState<string | null>(null);

  const foundSet = useMemo(
    () => new Set(foundIds.filter((id) => scene.wordIds.includes(id))),
    [foundIds, scene.wordIds],
  );

  useEffect(() => visitScene(scene.id), [scene.id, visitScene]);

  // The "Completed!" popup shows once per round: every way out of it marks the scene as celebrated,
  // so coming back later does not repeat it. "Play again" starts a new round (and a new popup).
  const allFound = scene.wordIds.length > 0 && foundSet.size === scene.wordIds.length;
  const completedOpen = allFound && !celebrated;
  const closeCompleted = useCallback(() => celebrateScene(scene.id), [celebrateScene, scene.id]);
  const playAgain = useCallback(() => resetScene(scene.id), [resetScene, scene.id]);

  const openObject = useCallback(
    (wordId: string) => {
      const word = getWord(wordId);
      if (!word) return;
      if (foundSet.has(wordId)) {
        // Learned objects can be reviewed any time; reviewing never adds progress again.
        useQuizSessionStore.getState().clear();
        navigate(paths.result(scene.id, wordId), { state: FROM_EXPLORE });
        return;
      }
      startQuestion(scene, word);
      navigate(paths.quiz(scene.id, wordId), { state: FROM_EXPLORE });
    },
    [foundSet, navigate, scene],
  );

  const getWordText = useCallback((wordId: string) => getWord(wordId)?.text ?? wordId, []);

  return (
    <>
      <h1 className="sr-only">Explore the {scene.title}</h1>

      <div
        className={cn(
          'relative flex flex-1 flex-col overflow-hidden',
          // Fullscreen: just the picture, as large as the screen allows (zoom buttons stay on it).
          fullscreen && 'items-center justify-center bg-navy-950 p-4',
        )}
        style={{ '--scene-ratio': String(scene.width / scene.height) } as CSSProperties}
      >
        {!fullscreen && <VocabularyBackdrop />}
        {/* Picture + tiles fit the screen height without cropping the picture (spec §13). */}
        <div
          className={cn(
            'relative z-10 mx-auto',
            fullscreen
              ? 'w-[min(100%,calc((100dvh-2rem)*var(--scene-ratio)))] overflow-hidden rounded-2xl'
              : 'w-full [--objects-bar-height:11rem] md:my-auto md:w-[min(100%,calc((100dvh-var(--objects-bar-height))*var(--scene-ratio)))]',
          )}
        >
          <InteractiveScene
            scene={scene}
            foundWordIds={foundSet}
            getWordText={getWordText}
            onOpenObject={openObject}
            externalHighlightId={tileHighlight}
          />
          {!fullscreen && (
            <ObjectsFoundBar
              className="mx-3 my-3 md:mx-0"
              wordIds={scene.wordIds}
              foundWordIds={foundSet}
              onOpen={openObject}
              onHighlight={setTileHighlight}
              conversationsHref={paths.topicConversations(scene.id)}
              scrollKey={scene.id}
              leading={
                <div className="flex items-center gap-2">
                  <ButtonLink
                    to={paths.topic(scene.id)}
                    variant="secondary"
                    size="sm"
                    shape="pill"
                    leftIcon={<ArrowLeft aria-hidden className="size-4" strokeWidth={2.5} />}
                  >
                    Back
                  </ButtonLink>
                  {allFound && (
                    <Button
                      variant="warm"
                      size="sm"
                      shape="pill"
                      onClick={playAgain}
                      leftIcon={<RotateCcw aria-hidden className="size-4" strokeWidth={2.5} />}
                    >
                      Play again
                    </Button>
                  )}
                </div>
              }
            />
          )}
        </div>
      </div>

      {completedOpen && (
        <SceneCompletedDialog
          sceneId={scene.id}
          avatar={avatar}
          onClose={closeCompleted}
          onReset={playAgain}
        />
      )}
    </>
  );
}
