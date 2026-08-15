import { useState, useCallback } from 'react';
import { approveItem, rejectItem } from '../api/client.js';

export function useApprovalQueue(onRefresh) {
  const [actionLoading, setActionLoading] = useState(null);
  const [actionError, setActionError] = useState(null);

  const approve = useCallback(async (approvalId, note = '') => {
    setActionLoading(approvalId);
    setActionError(null);
    try {
      await approveItem(approvalId, note);
      if (onRefresh) await onRefresh();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(null);
    }
  }, [onRefresh]);

  const reject = useCallback(async (approvalId, note = '') => {
    setActionLoading(approvalId);
    setActionError(null);
    try {
      await rejectItem(approvalId, note);
      if (onRefresh) await onRefresh();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(null);
    }
  }, [onRefresh]);

  return { approve, reject, actionLoading, actionError };
}
