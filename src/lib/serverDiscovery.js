/**
 * Server Discovery — auto-detect LAN vs Cloud vs Offline
 *
 * Priority: LAN server → Cloud API → Offline mode
 * Re-checks connectivity every 5 minutes.
 */

const LAN_URL = import.meta.env.VITE_LAN_URL || null;    // e.g., http://192.168.1.100:8787
const CLOUD_URL = import.meta.env.VITE_API_URL || '';     // e.g., https://shanti-care-api.workers.dev
const DISCOVERY_INTERVAL = 5 * 60 * 1000; // 5 minutes
const PROBE_TIMEOUT = 3000; // 3 seconds

let activeUrl = CLOUD_URL; // default to cloud
let connectionType = 'cloud'; // 'lan' | 'cloud' | 'offline'
let listeners = [];
let discoveryTimer = null;

/**
 * Probe a server URL with a fast health check.
 */
async function probe(url) {
  if (!url) return false;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PROBE_TIMEOUT);
  try {
    const res = await fetch(`${url}/api/health`, {
      method: 'HEAD',
      signal: controller.signal,
      cache: 'no-store',
    });
    return res.ok || res.status === 204;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Discover the best available server.
 */
export async function discover() {
  if (!navigator.onLine) {
    setConnection(null, 'offline');
    return;
  }

  // Try LAN first (fastest if on hospital WiFi)
  if (LAN_URL) {
    const lanOk = await probe(LAN_URL);
    if (lanOk) {
      setConnection(LAN_URL, 'lan');
      return;
    }
  }

  // Fall back to cloud
  if (CLOUD_URL) {
    const cloudOk = await probe(CLOUD_URL);
    if (cloudOk) {
      setConnection(CLOUD_URL, 'cloud');
      return;
    }
  }

  // Both down — offline mode
  setConnection(null, 'offline');
}

function setConnection(url, type) {
  const changed = url !== activeUrl || type !== connectionType;
  activeUrl = url;
  connectionType = type;
  if (changed) {
    listeners.forEach(cb => { try { cb({ url: activeUrl, type: connectionType }); } catch {} });
  }
}

/**
 * Get the current active API base URL.
 */
export function getApiUrl() {
  return activeUrl || CLOUD_URL;
}

/**
 * Get the current connection type.
 * @returns {'lan' | 'cloud' | 'offline'}
 */
export function getConnectionType() {
  return connectionType;
}

/**
 * Subscribe to connection changes.
 */
export function onConnectionChange(callback) {
  listeners.push(callback);
  return () => { listeners = listeners.filter(cb => cb !== callback); };
}

/**
 * Start periodic discovery.
 */
export function startDiscovery() {
  discover(); // initial probe
  if (discoveryTimer) clearInterval(discoveryTimer);
  discoveryTimer = setInterval(discover, DISCOVERY_INTERVAL);

  // Also re-discover on online/offline events
  window.addEventListener('online', discover);
  window.addEventListener('offline', () => setConnection(null, 'offline'));
}

/**
 * Stop periodic discovery.
 */
export function stopDiscovery() {
  if (discoveryTimer) clearInterval(discoveryTimer);
  window.removeEventListener('online', discover);
}
