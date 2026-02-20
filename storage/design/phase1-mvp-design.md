# RiffCard Phase 1 MVP — 設計書

**プロジェクト**: riffcard
**最終更新**: 2026-02-21
**バージョン**: 1.0
**トレーサビリティ**: REQ-RC-DATA-001〜005, REQ-RC-REC-001〜006, REQ-RC-PLAY-001〜003, REQ-RC-PITCH-001〜006, REQ-RC-PWA-001〜003, REQ-RC-UX-001〜005, REQ-RC-NFR-001〜004

---

## 1. アーキテクチャ概要

### 1.1 システム構成（C4 Level 1: Context）

```
┌─────────────┐
│   ユーザー    │
│ (スマホ/PC)  │
└──────┬──────┘
       │ HTTPS (初回ロード)
       ▼
┌──────────────┐
│ Cloudflare   │  静的ホスティング
│ Pages        │  (HTML/CSS/JS)
└──────┬───────┘
       │ Service Worker Cache
       ▼
┌──────────────────────────────┐
│        ブラウザ内              │
│  ┌──────────┐ ┌───────────┐  │
│  │ React    │ │ Service   │  │
│  │ App      │ │ Worker    │  │
│  └────┬─────┘ └───────────┘  │
│       │                      │
│  ┌────┴─────┐ ┌───────────┐  │
│  │IndexedDB │ │ Web Audio │  │
│  │(データ+  │ │ API       │  │
│  │ 音声Blob)│ │ +Pitchy   │  │
│  └──────────┘ └───────────┘  │
└──────────────────────────────┘
```

**ADR-001: サーバーレスアーキテクチャ**
- 決定: バックエンドサーバーなし、全処理をブラウザ内で完結
- 理由: プライバシー（音声データ外部送信なし）、運用コストゼロ、オフライン動作
- REQ-RC-DATA-002, REQ-RC-PWA-002

### 1.2 コンテナ構成（C4 Level 2）

| コンテナ | 技術 | 責務 |
|---------|------|------|
| React SPA | React 19 + TypeScript + Vite | UI・ルーティング・状態管理 |
| IndexedDB Store | idb (wrapper) | データ永続化（Note/Phrase/Take + 音声Blob） |
| Audio Engine | Web Audio API + Pitchy.js | 録音・ピッチ検出・スコア計算 |
| Service Worker | Workbox (Vite PWA Plugin) | キャッシュ・オフライン・更新通知 |

---

## 2. 画面設計

### 2.1 画面一覧

| # | 画面名 | パス | 概要 | 対応要件 |
|---|--------|------|------|---------|
| S1 | ホーム（ノート一覧） | `/` | ノート一覧表示。空状態ではCTA表示 | UX-005 |
| S2 | ノート詳細（フレーズ一覧） | `/notes/:noteId` | フレーズ一覧 + 練習ボタン | DATA-003 |
| S3 | お手本録音 | `/notes/:noteId/phrases/new` | フレーズ名入力 → 即録音 | DATA-004, REC-001〜004 |
| S4 | フレーズ詳細 | `/notes/:noteId/phrases/:phraseId` | お手本再生・練習ボタン・テイク一覧 | PLAY-001, UX-003 |
| S5 | 練習録音 | `/notes/:noteId/phrases/:phraseId/practice` | 録音中画面 | REC-005 |
| S6 | スコア結果 | `/notes/:noteId/phrases/:phraseId/result/:takeId` | スコア表示 + もう一度ボタン | PITCH-005, UX-004 |

### 2.2 画面フロー

```
[S1 ホーム] ──「ノート作成」──→ (ダイアログ) ──→ [S2 ノート詳細]
    │                                                    │
    │←──────────── 戻る ────────────────────────────────│
    │                                                    │
    │                                 「フレーズ追加」──→ [S3 お手本録音]
    │                                                    │
    │                                                    │ 録音完了
    │                                                    ▼
    │                                              [S4 フレーズ詳細]
    │                                                    │
    │                                       「練習する」──→ [S5 練習録音]
    │                                                    │
    │                                                    │ 録音停止→自動分析
    │                                                    ▼
    │                                              [S6 スコア結果]
    │                                                    │
    │                                       「もう一度」──→ [S5 練習録音]
    │                                       「戻る」────→ [S4 フレーズ詳細]
```

### 2.3 各画面の詳細

#### S1: ホーム（ノート一覧）

```
┌─────────────────────────┐
│  🎵 RiffCard            │
├─────────────────────────┤
│                         │
│  ┌───────────────────┐  │
│  │ 🎤 Lemon - 米津   │  │
│  │    3 フレーズ      │  │
│  └───────────────────┘  │
│  ┌───────────────────┐  │
│  │ 🎤 残酷な天使      │  │
│  │    1 フレーズ      │  │
│  └───────────────────┘  │
│                         │
│         [ + ノート作成 ] │
└─────────────────────────┘
```

**空状態（UX-005）:**
```
┌─────────────────────────┐
│  🎵 RiffCard            │
├─────────────────────────┤
│                         │
│     🎤                  │
│  練習したい曲を          │
│  追加しましょう          │
│                         │
│  [ 最初のノートを作成 ]   │
│                         │
└─────────────────────────┘
```

- ノート作成: インラインダイアログ（タイトルのみ入力→即作成）
- ノート長押し/スワイプ: 削除（確認ダイアログ付き, DATA-005）

#### S2: ノート詳細（フレーズ一覧）

```
┌─────────────────────────┐
│ ← Lemon - 米津玄師      │
├─────────────────────────┤
│                         │
│  ┌───────────────────┐  │
│  │ サビ高音部分       │  │
│  │ Best: 87点         │  │
│  │        [ 練習する ] │  │
│  └───────────────────┘  │
│  ┌───────────────────┐  │
│  │ Aメロ出だし        │  │
│  │ Best: --点         │  │
│  │        [ 練習する ] │  │
│  └───────────────────┘  │
│                         │
│      [ + フレーズ追加 ]  │
└─────────────────────────┘
```

- 各フレーズカードに「練習する」ボタン → S5へ直行（UX-003）
- カードタップ → S4（フレーズ詳細）
- フレーズ追加 → S3（お手本録音）

#### S3: お手本録音

```
┌─────────────────────────┐
│ ← お手本を録音           │
├─────────────────────────┤
│                         │
│  フレーズ名:             │
│  ┌───────────────────┐  │
│  │ サビ高音部分       │  │
│  └───────────────────┘  │
│                         │
│        ◉               │
│   [ 🔴 録音開始 ]       │
│                         │
│  ~~~波形アニメーション~~~ │
│                         │
│      00:03              │
│   [ ⏹ 録音停止 ]        │
│                         │
└─────────────────────────┘
```

- フレーズ名入力 → 録音ボタンで即開始（DATA-004）
- 録音中は波形アニメーション表示（REC-003）
- 停止 → IndexedDB保存 → S4へ遷移（REC-004）

#### S4: フレーズ詳細

```
┌─────────────────────────┐
│ ← サビ高音部分           │
├─────────────────────────┤
│                         │
│  お手本:                 │
│  [▶ 再生] [🔄 再録音]    │
│                         │
│  ━━━━━━━━━━━━━━━━━━━━  │
│                         │
│  [ 🎤 練習する ]         │  ← 大きなCTA
│                         │
│  ━━━━━━━━━━━━━━━━━━━━  │
│                         │
│  練習履歴:               │
│  #3  82点  2/21 14:30   │
│  #2  75点  2/21 14:28   │
│  #1  68点  2/21 14:25   │
│                         │
└─────────────────────────┘
```

- お手本再生（PLAY-001）
- 再録音ボタン（REC-006）
- 「練習する」が最大のCTA（UX-003）
- テイク一覧: タップで音声再生（PLAY-002）

#### S5: 練習録音

```
┌─────────────────────────┐
│ ← 練習中                 │
├─────────────────────────┤
│                         │
│     サビ高音部分         │
│                         │
│  [▶ お手本を聴く]        │
│                         │
│        ◉               │
│  ~~~波形アニメーション~~~ │
│                         │
│      00:05              │
│   [ ⏹ 録音停止 ]        │
│                         │
└─────────────────────────┘
```

- 録音開始は画面遷移と同時に自動開始（マイク許可済みの場合）
- お手本再生ボタンあり（録音前に聴ける）
- 停止 → 自動でピッチ分析 → S6へ（REC-005）

#### S6: スコア結果

```
┌─────────────────────────┐
│ ← 結果                  │
├─────────────────────────┤
│                         │
│        87               │
│       点                │
│     優秀！ 🎉           │
│                         │
│  ピッチ精度:  91点       │
│  リズム精度:  78点       │
│                         │
│  ━━━━━━━━━━━━━━━━━━━━  │
│                         │
│  [ 🎤 もう一度 ]        │  ← メインCTA
│  [▶ 録音を聴く]          │
│  [ ← フレーズに戻る ]    │
│                         │
└─────────────────────────┘
```

- スコアを大きく表示（PITCH-005）
- 評価ラベル: 90↑=優秀🎉 / 70↑=良好👍 / 50↑=練習中💪 / 50未満=がんばろう🔥
- 「もう一度」がメインCTA（UX-004）
- 録音再生可能（PLAY-002）

### 2.4 ナビゲーション方針

- **SPA（Single Page Application）**: React Router v7でクライアントサイドルーティング
- **戻るボタン**: 全画面に左上の←で親画面へ
- **ブラウザ戻る対応**: History APIで自然なブラウザバック
- **タブバーなし**: 階層が浅いのでスタックナビゲーションのみ

---

## 3. データ設計

### 3.1 IndexedDB スキーマ

**ADR-002: idb ラッパー使用**
- 決定: IndexedDB直接操作ではなく `idb` ライブラリを使用
- 理由: Promise API、型安全、ボイラープレート削減
- Article VIII準拠: idbは薄いPromiseラッパーであり、独自抽象化ではない

```typescript
// lib/db/src/schema.ts

interface RiffCardDB extends DBSchema {
  notes: {
    key: string;           // UUID
    value: Note;
    indexes: {
      'by-created': Date;
    };
  };
  phrases: {
    key: string;           // UUID
    value: Phrase;
    indexes: {
      'by-note': string;   // noteId
      'by-created': Date;
    };
  };
  takes: {
    key: string;           // UUID
    value: Take;
    indexes: {
      'by-phrase': string;  // phraseId
      'by-recorded': Date;
    };
  };
}
```

### 3.2 エンティティ定義

```typescript
// lib/db/src/types.ts

// REQ-RC-DATA-001
interface Note {
  id: string;              // UUID v4
  title: string;           // 1-100文字
  createdAt: Date;
  updatedAt: Date;
}

interface Phrase {
  id: string;              // UUID v4
  noteId: string;          // FK → Note.id
  title: string;           // 1-100文字
  referenceAudioBlob: Blob | null;  // お手本音声（opus/webm）
  createdAt: Date;
  updatedAt: Date;
}

interface Take {
  id: string;              // UUID v4
  phraseId: string;        // FK → Phrase.id
  audioBlob: Blob;         // 練習音声（opus/webm）
  pitchScore: number;      // 0-100
  rhythmScore: number;     // 0-100
  totalScore: number;      // pitchScore * 0.7 + rhythmScore * 0.3
  recordedAt: Date;
}
```

### 3.3 リポジトリ設計

```typescript
// lib/db/src/repository.ts

// REQ-RC-DATA-002: IndexedDBによるCRUD
interface NoteRepository {
  getAll(): Promise<Note[]>;
  getById(id: string): Promise<Note | undefined>;
  create(title: string): Promise<Note>;
  delete(id: string): Promise<void>;  // カスケード削除（DATA-005）
}

interface PhraseRepository {
  getByNoteId(noteId: string): Promise<Phrase[]>;
  getById(id: string): Promise<Phrase | undefined>;
  create(noteId: string, title: string): Promise<Phrase>;
  updateReference(id: string, blob: Blob): Promise<void>;  // REC-006
  delete(id: string): Promise<void>;  // カスケード削除
}

interface TakeRepository {
  getByPhraseId(phraseId: string): Promise<Take[]>;
  getById(id: string): Promise<Take | undefined>;
  create(phraseId: string, audioBlob: Blob, scores: Scores): Promise<Take>;
  getBestScore(phraseId: string): Promise<number | null>;
}
```

### 3.4 カスケード削除（REQ-RC-DATA-005）

```
Note削除 → 該当Noteの全Phrase取得
         → 各PhraseのTake全削除
         → Phrase全削除
         → Note削除
         ※ トランザクション内で実行
```

---

## 4. 音声処理アーキテクチャ

### 4.1 録音パイプライン

```
マイク → getUserMedia → MediaStream
                          │
                    MediaRecorder
                    (audio/webm;codecs=opus)
                          │
                     ondataavailable
                          │
                      Blob → IndexedDB保存
```

**ADR-003: MediaRecorder + opus/webm**
- 決定: opus/webm をプライマリ、webm をフォールバック
- 理由: 高圧縮・高品質、Chrome/Firefox/Edge標準対応
- Safari対応: iOS 14.3+ で MediaRecorder 対応済み。非対応時はエラーガイダンス表示（REC-002）

### 4.2 ピッチ分析パイプライン（オフライン）

```
音声Blob
  │
  ▼
OfflineAudioContext  ← REQ-RC-PITCH-006
  │ decodeAudioData
  ▼
AudioBuffer (PCM, 44.1kHz)
  │
  ▼
フレーム分割 (4096 samples, 50% overlap)
  │
  ▼
各フレームに対して:
  ├─ ハニング窓適用
  ├─ Pitchy.js で基本周波数推定
  ├─ 80-1000Hz 範囲フィルタ  ← REQ-RC-PITCH-001
  └─ MIDI変換: 12*log2(f/440)+69  ← REQ-RC-PITCH-002
  │
  ▼
ピッチ系列 [f1, f2, f3, ...]
  │
  ├─→ お手本ピッチ系列と比較 → pitchScore (±50cent判定)  ← REQ-RC-PITCH-004
  └─→ お手本リズム系列と比較 → rhythmScore
  │
  ▼
totalScore = pitchScore * 0.7 + rhythmScore * 0.3  ← REQ-RC-PITCH-003
```

### 4.3 スコア計算詳細

#### ピッチスコア（70%重み）

```typescript
// lib/audio/src/scoring.ts

function calcPitchScore(refPitches: number[], pracPitches: number[]): number {
  // DTW（Dynamic Time Warping）でアライメント
  const aligned = alignByDTW(refPitches, pracPitches);

  // 各フレームのセント差を計算
  const centDiffs = aligned.map(([ref, prac]) =>
    1200 * Math.log2(prac / ref)
  );

  // ±50cent以内を「正確」とカウント（REQ-RC-PITCH-004）
  const accurateCount = centDiffs.filter(d => Math.abs(d) <= 50).length;

  return Math.round((accurateCount / centDiffs.length) * 100);
}
```

#### リズムスコア（30%重み）

```typescript
function calcRhythmScore(refOnsets: number[], pracOnsets: number[]): number {
  // オンセット検出（音の立ち上がり時刻）を比較
  // DTWアライメント後、時間差の平均を元にスコア化
  // ±100ms以内を「正確」とカウント
  const aligned = alignByDTW(refOnsets, pracOnsets);
  const timeDiffs = aligned.map(([r, p]) => Math.abs(p - r));
  const accurateCount = timeDiffs.filter(d => d <= 0.1).length; // 100ms
  return Math.round((accurateCount / timeDiffs.length) * 100);
}
```

**ADR-004: DTW（Dynamic Time Warping）使用**
- 決定: テンポの揺れを吸収するためDTWでアライメント
- 理由: 練習テイクはお手本と完全に同じテンポにならない。固定オフセットでは不正確
- 実装: 軽量DTW（`dtw-ts`等の既存ライブラリまたは自前実装、〜100フレーム程度なのでO(n²)で十分）

### 4.4 音声処理ライブラリ構成

```
lib/audio/
├── src/
│   ├── index.ts          # Public API
│   ├── types.ts          # AudioAnalysisResult, Scores等
│   ├── recorder.ts       # MediaRecorder ラッパー
│   ├── analyzer.ts       # OfflineAudioContext + Pitchy.js
│   ├── scoring.ts        # ピッチ/リズムスコア計算
│   ├── dtw.ts            # Dynamic Time Warping
│   └── errors.ts         # MicPermissionError等
├── tests/
│   ├── recorder.test.ts
│   ├── analyzer.test.ts
│   ├── scoring.test.ts
│   └── dtw.test.ts
└── package.json
```

---

## 5. コンポーネント設計

### 5.1 コンポーネントツリー

```
App
├── Layout（ヘッダー + コンテンツ領域）
│
├── HomePage (S1)
│   ├── NoteList
│   │   └── NoteCard (title, phraseCount)
│   ├── EmptyState (UX-005)
│   └── CreateNoteDialog
│
├── NoteDetailPage (S2)
│   ├── PhraseList
│   │   └── PhraseCard (title, bestScore, practiceButton)
│   └── AddPhraseButton
│
├── ReferenceRecordPage (S3)
│   ├── PhraseNameInput
│   └── AudioRecorder (波形表示, 録音/停止ボタン)
│
├── PhraseDetailPage (S4)
│   ├── ReferencePlayer (再生/再録音)
│   ├── PracticeButton (大CTA)
│   └── TakeList
│       └── TakeItem (score, date, playButton)
│
├── PracticeRecordPage (S5)
│   ├── ReferencePlayButton
│   └── AudioRecorder (波形表示, 停止ボタン)
│
└── ScoreResultPage (S6)
    ├── ScoreDisplay (totalScore, label, emoji)
    ├── ScoreBreakdown (pitch, rhythm)
    ├── RetryButton (もう一度)
    └── PlaybackButton (録音を聴く)
```

### 5.2 共通コンポーネント

| コンポーネント | 責務 | 使用箇所 |
|--------------|------|---------|
| `AudioRecorder` | 録音UI（波形・タイマー・開始/停止） | S3, S5 |
| `AudioPlayer` | 再生UI（再生/一時停止・プログレス） | S4, S6 |
| `WaveformVisualizer` | Canvas波形アニメーション | AudioRecorder内 |
| `ConfirmDialog` | 確認ダイアログ | 削除操作 |
| `BackButton` | ←戻るボタン | 全画面ヘッダー |

### 5.3 状態管理

**ADR-005: React標準（useState/useContext）のみ**
- 決定: Redux/Zustand等の外部状態管理ライブラリ不使用
- 理由: 画面間で共有する状態がほぼない（各画面がIndexedDBから直接取得）。Article VIII準拠
- パターン: 各Pageコンポーネントが `useEffect` でIndexedDBからデータ取得

```typescript
// カスタムフック
useNotes()          → NoteRepository.getAll()
useNote(id)         → NoteRepository.getById(id)
usePhrases(noteId)  → PhraseRepository.getByNoteId(noteId)
usePhrase(id)       → PhraseRepository.getById(id)
useTakes(phraseId)  → TakeRepository.getByPhraseId(phraseId)
useRecorder()       → MediaRecorder制御（start/stop/blob）
useAnalyzer()       → ピッチ分析実行（blob → scores）
```

---

## 6. ディレクトリ構成

```
riffcard/
├── lib/                          # Article I: Library-First
│   ├── db/                       # データアクセス層
│   │   ├── src/
│   │   │   ├── index.ts          # Public API
│   │   │   ├── schema.ts         # IndexedDB スキーマ定義
│   │   │   ├── types.ts          # Note, Phrase, Take 型
│   │   │   ├── repository.ts     # CRUD操作
│   │   │   └── errors.ts
│   │   ├── tests/
│   │   │   └── repository.test.ts
│   │   └── cli.ts                # Article II: CLI
│   │
│   └── audio/                    # 音声処理層
│       ├── src/
│       │   ├── index.ts
│       │   ├── types.ts
│       │   ├── recorder.ts       # MediaRecorder
│       │   ├── analyzer.ts       # OfflineAudioContext + Pitchy
│       │   ├── scoring.ts        # スコア計算
│       │   ├── dtw.ts            # Dynamic Time Warping
│       │   └── errors.ts
│       ├── tests/
│       │   ├── analyzer.test.ts
│       │   ├── scoring.test.ts
│       │   └── dtw.test.ts
│       └── cli.ts                # Article II: CLI
│
├── app/                          # Reactアプリケーション
│   ├── src/
│   │   ├── main.tsx              # エントリポイント
│   │   ├── App.tsx               # ルーティング
│   │   ├── pages/
│   │   │   ├── HomePage.tsx
│   │   │   ├── NoteDetailPage.tsx
│   │   │   ├── ReferenceRecordPage.tsx
│   │   │   ├── PhraseDetailPage.tsx
│   │   │   ├── PracticeRecordPage.tsx
│   │   │   └── ScoreResultPage.tsx
│   │   ├── components/
│   │   │   ├── AudioRecorder.tsx
│   │   │   ├── AudioPlayer.tsx
│   │   │   ├── WaveformVisualizer.tsx
│   │   │   ├── NoteCard.tsx
│   │   │   ├── PhraseCard.tsx
│   │   │   ├── TakeItem.tsx
│   │   │   ├── ScoreDisplay.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   ├── ConfirmDialog.tsx
│   │   │   └── BackButton.tsx
│   │   ├── hooks/
│   │   │   ├── useNotes.ts
│   │   │   ├── usePhrases.ts
│   │   │   ├── useTakes.ts
│   │   │   ├── useRecorder.ts
│   │   │   └── useAnalyzer.ts
│   │   └── styles/
│   │       └── global.css
│   ├── public/
│   │   ├── manifest.json
│   │   └── icons/
│   └── index.html
│
├── storage/                      # SDD成果物
│   ├── specs/
│   ├── design/
│   ├── tasks/
│   ├── changes/
│   └── validation/
│
├── steering/                     # プロジェクトメモリ
├── package.json
├── tsconfig.json
├── vite.config.ts
└── vitest.config.ts
```

---

## 7. 技術スタック確定

| 領域 | ライブラリ | バージョン | 理由 |
|------|-----------|-----------|------|
| UI | React | 19.x | 標準的、エコシステム充実 |
| 言語 | TypeScript | 5.x | 型安全 |
| ビルド | Vite | 6.x | 高速、PWAプラグイン対応 |
| ルーティング | React Router | 7.x | SPA標準 |
| DB | idb | 8.x | IndexedDB Promise wrapper |
| ピッチ検出 | Pitchy | 4.x | 軽量、Web Audio API統合 |
| PWA | vite-plugin-pwa | 0.21.x | Workbox統合、自動SW生成 |
| テスト | Vitest | 3.x | Vite統合、高速 |
| UIテスト | @testing-library/react | 16.x | 標準 |
| CSS | Tailwind CSS | 4.x | ユーティリティファースト、高速開発 |
| ID生成 | crypto.randomUUID() | (標準API) | 依存なし |

**ADR-006: Tailwind CSS採用**
- 決定: CSS-in-JSではなくTailwind CSSを使用
- 理由: ゼロランタイム、ビルドサイズ最小、Viteとの相性良好

---

## 8. PWA設計

### 8.1 Service Worker戦略

```typescript
// vite.config.ts
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'prompt',  // REQ-RC-PWA-003: 手動更新
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: []  // 外部APIなし
      },
      manifest: {
        name: 'RiffCard - 歌練習アプリ',
        short_name: 'RiffCard',
        start_url: '/',
        display: 'standalone',
        background_color: '#1a1a2e',
        theme_color: '#e94560',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      }
    })
  ]
});
```

### 8.2 更新通知（REQ-RC-PWA-003）

```typescript
// app/src/hooks/useServiceWorker.ts
// registerType: 'prompt' により、更新検出時にコールバック
// → トースト通知「新しいバージョンがあります [更新する]」
```

---

## 9. エラーハンドリング設計

| エラー種別 | 対応要件 | UI表現 |
|-----------|---------|--------|
| マイク権限拒否 | REC-002 | エラー画面 + 設定手順ガイド |
| 録音失敗 | REC-003 | トースト通知 + リトライボタン |
| 音声再生失敗 | PLAY-003 | エラー表示 + 再録音ボタン |
| IndexedDB書き込み失敗 | DATA-002 | トースト通知（「保存に失敗しました」） |
| ピッチ分析失敗 | PITCH-006 | エラー表示 + リトライボタン |
| Safari MediaRecorder非対応 | NFR-004 | エラー画面 + Chrome推奨ガイド |

---

## 10. 要件トレーサビリティマトリクス

| 要件ID | 設計セクション | コンポーネント/ファイル |
|-------|--------------|---------------------|
| DATA-001 | 3.2 エンティティ定義 | lib/db/src/types.ts |
| DATA-002 | 3.1 IndexedDB スキーマ | lib/db/src/schema.ts, repository.ts |
| DATA-003 | 2.3 S1 ホーム | CreateNoteDialog |
| DATA-004 | 2.3 S3 お手本録音 | ReferenceRecordPage |
| DATA-005 | 3.4 カスケード削除 | lib/db/src/repository.ts |
| REC-001 | 4.1 録音パイプライン | lib/audio/src/recorder.ts |
| REC-002 | 9 エラーハンドリング | hooks/useRecorder.ts |
| REC-003 | 4.1 録音パイプライン | AudioRecorder, WaveformVisualizer |
| REC-004 | 2.3 S3 | ReferenceRecordPage |
| REC-005 | 4.2 ピッチ分析 | PracticeRecordPage |
| REC-006 | 2.3 S4 | PhraseDetailPage |
| PLAY-001 | 2.3 S4 | AudioPlayer |
| PLAY-002 | 2.3 S4, S6 | AudioPlayer, TakeItem |
| PLAY-003 | 9 エラーハンドリング | AudioPlayer |
| PITCH-001 | 4.2 ピッチ分析 | lib/audio/src/analyzer.ts |
| PITCH-002 | 4.2 ピッチ分析 | lib/audio/src/analyzer.ts |
| PITCH-003 | 4.3 スコア計算 | lib/audio/src/scoring.ts |
| PITCH-004 | 4.3 スコア計算 | lib/audio/src/scoring.ts |
| PITCH-005 | 2.3 S6 | ScoreDisplay |
| PITCH-006 | 4.2 ピッチ分析 | lib/audio/src/analyzer.ts |
| PWA-001 | 8.1 SW戦略 | vite.config.ts, manifest.json |
| PWA-002 | 8.1 SW戦略 | vite-plugin-pwa (Workbox) |
| PWA-003 | 8.2 更新通知 | hooks/useServiceWorker.ts |
| UX-001 | 2.3 S1 空状態 | EmptyState |
| UX-002 | 2.3 S3 | ReferenceRecordPage |
| UX-003 | 2.3 S2, S4 | PhraseCard, PracticeButton |
| UX-004 | 2.3 S6 | RetryButton |
| UX-005 | 2.3 S1 空状態 | EmptyState |
| NFR-001 | 7 技術スタック | Vite + Tailwind (軽量バンドル) |
| NFR-002 | 5 コンポーネント設計 | Tailwind responsive |
| NFR-003 | 4.2 ピッチ分析 | OfflineAudioContext (非同期) |
| NFR-004 | 9 エラーハンドリング | recorder.ts フォールバック |

---

## 参照

- 要件定義: `steering/requirements.ja.md`
- プロダクト: `steering/product.ja.md`
- 技術スタック: `steering/tech.ja.md`
- 憲法: `steering/rules/constitution.md`
- 動機パターン辞典: `memory/motivation-patterns.md`
- Flutter知見: `steering/memories/flutter-learnings.md`

---

**最終更新**: 2026-02-21
**担当**: クロウ候
