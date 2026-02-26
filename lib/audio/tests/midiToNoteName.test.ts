/**
 * TEST-P3-004: midiToNoteName ユーティリティ
 * REQ-RC-UX-006
 */
import { describe, it, expect } from 'vitest';
import { midiToNoteName } from '../src/midiToNoteName';

describe('midiToNoteName', () => {
  it('MIDI 60 → C4', () => {
    expect(midiToNoteName(60)).toBe('C4');
  });

  it('MIDI 69 → A4', () => {
    expect(midiToNoteName(69)).toBe('A4');
  });

  it('MIDI 61 → C#4', () => {
    expect(midiToNoteName(61)).toBe('C#4');
  });

  it('MIDI 0 → C-1', () => {
    expect(midiToNoteName(0)).toBe('C-1');
  });

  it('MIDI 48 → C3', () => {
    expect(midiToNoteName(48)).toBe('C3');
  });

  it('MIDI 71 → B4', () => {
    expect(midiToNoteName(71)).toBe('B4');
  });
});
