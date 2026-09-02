import { Lightbulb, Package, ShieldCheck, Bell, Heart, MessageCircle, Leaf } from 'lucide-react';

const TIPS = [
  { icon: Package, text: 'Check the items before pickup and make sure they\'re safe to transport.' },
  { icon: ShieldCheck, text: 'Keep food cool and secure during delivery.' },
  { icon: Bell, text: 'Let the host know when you arrive.' },
  { icon: Heart, text: 'Thank you! You\'re the link that makes this work.' },
];

export function RunnerSidebar({ completedCount = 0 }) {
  // Mock impact stats — real backend would track these
  const stats = [
    { icon: Package, label: 'Deliveries completed', value: completedCount || 12 },
    { icon: Leaf, label: 'Meals delivered', value: 356 },
    { icon: MessageCircle, label: 'Distance traveled', value: '86 km' },
    { icon: Heart, label: 'Communities served', value: 7 },
  ];

  return (
    <div className="host-sidebar">
      <div className="host-sidebar__panel">
        <div className="host-sidebar__header">
          <Lightbulb size={18} color="var(--marigold)" />
          Runner Tips
        </div>
        {TIPS.map((tip, i) => (
          <div key={i} className="host-tip">
            <span className="host-tip__icon"><tip.icon size={15} /></span>
            <span>{tip.text}</span>
          </div>
        ))}
        <button className="host-sidebar__contact">
          <MessageCircle size={15} /> Contact Coordinator
        </button>
      </div>

      <div className="host-sidebar__panel">
        <div className="host-sidebar__header">
          <Leaf size={18} color="var(--crate-green)" />
          Your Impact
        </div>
        {stats.map((stat, i) => (
          <div key={i} className="impact-row">
            <span className="impact-row__icon"><stat.icon size={15} /></span>
            <span className="impact-row__label">{stat.label}</span>
            <span className="impact-row__value">{stat.value}</span>
          </div>
        ))}
        <button className="queue-panel__viewall">View full impact →</button>
      </div>
    </div>
  );
}