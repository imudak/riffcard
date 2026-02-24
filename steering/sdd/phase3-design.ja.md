# RiffCard Phase 3 — 設計書

**プロジェクト**: riffcard
**最終更新**: 2026-02-24
**バージョン**: 1.0
**ステータス**: Draft
**形式**: SDD Design (MUSUBI)

---

## 0. Phase 3 概要

Phase 3 は「練習体験の深化」フェーズ。お手本の使いやすさを上げ（Sprint 1）、
声域ズレを補正する「整える」機能を追加し（Sprint 2）、MIDI量子化で音程の
正確さを可視化する（Sprint 3）。

### 設計判断サマリ

| 判断ID | 内容 | 影響要件 |
|--------|------|---------|
| DJ-P3-001 | 整えたスコアはTakeに保存しない（参考値のみ） | PITCH-008, PITCH-009 |
| DJ-P3-002 | MIDIモードはスコア結果画面のトグルUIで切替 | PITCH-011, PITCH-012 |
| DJ-P3-003 | 波形表示はWebAudioAPI + Canvas（pitchy不使用） | UX-007 |
| DJ-P3-004 | 速度調整はHTMLAudioElement.playbackRateを使用 | PLAY-006 |

---

## 1. Sprint 1: お手本 UX 改善

### 1.1 コンポーネント設計

#### AudioPlayer 拡張 (app/src/components/AudioPlayer.tsx)

既存の `AudioPlayer` コンポーネントに以下のpropsを追加:

```typescript
interface AudioPlayerProps {
  // 既存props
  audioBlob: Blob;
  onPlayingChange?: (playing: boolean) => void;
  stopSignal?: number;
  // Phase 3 追加
  loop?: boolean;           // REQ-RC-PLAY-005
  playbackRate?: number;    // REQ-RC-PLAY-006 (0.5 | 0.75 | 1.0)
}
```

- `loop`: `HTMLAudioElement.loop = true` で実装
- `playbackRate`: `HTMLAudioElement.playbackRate` で実装

#### LoopSpeedControls (app/src/components/LoopSpeedControls.tsx) - 新規

```typescript
interface LoopSpeedControlsProps {
  loop: boolean;
  onLoopChange: (loop: boolean) => void;
  playbackRate: number;
  onPlaybackRateChange: (rate: number) => void;
}
```

UI: ループボタン（アイコン: 🔁）＋ 速度セレクター（0.5x / 0.75x / 1.0x）
配置: フレーズ詳細画面の AudioPlayer 直下

#### WaveformDisplay (app/src/components/WaveformDisplay.tsx) - 新規

```typescript
interface WaveformDisplayProps {
  audioBlob: Blob;
  height?: number; // デフォルト 60px
}
```

実装方針 (DJ-P3-003):
1. `OfflineAudioContext` で Blob をデコード
2. `AudioBuffer.getChannelData(0)` でサンプル取得
3. ダウンサンプリング（表示幅に合わせて200点程度）してCanvas描画
4. `useMemo` + `useEffect` でBlobが変わったときのみ再計算

#### RealTimePitchDisplay (app/src/components/RealTimePitchDisplay.tsx) - 新規

```typescript
interface RealTimePitchDisplayProps {
  stream: MediaStream | null; // 録音中のみ非null
}
```

実装方針 (REQ-RC-UX-006):
- `pitchy` の `PitchDetector.forFloat32Array` でリアルタイム検出
- `requestAnimationFrame` ループで更新（~30fps）
- MIDI番号 → 音名変換: `midiToNoteName(midi)` ユーティリティ

音名変換:
```typescript
const NOTE_NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
function midiToNoteName(midi: number): string {
  const octave = Math.floor(midi / 12) - 1;
  const note = NOTE_NAMES[midi % 12];
  return `${note}${octave}`;
}
```

### 1.2 画面修正

#### ReferenceRecordPage (app/src/pages/ReferenceRecordPage.tsx)

- `RealTimePitchDisplay` を追加（録音中のみ表示）
- stream は `useAudioRecorder` フックから取得

#### PhraseDetailPage (app/src/pages/PhraseDetailPage.tsx)

- `WaveformDisplay` を AudioPlayer の上に追加
- `LoopSpeedControls` を AudioPlayer の下に追加

### 1.3 データフロー

```
ReferenceRecordPage
  └─ useAudioRecorder → stream → RealTimePitchDisplay
                               → MediaRecorder (録音)

PhraseDetailPage
  ├─ WaveformDisplay ← phrase.referenceAudioBlob
  ├─ AudioPlayer ← loop, playbackRate (state)
  └─ LoopSpeedControls → onLoopChange, onPlaybackRateChange
```

---

## 2. Sprint 2: 整えるボタン（ピッチ補正補助）

### 2.1 ピッチオフセット計算ロジック (lib/audio)

#### lib/audio/src/pitchOffset.ts - 新規

```typescript
/**
 * DTWアライメント結果からピッチオフセット（セント）を計算する
 * REQ-RC-PITCH-008
 */
export function calcPitchOffset(
  refPitches: number[],   // お手本のMIDI番号列
  recPitches: number[],   // 録音のMIDI番号列
  path: [number, number][] // DTWパス
): number {
  // パス上の差分を収集
  const diffs = path.map(([i, j]) =>
    (recPitches[j] - refPitches[i]) * 100  // セント変換
  );
  // 中央値を返す（外れ値に強い）
  const sorted = [...diffs].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

/**
 * オフセット量を人間向け文字列に変換
 * REQ-RC-PITCH-010
 */
export function formatOffset(centOffset: number): string {
  const semitones = centOffset / 100;
  const abs = Math.abs(semitones);
  const dir = semitones > 0 ? '高め' : '低め';
  return `${abs.toFixed(1)} 半音 ${dir}`;
}
```

### 2.2 スコア再計算 (lib/audio)

既存の `analyzeAudio` の内部処理を切り出して `calcPitchScore` を公開:

```typescript
/**
 * オフセット補正後のピッチスコアを計算
 * REQ-RC-PITCH-009
 */
export function calcPitchScoreWithOffset(
  refPitches: number[],
  recPitches: number[],
  path: [number, number][],
  offsetCent: number
): number {
  const offsetMidi = offsetCent / 100;
  const correctedDiffs = path.map(([i, j]) =>
    Math.abs((recPitches[j] - offsetMidi) - refPitches[i]) * 100
  );
  const accurate = correctedDiffs.filter(d => d <= 50).length;
  return Math.round((accurate / path.length) * 100);
}
```

### 2.3 UI (ScoreResultPage 拡張)

```typescript
// ScoreResultPage state 追加
const [pitchOffset, setPitchOffset] = useState<number | null>(null);
const [adjustedPitchScore, setAdjustedPitchScore] = useState<number | null>(null);

// 「整える」ボタン
async function handleAdjust() {
  const offset = calcPitchOffset(refPitches, recPitches, dtwPath);
  const adjusted = calcPitchScoreWithOffset(refPitches, recPitches, dtwPath, offset);
  setPitchOffset(offset);
  setAdjustedPitchScore(adjusted);
}
```

表示レイアウト（整え後）:
```
ピッチスコア: 62 → 整えると: 78 (+16)
オフセット: +1.3 半音 高め
```

---

## 3. Sprint 3: MIDI 正規化

### 3.1 MIDI量子化ロジック (lib/audio)

#### lib/audio/src/midiQuantize.ts - 新規

```typescript
/**
 * ピッチ配列をMIDIノート番号に量子化する
 * REQ-RC-PITCH-011
 */
export function quantizeToMidi(pitches: number[]): number[] {
  return pitches.map(p => Math.round(p));  // すでにMIDI番号のため四捨五入
}

/**
 * MIDI量子化後のDTWアライメントとノート一致率計算
 */
export interface MidiCompareResult {
  noteMatchRate: number;    // 0-100 (REQ-RC-PITCH-012)
  noteDiffs: number[];      // パス上のMIDIノート差 (REQ-RC-PITCH-013)
  dtwPath: [number, number][];
}

export function compareMidi(
  refMidi: number[],
  recMidi: number[]
): MidiCompareResult {
  const qRef = quantizeToMidi(refMidi);
  const qRec = quantizeToMidi(recMidi);
  const { path } = alignByDTW(qRef, qRec);
  const diffs = path.map(([i, j]) => qRec[j] - qRef[i]);
  const matches = diffs.filter(d => d === 0).length;
  return {
    noteMatchRate: Math.round((matches / path.length) * 100),
    noteDiffs: diffs,
    dtwPath: path,
  };
}
```

### 3.2 MIDI差分グラフ (app/src/components/MidiDiffChart.tsx) - 新規

```typescript
interface MidiDiffChartProps {
  noteDiffs: number[];   // パス上のMIDIノート差
  width?: number;
  height?: number;
}
```

実装: SVG棒グラフ
- Y軸: -3〜+3 ノート（範囲外はクランプ）
- 色: diff === 0 → green (#22c55e), diff !== 0 → red (#ef4444)
- REQ-RC-PITCH-013

### 3.3 ScoreResultPage MIDI モードトグル

```typescript
// モードトグル state
const [compareMode, setCompareMode] = useState<'cent' | 'midi'>('cent');

// MIDIモード時の追加表示
{compareMode === 'midi' && midiResult && (
  <>
    <div>MIDIノート一致率: {midiResult.noteMatchRate}%</div>
    <MidiDiffChart noteDiffs={midiResult.noteDiffs} />
  </>
)}
```

UIはスコア結果画面上部にタブ切替ボタン:
```
[ セント差 | MIDIノート ]
```

---

## 4. テスト設計（Article III: Test-First）

### Sprint 1 テスト

| テストID | 対象 | 内容 |
|---------|------|------|
| TEST-P3-001 | LoopSpeedControls | ループON/OFFトグル |
| TEST-P3-002 | LoopSpeedControls | 速度セレクター変更 |
| TEST-P3-003 | WaveformDisplay | Blobが変わったとき再描画 |
| TEST-P3-004 | midiToNoteName | MIDI 60 → C4, MIDI 69 → A4 |
| TEST-P3-005 | RealTimePitchDisplay | stream=nullのとき「--」表示 |

### Sprint 2 テスト

| テストID | 対象 | 内容 |
|---------|------|------|
| TEST-P3-006 | calcPitchOffset | 中央値が正しく計算される |
| TEST-P3-007 | calcPitchOffset | 全フレーム同じ差のとき正確 |
| TEST-P3-008 | formatOffset | +150cent → "1.5 半音 高め" |
| TEST-P3-009 | calcPitchScoreWithOffset | オフセット補正後スコアが向上 |
| TEST-P3-010 | ScoreResultPage | 「整える」ボタンで整えスコア表示 |

### Sprint 3 テスト

| テストID | 対象 | 内容 |
|---------|------|------|
| TEST-P3-011 | quantizeToMidi | 60.4→60, 60.6→61 |
| TEST-P3-012 | compareMidi | 完全一致のとき100% |
| TEST-P3-013 | compareMidi | 全ノードずれのとき0% |
| TEST-P3-014 | MidiDiffChart | diff=0は緑、diff≠0は赤 |
| TEST-P3-015 | ScoreResultPage | MIDIモードトグルで表示切替 |

---

## 5. 非機能設計

### パフォーマンス
- `WaveformDisplay`: `useMemo` で200点ダウンサンプリング、`<canvas>` 描画
- `RealTimePitchDisplay`: `requestAnimationFrame` ループ、pitchy の detect は軽量
- MIDI量子化: O(n) で高速、DTWは既存実装を流用

### アクセシビリティ
- ループボタン: `aria-pressed`, `aria-label="ループ再生"`
- 速度セレクター: `<select>` ネイティブコントロール
- MIDIモードトグル: `role="tablist"` + `role="tab"`

---

## 6. 参照

- 要件定義: `steering/requirements.ja.md` (Phase 3セクション)
- タスク分解: `steering/sdd/phase3-tasks.ja.md`
- Phase 1 設計: `storage/design/phase1-mvp-design.ja.md`
- 憲法: `steering/rules/constitution.md`

---

**最終更新**: 2026-02-24
**担当**: imudak / クロウ候
**MUSUBI Version**: 0.1.0
