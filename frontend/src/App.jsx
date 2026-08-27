import { useState } from 'react';
import { Map } from './components/Map.jsx';
import { Queue } from './components/Queue.jsx';
import { DataStrip } from './components/DataStrip.jsx';
import { ReportModal } from './components/ReportModal.jsx';
import { DonorForm } from './components/DonorForm.jsx';
import { useDashboardState } from './hooks/useDashboardState.js';
import { submitDonation } from './api/client.js';

export default function App() {
  const { state, loading, error, refresh } = useDashboardState(15000);
  const [showReport, setShowReport] = useState(false);
  const [view, setView] = useState('coordinator'); // 'coordinator' | 'donor'

  const { fridges = [], offers = [], dispatches = [], approvals = [] } = state;

  const handleDonationSubmit = async (formData) => {
    await submitDonation(formData);
    await refresh();
  };

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header__logo">
          Neighbor<span>Node</span>
        </div>
        <div className="header__actions">
          <button
            className="btn"
            onClick={() => setView('coordinator')}
            style={{ opacity: view === 'coordinator' ? 1 : 0.5 }}
          >
            Coordinator
          </button>
          <button
            className="btn"
            onClick={() => setView('donor')}
            style={{ opacity: view === 'donor' ? 1 : 0.5 }}
          >
            Donor
          </button>
          {loading && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-mono)', opacity: 0.7 }}>syncing…</span>}
          {error && <span style={{ color: 'var(--flag-red)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-mono)' }}>⚠ {error}</span>}
          {view === 'coordinator' && (
            <button className="btn btn--report" onClick={() => setShowReport(true)} id="open-report-modal">
              Report
            </button>
          )}
        </div>
      </header>

      {/* Loading bar */}
      {loading && <div className="loading-bar" role="progressbar" aria-label="Loading dashboard" />}

      {/* Main workspace */}
      {view === 'coordinator' ? (
        <>
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
          <DataStrip fridges={fridges} dispatches={dispatches} offers={offers} />
        </>
      ) : (
        <main className="workspace" style={{ display: 'block', padding: '2rem' }}>
          <DonorForm fridges={fridges} onSubmit={handleDonationSubmit} />
        </main>
      )}

      {/* Report modal */}
      {showReport && <ReportModal onClose={() => setShowReport(false)} />}
    </div>
  );
}