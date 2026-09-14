/**
 * api/auth.js — all calls to /auth/* endpoints
 *
 * Tokens are persisted to localStorage so sessions survive page refresh.
 * Call getStoredProfile() on app load to restore the session.
 */

const BASE = import.meta.env.VITE_API_BASE_URL || '';

const TOKEN_KEY   = 'nn_access_token';
const ID_KEY      = 'nn_id_token';
const REFRESH_KEY = 'nn_refresh_token';
const PROFILE_KEY = 'nn_profile';

// ── token storage ─────────────────────────────────────────────────────────

export function storeTokens({ access_token, id_token, refresh_token }) {
  if (access_token) localStorage.setItem(TOKEN_KEY, access_token);
  if (id_token)     localStorage.setItem(ID_KEY, id_token);
  if (refresh_token) localStorage.setItem(REFRESH_KEY, refresh_token);
}

export function getAccessToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function clearTokens() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ID_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(PROFILE_KEY);
}

export function storeProfile(profile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function getStoredProfile() {
  try {
    return JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null');
  } catch {
    return null;
  }
}

// ── helpers ───────────────────────────────────────────────────────────────

async function authFetch(path, options = {}) {
  if (!BASE) throw new Error('API not connected. Run sam deploy first.');
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  const data = await res.json().catch(() => ({ error: res.statusText }));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

function authHeader() {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ── public API ────────────────────────────────────────────────────────────

/**
 * Register a new account.
 * @param {object} p
 * @param {string} p.email
 * @param {string} p.password
 * @param {'host'|'donor'|'runner'|'coordinator'} p.role
 * @param {string} p.display_name
 * @param {string} [p.phone_number]
 * @param {string} [p.transport]  runners only
 */
export async function register(p) {
  return authFetch('/auth/register', { method: 'POST', body: JSON.stringify(p) });
}

/**
 * Confirm email with verification code.
 */
export async function confirmEmail(email, code) {
  return authFetch('/auth/confirm', { method: 'POST', body: JSON.stringify({ email, code }) });
}

/**
 * Sign in and return { tokens, profile }.
 * Tokens are stored automatically.
 */
export async function signIn(email, password) {
  const data = await authFetch('/auth/signin', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  storeTokens(data.tokens);
  storeProfile(data.profile);
  return data;
}

/**
 * Fetch current user profile (requires active access token).
 */
export async function getProfile() {
  return authFetch('/auth/profile', { headers: authHeader() });
}

/**
 * Update profile fields (display_name, phone_number, transport).
 */
export async function updateProfile(fields) {
  return authFetch('/auth/profile', {
    method: 'PUT',
    headers: authHeader(),
    body: JSON.stringify(fields),
  });
}

/**
 * Sign out globally (invalidates all tokens on Cognito).
 */
export async function signOut() {
  try {
    await authFetch('/auth/signout', { method: 'POST', headers: authHeader() });
  } finally {
    clearTokens();
  }
}
