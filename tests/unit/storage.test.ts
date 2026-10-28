import { afterEach, describe, expect, it, vi } from 'vitest';
import { profileRepository, progressRepository } from '@/lib/repositories';
import { createProfile } from '@/lib/profile';
import { createEmptyProgress } from '@/lib/progress';
import { isPersistentStorage, resetStorageBackendForTests, STORAGE_KEYS } from '@/lib/storage';

afterEach(() => {
  vi.restoreAllMocks();
  resetStorageBackendForTests();
});

const profile = createProfile({
  fullName: 'Ben',
  ageGroup: '9-12',
  avatar: 'boy',
  canTypeWords: true,
});

describe('storage keys (spec §11.1)', () => {
  it('uses versioned keys', () => {
    expect(STORAGE_KEYS).toEqual({
      profile: 'vtw:v1:profile',
      progress: 'vtw:v1:progress',
      settings: 'vtw:v1:settings',
    });
  });
});

describe('repositories', () => {
  it('round-trips a profile', () => {
    expect(profileRepository.save(profile)).toBe(true);
    expect(profileRepository.load()).toEqual(profile);
    profileRepository.clear();
    expect(profileRepository.load()).toBeNull();
  });

  it('returns null for corrupted JSON instead of throwing', () => {
    localStorage.setItem(STORAGE_KEYS.progress, '{not json');
    expect(() => progressRepository.load()).not.toThrow();
    expect(progressRepository.load()).toBeNull();
  });

  it('treats an invalid stored profile as "no profile"', () => {
    localStorage.setItem(STORAGE_KEYS.profile, JSON.stringify({ ...profile, ageGroup: 'adult' }));
    expect(profileRepository.load()).toBeNull();
    localStorage.setItem(STORAGE_KEYS.profile, JSON.stringify({ ...profile, fullName: '   ' }));
    expect(profileRepository.load()).toBeNull();
  });

  it('keeps working in memory when the browser blocks storage', () => {
    resetStorageBackendForTests();
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError');
    });
    expect(isPersistentStorage()).toBe(false);
    const progress = createEmptyProgress();
    expect(() => progressRepository.save(progress)).not.toThrow();
    expect(progressRepository.load()).toEqual(progress);
  });
});
