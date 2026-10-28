import { useEffect, type ReactNode } from 'react';
import { STORAGE_KEYS } from '@/lib/storage';
import { useProfileStore } from '@/stores/profileStore';
import { useProgressStore } from '@/stores/progressStore';
import { useSettingsStore } from '@/stores/settingsStore';

/** Keeps several open tabs in sync: when another tab saves, reload that slice from storage. */
function useCrossTabSync() {
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === null || event.key === STORAGE_KEYS.profile)
        useProfileStore.getState().reload();
      if (event.key === null || event.key === STORAGE_KEYS.progress)
        useProgressStore.getState().reload();
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
