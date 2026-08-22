// src/api/mockData.js
// Fake data standing in for the real backend until it's deployed.
// Shapes here match exactly what FridgeCard, Map, Queue, and DataStrip expect.

export const mockFridges = [
  {
    entity_id: 'fridge-001',
    name: 'Bed-Stuy Community Fridge',
    address: '123 Nostrand Ave, Brooklyn, NY',
    status: 'stocked',
    filled_count: 5,
    capacity: 5,
    lat: 40.685,
    lng: -73.951,
    last_restocked_at: '2026-08-20T09:30:00Z',
  },
  {
    entity_id: 'fridge-002',
    name: 'Fulton Street Fridge',
    address: '456 Fulton St, Brooklyn, NY',
    status: 'low',
    filled_count: 2,
    capacity: 5,
    lat: 40.688,
    lng: -73.978,
    last_restocked_at: '2026-08-19T14:00:00Z',
  },
  {
    entity_id: 'fridge-003',
    name: 'Bedford Ave Fridge',
    address: '789 Bedford Ave, Brooklyn, NY',
    status: 'empty',
    filled_count: 0,
    capacity: 6,
    lat: 40.690,
    lng: -73.960,
    last_restocked_at: '2026-08-17T11:00:00Z',
  },
  {
    entity_id: 'fridge-004',
    name: 'Crown Heights Fridge',
    address: '321 Utica Ave, Brooklyn, NY',
    status: 'flagged',
    filled_count: 1,
    capacity: 5,
    lat: 40.675,
    lng: -73.930,
    last_restocked_at: '2026-08-18T08:15:00Z',
  },
];

export const mockOffers = [
  { offer_id: 'offer-101', donor_name: "Maria's Bakery", food_type: 'Bread', status: 'open' },
  { offer_id: 'offer-102', donor_name: 'Green Thumb Garden', food_type: 'Vegetables', status: 'open' },
  { offer_id: 'offer-103', donor_name: 'Corner Grocery', food_type: 'Canned goods', status: 'claimed' },
];

export const mockDispatches = [
  {
    dispatch_id: 'dispatch-201',
    offer_id: 'offer-103',
    fridge_id: 'fridge-002',
    runner_id: 'runner-Aisha',
    status: 'active',
    created_at: '2026-08-20T10:00:00Z',
  },
];

export const mockApprovals = [
  {
    approval_id: 'approval-301',
    item_type: 'donor',
    item_id: 'donor-Corner-Grocery',
    reason: 'First-time donor — needs verification',
    status: 'pending',
    created_at: '2026-08-20T09:00:00Z',
  },
];

export const mockDashboardState = {
  fridges: mockFridges,
  offers: mockOffers,
  dispatches: mockDispatches,
  approvals: mockApprovals,
};