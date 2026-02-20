# RiffCard Phase 1 MVP — 要件定義

**プロジェクト**: riffcard
**最終更新**: 2026-02-20
**バージョン**: 1.0
**ステータス**: Approved
**形式**: EARS Requirements (MUSUBI)

---

## 概要

歌のフレーズを繰り返し練習する音楽版英単語帳PWA の Phase 1 MVP 要件。
全要件は EARS (Easy Approach to Requirements Syntax) 形式で記述。

---

## データモデル要件

### REQ-RC-DATA-001: データモデル定義

**種別**: Ubiquitous (State-Driven)
**修正**: DJ-001 により3層→2層モデルに変更

システムは Phrase → Take の2層データモデルを持つ。

- **Phrase**: id (UUID), title (1-100文字), referenceAudioBlob (Blob | null), createdAt, updatedAt
- **Take**: id (UUID), phraseId (FK→Phrase.id), audioBlob (Blob), pitchScore (0-100), rhythmScore (0-100), totalScore, recordedAt

### REQ-RC-DATA-002: IndexedDB 永続化

**種別**: Ubiquitous

システムは全データ（Phrase, Take, 音声Blob）を IndexedDB に永続化する。

### REQ-RC-DATA-003: フレーズ作成

**種別**: Event-Driven
**修正**: DJ-001, DJ-003 により Note 廃止、Phrase 即作成に変更

ユーザーが「+」ボタンまたはCTAをタップしたとき、システムはデフォルト名（「フレーズN」）で Phrase を即作成し、お手本録音画面へ遷移する。

### REQ-RC-DATA-004: フレーズ録音開始

**種別**: Event-Driven
**修正**: DJ-003 によりデフォルト名自動付与、即お手本録音開始に変更

フレーズが作成されたとき、システムはデフォルト名を自動付与し、名前入力なしで即お手本録音を開始する。

### REQ-RC-DATA-005: カスケード削除

**種別**: Event-Driven
**修正**: DJ-001 により Note→Phrase 単位に変更

ユーザーがフレーズを削除したとき、システムは該当 Phrase と配下の全 Take を IndexedDB トランザクション内で削除する。

---

## 録音要件

### REQ-RC-REC-001: マイク権限要求

**種別**: Event-Driven

録音開始時、システムは getUserMedia でマイク権限を要求する。

### REQ-RC-REC-002: マイク権限拒否エラー

**種別**: Unwanted Behavior

マイク権限が拒否された場合、システムはエラー画面と設定手順ガイドを表示する。

### REQ-RC-REC-003: 録音中の音声キャプチャ

**種別**: State-Driven

録音中、システムは MediaRecorder で音声をキャプチャし、波形アニメーションを表示する。

### REQ-RC-REC-004: お手本録音保存

**種別**: Event-Driven

録音停止時、システムは音声 Blob を IndexedDB の Phrase.referenceAudioBlob に保存し、フレーズ詳細画面へ遷移する。

### REQ-RC-REC-005: 練習録音→自動分析

**種別**: Event-Driven

練習録音停止時、システムは自動的にピッチ分析を実行し、スコアを計算して結果画面へ遷移する。ユーザーが手動でボタンを押す必要はない。

### REQ-RC-REC-006: お手本再録音

**種別**: Event-Driven

ユーザーが再録音ボタンをタップしたとき、システムはお手本録音画面へ遷移し、新しい録音で referenceAudioBlob を上書きする。

---

## 再生要件

### REQ-RC-PLAY-001: お手本再生

**種別**: Event-Driven

ユーザーが再生ボタンをタップしたとき、システムはお手本音声を再生する。

### REQ-RC-PLAY-002: テイク再生

**種別**: Event-Driven

ユーザーがテイクの再生ボタンをタップしたとき、システムは練習音声を再生する。

### REQ-RC-PLAY-003: 再生失敗エラー

**種別**: Unwanted Behavior

音声再生に失敗した場合、システムはエラー表示と再試行ボタンを表示する。

---

## ピッチ分析要件

### REQ-RC-PITCH-001: ピッチ分析パラメータ

**種別**: Ubiquitous

システムはピッチ分析において以下のパラメータを使用する:
- FFT size: 4096 samples
- ホップサイズ: 50% overlap
- ハニング窓適用
- 周波数範囲: 80-1000Hz

### REQ-RC-PITCH-002: MIDI 変換

**種別**: Ubiquitous

システムは周波数を MIDI ノート番号に変換する: `12 * log2(freq / 440) + 69`

### REQ-RC-PITCH-003: 総合スコア計算

**種別**: Ubiquitous

システムは総合スコアを `pitchScore * 0.7 + rhythmScore * 0.3` で計算する。

### REQ-RC-PITCH-004: ピッチ精度判定

**種別**: Ubiquitous

システムは DTW アライメント後、各フレームのセント差が ±50cent 以内のフレームを「正確」と判定する。

### REQ-RC-PITCH-005: スコア表示

**種別**: State-Driven

スコア結果画面で、システムは総合スコアを大きく表示し、ピッチ精度・リズム精度の内訳を表示する。
評価ラベル: 90↑=優秀 / 70↑=良好 / 50↑=練習中 / 50未満=がんばろう

### REQ-RC-PITCH-006: オフライン音声分析

**種別**: Ubiquitous

システムは OfflineAudioContext を使用してオフラインで音声全体を解析する。

---

## PWA 要件

### REQ-RC-PWA-001: PWA インストール可能

**種別**: Ubiquitous

システムは Web App Manifest を提供し、PWA としてインストール可能にする。

### REQ-RC-PWA-002: オフライン動作

**種別**: State-Driven

オフライン状態でも、システムはアプリシェルの表示とローカルデータの読み書きが可能である。

### REQ-RC-PWA-003: Service Worker 更新通知

**種別**: Event-Driven

Service Worker の更新が検出されたとき、システムはトースト通知「新しいバージョンがあります [更新する]」を表示する。

---

## UX 要件

### REQ-RC-UX-001: 初回 CTA

**種別**: State-Driven
**修正**: DJ-001 により Note 作成ステップ廃止

フレーズが0件の場合、システムは「最初のフレーズを録音」の単一 CTA を表示する。

### REQ-RC-UX-002: 初回録音完了メッセージ

**種別**: Event-Driven

初回お手本録音完了後、フレーズ詳細画面へ遷移し、お手本を自動再生する。

### REQ-RC-UX-003: ワンタップ練習開始

**種別**: Event-Driven

ユーザーが「練習する」ボタンをタップしたとき、システムは即座に練習録音画面へ遷移する。

### REQ-RC-UX-004: もう一度ボタン

**種別**: Event-Driven

スコア結果画面で、ユーザーが「もう一度」ボタンをタップしたとき、システムは練習録音画面へ遷移する。

### REQ-RC-UX-005: 空状態表示

**種別**: State-Driven
**修正**: DJ-001 により Phrase 空状態に変更

フレーズが0件の場合、システムはガイダンスメッセージと CTA を表示する。

---

## 非機能要件

### REQ-RC-NFR-001: 3秒以内ロード

**種別**: Performance

システムは初回ロードを3秒以内に完了する（Lighthouse Performance ≥ 80）。

### REQ-RC-NFR-002: レスポンシブ対応

**種別**: Ubiquitous

システムは 320px〜1440px のビューポート幅でレイアウト崩れなく表示する。

### REQ-RC-NFR-003: 5分録音対応

**種別**: Performance

5分間の録音・分析中にUIがフリーズしない。

### REQ-RC-NFR-004: ブラウザ互換性

**種別**: Unwanted Behavior

MediaRecorder 非対応ブラウザの場合、システムはエラー画面と Chrome 推奨ガイドを表示する。

---

## 要件サマリ

| カテゴリ | 要件数 | 要件ID |
|---------|--------|--------|
| データモデル | 5 | DATA-001〜005 |
| 録音 | 6 | REC-001〜006 |
| 再生 | 3 | PLAY-001〜003 |
| ピッチ分析 | 6 | PITCH-001〜006 |
| PWA | 3 | PWA-001〜003 |
| UX | 5 | UX-001〜005 |
| 非機能 | 4 | NFR-001〜004 |
| **合計** | **32** | |

---

## 設計判断による修正

| 判断ID | 内容 | 影響要件 |
|--------|------|---------|
| DJ-001 | Note層廃止、2層フラットモデル | DATA-001, DATA-003, DATA-005, UX-001, UX-005 |
| DJ-002 | 初回お手本自動再生 | UX-003, PLAY-001 |
| DJ-003 | 摩擦ゼロフレーズ作成 | DATA-004, UX-002 |

---

## 参照

- 設計書: `storage/design/phase1-mvp-design.ja.md`
- タスク分解: `storage/tasks/phase1-mvp-tasks.ja.md`
- 憲法: `steering/rules/constitution.md`

---

**最終更新**: 2026-02-20
**担当**: imudak / クロウ候
**MUSUBI Version**: 0.1.0
