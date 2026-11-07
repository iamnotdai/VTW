import type {
  AppSettings,
  CourseId,
  LearningProgress,
  SpeakingProgress,
  UserProfile,
} from '@/types/models';
import { sanitizeProfile } from './profile';
import { sanitizeProgress } from './progress';
import { sanitizeSettings } from './settings';
import { sanitizeSpeakingProgress } from './speakingProgress';
import { createRepository, STORAGE_KEYS, type Repository, type StorageKey } from './storage';

export const profileRepository: Repository<UserProfile> = createRepository(
  STORAGE_KEYS.profile,
  sanitizeProfile,
);

/** Each course keeps its own progress: word ids are shared between courses. */
export const PROGRESS_KEYS: Readonly<Record<CourseId, StorageKey>> = {
  en: STORAGE_KEYS.progress,
  zh: STORAGE_KEYS.progressZh,
};

const progressRepositories = Object.fromEntries(
  Object.entries(PROGRESS_KEYS).map(([course, key]) => [
    course,
    createRepository(key, sanitizeProgress),
  ]),
) as Record<CourseId, Repository<LearningProgress>>;

export function getProgressRepository(course: CourseId): Repository<LearningProgress> {
  return progressRepositories[course];
}

/** Pronunciation scores, per course like the progress (spec §24.1). */
export const SPEAKING_KEYS: Readonly<Record<CourseId, StorageKey>> = {
  en: STORAGE_KEYS.speaking,
  zh: STORAGE_KEYS.speakingZh,
};

const speakingRepositories = Object.fromEntries(
  Object.entries(SPEAKING_KEYS).map(([course, key]) => [
    course,
    createRepository(key, sanitizeSpeakingProgress),
  ]),
) as Record<CourseId, Repository<SpeakingProgress>>;

export function getSpeakingRepository(course: CourseId): Repository<SpeakingProgress> {
  return speakingRepositories[course];
}

export const settingsRepository: Repository<AppSettings> = createRepository(
  STORAGE_KEYS.settings,
  sanitizeSettings,
);
