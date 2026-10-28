import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router';
import { paths } from '@/app/paths';
import { Avatar } from '@/components/common/Avatar';
import { getLearnerLevel } from '@/lib/progress';
import { cn } from '@/lib/cn';
import { useProfileStore } from '@/stores/profileStore';
import { useProgressStore } from '@/stores/progressStore';

/** "Level N" of the learner, computed from the learned words in storage. */
function useLearnerLevel(): number {
  return useProgressStore((state) => getLearnerLevel(state.progress));
}

/**
 * The learner (avatar, name, level) as shown in the menu and in every top bar of the design.
 * In the top bar it links to Settings, where the profile can be changed.
 */
export function LearnerChip({
  tone = 'light',
  compact = false,
  className,
}: {
  /** `dark` = on the navy menu, `light` = on white surfaces (top bar, links to Settings). */
  tone?: 'light' | 'dark';
  /** Face only, without name and level (collapsed menu). */
  compact?: boolean;
  className?: string;
}) {
  const profile = useProfileStore((state) => state.profile);
  const level = useLearnerLevel();
  if (!profile) return null;

  const onMenu = tone === 'dark';
  const content = (
    <>
      <Avatar avatar={profile.avatar} size={onMenu ? 52 : 48} ring={onMenu ? 'white' : 'brand'} />
      {/* The collapsed menu and phones show the face only. */}
      <span
        className={cn(
          'min-w-0 leading-tight',
          onMenu ? (compact ? 'hidden' : 'block') : 'hidden sm:block',
        )}
      >
        <span
          className={cn(
            'block max-w-40 truncate font-bold',
            onMenu ? 'text-[1.0625rem] text-white' : 'text-base text-navy-900',
          )}
          title={profile.fullName}
        >
          {profile.fullName}
        </span>
        <span
          className={cn(
            'block text-[0.9375rem] font-semibold',
            onMenu ? 'text-white/75' : 'text-brand-600',
          )}
        >
          Level {level}
        </span>
      </span>
    </>
  );

  if (onMenu) {
    return <div className={cn('flex items-center gap-3', className)}>{content}</div>;
  }
  return (
    <Link
      to={paths.settings}
      aria-label={`${profile.fullName}, Level ${level} — open Settings`}
      className={cn(
        'flex shrink-0 items-center gap-3 rounded-full py-1 pr-1 pl-1 transition hover:bg-brand-50 sm:pr-2',
        className,
      )}
    >
      {content}
      <ChevronRight aria-hidden className="hidden size-5 text-brand-500 sm:block" />
    </Link>
  );
}
