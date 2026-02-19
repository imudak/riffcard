# RiffCard PWA — 要件定義（EARS形式）

**プロジェクト**: riffcard
**最終更新**: 2026-02-20
**バージョン**: 1.0
**形式**: EARS (Easy Approach to Requirements Syntax)

---

## 概要

歌のフレーズを繰り返し練習する「音楽版英単語帳」PWA。
ユーザーがお手本フレーズを録音し、練習してピッチスコアで上達を確認できる。

### フェーズ定義

| フェーズ | スコープ | 状態 |
|---------|---------|------|
| Phase 1 (MVP) | フレーズ録音→再生→ピッチスコア表示 | **対象** |
| Phase 2 | リアルタイムピッチ可視化・お手本比較 | 将来 |
| Phase 3 | ストリーク・成長グラフ | 将来 |

---

## 要件ID体系

```
REQ-RC-{カテゴリ}-{番号}
```

| カテゴリ | 略称 | 説明 |
|---------|------|------|
| データ管理 | DATA | Note/Phrase/Takeモデル |
| 録音 | REC | 録音機能（お手本・練習） |
| 再生 | PLAY | 録音再生 |
| ピッチ | PITCH | ピッチ検出・スコア計算 |
| PWA | PWA | オフライン・インストール |
| UX | UX | オンボーディング・フロー |
| P2-可視化 | VIZ | リアルタイムフィードバック（Phase 2） |
| P3-習慣化 | HAB | ストリーク・成長グラフ（Phase 3） |

---

## Phase 1 MVP — 要件

### 1. データ管理（Note → Phrase → Take）

#### REQ-RC-DATA-001
**The system SHALL** use a 3-layer data model: Note（ノートブック）→ Phrase（フレーズ）→ Take（練習テイク）.

**受入基準**:
- Note: id, title, createdAt
- Phrase: id, noteId, title, referenceAudioBlob, createdAt
- Take: id, phraseId, audioBlob, pitchScore, rhythmScore, totalScore, recordedAt

---

#### REQ-RC-DATA-002
**The system SHALL** persist all data (Note/Phrase/Take including audio blobs) in IndexedDB without requiring a backend server.

**受入基準**:
- 音声データはBlob形式でIndexedDBに保存する
- サーバー通信なしで全機能が動作する
- ページリロード後もデータが保持される

---

#### REQ-RC-DATA-003
**WHEN** a user creates a Note, **the system SHALL** require only a title and immediately save it to IndexedDB.

**受入基準**:
- タイトル入力 → 保存の2ステップ以内
- 保存後、そのNoteの画面へ遷移する

---

#### REQ-RC-DATA-004
**WHEN** a user creates a Phrase, **the system SHALL** require only a title, then immediately enter reference recording mode.

**受入基準**:
- フレーズ名を入力したら即座に録音準備状態になる
- 「迷わせない」設計（P8: フロー状態）

---

#### REQ-RC-DATA-005
**WHEN** a user deletes a Note, **the system SHALL** also delete all associated Phrases and Takes from IndexedDB.

**受入基準**:
- カスケード削除が完了する
- 削除前に確認ダイアログを表示する

---

### 2. 録音

#### REQ-RC-REC-001
**WHEN** a user initiates recording, **the system SHALL** request microphone permission using the Web APIs (`navigator.mediaDevices.getUserMedia`).

**受入基準**:
- 権限が未付与の場合、ブラウザの許可ダイアログが表示される
- 権限拒否時はエラーメッセージを表示する

---

#### REQ-RC-REC-002
**IF** microphone permission is denied, **THEN the system SHALL** display an error message with instructions to enable microphone access in browser settings.

**受入基準**:
- 「マイクへのアクセスを許可してください」等のガイダンスを表示する
- 設定画面へのリンクまたは手順を提示する

---

#### REQ-RC-REC-003
**WHILE** recording is active, **the system SHALL** capture audio using MediaRecorder API with opus/webm format.

**受入基準**:
- `audio/webm;codecs=opus` を優先、非対応ブラウザは `audio/webm` にフォールバック
- 録音中は視覚的インジケーター（波形アニメーション等）を表示する

---

#### REQ-RC-REC-004
**WHEN** reference recording is stopped, **the system SHALL** save the audio Blob to the Phrase's `referenceAudioBlob` field in IndexedDB.

**受入基準**:
- 保存完了後、フレーズ詳細画面へ遷移する
- 保存失敗時はエラーメッセージを表示する

---

#### REQ-RC-REC-005
**WHEN** a practice recording is stopped, **the system SHALL** save the audio Blob as a new Take and immediately trigger pitch analysis.

**受入基準**:
- 録音停止 → 分析中表示 → スコア表示の流れが自動で進む
- ユーザーが手動でボタンを押す必要がない

---

#### REQ-RC-REC-006
**The system SHALL** support re-recording the reference audio for an existing Phrase, replacing the previous reference.

**受入基準**:
- 「お手本を再録音」ボタンを提供する
- 旧参照音声は新しい音声で上書きされる

---

### 3. 再生

#### REQ-RC-PLAY-001
**WHEN** a user taps the play button on a Phrase, **the system SHALL** play back the reference audio.

**受入基準**:
- 再生中は一時停止ボタンを表示する
- 再生終了後は自動的に停止状態に戻る

---

#### REQ-RC-PLAY-002
**WHEN** a user taps the play button on a Take, **the system SHALL** play back the Take's recorded audio.

**受入基準**:
- TakeリストからワンタップでTake音声を再生できる
- 再生中は視覚的フィードバック（再生中インジケーター）を表示する

---

#### REQ-RC-PLAY-003
**IF** audio playback fails, **THEN the system SHALL** display an error message and offer the option to re-record.

**受入基準**:
- IndexedDBからBlob取得失敗時にエラーを表示する
- 「再録音する」ボタンを提示する

---

### 4. ピッチ検出・スコア計算

#### REQ-RC-PITCH-001
**The system SHALL** analyze pitch using Web Audio API AnalyserNode with the following parameters:
- FFT size: 4096 samples
- Window function: Hanning window
- Detection range: 80–1000 Hz
- Sample rate: 44.1 kHz

**受入基準**:
- AnalyserNodeのfftSizeを4096に設定する
- getByteTimeDomainDataまたはgetFloatTimeDomainDataで波形データを取得する
- Pitchy.jsライブラリ（または同等実装）で基本周波数を推定する

---

#### REQ-RC-PITCH-002
**The system SHALL** convert detected frequency to MIDI pitch using the formula: `MIDI = 12 * log2(freq / 440) + 69`.

**受入基準**:
- 変換結果がMIDIノート番号として正しい範囲（0-127）に収まる
- 440Hzが MIDI 69（A4）として変換される

---

#### REQ-RC-PITCH-003
**The system SHALL** calculate a total score from pitch accuracy (70%) and rhythm accuracy (30%).

**受入基準**:
- `totalScore = pitchScore * 0.7 + rhythmScore * 0.3`
- スコアは0-100の範囲で表示する

---

#### REQ-RC-PITCH-004
**The system SHALL** classify a note as "accurate" if it is within ±50 cents of the reference pitch.

**受入基準**:
- セント計算: `cents = 1200 * log2(freq_practice / freq_reference)`
- |cents| ≤ 50 の場合を「正確」とみなす

---

#### REQ-RC-PITCH-005
**WHEN** pitch analysis of a Take is complete, **the system SHALL** display the total score prominently on the result screen.

**受入基準**:
- スコアを0-100の数値で大きく表示する
- ピッチ精度とリズム精度の内訳も表示する
- 「正確」「もう少し」等の評価ラベルを付与する（例: 90↑=優秀, 70↑=良好, 50↑=練習中）

---

#### REQ-RC-PITCH-006
**WHEN** analyzing audio offline (post-recording), **the system SHALL** process the complete audio Blob via OfflineAudioContext.

**受入基準**:
- OfflineAudioContextを使用してBlobを全体解析する
- リアルタイム処理不要（Phase 1）

---

### 5. PWA基本機能

#### REQ-RC-PWA-001
**The system SHALL** be installable as a Progressive Web App on Android, iOS, and desktop browsers.

**受入基準**:
- `manifest.json` に name, short_name, icons (192x192, 512x512), start_url, display=standalone を設定する
- HTTPSで配信する（Cloudflare Pages / Vercel）

---

#### REQ-RC-PWA-002
**The system SHALL** function in offline mode after the initial load using a Service Worker.

**受入基準**:
- Service Workerがアプリシェル（HTML/CSS/JS）をキャッシュする
- オフライン時でも録音・再生・スコア表示が動作する
- IndexedDBデータはオフラインで読み書き可能

---

#### REQ-RC-PWA-003
**WHEN** a Service Worker update is available, **the system SHALL** notify the user and allow them to refresh to apply the update.

**受入基準**:
- 更新通知バナーまたはトースト通知を表示する
- ユーザーが「更新する」を選択したときのみリロードする

---

### 6. UX・オンボーディング（動機パターン対応）

#### REQ-RC-UX-001（P8: フロー状態）
**WHEN** a user opens the app for the first time, **the system SHALL** present a single call-to-action: "フレーズを録音する".

**受入基準**:
- ホーム画面に「最初のフレーズを録音」ボタンを一つだけ表示する
- 選択肢を増やして迷わせない

---

#### REQ-RC-UX-002（P3: 前払い進捗効果）
**WHEN** a user completes their first phrase reference recording, **the system SHALL** display a success message: "練習を始める準備ができました！".

**受入基準**:
- 録音完了後に達成感を演出するアニメーションまたはメッセージを表示する
- 「もう始まってる」感覚を与える

---

#### REQ-RC-UX-003（P8: フロー状態）
**WHEN** a Phrase has a reference recording, **the system SHALL** provide a one-tap "練習する" button that immediately starts recording a new Take.

**受入基準**:
- フレーズ詳細画面に「練習する」ボタンを目立たせる
- ボタンタップ → マイク許可確認（初回のみ）→ 即録音開始

---

#### REQ-RC-UX-004
**WHEN** a user views the Take result screen, **the system SHALL** display a "もう一度" button to immediately start a new Take.

**受入基準**:
- スコア表示画面に「もう一度練習する」ボタンを配置する
- ボタンタップで即座に新しい録音を開始する

---

#### REQ-RC-UX-005
**IF** no Notes exist, **THEN the system SHALL** show an empty state with a prompt to create the first Note.

**受入基準**:
- 空状態では「最初のノートを作成」CTAを表示する
- リストが空のときだけ表示し、ノートが存在する場合は非表示

---

---

## Phase 2 — 要件（将来実装）

### リアルタイムピッチ可視化

#### REQ-RC-VIZ-001
**WHILE** a Take recording is in progress, **the system SHALL** display a real-time pitch graph showing detected pitch over time.

**受入基準**:
- Canvas要素にリアルタイムで波形/ピッチ曲線を描画する
- 更新レート: 最低10fps以上

---

#### REQ-RC-VIZ-002
**WHEN** viewing a Take result, **the system SHALL** display a side-by-side pitch graph comparing the Take's pitch curve with the reference pitch curve.

**受入基準**:
- お手本曲線と練習曲線を色分けして重ねて表示する
- 正確な区間と不正確な区間を色で強調する

---

---

## Phase 3 — 要件（将来実装）

### ストリーク（P1動機）

#### REQ-RC-HAB-001
**The system SHALL** track the number of consecutive days the user has practiced (streak).

**受入基準**:
- 毎日少なくとも1回のTake録音でストリーク継続
- 最終練習日がIndexedDBに保存される

---

#### REQ-RC-HAB-002
**WHEN** a user completes a practice session, **the system SHALL** update the streak counter and display it prominently.

**受入基準**:
- ストリーク更新後にアニメーション等で祝福する
- ホーム画面に現在のストリーク日数を常時表示する

---

#### REQ-RC-HAB-003
**WHEN** a user has not practiced for more than 24 hours, **the system SHALL** reset the streak counter to 0.

**受入基準**:
- アプリ起動時に最終練習日を確認してストリークを更新する
- ストリーク切れの通知は任意（PWA通知許可が必要）

---

### 成長可視化（P13動機）

#### REQ-RC-HAB-010
**The system SHALL** maintain a score history for each Phrase, storing all Takes with their scores and timestamps.

**受入基準**:
- Takeテーブルに `recordedAt` と `totalScore` が含まれる
- 取得可能なTake数に上限を設けない（IndexedDB容量依存）

---

#### REQ-RC-HAB-011
**WHEN** viewing a Phrase, **the system SHALL** display a score trend graph showing totalScore across all Takes in chronological order.

**受入基準**:
- 折れ線グラフでスコア推移を表示する
- X軸: 練習日時, Y軸: スコア（0-100）
- 最新スコアと自己最高スコアを強調表示する

---

---

## 非機能要件

#### REQ-RC-NFR-001
**The system SHALL** load within 3 seconds on a 4G mobile connection (initial load).

**受入基準**:
- Lighthouse Performance スコア ≥ 80
- FCP (First Contentful Paint) < 2s

---

#### REQ-RC-NFR-002
**The system SHALL** be responsive and usable on screens from 320px to 1440px width.

**受入基準**:
- Mobile-first CSSで実装する
- iPhone SE（375px）でレイアウト崩れなし

---

#### REQ-RC-NFR-003
**The system SHALL** handle audio data up to 5 minutes per recording without UI freezing.

**受入基準**:
- ピッチ解析はWeb Workerまたは非同期処理で実行する
- 解析中はプログレスインジケーターを表示する

---

#### REQ-RC-NFR-004
**The system SHALL** support the latest versions of Chrome, Safari, Firefox, and Edge.

**受入基準**:
- MediaRecorder API対応ブラウザで録音機能が動作する
- Safari（iOS）ではMediaRecorderの制限に対応するフォールバックを実装する

---

## 要件トレーサビリティ

| 要件ID | 機能 | フェーズ | 動機パターン | 優先度 |
|-------|------|---------|------------|--------|
| REQ-RC-DATA-001〜005 | データモデル | Phase 1 | - | P0 |
| REQ-RC-REC-001〜006 | 録音 | Phase 1 | P3, P8 | P0 |
| REQ-RC-PLAY-001〜003 | 再生 | Phase 1 | - | P0 |
| REQ-RC-PITCH-001〜006 | ピッチ検出・スコア | Phase 1 | P13 | P0 |
| REQ-RC-PWA-001〜003 | PWA | Phase 1 | - | P0 |
| REQ-RC-UX-001〜005 | UX・オンボーディング | Phase 1 | P3, P8 | P0 |
| REQ-RC-VIZ-001〜002 | リアルタイム可視化 | Phase 2 | P13 | P1 |
| REQ-RC-HAB-001〜011 | ストリーク・成長グラフ | Phase 3 | P1, P13 | P2 |
| REQ-RC-NFR-001〜004 | 非機能要件 | Phase 1 | - | P0 |

---

## 参照

- Flutter版知見: `steering/memories/flutter-learnings.md`
- 技術スタック: `steering/tech.ja.md`
- 憲法: `steering/rules/constitution.md`
- MUSUBI手順: `~/projects/flow-manager/docs/flows/musubi.md`

---

**最終更新**: 2026-02-20
**担当**: imudak / クロウ候
