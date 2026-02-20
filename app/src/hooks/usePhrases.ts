import { useState, useEffect, useCallback } from 'react';
import type { Phrase } from '@lib/db';
import { openDB, PhraseRepository } from '@lib/db';

export function usePhrases() {
  const [phrases, setPhrases] = useState<Phrase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const db = await openDB();
      const repo = new PhraseRepository(db);
      const all = await repo.getAll();
      setPhrases(all);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e : new Error('データ取得に失敗しました'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { phrases, loading, error, refresh };
}
