/**
 * REQ-RC-PLAY-001: お手本再生, REQ-RC-PLAY-002: テイク再生, REQ-RC-PLAY-003: 再生エラー
 * REQ-RC-PLAY-004: お手本再生中は録音停止 (onPlayingChange, stopSignal)
 * REQ-RC-PLAY-005: お手本ループ再生 (loop)
 * REQ-RC-PLAY-006: お手本再生速度調整 (playbackRate)
 * UX-TIMING-001: 再生進行バーと歌い始めマーカー (showProgress, onsetTime)
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
  /** 再生中に進行バーを表示する UX-TIMING-001 */
  showProgress?: boolean;
  /** 歌い始め位置（秒）。showProgress=true のときマーカー表示 */
  onsetTime?: number;
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
  showProgress = false,
  onsetTime,
}: AudioPlayerProps) {
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState(false);
  /** UX-TIMING-001: 進行バー用 */
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
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

    // 二重再生防止: 前のインスタンスを停止・イベント解除
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current.ontimeupdate = null;
      audioRef.current.onloadedmetadata = null;
    }

    setError(false);
    setCurrentTime(0);
    setDuration(0);

    const audio = new Audio(urlRef.current);
    audio.loop = loop ?? false;
    audio.playbackRate = playbackRate ?? 1.0;
    audioRef.current = audio;

    audio.onended = () => {
      setPlaying(false);
      setCurrentTime(0);
      onPlayingChange?.(false);
    };
    audio.onerror = () => {
      setPlaying(false);
      setError(true);
      onPlayingChange?.(false);
      onError?.();
    };
    /** UX-TIMING-001: 進行バー更新 */
    audio.ontimeupdate = () => {
      setCurrentTime(audio.currentTime);
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
    };
    audio.onloadedmetadata = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
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
      setCurrentTime(0);
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

  /** UX-TIMING-001: 進行バー表示 */
  const progressPct = duration > 0 ? Math.min((currentTime / duration) * 100, 100) : 0;
  const onsetPct =
    showProgress && onsetTime && onsetTime > 0 && duration > 0
      ? Math.min((onsetTime / duration) * 100, 100)
      : null;

  return (
    <div className="flex w-full flex-col gap-1">
      <button
        onClick={playing ? stopAudio : playAudio}
        className="flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-gray-700 hover:bg-gray-200"
      >
        <span>{playing ? '⏸' : '▶'}</span>
        <span>{playing ? '停止' : label}</span>
      </button>

      {showProgress && playing && duration > 0 && (
        <div
          role="progressbar"
          aria-valuenow={Math.round(progressPct)}
          aria-valuemin={0}
          aria-valuemax={100}
          className="relative h-2 w-full overflow-hidden rounded-full bg-gray-200"
        >
          <div
            className="absolute left-0 top-0 h-full rounded-full bg-rose-500 transition-[width] duration-100"
            style={{ width: `${progressPct}%` }}
          />
          {onsetPct !== null && (
            <div
              title="歌い始め"
              className="absolute top-0 h-full w-0.5 bg-green-500"
              style={{ left: `${onsetPct}%` }}
            />
          )}
        </div>
      )}
    </div>
  );
}
