import { COURSES, type CourseConfig } from '@/config/courses';
import { useSettingsStore } from '@/stores/settingsStore';

/** The course being learned (Settings › Course), e.g. for `lang` attributes on course text. */
export function useCourse(): CourseConfig {
  return COURSES[useSettingsStore((state) => state.settings.course)];
}
