import { useState } from 'react';
import { HostHeader } from './HostHeader.jsx';
import { HostFridgeStatus } from './HostFridgeStatus.jsx';
import { HostActionPanel } from './HostActionPanel.jsx';
import { HostSidebar } from './HostSidebar.jsx';
import { DonorBanner } from './DonorBanner.jsx';

export function HostPage({ fridges = [], onMarkEmpty, onMarkLow, onUpdateCount }) {
  const [selectedFridgeId, setSelectedFridgeId] = useState('');
  const [confirming, setConfirming] = useState(false);

  const selectedFridge = fridges.find((f) => f.entity_id === selectedFridgeId);

  const handleMarkEmpty = async () => {
    setConfirming(true);
    await onMarkEmpty(selectedFridgeId);
    setConfirming(false);
  };

  const handleMarkLow = async () => {
    setConfirming(true);
    await onMarkLow(selectedFridgeId);
    setConfirming(false);
  };

  const handleUpdateCount = async (count) => {
    setConfirming(true);
    await onUpdateCount(selectedFridgeId, count);
    setConfirming(false);
  };

  return (
    <main className="host-page">
      <div className="host-page__main">
        <HostHeader />

        <div className="host-fridge-select">
          <label>
            Select your fridge
            <select value={selectedFridgeId} onChange={(e) => setSelectedFridgeId(e.target.value)}>
              <option value="">Choose a fridge</option>
              {fridges.map((f) => (
                <option key={f.entity_id} value={f.entity_id}>{f.name}</option>
              ))}
            </select>
          </label>
        </div>

        {selectedFridge && (
          <>
            <HostFridgeStatus fridge={selectedFridge} />
            <HostActionPanel
              fridge={selectedFridge}
              onMarkEmpty={handleMarkEmpty}
              onMarkLow={handleMarkLow}
              onUpdateCount={handleUpdateCount}
              confirming={confirming}
            />
          </>
        )}

        <DonorBanner />
      </div>

      <div className="host-page__side">
        <HostSidebar />
      </div>
    </main>
  );
}