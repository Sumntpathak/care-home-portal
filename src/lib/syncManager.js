/**
 * syncManager — stub.
 *
 * The original offline write queue + conflict resolution (290 LOC) had zero
 * real call sites — no UI ever triggered queueWrite(). Replaced with empty
 * stubs so consumers (SyncStatus page, OfflineIndicator, Layout, MedSchedule)
 * still render "no pending, no conflicts" without crashing.
 *
 * If real offline-first sync becomes necessary later, reintroduce it here —
 * the public API surface is preserved.
 */

const listeners = [];

export async function queueWrite() { return ''; }
export async function processSyncQueue() { return { processed: 0, failed: 0 }; }
export async function retryFailed() { return { retried: 0 }; }
export async function clearCompleted() { return 0; }
export async function getPendingCount() { return 0; }
export async function getConflictCount() { return 0; }
export async function getSyncQueue() { return []; }
export async function getConflicts() { return []; }
export async function getConflictDetail() { return null; }
export async function resolveConflict() { return { resolved: true }; }

/** Subscribe to queue changes — no events will ever fire in the stub. */
export function onSyncChange(cb) {
  listeners.push(cb);
  return () => {
    const i = listeners.indexOf(cb);
    if (i >= 0) listeners.splice(i, 1);
  };
}
