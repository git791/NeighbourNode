import { useState } from 'react';
import { Lightbulb, Package, ShieldCheck, Bell, Heart, MessageCircle, Leaf, X } from 'lucide-react';

const TIPS = [
  { icon: Package, text: "Check the items before pickup and make sure they're safe to transport." },
  { icon: ShieldCheck, text: 'Keep food cool and secure during delivery.' },
  { icon: Bell, text: 'Let the host know when you arrive.' },
  { icon: Heart, text: "Thank you! You're the link that makes this work." },
];

function ImpactModal({ completedCount, onClose }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: 'white', borderRadius: 16, padding: 32, maxWidth: 480, width: '90%', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
        <h2 style={{ marginBottom: 16, color: 'var(--crate-green)' }}>Your Full Impact</h2>
        <p style={{ color: 'var(--chalkboard-muted)', marginBottom: 20 }}>Every delivery you complete helps keep food out of the bin and into bellies.</p>
        <div style={{ display: 'grid', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #eee' }}>
            <span>Deliveries completed</span><strong>{completedCount}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #eee' }}>
            <span>Est. meals delivered</span><strong>{(completedCount * 8).toLocaleString()}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0' }}>
            <span>Estimated food saved</span><strong>~{(completedCount * 2.5).toFixed(1)} kg</strong>
          </div>
        </div>
      </div>
    </div>
  );
}

function ActivityModal({ onClose }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: 'white', borderRadius: 16, padding: 32, maxWidth: 480, width: '90%', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
        <h2 style={{ marginBottom: 16, color: 'var(--crate-green)' }}>Recent Activity</h2>
        <p style={{ color: 'var(--chalkboard-muted)' }}>
          Full delivery history is tracked in the coordinator dashboard. As you complete more deliveries, your history will build up here.
        </p>
        <p style={{ marginTop: 16, color: 'var(--chalkboard-muted)', fontSize: 14 }}>
          Complete a delivery below to start logging your real activity!
        </p>
      </div>
    </div>
  );
}

export function RunnerSidebar({ completedCount = 0 }) {
  const [showImpact, setShowImpact] = useState(false);
  const [showActivity, setShowActivity] = useState(false);

  const stats = [
    { icon: Package, label: 'Deliveries completed', value: completedCount },
    { icon: Leaf, label: 'Est. meals delivered', value: (completedCount * 8) || 0 },
    { icon: MessageCircle, label: 'Est. food saved', value: `~${(completedCount * 2.5).toFixed(1)} kg` },
    { icon: Heart, label: 'Communities served', value: completedCount > 0 ? 1 : 0 },
  ];

  return (
    <div className="host-sidebar">
      {showImpact && <ImpactModal completedCount={completedCount} onClose={() => setShowImpact(false)} />}
      {showActivity && <ActivityModal onClose={() => setShowActivity(false)} />}

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
        <button className="queue-panel__viewall" onClick={() => setShowImpact(true)}>View full impact →</button>
      </div>

      <div className="host-sidebar__panel">
        <div className="host-sidebar__header">
          <MessageCircle size={18} color="var(--crate-green)" />
          Recent Activity
        </div>
        {completedCount === 0 ? (
          <p style={{ color: 'var(--chalkboard-muted)', fontSize: 14 }}>No completed deliveries yet. Pick one up below!</p>
        ) : (
          <p style={{ color: 'var(--chalkboard-muted)', fontSize: 14 }}>{completedCount} delivery(s) completed this session.</p>
        )}
        <button className="queue-panel__viewall" onClick={() => setShowActivity(true)}>View full history →</button>
      </div>
    </div>
  );
}