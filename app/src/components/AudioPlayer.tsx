/** REQ-RC-PLAY-001: お手本再生, REQ-RC-PLAY-002: テイク再生, REQ-RC-PLAY-003: 再生エラー */
import { useState, useRef, useEffect } from 'react';

interface AudioPlayerProps {
  blob: Blob | null;
  label?: string;
  autoPlay?: boolean;
  onError?: () => void;
}

export function AudioPlayer({ blob, label = '再生', autoPlay = false, onError }: AudioPlayerProps) {
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

  const playAudio = () => {
    if (!urlRef.current) return;
    setError(false);

    const audio = new Audio(urlRef.current);
    audioRef.current = audio;

    audio.onended = () => setPlaying(false);
    audio.onerror = () => {
      setPlaying(false);
      setError(true);
      onError?.();
    };

    audio.play().then(() => setPlaying(true)).catch(() => {
      setError(true);
      onError?.();
    });
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setPlaying(false);
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
