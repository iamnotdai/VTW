import { Check, ChevronDown } from 'lucide-react';
import type { ReactNode } from 'react';
import { Avatar } from '@/components/common/Avatar';
import { AGE_GROUP_OPTIONS, PROFILE_NAME_MAX_LENGTH } from '@/config/app';
import { AVATAR_IMAGES, AVATAR_LABELS } from '@/config/assets';
import { assetUrl } from '@/lib/assets';
import { cn } from '@/lib/cn';
import type { ProfileErrors, ProfileFormValues } from '@/lib/profile';
import type { AgeGroup, AvatarChoice } from '@/types/models';
import { FIELD_IDS } from './profileFieldIds';

interface FieldProps {
  values: ProfileFormValues;
  errors: ProfileErrors;
  onChange: (patch: Partial<ProfileFormValues>) => void;
}

const LABEL = 'mb-2 block text-base font-bold text-navy-800';

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1.5 text-sm font-semibold text-coral-600">
      {message}
    </p>
  );
}

function Legend({ children }: { children: ReactNode }) {
  return <legend className={LABEL}>{children}</legend>;
}

export function NameField({ values, errors, onChange }: FieldProps) {
  const errorId = `${FIELD_IDS.fullName}-error`;
  return (
    <div>
      <label htmlFor={FIELD_IDS.fullName} className={LABEL}>
        Full Name
      </label>
      <input
        id={FIELD_IDS.fullName}
        name="fullName"
        type="text"
        autoComplete="name"
        maxLength={PROFILE_NAME_MAX_LENGTH}
        placeholder="Type your name"
        value={values.fullName}
        onChange={(event) => onChange({ fullName: event.target.value })}
        aria-invalid={errors.fullName ? true : undefined}
        aria-describedby={errors.fullName ? errorId : undefined}
        className={cn(
          'h-13 w-full rounded-xl border bg-white px-4 text-[1.0625rem] font-medium text-navy-900 transition outline-none placeholder:text-navy-300 focus:border-brand-500 focus:ring-4 focus:ring-brand-100',
          errors.fullName ? 'border-coral-400' : 'border-navy-200',
        )}
      />
      <FieldError id={errorId} message={errors.fullName} />
    </div>
  );
}

/** Age Group as a row of chips (Profile Setup). */
export function AgeGroupField({ values, errors, onChange }: FieldProps) {
  const errorId = `${FIELD_IDS.ageGroup}-error`;
  return (
    <fieldset aria-describedby={errors.ageGroup ? errorId : undefined}>
      <Legend>Age Group</Legend>
      <div className="grid grid-cols-5 gap-1.5 sm:flex sm:gap-2">
        {AGE_GROUP_OPTIONS.map((option, index) => {
          const checked = values.ageGroup === option.value;
          return (
            <label
              key={option.value}
              className={cn(
                'relative flex h-12 min-w-0 cursor-pointer items-center justify-center rounded-lg border-[1.5px] px-1 text-sm font-semibold whitespace-nowrap transition has-focus-visible:ring-4 has-focus-visible:ring-brand-200 sm:min-w-16 sm:flex-1 sm:px-3 sm:text-base',
                checked
                  ? 'border-brand-500 bg-brand-500 text-white shadow-[0_6px_14px_-8px_rgb(11_127_254/0.9)]'
                  : 'border-brand-100 bg-white text-navy-500 hover:border-brand-300',
              )}
            >
              <input
                id={index === 0 ? FIELD_IDS.ageGroup : undefined}
                type="radio"
                name="ageGroup"
                value={option.value}
                checked={checked}
                onChange={() => onChange({ ageGroup: option.value })}
                className="sr-only"
              />
              {option.label}
            </label>
          );
        })}
      </div>
      <FieldError id={errorId} message={errors.ageGroup} />
    </fieldset>
  );
}

/** Age Group as a drop-down (Settings). */
export function AgeGroupSelect({ values, errors, onChange }: FieldProps) {
  const errorId = `${FIELD_IDS.ageGroup}-error`;
  return (
    <div>
      <label htmlFor={FIELD_IDS.ageGroup} className={LABEL}>
        Age Group
      </label>
      <div className="relative">
        <select
          id={FIELD_IDS.ageGroup}
          value={values.ageGroup}
          onChange={(event) => onChange({ ageGroup: event.target.value as AgeGroup | '' })}
          aria-invalid={errors.ageGroup ? true : undefined}
          aria-describedby={errors.ageGroup ? errorId : undefined}
          className={cn(
            'h-13 w-full cursor-pointer appearance-none rounded-xl border bg-white pr-11 pl-4 text-[1.0625rem] font-medium text-navy-900 transition outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100',
            errors.ageGroup ? 'border-coral-400' : 'border-navy-200',
          )}
        >
          <option value="" disabled>
            Choose your age group
          </option>
          {AGE_GROUP_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label} years
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden
          className="pointer-events-none absolute top-1/2 right-4 size-5 -translate-y-1/2 text-navy-500"
        />
      </div>
      <FieldError id={errorId} message={errors.ageGroup} />
    </div>
  );
}

const TYPING_OPTIONS = [
  { value: true, title: 'Yes, I can type words' },
  { value: false, title: 'Not yet, I prefer choosing answers' },
] as const;

export function CanTypeField({ values, errors, onChange }: FieldProps) {
  const errorId = `${FIELD_IDS.canTypeWords}-error`;
  return (
    <fieldset aria-describedby={errors.canTypeWords ? errorId : undefined}>
      <Legend>Can you type words?</Legend>
      <div className="flex flex-col gap-3">
        {TYPING_OPTIONS.map(({ value, title }, index) => {
          const checked = values.canTypeWords === value;
          return (
            <label
              key={String(value)}
              className="group flex w-fit cursor-pointer items-center gap-3 rounded-lg py-0.5 pr-2 text-[1.0625rem] font-medium text-navy-600"
            >
              <input
                id={index === 0 ? FIELD_IDS.canTypeWords : undefined}
                type="radio"
                name="canTypeWords"
                value={String(value)}
                checked={checked}
                onChange={() => onChange({ canTypeWords: value })}
                className="peer sr-only"
              />
              <span
                aria-hidden
                className={cn(
                  'flex size-5.5 shrink-0 items-center justify-center rounded-full border-2 transition peer-focus-visible:ring-4 peer-focus-visible:ring-brand-200',
                  checked
                    ? 'border-brand-500 bg-brand-500'
                    : 'border-navy-200 bg-white group-hover:border-brand-300',
                )}
              >
                {checked && <span className="size-2 rounded-full bg-white" />}
              </span>
              {title}
            </label>
          );
        })}
      </div>
      <FieldError id={errorId} message={errors.canTypeWords} />
    </fieldset>
  );
}

/** Girl first, as on the design board. */
const AVATAR_CHOICES: AvatarChoice[] = ['girl', 'boy'];

const TILE_BACKGROUNDS: Record<AvatarChoice, string> = {
  girl: 'bg-linear-to-b from-[#d9ecff] to-[#a9d2fb]',
  boy: 'bg-linear-to-b from-[#fff3dc] to-[#f8dcae]',
};

/**
 * Boy / girl picture tiles (spec §6). The square tile is a CSS crop of the full character artwork,
 * the source picture is never changed. There is deliberately NO upload control (spec §2.1).
 */
export function AvatarPicker({
  values,
  errors,
  onChange,
  legend = 'Profile Picture',
}: FieldProps & { legend?: string }) {
  const errorId = `${FIELD_IDS.avatar}-error`;
  return (
    <fieldset aria-describedby={errors.avatar ? errorId : undefined}>
      <Legend>{legend}</Legend>
      <div className="flex gap-3">
        {AVATAR_CHOICES.map((choice, index) => {
          const checked = values.avatar === choice;
          return (
            <label
              key={choice}
              className={cn(
                'group relative block size-24 cursor-pointer overflow-hidden rounded-xl transition has-focus-visible:ring-4 has-focus-visible:ring-brand-200 sm:size-26',
                TILE_BACKGROUNDS[choice],
                checked
                  ? 'ring-[3px] ring-brand-500'
                  : 'ring-1 ring-navy-100 hover:ring-2 hover:ring-brand-300',
              )}
            >
              <input
                id={index === 0 ? FIELD_IDS.avatar : undefined}
                type="radio"
                name="avatar"
                value={choice}
                checked={checked}
                onChange={() => onChange({ avatar: choice })}
                className="sr-only"
              />
              <span className="sr-only">{AVATAR_LABELS[choice]}</span>
              <img
                src={assetUrl(AVATAR_IMAGES[choice])}
                alt=""
                className="h-full w-full object-cover object-top transition duration-200 group-hover:scale-105"
                draggable={false}
              />
              {checked && (
                <span className="absolute right-1.5 bottom-1.5 flex size-6 items-center justify-center rounded-full bg-brand-500 text-white shadow-md">
                  <Check aria-hidden className="size-4" strokeWidth={3} />
                </span>
              )}
            </label>
          );
        })}
      </div>
      <FieldError id={errorId} message={errors.avatar} />
    </fieldset>
  );
}

/**
 * Settings: the current picture in a circle with "Change Photo", which opens the boy / girl
 * choice. Changing the picture never means uploading one (spec §2.1).
 */
export function AvatarChanger({
  values,
  errors,
  onChange,
  open,
  onToggle,
}: FieldProps & { open: boolean; onToggle: () => void }) {
  return (
    <div>
      <div className="flex items-center gap-5">
        {values.avatar ? (
          <Avatar avatar={values.avatar} size={104} ring="brand" alt="Your picture" />
        ) : (
          <span className="size-26 rounded-full bg-navy-100" />
        )}
        <button
          type="button"
          aria-expanded={open}
          aria-controls="avatar-choices"
          onClick={onToggle}
          className="inline-flex h-13 items-center rounded-full bg-brand-50 px-7 text-[1.0625rem] font-bold text-brand-600 transition hover:bg-brand-100"
        >
          Change Photo
        </button>
      </div>
      {open && (
        <div id="avatar-choices" className="mt-4 animate-fade-in">
          <AvatarPicker
            values={values}
            errors={errors}
            onChange={onChange}
            legend="Choose your picture"
          />
        </div>
      )}
    </div>
  );
}
