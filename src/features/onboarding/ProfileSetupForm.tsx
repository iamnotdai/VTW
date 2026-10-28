import { ArrowRight } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { paths } from '@/app/paths';
import { Button } from '@/components/common/Button';
import {
  EMPTY_PROFILE_FORM,
  toProfileInput,
  validateProfileForm,
  type ProfileErrors,
  type ProfileField,
  type ProfileFormValues,
} from '@/lib/profile';
import { useProfileStore } from '@/stores/profileStore';
import type { AvatarChoice } from '@/types/models';
import { AgeGroupField, AvatarPicker, CanTypeField, NameField } from './components/ProfileFields';
import { FIELD_IDS } from './components/profileFieldIds';

const FIELD_ORDER: ProfileField[] = ['fullName', 'ageGroup', 'canTypeWords', 'avatar'];

/** First-time setup (spec §6): name, age group, typing ability, character — nothing else. */
export function ProfileSetupForm({
  onAvatarChange,
}: {
  /** Lets the page show the chosen character next to the form. */
  onAvatarChange?: (avatar: AvatarChoice | '') => void;
}) {
  const navigate = useNavigate();
  const saveProfile = useProfileStore((state) => state.saveProfile);
  const [values, setValues] = useState<ProfileFormValues>(EMPTY_PROFILE_FORM);
  const [errors, setErrors] = useState<ProfileErrors>({});
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (patch: Partial<ProfileFormValues>) => {
    const next = { ...values, ...patch };
    setValues(next);
    if (patch.avatar !== undefined) onAvatarChange?.(patch.avatar);
    // Re-validate live only after the first submit attempt.
    if (submitted) setErrors(validateProfileForm(next));
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    const nextErrors = validateProfileForm(values);
    setErrors(nextErrors);
    const input = toProfileInput(values);
    if (!input) {
      const firstInvalid = FIELD_ORDER.find((field) => nextErrors[field]);
      if (firstInvalid) document.getElementById(FIELD_IDS[firstInvalid])?.focus();
      return;
    }
    saveProfile(input);
    navigate(paths.home, { replace: true });
  };

  const fieldProps = { values, errors, onChange: handleChange };

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-6">
      <NameField {...fieldProps} />
      <AgeGroupField {...fieldProps} />
      <CanTypeField {...fieldProps} />
      <AvatarPicker {...fieldProps} />
      <Button
        type="submit"
        size="lg"
        fullWidth
        className="mt-2"
        rightIcon={<ArrowRight aria-hidden className="size-5" strokeWidth={2.5} />}
      >
        Start My Journey
      </Button>
    </form>
  );
}
