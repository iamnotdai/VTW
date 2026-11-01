import { useEffect } from 'react';
import { APP_NAME } from '@/config/app';
import { useCourse } from './useCourse';

/**
 * Sets a descriptive page title so screen-reader users know where they are. Pass copy that is
 * already translated (`t('Settings')`); the app name is never translated.
 */
export function useDocumentTitle(title?: string): void {
  const { slogan } = useCourse();
  useEffect(() => {
    document.title = title ? `${title} · ${APP_NAME}` : `${APP_NAME} — ${slogan}`;
  }, [title, slogan]);
}
