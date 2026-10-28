import { create } from 'zustand';
import { createProfile, type ProfileInput } from '@/lib/profile';
import { profileRepository } from '@/lib/repositories';
import type { UserProfile } from '@/types/models';

interface ProfileState {
  /** `null` until the learner finishes Profile Setup. */
  profile: UserProfile | null;
  /** Creates or updates the local profile. Returns `false` when it could not be persisted. */
  saveProfile: (input: ProfileInput) => boolean;
  /** Re-reads storage (e.g. another tab changed it). */
  reload: () => void;
}

export const useProfileStore = create<ProfileState>()((set, get) => ({
  profile: profileRepository.load(),
  saveProfile: (input) => {
    const profile = createProfile(input, new Date(), get().profile);
    const persisted = profileRepository.save(profile);
    set({ profile });
    return persisted;
  },
  reload: () => set({ profile: profileRepository.load() }),
}));
