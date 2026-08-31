import { Refrigerator, CheckCircle2, AlertTriangle, XCircle, Calendar, MapPin } from 'lucide-react';

const STATUS_CONFIG = {
  stocked: { label: 'STOCKED', badge: 'Well Stocked', icon: CheckCircle2 },
  low: { label: 'LOW', badge: 'Running Low', icon: AlertTriangle },
  empty: { label: 'EMPTY', badge: 'Needs Restock', icon: XCircle },
  flagged: { label: 'FLAGGED', badge: 'Needs Attention', icon: AlertTriangle },
};

export function HostFridgeStatus({ fridge }) {
  const status = fridge.status || 'empty';
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.empty;
  const filledCount = fridge.filled_count ?? (status === 'stocked' ? 5 : status === 'low' ? 2 : 0);
  const capacity = fridge.capacity || 5;

  return (
    <div className="host-status-card">
      <div className={`host-status-card__bar host-status-card__bar--${status}`}>
        <span className="host-status-card__bar-left">
          <Refrigerator size={18} /> {config.label}
        </span>
        <span className="host-status-card__badge">
          <config.icon size={13} /> {config.badge}
        </span>
      </div>

      <div className="host-status-card__body">
        <div className="host-status-card__col">
          <div className="host-status-card__name">{fridge.name}</div>
          <div className="crate-stack">
            {Array.from({ length: capacity }).map((_, i) => (
              <div
                key={i}
                className={`crate-unit ${i < filledCount ? 'crate-unit--filled' : 'crate-unit--empty'}`}
              />
            ))}
          </div>
          <div className="host-status-card__count">{filledCount} / {capacity} crates</div>

          {fridge.address && (
            <div className="host-status-card__meta">
              <MapPin size={13} /> {fridge.address}
            </div>
          )}
          <button className="host-status-card__link">View on map</button>
        </div>

        <div className="host-status-card__col host-status-card__col--divider">
          <div className="host-status-card__label">Last Restocked</div>
          {fridge.last_restocked_at && (
            <div className="host-status-card__meta">
              <Calendar size={13} /> {new Date(fridge.last_restocked_at).toLocaleString()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}