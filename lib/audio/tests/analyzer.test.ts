import { describe, it, expect } from 'vitest';
import { freq2midi } from '../src/analyzer';

describe('freq2midi', () => {
  it('440Hz → MIDI 69', () => {
    expect(freq2midi(440)).toBe(69);
  });

  it('880Hz → MIDI 81', () => {
    expect(freq2midi(880)).toBe(81);
  });

  it('261.63Hz (C4) → MIDI 60', () => {
    expect(freq2midi(261.63)).toBeCloseTo(60, 0);
  });

  it('0Hz → 0 (無音)', () => {
    expect(freq2midi(0)).toBe(0);
  });

  it('範囲外: 80Hz 未満 → 0', () => {
    expect(freq2midi(50)).toBe(0);
  });

  it('範囲外: 1000Hz 超 → 0', () => {
    expect(freq2midi(1500)).toBe(0);
  });

  it('ちょうど 80Hz → 有効', () => {
    expect(freq2midi(80)).toBeGreaterThan(0);
  });

  it('ちょうど 1000Hz → 有効', () => {
    expect(freq2midi(1000)).toBeGreaterThan(0);
  });
});
