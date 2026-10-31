import { describe, expect, it } from 'vitest';
import { playSfx, SFX_NOTES, type SfxName } from '@/lib/sfx';

describe('feedback sounds', () => {
  it('correct rises, wrong falls, completed ends on a held chord', () => {
    const correct = SFX_NOTES.correct.map((note) => note.frequency);
    expect(correct).toEqual([...correct].sort((a, b) => a - b));
    const wrong = SFX_NOTES.wrong.map((note) => note.frequency);
    expect(wrong).toEqual([...wrong].sort((a, b) => b - a));
    const longest = Math.max(...SFX_NOTES.completed.map((note) => note.duration));
    expect(SFX_NOTES.completed.filter((note) => note.duration === longest).length).toBe(3);
  });

  it('every note is audible and short', () => {
    for (const notes of Object.values(SFX_NOTES)) {
      for (const note of notes) {
        expect(note.gain).toBeGreaterThan(0);
        expect(note.gain).toBeLessThanOrEqual(1);
        expect(note.at + note.duration).toBeLessThan(2);
      }
    }
  });

  it('does nothing (and does not throw) without Web Audio', () => {
    for (const name of ['correct', 'wrong', 'completed'] satisfies SfxName[]) {
      expect(() => playSfx(name)()).not.toThrow();
    }
  });
});
