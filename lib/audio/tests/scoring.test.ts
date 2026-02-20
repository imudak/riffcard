import { describe, it, expect } from 'vitest';
import { calcPitchScore, calcRhythmScore, calcTotalScore } from '../src/scoring';

describe('calcPitchScore', () => {
  it('完全一致 → 100点', () => {
    const pitches = [440, 440, 440, 440];
    expect(calcPitchScore(pitches, pitches)).toBe(100);
  });

  it('全フレーム ±50cent 以内 → 100点', () => {
    const ref = [440, 440, 440, 440];
    // ±50cent = 440 * 2^(50/1200) ≈ 452.9
    const prac = [441, 439, 442, 438];
    expect(calcPitchScore(ref, prac)).toBe(100);
  });

  it('半数が ±50cent 以内 → 50点', () => {
    const ref = [440, 440, 440, 440];
    // 2つは範囲内、2つは範囲外（大きくずらす）
    const prac = [440, 440, 600, 600];
    expect(calcPitchScore(ref, prac)).toBe(50);
  });

  it('全フレーム外れ → 0点', () => {
    const ref = [440, 440, 440, 440];
    const prac = [880, 880, 880, 880]; // 1オクターブ上 = 1200cent
    expect(calcPitchScore(ref, prac)).toBe(0);
  });

  it('空配列 → 0点', () => {
    expect(calcPitchScore([], [])).toBe(0);
  });
});

describe('calcRhythmScore', () => {
  it('全オンセット ±100ms 以内 → 100点', () => {
    const ref = [0.5, 1.0, 1.5, 2.0];
    const prac = [0.52, 1.03, 1.48, 2.05];
    expect(calcRhythmScore(ref, prac)).toBe(100);
  });

  it('半数が ±100ms 以内 → 50点', () => {
    const ref = [0.5, 1.0, 1.5, 2.0];
    const prac = [0.5, 1.0, 2.0, 3.0]; // 後半2つは範囲外
    expect(calcRhythmScore(ref, prac)).toBe(50);
  });

  it('全オンセット外れ → 0点', () => {
    const ref = [0.5, 1.0, 1.5];
    const prac = [5.0, 6.0, 7.0];
    expect(calcRhythmScore(ref, prac)).toBe(0);
  });

  it('空配列 → 0点', () => {
    expect(calcRhythmScore([], [])).toBe(0);
  });
});

describe('calcTotalScore', () => {
  it('pitch=100, rhythm=100 → 100', () => {
    expect(calcTotalScore(100, 100)).toBe(100);
  });

  it('pitch=100, rhythm=0 → 70', () => {
    expect(calcTotalScore(100, 0)).toBe(70);
  });

  it('pitch=0, rhythm=100 → 30', () => {
    expect(calcTotalScore(0, 100)).toBe(30);
  });

  it('pitch=80, rhythm=60 → 74', () => {
    // 80 * 0.7 + 60 * 0.3 = 56 + 18 = 74
    expect(calcTotalScore(80, 60)).toBe(74);
  });
});
