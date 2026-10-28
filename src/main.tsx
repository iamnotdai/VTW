import '@fontsource-variable/baloo-2';
import '@fontsource-variable/inter';
import './styles/index.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import { content } from './data/content';
import { validateContent } from './data/validateContent';
import { runStorageMigrations } from './lib/storage';

runStorageMigrations();

if (import.meta.env.DEV) {
  // Surface content mistakes (broken ids, hotspots outside the picture…) while editing JSON.
  const errors = validateContent(content);
  if (errors.length > 0) {
    console.error(
      `[Village to World] ${errors.length} content problem(s):\n- ${errors.join('\n- ')}`,
    );
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
