/**
 * S4: 練習録音画面
 * REQ-RC-REC-005: 練習録音→自動分析, REQ-RC-PITCH-006: オフライン分析
 * REQ-RC-NFR-003: 5分録音対応
 * REQ-RC-PLAY-004: お手本再生中は録音停止
 * REQ-RC-REC-007: 録音開始時はお手本停止
 * REQ-RC-REC-008: 練習テイク自動分割フロー
 * UX-NAV-001: 明示的な Back ナビゲーション
 * UX-TIMING-001: お手本歌い始めタイミング表示
 */
import { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { openDB, TakeRepository } from '@lib/db';
import type { Take } from '@lib/db';
import { usePhrase } from '../hooks/usePhrase';
import { useAnalyzer } from '../hooks/useAnalyzer';
import { AudioRecorder } from '../components/AudioRecorder';
import { AudioPlayer } from '../components/AudioPlayer';
import { BackButton } from '../components/BackButton';
import { ScoreDisplay } from '../components/ScoreDisplay';
import { Toast } from '../components/Toast';
import { RealtimePitchOverlay } from '../components/RealtimePitchOverlay';

export function PracticeRecordPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { phrase, loading } = usePhrase(id!);
  const { state: analyzerState, error: analyzerError, analyze } = useAnalyzer();
  const [saveError, setSaveError] = useState<string | null>(null);

  /** REQ-RC-PLAY-004: お手本再生中フラグ */
  const [isReferenceAudioPlaying, setIsReferenceAudioPlaying] = useState(false);
  /** REQ-RC-REC-007: AudioPlayer停止シグナル */
  const [playerStopSignal, setPlayerStopSignal] = useState(0);
  /** UX-PITCH-OVERLAY-001: 録音ストリーム（リアルタイムピッチ表示用） */
  const [stream, setStream] = useState<MediaStream | null>(null);

  /** REQ-RC-REC-008: 直近テイクのインライン表示 */
  const [lastTake, setLastTake] = useState<Take | null>(null);
  const [showInlineResult, setShowInlineResult] = useState(false);
  /** REQ-RC-REC-008: AudioRecorder再マウント用キー */
  const [recordingKey, setRecordingKey] = useState(0);
  /** UX-TIMING-001: お手本の歌い始め時刻（秒） */
  const [referenceOnsetTime, setReferenceOnsetTime] = useState<number | undefined>(undefined);

  /** UX-TIMING-001: お手本音声のエネルギーベースのonset検出 */
  useEffect(() => {
    const blob = phrase?.referenceAudioBlob;
    if (!blob) return;

    let cancelled = false;

    (async () => {
      try {
        const arrayBuffer = await blob.arrayBuffer();
        if (cancelled) return;
        const offlineCtx = new OfflineAudioContext(1, 1, 44100);
        const audioBuffer = await offlineCtx.decodeAudioData(arrayBuffer);
        if (cancelled) return;

        const samples = audioBuffer.getChannelData(0);
        const sampleRate = audioBuffer.sampleRate;
        const frameSize = 512;
        const threshold = 0.01;

        for (let i = 0; i + frameSize <= samples.length; i += frameSize) {
          let rms = 0;
          for (let j = 0; j < frameSize; j++) {
            rms += (samples[i + j] ?? 0) * (samples[i + j] ?? 0);
          }
          rms = Math.sqrt(rms / frameSize);
          if (rms > threshold) {
            const onset = Math.max(0, i / sampleRate - 0.05);
            if (!cancelled) setReferenceOnsetTime(onset);
            return;
          }
        }
        if (!cancelled) setReferenceOnsetTime(0);
      } catch {
        // 失敗時は onsetTime 未設定のまま（進行バーのみ表示）
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [phrase?.referenceAudioBlob]);

  /** REQ-RC-PLAY-004: お手本再生状態変化
   * 再生開始時: 録音中のテイクを破棄してRecorderをリマウント（遷移バグ防止）
   * 再生終了時: isReferenceAudioPlayingがfalseになりautoStartで録音再開 */
  const handlePlayerPlayingChange = useCallback((playing: boolean) => {
    setIsReferenceAudioPlaying(playing);
    if (playing) {
      // 録音を破棄してAudioRecorderをリマウント（onRecordingCompleteを呼ばせない）
      setRecordingKey((k) => k + 1);
    }
  }, []);

  /** REQ-RC-REC-007: 録音開始時 → お手本停止指示 */
  const handleRecordingStart = useCallback(() => {
    setPlayerStopSignal((s) => s + 1);
  }, []);

  /** REQ-RC-REC-008: 録音完了 → 分析 → インライン結果表示 */
  const handleRecordingComplete = useCallback(
    async (blob: Blob) => {
      if (!id || !phrase?.referenceAudioBlob) return;

      try {
        const scores = await analyze(phrase.referenceAudioBlob, blob);

        try {
          const db = await openDB();
          const takeRepo = new TakeRepository(db);
          const take = await takeRepo.create(id, blob, scores);
          setLastTake(take);
          setShowInlineResult(true);
        } catch {
          setSaveError('保存に失敗しました');
        }
      } catch {
        // 分析エラーは useAnalyzer で管理
      }
    },
    [id, phrase, analyze],
  );

  /** REQ-RC-REC-008: もう一度 → 録音再開 */
  const handleRetry = useCallback(() => {
    setShowInlineResult(false);
    setLastTake(null);
    setRecordingKey((k) => k + 1);
  }, []);

  /** REQ-RC-REC-008: 完了 → スコア結果画面へ */
  const handleFinish = useCallback(() => {
    if (lastTake) {
      navigate(`/phrases/${id}/result/${lastTake.id}`);
    }
  }, [id, lastTake, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">読み込み中...</p>
      </div>
    );
  }

  if (analyzerState === 'analyzing') {
    return (
      <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center bg-gray-50">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-rose-500 border-t-transparent" />
        <p className="mt-4 text-lg text-gray-600">分析中...</p>
      </div>
    );
  }

  if (analyzerState === 'error') {
    return (
      <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-4 bg-gray-50">
        <p className="text-red-500">分析に失敗しました</p>
        <p className="text-sm text-gray-500">{analyzerError?.message}</p>
        <button
          onClick={() => {
            setShowInlineResult(false);
            setRecordingKey((k) => k + 1);
          }}
          className="rounded-lg bg-rose-500 px-4 py-2 text-white hover:bg-rose-600"
        >
          もう一度録音する
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-lg bg-gray-50">
      <header className="sticky top-0 z-10 flex items-center gap-3 bg-white px-4 py-3 shadow-sm">
        <BackButton label="フレーズに戻る" to={`/phrases/${id}`} />
      </header>

      <main className="p-4">
        <h2 className="mb-4 text-center text-lg font-medium text-gray-800">
          {phrase?.title ?? ''}
        </h2>

        {phrase?.referenceAudioBlob && (
          <div className="mb-6 w-full">
            <AudioPlayer
              blob={phrase.referenceAudioBlob}
              label="お手本を聴く"
              onPlayingChange={handlePlayerPlayingChange}
              stopSignal={playerStopSignal}
              showProgress
              onsetTime={referenceOnsetTime}
            />
          </div>
        )}

        {/* REQ-RC-REC-008: インライン結果 or 録音UI */}
        {showInlineResult && lastTake ? (
          <div className="flex flex-col items-center gap-4 p-4">
            <ScoreDisplay
              totalScore={lastTake.totalScore}
              pitchScore={lastTake.pitchScore}
              rhythmScore={lastTake.rhythmScore}
            />
            <div className="flex w-full flex-col gap-3 pt-2">
              <button
                onClick={handleRetry}
                className="w-full rounded-lg bg-rose-500 py-3 text-base font-semibold text-white hover:bg-rose-600"
              >
                もう一度
              </button>
              <button
                onClick={handleFinish}
                className="w-full rounded-lg border border-gray-300 py-3 text-gray-600 hover:bg-gray-100"
              >
                完了（詳細を見る）
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* UX-PITCH-OVERLAY-001: リアルタイムピッチ比較グラフ + 進行バー */}
            {phrase?.referenceAudioBlob && (
              <div className="mb-4">
                <RealtimePitchOverlay
                  referenceBlob={phrase.referenceAudioBlob}
                  stream={stream}
                  onsetTime={referenceOnsetTime}
                />
              </div>
            )}
            <AudioRecorder
              key={recordingKey}
              autoStart
              disabled={isReferenceAudioPlaying}
              onRecordingStart={handleRecordingStart}
              onRecordingComplete={handleRecordingComplete}
              onStreamChange={setStream}
            />
          </>
        )}
      </main>
      {saveError && (
        <Toast message={saveError} onDismiss={() => setSaveError(null)} />
      )}
    </div>
  );
}
