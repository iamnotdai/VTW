/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    // Deploying under a sub-path (e.g. GitHub Pages "/VTW/")? Set VITE_BASE_PATH.
    // All asset URLs from JSON go through `assetUrl()` so they follow this base.
    base: env.VITE_BASE_PATH || '/',
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    test: {
      environment: 'jsdom',
      setupFiles: ['./tests/setup.ts'],
      include: ['tests/unit/**/*.test.{ts,tsx}', 'tests/components/**/*.test.{ts,tsx}'],
      css: false,
      restoreMocks: true,
    },
  };
});
