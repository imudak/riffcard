/** REQ-RC-PITCH-001〜006 */
export interface PitchFrame {
  time: number;      // 秒
  frequency: number; // Hz (0 = 無音)
  midi: number;      // MIDI ノート番号
  clarity: number;   // 検出信頼度 0-1
}

export interface AnalysisResult {
  pitchFrames: PitchFrame[];
  onsets: number[];  // オンセット時刻（秒）
  duration: number;  // 総時間（秒）
}

export interface Scores {
  pitchScore: number;
  rhythmScore: number;
  totalScore: number;
}
