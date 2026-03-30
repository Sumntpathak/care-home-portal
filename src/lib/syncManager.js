/**
 * Sync Queue Manager
 *
 * Manages offline write operations with priority-based sync.
 * When online, processes the queue in priority order.
 * Clinical data conflicts require manual review.
 *
 * Priority levels:
 * 1 CRITICAL — medication records, critical vitals, incidents
 * 2 HIGH     — prescriptions, care notes, appointment status
 * 3 MEDIUM   — family updates, visitor logs
 * 4 LOW      — photos, reports, non-clinical
 */
import { getAll, put, remove } from './offlineDb.js';

// Generate a deterministic key for deduplication
function idempotencyKey(method, url, body) {
  const str = `${method}:${url}:${JSON.stringify(body || {})}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return `idem-${Math.abs(hash).toString(36)}`;
}

const SYNC_PRIORITIES = { CRITICAL: 1, HIGH: 2, MEDIUM: 3, LOW: 4 };

// Map entity types to sync priorities
const PRIORITY_MAP = {
  'med-administration': SYNC_PRIORITIES.CRITICAL,
  'vitals-critical': SYNC_PRIORITIES.CRITICAL,
  'incident': SYNC_PRIORITIES.CRITICAL,
  'prescription': SYNC_PRIORITIES.HIGH,
  'home-care-note': SYNC_PRIORITIES.HIGH,
  'appointment-status': SYNC_PRIORITIES.HIGH,
  'care-plan': SYNC_PRIORITIES.HIGH,
  'family-update': SYNC_PRIORITIES.MEDIUM,
  'visitor': SYNC_PRIORITIES.MEDIUM,
  'handover': SYNC_PRIORITIES.MEDIUM,
  'photo': SYNC_PRIORITIES.LOW,
  'report': SYNC_PRIORITIES.LOW,
  'default': SYNC_PRIORITIES.MEDIUM,
};

let isSyncing = false;
let syncListeners = [];

// ── Public API ──

/**
 * Queue a write operation for offline sync.
 */
export async function queueWrite({ method, url, body, entityType, dependsOn }) {
  const idemKey = idempotencyKey(method, url, body);

  // Deduplication — skip if identical pending operation exists
  const existing = await getAll('syncQueue');
  const duplicate = existing.find(e =>
    e.idempotencyKey === idemKey && (e.status === 'pending' || e.status === 'retrying')
  );
  if (duplicate) return duplicate.id;

  const entry = {
    id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    idempotencyKey: idemKey,
    method,
    url,
    body,
    entityType: entityType || 'default',
    priority: PRIORITY_MAP[entityType] || SYNC_PRIORITIES.MEDIUM,
    dependsOn: dependsOn || null, // ID of another queue entry that must sync first
    status: 'pending',
    retryCount: 0,
    createdAt: new Date().toISOString(),
  };

  await put('syncQueue', entry);
  notifyListeners();

  // Try immediate sync if online
  if (navigator.onLine) {
    processSyncQueue();
  }

  return entry.id;
}

/**
 * Get count of pending sync items.
 */
export async function getPendingCount() {
  const all = await getAll('syncQueue');
  return all.filter(e => e.status === 'pending' || e.status === 'retrying').length;
}

/**
 * Get all sync queue items (for debug/UI).
 */
export async function getSyncQueue() {
  return getAll('syncQueue');
}

/**
 * Listen for sync status changes.
 */
export function onSyncChange(callback) {
  syncListeners.push(callback);
  return () => {
    syncListeners = syncListeners.filter(cb => cb !== callback);
  };
}

/**
 * Process the sync queue — called when connectivity resumes.
 */
export async function processSyncQueue() {
  if (isSyncing || !navigator.onLine) return;
  isSyncing = true;
  notifyListeners();

  try {
    const queue = await getAll('syncQueue');
    const pending = queue
      .filter(e => e.status === 'pending' || e.status === 'retrying')
      .sort((a, b) => a.priority - b.priority || new Date(a.createdAt) - new Date(b.createdAt));

    for (const item of pending) {
      // Skip if this item depends on another that hasn't synced yet
      if (item.dependsOn) {
        const dep = queue.find(e => e.id === item.dependsOn);
        if (dep && dep.status !== 'synced') continue;
      }
      try {
        const opts = {
          method: item.method,
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        };
        if (item.body && item.method !== 'GET') {
          opts.body = JSON.stringify(item.body);
        }

        const res = await fetch(item.url, opts);

        if (res.ok) {
          // Success — remove from queue
          await remove('syncQueue', item.id);
        } else if (res.status === 409) {
          // Conflict — mark for manual resolution
          item.status = 'conflict';
          item.conflictDetail = await res.text();
          await put('syncQueue', item);
        } else if (res.status >= 500) {
          // Server error — retry with backoff
          item.retryCount += 1;
          item.status = item.retryCount >= 5 ? 'failed' : 'retrying';
          await put('syncQueue', item);
        } else {
          // Client error (4xx) — mark as failed
          item.status = 'failed';
          item.errorDetail = await res.text();
          await put('syncQueue', item);
        }
      } catch (err) {
        // Network error during individual item — stop processing
        console.warn('Sync item failed (network):', item.id);
        break;
      }
    }
  } finally {
    isSyncing = false;
    notifyListeners();
  }
}

/**
 * Manually retry failed items.
 */
export async function retryFailed() {
  const queue = await getAll('syncQueue');
  for (const item of queue) {
    if (item.status === 'failed' || item.status === 'retrying') {
      item.status = 'pending';
      item.retryCount = 0;
      await put('syncQueue', item);
    }
  }
  return processSyncQueue();
}

/**
 * Clear resolved/failed items from queue.
 */
export async function clearCompleted() {
  const queue = await getAll('syncQueue');
  for (const item of queue) {
    if (item.status === 'failed' || item.status === 'conflict') {
      await remove('syncQueue', item.id);
    }
  }
  notifyListeners();
}

// ── Connectivity listeners ──

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('Back online — syncing...');
    processSyncQueue();
  });
}

// ── Internal ──

function notifyListeners() {
  getPendingCount().then(count => {
    syncListeners.forEach(cb => cb({ isSyncing, pendingCount: count }));
  });
}

/**
 * Get count of conflicted items (for UI badge).
 */
export async function getConflictCount() {
  const all = await getAll('syncQueue');
  return all.filter(e => e.status === 'conflict').length;
}

/**
 * Get all conflicted items for resolution UI.
 */
export async function getConflicts() {
  const all = await getAll('syncQueue');
  return all.filter(e => e.status === 'conflict');
}

/**
 * Resolve a conflict by choosing local or server version.
 * @param {string} itemId - sync queue entry ID
 * @param {'local' | 'server'} choice - which version to keep
 */
export async function resolveConflict(itemId, choice) {
  const queue = await getAll('syncQueue');
  const item = queue.find(e => e.id === itemId);
  if (!item || item.status !== 'conflict') return false;

  if (choice === 'server') {
    // Discard local change — just remove from queue
    await remove('syncQueue', itemId);
  } else if (choice === 'local') {
    // Re-queue as pending — will overwrite server on next sync
    item.status = 'pending';
    item.retryCount = 0;
    item.conflictDetail = null;
    // Add force flag so server accepts without version check
    if (item.body) item.body._forceOverwrite = true;
    await put('syncQueue', item);
  }

  notifyListeners();
  return true;
}

/**
 * Get a structured conflict with local and server data for diff view.
 */
export async function getConflictDetail(itemId) {
  const queue = await getAll('syncQueue');
  const item = queue.find(e => e.id === itemId);
  if (!item || item.status !== 'conflict') return null;

  let serverVersion = null;
  try {
    serverVersion = JSON.parse(item.conflictDetail);
  } catch {
    serverVersion = { raw: item.conflictDetail };
  }

  return {
    id: item.id,
    entityType: item.entityType,
    localVersion: item.body,
    serverVersion: serverVersion?.serverVersion || serverVersion,
    createdAt: item.createdAt,
    method: item.method,
    url: item.url,
  };
}

export { SYNC_PRIORITIES };
