import { Leaf, Pencil, AlertTriangle } from 'lucide-react';

export function HostActionPanel({ fridge, onMarkEmpty, onMarkLow, confirming }) {
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

      <div className="host-action-panel__actions">
        <button
          className="btn host-action-panel__btn-low"
          onClick={onMarkLow}
          disabled={confirming}
        >
          <Pencil size={15} /> Update Status to Low
        </button>
        <button
          className="btn btn--reject host-action-panel__btn-empty"
          onClick={onMarkEmpty}
          disabled={fridge.status === 'empty' || confirming}
        >
          <AlertTriangle size={15} />
          {confirming ? 'Updating…' : fridge.status === 'empty' ? 'Already Marked Empty' : 'Mark as Empty'}
        </button>
      </div>
      <p className="host-action-panel__note">
        If your fridge is completely empty, let us know so we can get it restocked.
      </p>
    </div>
  );
}