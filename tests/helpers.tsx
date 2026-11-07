import { render } from '@testing-library/react';
import { createMemoryRouter, RouterProvider, type DataRouter } from 'react-router';
import { routes } from '@/app/routes';
import { useQuizSessionStore } from '@/features/vocabulary/quiz/quizSession';
import { useSpeakingSessionStore } from '@/features/conversation/speakingSession';
import { createProfile, type ProfileInput } from '@/lib/profile';
import { createEmptyProgress } from '@/lib/progress';
import { STORAGE_KEYS } from '@/lib/storage';
import type { AppSettings, LearningProgress } from '@/types/models';
import { useAudioStore } from '@/stores/audioStore';
import { useProfileStore } from '@/stores/profileStore';
import { useProgressStore } from '@/stores/progressStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useSpeakingProgressStore } from '@/stores/speakingProgressStore';

/** Clears browser storage and every store so tests never leak into each other. */
export function resetAppState() {
  localStorage.clear();
  useProfileStore.getState().reload();
  useProgressStore.getState().reload();
  useSpeakingProgressStore.getState().reload();
  useSettingsStore.getState().reload();
  useQuizSessionStore.getState().clear();
  useSpeakingSessionStore.getState().reset();
  useAudioStore.setState({ playingKey: null });
}

export const TEST_PROFILE: ProfileInput = {
  fullName: 'Lily Tran',
  ageGroup: '6-8',
  avatar: 'girl',
  canTypeWords: false,
};

/** Stores a valid profile like a returning learner would have. */
export function seedProfile(overrides: Partial<ProfileInput> = {}) {
  const profile = createProfile({ ...TEST_PROFILE, ...overrides });
  localStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(profile));
  useProfileStore.getState().reload();
  return profile;
}

/** Stores learning progress like a returning learner would have. */
export function seedProgress(progress: Partial<LearningProgress>) {
  localStorage.setItem(
    STORAGE_KEYS.progress,
    JSON.stringify({ ...createEmptyProgress(), ...progress }),
  );
  useProgressStore.getState().reload();
}

/** Stores settings like a returning learner would have (e.g. `{ course: 'zh' }`). */
export function seedSettings(settings: Partial<AppSettings>) {
  localStorage.setItem(
    STORAGE_KEYS.settings,
    JSON.stringify({ ...useSettingsStore.getState().settings, ...settings }),
  );
  useSettingsStore.getState().reload();
}

/** Like `App`: switching course remounts the screens. */
// oxlint-disable-next-line react/only-export-components -- test helper, no fast refresh
function CourseRouter({ router }: { router: DataRouter }) {
  const course = useSettingsStore((state) => state.settings.course);
  return <RouterProvider key={course} router={router} />;
}

/** Renders the real route tree at `path` with an in-memory history. */
export function renderApp(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  const utils = render(<CourseRouter router={router} />);
  return { router, ...utils };
}

export function readStoredProgress() {
  const raw = localStorage.getItem(STORAGE_KEYS.progress);
  return raw ? JSON.parse(raw) : null;
}
