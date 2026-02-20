import { useState, useEffect, useCallback } from 'react';
import type { Phrase } from '@lib/db';
import { openDB, PhraseRepository } from '@lib/db';

/** REQ-RC-DATA-002: IndexedDBから単一Phraseを取得 */
export function usePhrase(id: string) {
  const [phrase, setPhrase] = useState<Phrase | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const db = await openDB();
      const repo = new PhraseRepository(db);
      const result = await repo.getById(id);
      setPhrase(result ?? null);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e : new Error('データ取得に失敗しました'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { phrase, loading, error, refresh };
}
