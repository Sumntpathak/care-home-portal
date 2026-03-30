/**
 * Data Layer — Unified read/write orchestrator
 *
 * All data access goes through this layer:
 * - Reads: IndexedDB cache first → API if stale → update cache
 * - Writes: API if online → update IndexedDB
 *           Queue if offline → update IndexedDB optimistically
 *
 * Reuses: offlineDb.js (storage), syncManager.js (queue)
 */
import { getAll, putAll, put, clearStore, cacheGet, cacheSet } from './offlineDb';
import { queueWrite } from './syncManager';

// Staleness thresholds per entity type (milliseconds)
const STALENESS = {
  'medSchedule':   30 * 1000,      // 30 sec — clinical safety
  'medicines':     30 * 1000,      // 30 sec
  'patients':      2 * 60 * 1000,  // 2 min
  'appointments':  2 * 60 * 1000,  // 2 min
  'homeCareNotes': 2 * 60 * 1000,  // 2 min
  'carePlans':     5 * 60 * 1000,  // 5 min
  'users':         10 * 60 * 1000, // 10 min
  'rooms':         10 * 60 * 1000, // 10 min
  'visitors':      5 * 60 * 1000,  // 5 min
  'incidents':     2 * 60 * 1000,  // 2 min
  'billing':       5 * 60 * 1000,  // 5 min
  'shiftHandovers':2 * 60 * 1000,  // 2 min
  'dietaryPlans':  5 * 60 * 1000,  // 5 min
  'familyUpdates': 5 * 60 * 1000,  // 5 min
  'default':       5 * 60 * 1000,  // 5 min
};

// Entity type → sync priority mapping (mirrors syncManager)
const ENTITY_PRIORITY = {
  'medSchedule':    'med-administration',
  'medicines':      'prescription',
  'patients':       'care-plan',
  'appointments':   'appointment-status',
  'homeCareNotes':  'home-care-note',
  'carePlans':      'care-plan',
  'incidents':      'incident',
  'visitors':       'visitor',
  'shiftHandovers': 'handover',
  'familyUpdates':  'family-update',
  'billing':        'default',
  'users':          'default',
};

// Track when each store was last refreshed from API
const lastFetched = {};

// Listeners for freshness changes
const freshnessListeners = [];

/**
 * Read data — cache-first with staleness check.
 *
 * @param {string} storeName — IndexedDB store name
 * @param {Function} apiFn — async function that fetches from API, returns array or {data: array}
 * @param {Object} [options]
 * @param {string} [options.cacheKey] — use response-level cache instead of store (for filtered queries)
 * @param {boolean} [options.forceRefresh] — skip cache, always hit API
 * @returns {Promise<Array>} data array
 */
export async function read(storeName, apiFn, options = {}) {
  const ttl = STALENESS[storeName] || STALENESS.default;
  const now = Date.now();
  const cacheKey = options.cacheKey || null;

  // 1. Try response-level cache for parameterized queries
  if (cacheKey && !options.forceRefresh) {
    const cached = await cacheGet(cacheKey);
    if (cached) return cached;
  }

  // 2. Try IndexedDB store cache (for full-table reads)
  if (!cacheKey && !options.forceRefresh) {
    const lastTime = lastFetched[storeName] || 0;
    if (now - lastTime < ttl) {
      const local = await getAll(storeName);
      if (local && local.length > 0) return local;
    }
  }

  // 3. Fetch from API
  if (navigator.onLine) {
    try {
      const res = await apiFn();
      const data = normalizeResponse(res);

      // Cache in IndexedDB store
      if (!cacheKey && data.length > 0) {
        await clearStore(storeName).catch(() => {});
        await putAll(storeName, data.map(addVersionFields)).catch(() => {});
        lastFetched[storeName] = now;
        notifyFreshness(storeName, now);
      }

      // Cache parameterized response
      if (cacheKey) {
        await cacheSet(cacheKey, data, ttl);
      }

      return data;
    } catch (err) {
      // API failed — fall through to offline cache
      console.warn(`API fetch failed for ${storeName}, using cache:`, err.message);
    }
  }

  // 4. Offline fallback — return whatever is in IndexedDB
  if (cacheKey) {
    const cached = await cacheGet(cacheKey);
    if (cached) return cached;
  }
  const local = await getAll(storeName);
  return local || [];
}

/**
 * Write data — online: API + cache update; offline: queue + optimistic cache update.
 *
 * @param {string} storeName — IndexedDB store name
 * @param {Object} data — the record to write
 * @param {Function} apiFn — async function that sends to API
 * @param {Object} [options]
 * @param {string} [options.method] — HTTP method (POST, PUT, PATCH, DELETE)
 * @param {string} [options.url] — API URL for offline queue
 * @returns {Promise<Object>} API response or optimistic result
 */
export async function write(storeName, data, apiFn, options = {}) {
  const method = options.method || 'POST';
  const url = options.url || '';

  if (navigator.onLine) {
    try {
      const res = await apiFn();

      // Update local cache with server response
      if (res && storeName) {
        const record = res.data || res.patient || res.user || res.appointment || res.room || res.incident || data;
        if (record && record.id) {
          await put(storeName, addVersionFields(record)).catch(() => {});
        }
        // Invalidate store freshness so next read re-fetches
        delete lastFetched[storeName];

        // Broadcast change to other devices via WebSocket
        try {
          const { broadcastChange } = await import('./liveSync');
          const entityId = record?.id || data?.id || data?.receiptNo || '';
          broadcastChange(storeName, entityId, record || data);
        } catch {}
      }

      return res;
    } catch (err) {
      // Online but API failed — try queueing if it's a network error
      if (!navigator.onLine || err.message === 'Failed to fetch') {
        return queueOfflineWrite(storeName, data, method, url);
      }
      throw err; // Re-throw non-network errors
    }
  }

  // Offline — queue the write
  return queueOfflineWrite(storeName, data, method, url);
}

/**
 * Queue a write for offline sync and update IndexedDB optimistically.
 */
async function queueOfflineWrite(storeName, data, method, url) {
  const entityType = ENTITY_PRIORITY[storeName] || 'default';

  // Optimistic local update
  if (data && data.id && storeName) {
    await put(storeName, addVersionFields(data)).catch(() => {});
  }

  // Queue for sync
  const queueId = await queueWrite({ method, url, body: data, entityType });

  return {
    success: true,
    _offline: true,
    _queueId: queueId,
    message: 'Saved offline. Will sync when connection restores.',
  };
}

/**
 * Pre-cache critical data stores — call after login.
 */
export async function precacheAll(fetchFns) {
  const tasks = Object.entries(fetchFns).map(async ([store, fn]) => {
    try {
      const res = await fn();
      const data = normalizeResponse(res);
      if (data.length > 0) {
        await clearStore(store).catch(() => {});
        await putAll(store, data.map(addVersionFields)).catch(() => {});
        lastFetched[store] = Date.now();
      }
    } catch (err) {
      console.warn(`Pre-cache failed for ${store}:`, err.message);
    }
  });
  await Promise.allSettled(tasks);
}

/**
 * Get freshness info for a store.
 * @returns {{ lastFetched: number|null, isStale: boolean, staleSec: number }}
 */
export function getFreshness(storeName) {
  const ttl = STALENESS[storeName] || STALENESS.default;
  const last = lastFetched[storeName] || null;
  const now = Date.now();
  const age = last ? now - last : Infinity;
  return {
    lastFetched: last,
    isStale: age > ttl,
    staleSec: last ? Math.round(age / 1000) : null,
    ttlSec: Math.round(ttl / 1000),
  };
}

/**
 * Subscribe to freshness updates.
 */
export function onFreshnessChange(callback) {
  freshnessListeners.push(callback);
  return () => {
    const idx = freshnessListeners.indexOf(callback);
    if (idx >= 0) freshnessListeners.splice(idx, 1);
  };
}

/**
 * Invalidate a store's cache — forces next read to hit API.
 */
export function invalidate(storeName) {
  delete lastFetched[storeName];
}

/**
 * Invalidate all caches.
 */
export function invalidateAll() {
  Object.keys(lastFetched).forEach(k => delete lastFetched[k]);
}

// ── Helpers ──

function normalizeResponse(res) {
  if (Array.isArray(res)) return res;
  if (res?.data && Array.isArray(res.data)) return res.data;
  return [];
}

function addVersionFields(record) {
  if (!record || typeof record !== 'object') return record;
  return {
    ...record,
    _version: record._version || 1,
    _modifiedAt: record._modifiedAt || new Date().toISOString(),
    _cachedAt: Date.now(),
  };
}

function notifyFreshness(storeName, timestamp) {
  freshnessListeners.forEach(cb => {
    try { cb(storeName, timestamp); } catch {}
  });
}
