import { describe, expect, it } from 'vitest';
import { getWord } from '@/data/content';
import { describeWord } from '@/lib/text';

describe('describeWord', () => {
  it('uses "a" / "an" for one thing', () => {
    expect(describeWord({ text: 'lamp' })).toBe('It’s a lamp.');
    expect(describeWord({ text: 'armchair' })).toBe('It’s an armchair.');
    expect(describeWord({ text: 'teddy bear' })).toBe('It’s a teddy bear.');
  });

  it('uses "They’re" for words marked plural', () => {
    expect(describeWord({ text: 'curtains', plural: true })).toBe('They’re curtains.');
    expect(describeWord(getWord('slippers')!)).toBe('They’re slippers.');
  });
});
