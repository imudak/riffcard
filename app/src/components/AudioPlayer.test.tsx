/**
 * TASK-P3-004: AudioPlayer loop/playbackRate props テスト
 * REQ-RC-PLAY-005, REQ-RC-PLAY-006
 * UX-TIMING-001: showProgress / onsetTime props
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { AudioPlayer } from './AudioPlayer';

const mockBlob = new Blob(['audio'], { type: 'audio/webm' });

let mockAudio: {
  play: ReturnType<typeof vi.fn>;
  pause: ReturnType<typeof vi.fn>;
  loop: boolean;
  playbackRate: number;
  currentTime: number;
  duration: number;
  onended: (() => void) | null;
  onerror: (() => void) | null;
  ontimeupdate: (() => void) | null;
  onloadedmetadata: (() => void) | null;
};

beforeEach(() => {
  mockAudio = {
    play: vi.fn().mockResolvedValue(undefined),
    pause: vi.fn(),
    loop: false,
    playbackRate: 1.0,
    currentTime: 0,
    duration: 5.0,
    onended: null,
    onerror: null,
    ontimeupdate: null,
    onloadedmetadata: null,
  };
  vi.spyOn(globalThis, 'Audio').mockImplementation(() => mockAudio as unknown as HTMLAudioElement);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('AudioPlayer - loop/playbackRate props', () => {
  it('loop=true のとき再生時に audio.loop が true になる', async () => {
    render(<AudioPlayer blob={mockBlob} loop={true} />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button'));
    });
    expect(mockAudio.loop).toBe(true);
  });

  it('loop=false のとき再生時に audio.loop が false になる', async () => {
    render(<AudioPlayer blob={mockBlob} loop={false} />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button'));
    });
    expect(mockAudio.loop).toBe(false);
  });

  it('playbackRate=0.5 のとき再生時に audio.playbackRate が 0.5 になる', async () => {
    render(<AudioPlayer blob={mockBlob} playbackRate={0.5} />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button'));
    });
    expect(mockAudio.playbackRate).toBe(0.5);
  });

  it('playbackRate 未指定のとき audio.playbackRate が 1.0 になる', async () => {
    render(<AudioPlayer blob={mockBlob} />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button'));
    });
    expect(mockAudio.playbackRate).toBe(1.0);
  });

  it('既存: blob=null のとき何も表示しない', () => {
    const { container } = render(<AudioPlayer blob={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('既存: 再生ボタンが表示される', () => {
    render(<AudioPlayer blob={mockBlob} label="お手本再生" />);
    expect(screen.getByText('お手本再生')).toBeInTheDocument();
  });
});

describe('AudioPlayer - showProgress / onsetTime (UX-TIMING-001)', () => {
  it('showProgress=false のとき進行バーが表示されない', async () => {
    render(<AudioPlayer blob={mockBlob} showProgress={false} />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button'));
    });
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('showProgress=true で再生中に進行バーが表示される', async () => {
    render(<AudioPlayer blob={mockBlob} showProgress />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button'));
    });
    // currentTime を更新して duration を有効にする
    await act(async () => {
      mockAudio.currentTime = 1.0;
      mockAudio.ontimeupdate?.();
    });
    await waitFor(() => {
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });

  it('onsetTime が指定されたとき「歌い始め」マーカーが表示される', async () => {
    render(<AudioPlayer blob={mockBlob} showProgress onsetTime={1.0} />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button'));
    });
    await act(async () => {
      mockAudio.currentTime = 0.5;
      mockAudio.ontimeupdate?.();
    });
    await waitFor(() => {
      expect(screen.getByTitle('歌い始め')).toBeInTheDocument();
    });
  });

  it('onsetTime=0 のときマーカーは表示されない', async () => {
    render(<AudioPlayer blob={mockBlob} showProgress onsetTime={0} />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button'));
    });
    await act(async () => {
      mockAudio.currentTime = 0.5;
      mockAudio.ontimeupdate?.();
    });
    await waitFor(() => {
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
    expect(screen.queryByTitle('歌い始め')).not.toBeInTheDocument();
  });
});
