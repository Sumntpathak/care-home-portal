/**
 * WebSocket Live Sync — real-time data sync between devices
 *
 * Connects to the LAN server (or cloud) WebSocket endpoint.
 * When any device writes data, the server broadcasts the change
 * to all connected clients, which update their local IndexedDB.
 */
import { put } from './offlineDb';
import { getApiUrl, getConnectionType, onConnectionChange } from './serverDiscovery';

let ws = null;
let reconnectTimer = null;
let reconnectDelay = 1000; // starts at 1s, doubles each retry up to 30s
let heartbeatTimer = null;
let listeners = [];
const HEARTBEAT_INTERVAL = 30000; // 30 seconds
const MAX_RECONNECT_DELAY = 30000;

// Device ID — unique per browser tab
const DEVICE_ID = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

/**
 * Connect to the WebSocket sync channel.
 */
export function connect() {
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return;

  const baseUrl = getApiUrl();
  if (!baseUrl || getConnectionType() === 'offline') return;

  const wsUrl = baseUrl.replace(/^http/, 'ws') + '/ws';

  try {
    ws = new WebSocket(wsUrl);
  } catch {
    scheduleReconnect();
    return;
  }

  ws.onopen = () => {
    console.log('[LiveSync] Connected to', wsUrl);
    reconnectDelay = 1000; // reset backoff
    startHeartbeat();
    notify('connected');

    // Announce this device
    send({ type: 'join', deviceId: DEVICE_ID });
  };

  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);
      handleMessage(msg);
    } catch {}
  };

  ws.onclose = () => {
    console.log('[LiveSync] Disconnected');
    stopHeartbeat();
    notify('disconnected');
    scheduleReconnect();
  };

  ws.onerror = () => {
    ws?.close();
  };
}

/**
 * Disconnect from WebSocket.
 */
export function disconnect() {
  if (reconnectTimer) clearTimeout(reconnectTimer);
  stopHeartbeat();
  if (ws) {
    ws.onclose = null; // prevent reconnect
    ws.close();
    ws = null;
  }
  notify('disconnected');
}

/**
 * Send a message over WebSocket.
 */
function send(data) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ ...data, deviceId: DEVICE_ID }));
  }
}

/**
 * Broadcast a data change to other devices.
 * Call this after a successful API write.
 */
export function broadcastChange(entityType, entityId, data, operation = 'upsert') {
  send({
    type: 'change',
    entityType,
    entityId,
    operation,
    data,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Handle incoming WebSocket messages.
 */
async function handleMessage(msg) {
  if (msg.type === 'pong') return; // heartbeat response

  if (msg.type === 'change' && msg.deviceId !== DEVICE_ID) {
    // Another device made a change — update local IndexedDB
    const { entityType, entityId, data, operation } = msg;

    if (operation === 'delete') {
      // Handle deletion
      const { remove } = await import('./offlineDb');
      await remove(entityType, entityId).catch(() => {});
    } else if (data) {
      // Upsert
      await put(entityType, { ...data, _syncedAt: Date.now() }).catch(() => {});
    }

    // Notify UI listeners
    notify('change', { entityType, entityId, operation });
  }
}

function startHeartbeat() {
  stopHeartbeat();
  heartbeatTimer = setInterval(() => send({ type: 'ping' }), HEARTBEAT_INTERVAL);
}

function stopHeartbeat() {
  if (heartbeatTimer) clearInterval(heartbeatTimer);
}

function scheduleReconnect() {
  if (reconnectTimer) clearTimeout(reconnectTimer);
  reconnectTimer = setTimeout(() => {
    reconnectDelay = Math.min(reconnectDelay * 2, MAX_RECONNECT_DELAY);
    connect();
  }, reconnectDelay);
}

/**
 * Subscribe to live sync events.
 * @param {Function} callback — receives (event, data)
 *   event: 'connected' | 'disconnected' | 'change'
 *   data: { entityType, entityId, operation } for 'change'
 */
export function onLiveSyncEvent(callback) {
  listeners.push(callback);
  return () => { listeners = listeners.filter(cb => cb !== callback); };
}

function notify(event, data) {
  listeners.forEach(cb => { try { cb(event, data); } catch {} });
}

/**
 * Get current WebSocket state.
 */
export function isConnected() {
  return ws && ws.readyState === WebSocket.OPEN;
}

// Auto-reconnect when server discovery changes
onConnectionChange(({ type }) => {
  if (type === 'offline') {
    disconnect();
  } else {
    disconnect();
    connect();
  }
});
