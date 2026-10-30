/**
 * FinSplit Server Health & Cold-Start Warmup Manager
 * Specifically coordinates Render.com free tier cold starts.
 */
import { getApiUrl } from './api.js';

let isHealthyCached = false;
let lastHealthyTime = 0;
const HEALTH_CACHE_TTL = 3 * 60 * 1000; // 3 minutes cache

let currentCheckPromise = null;
const listeners = new Set();

let currentState = {
  status: 'idle', // 'idle' | 'checking' | 'ready' | 'error'
  elapsedSeconds: 0,
  maxSeconds: 60,
  message: '',
  retryFn: null
};

export const getServerHealthState = () => currentState;

export const subscribeServerHealth = (callback) => {
  listeners.add(callback);
  callback(currentState);
  return () => listeners.delete(callback);
};

const notify = (newState) => {
  currentState = { ...currentState, ...newState };
  listeners.forEach((listener) => {
    try {
      listener(currentState);
    } catch (e) {
      console.error('Health listener error:', e);
    }
  });
};

/**
 * Single non-blocking ping to /api/health
 */
export const pingHealthOnce = async (timeoutMs = 4000) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const healthUrl = getApiUrl('/api/health');
    const response = await fetch(healthUrl, {
      method: 'GET',
      cache: 'no-store',
      signal: controller.signal
    });

    clearTimeout(timer);
    if (response.ok) {
      isHealthyCached = true;
      lastHealthyTime = Date.now();
      return true;
    }
    return false;
  } catch (err) {
    clearTimeout(timer);
    return false;
  }
};

/**
 * Silently pre-warm server in background without blocking the UI
 */
export const preWarmServer = async () => {
  // If known to be recently healthy, skip pre-warm
  if (isHealthyCached && Date.now() - lastHealthyTime < HEALTH_CACHE_TTL) {
    return;
  }

  try {
    await pingHealthOnce(6000);
  } catch (err) {
    // Ignore silent pre-warm error
  }
};

/**
 * Ensure backend is healthy before executing critical action (login, register, OAuth, etc.)
 * Shows modal if cold start takes more than 1.5 seconds.
 * Times out after 60 seconds with an error message.
 */
export const ensureServerReady = async ({ maxWaitMs = 60000, force = false } = {}) => {
  // If cached and still valid, resolve immediately
  if (!force && isHealthyCached && Date.now() - lastHealthyTime < HEALTH_CACHE_TTL) {
    return true;
  }

  // Deduplicate ongoing checks
  if (currentCheckPromise) {
    return currentCheckPromise;
  }

  currentCheckPromise = (async () => {
    // 1. First quick probe (up to 1500ms). If server is already awake, don't even flash modal!
    const quickProbeSuccess = await pingHealthOnce(1500);
    if (quickProbeSuccess) {
      currentCheckPromise = null;
      return true;
    }

    // 2. Server is sleeping or cold. Activate warmup screen.
    const startTime = Date.now();
    const maxSeconds = Math.round(maxWaitMs / 1000);

    notify({
      status: 'checking',
      elapsedSeconds: 0,
      maxSeconds,
      message: "Render free tier instance is spinning up. Waking up the server...",
      retryFn: () => ensureServerReady({ maxWaitMs, force: true })
    });

    // Start timer ticker
    const ticker = setInterval(() => {
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      if (currentState.status === 'checking') {
        notify({ elapsedSeconds: Math.min(elapsed, maxSeconds) });
      }
    }, 500);

    try {
      while (Date.now() - startTime < maxWaitMs) {
        const isHealthy = await pingHealthOnce(3500);

        if (isHealthy) {
          clearInterval(ticker);
          notify({
            status: 'ready',
            message: 'Server is online and ready!'
          });

          // Short visual confirmation before closing
          await new Promise((r) => setTimeout(r, 600));
          notify({ status: 'idle' });
          currentCheckPromise = null;
          return true;
        }

        // Wait 2 seconds before next ping
        await new Promise((r) => setTimeout(r, 2000));
      }

      // If loop exited due to timeout (1 minute reached)
      clearInterval(ticker);
      notify({
        status: 'error',
        elapsedSeconds: maxSeconds,
        message: 'The server is experiencing some issues or taking longer than expected to wake up. Please try again later.'
      });

      currentCheckPromise = null;
      return false;
    } catch (err) {
      clearInterval(ticker);
      notify({
        status: 'error',
        message: 'Failed to verify server health. Please check your internet connection and try again.'
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
