/**
 * UX-PITCH-OVERLAY-001: RealtimePitchOverlay テスト
 * - stream=null のとき正常にレンダリングされる
 * - referenceBlob が渡されたとき analyzeAudio を呼び出す
 * - stream が渡されたとき AudioContext を起動する
 * - 進行バーが表示される
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { RealtimePitchOverlay } from './RealtimePitchOverlay';

// @lib/audio モック
vi.mock('@lib/audio', () => ({
  analyzeAudio: vi.fn().mockResolvedValue({
    pitchFrames: [
      { time: 0.1, midi: 60 },
      { time: 0.2, midi: 62 },
      { time: 0.3, midi: 64 },
    ],
    duration: 1.0,
  }),
  freq2midi: vi.fn((f: number) => 69 + 12 * Math.log2(f / 440)),
  midiToNoteName: vi.fn((m: number) => {
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const octave = Math.floor(m / 12) - 1;
    return `${notes[m % 12]}${octave}`;
  }),
}));

// pitchy モック
vi.mock('pitchy', () => ({
  PitchDetector: {
    forFloat32Array: vi.fn().mockReturnValue({
      findPitch: vi.fn().mockReturnValue([440, 0.9]),
    }),
  },
}));

// AudioContext モックを beforeEach で毎回生成（vi.restoreAllMocks の影響を防ぐ）
beforeEach(() => {
  const mockAnalyser = {
    fftSize: 0,
    getFloatTimeDomainData: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn(),
  };
  const mockSource = {
    connect: vi.fn(),
    disconnect: vi.fn(),
  };
  const mockAudioContext = {
    createAnalyser: vi.fn().mockReturnValue(mockAnalyser),
    createMediaStreamSource: vi.fn().mockReturnValue(mockSource),
    close: vi.fn(),
    currentTime: 0,
  };
  Object.defineProperty(globalThis, 'AudioContext', {
    value: vi.fn().mockImplementation(() => mockAudioContext),
    writable: true,
    configurable: true,
  });
  vi.stubGlobal('requestAnimationFrame', vi.fn().mockReturnValue(1));
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('RealtimePitchOverlay', () => {
  it('referenceBlob=null, stream=null でクラッシュしない (UX-PITCH-OVERLAY-001)', () => {
    render(<RealtimePitchOverlay referenceBlob={null} stream={null} />);
    expect(screen.getByTestId('realtime-pitch-overlay')).toBeInTheDocument();
  });

  it('進行バー（progressbar）が表示される', () => {
    render(<RealtimePitchOverlay referenceBlob={null} stream={null} />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('ピッチグラフ SVG が表示される', () => {
    render(<RealtimePitchOverlay referenceBlob={null} stream={null} />);
    expect(screen.getByRole('img', { name: 'リアルタイムピッチグラフ' })).toBeInTheDocument();
  });

  it('referenceBlob が渡されたとき analyzeAudio を呼び出す', async () => {
    const { analyzeAudio } = await import('@lib/audio');
    const blob = new Blob(['audio'], { type: 'audio/webm' });
    render(<RealtimePitchOverlay referenceBlob={blob} stream={null} />);
    await waitFor(() => {
      expect(analyzeAudio).toHaveBeenCalledWith(blob);
    });
  });

  it('stream が渡されたとき AudioContext を起動する', () => {
    const mockStream = {} as MediaStream;
    render(<RealtimePitchOverlay referenceBlob={null} stream={mockStream} />);
    expect(AudioContext).toHaveBeenCalled();
  });

  it('onsetTime が渡されたときコンポーネントがクラッシュしない', () => {
    const blob = new Blob(['audio'], { type: 'audio/webm' });
    render(<RealtimePitchOverlay referenceBlob={blob} stream={null} onsetTime={0.5} />);
    expect(screen.getByTestId('realtime-pitch-overlay')).toBeInTheDocument();
  });
});
