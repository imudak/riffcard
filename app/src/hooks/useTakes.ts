import { useState, useEffect, useCallback } from 'react';
import type { Take } from '@lib/db';
import { openDB, TakeRepository } from '@lib/db';

export function useTakes(phraseId: string) {
  const [takes, setTakes] = useState<Take[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const db = await openDB();
      const repo = new TakeRepository(db);
      const result = await repo.getByPhraseId(phraseId);
      setTakes(result);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e : new Error('データ取得に失敗しました'));
    } finally {
      setLoading(false);
    }
  }, [phraseId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { takes, loading, error, refresh };
}
