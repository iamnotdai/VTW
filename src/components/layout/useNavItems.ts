import { useCourse } from '@/hooks/useCourse';
import { navItemsFor, type NavItem } from './navItems';

/** The menu entries of the active course (no Grammar in the Chinese course). */
export function useNavItems(): NavItem[] {
  return navItemsFor(useCourse());
}
