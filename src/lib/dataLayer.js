/**
 * Data Layer — simplified read-through cache.
 *
 * Reads: IndexedDB cache → API on miss/stale → update cache.
 * Writes: direct API call → update cache. No offline queue.
 *
 * The previous 3-tier cache with offline write queue was unused in production
 * (only ~5 of 82 api/sheets.js functions ever called read(); write() path
 * was never exercised offline). Stripped to match what the app actually does.
 */
import { getAll, putAll, put, clearStore } from './offlineDb';

const DEFAULT_TTL = 5 * 60 * 1000; // 5 min — good enough for everything

const lastFetched = {};
const freshnessListeners = [];

export async function read(storeName, apiFn, options = {}) {
  const now = Date.now();
  const ttl = DEFAULT_TTL;

  if (!options.forceRefresh) {
    const lastTime = lastFetched[storeName] || 0;
    if (now - lastTime < ttl) {
      const local = await getAll(storeName).catch(() => []);
      if (local && local.length > 0) return local;
    }
  }

  if (navigator.onLine) {
    try {
      const res = await apiFn();
      const data = normalizeResponse(res);
      if (data.length > 0) {
        await clearStore(storeName).catch(() => {});
        await putAll(storeName, data.map(stamp)).catch(() => {});
        lastFetched[storeName] = now;
        notify(storeName, now);
      }
      return data;
    } catch {
      // fall through to cache
    }
  }

  const local = await getAll(storeName).catch(() => []);
  return local || [];
}

export async function write(storeName, data, apiFn) {
  const res = await apiFn();
  const record = res?.data || res?.patient || res?.user || res?.appointment || res?.room || res?.incident || data;
  if (record?.id && storeName) {
    await put(storeName, stamp(record)).catch(() => {});
  }
  delete lastFetched[storeName];
  return res;
}

export async function precacheAll(fetchFns) {
  const tasks = Object.entries(fetchFns).map(async ([store, fn]) => {
    try {
      const res = await fn();
      const data = normalizeResponse(res);
      if (data.length > 0) {
        await clearStore(store).catch(() => {});
        await putAll(store, data.map(stamp)).catch(() => {});
        lastFetched[store] = Date.now();
      }
    } catch {}
  });
  await Promise.allSettled(tasks);
}

export function getFreshness(storeName) {
  const last = lastFetched[storeName] || null;
  const age = last ? Date.now() - last : Infinity;
  return {
    lastFetched: last,
    isStale: age > DEFAULT_TTL,
    staleSec: last ? Math.round(age / 1000) : null,
    ttlSec: Math.round(DEFAULT_TTL / 1000),
  };
}

export function onFreshnessChange(cb) {
  freshnessListeners.push(cb);
  return () => {
    const i = freshnessListeners.indexOf(cb);
    if (i >= 0) freshnessListeners.splice(i, 1);
  };
}

export function invalidate(storeName) {
  delete lastFetched[storeName];
}

export function invalidateAll() {
  Object.keys(lastFetched).forEach(k => delete lastFetched[k]);
}

function normalizeResponse(res) {
  if (Array.isArray(res)) return res;
  if (res?.data && Array.isArray(res.data)) return res.data;
  return [];
}

function stamp(record) {
  if (!record || typeof record !== 'object') return record;
  return { ...record, _cachedAt: Date.now() };
}

function notify(storeName, timestamp) {
  freshnessListeners.forEach(cb => { try { cb(storeName, timestamp); } catch {} });
}
