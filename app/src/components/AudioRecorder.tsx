/**
 * REQ-RC-REC-002: マイク権限拒否ガイド, REQ-RC-REC-003: 録音中波形表示
 * REQ-RC-NFR-004: MediaRecorder非対応ブラウザ検出
 * REQ-RC-PLAY-004: お手本再生中は録音停止 (disabled, stopSignal)
 * REQ-RC-REC-007: 録音開始時コールバック (onRecordingStart)
 * REQ-RC-UX-006: ストリーム公開コールバック (onStreamChange)
 */
import { useEffect, useRef } from 'react';
import { useRecorder } from '../hooks/useRecorder';
import { WaveformVisualizer } from './WaveformVisualizer';

interface AudioRecorderProps {
  autoStart?: boolean;
  /** お手本再生中に録音を無効化 REQ-RC-PLAY-004 */
  disabled?: boolean;
  /** インクリメントで録音停止指示 REQ-RC-PLAY-004 */
  stopSignal?: number;
  onRecordingComplete: (blob: Blob) => void;
  /** 録音開始時コールバック REQ-RC-REC-007 */
  onRecordingStart?: () => void;
  /** 録音ストリーム変化コールバック REQ-RC-UX-006 */
  onStreamChange?: (stream: MediaStream | null) => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function AudioRecorder({
  autoStart = false,
  disabled = false,
  stopSignal,
  onRecordingComplete,
  onRecordingStart,
  onStreamChange,
}: AudioRecorderProps) {
  const { state, audioBlob, error, elapsedTime, stream, startRecording, stopRecording, getMediaStream } =
    useRecorder();
  const prevStateRef = useRef<string>('idle');

  const isMediaRecorderSupported =
    typeof window !== 'undefined' &&
    'MediaRecorder' in window &&
    'mediaDevices' in navigator;

  /** REQ-RC-PLAY-004: disabled=true のとき autoStart しない */
  useEffect(() => {
    if (autoStart && !disabled && state === 'idle' && isMediaRecorderSupported) {
      startRecording();
    }
  }, [autoStart, disabled, state, startRecording, isMediaRecorderSupported]);

  /** REQ-RC-PLAY-004: stopSignal 変化時に録音停止 */
  useEffect(() => {
    if (stopSignal && stopSignal > 0 && state === 'recording') {
      stopRecording();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stopSignal]);

  /** REQ-RC-REC-007: 録音開始時コールバック */
  useEffect(() => {
    if (state === 'recording' && prevStateRef.current !== 'recording') {
      onRecordingStart?.();
    }
    prevStateRef.current = state;
  }, [state, onRecordingStart]);

  /** REQ-RC-UX-006: ストリーム変化をコールバックで通知 */
  useEffect(() => {
    onStreamChange?.(stream);
  }, [stream, onStreamChange]);

  useEffect(() => {
    if (state === 'stopped' && audioBlob) {
      onRecordingComplete(audioBlob);
    }
  }, [state, audioBlob, onRecordingComplete]);

  if (!isMediaRecorderSupported) {
    return (
      <div className="flex flex-col items-center gap-4 p-6">
        <p className="text-red-500 font-medium">お使いのブラウザは録音に対応していません</p>
        <div className="text-sm text-gray-600 text-center">
          <p>Chrome、Firefox、Edge の最新版をお使いください。</p>
          <p className="mt-1">Google Chrome を推奨します。</p>
        </div>
      </div>
    );
  }

  /** REQ-RC-PLAY-004: お手本再生中は待機表示 */
  if (disabled && state !== 'recording') {
    return (
      <div className="flex flex-col items-center gap-4 p-6">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-gray-300" />
          <span className="text-sm text-gray-400">お手本再生中...</span>
        </div>
      </div>
    );
  }

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
