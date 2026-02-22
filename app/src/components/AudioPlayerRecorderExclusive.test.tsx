/**
 * REQ-RC-PLAY-004: お手本再生中の録音停止
 * REQ-RC-REC-007: 録音開始時のお手本再生停止
 * Task 1: 再生/録音排他制御テスト
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AudioRecorder } from './AudioRecorder';

// jsdom では MediaRecorder が未定義のためモックする
const originalMediaRecorder = globalThis.MediaRecorder;
const originalMediaDevices = navigator.mediaDevices;

beforeEach(() => {
  if (!('MediaRecorder' in globalThis) || !globalThis.MediaRecorder) {
    Object.defineProperty(globalThis, 'MediaRecorder', {
      value: class MockMediaRecorder {},
      writable: true,
      configurable: true,
    });
  }
  if (!navigator.mediaDevices) {
    Object.defineProperty(navigator, 'mediaDevices', {
      value: { getUserMedia: vi.fn() },
      writable: true,
      configurable: true,
    });
  }
});

afterEach(() => {
  Object.defineProperty(globalThis, 'MediaRecorder', {
    value: originalMediaRecorder,
    writable: true,
    configurable: true,
  });
  Object.defineProperty(navigator, 'mediaDevices', {
    value: originalMediaDevices,
    writable: true,
    configurable: true,
  });
});

describe('AudioRecorder - disabled prop', () => {
  it('disabled=true のとき待機インジケーターが表示される', () => {
    render(
      <AudioRecorder
        disabled={true}
        autoStart={true}
        onRecordingComplete={vi.fn()}
      />,
    );
    expect(screen.getByText('お手本再生中...')).toBeInTheDocument();
  });

  it('disabled=true のとき録音UIが表示されない', () => {
    render(
      <AudioRecorder
        disabled={true}
        autoStart={true}
        onRecordingComplete={vi.fn()}
      />,
    );
    expect(screen.queryByText('録音中')).not.toBeInTheDocument();
    expect(screen.queryByText('マイクの許可を確認中...')).not.toBeInTheDocument();
  });

  it('disabled=false かつ autoStart=false のとき何も表示しない', () => {
    const { container } = render(
      <AudioRecorder
        disabled={false}
        autoStart={false}
        onRecordingComplete={vi.fn()}
      />,
    );
    // idle 状態で autoStart=false → null (既存挙動)
    expect(screen.queryByText('録音中')).not.toBeInTheDocument();
    expect(screen.queryByText('お手本再生中...')).not.toBeInTheDocument();
    expect(container.firstChild).toBeNull();
  });
});
