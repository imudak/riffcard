/** REQ-RC-REC-002 */
export class MicPermissionError extends Error {
  constructor(message = 'マイクの使用が許可されていません') {
    super(message);
    this.name = 'MicPermissionError';
  }
}

export class RecordingError extends Error {
  constructor(message = '録音中にエラーが発生しました') {
    super(message);
    this.name = 'RecordingError';
  }
}

export class AnalysisError extends Error {
  constructor(message = '音声分析中にエラーが発生しました') {
    super(message);
    this.name = 'AnalysisError';
  }
}
