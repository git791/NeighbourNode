import { useState, useEffect, useCallback } from 'react';
import { getDashboardState } from '../api/client.js';

export function useDashboardState(pollIntervalMs = 15000) {
  const [state, setState] = useState({ fridges: [], offers: [], dispatches: [], approvals: [], forecasts: [], runners: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    try {
      const data = await getDashboardState();
      // Normalize: backend returns open_offers / active_dispatches / pending_approvals
      // but frontend code expects offers / dispatches / approvals
      setState({
        fridges: data.fridges ?? [],
        offers: data.offers ?? data.open_offers ?? [],
        dispatches: data.dispatches ?? data.active_dispatches ?? [],
        approvals: data.approvals ?? data.pending_approvals ?? [],
        forecasts: data.forecasts ?? [],
        runners: data.runners ?? [],
      });
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