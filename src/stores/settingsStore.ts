import { create } from 'zustand';
import { DEFAULT_SETTINGS } from '@/config/app';
import { setActiveCourse } from '@/lib/course';
import { settingsRepository } from '@/lib/repositories';
import type { AppSettings } from '@/types/models';
import { useProgressStore } from './progressStore';

interface SettingsState {
  settings: AppSettings;
  /** Returns `false` when the change could not be persisted. */
  updateSettings: (patch: Partial<AppSettings>) => boolean;
  reload: () => void;
}

const loadSettings = () => settingsRepository.load() ?? DEFAULT_SETTINGS;

/**
 * Points content, copy and speech at the settings' course, and loads that course's progress (also at
 * startup: the progress store may have loaded before the course was known).
 */
function applyCourse(settings: AppSettings, previous?: AppSettings) {
  setActiveCourse(settings.course);
  if (previous?.course !== settings.course) useProgressStore.getState().reload();
}

const initialSettings = loadSettings();
applyCourse(initialSettings);

export const useSettingsStore = create<SettingsState>()((set, get) => ({
  settings: initialSettings,
  updateSettings: (patch) => {
    const previous = get().settings;
    const settings = { ...previous, ...patch };
    const persisted = settingsRepository.save(settings);
    applyCourse(settings, previous);
    set({ settings });
    return persisted;
  },
  reload: () => {
    const previous = get().settings;
    const settings = loadSettings();
    applyCourse(settings, previous);
    set({ settings });
  },
}));
