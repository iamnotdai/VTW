import { COURSES, type CourseConfig } from '@/config/courses';
import type { CourseId } from '@/types/models';

/**
 * The course being learned right now. It follows Settings › Course (the settings store calls
 * `setActiveCourse`), so plain functions — content lookups, `t()`, speech — can read it without a
 * hook. Switching course remounts the screens (see `App`), so nothing renders stale copy.
 */
let activeCourse: CourseId = 'en';

export function getActiveCourse(): CourseId {
  return activeCourse;
}

export function getCourseConfig(course: CourseId = activeCourse): CourseConfig {
  return COURSES[course];
}

export function setActiveCourse(course: CourseId): void {
  activeCourse = course;
  // Screen readers and fonts pick the right language for the whole UI.
  if (typeof document !== 'undefined') document.documentElement.lang = COURSES[course].lang;
}
