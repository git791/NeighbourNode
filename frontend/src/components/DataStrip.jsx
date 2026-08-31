import { Refrigerator, CheckCircle2, AlertTriangle, Heart, ShieldCheck, Truck } from 'lucide-react';

export function DataStrip({ fridges = [], dispatches = [] }) {
  const total = fridges.length;
  const stocked = fridges.filter((f) => f.status === 'stocked').length;
  const low = fridges.filter((f) => f.status === 'low').length;
  const needsHelp = fridges.filter((f) => f.status === 'empty' || f.status === 'flagged').length;
  const uptime = total > 0 ? Math.round((stocked / total) * 100) : 0;
  const activeDispatches = dispatches.filter((d) => d.status === 'active').length;

  const stats = [
    {
      icon: Refrigerator,
      value: total,
      label: 'Total Fridges',
      sub: 'Across all neighborhoods',
      tone: 'neutral',
    },
    {
      icon: CheckCircle2,
      value: stocked,
      label: 'Well Stocked',
      sub: 'Fully stocked fridges',
      tone: 'stocked',
    },
    {
      icon: AlertTriangle,
      value: low,
      label: 'Running Low',
      sub: 'Low on inventory',
      tone: 'low',
    },
    {
      icon: Heart,
      value: needsHelp,
      label: 'Needs Help',
      sub: 'Empty or urgent',
      tone: 'empty',
    },
    {
      icon: ShieldCheck,
      value: `${uptime}%`,
      label: 'Uptime',
      sub: 'Network reliability',
      tone: 'stocked',
    },
    {
      icon: Truck,
      value: activeDispatches,
      label: 'Active Dispatches',
      sub: 'Deliveries in progress',
      tone: 'neutral',
    },
  ];

  return (
    <div className="stats-bar" role="status" aria-label="Network statistics">
      {stats.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <div key={i} className="stats-card">
            <div className={`stats-card__icon stats-card__icon--${stat.tone}`}>
              <Icon size={18} />
            </div>
            <div className="stats-card__text">
              <div className="stats-card__value">{stat.value}</div>
              <div className="stats-card__label">{stat.label}</div>
              <div className="stats-card__sub">{stat.sub}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}