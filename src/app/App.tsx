import { useState } from 'react';
import { RouterProvider } from 'react-router/dom';
import { useSettingsStore } from '@/stores/settingsStore';
import { AppProviders } from './providers';
import { createAppRouter } from './router';

export function App() {
  const [router] = useState(createAppRouter);
  // Content and UI copy are read from the active course: switching course remounts every screen.
  const course = useSettingsStore((state) => state.settings.course);
  return (
    <AppProviders>
      <RouterProvider key={course} router={router} />
    </AppProviders>
  );
}
