import { useState } from 'react';
import { Header } from './components/Header.jsx';
import { Map } from './components/Map.jsx';
import { MapLegend } from './components/MapLegend.jsx';
import { Queue } from './components/Queue.jsx';
import { DataStrip } from './components/DataStrip.jsx';
import { ReportModal } from './components/ReportModal.jsx';
import { DonorForm } from './components/DonorForm.jsx';
import { HostPage } from './components/HostPage.jsx';
import { RunnerPage } from './components/RunnerPage.jsx';
import { useDashboardState } from './hooks/useDashboardState.js';
import { submitDonation, markFridgeEmpty, completeDelivery } from './api/client.js';

export default function App() {
  const { state, loading, error, refresh } = useDashboardState(15000);
  const [showReport, setShowReport] = useState(false);
  const [view, setView] = useState('coordinator'); // 'coordinator' | 'donor' | 'host' | 'runner'

  const { fridges = [], offers = [], dispatches = [], approvals = [] } = state;

  const handleDonationSubmit = async (formData) => {
    await submitDonation(formData);
    await refresh();
  };

  const handleMarkEmpty = async (fridgeId) => {
    await markFridgeEmpty(fridgeId);
    await refresh();
  };

  const handleCompleteDelivery = async (dispatchId) => {
    await completeDelivery(dispatchId);
    await refresh();
  };

  return (
    <div className="app">
      <Header
        view={view}
        setView={setView}
        onOpenReport={() => setShowReport(true)}
        loading={loading}
        error={error}
      />

      {/* Loading bar */}
      {loading && <div className="loading-bar" role="progressbar" aria-label="Loading dashboard" />}

      {/* Main workspace */}
      {view === 'coordinator' && (
        <>
          <main className="workspace">
            <div className="map-pane">
              <Map fridges={fridges} />
              <MapLegend />
            </div>
            <Queue approvals={approvals} dispatches={dispatches} onRefresh={refresh} />
          </main>
          <DataStrip fridges={fridges} dispatches={dispatches} offers={offers} />
        </>
      )}

      {view === 'donor' && (
        <main className="workspace" style={{ display: 'block', padding: '2rem' }}>
          <DonorForm fridges={fridges} onSubmit={handleDonationSubmit} />
        </main>
      )}

      {view === 'host' && (
        <main className="workspace" style={{ display: 'block', padding: '2rem' }}>
          <HostPage fridges={fridges} onMarkEmpty={handleMarkEmpty} />
        </main>
      )}

      {view === 'runner' && (
        <main className="workspace" style={{ display: 'block', padding: '2rem' }}>
          <RunnerPage dispatches={dispatches} fridges={fridges} onComplete={handleCompleteDelivery} />
        </main>
      )}

      {/* Report modal */}
      {showReport && <ReportModal onClose={() => setShowReport(false)} />}
    </div>
  );
}