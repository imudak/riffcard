import { alignByDTW } from './dtw';

/**
 * REQ-RC-PITCH-003, PITCH-004
 * ピッチスコア: DTWアライメント → ±50cent 以内のフレーム割合
 */
export function calcPitchScore(refPitches: number[], pracPitches: number[]): number {
  if (refPitches.length === 0 || pracPitches.length === 0) return 0;

  const aligned = alignByDTW(refPitches, pracPitches);
  if (aligned.length === 0) return 0;

  const accurateCount = aligned.filter(([ref, prac]) => {
    if (ref === 0 || prac === 0) return false;
    const centDiff = Math.abs(1200 * Math.log2(prac / ref));
    return centDiff <= 50;
  }).length;

  return Math.round((accurateCount / aligned.length) * 100);
}

/**
 * リズムスコア: DTWアライメント → ±100ms 以内のオンセット割合
 */
export function calcRhythmScore(refOnsets: number[], pracOnsets: number[]): number {
  if (refOnsets.length === 0 || pracOnsets.length === 0) return 0;

  const aligned = alignByDTW(refOnsets, pracOnsets);
  if (aligned.length === 0) return 0;

  const accurateCount = aligned.filter(([ref, prac]) => {
    return Math.abs(prac - ref) <= 0.1;
  }).length;

  return Math.round((accurateCount / aligned.length) * 100);
}

/**
 * REQ-RC-PITCH-003
 * 総合スコア: pitchScore * 0.7 + rhythmScore * 0.3
 */
export function calcTotalScore(pitchScore: number, rhythmScore: number): number {
  return Math.round(pitchScore * 0.7 + rhythmScore * 0.3);
}
