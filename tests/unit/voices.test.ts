import { describe, expect, it } from 'vitest';
import { isChildVoice, voiceStyleOf } from '@/lib/voices';

describe('voiceStyleOf', () => {
  it('maps female-sounding voice names to girl', () => {
    expect(voiceStyleOf('Microsoft Zira - English (United States)')).toBe('girl');
    expect(voiceStyleOf('Microsoft Aria Online (Natural) - English (United States)')).toBe('girl');
    expect(voiceStyleOf('Google US English')).toBe('girl');
    expect(voiceStyleOf('Samantha')).toBe('girl');
  });

  it('maps male-sounding voice names to boy', () => {
    expect(voiceStyleOf('Microsoft David - English (United States)')).toBe('boy');
    expect(voiceStyleOf('Microsoft Guy Online (Natural) - English (United States)')).toBe('boy');
    expect(voiceStyleOf('Alex')).toBe('boy');
  });

  it('recognises Edge multilingual neural voices', () => {
    expect(
      voiceStyleOf('Microsoft AvaMultilingual Online (Natural) - English (United States)'),
    ).toBe('girl');
    expect(
      voiceStyleOf('Microsoft AndrewMultilingual Online (Natural) - English (United States)'),
    ).toBe('boy');
    expect(voiceStyleOf('Microsoft Brian Online (Natural) - English (United States)')).toBe('boy');
  });

  it('treats Edge Ana as a girl voice that is already a child', () => {
    const ana = 'Microsoft Ana Online (Natural) - English (United States)';
    expect(voiceStyleOf(ana)).toBe('girl');
    expect(isChildVoice(ana)).toBe(true);
    expect(isChildVoice('Microsoft Aria Online (Natural)')).toBe(false);
  });

  it('does not mistake "female" for "male"', () => {
    expect(voiceStyleOf('English Female')).toBe('girl');
    expect(voiceStyleOf('English Male')).toBe('boy');
  });

  it('returns null when the name says nothing', () => {
    expect(voiceStyleOf('Voice 7')).toBeNull();
  });
});
