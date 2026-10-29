import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS } from '@/config/app';
import { sanitizeSettings } from '@/lib/settings';

describe('sanitizeSettings voiceStyle', () => {
  it('keeps boy and girl, drops anything else', () => {
    expect(sanitizeSettings({ voiceStyle: 'boy' })?.voiceStyle).toBe('boy');
    expect(sanitizeSettings({ voiceStyle: 'girl' })?.voiceStyle).toBe('girl');
    expect(sanitizeSettings({ voiceStyle: 'man' })?.voiceStyle).toBeNull();
    expect(sanitizeSettings({})?.voiceStyle).toBeNull();
  });
});

describe('sanitizeSettings voiceURI', () => {
  it('keeps a saved voice', () => {
    expect(sanitizeSettings({ voiceURI: 'Google US English' })?.voiceURI).toBe('Google US English');
  });

  it('falls back to automatic for missing or invalid values', () => {
    expect(sanitizeSettings({})?.voiceURI).toBe(DEFAULT_SETTINGS.voiceURI);
    expect(sanitizeSettings({ voiceURI: '' })?.voiceURI).toBeNull();
    expect(sanitizeSettings({ voiceURI: 42 })?.voiceURI).toBeNull();
  });
});
