import { AudioLines, BookOpenText, Route } from 'lucide-react';
import type { ComponentType, SVGProps } from 'react';
import { paths } from '@/app/paths';
import { ChatSolidIcon, GearSolidIcon } from '@/components/icons/AppIcons';

export interface NavItem {
  to: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  /** Only highlight on an exact match (Journey, the `/` screen). */
  end?: boolean;
}

/**
 * The app's main menu, in this order (spec §2.1, §18): Journey, Vocabulary, Pronunciation,
 * Conversation, (Grammar — English course only, added with its screens, spec §25), Settings.
 * Menus follow the content, never the four skills.
 */
export const NAV_ITEMS: readonly NavItem[] = [
  { to: paths.home, label: 'Journey', icon: Route, end: true },
  { to: paths.vocabulary, label: 'Vocabulary', icon: BookOpenText },
  { to: paths.pronunciation, label: 'Pronunciation', icon: AudioLines },
  { to: paths.conversations, label: 'Conversation', icon: ChatSolidIcon },
  { to: paths.settings, label: 'Settings', icon: GearSolidIcon },
];
