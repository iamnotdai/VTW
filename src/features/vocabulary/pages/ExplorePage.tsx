import { ArrowLeft } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useNavigate } from 'react-router';
import { paths, type NavigationState } from '@/app/paths';
import { ButtonLink } from '@/components/common/Button';
import { InteractiveScene } from '@/components/scene/InteractiveScene';
import { getWord } from '@/data/content';
import { ComingSoonPage, NotFoundPage } from '@/features/misc/NotFoundPage';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { getFoundWordIds } from '@/lib/progress';
import { useProgressStore } from '@/stores/progressStore';
import type { Scene } from '@/types/models';
import { ObjectsFoundBar } from '../components/ObjectsFoundBar';
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
  const foundIds = useProgressStore((state) => getFoundWordIds(state.progress, scene.id));
  const visitScene = useProgressStore((state) => state.visitScene);
  const [tileHighlight, setTileHighlight] = useState<string | null>(null);

  const foundSet = useMemo(
    () => new Set(foundIds.filter((id) => scene.wordIds.includes(id))),
    [foundIds, scene.wordIds],
  );

  useEffect(() => visitScene(scene.id), [scene.id, visitScene]);

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
        className="relative flex flex-1 flex-col overflow-hidden"
        style={{ '--scene-ratio': String(scene.width / scene.height) } as CSSProperties}
      >
        <VocabularyBackdrop />
        {/* Picture + tiles fit the screen height without cropping the picture (spec §13). */}
        <div className="relative z-10 mx-auto w-full [--objects-bar-height:11rem] md:my-auto md:w-[min(100%,calc((100dvh-var(--objects-bar-height))*var(--scene-ratio)))]">
          <InteractiveScene
            scene={scene}
            foundWordIds={foundSet}
            getWordText={getWordText}
            onOpenObject={openObject}
            externalHighlightId={tileHighlight}
          />
          <ObjectsFoundBar
            className="mx-3 my-3 md:mx-0"
            wordIds={scene.wordIds}
            foundWordIds={foundSet}
            onOpen={openObject}
            onHighlight={setTileHighlight}
            conversationsHref={paths.topicConversations(scene.id)}
            leading={
              <ButtonLink
                to={paths.topic(scene.id)}
                variant="secondary"
                size="sm"
                shape="pill"
                leftIcon={<ArrowLeft aria-hidden className="size-4" strokeWidth={2.5} />}
              >
                Back
              </ButtonLink>
            }
          />
        </div>
      </div>
    </>
  );
}
