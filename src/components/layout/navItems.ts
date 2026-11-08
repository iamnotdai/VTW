import { AudioLines, BookOpenText, Puzzle, Route } from 'lucide-react';
import type { ComponentType, SVGProps } from 'react';
import { paths } from '@/app/paths';
import { ChatSolidIcon, GearSolidIcon } from '@/components/icons/AppIcons';
import type { CourseConfig } from '@/config/courses';

export interface NavItem {
  to: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  /** Only highlight on an exact match (Journey, the `/` screen). */
  end?: boolean;
  /** Shown only in courses that have this feature (Grammar: English only). */
  feature?: keyof CourseConfig['features'];
}

/**
 * The app's main menu, in this order (spec §2.1, §18): Journey, Vocabulary, Pronunciation,
 * Conversation, Grammar (English course only, spec §25), Settings. Grammar sits last before
 * Settings so switching course never moves the other entries. Menus follow the content, never the
 * four skills.
 */
export const NAV_ITEMS: readonly NavItem[] = [
  { to: paths.home, label: 'Journey', icon: Route, end: true },
  { to: paths.vocabulary, label: 'Vocabulary', icon: BookOpenText },
  { to: paths.pronunciation, label: 'Pronunciation', icon: AudioLines },
  { to: paths.conversations, label: 'Conversation', icon: ChatSolidIcon },
  { to: paths.grammar, label: 'Grammar', icon: Puzzle, feature: 'grammar' },
  { to: paths.settings, label: 'Settings', icon: GearSolidIcon },
];

/** The menu entries of a course. */
export function navItemsFor(course: CourseConfig): NavItem[] {
  return NAV_ITEMS.filter((item) => !item.feature || course.features[item.feature]);
}
