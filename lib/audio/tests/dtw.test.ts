/**
 * REQ-RC-PITCH-003: DTWアライメント（スコア計算の基盤）
 * REQ-RC-PITCH-004: ±50cent判定のためのアライメント
 */
import { describe, it, expect } from 'vitest';
import { alignByDTW } from '../src/dtw';

describe('alignByDTW', () => {
  it('同一系列 → 距離0のペア', () => {
    const seq = [1, 2, 3, 4, 5];
    const result = alignByDTW(seq, seq);
    expect(result.length).toBeGreaterThanOrEqual(seq.length);
    for (const [r, p] of result) {
      expect(r).toBe(p);
    }
  });

  it('長さが異なる系列のアライメント', () => {
    const ref = [1, 2, 3];
    const prac = [1, 2, 2.5, 3];
    const result = alignByDTW(ref, prac);
    // 全要素がカバーされる
    expect(result.length).toBeGreaterThanOrEqual(Math.max(ref.length, prac.length));
    // 最初と最後のペア
    expect(result[0]).toEqual([1, 1]);
    expect(result[result.length - 1]).toEqual([3, 3]);
  });

  it('既知の入力に対する期待アライメント', () => {
    const ref = [100, 200, 300];
    const prac = [100, 300];
    const result = alignByDTW(ref, prac);
    // refの全要素がカバーされている
    const refValues = result.map(([r]) => r);
    expect(refValues).toContain(100);
    expect(refValues).toContain(200);
    expect(refValues).toContain(300);
  });

  it('1要素同士', () => {
    const result = alignByDTW([42], [42]);
    expect(result).toEqual([[42, 42]]);
  });

  it('1要素 vs 複数要素', () => {
    const result = alignByDTW([5], [5, 5, 5]);
    expect(result.length).toBe(3);
    for (const [r, p] of result) {
      expect(r).toBe(5);
      expect(p).toBe(5);
    }
  });

  it('空配列 → 空結果', () => {
    expect(alignByDTW([], [])).toEqual([]);
    expect(alignByDTW([1], [])).toEqual([]);
    expect(alignByDTW([], [1])).toEqual([]);
  });

  it('100フレーム程度で問題なく動作', () => {
    const ref = Array.from({ length: 100 }, (_, i) => i);
    const prac = Array.from({ length: 80 }, (_, i) => i * 1.25);
    const result = alignByDTW(ref, prac);
    expect(result.length).toBeGreaterThanOrEqual(100);
  });
});
