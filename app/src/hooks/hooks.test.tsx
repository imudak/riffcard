/**
 * カスタムフックテスト
 * REQ-RC-DATA-002: IndexedDBからのデータ取得
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { openDB, PhraseRepository, TakeRepository } from '@lib/db';
import { usePhrases } from './usePhrases';
import { usePhrase } from './usePhrase';
import { useTakes } from './useTakes';

beforeEach(() => {
  // fake-indexeddb をリセット
  indexedDB = new IDBFactory();
});

describe('usePhrases', () => {
  it('初期状態はloading=true, phrases=[]', () => {
    const { result } = renderHook(() => usePhrases());
    expect(result.current.loading).toBe(true);
    expect(result.current.phrases).toEqual([]);
  });

  it('データ取得後にphrasesが設定される', async () => {
    const db = await openDB();
    const repo = new PhraseRepository(db);
    await repo.create();
    await repo.create();

    const { result } = renderHook(() => usePhrases());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.phrases).toHaveLength(2);
    expect(result.current.error).toBeNull();
  });

  it('refreshでデータを再取得', async () => {
    const { result } = renderHook(() => usePhrases());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.phrases).toHaveLength(0);

    const db = await openDB();
    const repo = new PhraseRepository(db);
    await repo.create();

    await result.current.refresh();
    await waitFor(() => expect(result.current.phrases).toHaveLength(1));
  });
});

describe('usePhrase', () => {
  it('IDでフレーズを取得', async () => {
    const db = await openDB();
    const repo = new PhraseRepository(db);
    const created = await repo.create();

    const { result } = renderHook(() => usePhrase(created.id));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.phrase?.id).toBe(created.id);
    expect(result.current.phrase?.title).toBe(created.title);
  });

  it('存在しないIDはnull', async () => {
    const { result } = renderHook(() => usePhrase('nonexistent'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.phrase).toBeNull();
  });
});

describe('useTakes', () => {
  it('phraseIdでテイクを取得', async () => {
    const db = await openDB();
    const phraseRepo = new PhraseRepository(db);
    const phrase = await phraseRepo.create();
    const takeRepo = new TakeRepository(db);
    await takeRepo.create(phrase.id, new Blob(['audio']), {
      pitchScore: 80,
      rhythmScore: 70,
      totalScore: 77,
    });

    const { result } = renderHook(() => useTakes(phrase.id));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.takes).toHaveLength(1);
    expect(result.current.takes[0].phraseId).toBe(phrase.id);
  });

  it('テイクがない場合は空配列', async () => {
    const { result } = renderHook(() => useTakes('no-phrase'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.takes).toEqual([]);
  });
});
