/**
 * REQ-RC-REC-001: マイク権限要求, REQ-RC-REC-002: 権限拒否エラー
 * REQ-RC-REC-003: 録音キャプチャ制御
 */
import { useState, useRef, useCallback } from 'react';
import { requestMicPermission, AudioRecorderController } from '@lib/audio';
import type { MicPermissionError } from '@lib/audio';

export type RecorderState = 'idle' | 'requesting' | 'recording' | 'stopped';

export function useRecorder() {
  const [state, setState] = useState<RecorderState>('idle');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const controllerRef = useRef<AudioRecorderController | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  const startRecording = useCallback(async () => {
    try {
      setState('requesting');
      setError(null);
      setAudioBlob(null);

      const stream = await requestMicPermission();
      const controller = new AudioRecorderController(stream);
      controllerRef.current = controller;

      controller.start();
      setState('recording');
      startTimeRef.current = Date.now();
      setElapsedTime(0);

      timerRef.current = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
    } catch (e) {
      setState('idle');
      setError(e as MicPermissionError);
    }
  }, []);

  const stopRecording = useCallback(async () => {
    if (!controllerRef.current) return;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    try {
      const blob = await controllerRef.current.stop();
      setAudioBlob(blob);
      setState('stopped');
    } catch (e) {
      setError(e instanceof Error ? e : new Error('録音停止に失敗しました'));
      setState('idle');
    } finally {
      controllerRef.current.dispose();
      controllerRef.current = null;
    }
  }, []);

  const getMediaStream = useCallback(() => {
    return controllerRef.current?.getMediaStream() ?? null;
  }, []);

  return {
    state,
    audioBlob,
    error,
    elapsedTime,
    startRecording,
    stopRecording,
    getMediaStream,
  };
}
