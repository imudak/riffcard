import { useEffect } from 'react';
import { useRecorder } from '../hooks/useRecorder';
import { WaveformVisualizer } from './WaveformVisualizer';

interface AudioRecorderProps {
  autoStart?: boolean;
  onRecordingComplete: (blob: Blob) => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function AudioRecorder({ autoStart = false, onRecordingComplete }: AudioRecorderProps) {
  const { state, audioBlob, error, elapsedTime, startRecording, stopRecording, getMediaStream } =
    useRecorder();

  useEffect(() => {
    if (autoStart && state === 'idle') {
      startRecording();
    }
  }, [autoStart, state, startRecording]);

  useEffect(() => {
    if (state === 'stopped' && audioBlob) {
      onRecordingComplete(audioBlob);
    }
  }, [state, audioBlob, onRecordingComplete]);

  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 p-6">
        <p className="text-red-500 font-medium">
          {error.name === 'MicPermissionError'
            ? 'マイクの使用が許可されていません'
            : '録音エラーが発生しました'}
        </p>
        {error.name === 'MicPermissionError' && (
          <div className="text-sm text-gray-600 text-center">
            <p>ブラウザの設定からマイクの使用を許可してください。</p>
            <p className="mt-1">設定 → プライバシーとセキュリティ → サイトの設定 → マイク</p>
          </div>
        )}
        <button
          onClick={startRecording}
          className="rounded-lg bg-rose-500 px-4 py-2 text-white hover:bg-rose-600"
        >
          再試行
        </button>
      </div>
    );
  }

  if (state === 'requesting') {
    return (
      <div className="flex flex-col items-center gap-4 p-6">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-rose-500 border-t-transparent" />
        <p className="text-gray-600">マイクの許可を確認中...</p>
      </div>
    );
  }

  if (state === 'recording') {
    return (
      <div className="flex flex-col items-center gap-4 p-6">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 animate-pulse rounded-full bg-red-500" />
          <span className="text-sm text-red-500 font-medium">録音中</span>
        </div>
        <WaveformVisualizer stream={getMediaStream()} />
        <p className="text-2xl font-mono text-gray-800">{formatTime(elapsedTime)}</p>
        <button
          onClick={stopRecording}
          className="flex items-center gap-2 rounded-lg bg-gray-800 px-6 py-3 text-white hover:bg-gray-900"
        >
          <span className="h-4 w-4 rounded-sm bg-white" />
          録音停止
        </button>
      </div>
    );
  }

  return null;
}
