import { BookOpenText, Route } from 'lucide-react';
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

/** The app's main menu — exactly these four entries (spec §2.1, §18). */
export const NAV_ITEMS: readonly NavItem[] = [
  { to: paths.home, label: 'Journey', icon: Route, end: true },
  { to: paths.vocabulary, label: 'Vocabulary', icon: BookOpenText },
  { to: paths.conversations, label: 'Conversation', icon: ChatSolidIcon },
  { to: paths.settings, label: 'Settings', icon: GearSolidIcon },
];
