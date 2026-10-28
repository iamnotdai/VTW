import { useEffect } from 'react';
import { APP_NAME } from '@/config/app';

/** Sets a descriptive page title so screen-reader users know where they are. */
export function useDocumentTitle(title?: string): void {
  useEffect(() => {
    document.title = title
      ? `${title} · ${APP_NAME}`
      : `${APP_NAME} — Explore Life. Learn English.`;
  }, [title]);
}
