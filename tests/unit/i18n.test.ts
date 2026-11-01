import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { AGE_GROUP_OPTIONS, PROFILE_NAME_MAX_LENGTH, SCENE_GROUPS } from '@/config/app';
import { AVATAR_LABELS } from '@/config/assets';
import { NAV_ITEMS } from '@/components/layout/navItems';
import { zh, zhAreas } from '@/i18n/zh';
import { EMPTY_PROFILE_FORM, validateProfileForm } from '@/lib/profile';

/**
 * Every UI string wrapped in `t('…')` has a Chinese translation (src/i18n/zh/), with the same
 * `{placeholders}`. Run after adding copy to a component.
 */
const SRC = resolve(__dirname, '../../src');

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.tsx?$/.test(name) ? [path] : [];
  });
}

/** English keys passed to `t()` as string literals. */
function literalKeys(): string[] {
  const keys = new Set<string>();
  const call = /(?<![\w.$])t\(\s*(['"])((?:(?!\1)[^\\]|\\.)*)\1/g;
  for (const file of sourceFiles(SRC)) {
    // Comments may show examples like t('Start Quiz'): skip them.
    const code = readFileSync(file, 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/^\s*\/\/.*$/gm, '');
    for (const match of code.matchAll(call)) keys.add(match[2].replace(/\\(.)/g, '$1'));
  }
  return [...keys];
}

/** Copy kept in English constants and translated where it is rendered: `t(item.label)`. */
const constantKeys = [
  ...NAV_ITEMS.map((item) => item.label),
  ...SCENE_GROUPS.map((group) => group.title),
  ...AGE_GROUP_OPTIONS.map((option) => option.label),
  ...Object.values(AVATAR_LABELS),
  // Profile form errors, translated where they are shown.
  ...Object.values(validateProfileForm(EMPTY_PROFILE_FORM)),
  validateProfileForm({
    ...EMPTY_PROFILE_FORM,
    fullName: 'x'.repeat(PROFILE_NAME_MAX_LENGTH + 1),
  }).fullName,
].filter((key): key is string => !!key);

const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

describe('Chinese UI copy', () => {
  const keys = literalKeys();

  it('finds the wrapped copy', () => {
    expect(keys.length).toBeGreaterThan(100);
  });

  it('translates every t() string', () => {
    expect([...keys, ...constantKeys].filter((key) => !(key in zh))).toEqual([]);
  });

  it('keeps the placeholders of the English text', () => {
    const broken = Object.entries(zh).filter(
      ([key, value]) => placeholders(key).join() !== placeholders(value).join(),
    );
    expect(broken).toEqual([]);
  });

  it('translates a key the same way in every area file', () => {
    const seen = new Map<string, string>();
    const conflicts: string[] = [];
    for (const area of Object.values(zhAreas)) {
      for (const [key, value] of Object.entries(area)) {
        if (seen.has(key) && seen.get(key) !== value) conflicts.push(key);
        seen.set(key, value);
      }
    }
    expect(conflicts).toEqual([]);
  });

  it('has no leftover entries nobody uses', () => {
    const used = new Set([...keys, ...constantKeys]);
    expect(Object.keys(zh).filter((key) => !used.has(key))).toEqual([]);
  });
});
