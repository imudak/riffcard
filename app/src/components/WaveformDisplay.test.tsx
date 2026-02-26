/**
 * TEST-P3-003: WaveformDisplay
 * REQ-RC-UX-007: お手本音声波形表示
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { WaveformDisplay } from './WaveformDisplay';

// OfflineAudioContext モック (jsdom 非対応)
const mockAudioBuffer = {
  getChannelData: vi.fn().mockReturnValue(new Float32Array(1024).fill(0.5)),
  sampleRate: 44100,
  length: 1024,
  duration: 1,
  numberOfChannels: 1,
};

const mockOfflineAudioContext = {
  decodeAudioData: vi.fn().mockResolvedValue(mockAudioBuffer),
  startRendering: vi.fn().mockResolvedValue(mockAudioBuffer),
};

// Canvas 2D context モック
const mockCanvasCtx = {
  clearRect: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  stroke: vi.fn(),
  fillRect: vi.fn(),
  strokeStyle: '',
  lineWidth: 0,
  fillStyle: '',
};

beforeEach(() => {
  Object.defineProperty(globalThis, 'OfflineAudioContext', {
    value: vi.fn().mockImplementation(() => mockOfflineAudioContext),
    writable: true,
    configurable: true,
  });

  // Canvas getContext モック
  HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue(mockCanvasCtx);

  // FileReader / arrayBuffer モック
  vi.spyOn(Blob.prototype, 'arrayBuffer').mockResolvedValue(new ArrayBuffer(8));
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('WaveformDisplay', () => {
  it('audioBlob が null のとき canvas を表示しない (TEST-P3-003 前提)', () => {
    const { container } = render(<WaveformDisplay audioBlob={null} />);
    expect(container.querySelector('canvas')).toBeNull();
  });

  it('audioBlob が渡されたとき canvas が表示される', async () => {
    const blob = new Blob(['audio'], { type: 'audio/webm' });
    render(<WaveformDisplay audioBlob={blob} />);
    await waitFor(() => {
      expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument();
    });
  });

  it('audioBlob が変わったとき OfflineAudioContext が再生成される (TEST-P3-003)', async () => {
    const blob1 = new Blob(['audio1'], { type: 'audio/webm' });
    const blob2 = new Blob(['audio2'], { type: 'audio/webm' });
    const { rerender } = render(<WaveformDisplay audioBlob={blob1} />);
    await waitFor(() => {
      expect(OfflineAudioContext).toHaveBeenCalledTimes(1);
    });
    rerender(<WaveformDisplay audioBlob={blob2} />);
    await waitFor(() => {
      expect(OfflineAudioContext).toHaveBeenCalledTimes(2);
    });
  });
});
