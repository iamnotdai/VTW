import { Lock } from 'lucide-react';
import { Link } from 'react-router';
import { paths } from '@/app/paths';
import { Badge } from '@/components/common/Badge';
import { ProgressBar } from '@/components/common/ProgressBar';
import { isSceneAvailable } from '@/data/content';
import { assetUrl } from '@/lib/assets';
import { cn } from '@/lib/cn';
import type { Scene } from '@/types/models';
import { useSceneProgress } from '../useSceneProgress';

/**
 * Scene card of the design board: picture, name with the completed %, green progress bar (spec §7.1).
 * Sized for the four-per-row desktop grid (`SCENE_GRID_CLASS`).
 */
export function SceneCard({ scene }: { scene: Scene }) {
  const available = isSceneAvailable(scene);
  const { total, completed, percent } = useSceneProgress(scene);

  const content = (
    <>
      <div className="relative aspect-[16/9] overflow-hidden bg-cream-100">
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

      <div className="px-3 pt-2.5 pb-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="truncate text-[0.9375rem] font-bold text-navy-900">{scene.title}</h3>
          {available && (
            <span aria-hidden className="shrink-0 text-[0.9375rem] font-bold text-brand-500">
              {percent}%
            </span>
          )}
        </div>
        <ProgressBar
          value={available ? percent : 0}
          label={`${scene.title} progress`}
          size="sm"
          className="mt-2.5"
        />
        {available && (
          <span className="sr-only">
            {completed}/{total} words learned, {percent}% completed
          </span>
        )}
      </div>
    </>
  );

  const cardClass = 'block overflow-hidden rounded-xl border border-navy-100 bg-white shadow-soft';

  if (!available) {
    return (
      <div aria-disabled="true" className={cardClass}>
        {content}
      </div>
    );
  }

  return (
    <Link
      to={paths.topic(scene.id)}
      className={cn(
        cardClass,
        'group transition duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lift',
      )}
    >
      {content}
    </Link>
  );
}
