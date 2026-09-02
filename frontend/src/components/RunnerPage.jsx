import { useState } from 'react';
import { MapPin } from 'lucide-react';
import { RunnerHeader } from './RunnerHeader.jsx';
import { DeliveryCard } from './DeliveryCard.jsx';
import { RunnerSidebar } from './RunnerSidebar.jsx';
import { DonorBanner } from './DonorBanner.jsx';

export function RunnerPage({ dispatches = [], fridges = [], offers = [], onComplete }) {
  const [selectedRunner, setSelectedRunner] = useState('');
  const [completingId, setCompletingId] = useState(null);
  const [tab, setTab] = useState('active');

  const runnerIds = [...new Set(dispatches.map((d) => d.runner_id).filter(Boolean))];

  const myDispatches = dispatches.filter((d) => d.runner_id === selectedRunner);
  const active = myDispatches.filter((d) => ['pending', 'active'].includes(d.status));
  const completed = myDispatches.filter((d) => d.status === 'completed');

  const visibleDeliveries = tab === 'active' ? active : tab === 'completed' ? completed : myDispatches;

  const getFridge = (fridgeId) => fridges.find((f) => f.entity_id === fridgeId);
  const getDonorName = (offerId) => {
    const offer = offers.find((o) => o.offer_id === offerId);
    return offer ? offer.donor_name : offerId;
  };

  const handleComplete = async (dispatchId) => {
    setCompletingId(dispatchId);
    await onComplete(dispatchId);
    setCompletingId(null);
  };

  return (
    <main className="runner-page">
      <div className="runner-page__main">
        <RunnerHeader />

        <div className="host-fridge-select">
          <label>
            Select your name
            <select value={selectedRunner} onChange={(e) => setSelectedRunner(e.target.value)}>
              <option value="">Choose runner</option>
              {runnerIds.map((id) => (
                <option key={id} value={id}>{id}</option>
              ))}
            </select>
          </label>
        </div>

        {selectedRunner && (
          <>
            <div className="runner-tabs">
              <button
                className={`runner-tab ${tab === 'active' ? 'runner-tab--selected' : ''}`}
                onClick={() => setTab('active')}
              >
                Active ({active.length})
              </button>
              <button
                className={`runner-tab ${tab === 'completed' ? 'runner-tab--selected' : ''}`}
                onClick={() => setTab('completed')}
              >
                Completed ({completed.length})
              </button>
              <button
                className={`runner-tab ${tab === 'all' ? 'runner-tab--selected' : ''}`}
                onClick={() => setTab('all')}
              >
                All ({myDispatches.length})
              </button>
            </div>

            <div className="delivery-list">
              {visibleDeliveries.map((dispatch) => {
                const fridge = getFridge(dispatch.fridge_id);
                return (
                  <DeliveryCard
                    key={dispatch.dispatch_id}
                    dispatch={dispatch}
                    donorName={getDonorName(dispatch.offer_id)}
                    fridgeName={fridge ? fridge.name : dispatch.fridge_id}
                    fridgeAddress={fridge?.address}
                    onComplete={handleComplete}
                    completing={completingId === dispatch.dispatch_id}
                  />
                );
              })}
            </div>

            {visibleDeliveries.length === 0 && (
              <div className="empty-delivery-state">
                <MapPin size={28} color="var(--chalkboard-muted)" />
                <div className="empty-delivery-state__title">No more deliveries for now</div>
                <p className="empty-delivery-state__text">
                  You're all caught up! New deliveries will appear here when they're assigned to you.
                  Thank you for making a difference. ❤️
                </p>
              </div>
            )}
          </>
        )}

        <DonorBanner />
      </div>

      <div className="runner-page__side">
        <RunnerSidebar completedCount={completed.length} />
      </div>
    </main>
  );
}