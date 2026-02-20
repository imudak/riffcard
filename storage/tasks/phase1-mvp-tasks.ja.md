# RiffCard Phase 1 MVP — タスク分解

**プロジェクト**: riffcard
**最終更新**: 2026-02-20
**バージョン**: 1.0
**ステータス**: Draft
**形式**: SDD Tasks (MUSUBI)

---

## 概要

Phase 1 MVP の設計書 (`storage/design/phase1-mvp-design.ja.md`) を実装タスクに分解する。

### 実装原則

- **Article I**: Library-First — `lib/db` → `lib/audio` → `app/` の順で実装
- **Article II**: CLI Interface — 各ライブラリに CLI を実装
- **Article III**: Test-First — 各タスクでテストを先に書く（Red-Green-Blue）
- **Article V**: Traceability — 各タスクに要件IDをマッピング
- **Article IX**: Integration-First — `fake-indexeddb` で実サービス相当のテスト

### スプリント構成

| スプリント | 内容 | タスク数 |
|-----------|------|---------|
| Sprint 0 | プロジェクト基盤セットアップ | 3 |
| Sprint 1 | lib/db（データアクセス層） | 5 |
| Sprint 2 | lib/audio（音声処理層） | 6 |
| Sprint 3 | app/ UI（画面実装） | 7 |
| Sprint 4 | PWA・統合テスト・仕上げ | 4 |
| **合計** | | **25** |

---

## Sprint 0: プロジェクト基盤セットアップ

### TASK-001: Vite + React + TypeScript プロジェクト初期化

**要件**: NFR-001, NFR-002
**設計セクション**: 7. 技術スタック, 12. ディレクトリ構成

**作業内容**:

1. Vite 6 + React 19 + TypeScript 5 でプロジェクト作成
2. `tsconfig.json` の設定（strict mode, path aliases）
3. ディレクトリ構造の作成:
   ```
   lib/db/src/
   lib/db/tests/
   lib/audio/src/
   lib/audio/tests/
   app/src/pages/
   app/src/components/
   app/src/hooks/
   app/src/styles/
   app/public/icons/
   ```
4. `.gitignore` の設定

**完了条件**:
- [ ] `npm run dev` でVite開発サーバーが起動する
- [ ] TypeScript のコンパイルが成功する
- [ ] ディレクトリ構造が設計書12章に一致する

**依存タスク**: なし

---

### TASK-002: Vitest + テスト環境セットアップ

**要件**: Article III (Test-First), Article IX (Integration-First)
**設計セクション**: 7. 技術スタック

**作業内容**:

1. Vitest 3 のインストール・設定
2. `vitest.config.ts` の作成
3. `@testing-library/react` のインストール・設定
4. `fake-indexeddb` のインストール（Article IX: 仕様準拠実装）
5. テストヘルパー用の setup ファイル作成
6. サンプルテストを書いて動作確認

**完了条件**:
- [ ] `npm test` でVitestが起動する
- [ ] `fake-indexeddb` のインポートが動作する
- [ ] `@testing-library/react` のレンダリングテストが動作する

**依存タスク**: TASK-001

---

### TASK-003: Tailwind CSS + React Router セットアップ

**要件**: NFR-002, UX-001〜005
**設計セクション**: 4.4 ナビゲーション方針, 7. 技術スタック

**作業内容**:

1. Tailwind CSS 4 のインストール・設定
2. `app/src/styles/global.css` に Tailwind directives 追加
3. React Router v7 のインストール
4. `app/src/App.tsx` に基本ルーティング設定:
   - `/` → PhraseListPage
   - `/phrases/:id/reference` → ReferenceRecordPage
   - `/phrases/:id` → PhraseDetailPage
   - `/phrases/:id/practice` → PracticeRecordPage
   - `/phrases/:id/result/:takeId` → ScoreResultPage
5. 各ページのプレースホルダーコンポーネント作成

**完了条件**:
- [ ] Tailwind のユーティリティクラスが適用される
- [ ] 全5画面のルーティングが動作する
- [ ] Mobile-first のレスポンシブ基盤（320px〜1440px）が動作する

**依存タスク**: TASK-001

---

## Sprint 1: lib/db（データアクセス層）

### TASK-010: データ型定義（Phrase, Take, Scores）

**要件**: REQ-RC-DATA-001（修正: 2層モデル）
**設計セクション**: 3.1 エンティティ定義

**作業内容**:

1. `lib/db/src/types.ts` を作成:
   ```typescript
   interface Phrase {
     id: string;              // crypto.randomUUID()
     title: string;           // デフォルト「フレーズN」、1-100文字
     referenceAudioBlob: Blob | null;
     createdAt: Date;
     updatedAt: Date;
   }

   interface Take {
     id: string;
     phraseId: string;
     audioBlob: Blob;
     pitchScore: number;      // 0-100
     rhythmScore: number;     // 0-100
     totalScore: number;      // pitchScore * 0.7 + rhythmScore * 0.3
     recordedAt: Date;
   }

   interface Scores {
     pitchScore: number;
     rhythmScore: number;
     totalScore: number;
   }
   ```
2. `lib/db/src/index.ts` から export

**完了条件**:
- [ ] 型定義が TypeScript で正しくコンパイルされる
- [ ] DJ-001（2層モデル）を反映している
- [ ] Phrase.referenceAudioBlob が `Blob | null`

**依存タスク**: TASK-001

---

### TASK-011: IndexedDB スキーマ定義

**要件**: REQ-RC-DATA-002
**設計セクション**: 3.2 IndexedDB スキーマ

**作業内容**:

1. `idb` ライブラリのインストール
2. `lib/db/src/schema.ts` を作成:
   - `RiffCardDB` インターフェース（`idb` の `DBSchema` 拡張）
   - `phrases` ストア: key=id, indexes=`by-created`
   - `takes` ストア: key=id, indexes=`by-phrase`, `by-recorded`
   - DB名 `riffcard-db`、バージョン 1
3. DB 初期化関数 `openDB()` の実装

**完了条件**:
- [ ] `idb` の `DBSchema` に準拠している
- [ ] `phrases` と `takes` の2テーブル構成
- [ ] インデックスが正しく定義されている

**依存タスク**: TASK-010

---

### TASK-012: PhraseRepository 実装（テスト先行）

**要件**: REQ-RC-DATA-002, DATA-003(修正), DATA-004(修正), DATA-005(修正), REC-006
**設計セクション**: 3.3 リポジトリ設計, 3.4 カスケード削除

**作業内容**:

1. **テスト作成（Red）**: `lib/db/tests/phrase-repository.test.ts`
   - `create()`: デフォルト名（「フレーズN」）で作成されること
   - `getAll()`: 全Phrase取得、createdAt降順
   - `getById()`: ID指定で1件取得
   - `updateTitle()`: タイトル更新
   - `updateReference()`: お手本音声Blob更新
   - `delete()`: Phrase + 配下Take全削除（カスケード）
   - テスト環境: `fake-indexeddb`

2. **実装（Green）**: `lib/db/src/repository.ts`
   - `PhraseRepository` クラス
   - `generateDefaultTitle()`: 「フレーズN」生成（DJ-003）
   - カスケード削除: IndexedDB トランザクション内で実行

3. **リファクタ（Blue）**: 必要に応じて整理

**完了条件**:
- [ ] 全テストケースが Green
- [ ] `create()` がデフォルト名「フレーズN」で即作成する（DJ-003）
- [ ] `delete()` がカスケード削除する（DATA-005 修正版）
- [ ] `updateReference()` がお手本音声を保存/上書きする（REC-006）

**依存タスク**: TASK-011

---

### TASK-013: TakeRepository 実装（テスト先行）

**要件**: REQ-RC-DATA-002, REC-005, PITCH-003
**設計セクション**: 3.3 リポジトリ設計

**作業内容**:

1. **テスト作成（Red）**: `lib/db/tests/take-repository.test.ts`
   - `create()`: phraseId, audioBlob, scores から Take 作成
   - `getByPhraseId()`: phraseId で絞り込み、recordedAt 降順
   - `getById()`: ID指定で1件取得
   - `getBestScore()`: phraseId の最高 totalScore
   - totalScore 計算: `pitchScore * 0.7 + rhythmScore * 0.3`

2. **実装（Green）**: `lib/db/src/repository.ts` に追加
   - `TakeRepository` クラス

3. **リファクタ（Blue）**: 必要に応じて整理

**完了条件**:
- [ ] 全テストケースが Green
- [ ] `create()` で totalScore が自動計算される
- [ ] `getByPhraseId()` が recordedAt 降順で返す
- [ ] `getBestScore()` が最高スコアを返す（Take なし → null）

**依存タスク**: TASK-011

---

### TASK-014: lib/db CLI 実装

**要件**: Article II (CLI Interface)
**設計セクション**: 6.2 CLI インターフェース

**作業内容**:

1. `lib/db/cli.ts` を作成:
   ```bash
   npx tsx lib/db/cli.ts list-phrases
   npx tsx lib/db/cli.ts create-phrase
   npx tsx lib/db/cli.ts delete-phrase --id <uuid>
   ```
2. Node.js 環境で `fake-indexeddb` をバックエンドとして使用（ADR-009）
3. `--help` フラグでヘルプ表示
4. 終了コード規約: 0=成功, 1=エラー

**完了条件**:
- [ ] 3つのコマンドが正常動作する
- [ ] `--help` でヘルプが表示される
- [ ] エラー時に非ゼロ終了コードを返す

**依存タスク**: TASK-012, TASK-013

---

## Sprint 2: lib/audio（音声処理層）

### TASK-020: 音声処理型定義

**要件**: REQ-RC-PITCH-001〜006
**設計セクション**: 5.2 ピッチ分析パイプライン, 5.3 スコア計算詳細

**作業内容**:

1. `lib/audio/src/types.ts` を作成:
   ```typescript
   interface PitchFrame {
     time: number;        // 秒
     frequency: number;   // Hz (0 = 無音)
     midi: number;        // MIDI ノート番号
     clarity: number;     // 検出信頼度 0-1
   }

   interface AnalysisResult {
     pitchFrames: PitchFrame[];
     onsets: number[];    // オンセット時刻（秒）
     duration: number;    // 総時間（秒）
   }

   interface Scores {
     pitchScore: number;
     rhythmScore: number;
     totalScore: number;
   }
   ```
2. `lib/audio/src/errors.ts` を作成:
   - `MicPermissionError`
   - `RecordingError`
   - `AnalysisError`
3. `lib/audio/src/index.ts` から export

**完了条件**:
- [ ] 型定義が TypeScript で正しくコンパイルされる
- [ ] エラー型が適切に定義されている

**依存タスク**: TASK-001

---

### TASK-021: DTW（Dynamic Time Warping）実装（テスト先行）

**要件**: REQ-RC-PITCH-003, PITCH-004
**設計セクション**: 5.3 スコア計算詳細, ADR-004

**作業内容**:

1. **テスト作成（Red）**: `lib/audio/tests/dtw.test.ts`
   - 同一系列 → 距離 0
   - 長さが異なる系列のアライメント
   - 既知の入力に対する期待アライメント結果
   - エッジケース: 空配列、1要素

2. **実装（Green）**: `lib/audio/src/dtw.ts`
   - `alignByDTW(ref: number[], prac: number[]): [number, number][]`
   - O(n²) の標準的な DTW 実装
   - コスト関数: ユークリッド距離

3. **リファクタ（Blue）**: 必要に応じて整理

**完了条件**:
- [ ] 全テストケースが Green
- [ ] 〜100フレーム程度で問題なく動作する
- [ ] アライメント結果が [refValue, pracValue][] の形式

**依存タスク**: TASK-020

---

### TASK-022: スコア計算ロジック実装（テスト先行）

**要件**: REQ-RC-PITCH-003, PITCH-004
**設計セクション**: 5.3 スコア計算詳細

**作業内容**:

1. **テスト作成（Red）**: `lib/audio/tests/scoring.test.ts`
   - `calcPitchScore()`:
     - 完全一致 → 100点
     - 全フレーム ±50cent 以内 → 100点
     - 半数が ±50cent 以内 → 50点
     - 全フレーム外れ → 0点
   - `calcRhythmScore()`:
     - 全オンセット ±100ms 以内 → 100点
     - 半数が ±100ms 以内 → 50点
   - `calcTotalScore()`:
     - pitch=100, rhythm=100 → 100
     - pitch=100, rhythm=0 → 70
     - pitch=0, rhythm=100 → 30

2. **実装（Green）**: `lib/audio/src/scoring.ts`
   - `calcPitchScore(refPitches, pracPitches)`: DTW → ±50cent 判定
   - `calcRhythmScore(refOnsets, pracOnsets)`: DTW → ±100ms 判定
   - `calcTotalScore(pitchScore, rhythmScore)`: 0.7 / 0.3 重み付け

3. **リファクタ（Blue）**: 必要に応じて整理

**完了条件**:
- [ ] 全テストケースが Green
- [ ] ±50cent 判定が正しい（PITCH-004）
- [ ] totalScore = pitchScore * 0.7 + rhythmScore * 0.3（PITCH-003）
- [ ] スコアが 0-100 の範囲

**依存タスク**: TASK-021

---

### TASK-023: ピッチ分析エンジン実装（テスト先行）

**要件**: REQ-RC-PITCH-001, PITCH-002, PITCH-006
**設計セクション**: 5.2 ピッチ分析パイプライン

**作業内容**:

1. **テスト作成（Red）**: `lib/audio/tests/analyzer.test.ts`
   - MIDI 変換: `freq2midi(440)` → 69
   - MIDI 変換: `freq2midi(880)` → 81
   - 範囲フィルタ: 80Hz 未満、1000Hz 超を除外
   - 合成テストデータ（既知の周波数サイン波）で分析精度を検証

2. **実装（Green）**: `lib/audio/src/analyzer.ts`
   - `Pitchy` ライブラリのインストール
   - `analyzeAudio(audioBlob: Blob): Promise<AnalysisResult>`
     - OfflineAudioContext で Blob をデコード（PITCH-006）
     - フレーム分割: 4096 samples, 50% overlap（PITCH-001）
     - ハニング窓適用（PITCH-001）
     - Pitchy.js で基本周波数推定
     - 80-1000Hz 範囲フィルタ（PITCH-001）
     - MIDI 変換: `12 * log2(freq / 440) + 69`（PITCH-002）
   - オンセット検出: エネルギーベースの簡易実装

3. **リファクタ（Blue）**: 必要に応じて整理

**完了条件**:
- [ ] 全テストケースが Green
- [ ] FFT size = 4096, ハニング窓, 80-1000Hz 範囲（PITCH-001）
- [ ] MIDI 変換が正確（440Hz = MIDI 69）（PITCH-002）
- [ ] OfflineAudioContext で全体解析（PITCH-006）

**依存タスク**: TASK-020

---

### TASK-024: AudioRecorder ラッパー実装

**要件**: REQ-RC-REC-001, REC-002, REC-003
**設計セクション**: 5.1 録音パイプライン, ADR-003

**作業内容**:

1. `lib/audio/src/recorder.ts` を作成:
   - `requestMicPermission()`: getUserMedia でマイク権限取得（REC-001）
   - `AudioRecorderController` クラス:
     - `start()`: MediaRecorder 開始（audio/webm;codecs=opus 優先, フォールバック: audio/webm）（REC-003）
     - `stop()`: Promise<Blob> で録音データ返却
     - `getMediaStream()`: 波形表示用の MediaStream 取得
   - エラーハンドリング:
     - 権限拒否 → `MicPermissionError`（REC-002）
     - MediaRecorder 非対応 → エラーメッセージ

2. テスト: MediaRecorder はブラウザ API のため、インターフェース確認のみ

**完了条件**:
- [ ] `audio/webm;codecs=opus` を優先、フォールバックあり（ADR-003）
- [ ] 権限拒否時に `MicPermissionError` を throw（REC-002）
- [ ] `stop()` で Blob が返却される

**依存タスク**: TASK-020

---

### TASK-025: lib/audio CLI 実装

**要件**: Article II (CLI Interface)
**設計セクション**: 6.2 CLI インターフェース

**作業内容**:

1. `lib/audio/cli.ts` を作成:
   ```bash
   npx tsx lib/audio/cli.ts analyze --reference ref.webm --practice prac.webm
   npx tsx lib/audio/cli.ts score --ref-pitches ref.json --prac-pitches prac.json
   ```
2. `--help` フラグでヘルプ表示
3. 終了コード規約: 0=成功, 1=エラー
4. JSON 形式の入力（ピッチ系列）をサポート

**完了条件**:
- [ ] `score` コマンドが JSON 入力からスコア計算できる
- [ ] `--help` でヘルプが表示される
- [ ] エラー時に非ゼロ終了コードを返す

**依存タスク**: TASK-022, TASK-023

---

## Sprint 3: app/ UI（画面実装）

### TASK-030: 共通コンポーネント実装

**要件**: NFR-002
**設計セクション**: 6.5 共通コンポーネント

**作業内容**:

1. `app/src/components/BackButton.tsx`:
   - ← アイコン + ラベル
   - `useNavigate()` で戻る
2. `app/src/components/ConfirmDialog.tsx`:
   - 確認メッセージ + キャンセル/実行ボタン
   - 削除操作時に使用
3. `app/src/components/EmptyState.tsx`:
   - アイコン + メッセージ + CTA ボタン
   - フレーズ空状態で使用（UX-005）
4. 各コンポーネントのテスト

**完了条件**:
- [ ] 3コンポーネントが正常にレンダリングされる
- [ ] レスポンシブ対応（320px〜）
- [ ] テストが Green

**依存タスク**: TASK-003

---

### TASK-031: カスタムフック実装（usePhrases, usePhrase, useTakes）

**要件**: REQ-RC-DATA-002
**設計セクション**: 6.6 状態管理

**作業内容**:

1. `app/src/hooks/usePhrases.ts`:
   - `PhraseRepository.getAll()` を呼び出し
   - ローディング状態管理
   - データ変更後の再取得関数
2. `app/src/hooks/usePhrase.ts`:
   - `PhraseRepository.getById(id)` を呼び出し
3. `app/src/hooks/useTakes.ts`:
   - `TakeRepository.getByPhraseId(phraseId)` を呼び出し
4. 各フックのテスト

**完了条件**:
- [ ] 各フックが IndexedDB からデータを正しく取得する
- [ ] ローディング・エラー状態を管理している
- [ ] テストが Green

**依存タスク**: TASK-012, TASK-013, TASK-003

---

### TASK-032: S1 フレーズ一覧画面（PhraseListPage）

**要件**: REQ-RC-UX-001(修正), UX-003, UX-005(修正), DATA-003(修正), DATA-005(修正)
**設計セクション**: 4.3 S1 フレーズ一覧

**作業内容**:

1. `app/src/pages/PhraseListPage.tsx`:
   - ヘッダー:「RiffCard」
   - フレーズ一覧: `PhraseCard` コンポーネント使用
   - 空状態: `EmptyState` 表示（UX-001, UX-005）
   - FAB（+ボタン）: デフォルト名で Phrase 即作成 → S2 へ遷移（DJ-003）
2. `app/src/components/PhraseCard.tsx`:
   - フレーズ名, Best スコア表示
   - 再生ボタン（▶）、「練習する」ボタン（UX-003）
   - タップで S3 へ遷移
3. 削除機能:
   - 長押し / スワイプで削除（確認ダイアログ付き）（DATA-005）
4. テスト

**完了条件**:
- [ ] 空状態で「最初のフレーズを録音」CTA が表示される（UX-001）
- [ ] FAB タップでデフォルト名 Phrase 即作成 → S2 遷移（DJ-003）
- [ ] フレーズカードに Best スコアが表示される
- [ ] 削除で確認ダイアログ → カスケード削除（DATA-005）
- [ ] テストが Green

**依存タスク**: TASK-030, TASK-031

---

### TASK-033: useRecorder フック + WaveformVisualizer + AudioRecorder コンポーネント

**要件**: REQ-RC-REC-001, REC-002, REC-003
**設計セクション**: 6.5 共通コンポーネント

**作業内容**:

1. `app/src/hooks/useRecorder.ts`:
   - `lib/audio` の `AudioRecorderController` を制御
   - 状態: idle / requesting / recording / stopped
   - `startRecording()`, `stopRecording()`, `audioBlob` 提供
   - マイク権限エラーのハンドリング（REC-002）
2. `app/src/components/WaveformVisualizer.tsx`:
   - Canvas で波形アニメーション描画（REC-003）
   - `AnalyserNode.getByteTimeDomainData()` からリアルタイム描画
3. `app/src/components/AudioRecorder.tsx`:
   - 波形表示（WaveformVisualizer）
   - 録音タイマー表示
   - 停止ボタン
   - マイク権限エラー表示（REC-002: 設定手順ガイド）

**完了条件**:
- [ ] 録音開始 → 波形アニメーション表示 → 停止で Blob 取得
- [ ] マイク権限拒否時にガイダンス表示（REC-002）
- [ ] 録音中は視覚的インジケーター表示（REC-003）

**依存タスク**: TASK-024, TASK-003

---

### TASK-034: S2 お手本録音画面（ReferenceRecordPage）

**要件**: REQ-RC-REC-003, REC-004, DATA-004(修正), UX-002
**設計セクション**: 4.3 S2 お手本録音

**作業内容**:

1. `app/src/pages/ReferenceRecordPage.tsx`:
   - 画面遷移と同時に録音自動開始（マイク許可後即開始）（DJ-003）
   - デフォルト名表示
   - `AudioRecorder` コンポーネント使用
   - 録音停止 → `PhraseRepository.updateReference()` で保存（REC-004）
   - 保存完了 → S3 へ遷移（`{ fromRecording: true }` state 付き）
   - 成功メッセージ表示（UX-002: 「練習を始める準備ができました！」）
2. テスト

**完了条件**:
- [ ] 画面遷移で自動録音開始（DJ-003）
- [ ] 名前入力ステップなし（DJ-003）
- [ ] 停止 → IndexedDB 保存 → S3 遷移（REC-004）
- [ ] 初回録音完了メッセージ表示（UX-002）

**依存タスク**: TASK-033, TASK-031

---

### TASK-035: AudioPlayer コンポーネント + S3 フレーズ詳細画面（PhraseDetailPage）

**要件**: REQ-RC-PLAY-001, PLAY-002, PLAY-003, UX-003, REC-006
**設計セクション**: 4.3 S3 フレーズ詳細

**作業内容**:

1. `app/src/components/AudioPlayer.tsx`:
   - Blob から Audio 再生
   - 再生/一時停止ボタン（PLAY-001）
   - 再生中インジケーター
   - 再生失敗時エラー + 再録音ボタン（PLAY-003）
2. `app/src/components/TakeItem.tsx`:
   - テイク番号, スコア, 日時表示
   - ワンタップ再生（PLAY-002）
3. `app/src/pages/PhraseDetailPage.tsx`:
   - タイトル表示 + 編集ボタン（✏️ インライン編集）（DJ-003）
   - お手本再生ボタン（PLAY-001）
   - 再録音ボタン → S2 へ遷移（REC-006）
   - 「練習する」大 CTA → S4 へ遷移（UX-003）
   - テイク一覧（TakeItem）
   - 初回遷移時: お手本自動再生（DJ-002, `fromRecording` state 判定）
4. テスト

**完了条件**:
- [ ] お手本再生・一時停止が動作する（PLAY-001）
- [ ] テイクのワンタップ再生が動作する（PLAY-002）
- [ ] 再生失敗時にエラー + 再録音ボタン（PLAY-003）
- [ ] 初回遷移でお手本自動再生（DJ-002）
- [ ] タイトルインライン編集が動作する（DJ-003）
- [ ] 「練習する」ボタンが最大の CTA（UX-003）

**依存タスク**: TASK-031, TASK-033

---

### TASK-036: useAnalyzer フック + S4 練習録音画面（PracticeRecordPage）

**要件**: REQ-RC-REC-005, PITCH-006
**設計セクション**: 4.3 S4 練習録音

**作業内容**:

1. `app/src/hooks/useAnalyzer.ts`:
   - `analyzeAudio()` を呼び出し
   - 状態: idle / analyzing / done / error
   - 分析中プログレス表示（NFR-003）
2. `app/src/pages/PracticeRecordPage.tsx`:
   - 画面遷移と同時に録音自動開始
   - お手本再生ボタン（録音前に聴ける）
   - `AudioRecorder` コンポーネント使用
   - 録音停止 → 自動ピッチ分析:
     1. お手本 + 練習 Blob を `analyzeAudio()` で分析
     2. `calcPitchScore()`, `calcRhythmScore()`, `calcTotalScore()`
     3. `TakeRepository.create()` で保存
   - 分析完了 → S5 へ遷移（REC-005）
   - 分析中は「分析中...」表示
3. テスト

**完了条件**:
- [ ] 録音停止 → 分析中表示 → スコア表示の流れが自動（REC-005）
- [ ] ユーザーが手動でボタンを押す必要なし（REC-005）
- [ ] 分析中にプログレスインジケーター表示（NFR-003）

**依存タスク**: TASK-033, TASK-022, TASK-023

---

### TASK-037: ScoreDisplay + S5 スコア結果画面（ScoreResultPage）

**要件**: REQ-RC-PITCH-005, UX-004, PLAY-002
**設計セクション**: 4.3 S5 スコア結果

**作業内容**:

1. `app/src/components/ScoreDisplay.tsx`:
   - スコアを大きく表示（0-100）（PITCH-005）
   - 評価ラベル: 90↑=優秀 / 70↑=良好 / 50↑=練習中 / 50未満=がんばろう
   - ピッチ精度・リズム精度の内訳表示
2. `app/src/pages/ScoreResultPage.tsx`:
   - `ScoreDisplay` で総合スコア + 内訳表示（PITCH-005）
   - 「もう一度」ボタン → S4 へ遷移（UX-004）
   - 「録音を聴く」ボタン → AudioPlayer で再生（PLAY-002）
   - 「フレーズに戻る」ボタン → S3 へ遷移
3. テスト

**完了条件**:
- [ ] スコアが大きく表示される（PITCH-005）
- [ ] 評価ラベルが正しく表示される
- [ ] ピッチ・リズムの内訳が表示される（PITCH-005）
- [ ] 「もう一度」がメイン CTA（UX-004）
- [ ] 録音再生が動作する（PLAY-002）

**依存タスク**: TASK-031, TASK-035

---

## Sprint 4: PWA・統合テスト・仕上げ

### TASK-040: PWA 設定（manifest + Service Worker + オフライン）

**要件**: REQ-RC-PWA-001, PWA-002, PWA-003
**設計セクション**: 8. PWA 設計

**作業内容**:

1. `vite-plugin-pwa` のインストール
2. `vite.config.ts` に PWA 設定追加:
   - `registerType: 'prompt'`（PWA-003）
   - マニフェスト設定（PWA-001）:
     - name, short_name, start_url, display=standalone
     - icons (192x192, 512x512)
     - theme_color: `#e94560`, background_color: `#1a1a2e`
   - Workbox globPatterns 設定
3. `app/public/icons/` にアイコン画像配置（192, 512）
4. `app/src/hooks/useServiceWorker.ts`:
   - 更新通知制御（PWA-003）
   - トースト通知「新しいバージョンがあります [更新する]」
5. オフライン動作確認

**完了条件**:
- [ ] PWA としてインストール可能（PWA-001）
- [ ] オフラインでアプリが動作する（PWA-002）
- [ ] SW 更新時にトースト通知が表示される（PWA-003）
- [ ] Lighthouse PWA チェックをパスする

**依存タスク**: TASK-003

---

### TASK-041: エラーハンドリング統合

**要件**: REQ-RC-REC-002, PLAY-003, NFR-004
**設計セクション**: 9. エラーハンドリング設計

**作業内容**:

1. マイク権限拒否: エラー画面 + 設定手順ガイド（REC-002）
2. 録音失敗: トースト通知 + リトライ
3. 音声再生失敗: エラー表示 + 再録音ボタン（PLAY-003）
4. IndexedDB 書き込み失敗: トースト通知「保存に失敗しました」
5. ピッチ分析失敗: エラー表示 + リトライ
6. MediaRecorder 非対応: エラー画面 + Chrome 推奨ガイド（NFR-004）
7. 各エラーケースのテスト

**完了条件**:
- [ ] 全エラーケースで適切な UI フィードバックが表示される
- [ ] ユーザーが次にすべきアクションが明確
- [ ] テストが Green

**依存タスク**: TASK-034, TASK-035, TASK-036, TASK-037

---

### TASK-042: E2E フロー統合テスト

**要件**: Article III, Article V, Article IX
**設計セクション**: 4.2 画面フロー

**作業内容**:

1. メインフローの統合テスト:
   - フロー1: 空状態 → CTA タップ → Phrase 作成 → お手本録音 → フレーズ詳細
   - フロー2: フレーズ詳細 → 練習する → 録音 → スコア表示 → もう一度
   - フロー3: フレーズ詳細 → お手本再録音 → 保存 → 詳細に戻る
   - フロー4: フレーズ一覧 → 削除 → 確認 → カスケード削除
2. レスポンシブテスト:
   - 320px（iPhone SE）
   - 375px（iPhone）
   - 768px（iPad）
   - 1440px（Desktop）
3. パフォーマンス確認:
   - Lighthouse Performance ≥ 80（NFR-001）
   - FCP < 2s

**完了条件**:
- [ ] 全フローがエラーなく完走する
- [ ] 320px〜1440px でレイアウト崩れなし（NFR-002）
- [ ] Lighthouse Performance ≥ 80（NFR-001）

**依存タスク**: TASK-037, TASK-040, TASK-041

---

### TASK-043: ビルド・デプロイ準備

**要件**: REQ-RC-PWA-001, NFR-001
**設計セクション**: 2.1 System Context

**作業内容**:

1. プロダクションビルド設定確認:
   - `npm run build` で成功すること
   - バンドルサイズの確認（3秒以内ロード目標）
2. Cloudflare Pages デプロイ設定:
   - `wrangler.toml` またはダッシュボード設定
   - ビルドコマンド・出力ディレクトリ設定
3. HTTPS 配信確認（PWA-001 前提）
4. デプロイ手順書の作成

**完了条件**:
- [ ] `npm run build` が成功する
- [ ] プロダクションビルドが3秒以内にロードされる（NFR-001）
- [ ] Cloudflare Pages へのデプロイ手順が明確

**依存タスク**: TASK-042

---

## 要件トレーサビリティ（タスク → 要件）

| 要件ID | タスク | カテゴリ |
|--------|-------|---------|
| DATA-001 | TASK-010 | データモデル |
| DATA-002 | TASK-011, TASK-012, TASK-013, TASK-031 | IndexedDB 永続化 |
| DATA-003 | TASK-032 | Phrase 作成 |
| DATA-004 | TASK-034 | Phrase→録音 |
| DATA-005 | TASK-012, TASK-032 | カスケード削除 |
| REC-001 | TASK-024, TASK-033 | マイク権限 |
| REC-002 | TASK-024, TASK-033, TASK-041 | 権限拒否エラー |
| REC-003 | TASK-024, TASK-033 | 録音キャプチャ |
| REC-004 | TASK-034 | お手本保存 |
| REC-005 | TASK-036 | 練習→自動分析 |
| REC-006 | TASK-012, TASK-035 | お手本再録音 |
| PLAY-001 | TASK-035 | お手本再生 |
| PLAY-002 | TASK-035, TASK-037 | テイク再生 |
| PLAY-003 | TASK-035, TASK-041 | 再生失敗エラー |
| PITCH-001 | TASK-023 | ピッチ分析パラメータ |
| PITCH-002 | TASK-023 | MIDI 変換 |
| PITCH-003 | TASK-022 | 総合スコア計算 |
| PITCH-004 | TASK-022 | ±50cent 判定 |
| PITCH-005 | TASK-037 | スコア表示 |
| PITCH-006 | TASK-023, TASK-036 | オフライン分析 |
| PWA-001 | TASK-040, TASK-043 | PWA インストール |
| PWA-002 | TASK-040 | オフライン動作 |
| PWA-003 | TASK-040 | 更新通知 |
| UX-001 | TASK-032 | 初回 CTA |
| UX-002 | TASK-034 | 初回録音メッセージ |
| UX-003 | TASK-032, TASK-035 | ワンタップ練習 |
| UX-004 | TASK-037 | もう一度ボタン |
| UX-005 | TASK-032 | 空状態表示 |
| NFR-001 | TASK-001, TASK-042, TASK-043 | 3秒以内ロード |
| NFR-002 | TASK-003, TASK-030, TASK-042 | レスポンシブ |
| NFR-003 | TASK-036 | 5分録音対応 |
| NFR-004 | TASK-041 | ブラウザ互換 |

### カバレッジ検証

- **Phase 1 要件数**: 32
- **タスクにマッピング済み**: 32（100%） ✅
- **未マッピング要件**: 0

### 憲法準拠検証

- **Article I (Library-First)**: lib/db → lib/audio → app の順で実装 ✅
- **Article II (CLI)**: TASK-014, TASK-025 で各ライブラリに CLI 実装 ✅
- **Article III (Test-First)**: 全実装タスクでテスト先行（Red-Green-Blue） ✅
- **Article V (Traceability)**: 全32要件がタスクにマッピング済み ✅
- **Article IX (Integration-First)**: fake-indexeddb 使用、モックなし ✅

---

## 依存関係図

```
TASK-001 (Vite+React+TS)
├── TASK-002 (Vitest)
├── TASK-003 (Tailwind+Router)
│   ├── TASK-030 (共通コンポーネント)
│   │   └── TASK-032 (S1 PhraseList)
│   ├── TASK-033 (useRecorder+AudioRecorder)
│   │   ├── TASK-034 (S2 ReferenceRecord)
│   │   ├── TASK-035 (AudioPlayer+S3 PhraseDetail)
│   │   └── TASK-036 (useAnalyzer+S4 PracticeRecord)
│   └── TASK-037 (ScoreDisplay+S5 ScoreResult)
│
├── TASK-010 (types.ts)
│   └── TASK-011 (schema.ts)
│       ├── TASK-012 (PhraseRepo)
│       │   └── TASK-014 (db CLI)
│       └── TASK-013 (TakeRepo)
│           └── TASK-014 (db CLI)
│
├── TASK-020 (audio types)
│   ├── TASK-021 (DTW)
│   │   └── TASK-022 (scoring)
│   │       └── TASK-025 (audio CLI)
│   ├── TASK-023 (analyzer)
│   │   └── TASK-025 (audio CLI)
│   └── TASK-024 (recorder)
│
├── TASK-031 (hooks: usePhrases etc.)
│   ├── TASK-032 (S1)
│   ├── TASK-035 (S3)
│   └── TASK-037 (S5)
│
├── TASK-040 (PWA)
├── TASK-041 (エラーハンドリング)
├── TASK-042 (E2E テスト)
└── TASK-043 (ビルド・デプロイ)
```

---

## タスクサマリ

| タスクID | タスク名 | Sprint | 依存 | 要件数 |
|---------|---------|--------|------|-------|
| TASK-001 | Vite+React+TS 初期化 | 0 | - | 2 |
| TASK-002 | Vitest テスト環境 | 0 | 001 | - |
| TASK-003 | Tailwind+Router 設定 | 0 | 001 | 2 |
| TASK-010 | データ型定義 | 1 | 001 | 1 |
| TASK-011 | IndexedDB スキーマ | 1 | 010 | 1 |
| TASK-012 | PhraseRepository | 1 | 011 | 5 |
| TASK-013 | TakeRepository | 1 | 011 | 3 |
| TASK-014 | lib/db CLI | 1 | 012,013 | - |
| TASK-020 | 音声処理型定義 | 2 | 001 | 6 |
| TASK-021 | DTW 実装 | 2 | 020 | 2 |
| TASK-022 | スコア計算 | 2 | 021 | 2 |
| TASK-023 | ピッチ分析 | 2 | 020 | 3 |
| TASK-024 | AudioRecorder | 2 | 020 | 3 |
| TASK-025 | lib/audio CLI | 2 | 022,023 | - |
| TASK-030 | 共通コンポーネント | 3 | 003 | 1 |
| TASK-031 | カスタムフック | 3 | 012,013,003 | 1 |
| TASK-032 | S1 フレーズ一覧 | 3 | 030,031 | 5 |
| TASK-033 | useRecorder+AudioRecorder | 3 | 024,003 | 3 |
| TASK-034 | S2 お手本録音 | 3 | 033,031 | 4 |
| TASK-035 | AudioPlayer+S3 詳細 | 3 | 031,033 | 5 |
| TASK-036 | useAnalyzer+S4 練習録音 | 3 | 033,022,023 | 3 |
| TASK-037 | ScoreDisplay+S5 結果 | 3 | 031,035 | 3 |
| TASK-040 | PWA 設定 | 4 | 003 | 3 |
| TASK-041 | エラーハンドリング | 4 | 034-037 | 3 |
| TASK-042 | E2E 統合テスト | 4 | 037,040,041 | 3 |
| TASK-043 | ビルド・デプロイ | 4 | 042 | 2 |

**合計: 25タスク / 32要件 100%カバー**

---

## 参照

- 設計書: `storage/design/phase1-mvp-design.ja.md`
- 要件定義: `steering/requirements.ja.md`
- 憲法: `steering/rules/constitution.md`
- 技術スタック: `steering/tech.ja.md`
- プロダクト: `steering/product.ja.md`
- Flutter 知見: `steering/memories/flutter-learnings.md`

---

**最終更新**: 2026-02-20
**担当**: imudak / クロウ候
**MUSUBI Version**: 0.1.0
