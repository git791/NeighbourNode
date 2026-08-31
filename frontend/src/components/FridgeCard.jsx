import { Refrigerator, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

const STATUS_CONFIG = {
  stocked: { label: 'STOCKED', icon: CheckCircle2 },
  low: { label: 'LOW', icon: AlertTriangle },
  empty: { label: 'EMPTY', icon: XCircle },
  flagged: { label: 'FLAGGED', icon: AlertTriangle },
};

export function FridgeCard({ fridge }) {
  const status = fridge.status || 'empty';
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.empty;
  const StatusIcon = config.icon;
  const filledCount = fridge.filled_count ?? (status === 'stocked' ? 5 : status === 'low' ? 2 : 0);
  const capacity = fridge.capacity || 5;

  return (
    <div className="fridge-card">
      <div className={`fridge-card__status-bar fridge-card__status-bar--${status}`}>
        <Refrigerator size={18} />
        <span>{config.label}</span>
      </div>
      <div className="fridge-card__body">
        <div className="fridge-card__name">{fridge.name}</div>

        <div className="fridge-card__crate-pill">
          <CheckCircle2 size={14} className="fridge-card__crate-pill-icon" />
          {filledCount}/{capacity} crates
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