import { Leaf, Pencil, AlertTriangle } from 'lucide-react';

export function HostActionPanel({ fridge, onMarkEmpty, onMarkLow, onUpdateCount, confirming }) {
  return (
    <div className="host-action-panel">
      <div className="host-action-panel__thanks">
        <Leaf size={20} color="var(--crate-green)" />
        <div>
          <div className="host-action-panel__thanks-title">Thank you for hosting!</div>
          <div className="host-action-panel__thanks-text">
            You're helping make good food accessible to everyone in your neighborhood. Keep it up! 🤍
          </div>
        </div>
      </div>

      <div className="host-action-panel__actions" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
        <h4 style={{ marginBottom: '10px' }}>Update current crates</h4>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {[0, 1, 2, 3, 4, 5].map((count) => (
            <button
              key={count}
              className={`btn ${count === 0 ? 'btn--reject' : ''}`}
              style={{
                opacity: fridge.filled_count === count ? 0.5 : 1,
                minWidth: '50px'
              }}
              onClick={() => onUpdateCount(count)}
              disabled={confirming || fridge.filled_count === count}
            >
              {count === 0 ? '0 (Empty)' : count}
            </button>
          ))}
        </div>
      </div>
      <p className="host-action-panel__note">
        If your fridge is completely empty, let us know so we can get it restocked.
      </p>
    </div>
  );
}