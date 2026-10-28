/**
 * The ONLY module that touches browser storage (spec §11.1).
 *
 * - Every read/write is wrapped in try/catch: blocked storage, quota errors or corrupted JSON
 *   never crash the app; callers get `null` and fall back to safe defaults.
 * - When localStorage is unavailable (some private modes, disabled cookies) we keep data in
 *   memory for the current session and report `isPersistentStorage() === false`.
 * - Keys carry the schema version. When the schema changes, bump the version and add a migration.
 */

export const STORAGE_VERSION = 1;

export const STORAGE_KEYS = {
  profile: `vtw:v${STORAGE_VERSION}:profile`,
  progress: `vtw:v${STORAGE_VERSION}:progress`,
  settings: `vtw:v${STORAGE_VERSION}:settings`,
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function createMemoryStore(): KeyValueStore {
  const data = new Map<string, string>();
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
    removeItem: (key) => void data.delete(key),
  };
}

function detectLocalStorage(): KeyValueStore | null {
  try {
    const storage = globalThis.localStorage;
    if (!storage) return null;
    const probe = 'vtw:probe';
    storage.setItem(probe, '1');
    storage.removeItem(probe);
    return storage;
  } catch {
    return null;
  }
}

let backend: KeyValueStore | null = null;
let persistent = false;

function getBackend(): KeyValueStore {
  if (!backend) {
    const local = detectLocalStorage();
    persistent = local !== null;
    backend = local ?? createMemoryStore();
  }
  return backend;
}

/** False when progress only lives in memory and will be lost on reload. */
export function isPersistentStorage(): boolean {
  getBackend();
  return persistent;
}

export function readJson<T>(key: string, sanitize: (raw: unknown) => T | null): T | null {
  try {
    const raw = getBackend().getItem(key);
    if (raw === null) return null;
    return sanitize(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function writeJson(key: string, value: unknown): boolean {
  try {
    getBackend().setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function removeKey(key: string): void {
  try {
    getBackend().removeItem(key);
  } catch {
    // Ignore: nothing else we can do.
  }
}

/**
 * Repository abstraction (spec §11.3): UI and stores depend on this interface, so a future
 * account-sync implementation can replace localStorage without rewriting the UI.
 */
export interface Repository<T> {
  /** Returns `null` when nothing valid is stored. */
  load(): T | null;
  /** Returns `false` when the value could not be persisted. */
  save(value: T): boolean;
  clear(): void;
}

export function createRepository<T>(
  key: StorageKey,
  sanitize: (raw: unknown) => T | null,
): Repository<T> {
  return {
    load: () => readJson(key, sanitize),
    save: (value) => writeJson(key, value),
    clear: () => removeKey(key),
  };
}

interface Migration {
  /** Schema version the migration upgrades FROM. */
  from: number;
  run(storage: {
    read: (key: string) => unknown;
    write: typeof writeJson;
    remove: typeof removeKey;
  }): void;
}

/**
 * Add an entry when STORAGE_VERSION is bumped, e.g. `{ from: 1, run: ({ read, write, remove }) => {
 * write('vtw:v2:progress', convert(read('vtw:v1:progress'))); remove('vtw:v1:progress'); } }`.
 */
const MIGRATIONS: Migration[] = [];

/** Runs pending migrations once at startup. Never throws. */
export function runStorageMigrations(): void {
  const read = (key: string) => readJson(key, (raw) => raw);
  for (const migration of MIGRATIONS) {
    if (migration.from >= STORAGE_VERSION) continue;
    try {
      migration.run({ read, write: writeJson, remove: removeKey });
    } catch {
      // A failed migration must not block the app; defaults will be used instead.
    }
  }
}

/** Test helper: forget the detected backend so the next call re-detects it. */
export function resetStorageBackendForTests(): void {
  backend = null;
  persistent = false;
}
