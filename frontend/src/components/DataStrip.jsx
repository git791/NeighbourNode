export function DataStrip({ fridges = [], dispatches = [], offers = [] }) {
  const total = fridges.length;
  const stocked = fridges.filter(f => f.status === 'stocked').length;
  const empty = fridges.filter(f => f.status === 'empty').length;
  const uptime = total > 0 ? Math.round((stocked / total) * 100) : 0;
  const activeDispatches = dispatches.filter(d => d.status === 'active').length;
  const openOffers = offers.filter(o => o.status === 'open').length;

  return (
    <div className="data-strip" role="status" aria-label="Network statistics">
      <span className="data-strip__item">
        <span className="data-strip__dot" aria-hidden="true" />
        live
      </span>
      <span className="data-strip__item">
        <strong>{total}</strong> fridges
      </span>
      <span className="data-strip__item">
        <strong>{stocked}</strong> stocked · <strong>{empty}</strong> empty
      </span>
      <span className="data-strip__item">
        <strong>{uptime}%</strong> uptime
      </span>
      <span className="data-strip__item">
        <strong>{activeDispatches}</strong> active dispatch{activeDispatches !== 1 ? 'es' : ''}
      </span>
      <span className="data-strip__item">
        <strong>{openOffers}</strong> open offer{openOffers !== 1 ? 's' : ''}
      </span>
    </div>
  );
}
