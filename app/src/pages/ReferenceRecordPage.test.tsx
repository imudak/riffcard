/**
 * TASK-P3-007: ReferenceRecordPage テスト
 * REQ-RC-UX-006: リアルタイムピッチ表示（録音中のみ）
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ReferenceRecordPage } from './ReferenceRecordPage';

// AudioRecorder モック - onStreamChange を直接制御可能にする
let capturedOnStreamChange: ((stream: MediaStream | null) => void) | undefined;

vi.mock('../components/AudioRecorder', () => ({
  AudioRecorder: ({ onStreamChange }: { onStreamChange?: (stream: MediaStream | null) => void }) => {
    capturedOnStreamChange = onStreamChange;
    return <div data-testid="audio-recorder">AudioRecorder</div>;
  },
}));

// RealTimePitchDisplay モック
vi.mock('../components/RealTimePitchDisplay', () => ({
  RealTimePitchDisplay: ({ stream }: { stream: MediaStream | null }) => (
    <div data-testid="real-time-pitch-display">{stream ? 'pitch-active' : 'pitch-inactive'}</div>
  ),
}));

// usePhrase モック
vi.mock('../hooks/usePhrase', () => ({
  usePhrase: () => ({
    phrase: {
      id: 'test-id',
      title: 'テストフレーズ',
      referenceAudioBlob: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    loading: false,
    refresh: vi.fn(),
  }),
}));

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/phrases/test-id/reference']}>
      <Routes>
        <Route path="/phrases/:id/reference" element={<ReferenceRecordPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ReferenceRecordPage - RealTimePitchDisplay 統合 (TASK-P3-007)', () => {
  beforeEach(() => {
    capturedOnStreamChange = undefined;
  });

  it('ページが正常にレンダリングされ、フレーズタイトルが表示される', () => {
    renderPage();
    expect(screen.getByText('テストフレーズ')).toBeInTheDocument();
    expect(screen.getByTestId('audio-recorder')).toBeInTheDocument();
  });

  it('stream=null のとき RealTimePitchDisplay が表示されない', () => {
    renderPage();
    expect(screen.queryByTestId('real-time-pitch-display')).not.toBeInTheDocument();
  });

  it('AudioRecorder が onStreamChange コールバックを受け取る', () => {
    renderPage();
    expect(capturedOnStreamChange).toBeDefined();
  });

  it('onStreamChange でストリームが設定されると RealTimePitchDisplay が表示される', () => {
    renderPage();
    const mockStream = {} as MediaStream;
    act(() => {
      capturedOnStreamChange?.(mockStream);
    });
    expect(screen.getByTestId('real-time-pitch-display')).toBeInTheDocument();
  });

  it('onStreamChange で null が設定されると RealTimePitchDisplay が非表示になる', () => {
    renderPage();
    const mockStream = {} as MediaStream;
    act(() => {
      capturedOnStreamChange?.(mockStream);
    });
    expect(screen.getByTestId('real-time-pitch-display')).toBeInTheDocument();
    act(() => {
      capturedOnStreamChange?.(null);
    });
    expect(screen.queryByTestId('real-time-pitch-display')).not.toBeInTheDocument();
  });
});
