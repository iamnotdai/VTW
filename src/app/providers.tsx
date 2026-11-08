import { useEffect, type ReactNode } from 'react';
import { getActiveCourse } from '@/lib/course';
import { PROGRESS_KEYS, SPEAKING_KEYS } from '@/lib/repositories';
import { STORAGE_KEYS } from '@/lib/storage';
import { useGrammarProgressStore } from '@/stores/grammarProgressStore';
import { useProfileStore } from '@/stores/profileStore';
import { useProgressStore } from '@/stores/progressStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useSpeakingProgressStore } from '@/stores/speakingProgressStore';

/** Keeps several open tabs in sync: when another tab saves, reload that slice from storage. */
function useCrossTabSync() {
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === null || event.key === STORAGE_KEYS.profile)
        useProfileStore.getState().reload();
      if (event.key === null || event.key === PROGRESS_KEYS[getActiveCourse()])
        useProgressStore.getState().reload();
      if (event.key === null || event.key === SPEAKING_KEYS[getActiveCourse()])
        useSpeakingProgressStore.getState().reload();
      if (event.key === null || event.key === STORAGE_KEYS.grammar)
        useGrammarProgressStore.getState().reload();
      if (event.key === null || event.key === STORAGE_KEYS.settings)
        useSettingsStore.getState().reload();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);
}

export function AppProviders({ children }: { children: ReactNode }) {
  useCrossTabSync();
  return children;
}
