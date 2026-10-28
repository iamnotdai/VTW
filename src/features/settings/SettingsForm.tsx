import { CircleCheck, TriangleAlert } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Button } from '@/components/common/Button';
import {
  AgeGroupSelect,
  AvatarChanger,
  CanTypeField,
  NameField,
} from '@/features/onboarding/components/ProfileFields';
import { FIELD_IDS } from '@/features/onboarding/components/profileFieldIds';
import {
  profileToFormValues,
  toProfileInput,
  validateProfileForm,
  type ProfileErrors,
  type ProfileField,
  type ProfileFormValues,
} from '@/lib/profile';
import { isPersistentStorage } from '@/lib/storage';
import { useProfileStore } from '@/stores/profileStore';
import type { UserProfile } from '@/types/models';

const FIELD_ORDER: ProfileField[] = ['avatar', 'fullName', 'ageGroup', 'canTypeWords'];

/** Screen 16 — edit picture, name, age group and typing ability (spec §6). */
export function SettingsForm({ profile }: { profile: UserProfile }) {
  const saveProfile = useProfileStore((state) => state.saveProfile);
  const [values, setValues] = useState<ProfileFormValues>(() => profileToFormValues(profile));
  const [errors, setErrors] = useState<ProfileErrors>({});
  const [pickerOpen, setPickerOpen] = useState(false);
  const [status, setStatus] = useState<'idle' | 'saved' | 'not-persisted'>('idle');

  const handleChange = (patch: Partial<ProfileFormValues>) => {
    const next = { ...values, ...patch };
    setValues(next);
    setStatus('idle');
    if (Object.keys(errors).length > 0) setErrors(validateProfileForm(next));
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const nextErrors = validateProfileForm(values);
    setErrors(nextErrors);
    const input = toProfileInput(values);
    if (!input) {
      const firstInvalid = FIELD_ORDER.find((field) => nextErrors[field]);
      if (firstInvalid) document.getElementById(FIELD_IDS[firstInvalid])?.focus();
      return;
    }
    const saved = saveProfile(input);
    // Show the cleaned-up name (trimmed spaces).
    setValues((current) => ({ ...current, fullName: input.fullName }));
    setPickerOpen(false);
    setStatus(saved ? 'saved' : 'not-persisted');
  };

  const fieldProps = { values, errors, onChange: handleChange };

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-6">
      <AvatarChanger
        {...fieldProps}
        open={pickerOpen}
        onToggle={() => setPickerOpen((open) => !open)}
      />
      <NameField {...fieldProps} />
      <AgeGroupSelect {...fieldProps} />
      <CanTypeField {...fieldProps} />

      <div className="mt-3 flex flex-col gap-3">
        <Button type="submit" size="lg" fullWidth>
          Save Changes
        </Button>
        <p role="status" className="min-h-6 text-center text-sm font-semibold">
          {status === 'saved' && (
            <span className="inline-flex items-center gap-1.5 text-leaf-600">
              <CircleCheck aria-hidden className="size-4" /> Your changes are saved.
            </span>
          )}
          {status === 'not-persisted' && (
            <span className="text-sun-700">
              Saved for now, but this browser could not store it.
            </span>
          )}
        </p>
        {!isPersistentStorage() && (
          <p className="flex gap-2 rounded-xl bg-sun-50 p-4 text-sm font-semibold text-sun-700">
            <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
            This browser is blocking storage, so your progress will be lost when you close the app.
          </p>
        )}
        <p className="text-center text-xs font-medium text-navy-400">
          Your profile and progress are saved in this browser on this device only.
        </p>
      </div>
    </form>
  );
}
