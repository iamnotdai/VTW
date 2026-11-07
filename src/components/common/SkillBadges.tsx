import { BookOpen, Ear, Mic, PencilLine } from 'lucide-react';
import type { ComponentType, SVGProps } from 'react';
import { t } from '@/i18n';
import { cn } from '@/lib/cn';
import type { Skill } from '@/types/models';

const SKILL_ICONS: Record<Skill, ComponentType<SVGProps<SVGSVGElement>>> = {
  listening: Ear,
  speaking: Mic,
  reading: BookOpen,
  writing: PencilLine,
};

function skillLabel(skill: Skill): string {
  switch (skill) {
    case 'listening':
      return t('Listening');
    case 'speaking':
      return t('Speaking');
    case 'reading':
      return t('Reading');
    case 'writing':
      return t('Writing');
  }
}

/**
 * The skills an activity practises (spec §4): small icons — ear, microphone, book, pencil — with
 * their names for screen readers (and as a tooltip).
 */
export function SkillBadges({
  skills,
  className,
}: {
  skills: readonly Skill[];
  className?: string;
}) {
  return (
    <ul aria-label={t('Skills')} className={cn('flex flex-wrap gap-1.5', className)}>
      {skills.map((skill) => {
        const Icon = SKILL_ICONS[skill];
        const label = skillLabel(skill);
        return (
          <li
            key={skill}
            title={label}
            className="flex size-7 items-center justify-center rounded-full bg-mist text-navy-600"
          >
            <Icon aria-hidden className="size-4" />
            <span className="sr-only">{label}</span>
          </li>
        );
      })}
    </ul>
  );
}
