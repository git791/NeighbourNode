import { useState } from 'react';
import { Header } from './components/Header.jsx';
import { Map } from './components/Map.jsx';
import { MapLegend } from './components/MapLegend.jsx';
import { Queue } from './components/Queue.jsx';
import { DataStrip } from './components/DataStrip.jsx';
import { ReportModal } from './components/ReportModal.jsx';
import { DonorForm } from './components/DonorForm.jsx';
import { DonorSuccess } from './components/DonorSuccess.jsx';
import { Leaderboard } from './components/Leaderboard.jsx';
import { DonorBanner } from './components/DonorBanner.jsx';
import { HostPage } from './components/HostPage.jsx';
import { RunnerPage } from './components/RunnerPage.jsx';
import { useDashboardState } from './hooks/useDashboardState.js';
import { submitDonation, markFridgeEmpty, markFridgeLow, completeDelivery } from './api/client.js';
export default function App() {
  const { state, loading, error, refresh } = useDashboardState(15000);
  const [showReport, setShowReport] = useState(false);
  const [view, setView] = useState('coordinator'); // 'coordinator' | 'donor' | 'host' | 'runner'
  const [donationJustLogged, setDonationJustLogged] = useState(false);

  const { fridges = [], offers = [], dispatches = [], approvals = [] } = state;

  const handleDonationSubmit = async (formData) => {
    await submitDonation(formData);
    await refresh();
    setDonationJustLogged(true);
  };

  const handleMarkEmpty = async (fridgeId) => {
    await markFridgeEmpty(fridgeId);
    await refresh();
  };
  const handleMarkLow = async (fridgeId) => {
  await markFridgeLow(fridgeId);
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
        <main className="donor-page">
          <div className="donor-page__main">
            {donationJustLogged ? (
              <DonorSuccess onLogAnother={() => setDonationJustLogged(false)} />
            ) : (
              <DonorForm fridges={fridges} onSubmitSuccess={handleDonationSubmit} />
            )}
          </div>
          <div className="donor-page__side">
            <Leaderboard offers={offers} />
          </div>
          <div className="donor-page__banner">
            <DonorBanner />
          </div>
        </main>
      )}

      {view === 'host' && (
        <HostPage fridges={fridges} onMarkEmpty={handleMarkEmpty} onMarkLow={handleMarkLow} />
      )}

      {view === 'runner' && (
  <RunnerPage
    dispatches={dispatches}
    fridges={fridges}
    offers={offers}
    onComplete={handleCompleteDelivery}
  />
)}

      {/* Report modal */}
      {showReport && <ReportModal onClose={() => setShowReport(false)} />}
    </div>
  );
}