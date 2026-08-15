import { useState } from 'react';
import { useApprovalQueue } from '../hooks/useApprovalQueue.js';
import { CrateStack } from './CrateStack.jsx';

export function Queue({ approvals = [], dispatches = [], onRefresh }) {
  const { approve, reject, actionLoading, actionError } = useApprovalQueue(onRefresh);
  const [notes, setNotes] = useState({});

  const pendingApprovals = approvals.filter(a => a.status === 'pending');
  const activeDispatches = dispatches.filter(d => ['pending', 'active'].includes(d.status));

  return (
    <div className="queue-pane">
      {/* Needs approval section */}
      <div className="queue-section">
        <div className="queue-section__header queue-section__header--alert">
          ▸ needs approval ({pendingApprovals.length})
        </div>
        {pendingApprovals.length === 0 && (
          <div className="empty-state">No items waiting for approval</div>
        )}
        {pendingApprovals.map((item) => (
          <div key={item.approval_id || item.PK} className="queue-item">
            <div className="queue-item__title">{item.item_type}: {item.item_id}</div>
            <div className="queue-item__reason">reason: {item.reason}</div>
            <div className="queue-item__meta">
              {item.created_at ? new Date(item.created_at).toLocaleString() : ''}
            </div>
            <input
              className="modal__input"
              style={{ fontSize: 'var(--text-mono)', padding: '0.375rem 0.5rem' }}
              placeholder="Optional coordinator note..."
              value={notes[item.approval_id] || ''}
              onChange={e => setNotes(n => ({ ...n, [item.approval_id]: e.target.value }))}
              id={`note-${item.approval_id}`}
            />
            <div className="queue-item__actions">
              <button
                className="btn btn--approve btn--sm"
                onClick={() => approve(item.approval_id, notes[item.approval_id] || '')}
                disabled={actionLoading === item.approval_id}
                id={`approve-${item.approval_id}`}
              >
                {actionLoading === item.approval_id ? 'approving…' : 'approve'}
              </button>
              <button
                className="btn btn--reject btn--sm"
                onClick={() => reject(item.approval_id, notes[item.approval_id] || '')}
                disabled={actionLoading === item.approval_id}
                id={`reject-${item.approval_id}`}
              >
                reject
              </button>
            </div>
            {actionError && <div style={{ color: 'var(--flag-red)', fontSize: 'var(--text-mono)' }}>{actionError}</div>}
          </div>
        ))}
      </div>

      {/* In-progress section */}
      <div className="queue-section">
        <div className="queue-section__header queue-section__header--active">
          ▸ in progress ({activeDispatches.length})
        </div>
        {activeDispatches.length === 0 && (
          <div className="empty-state">No active dispatches</div>
        )}
        {activeDispatches.map((dispatch) => (
          <div key={dispatch.dispatch_id || dispatch.PK} className="queue-item">
            <div className="queue-item__title" style={{ color: 'var(--dispatch-blue)' }}>
              {dispatch.offer_id} → {dispatch.fridge_id}
            </div>
            <div className="queue-item__meta">
              Runner: {dispatch.runner_id} · Status: {dispatch.status}
            </div>
            {dispatch.created_at && (
              <div className="queue-item__meta">
                Started: {new Date(dispatch.created_at).toLocaleString()}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
