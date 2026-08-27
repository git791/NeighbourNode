import { useState } from 'react';
import { FridgeCard } from './FridgeCard.jsx';

export function HostPage({ fridges = [], onMarkEmpty }) {
  const [selectedFridgeId, setSelectedFridgeId] = useState('');
  const [confirming, setConfirming] = useState(false);

  const selectedFridge = fridges.find((f) => f.entity_id === selectedFridgeId);

  const handleMarkEmpty = async () => {
    setConfirming(true);
    await onMarkEmpty(selectedFridgeId);
    setConfirming(false);
  };

  return (
    <div className="host-page">
      <h2>My Fridge</h2>

      <label>
        Select your fridge
        <select
          value={selectedFridgeId}
          onChange={(e) => setSelectedFridgeId(e.target.value)}
        >
          <option value="">Choose a fridge</option>
          {fridges.map((f) => (
            <option key={f.entity_id} value={f.entity_id}>
              {f.name}
            </option>
          ))}
        </select>
      </label>

      {selectedFridge && (
        <div style={{ marginTop: '1.5rem', maxWidth: '320px' }}>
          <FridgeCard fridge={selectedFridge} />

          <button
            className="btn btn--reject"
            style={{ marginTop: '1rem' }}
            onClick={handleMarkEmpty}
            disabled={selectedFridge.status === 'empty' || confirming}
          >
            {confirming
              ? 'Updating…'
              : selectedFridge.status === 'empty'
              ? 'Already marked empty'
              : 'Mark as Empty'}
          </button>
        </div>
      )}
    </div>
  );
}