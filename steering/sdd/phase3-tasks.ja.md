# RiffCard Phase 3 — タスク分解

**プロジェクト**: riffcard
**最終更新**: 2026-02-24
**バージョン**: 1.0
**ステータス**: Draft
**形式**: SDD Tasks (MUSUBI)

---

## 概要

Phase 3 設計書 (`steering/sdd/phase3-design.ja.md`) を実装タスクに分解する。

### 実装原則

- **Article I**: Library-First — `lib/audio` 拡張 → `app/` コンポーネント → 画面統合
- **Article III**: Test-First — 各タスクでテストを先に書く（Red-Green-Blue）
- **Article V**: Traceability — 各タスクに要件IDをマッピング
- **Article IX**: Integration-First — Vitest + jsdom でコンポーネント統合テスト

### スプリント構成

| スプリント | 内容 | タスク数 |
|-----------|------|---------|
| Sprint 1 | お手本 UX 改善 | 7 |
| Sprint 2 | 整えるボタン（ピッチ補正補助） | 5 |
| Sprint 3 | MIDI 正規化 | 5 |
| **合計** | | **17** |

---

## Sprint 1: お手本 UX 改善

### TASK-P3-001: midiToNoteName ユーティリティ実装

**要件**: REQ-RC-UX-006
**設計**: phase3-design.ja.md セクション 1.1 (RealTimePitchDisplay)
**層**: lib/audio

**作業内容**:

1. テストを先に書く (RED)
   ```
   lib/audio/tests/midiToNoteName.test.ts
   ```
   - `midiToNoteName(60)` → `"C4"`
   - `midiToNoteName(69)` → `"A4"`
   - `midiToNoteName(61)` → `"C#4"`
   - `midiToNoteName(0)` → `"C-1"`
   - TEST-P3-004

2. 実装 (GREEN)
   ```
   lib/audio/src/midiToNoteName.ts
   ```
   - NOTE_NAMES配列とoctave計算

3. `lib/audio/src/index.ts` からエクスポート

**完了条件**: `npm run test` 全テストパス

---

### TASK-P3-002: RealTimePitchDisplay コンポーネント実装

**要件**: REQ-RC-UX-006
**設計**: phase3-design.ja.md セクション 1.1
**層**: app/components

**作業内容**:

1. テストを先に書く (RED)
   ```
   app/src/components/__tests__/RealTimePitchDisplay.test.tsx
   ```
   - stream=null のとき "- -" を表示 (TEST-P3-005)
   - stream が渡されたとき pitch detector が起動する（モック）

2. 実装 (GREEN)
   ```
   app/src/components/RealTimePitchDisplay.tsx
   ```
   - `useEffect` で `AudioContext` + `AnalyserNode` セットアップ
   - `pitchy.PitchDetector.forFloat32Array` で検出
   - `requestAnimationFrame` ループ（クリーンアップあり）
   - 検出ピッチ → `midiToNoteName` 変換して表示

**完了条件**: テストパス、jsdom 環境で WebAudio はモック

---

### TASK-P3-003: LoopSpeedControls コンポーネント実装

**要件**: REQ-RC-PLAY-005, REQ-RC-PLAY-006
**設計**: phase3-design.ja.md セクション 1.1
**層**: app/components

**作業内容**:

1. テストを先に書く (RED)
   ```
   app/src/components/__tests__/LoopSpeedControls.test.tsx
   ```
   - ループボタンクリックで `onLoopChange(true)` が呼ばれる (TEST-P3-001)
   - 速度セレクター変更で `onPlaybackRateChange(0.5)` が呼ばれる (TEST-P3-002)

2. 実装 (GREEN)
   ```
   app/src/components/LoopSpeedControls.tsx
   ```
   - ループトグルボタン（aria-pressed）
   - 速度セレクター（`<select>`: 0.5x / 0.75x / 1.0x）

**完了条件**: テストパス、Tailwind でスタイリング

---

### TASK-P3-004: AudioPlayer に loop/playbackRate props 追加

**要件**: REQ-RC-PLAY-005, REQ-RC-PLAY-006
**設計**: phase3-design.ja.md セクション 1.1
**層**: app/components

**作業内容**:

1. 既存テスト (`AudioPlayer.test.tsx`) を確認
2. 新規テスト追加 (RED)
   - `loop=true` のとき `audioElement.loop` が true になる
   - `playbackRate=0.5` のとき `audioElement.playbackRate` が 0.5 になる

3. 実装 (GREEN): `app/src/components/AudioPlayer.tsx`
   ```typescript
   // useEffect で audio.loop, audio.playbackRate を同期
   useEffect(() => { audio.loop = loop ?? false; }, [loop]);
   useEffect(() => { audio.playbackRate = playbackRate ?? 1.0; }, [playbackRate]);
   ```

**完了条件**: 既存テストを壊さずに新規テストパス

---

### TASK-P3-005: WaveformDisplay コンポーネント実装

**要件**: REQ-RC-UX-007
**設計**: phase3-design.ja.md セクション 1.1
**層**: app/components

**作業内容**:

1. テストを先に書く (RED)
   ```
   app/src/components/__tests__/WaveformDisplay.test.tsx
   ```
   - audioBlob が変わったとき再描画フラグが変わる (TEST-P3-003)
   - audioBlob=null のとき canvas は非表示

2. 実装 (GREEN)
   ```
   app/src/components/WaveformDisplay.tsx
   ```
   - `OfflineAudioContext` で Blob デコード
   - `getChannelData(0)` でサンプル取得
   - ダウンサンプリング（200点）して `<canvas>` に描画
   - `useEffect([audioBlob])` で更新

**完了条件**: テストパス（jsdom の Canvas は `jest-canvas-mock` or `vi.mock`）

---

### TASK-P3-006: PhraseDetailPage に UX 改善 UI 統合

**要件**: REQ-RC-PLAY-005, REQ-RC-PLAY-006, REQ-RC-UX-007
**設計**: phase3-design.ja.md セクション 1.2
**層**: app/pages

**作業内容**:

1. 既存テスト (`PhraseDetailPage.test.tsx`) を確認・拡張
2. 実装: `app/src/pages/PhraseDetailPage.tsx`
   - `WaveformDisplay` を AudioPlayer 上に追加
   - `LoopSpeedControls` state を追加（loop, playbackRate）
   - `LoopSpeedControls` を AudioPlayer 下に追加
   - `loop` / `playbackRate` を `AudioPlayer` に渡す

**完了条件**: テストパス、既存動作を壊さない

---

### TASK-P3-007: ReferenceRecordPage に RealTimePitchDisplay 統合

**要件**: REQ-RC-UX-006
**設計**: phase3-design.ja.md セクション 1.2
**層**: app/pages

**作業内容**:

1. 既存テスト確認・拡張
2. 実装: `app/src/pages/ReferenceRecordPage.tsx`
   - `useAudioRecorder` から `stream` を取得（フック拡張が必要なら対応）
   - 録音中のみ `RealTimePitchDisplay` を表示
   - 停止中は非表示

**完了条件**: テストパス

---

## Sprint 2: 整えるボタン（ピッチ補正補助）

### TASK-P3-008: calcPitchOffset / formatOffset 実装

**要件**: REQ-RC-PITCH-008, REQ-RC-PITCH-010
**設計**: phase3-design.ja.md セクション 2.1
**層**: lib/audio

**作業内容**:

1. テストを先に書く (RED)
   ```
   lib/audio/tests/pitchOffset.test.ts
   ```
   - `calcPitchOffset` 中央値計算テスト (TEST-P3-006, TEST-P3-007)
   - `formatOffset(150)` → `"1.5 半音 高め"` (TEST-P3-008)
   - `formatOffset(-100)` → `"1.0 半音 低め"`

2. 実装 (GREEN)
   ```
   lib/audio/src/pitchOffset.ts
   ```
   - `calcPitchOffset(refPitches, recPitches, path): number`
   - `formatOffset(centOffset): string`

3. `lib/audio/src/index.ts` からエクスポート

**完了条件**: テストパス

---

### TASK-P3-009: calcPitchScoreWithOffset 実装

**要件**: REQ-RC-PITCH-009
**設計**: phase3-design.ja.md セクション 2.1
**層**: lib/audio

**作業内容**:

1. テストを先に書く (RED)
   ```
   lib/audio/tests/pitchOffset.test.ts に追加
   ```
   - オフセット補正後スコアが元スコアより高くなるケース (TEST-P3-009)
   - オフセット 0 のとき元スコアと同じ

2. 実装 (GREEN)
   ```
   lib/audio/src/pitchOffset.ts に追加
   ```
   - `calcPitchScoreWithOffset(refPitches, recPitches, path, offsetCent): number`

**完了条件**: テストパス

---

### TASK-P3-010: ScoreResultPage に「整える」ボタン追加

**要件**: REQ-RC-PITCH-008, REQ-RC-PITCH-009, REQ-RC-PITCH-010
**設計**: phase3-design.ja.md セクション 2.3
**層**: app/pages

**前提**: ScoreResultPage が pitchAnalysis の詳細データ（refPitches, recPitches, dtwPath）を受け取れること

**作業内容**:

1. テストを先に書く (RED)
   ```
   app/src/pages/__tests__/ScoreResultPage.test.tsx に追加
   ```
   - 「整える」ボタンをクリックすると「整えスコア」が表示される (TEST-P3-010)
   - オフセット文字列が表示される

2. 実装: `app/src/pages/ScoreResultPage.tsx`
   - `pitchOffset: number | null` state 追加
   - `adjustedPitchScore: number | null` state 追加
   - 「整える」ボタン（初回クリック後は結果表示）
   - レイアウト: 元スコア → 整えスコア → オフセット量

**完了条件**: テストパス

---

### TASK-P3-011: analyzeAudio から pitchAnalysisDetail を公開

**要件**: REQ-RC-PITCH-008, REQ-RC-PITCH-009
**設計**: phase3-design.ja.md セクション 2.1 前提
**層**: lib/audio → app/hooks

**作業内容**:

1. `lib/audio/src/index.ts` の `analyzeAudio` 戻り値に追加:
   ```typescript
   interface AudioAnalysisResult {
     pitchScore: number;
     rhythmScore: number;
     totalScore: number;
     // Phase 3 追加
     refPitches: number[];
     recPitches: number[];
     dtwPath: [number, number][];
   }
   ```

2. `useAudioAnalysis` フック（または直接渡し）を更新してページに渡す

3. 既存テストを更新（後方互換性確認）

**完了条件**: 既存テストパス、新フィールドが利用可能

---

### TASK-P3-012: Sprint 2 統合テスト・動作確認

**要件**: REQ-RC-PITCH-008〜010
**層**: app（E2E的な統合確認）

**作業内容**:

1. `npm run build` が通ること
2. ブラウザで手動確認:
   - 練習録音 → スコア画面 → 「整える」タップ → 整えスコアとオフセット表示
3. 既存スコア機能を壊していないこと

**完了条件**: ビルドパス、手動確認OK

---

## Sprint 3: MIDI 正規化

### TASK-P3-013: quantizeToMidi / compareMidi 実装

**要件**: REQ-RC-PITCH-011, REQ-RC-PITCH-012
**設計**: phase3-design.ja.md セクション 3.1
**層**: lib/audio

**作業内容**:

1. テストを先に書く (RED)
   ```
   lib/audio/tests/midiQuantize.test.ts
   ```
   - `quantizeToMidi([60.4, 60.6])` → `[60, 61]` (TEST-P3-011)
   - `compareMidi` 完全一致 → `noteMatchRate: 100` (TEST-P3-012)
   - `compareMidi` 全ずれ → `noteMatchRate: 0` (TEST-P3-013)

2. 実装 (GREEN)
   ```
   lib/audio/src/midiQuantize.ts
   ```
   - `quantizeToMidi(pitches: number[]): number[]`
   - `compareMidi(refMidi, recMidi): MidiCompareResult`
   - 既存 `alignByDTW` を流用

3. `lib/audio/src/index.ts` からエクスポート

**完了条件**: テストパス

---

### TASK-P3-014: MidiDiffChart コンポーネント実装

**要件**: REQ-RC-PITCH-013
**設計**: phase3-design.ja.md セクション 3.2
**層**: app/components

**作業内容**:

1. テストを先に書く (RED)
   ```
   app/src/components/__tests__/MidiDiffChart.test.tsx
   ```
   - diff=0 のバーが緑色を持つ (TEST-P3-014)
   - diff≠0 のバーが赤色を持つ

2. 実装 (GREEN)
   ```
   app/src/components/MidiDiffChart.tsx
   ```
   - SVG棒グラフ（Y軸 -3〜+3、X軸 時間）
   - 色分け: diff===0 → `#22c55e`、それ以外 → `#ef4444`
   - props: `noteDiffs: number[]`

**完了条件**: テストパス

---

### TASK-P3-015: ScoreResultPage に MIDI モードトグル追加

**要件**: REQ-RC-PITCH-011, REQ-RC-PITCH-012, REQ-RC-PITCH-013
**設計**: phase3-design.ja.md セクション 3.3
**層**: app/pages

**作業内容**:

1. テストを先に書く (RED)
   ```
   app/src/pages/__tests__/ScoreResultPage.test.tsx に追加
   ```
   - 「MIDIノート」タブをクリックするとノート一致率が表示される (TEST-P3-015)
   - 「セント差」タブをクリックすると PitchDeviationChart に戻る

2. 実装: `app/src/pages/ScoreResultPage.tsx`
   - `compareMode: 'cent' | 'midi'` state 追加
   - タブ UI（role="tablist"）
   - MIDIモード: `compareMidi` 呼び出し → `MidiDiffChart` + 一致率表示
   - セントモード: 既存 `PitchDeviationChart`

**完了条件**: テストパス

---

### TASK-P3-016: Sprint 3 統合テスト・動作確認

**要件**: REQ-RC-PITCH-011〜013
**層**: app

**作業内容**:

1. `npm run test` 全テストパス（Phase 3 追加分含む）
2. `npm run build` パス
3. ブラウザで手動確認:
   - スコア画面で「MIDIノート」タブ切替
   - 棒グラフの色分け確認
4. 既存セント差グラフが正常表示されること

**完了条件**: 全テストパス、ビルドパス

---

### TASK-P3-017: Phase 3 完了チェック・ドキュメント更新

**要件**: 全 Phase 3 要件
**層**: steering

**作業内容**:

1. トレーサビリティ確認（要件 ↔ テスト対応表）:
   | 要件ID | 対応テスト | 実装ファイル |
   |--------|-----------|------------|
   | PLAY-005 | TEST-P3-001 | AudioPlayer, LoopSpeedControls |
   | PLAY-006 | TEST-P3-002 | AudioPlayer, LoopSpeedControls |
   | UX-006 | TEST-P3-005 | RealTimePitchDisplay |
   | UX-007 | TEST-P3-003 | WaveformDisplay |
   | PITCH-008 | TEST-P3-006, 007 | pitchOffset.ts |
   | PITCH-009 | TEST-P3-009, 010 | pitchOffset.ts, ScoreResultPage |
   | PITCH-010 | TEST-P3-008 | formatOffset |
   | PITCH-011 | TEST-P3-011, 012 | midiQuantize.ts |
   | PITCH-012 | TEST-P3-015 | ScoreResultPage |
   | PITCH-013 | TEST-P3-014 | MidiDiffChart |

2. `steering/requirements.ja.md` の Phase 3 ステータスを Draft → Implemented に更新
3. jj git push

**完了条件**: 全チェック完了、プッシュ完了

---

## タスク一覧サマリ

| タスクID | Sprint | 内容 | 要件 |
|---------|--------|------|------|
| TASK-P3-001 | 1 | midiToNoteName ユーティリティ | UX-006 |
| TASK-P3-002 | 1 | RealTimePitchDisplay | UX-006 |
| TASK-P3-003 | 1 | LoopSpeedControls | PLAY-005, PLAY-006 |
| TASK-P3-004 | 1 | AudioPlayer loop/rate 拡張 | PLAY-005, PLAY-006 |
| TASK-P3-005 | 1 | WaveformDisplay | UX-007 |
| TASK-P3-006 | 1 | PhraseDetailPage 統合 | PLAY-005, PLAY-006, UX-007 |
| TASK-P3-007 | 1 | ReferenceRecordPage 統合 | UX-006 |
| TASK-P3-008 | 2 | calcPitchOffset / formatOffset | PITCH-008, PITCH-010 |
| TASK-P3-009 | 2 | calcPitchScoreWithOffset | PITCH-009 |
| TASK-P3-010 | 2 | ScoreResultPage 整えるボタン | PITCH-008〜010 |
| TASK-P3-011 | 2 | analyzeAudio 戻り値拡張 | PITCH-008, PITCH-009 |
| TASK-P3-012 | 2 | Sprint 2 統合確認 | PITCH-008〜010 |
| TASK-P3-013 | 3 | quantizeToMidi / compareMidi | PITCH-011, PITCH-012 |
| TASK-P3-014 | 3 | MidiDiffChart | PITCH-013 |
| TASK-P3-015 | 3 | ScoreResultPage MIDI トグル | PITCH-011〜013 |
| TASK-P3-016 | 3 | Sprint 3 統合確認 | PITCH-011〜013 |
| TASK-P3-017 | 3 | Phase 3 完了チェック | 全 Phase 3 |

---

**最終更新**: 2026-02-24
**担当**: imudak / クロウ候
**MUSUBI Version**: 0.1.0
