/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Public base path, e.g. "/" or "/VTW/". Read by vite.config.ts. */
  readonly VITE_BASE_PATH?: string;
  /** "browser" (default) or "hash" — see .env.example. */
  readonly VITE_ROUTER_MODE?: 'browser' | 'hash';
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
