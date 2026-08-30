import { useState } from 'react';

export function RunnerPage({ dispatches = [], fridges = [], onComplete }) {
  const [selectedRunner, setSelectedRunner] = useState('');
  const [completingId, setCompletingId] = useState(null);

  // Get unique runner IDs from dispatches, so the dropdown is driven by real data
  const runnerIds = [...new Set(dispatches.map((d) => d.runner_id).filter(Boolean))];

  const myDeliveries = dispatches.filter(
    (d) => d.runner_id === selectedRunner && ['pending', 'active'].includes(d.status)
  );

  const getFridgeName = (fridgeId) => {
    const fridge = fridges.find((f) => f.entity_id === fridgeId);
    return fridge ? fridge.name : fridgeId;
  };

  const handleComplete = async (dispatchId) => {
    setCompletingId(dispatchId);
    await onComplete(dispatchId);
    setCompletingId(null);
  };

  return (
    <div className="runner-page">
      <h2>My Deliveries</h2>

      <label>
        Select your name
        <select value={selectedRunner} onChange={(e) => setSelectedRunner(e.target.value)}>
          <option value="">Choose runner</option>
          {runnerIds.map((id) => (
            <option key={id} value={id}>
              {id}
            </option>
          ))}
        </select>
      </label>

      {selectedRunner && (
        <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '400px' }}>
          {myDeliveries.length === 0 && (
            <div className="empty-state">No deliveries assigned to you right now.</div>
          )}
          {myDeliveries.map((dispatch) => (
            <div key={dispatch.dispatch_id} className="queue-item">
              <div className="queue-item__title" style={{ color: 'var(--dispatch-blue)' }}>
                {dispatch.offer_id} → {getFridgeName(dispatch.fridge_id)}
              </div>
              <div className="queue-item__meta">Status: {dispatch.status}</div>
              {dispatch.created_at && (
                <div className="queue-item__meta">
                  Started: {new Date(dispatch.created_at).toLocaleString()}
                </div>
              )}
              <button
                className="btn btn--approve"
                onClick={() => handleComplete(dispatch.dispatch_id)}
                disabled={completingId === dispatch.dispatch_id}
              >
                {completingId === dispatch.dispatch_id ? 'Marking…' : 'Mark as Delivered'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}