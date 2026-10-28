import { describe, expect, it } from 'vitest';
import { EMPTY_PROFILE_FORM, toProfileInput, validateProfileForm } from '@/lib/profile';

const valid = {
  fullName: 'Lily',
  ageGroup: '6-8' as const,
  avatar: 'girl' as const,
  canTypeWords: false,
};

describe('validateProfileForm (spec §6)', () => {
  it('requires every field', () => {
    expect(Object.keys(validateProfileForm(EMPTY_PROFILE_FORM)).sort()).toEqual([
      'ageGroup',
      'avatar',
      'canTypeWords',
      'fullName',
    ]);
  });

  it('accepts a complete form', () => {
    expect(validateProfileForm(valid)).toEqual({});
  });

  it('checks the name length after trimming (1–60)', () => {
    expect(validateProfileForm({ ...valid, fullName: '     ' }).fullName).toBeDefined();
    expect(validateProfileForm({ ...valid, fullName: 'a'.repeat(60) }).fullName).toBeUndefined();
    expect(
      validateProfileForm({ ...valid, fullName: `  ${'a'.repeat(60)}  ` }).fullName,
    ).toBeUndefined();
    expect(validateProfileForm({ ...valid, fullName: 'a'.repeat(61) }).fullName).toBeDefined();
  });

  it('counts Vietnamese names by characters', () => {
    expect(validateProfileForm({ ...valid, fullName: 'Nguyễn Thị Thu Hương' })).toEqual({});
  });

  it('cleans the name when building the profile input', () => {
    expect(toProfileInput({ ...valid, fullName: '  Lily   Tran ' })?.fullName).toBe('Lily Tran');
    expect(toProfileInput(EMPTY_PROFILE_FORM)).toBeNull();
  });
});
