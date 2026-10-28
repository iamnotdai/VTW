import type { ProfileField } from '@/lib/profile';

/** DOM id of the first focusable control of each field — used to focus the first error. */
export const FIELD_IDS: Record<ProfileField, string> = {
  fullName: 'profile-full-name',
  ageGroup: 'profile-age-group',
  canTypeWords: 'profile-can-type',
  avatar: 'profile-avatar',
};
