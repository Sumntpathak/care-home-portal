/**
 * serverDiscovery — stub.
 *
 * Production only has one API base: VITE_API_URL (Cloudflare Workers).
 * The original 121-LOC LAN auto-probe with 5-min polling never served a
 * real LAN deployment. Replaced with a trivial resolver.
 */

const API_URL = import.meta.env.VITE_API_URL || '';

export function getApiUrl() {
  return API_URL;
}

export function getConnectionType() {
  return navigator.onLine ? 'cloud' : 'offline';
}

export function onConnectionChange(cb) {
  const online = () => cb('cloud');
  const offline = () => cb('offline');
  window.addEventListener('online', online);
  window.addEventListener('offline', offline);
  return () => {
    window.removeEventListener('online', online);
    window.removeEventListener('offline', offline);
  };
}

export function startDiscovery() {
  // noop — nothing to discover
}
