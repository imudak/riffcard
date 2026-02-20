/**
 * REQ-RC-REC-005: 練習録音→自動分析
 * REQ-RC-PITCH-006: オフライン音声分析
 */
import { useState, useCallback } from 'react';
import { analyzeAudio, calcPitchScore, calcRhythmScore, calcTotalScore } from '@lib/audio';
import type { Scores } from '@lib/audio';

export type AnalyzerState = 'idle' | 'analyzing' | 'done' | 'error';

export function useAnalyzer() {
  const [state, setState] = useState<AnalyzerState>('idle');
  const [scores, setScores] = useState<Scores | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const analyze = useCallback(async (referenceBlob: Blob, practiceBlob: Blob): Promise<Scores> => {
    try {
      setState('analyzing');
      setError(null);

      const [refResult, pracResult] = await Promise.all([
        analyzeAudio(referenceBlob),
        analyzeAudio(practiceBlob),
      ]);

      const refPitches = refResult.pitchFrames
        .filter((f) => f.midi > 0)
        .map((f) => f.frequency);
      const pracPitches = pracResult.pitchFrames
        .filter((f) => f.midi > 0)
        .map((f) => f.frequency);

      const pitchScore = calcPitchScore(refPitches, pracPitches);
      const rhythmScore = calcRhythmScore(refResult.onsets, pracResult.onsets);
      const totalScore = calcTotalScore(pitchScore, rhythmScore);

      const result: Scores = { pitchScore, rhythmScore, totalScore };
      setScores(result);
      setState('done');
      return result;
    } catch (e) {
      const err = e instanceof Error ? e : new Error('分析に失敗しました');
      setError(err);
      setState('error');
      throw err;
    }
  }, []);

  return { state, scores, error, analyze };
}
