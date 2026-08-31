import { Trophy } from 'lucide-react';

export function Leaderboard({ offers = [] }) {
  const counts = {};
  offers.forEach((o) => {
    if (!o.donor_name) return;
    counts[o.donor_name] = (counts[o.donor_name] || 0) + 1;
  });

  const ranked = Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return (
    <div className="leaderboard">
      <div className="leaderboard__header">
        <Trophy size={20} color="var(--marigold)" />
        <div>
          <div className="leaderboard__title">Top Donors</div>
          <div className="leaderboard__subtitle">This Month</div>
        </div>
      </div>

      {ranked.length === 0 && (
        <div className="empty-state">No donations logged yet</div>
      )}

      {ranked.map((entry, i) => (
        <div key={entry.name} className="leaderboard__row">
          <span className={`leaderboard__rank leaderboard__rank--${i + 1}`}>{i + 1}</span>
          <span className="leaderboard__avatar" />
          <span className="leaderboard__name">{entry.name}</span>
          <span className="leaderboard__count">{entry.count} donation{entry.count !== 1 ? 's' : ''}</span>
        </div>
      ))}

      {ranked.length > 0 && (
        <button className="queue-panel__viewall">View full leaderboard →</button>
      )}
    </div>
  );
}