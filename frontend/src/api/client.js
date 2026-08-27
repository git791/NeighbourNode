import { mockDashboardState } from './mockData.js';

const BASE = import.meta.env.VITE_API_BASE_URL || '';

async function apiFetch(path, options = {}) {
  if (!BASE) {
    throw new Error('API not connected. Run sam deploy first to get your API URL.');
  }
  const url = `${BASE}${path}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export const getDashboardState = () => {
  if (!BASE) {
    // No real API deployed yet — use mock data so the dashboard has content to show.
    return Promise.resolve(mockDashboardState);
  }
  return apiFetch('/dashboard');
};

export const approveItem = (approvalId, coordinatorNote = '') => {
  if (!BASE) {
    const item = mockDashboardState.approvals.find(a => a.approval_id === approvalId);
    if (item) item.status = 'approved';
    return Promise.resolve({ success: true });
  }
  return apiFetch('/approve', {
    method: 'POST',
    body: JSON.stringify({ approval_id: approvalId, coordinator_note: coordinatorNote }),
  });
};

export const rejectItem = (approvalId, coordinatorNote = '') => {
  if (!BASE) {
    const item = mockDashboardState.approvals.find(a => a.approval_id === approvalId);
    if (item) item.status = 'rejected';
    return Promise.resolve({ success: true });
  }
  return apiFetch('/reject', {
    method: 'POST',
    body: JSON.stringify({ approval_id: approvalId, coordinator_note: coordinatorNote }),
  });
};

export const getReport = (fromDate, toDate, format = 'markdown') =>
  apiFetch(`/report?from=${fromDate}&to=${toDate}&format=${format}`);

export const submitDonation = (donation) => {
  if (!BASE) {
    const newOffer = {
      offer_id: `offer-${Date.now()}`,
      donor_name: donation.donor_name,
      food_type: donation.food_type,
      quantity: donation.quantity,
      fridge_id: donation.fridge_id,
      notes: donation.notes,
      status: 'open',
      created_at: new Date().toISOString(),
    };
    mockDashboardState.offers.push(newOffer);
    return Promise.resolve({ success: true, offer: newOffer });
  }
  return apiFetch('/offer', {
    method: 'POST',
    body: JSON.stringify(donation),
  });
};
export const markFridgeEmpty = (fridgeId) => {
  if (!BASE) {
    const fridge = mockDashboardState.fridges.find(f => f.entity_id === fridgeId);
    if (fridge) {
      fridge.status = 'empty';
      fridge.filled_count = 0;
    }
    return Promise.resolve({ success: true });
  }
  return apiFetch('/fridge/empty', {
    method: 'POST',
    body: JSON.stringify({ fridge_id: fridgeId }),
  });
};