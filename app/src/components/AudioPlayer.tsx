/**
 * REQ-RC-PLAY-001: お手本再生, REQ-RC-PLAY-002: テイク再生, REQ-RC-PLAY-003: 再生エラー
 * REQ-RC-PLAY-004: お手本再生中は録音停止 (onPlayingChange, stopSignal)
 * REQ-RC-PLAY-005: お手本ループ再生 (loop)
 * REQ-RC-PLAY-006: お手本再生速度調整 (playbackRate)
 */
import { useState, useRef, useEffect } from 'react';

interface AudioPlayerProps {
  blob: Blob | null;
  label?: string;
  autoPlay?: boolean;
  onError?: () => void;
  /** 再生状態変化コールバック REQ-RC-PLAY-004 */
  onPlayingChange?: (playing: boolean) => void;
  /** インクリメントで停止指示 REQ-RC-REC-007 */
  stopSignal?: number;
  /** ループ再生 REQ-RC-PLAY-005 */
  loop?: boolean;
  /** 再生速度 (0.5 | 0.75 | 1.0) REQ-RC-PLAY-006 */
  playbackRate?: number;
}

export function AudioPlayer({
  blob,
  label = '再生',
  autoPlay = false,
  onError,
  onPlayingChange,
  stopSignal,
  loop,
  playbackRate,
}: AudioPlayerProps) {
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);

  useEffect(() => {
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
    }
    if (blob) {
      urlRef.current = URL.createObjectURL(blob);
    }
    return () => {
      if (urlRef.current) {
        URL.revokeObjectURL(urlRef.current);
      }
    };
  }, [blob]);

  useEffect(() => {
    if (autoPlay && blob && urlRef.current) {
      playAudio();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPlay, blob]);

  /** REQ-RC-REC-007: 録音開始時に停止指示を受けたら停止 */
  useEffect(() => {
    if (stopSignal && stopSignal > 0) {
      stopAudio();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stopSignal]);

  /** REQ-RC-PLAY-005: loop 変更時に反映 */
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.loop = loop ?? false;
    }
  }, [loop]);

  /** REQ-RC-PLAY-006: playbackRate 変更時に反映 */
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate ?? 1.0;
    }
  }, [playbackRate]);

  const playAudio = () => {
    if (!urlRef.current) return;
    setError(false);

    const audio = new Audio(urlRef.current);
    audio.loop = loop ?? false;
    audio.playbackRate = playbackRate ?? 1.0;
    audioRef.current = audio;

    audio.onended = () => {
      setPlaying(false);
      onPlayingChange?.(false);
    };
    audio.onerror = () => {
      setPlaying(false);
      setError(true);
      onPlayingChange?.(false);
      onError?.();
    };

    audio.play().then(() => {
      setPlaying(true);
      onPlayingChange?.(true);
    }).catch(() => {
      setError(true);
      onError?.();
    });
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setPlaying(false);
      onPlayingChange?.(false);
    }
  };

  if (!blob) return null;

  if (error) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-red-500">再生に失敗しました</span>
        <button
          onClick={playAudio}
          className="text-sm text-rose-500 underline hover:text-rose-600"
        >
          再試行
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={playing ? stopAudio : playAudio}
      className="flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-gray-700 hover:bg-gray-200"
    >
      <span>{playing ? '⏸' : '▶'}</span>
      <span>{playing ? '停止' : label}</span>
    </button>
  );
}
