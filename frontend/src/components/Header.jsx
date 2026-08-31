import { useState } from 'react';
import { Users, Package, Refrigerator, Bike, BarChart3 } from 'lucide-react';

const ROLES = [
  { id: 'coordinator', label: 'Coordinator', icon: Users },
  { id: 'donor', label: 'Donor', icon: Package },
  { id: 'host', label: 'Host', icon: Refrigerator },
  { id: 'runner', label: 'Runner', icon: Bike },
];

export function Header({ view, setView, onOpenReport, loading, error }) {
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  const currentRole = ROLES.find((r) => r.id === view) || ROLES[0];
  const CurrentIcon = currentRole.icon;

  return (
    <header className="header">
      <div className="header__left">
        <div className="header__brand">
          <div className="header__logo">
            Neighbor<span className="header__logo-accent">Node</span>
          </div>
          <div className="header__tagline">No food waste, no empty stomachs.</div>
        </div>
      </div>

      <div className="header__actions">
        {loading && <span className="header__status">syncing…</span>}
        {error && <span className="header__status header__status--error">⚠ {error}</span>}

        <div className="role-switcher">
          <button className="header-pill-btn" onClick={() => setRoleMenuOpen((o) => !o)}>
            <CurrentIcon size={16} />
            {currentRole.label}
            <span className="role-switcher__chevron">▾</span>
          </button>
          {roleMenuOpen && (
            <div className="role-switcher__menu">
              {ROLES.map((role) => {
                const Icon = role.icon;
                return (
                  <button
                    key={role.id}
                    className="role-switcher__option"
                    onClick={() => {
                      setView(role.id);
                      setRoleMenuOpen(false);
                    }}
                  >
                    <Icon size={16} />
                    {role.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {view === 'coordinator' && (
          <button className="header-pill-btn" onClick={onOpenReport}>
            <BarChart3 size={16} />
            Report
          </button>
        )}
      </div>
    </header>
  );
}