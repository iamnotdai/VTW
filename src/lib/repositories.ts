import type { AppSettings, LearningProgress, UserProfile } from '@/types/models';
import { sanitizeProfile } from './profile';
import { sanitizeProgress } from './progress';
import { sanitizeSettings } from './settings';
import { createRepository, STORAGE_KEYS, type Repository } from './storage';

export const profileRepository: Repository<UserProfile> = createRepository(
  STORAGE_KEYS.profile,
  sanitizeProfile,
);

export const progressRepository: Repository<LearningProgress> = createRepository(
  STORAGE_KEYS.progress,
  sanitizeProgress,
);

export const settingsRepository: Repository<AppSettings> = createRepository(
  STORAGE_KEYS.settings,
  sanitizeSettings,
);
