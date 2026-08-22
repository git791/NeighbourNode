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

export const approveItem = (approvalId, coordinatorNote = '') =>
  apiFetch('/approve', {
    method: 'POST',
    body: JSON.stringify({ approval_id: approvalId, coordinator_note: coordinatorNote }),
  });

export const rejectItem = (approvalId, coordinatorNote = '') =>
  apiFetch('/reject', {
    method: 'POST',
    body: JSON.stringify({ approval_id: approvalId, coordinator_note: coordinatorNote }),
  });

export const getReport = (fromDate, toDate, format = 'markdown') =>
  apiFetch(`/report?from=${fromDate}&to=${toDate}&format=${format}`);