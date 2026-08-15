import { useState, useEffect, useCallback } from 'react';
import { getDashboardState } from '../api/client.js';

export function useDashboardState(pollIntervalMs = 15000) {
  const [state, setState] = useState({ fridges: [], offers: [], dispatches: [], approvals: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    try {
      const data = await getDashboardState();
      setState(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, pollIntervalMs);
    return () => clearInterval(id);
  }, [refresh, pollIntervalMs]);

  return { state, loading, error, refresh };
}
