import { useState, useEffect, useCallback } from 'react';
import type { Update } from '@/types';
import { api } from '@/lib/api';

export function useUpdates(queryParams?: Record<string, string>) {
  const [updates, setUpdates] = useState<Update[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Serialize params so the effect only re-runs when values actually change
  const serializedParams = JSON.stringify(queryParams ?? {});

  const fetchUpdates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = JSON.parse(serializedParams) as Record<string, string>;
      const hasParams = Object.keys(params).length > 0;
      const data = await api.updates.list(hasParams ? params : undefined);
      setUpdates(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch updates');
    } finally {
      setLoading(false);
    }
  }, [serializedParams]);

  useEffect(() => {
    fetchUpdates();
  }, [fetchUpdates]);

  const createUpdate = useCallback(async (data: Partial<Update>) => {
    const created = await api.updates.create(data);
    await fetchUpdates();
    return created;
  }, [fetchUpdates]);

  const updateUpdate = useCallback(async (id: string, data: Partial<Update>) => {
    const updated = await api.updates.update(id, data);
    await fetchUpdates();
    return updated;
  }, [fetchUpdates]);

  const deleteUpdate = useCallback(async (id: string) => {
    await api.updates.delete(id);
    await fetchUpdates();
  }, [fetchUpdates]);

  return { updates, loading, error, refresh: fetchUpdates, createUpdate, updateUpdate, deleteUpdate };
}
