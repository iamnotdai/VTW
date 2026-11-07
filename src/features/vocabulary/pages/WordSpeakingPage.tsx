import { useMemo } from 'react';
import { paths } from '@/app/paths';
import { getSceneWords } from '@/data/content';
import { ComingSoonPage, NotFoundPage } from '@/features/misc/NotFoundPage';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { t } from '@/i18n';
import type { Scene } from '@/types/models';
import { WordSpeakingRound } from '../speaking/WordSpeakingRound';
import { useSceneParam } from '../useSceneParam';

/** Which menu opened Word Speaking: it decides the breadcrumb and where "back" leads. */
export type WordSpeakingMenu = 'vocabulary' | 'pronunciation';

/**
 * Word Speaking (spec §7.7): the learner says each word of the scene and gets a score with the
 * sounds to practise coloured. One screen, two ways in: after the flashcards
 * (`/vocabulary/:sceneId/speaking`) and from a scene card of the Pronunciation menu
 * (`/pronunciation/scene/:sceneId`). Each word's best score is saved for the Pronunciation menu.
 */
export function WordSpeakingPage({ menu = 'vocabulary' }: { menu?: WordSpeakingMenu }) {
  const result = useSceneParam();
  if (result.status === 'not-found') return <NotFoundPage />;
  if (result.status === 'coming-soon') return <ComingSoonPage title={result.scene.title} />;
  return <SceneWordSpeaking key={result.scene.id} scene={result.scene} menu={menu} />;
}

function SceneWordSpeaking({ scene, menu }: { scene: Scene; menu: WordSpeakingMenu }) {
  useDocumentTitle(t('Speaking · {scene}', { scene: scene.title }));
  const words = useMemo(() => getSceneWords(scene), [scene]);
  const pronunciation = menu === 'pronunciation';

  return (
    <WordSpeakingRound
      words={words}
      crumbs={
        pronunciation
          ? [{ label: t('Pronunciation'), to: paths.pronunciation }, { label: scene.title }]
          : [
              { label: t('Vocabulary'), to: paths.vocabulary },
              { label: scene.title, to: paths.topic(scene.id) },
              { label: t('Speaking') },
            ]
      }
      heading={t('{scene} speaking practice', { scene: scene.title })}
      explore={{
        to: paths.explore(scene.id),
        label: t('Explore the {scene}', { scene: scene.title }),
      }}
      back={
        pronunciation
          ? { to: paths.pronunciation, label: t('Back to Pronunciation') }
          : { to: paths.topic(scene.id), label: t('Back to Overview') }
      }
    />
  );
}
