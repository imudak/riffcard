import type { PitchFrame, AnalysisResult } from './types';
import { AnalysisError } from './errors';

const MIN_FREQ = 80;
const MAX_FREQ = 1000;
const FFT_SIZE = 4096;
const HOP_RATIO = 0.5; // 50% overlap
/** 無音フレーム除外用 RMS エネルギー閾値（onset検出と同形式：平均二乗エネルギー） */
const RMS_ENERGY_THRESHOLD = 0.001;

/**
 * REQ-RC-PITCH-002: MIDI 変換
 * 12 * log2(freq / 440) + 69
 * REQ-RC-PITCH-001: 80-1000Hz 範囲フィルタ
 */
export function freq2midi(freq: number): number {
  if (freq <= 0 || freq < MIN_FREQ || freq > MAX_FREQ) return 0;
  return Math.round(12 * Math.log2(freq / 440) + 69);
}

/**
 * ハニング窓を適用
 */
function applyHanningWindow(buffer: Float32Array): Float32Array {
  const n = buffer.length;
  const windowed = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    windowed[i] = buffer[i] * (0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (n - 1)));
  }
  return windowed;
}

/**
 * エネルギーベースのオンセット検出
 */
function detectOnsets(samples: Float32Array, sampleRate: number): number[] {
  const frameSize = 1024;
  const hopSize = 512;
  const energies: number[] = [];

  for (let i = 0; i + frameSize <= samples.length; i += hopSize) {
    let energy = 0;
    for (let j = 0; j < frameSize; j++) {
      energy += samples[i + j] * samples[i + j];
    }
    energies.push(energy / frameSize);
  }

  const onsets: number[] = [];
  const threshold = 1.5;
  for (let i = 1; i < energies.length; i++) {
    const ratio = energies[i - 1] > 0 ? energies[i] / energies[i - 1] : 0;
    if (ratio > threshold && energies[i] > 0.001) {
      onsets.push((i * hopSize) / sampleRate);
    }
  }
  return onsets;
}

/**
 * REQ-RC-PITCH-001, PITCH-002, PITCH-006
 * OfflineAudioContext で Blob をデコード → ピッチ分析
 */
export async function analyzeAudio(audioBlob: Blob): Promise<AnalysisResult> {
  try {
    const arrayBuffer = await audioBlob.arrayBuffer();
    const audioContext = new OfflineAudioContext(1, 1, 44100);
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    const sampleRate = audioBuffer.sampleRate;
    const samples = audioBuffer.getChannelData(0);
    const duration = audioBuffer.duration;
    const hopSize = Math.floor(FFT_SIZE * HOP_RATIO);

    const pitchFrames: PitchFrame[] = [];

    // Pitchy を動的インポート（ブラウザ環境でのみ動作）
    const { PitchDetector } = await import('pitchy');

    for (let offset = 0; offset + FFT_SIZE <= samples.length; offset += hopSize) {
      const frame = samples.slice(offset, offset + FFT_SIZE);
      const time = offset / sampleRate;

      // 無音フレームのノイズ除外: 平均二乗エネルギーが閾値以下はピッチなし
      let energy = 0;
      for (let i = 0; i < frame.length; i++) {
        energy += frame[i] * frame[i];
      }
      const mse = energy / frame.length;

      if (mse < RMS_ENERGY_THRESHOLD) {
        pitchFrames.push({ time, frequency: 0, midi: 0, clarity: 0 });
        continue;
      }

      const windowed = applyHanningWindow(frame);

      const detector = PitchDetector.forFloat32Array(FFT_SIZE);
      const [frequency, clarity] = detector.findPitch(windowed, sampleRate);

      const midi = freq2midi(frequency);

      pitchFrames.push({
        time,
        frequency: midi > 0 ? frequency : 0,
        midi,
        clarity: midi > 0 ? clarity : 0,
      });
    }

    const onsets = detectOnsets(samples, sampleRate);

    return { pitchFrames, onsets, duration };
  } catch (error) {
    if (error instanceof AnalysisError) throw error;
    throw new AnalysisError(
      error instanceof Error ? error.message : '音声分析中にエラーが発生しました',
    );
  }
}
