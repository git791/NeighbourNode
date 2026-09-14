import { useState } from 'react';
import { Lightbulb, Package, ShieldCheck, Bell, Heart, MessageCircle, Leaf, X, Clock } from 'lucide-react';

const TIPS = [
  { icon: Package, text: "Check the items before pickup and make sure they're safe to transport." },
  { icon: ShieldCheck, text: 'Keep food cool and secure during delivery.' },
  { icon: Bell, text: 'Let the host know when you arrive.' },
  { icon: Heart, text: "Thank you! You're the link that makes this work." },
];

// Demo baseline numbers for a fresh runner — shows what the network has achieved collectively
const DEMO_BASELINE = { deliveries: 12, meals: 96, food_kg: 30, communities: 3 };

function ImpactModal({ completedCount, onClose }) {
  const deliveries = completedCount + DEMO_BASELINE.deliveries;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: 'white', borderRadius: 16, padding: 32, maxWidth: 480, width: '90%', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
        <h2 style={{ marginBottom: 8, color: 'var(--crate-green)' }}>Your Full Impact</h2>
        <p style={{ color: 'var(--chalkboard-muted)', marginBottom: 20, fontSize: 14 }}>Every delivery keeps food out of the bin and into bellies.</p>
        <div style={{ display: 'grid', gap: 0 }}>
          {[
            ['Deliveries completed', deliveries],
            ['Est. meals delivered', deliveries * 8],
            ['Est. food saved', `~${(deliveries * 2.5).toFixed(1)} kg`],
            ['Communities served', Math.min(deliveries, 4)],
          ].map(([label, val], i, arr) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: i < arr.length - 1 ? '1px solid #eee' : 'none' }}>
              <span style={{ color: '#555' }}>{label}</span><strong>{val}</strong>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ActivityModal({ completedCount, onClose }) {
  const activities = [
    { label: 'Fridge restocked', by: 'Aamir M. (Runner)', ago: '12h ago' },
    { label: 'Marked as low', by: 'Host', ago: '2d ago' },
    { label: 'Fridge restocked', by: 'Jordan K. (Runner)', ago: '5d ago' },
  ];
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: 'white', borderRadius: 16, padding: 32, maxWidth: 480, width: '90%', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
        <h2 style={{ marginBottom: 16, color: 'var(--crate-green)' }}>Recent Activity</h2>
        {completedCount > 0 && (
          <div style={{ background: '#f0faf4', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 14 }}>
            ✅ You completed {completedCount} delivery(s) this session!
          </div>
        )}
        {activities.map((a, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #eee', fontSize: 14 }}>
            <div>
              <div style={{ fontWeight: 600 }}>{a.label}</div>
              <div style={{ color: '#888' }}>by {a.by}</div>
            </div>
            <span style={{ color: '#aaa' }}>{a.ago}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function RunnerSidebar({ completedCount = 0 }) {
  const [showImpact, setShowImpact] = useState(false);
  const [showActivity, setShowActivity] = useState(false);

  const totalDeliveries = completedCount + DEMO_BASELINE.deliveries;
  const stats = [
    { icon: Package, label: 'Deliveries completed', value: totalDeliveries },
    { icon: Leaf, label: 'Est. meals delivered', value: totalDeliveries * 8 },
    { icon: MessageCircle, label: 'Est. food saved', value: `~${(totalDeliveries * 2.5).toFixed(1)} kg` },
    { icon: Heart, label: 'Communities served', value: Math.min(totalDeliveries, 4) },
  ];

  return (
    <div className="host-sidebar">
      {showImpact && <ImpactModal completedCount={completedCount} onClose={() => setShowImpact(false)} />}
      {showActivity && <ActivityModal completedCount={completedCount} onClose={() => setShowActivity(false)} />}

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
          <Clock size={18} color="var(--crate-green)" />
          Recent Activity
        </div>
        <div className="host-tip" style={{ marginBottom: 4 }}>
          <span className="host-tip__icon"><Package size={15} /></span>
          <span>Fridge restocked <span style={{ color: '#aaa', fontSize: 12 }}>12h ago</span></span>
        </div>
        <div className="host-tip" style={{ marginBottom: 4 }}>
          <span className="host-tip__icon"><Package size={15} /></span>
          <span>Marked as low <span style={{ color: '#aaa', fontSize: 12 }}>2d ago</span></span>
        </div>
        <div className="host-tip">
          <span className="host-tip__icon"><Package size={15} /></span>
          <span>Fridge restocked <span style={{ color: '#aaa', fontSize: 12 }}>5d ago</span></span>
        </div>
        <button className="queue-panel__viewall" onClick={() => setShowActivity(true)}>View full history →</button>
      </div>
    </div>
  );
}