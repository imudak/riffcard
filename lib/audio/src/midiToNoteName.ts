/**
 * REQ-RC-UX-006: リアルタイムピッチ表示用 MIDI→音名変換
 */

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

/**
 * MIDI番号を音名文字列に変換する
 * 例: 60 → "C4", 69 → "A4", 0 → "C-1"
 */
export function midiToNoteName(midi: number): string {
  const octave = Math.floor(midi / 12) - 1;
  const note = NOTE_NAMES[midi % 12];
  return `${note}${octave}`;
}
