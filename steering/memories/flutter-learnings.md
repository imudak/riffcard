# Flutter版からの知見移植

## ピッチ検出パラメータ
- FFT窓サイズ: 4096サンプル
- 窓関数: ハニング窓
- 検出帯域: 80-1000Hz
- サンプリングレート: 44100Hz
- MIDI変換: 12*log2(freq/440)+69

## スコア計算
- ピッチ精度: 70%
- リズム精度: 30%
- ±50cent以内を「正確」と判定

## 録音設定
- コーデック: AAC-LC
- サンプリング: 44.1kHz
- 実機テストでの知見: iOSのマイクアクセス許可UIが遅延する場合あり

## データモデル
- Note（ノートブック）→ Phrase（フレーズ）→ Take（録音テイク）の3層
- 各TakeにスコアとタイムスタンプPhraseに「お手本」音声パスを持つ設計

## Web版への移植メモ
- Web Audio API + AnalyserNode でFFTは標準対応
- Pitchy.js が軽量で精度良好（pitch-trainer-webで実証済み）
- MediaRecorder API で録音（opus/webm推奨）

