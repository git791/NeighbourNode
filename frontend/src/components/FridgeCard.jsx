import { CrateStack } from './CrateStack.jsx';

const STATUS_LABELS = { stocked: 'STOCKED', low: 'LOW', empty: 'EMPTY', flagged: 'FLAGGED' };

export function FridgeCard({ fridge }) {
  const status = fridge.status || 'empty';
  const statusLabel = STATUS_LABELS[status] || status.toUpperCase();
  const filledCount = fridge.filled_count ?? (status === 'stocked' ? 5 : status === 'low' ? 2 : 0);

  return (
    <div className="fridge-card">
      <div className={`fridge-card__status-block fridge-card__status-block--${status}`}>
        <div className="fridge-card__status-word">{statusLabel}</div>
      </div>
      <div className="fridge-card__body">
        <div className="fridge-card__name">{fridge.name}</div>
        <div className="fridge-card__crate-row">
          <CrateStack filledCount={filledCount} capacity={fridge.capacity || 5} />
          <span className="fridge-card__meta">{filledCount}/{fridge.capacity || 5} crates</span>
        </div>
        {fridge.address && (
          <div className="fridge-card__meta">{fridge.address}</div>
        )}
        {fridge.last_restocked_at && (
          <div className="fridge-card__meta">
            Last restocked: {new Date(fridge.last_restocked_at).toLocaleString()}
          </div>
        )}
      </div>
    </div>
  );
}
