import { describe, it, expect, beforeEach } from 'vitest';
import { openDB } from '../src/schema';
import { PhraseRepository } from '../src/repository';
import type { IDBPDatabase } from 'idb';
import type { RiffCardDB } from '../src/schema';

describe('PhraseRepository', () => {
  let db: IDBPDatabase<RiffCardDB>;
  let repo: PhraseRepository;

  beforeEach(async () => {
    // fake-indexeddb: 各テストで新しい DB 名を使用してクリーンに
    const dbName = `test-${crypto.randomUUID()}`;
    db = await openDB(dbName);
    repo = new PhraseRepository(db);
  });

  describe('create()', () => {
    it('デフォルト名「フレーズ1」で作成される', async () => {
      const phrase = await repo.create();
      expect(phrase.title).toBe('フレーズ1');
      expect(phrase.id).toBeTruthy();
      expect(phrase.referenceAudioBlob).toBeNull();
      expect(phrase.createdAt).toBeInstanceOf(Date);
      expect(phrase.updatedAt).toBeInstanceOf(Date);
    });

    it('連番でデフォルト名が生成される', async () => {
      const p1 = await repo.create();
      const p2 = await repo.create();
      const p3 = await repo.create();
      expect(p1.title).toBe('フレーズ1');
      expect(p2.title).toBe('フレーズ2');
      expect(p3.title).toBe('フレーズ3');
    });
  });

  describe('getAll()', () => {
    it('全Phraseを取得し、createdAt降順で返す', async () => {
      const p1 = await repo.create();
      // 少し時間を空ける
      await new Promise((r) => setTimeout(r, 10));
      const p2 = await repo.create();
      await new Promise((r) => setTimeout(r, 10));
      const p3 = await repo.create();

      const all = await repo.getAll();
      expect(all).toHaveLength(3);
      // 降順: 新しいものが先
      expect(all[0].id).toBe(p3.id);
      expect(all[1].id).toBe(p2.id);
      expect(all[2].id).toBe(p1.id);
    });

    it('空の場合は空配列を返す', async () => {
      const all = await repo.getAll();
      expect(all).toEqual([]);
    });
  });

  describe('getById()', () => {
    it('ID指定で1件取得する', async () => {
      const created = await repo.create();
      const found = await repo.getById(created.id);
      expect(found).toBeDefined();
      expect(found!.id).toBe(created.id);
      expect(found!.title).toBe(created.title);
    });

    it('存在しないIDでundefinedを返す', async () => {
      const found = await repo.getById('nonexistent');
      expect(found).toBeUndefined();
    });
  });

  describe('updateTitle()', () => {
    it('タイトルを更新する', async () => {
      const phrase = await repo.create();
      await repo.updateTitle(phrase.id, 'サビ高音部分');

      const updated = await repo.getById(phrase.id);
      expect(updated!.title).toBe('サビ高音部分');
      expect(updated!.updatedAt.getTime()).toBeGreaterThanOrEqual(
        phrase.updatedAt.getTime(),
      );
    });
  });

  describe('updateReference()', () => {
    it('お手本音声Blobを保存する', async () => {
      const phrase = await repo.create();
      const blob = new Blob(['audio-data'], { type: 'audio/webm' });
      await repo.updateReference(phrase.id, blob);

      const updated = await repo.getById(phrase.id);
      expect(updated!.referenceAudioBlob).not.toBeNull();
    });

    it('お手本音声を上書きする', async () => {
      const phrase = await repo.create();
      const blob1 = new Blob(['audio1'], { type: 'audio/webm' });
      const blob2 = new Blob(['audio2-longer'], { type: 'audio/webm' });

      await repo.updateReference(phrase.id, blob1);
      await repo.updateReference(phrase.id, blob2);

      const updated = await repo.getById(phrase.id);
      expect(updated!.referenceAudioBlob).not.toBeNull();
    });
  });

  describe('delete()', () => {
    it('Phrase + 配下Take全削除（カスケード）', async () => {
      const phrase = await repo.create();
      // Take を直接 DB に追加
      const takeId1 = crypto.randomUUID();
      const takeId2 = crypto.randomUUID();
      await db.put('takes', {
        id: takeId1,
        phraseId: phrase.id,
        audioBlob: new Blob(['t1']),
        pitchScore: 80,
        rhythmScore: 70,
        totalScore: 77,
        recordedAt: new Date(),
      });
      await db.put('takes', {
        id: takeId2,
        phraseId: phrase.id,
        audioBlob: new Blob(['t2']),
        pitchScore: 90,
        rhythmScore: 85,
        totalScore: 88.5,
        recordedAt: new Date(),
      });

      await repo.delete(phrase.id);

      // Phrase が削除されていること
      const found = await repo.getById(phrase.id);
      expect(found).toBeUndefined();

      // 配下の Take も削除されていること
      const take1 = await db.get('takes', takeId1);
      const take2 = await db.get('takes', takeId2);
      expect(take1).toBeUndefined();
      expect(take2).toBeUndefined();
    });

    it('他のPhraseのTakeは削除されない', async () => {
      const phrase1 = await repo.create();
      const phrase2 = await repo.create();
      const takeId = crypto.randomUUID();
      await db.put('takes', {
        id: takeId,
        phraseId: phrase2.id,
        audioBlob: new Blob(['t']),
        pitchScore: 80,
        rhythmScore: 70,
        totalScore: 77,
        recordedAt: new Date(),
      });

      await repo.delete(phrase1.id);

      // phrase2 の Take は残っている
      const take = await db.get('takes', takeId);
      expect(take).toBeDefined();
    });
  });
});
