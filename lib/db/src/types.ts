/** REQ-RC-DATA-001 (DJ-001: 2層モデル) */
export interface Phrase {
  id: string;
  title: string;
  referenceAudioBlob: Blob | null;
  createdAt: Date;
  updatedAt: Date;
}

/** REQ-RC-DATA-001 */
export interface Take {
  id: string;
  phraseId: string;
  audioBlob: Blob;
  pitchScore: number;
  rhythmScore: number;
  totalScore: number;
  recordedAt: Date;
}

export interface Scores {
  pitchScore: number;
  rhythmScore: number;
  totalScore: number;
}
