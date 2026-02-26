/**
 * UX-WAVE-001: PitchContourDisplay テスト
 * ピッチ輪郭表示コンポーネント（Test-First, Constitutional Article III）
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { PitchContourDisplay } from './PitchContourDisplay';

// vi.mock はモジュールレベルでホイストされるため、変数参照は使えない
vi.mock('@lib/audio', () => ({
  analyzeAudio: vi.fn(),
}));

import { analyzeAudio } from '@lib/audio';
const mockAnalyzeAudio = vi.mocked(analyzeAudio);

const MOCK_ANALYSIS_RESULT = {
  pitchFrames: [
    { time: 0.0, frequency: 261.6, midi: 60, clarity: 0.9 },
    { time: 0.1, frequency: 293.7, midi: 62, clarity: 0.9 },
    { time: 0.2, frequency: 329.6, midi: 64, clarity: 0.9 },
    { time: 0.3, frequency: 0, midi: 0, clarity: 0 },
    { time: 0.4, frequency: 349.2, midi: 65, clarity: 0.9 },
  ],
  onsets: [0.05],
  duration: 0.5,
};

beforeEach(() => {
  mockAnalyzeAudio.mockResolvedValue(MOCK_ANALYSIS_RESULT);
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('PitchContourDisplay - UX-WAVE-001', () => {
  it('audioBlob が null のとき何も表示しない', () => {
    const { container } = render(<PitchContourDisplay audioBlob={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('audioBlob が渡されたとき最初はローディング状態を表示する', () => {
    const blob = new Blob(['audio'], { type: 'audio/webm' });
    render(<PitchContourDisplay audioBlob={blob} />);
    // ローディング状態: pulse animation div が表示
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('分析完了後に SVG グラフが表示される', async () => {
    const blob = new Blob(['audio'], { type: 'audio/webm' });
    render(<PitchContourDisplay audioBlob={blob} />);
    await waitFor(() => {
      expect(screen.getByRole('img')).toBeInTheDocument();
    });
  });

  it('label prop が指定されたとき表示される', async () => {
    const blob = new Blob(['audio'], { type: 'audio/webm' });
    render(<PitchContourDisplay audioBlob={blob} label="お手本" />);
    await waitFor(() => {
      expect(screen.getByText('お手本')).toBeInTheDocument();
    });
  });

  it('voiced frames が0個のとき「ピッチデータなし」を表示する', async () => {
    mockAnalyzeAudio.mockResolvedValueOnce({
      pitchFrames: [
        { time: 0, frequency: 0, midi: 0, clarity: 0 },
      ],
      onsets: [],
      duration: 0.5,
    });
    const blob = new Blob(['audio'], { type: 'audio/webm' });
    render(<PitchContourDisplay audioBlob={blob} />);
    await waitFor(() => {
      expect(screen.getByText('ピッチデータなし')).toBeInTheDocument();
    });
  });

  it('analyzeAudio がエラーのとき「ピッチデータなし」を表示する', async () => {
    mockAnalyzeAudio.mockRejectedValueOnce(new Error('分析失敗'));
    const blob = new Blob(['audio'], { type: 'audio/webm' });
    render(<PitchContourDisplay audioBlob={blob} />);
    await waitFor(() => {
      expect(screen.getByText('ピッチデータなし')).toBeInTheDocument();
    });
  });

  it('audioBlob が変わると analyzeAudio が再呼び出しされる', async () => {
    const blob1 = new Blob(['audio1'], { type: 'audio/webm' });
    const blob2 = new Blob(['audio2'], { type: 'audio/webm' });
    const { rerender } = render(<PitchContourDisplay audioBlob={blob1} />);
    await waitFor(() => {
      expect(mockAnalyzeAudio).toHaveBeenCalledTimes(1);
    });
    rerender(<PitchContourDisplay audioBlob={blob2} />);
    await waitFor(() => {
      expect(mockAnalyzeAudio).toHaveBeenCalledTimes(2);
    });
  });
});
