import { Lightbulb, Package, Thermometer, Heart, MessageCircle, Clock } from 'lucide-react';

const TIPS = [
  { icon: Package, text: 'Try to keep common items visible and accessible.' },
  { icon: Thermometer, text: 'Store perishable food safely and check temperatures.' },
  { icon: Heart, text: 'Take what you need, leave what you can.' },
  { icon: MessageCircle, text: 'Need help or have questions? We\'re here for you.' },
];

const MOCK_ACTIVITY = [
  { icon: Package, text: 'Fridge restocked', by: 'Aisha (Runner)', when: '12h ago' },
  { icon: Package, text: 'Marked as low', by: 'You', when: '2d ago' },
  { icon: Package, text: 'Fridge restocked', by: 'Fatima (Runner)', when: '5d ago' },
];

export function HostSidebar() {
  return (
    <div className="host-sidebar">
      <div className="host-sidebar__panel">
        <div className="host-sidebar__header">
          <Lightbulb size={18} color="var(--marigold)" />
          Hosting Tips
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
          <Clock size={18} color="var(--chalkboard-muted)" />
          Recent Activity
        </div>
        {MOCK_ACTIVITY.map((item, i) => (
          <div key={i} className="host-activity-row">
            <span className="host-activity-row__icon"><item.icon size={15} /></span>
            <div className="host-activity-row__text">
              <div className="host-activity-row__title">{item.text}</div>
              <div className="host-activity-row__by">by {item.by}</div>
            </div>
            <div className="host-activity-row__when">{item.when}</div>
          </div>
        ))}
        <button className="queue-panel__viewall">View full history →</button>
      </div>
    </div>
  );
}