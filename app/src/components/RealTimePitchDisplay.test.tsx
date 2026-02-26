/**
 * TEST-P3-005: RealTimePitchDisplay
 * REQ-RC-UX-006
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RealTimePitchDisplay } from './RealTimePitchDisplay';

// jsdom では AudioContext / AnalyserNode が未定義のためモック
beforeEach(() => {
  const mockAnalyser = {
    fftSize: 0,
    frequencyBinCount: 2048,
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
    state: 'running',
  };
  Object.defineProperty(globalThis, 'AudioContext', {
    value: vi.fn().mockImplementation(() => mockAudioContext),
    writable: true,
    configurable: true,
  });
  // requestAnimationFrame モック
  vi.stubGlobal('requestAnimationFrame', vi.fn().mockReturnValue(1));
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('RealTimePitchDisplay', () => {
  it('stream=null のとき "- -" を表示する (TEST-P3-005)', () => {
    render(<RealTimePitchDisplay stream={null} />);
    expect(screen.getByText('- -')).toBeInTheDocument();
  });

  it('stream が渡されたとき AudioContext を起動する', () => {
    const mockStream = {} as MediaStream;
    render(<RealTimePitchDisplay stream={mockStream} />);
    expect(AudioContext).toHaveBeenCalled();
  });
});
