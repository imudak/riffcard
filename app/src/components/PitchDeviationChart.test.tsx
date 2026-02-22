/**
 * REQ-RC-PITCH-007: ピッチ差分グラフ表示
 * Task 3: PitchDeviationChart コンポーネントテスト
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { PitchDeviationChart } from './PitchDeviationChart';

// analyzeAudio をモック
vi.mock('@lib/audio', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@lib/audio')>();
  return {
    ...actual,
    analyzeAudio: vi.fn(),
  };
});

import { analyzeAudio } from '@lib/audio';
const mockAnalyzeAudio = vi.mocked(analyzeAudio);

describe('PitchDeviationChart', () => {
  const refBlob = new Blob(['ref'], { type: 'audio/webm' });
  const pracBlob = new Blob(['prac'], { type: 'audio/webm' });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ローディング中はスケルトンを表示する', () => {
    // analyzeAudio を resolve しないでおく（pending）
    mockAnalyzeAudio.mockReturnValue(new Promise(() => {}));
    render(<PitchDeviationChart referenceBlob={refBlob} practiceBlob={pracBlob} />);
    // スケルトン UI が表示される
    const skeleton = document.querySelector('.animate-pulse');
    expect(skeleton).toBeInTheDocument();
  });

  it('分析成功後に SVG チャートを表示する', async () => {
    const mockResult = {
      pitchFrames: [
        { time: 0, frequency: 440, midi: 69, clarity: 0.9 },
        { time: 0.1, frequency: 450, midi: 69, clarity: 0.9 },
        { time: 0.2, frequency: 430, midi: 68, clarity: 0.8 },
      ],
      onsets: [],
      duration: 0.3,
    };
    mockAnalyzeAudio.mockResolvedValue(mockResult);
    render(<PitchDeviationChart referenceBlob={refBlob} practiceBlob={pracBlob} />);
    await waitFor(() => {
      expect(screen.getByLabelText('ピッチ差分グラフ')).toBeInTheDocument();
    });
  });

  it('ピッチデータなし（空配列）の場合は何も表示しない', async () => {
    const emptyResult = {
      pitchFrames: [],
      onsets: [],
      duration: 0,
    };
    mockAnalyzeAudio.mockResolvedValue(emptyResult);
    const { container } = render(
      <PitchDeviationChart referenceBlob={refBlob} practiceBlob={pracBlob} />,
    );
    await waitFor(() => {
      expect(container.querySelector('svg')).toBeNull();
    });
  });

  it('分析エラー時は何も表示しない', async () => {
    mockAnalyzeAudio.mockRejectedValue(new Error('分析失敗'));
    const { container } = render(
      <PitchDeviationChart referenceBlob={refBlob} practiceBlob={pracBlob} />,
    );
    await waitFor(() => {
      expect(container.querySelector('svg')).toBeNull();
      expect(container.querySelector('.animate-pulse')).toBeNull();
    });
  });
});
