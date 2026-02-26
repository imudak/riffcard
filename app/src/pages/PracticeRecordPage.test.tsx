/**
 * PracticeRecordPage テスト
 * REQ-RC-REC-008: 練習テイク自動分割フロー
 *   - 練習録音停止時にスコアを算出してTakeとして保存し、インラインにスコアを表示する
 *   - 「もう一度」で即次の録音を開始する
 *   - 「完了」でスコア結果画面へ遷移できる
 * REQ-RC-REC-005: 練習録音→自動分析 (analyze 呼び出し確認)
 * REQ-RC-PLAY-004: お手本再生中フラグによる AudioRecorder 無効化
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { PracticeRecordPage } from './PracticeRecordPage';

// AudioRecorder モック - onRecordingComplete を直接制御できるようにする
let capturedOnRecordingComplete: ((blob: Blob) => void) | undefined;

vi.mock('../components/AudioRecorder', () => ({
  AudioRecorder: ({
    onRecordingComplete,
    disabled,
  }: {
    onRecordingComplete: (blob: Blob) => void;
    disabled?: boolean;
    autoStart?: boolean;
    stopSignal?: number;
    onRecordingStart?: () => void;
  }) => {
    capturedOnRecordingComplete = onRecordingComplete;
    if (disabled) {
      return <div data-testid="audio-recorder-disabled">お手本再生中...</div>;
    }
    return <div data-testid="audio-recorder">AudioRecorder</div>;
  },
}));

// AudioPlayer モック
vi.mock('../components/AudioPlayer', () => ({
  AudioPlayer: ({ onPlayingChange }: { onPlayingChange?: (playing: boolean) => void; blob?: Blob | null }) => (
    <div
      data-testid="audio-player"
      onClick={() => onPlayingChange?.(true)}
    >
      AudioPlayer
    </div>
  ),
}));

// ScoreDisplay モック
vi.mock('../components/ScoreDisplay', () => ({
  ScoreDisplay: ({
    totalScore,
    pitchScore,
    rhythmScore,
  }: {
    totalScore: number;
    pitchScore: number;
    rhythmScore: number;
  }) => (
    <div data-testid="score-display">
      <span data-testid="total-score">{totalScore}</span>
      <span data-testid="pitch-score">{pitchScore}</span>
      <span data-testid="rhythm-score">{rhythmScore}</span>
    </div>
  ),
}));

// Toast モック
vi.mock('../components/Toast', () => ({
  Toast: ({ message }: { message: string }) => (
    <div data-testid="toast">{message}</div>
  ),
}));

// usePhrase モック - referenceAudioBlob 付きフレーズを返す
vi.mock('../hooks/usePhrase', () => ({
  usePhrase: () => ({
    phrase: {
      id: 'test-phrase-id',
      title: 'テストフレーズ',
      referenceAudioBlob: new Blob(['audio'], { type: 'audio/webm' }),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    loading: false,
  }),
}));

// useAnalyzer モック
const mockAnalyze = vi.fn();
vi.mock('../hooks/useAnalyzer', () => ({
  useAnalyzer: () => ({
    state: 'idle',
    error: null,
    analyze: mockAnalyze,
  }),
}));

// @lib/db モック
const mockTakeCreate = vi.fn();
vi.mock('@lib/db', async () => {
  const actual = await vi.importActual<typeof import('@lib/db')>('@lib/db');
  return {
    ...actual,
    openDB: vi.fn().mockResolvedValue({}),
    TakeRepository: vi.fn().mockImplementation(() => ({
      create: mockTakeCreate,
    })),
  };
});

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/phrases/test-phrase-id/practice']}>
      <Routes>
        <Route path="/phrases/:id/practice" element={<PracticeRecordPage />} />
        <Route
          path="/phrases/:id/result/:takeId"
          element={<div data-testid="score-result-page">ScoreResultPage</div>}
        />
      </Routes>
    </MemoryRouter>,
  );
}

const FAKE_TAKE = {
  id: 'test-take-id',
  phraseId: 'test-phrase-id',
  pitchScore: 80,
  rhythmScore: 70,
  totalScore: 77,
  audioBlob: new Blob(['audio'], { type: 'audio/webm' }),
  recordedAt: new Date(),
};

const FAKE_SCORES = { pitchScore: 80, rhythmScore: 70, totalScore: 77 };

describe('PracticeRecordPage - REQ-RC-REC-008: 練習テイク自動分割フロー', () => {
  beforeEach(() => {
    capturedOnRecordingComplete = undefined;
    vi.clearAllMocks();

    // デフォルトのモック動作を設定
    mockAnalyze.mockResolvedValue(FAKE_SCORES);
    mockTakeCreate.mockResolvedValue(FAKE_TAKE);
  });

  describe('初期表示', () => {
    it('フレーズタイトルが表示される', () => {
      renderPage();
      expect(screen.getByText('テストフレーズ')).toBeInTheDocument();
    });

    it('AudioRecorder が表示される（インライン結果は非表示）', () => {
      renderPage();
      expect(screen.getByTestId('audio-recorder')).toBeInTheDocument();
      expect(screen.queryByTestId('score-display')).not.toBeInTheDocument();
    });

    it('お手本再生プレイヤーが表示される（referenceAudioBlob あり）', () => {
      renderPage();
      expect(screen.getByTestId('audio-player')).toBeInTheDocument();
    });

    it('「もう一度」「完了」ボタンは表示されない', () => {
      renderPage();
      expect(screen.queryByText('もう一度')).not.toBeInTheDocument();
      expect(screen.queryByText('完了（詳細を見る）')).not.toBeInTheDocument();
    });
  });

  describe('録音完了後のインライン結果表示（REQ-RC-REC-008）', () => {
    async function completeRecording() {
      renderPage();
      await act(async () => {
        await capturedOnRecordingComplete?.(new Blob(['audio'], { type: 'audio/webm' }));
      });
    }

    it('インラインにスコアが表示される', async () => {
      await completeRecording();
      await waitFor(() => {
        expect(screen.getByTestId('score-display')).toBeInTheDocument();
      });
    });

    it('ScoreDisplay に正しいスコアが渡される', async () => {
      await completeRecording();
      await waitFor(() => {
        expect(screen.getByTestId('total-score').textContent).toBe('77');
        expect(screen.getByTestId('pitch-score').textContent).toBe('80');
        expect(screen.getByTestId('rhythm-score').textContent).toBe('70');
      });
    });

    it('「もう一度」ボタンが表示される', async () => {
      await completeRecording();
      await waitFor(() => {
        expect(screen.getByText('もう一度')).toBeInTheDocument();
      });
    });

    it('「完了（詳細を見る）」ボタンが表示される', async () => {
      await completeRecording();
      await waitFor(() => {
        expect(screen.getByText('完了（詳細を見る）')).toBeInTheDocument();
      });
    });

    it('インライン結果表示中は AudioRecorder が非表示になる', async () => {
      await completeRecording();
      await waitFor(() => {
        expect(screen.getByTestId('score-display')).toBeInTheDocument();
      });
      expect(screen.queryByTestId('audio-recorder')).not.toBeInTheDocument();
    });
  });

  describe('「もう一度」ボタン（REQ-RC-REC-008）', () => {
    it('クリックするとインライン結果が消えて録音UIが再表示される', async () => {
      renderPage();
      await act(async () => {
        await capturedOnRecordingComplete?.(new Blob(['audio'], { type: 'audio/webm' }));
      });
      await waitFor(() => {
        expect(screen.getByText('もう一度')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('もう一度'));

      await waitFor(() => {
        expect(screen.queryByTestId('score-display')).not.toBeInTheDocument();
        expect(screen.getByTestId('audio-recorder')).toBeInTheDocument();
      });
    });

    it('「もう一度」後に再度録音完了するとスコアが再表示される', async () => {
      renderPage();

      // 1回目の録音完了
      await act(async () => {
        await capturedOnRecordingComplete?.(new Blob(['audio'], { type: 'audio/webm' }));
      });
      await waitFor(() => {
        expect(screen.getByText('もう一度')).toBeInTheDocument();
      });

      // もう一度をクリック
      fireEvent.click(screen.getByText('もう一度'));
      await waitFor(() => {
        expect(screen.getByTestId('audio-recorder')).toBeInTheDocument();
      });

      // 2回目の録音完了
      await act(async () => {
        await capturedOnRecordingComplete?.(new Blob(['audio2'], { type: 'audio/webm' }));
      });
      await waitFor(() => {
        expect(screen.getByTestId('score-display')).toBeInTheDocument();
      });
    });
  });

  describe('「完了」ボタン（REQ-RC-REC-008）', () => {
    it('クリックするとスコア結果画面へ遷移する', async () => {
      renderPage();
      await act(async () => {
        await capturedOnRecordingComplete?.(new Blob(['audio'], { type: 'audio/webm' }));
      });
      await waitFor(() => {
        expect(screen.getByText('完了（詳細を見る）')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('完了（詳細を見る）'));

      await waitFor(() => {
        expect(screen.getByTestId('score-result-page')).toBeInTheDocument();
      });
    });
  });

  describe('スコア算出・保存処理（REQ-RC-REC-005）', () => {
    it('録音完了時に analyzeAudio が呼び出される', async () => {
      renderPage();
      const blob = new Blob(['audio'], { type: 'audio/webm' });
      await act(async () => {
        await capturedOnRecordingComplete?.(blob);
      });
      await waitFor(() => {
        expect(mockAnalyze).toHaveBeenCalledOnce();
      });
    });

    it('TakeRepository.create が呼び出されてスコアが保存される', async () => {
      renderPage();
      const blob = new Blob(['audio'], { type: 'audio/webm' });
      await act(async () => {
        await capturedOnRecordingComplete?.(blob);
      });
      await waitFor(() => {
        expect(mockTakeCreate).toHaveBeenCalledWith(
          'test-phrase-id',
          blob,
          expect.objectContaining({ pitchScore: 80, rhythmScore: 70, totalScore: 77 }),
        );
      });
    });
  });

  describe('お手本再生中の排他制御（REQ-RC-PLAY-004）', () => {
    it('お手本再生開始時に AudioRecorder が disabled 表示になる', () => {
      renderPage();
      // AudioPlayer の onClick で onPlayingChange(true) をトリガー
      fireEvent.click(screen.getByTestId('audio-player'));
      expect(screen.getByTestId('audio-recorder-disabled')).toBeInTheDocument();
    });
  });
});
