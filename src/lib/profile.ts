import { AGE_GROUP_OPTIONS, PROFILE_NAME_MAX_LENGTH } from '@/config/app';
import type { AgeGroup, AvatarChoice, UserProfile } from '@/types/models';
import { characterCount, cleanSpaces } from './text';

const AGE_GROUPS: readonly AgeGroup[] = AGE_GROUP_OPTIONS.map((option) => option.value);
const AVATARS: readonly AvatarChoice[] = ['boy', 'girl'];

export function isAgeGroup(value: unknown): value is AgeGroup {
  return typeof value === 'string' && (AGE_GROUPS as readonly string[]).includes(value);
}

export function isAvatarChoice(value: unknown): value is AvatarChoice {
  return typeof value === 'string' && (AVATARS as readonly string[]).includes(value);
}

/** Raw form values — every field may still be empty while the learner fills the form. */
export interface ProfileFormValues {
  fullName: string;
  ageGroup: AgeGroup | '';
  avatar: AvatarChoice | '';
  canTypeWords: boolean | null;
}

export interface ProfileInput {
  fullName: string;
  ageGroup: AgeGroup;
  avatar: AvatarChoice;
  canTypeWords: boolean;
}

export type ProfileField = keyof ProfileFormValues;
export type ProfileErrors = Partial<Record<ProfileField, string>>;

export const EMPTY_PROFILE_FORM: ProfileFormValues = {
  fullName: '',
  ageGroup: '',
  avatar: '',
  canTypeWords: null,
};

/** Spec §6: name required, 1–60 characters after trimming; every choice required. */
export function validateProfileForm(values: ProfileFormValues): ProfileErrors {
  const errors: ProfileErrors = {};
  const name = cleanSpaces(values.fullName);
  if (characterCount(name) === 0) errors.fullName = 'Please enter your name.';
  else if (characterCount(name) > PROFILE_NAME_MAX_LENGTH)
    errors.fullName = `Your name can be up to ${PROFILE_NAME_MAX_LENGTH} characters.`;
  if (!isAgeGroup(values.ageGroup)) errors.ageGroup = 'Please choose your age group.';
  if (values.canTypeWords === null) errors.canTypeWords = 'Please choose one answer.';
  if (!isAvatarChoice(values.avatar)) errors.avatar = 'Please choose your character.';
  return errors;
}

/** Returns a clean `ProfileInput`, or `null` when the form is not valid yet. */
export function toProfileInput(values: ProfileFormValues): ProfileInput | null {
  if (Object.keys(validateProfileForm(values)).length > 0) return null;
  return {
    fullName: cleanSpaces(values.fullName),
    ageGroup: values.ageGroup as AgeGroup,
    avatar: values.avatar as AvatarChoice,
    canTypeWords: values.canTypeWords as boolean,
  };
}

export function profileToFormValues(profile: UserProfile): ProfileFormValues {
  return {
    fullName: profile.fullName,
    ageGroup: profile.ageGroup,
    avatar: profile.avatar,
    canTypeWords: profile.canTypeWords,
  };
}

export function createProfile(
  input: ProfileInput,
  now: Date = new Date(),
  existing?: UserProfile | null,
): UserProfile {
  const timestamp = now.toISOString();
  return {
    id: 'local-user',
    fullName: cleanSpaces(input.fullName),
    ageGroup: input.ageGroup,
    avatar: input.avatar,
    canTypeWords: input.canTypeWords,
    createdAt: existing?.createdAt ?? timestamp,
    updatedAt: timestamp,
  };
}

/** Validates a profile read from storage; anything invalid means "no profile" → Setup again. */
export function sanitizeProfile(raw: unknown): UserProfile | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const value = raw as Record<string, unknown>;
  const fullName = typeof value.fullName === 'string' ? cleanSpaces(value.fullName) : '';
  if (characterCount(fullName) === 0 || characterCount(fullName) > PROFILE_NAME_MAX_LENGTH)
    return null;
  if (!isAgeGroup(value.ageGroup) || !isAvatarChoice(value.avatar)) return null;
  if (typeof value.canTypeWords !== 'boolean') return null;
  const now = new Date().toISOString();
  return {
    id: 'local-user',
    fullName,
    ageGroup: value.ageGroup,
    avatar: value.avatar,
    canTypeWords: value.canTypeWords,
    createdAt: typeof value.createdAt === 'string' ? value.createdAt : now,
    updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : now,
  };
}

export function getAgeGroupLabel(ageGroup: AgeGroup): string {
  return AGE_GROUP_OPTIONS.find((option) => option.value === ageGroup)?.label ?? ageGroup;
}
