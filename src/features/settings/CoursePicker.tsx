import { flushSync } from 'react-dom';
import { COURSE_IDS, COURSES } from '@/config/courses';
import { t } from '@/i18n';
import { cn } from '@/lib/cn';
import { useSettingsStore } from '@/stores/settingsStore';
import type { CourseId } from '@/types/models';

const HINT_ID = 'course-picker-hint';
const optionId = (course: CourseId) => `course-option-${course}`;

/**
 * @extension English or Chinese, at the top of Profile Setup and in Settings. Applied at once, not
 * on Save: the whole app switches to that course's content and UI language. The course names are
 * the same in every language ("中文" + "Tiếng Trung").
 */
export function CoursePicker({ legend = t('Course') }: { legend?: string }) {
  const course = useSettingsStore((state) => state.settings.course);
  const updateSettings = useSettingsStore((state) => state.updateSettings);

  const choose = (next: CourseId) => {
    // Switching course remounts every screen: render it now, then give the focus back to the picker.
    flushSync(() => updateSettings({ course: next }));
    document.getElementById(optionId(next))?.focus();
  };

  return (
    <fieldset aria-describedby={HINT_ID}>
      <legend className="mb-2 block text-base font-bold text-navy-800">{legend}</legend>
      <div className="grid grid-cols-2 gap-3">
        {COURSE_IDS.map((id) => {
          const option = COURSES[id];
          const checked = id === course;
          return (
            <label
              key={id}
              className={cn(
                'flex min-h-18 cursor-pointer flex-col items-center justify-center rounded-xl border-[1.5px] px-3 py-2 text-center transition has-focus-visible:ring-4 has-focus-visible:ring-brand-200',
                checked
                  ? 'border-brand-500 bg-brand-500 text-white shadow-[0_6px_14px_-8px_rgb(11_127_254/0.9)]'
                  : 'border-brand-100 bg-white text-navy-700 hover:border-brand-300',
              )}
            >
              <input
                id={optionId(id)}
                type="radio"
                name="course"
                value={id}
                checked={checked}
                onChange={() => choose(id)}
                className="sr-only"
              />
              <span lang={option.lang} className="text-xl leading-tight font-extrabold">
                {option.label}
              </span>
              <span
                lang="vi"
                className={cn('text-sm font-semibold', checked ? 'text-white/85' : 'text-navy-400')}
              >
                {option.labelVi}
              </span>
            </label>
          );
        })}
      </div>
      <p id={HINT_ID} className="mt-2 text-sm font-medium text-navy-500">
        {t('Each course keeps its own progress.')}
      </p>
    </fieldset>
  );
}
