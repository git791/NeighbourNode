import { useState } from 'react';
import { Map } from './components/Map.jsx';
import { Queue } from './components/Queue.jsx';
import { DataStrip } from './components/DataStrip.jsx';
import { ReportModal } from './components/ReportModal.jsx';
import { useDashboardState } from './hooks/useDashboardState.js';

export default function App() {
  const { state, loading, error, refresh } = useDashboardState(15000);
  const [showReport, setShowReport] = useState(false);

  const { fridges = [], offers = [], dispatches = [], approvals = [] } = state;

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header__logo">
          Neighbor<span>Node</span>
        </div>
        <div className="header__actions">
          {loading && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-mono)', opacity: 0.7 }}>syncing…</span>}
          {error && <span style={{ color: 'var(--flag-red)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-mono)' }}>⚠ {error}</span>}
          <button className="btn btn--report" onClick={() => setShowReport(true)} id="open-report-modal">
            Report
          </button>
        </div>
      </header>

      {/* Loading bar */}
      {loading && <div className="loading-bar" role="progressbar" aria-label="Loading dashboard" />}

      {/* Main workspace */}
      <main className="workspace">
        <div className="map-pane">
          <Map fridges={fridges} />
        </div>
        <Queue
          approvals={approvals}
          dispatches={dispatches}
          onRefresh={refresh}
        />
      </main>

      {/* Data strip */}
      <DataStrip fridges={fridges} dispatches={dispatches} offers={offers} />

      {/* Report modal */}
      {showReport && <ReportModal onClose={() => setShowReport(false)} />}
    </div>
  );
}
