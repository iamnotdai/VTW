import { Lock } from 'lucide-react';
import { useState } from 'react';
import { paths } from '@/app/paths';
import { Badge } from '@/components/common/Badge';
import { PageContainer, PageTitle, TopBar } from '@/components/layout/PageHeader';
import { SCENE_GRID_CLASS } from '@/config/app';
import { getSceneConversations, getSceneGroups, getScenes, isSceneAvailable } from '@/data/content';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { assetUrl } from '@/lib/assets';
import { cn } from '@/lib/cn';
import { useProgressStore } from '@/stores/progressStore';
import type { Scene } from '@/types/models';
import { GroupIcon } from '@/features/vocabulary/components/GroupIcon';
import { ConversationRow } from '../components/ConversationRow';

const hasConversations = (scene: Scene) =>
  isSceneAvailable(scene) && getSceneConversations(scene).length > 0;

/**
 * Screen 14 — Conversation Scene List (`/conversation`): places grouped by area with the number of
 * finished conversations. Choosing a place lists its conversations underneath.
 */
export function ConversationScenesPage() {
  useDocumentTitle('Conversation');
  const groups = getSceneGroups();
  const completedIds = useProgressStore((state) => state.progress.completedConversationIds);
  const lastVisitedId = useProgressStore((state) => state.progress.lastVisitedSceneId);
  const [selectedId, setSelectedId] = useState(() => {
    const scenes = getScenes().filter(hasConversations);
    return (scenes.find((scene) => scene.id === lastVisitedId) ?? scenes[0])?.id;
  });

  return (
    <>
      <TopBar variant="title">
        <PageTitle
          title="Conversation"
          description="Watch, listen and practice real conversations."
        />
      </TopBar>
      <PageContainer width="full" className="flex flex-col gap-8">
        {groups.map((group) => {
          const selected = group.scenes.find((scene) => scene.id === selectedId);
          return (
            <section key={group.id} aria-labelledby={`conv-group-${group.id}`}>
              <div className="mb-4 flex items-center gap-3">
                <GroupIcon icon={group.icon} />
                <h2
                  id={`conv-group-${group.id}`}
                  className="text-[1.75rem] font-extrabold text-navy-900"
                >
                  {group.title}
                </h2>
              </div>
              <div className={SCENE_GRID_CLASS}>
                {group.scenes.map((scene) => (
                  <SceneTile
                    key={scene.id}
                    scene={scene}
                    completedIds={completedIds}
                    selected={scene.id === selectedId}
                    onSelect={() => setSelectedId(scene.id)}
                  />
                ))}
              </div>
              {selected && <SceneConversationList scene={selected} completedIds={completedIds} />}
            </section>
          );
        })}
      </PageContainer>
    </>
  );
}

function SceneTile({
  scene,
  completedIds,
  selected,
  onSelect,
}: {
  scene: Scene;
  completedIds: readonly string[];
  selected: boolean;
  onSelect: () => void;
}) {
  const conversations = getSceneConversations(scene);
  const available = hasConversations(scene);
  const done = conversations.filter((item) => completedIds.includes(item.id)).length;
  const complete = available && done === conversations.length;

  const content = (
    <>
      <div className="relative aspect-[2.6/1] overflow-hidden bg-cream-100">
        <img
          src={assetUrl(scene.thumbnail)}
          alt=""
          loading="lazy"
          draggable={false}
          className={cn(
            'h-full w-full object-cover transition duration-300',
            available && 'group-hover:scale-105',
          )}
        />
        {!available && (
          <Badge
            tone="white"
            size="sm"
            icon={<Lock aria-hidden />}
            className="absolute top-2 left-2"
          >
            Coming soon
          </Badge>
        )}
      </div>
      <div className="flex items-center justify-between gap-3 px-4 py-3.5">
        <h3
          className={cn(
            'truncate text-lg font-bold sm:text-xl',
            selected ? 'text-brand-600' : 'text-navy-900',
          )}
        >
          {scene.title}
        </h3>
        {available && (
          <span
            className={cn(
              'text-lg font-bold tabular-nums sm:text-xl',
              complete
                ? 'text-leaf-600'
                : selected || done > 0
                  ? 'text-brand-600'
                  : 'text-navy-400',
            )}
          >
            {done}/{conversations.length}
            <span className="sr-only"> conversations done</span>
          </span>
        )}
      </div>
    </>
  );

  const cardClass = cn(
    'block w-full overflow-hidden rounded-xl bg-white text-left shadow-soft transition',
    selected ? 'ring-2 ring-brand-500' : 'ring-1 ring-navy-100',
  );

  if (!available) {
    return (
      <div aria-disabled="true" className={cardClass}>
        {content}
      </div>
    );
  }
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={cn(cardClass, 'group hover:-translate-y-0.5 hover:shadow-lift')}
    >
      {content}
    </button>
  );
}

function SceneConversationList({
  scene,
  completedIds,
}: {
  scene: Scene;
  completedIds: readonly string[];
}) {
  const conversations = getSceneConversations(scene);
  const upNextId = conversations.find((item) => !completedIds.includes(item.id))?.id;
  return (
    <div className="mt-6 animate-fade-in">
      <h3 className="text-2xl font-extrabold text-navy-900">{scene.title} Conversations</h3>
      <p className="text-base font-medium text-navy-400 sm:text-lg">
        {conversations.length} conversations in this scene.
      </p>
      <ol className="mt-4 grid gap-2.5 lg:grid-cols-2 lg:gap-x-6">
        {conversations.map((conversation) => (
          <li key={conversation.id}>
            <ConversationRow
              conversation={conversation}
              to={paths.conversation(conversation.id)}
              completed={completedIds.includes(conversation.id)}
              upNext={conversation.id === upNextId}
            />
          </li>
        ))}
      </ol>
    </div>
  );
}
