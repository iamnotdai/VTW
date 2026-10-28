import { create } from 'zustand';
import { DEFAULT_SETTINGS } from '@/config/app';
import { settingsRepository } from '@/lib/repositories';
import type { AppSettings } from '@/types/models';

interface SettingsState {
  settings: AppSettings;
  /** Returns `false` when the change could not be persisted. */
  updateSettings: (patch: Partial<AppSettings>) => boolean;
  reload: () => void;
}

const loadSettings = () => settingsRepository.load() ?? DEFAULT_SETTINGS;

export const useSettingsStore = create<SettingsState>()((set, get) => ({
  settings: loadSettings(),
  updateSettings: (patch) => {
    const settings = { ...get().settings, ...patch };
    const persisted = settingsRepository.save(settings);
    set({ settings });
    return persisted;
  },
  reload: () => set({ settings: loadSettings() }),
}));
