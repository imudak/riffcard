import { describe, it, expect, beforeEach } from 'vitest';
import { openDB } from '../src/schema';
import { TakeRepository } from '../src/repository';
import type { IDBPDatabase } from 'idb';
import type { RiffCardDB } from '../src/schema';

describe('TakeRepository', () => {
  let db: IDBPDatabase<RiffCardDB>;
  let repo: TakeRepository;
  const phraseId = 'phrase-1';

  beforeEach(async () => {
    const dbName = `test-${crypto.randomUUID()}`;
    db = await openDB(dbName);
    repo = new TakeRepository(db);
  });

  describe('create()', () => {
    it('phraseId, audioBlob, scores から Take を作成する', async () => {
      const blob = new Blob(['audio'], { type: 'audio/webm' });
      const take = await repo.create(phraseId, blob, {
        pitchScore: 80,
        rhythmScore: 70,
        totalScore: 0,
      });

      expect(take.id).toBeTruthy();
      expect(take.phraseId).toBe(phraseId);
      expect(take.pitchScore).toBe(80);
      expect(take.rhythmScore).toBe(70);
      expect(take.recordedAt).toBeInstanceOf(Date);
    });

    it('totalScore が pitchScore * 0.7 + rhythmScore * 0.3 で自動計算される', async () => {
      const blob = new Blob(['audio'], { type: 'audio/webm' });
      const take = await repo.create(phraseId, blob, {
        pitchScore: 100,
        rhythmScore: 100,
        totalScore: 0,
      });
      expect(take.totalScore).toBe(100);

      const take2 = await repo.create(phraseId, blob, {
        pitchScore: 100,
        rhythmScore: 0,
        totalScore: 0,
      });
      expect(take2.totalScore).toBe(70);

      const take3 = await repo.create(phraseId, blob, {
        pitchScore: 0,
        rhythmScore: 100,
        totalScore: 0,
      });
      expect(take3.totalScore).toBe(30);
    });
  });

  describe('getByPhraseId()', () => {
    it('phraseId で絞り込み、recordedAt 降順で返す', async () => {
      const blob = new Blob(['audio'], { type: 'audio/webm' });
      const scores = { pitchScore: 80, rhythmScore: 70, totalScore: 0 };

      const t1 = await repo.create(phraseId, blob, scores);
      await new Promise((r) => setTimeout(r, 10));
      const t2 = await repo.create(phraseId, blob, scores);
      await new Promise((r) => setTimeout(r, 10));
      const t3 = await repo.create(phraseId, blob, scores);

      const takes = await repo.getByPhraseId(phraseId);
      expect(takes).toHaveLength(3);
      // 降順: 新しいものが先
      expect(takes[0].id).toBe(t3.id);
      expect(takes[1].id).toBe(t2.id);
      expect(takes[2].id).toBe(t1.id);
    });

    it('異なる phraseId のTakeは含まない', async () => {
      const blob = new Blob(['audio'], { type: 'audio/webm' });
      const scores = { pitchScore: 80, rhythmScore: 70, totalScore: 0 };

      await repo.create('phrase-A', blob, scores);
      await repo.create('phrase-B', blob, scores);
      await repo.create('phrase-A', blob, scores);

      const takesA = await repo.getByPhraseId('phrase-A');
      expect(takesA).toHaveLength(2);

      const takesB = await repo.getByPhraseId('phrase-B');
      expect(takesB).toHaveLength(1);
    });
  });

  describe('getById()', () => {
    it('ID指定で1件取得する', async () => {
      const blob = new Blob(['audio'], { type: 'audio/webm' });
      const created = await repo.create(phraseId, blob, {
        pitchScore: 90,
        rhythmScore: 85,
        totalScore: 0,
      });

      const found = await repo.getById(created.id);
      expect(found).toBeDefined();
      expect(found!.id).toBe(created.id);
      expect(found!.pitchScore).toBe(90);
    });

    it('存在しないIDでundefinedを返す', async () => {
      const found = await repo.getById('nonexistent');
      expect(found).toBeUndefined();
    });
  });

  describe('getBestScore()', () => {
    it('phraseId の最高 totalScore を返す', async () => {
      const blob = new Blob(['audio'], { type: 'audio/webm' });
      await repo.create(phraseId, blob, {
        pitchScore: 60,
        rhythmScore: 50,
        totalScore: 0,
      }); // 57
      await repo.create(phraseId, blob, {
        pitchScore: 90,
        rhythmScore: 85,
        totalScore: 0,
      }); // 88.5
      await repo.create(phraseId, blob, {
        pitchScore: 70,
        rhythmScore: 80,
        totalScore: 0,
      }); // 73

      const best = await repo.getBestScore(phraseId);
      expect(best).toBe(88.5);
    });

    it('Take がない場合は null を返す', async () => {
      const best = await repo.getBestScore('no-takes');
      expect(best).toBeNull();
    });
  });
});
