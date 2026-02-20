import type { IDBPDatabase } from 'idb';
import type { RiffCardDB } from './schema';
import type { Phrase, Take, Scores } from './types';

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export class PhraseRepository {
  constructor(private db: IDBPDatabase<RiffCardDB>) {}

  async create(): Promise<Phrase> {
    const title = await this.generateDefaultTitle();
    const now = new Date();
    const phrase: Phrase = {
      id: generateUUID(),
      title,
      referenceAudioBlob: null,
      createdAt: now,
      updatedAt: now,
    };
    await this.db.put('phrases', phrase);
    return phrase;
  }

  async getAll(): Promise<Phrase[]> {
    const all = await this.db.getAllFromIndex('phrases', 'by-created');
    return all.reverse();
  }

  async getById(id: string): Promise<Phrase | undefined> {
    return this.db.get('phrases', id);
  }

  async updateTitle(id: string, title: string): Promise<void> {
    const phrase = await this.db.get('phrases', id);
    if (!phrase) return;
    phrase.title = title;
    phrase.updatedAt = new Date();
    await this.db.put('phrases', phrase);
  }

  async updateReference(id: string, blob: Blob): Promise<void> {
    const phrase = await this.db.get('phrases', id);
    if (!phrase) return;
    phrase.referenceAudioBlob = blob;
    phrase.updatedAt = new Date();
    await this.db.put('phrases', phrase);
  }

  async delete(id: string): Promise<void> {
    const tx = this.db.transaction(['phrases', 'takes'], 'readwrite');
    // カスケード削除: 配下の Take を全削除
    const takeIndex = tx.objectStore('takes').index('by-phrase');
    let cursor = await takeIndex.openCursor(id);
    while (cursor) {
      await cursor.delete();
      cursor = await cursor.continue();
    }
    await tx.objectStore('phrases').delete(id);
    await tx.done;
  }

  private async generateDefaultTitle(): Promise<string> {
    const count = await this.db.count('phrases');
    return `フレーズ${count + 1}`;
  }
}

export class TakeRepository {
  constructor(private db: IDBPDatabase<RiffCardDB>) {}

  async create(
    phraseId: string,
    audioBlob: Blob,
    scores: Scores,
  ): Promise<Take> {
    const take: Take = {
      id: generateUUID(),
      phraseId,
      audioBlob,
      pitchScore: scores.pitchScore,
      rhythmScore: scores.rhythmScore,
      totalScore: Math.round(
        (scores.pitchScore * 0.7 + scores.rhythmScore * 0.3) * 10,
      ) / 10,
      recordedAt: new Date(),
    };
    await this.db.put('takes', take);
    return take;
  }

  async getByPhraseId(phraseId: string): Promise<Take[]> {
    const takes = await this.db.getAllFromIndex('takes', 'by-phrase', phraseId);
    return takes.sort(
      (a, b) => b.recordedAt.getTime() - a.recordedAt.getTime(),
    );
  }

  async getById(id: string): Promise<Take | undefined> {
    return this.db.get('takes', id);
  }

  async getBestScore(phraseId: string): Promise<number | null> {
    const takes = await this.db.getAllFromIndex('takes', 'by-phrase', phraseId);
    if (takes.length === 0) return null;
    return Math.max(...takes.map((t) => t.totalScore));
  }
}
