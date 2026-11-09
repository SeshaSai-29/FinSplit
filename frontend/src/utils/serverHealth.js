/**
 * FinSplit Server Health Manager
 * Handles cold-start detection with minimal requests to avoid 429 errors.
 *
 * Plan:
 *  1. Send one health ping (5s timeout).
 *  2. If it fails, show loading and wait 1 minute before retrying.
 *  3. If the retry also fails, wait another 1 minute and try once more.
 *  4. If still not healthy after ~2 minutes total, show error.
 */
import { getApiUrl } from './api.js';

let isHealthyCached = false;
let lastHealthyTime = 0;
const HEALTH_CACHE_TTL = 3 * 60 * 1000; // 3 minutes

let currentCheckPromise = null;
const listeners = new Set();

let currentState = {
  status: 'idle', // 'idle' | 'checking' | 'ready' | 'error'
  message: ''
};

export const subscribeServerHealth = (callback) => {
  listeners.add(callback);
  callback(currentState);
  return () => listeners.delete(callback);
};

const notify = (newState) => {
  currentState = { ...currentState, ...newState };
  listeners.forEach((fn) => {
    try { fn(currentState); } catch (_) { /* ignore */ }
  });
};

/**
 * Single ping to /api/health with a timeout
 */
const pingHealth = async (timeoutMs = 5000) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(getApiUrl('/api/health'), {
      method: 'GET',
      cache: 'no-store',
      signal: controller.signal
    });
    clearTimeout(timer);
    if (res.ok) {
      isHealthyCached = true;
      lastHealthyTime = Date.now();
      return true;
    }
    return false;
  } catch {
    clearTimeout(timer);
    return false;
  }
};

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Silently pre-warm server in background (single ping, no UI)
 */
export const preWarmServer = async () => {
  if (isHealthyCached && Date.now() - lastHealthyTime < HEALTH_CACHE_TTL) return;
  try { await pingHealth(6000); } catch { /* ignore */ }
};

/**
 * Ensure backend is healthy before proceeding.
 *
 * Flow:
 *  - Quick probe (2s). If healthy → return immediately, no modal.
 *  - If not healthy → show loading modal, wait 1 min, retry.
 *  - If still not healthy → wait 1 more min, retry.
 *  - If still not healthy after 2 min total → show error.
 */
export const ensureServerReady = async ({ force = false } = {}) => {
  if (!force && isHealthyCached && Date.now() - lastHealthyTime < HEALTH_CACHE_TTL) {
    return true;
  }

  // Deduplicate concurrent calls
  if (currentCheckPromise) return currentCheckPromise;

  currentCheckPromise = (async () => {
    // Quick probe — if server is already awake, skip everything
    if (await pingHealth(2000)) {
      currentCheckPromise = null;
      return true;
    }

    // Server is cold — show loading screen
    notify({ status: 'checking', message: '' });

    try {
      // Attempt 1: wait 1 minute then ping
      await wait(60000);
      if (await pingHealth(5000)) {
        notify({ status: 'ready' });
        await wait(500);
        notify({ status: 'idle' });
        currentCheckPromise = null;
        return true;
      }

      // Attempt 2: wait another 1 minute then ping
      await wait(60000);
      if (await pingHealth(5000)) {
        notify({ status: 'ready' });
        await wait(500);
        notify({ status: 'idle' });
        currentCheckPromise = null;
        return true;
      }

      // Both attempts failed
      notify({
        status: 'error',
        message: 'Something went wrong. Please try again later.'
      });
      currentCheckPromise = null;
      return false;
    } catch {
      notify({
        status: 'error',
        message: 'Something went wrong. Please try again later.'
      });
      currentCheckPromise = null;
      return false;
    }
  })();

  return currentCheckPromise;
};

export const dismissServerHealthModal = () => {
  notify({ status: 'idle' });
};
