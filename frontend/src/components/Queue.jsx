import { useState } from 'react';
import { AlertCircle, ArrowRight } from 'lucide-react';
import { useApprovalQueue } from '../hooks/useApprovalQueue.js';

const STATUS_PILL_LABELS = {
  active: 'On the way',
  picked_up: 'Picked up',
  pending: 'Pending',
};

export function Queue({ approvals = [], dispatches = [], onRefresh }) {
  const { approve, reject, actionLoading, actionError } = useApprovalQueue(onRefresh);
  const [notes, setNotes] = useState({});

  const pendingApprovals = approvals.filter((a) => a.status === 'pending');
  const activeDispatches = dispatches.filter((d) => ['pending', 'active'].includes(d.status));

  return (
    <div className="queue-pane">
      {/* Needs approval section */}
      <div className="queue-panel">
        <div className="queue-panel__header queue-panel__header--alert">
          <AlertCircle size={16} />
          NEEDS APPROVAL ({pendingApprovals.length})
        </div>

        {pendingApprovals.length === 0 && (
          <div className="empty-state">No items waiting for approval</div>
        )}

        {pendingApprovals.map((item) => (
          <div key={item.approval_id || item.PK} className="queue-card">
            <div className="queue-card__avatar" />
            <div className="queue-card__content">
              <div className="queue-card__title">
                {item.item_type}: {item.item_id}
              </div>
              <div className="queue-card__reason">reason: {item.reason}</div>
              <div className="queue-card__meta">
                {item.created_at ? new Date(item.created_at).toLocaleString() : ''}
              </div>
              <input
                className="modal__input queue-card__note"
                placeholder="Optional coordinator note..."
                value={notes[item.approval_id] || ''}
                onChange={(e) => setNotes((n) => ({ ...n, [item.approval_id]: e.target.value }))}
              />
              <div className="queue-card__actions">
                <button
                  className="btn btn--approve btn--sm"
                  onClick={() => approve(item.approval_id, notes[item.approval_id] || '')}
                  disabled={actionLoading === item.approval_id}
                >
                  {actionLoading === item.approval_id ? 'Approving…' : 'Approve'}
                </button>
                <button
                  className="btn btn--reject btn--sm"
                  onClick={() => reject(item.approval_id, notes[item.approval_id] || '')}
                  disabled={actionLoading === item.approval_id}
                >
                  Reject
                </button>
              </div>
              {actionError && <div className="queue-card__error">{actionError}</div>}
            </div>
          </div>
        ))}

        {pendingApprovals.length > 0 && (
          <button className="queue-panel__viewall">
            View all ({pendingApprovals.length}) <ArrowRight size={14} />
          </button>
        )}
      </div>

      {/* In-progress section */}
      <div className="queue-panel">
        <div className="queue-panel__header queue-panel__header--active">
          <ArrowRight size={16} />
          IN PROGRESS ({activeDispatches.length})
        </div>

        {activeDispatches.length === 0 && (
          <div className="empty-state">No active dispatches</div>
        )}

        {activeDispatches.map((dispatch) => (
          <div key={dispatch.dispatch_id || dispatch.PK} className="dispatch-row">
            <div className="dispatch-row__main">
              <div className="dispatch-row__title">
                {dispatch.offer_id} <ArrowRight size={12} /> {dispatch.fridge_id}
              </div>
              <div className="dispatch-row__meta">
                Runner: {dispatch.runner_id} · Status:{' '}
                <span className="dispatch-row__status">{dispatch.status}</span>
              </div>
              {dispatch.created_at && (
                <div className="dispatch-row__meta">
                  Started: {new Date(dispatch.created_at).toLocaleString()}
                </div>
              )}
            </div>
            <span className="dispatch-pill">
              {STATUS_PILL_LABELS[dispatch.status] || dispatch.status}
            </span>
          </div>
        ))}

        {activeDispatches.length > 0 && (
          <button className="queue-panel__viewall">
            View all dispatches <ArrowRight size={14} />
          </button>
        )}
      </div>
    </div>
  );
}