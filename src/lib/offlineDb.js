/**
 * Offline Database — IndexedDB wrapper using idb
 *
 * Caches critical data locally for offline access:
 * - Patients, medications, schedules, care plans
 * - Sync queue for pending writes
 * - Pending photos awaiting R2 upload
 */
import { openDB } from 'idb';
import { encrypt, decrypt, isEncryptionAvailable } from './dbCrypto';

const DB_NAME = 'shanti-care-offline';

// Stores containing PHI that must be encrypted at rest
const ENCRYPTED_STORES = new Set([
  'patients', 'homeCareNotes', 'medSchedule', 'medicines',
  'appointments', 'carePlans', 'prescriptions', 'incidents',
  'billing', 'maternityFiles', 'familyUpdates', 'dietaryPlans',
  'visitors', 'shiftHandovers',
]);
const DB_VERSION = 2;

let dbPromise = null;

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Sync queue — pending offline writes
        if (!db.objectStoreNames.contains('syncQueue')) {
          const sq = db.createObjectStore('syncQueue', { keyPath: 'id' });
          sq.createIndex('priority', 'priority');
          sq.createIndex('createdAt', 'createdAt');
          sq.createIndex('status', 'status');
        }

        // Cached entity stores
        if (!db.objectStoreNames.contains('patients')) {
          db.createObjectStore('patients', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('homeCareNotes')) {
          db.createObjectStore('homeCareNotes', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('medSchedule')) {
          db.createObjectStore('medSchedule', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('medicines')) {
          db.createObjectStore('medicines', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('appointments')) {
          const as = db.createObjectStore('appointments', { keyPath: 'id' });
          as.createIndex('receiptNo', 'receiptNo', { unique: false });
        }
        if (!db.objectStoreNames.contains('carePlans')) {
          db.createObjectStore('carePlans', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('pendingPhotos')) {
          db.createObjectStore('pendingPhotos', { keyPath: 'id' });
        }
        // Simple key-value for misc cached data
        if (!db.objectStoreNames.contains('cache')) {
          db.createObjectStore('cache', { keyPath: 'key' });
        }

        // v2: Additional entity stores for full offline coverage
        if (!db.objectStoreNames.contains('users')) {
          db.createObjectStore('users', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('rooms')) {
          db.createObjectStore('rooms', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('visitors')) {
          db.createObjectStore('visitors', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('incidents')) {
          db.createObjectStore('incidents', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('billing')) {
          const bs = db.createObjectStore('billing', { keyPath: 'receiptNo' });
          bs.createIndex('date', 'date');
        }
        if (!db.objectStoreNames.contains('shiftHandovers')) {
          db.createObjectStore('shiftHandovers', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('dietaryPlans')) {
          db.createObjectStore('dietaryPlans', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('familyUpdates')) {
          db.createObjectStore('familyUpdates', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('maternityFiles')) {
          db.createObjectStore('maternityFiles', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('prescriptions')) {
          const ps = db.createObjectStore('prescriptions', { keyPath: 'receiptNo' });
          ps.createIndex('patientName', 'patientName');
        }
        if (!db.objectStoreNames.contains('salaryRecords')) {
          db.createObjectStore('salaryRecords', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('staffActivity')) {
          db.createObjectStore('staffActivity', { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
}

// ── Generic store operations ──

export async function getAll(storeName) {
  const db = await getDb();
  const items = await db.getAll(storeName);
  if (ENCRYPTED_STORES.has(storeName) && isEncryptionAvailable()) {
    return Promise.all(items.map(item => decrypt(item).catch(() => item)));
  }
  return items;
}

export async function getById(storeName, id) {
  const db = await getDb();
  const item = await db.get(storeName, id);
  if (item && ENCRYPTED_STORES.has(storeName) && isEncryptionAvailable()) {
    return decrypt(item).catch(() => item);
  }
  return item;
}

export async function put(storeName, data) {
  const db = await getDb();
  if (ENCRYPTED_STORES.has(storeName) && isEncryptionAvailable()) {
    const encrypted = await encrypt(data);
    // Store with the original key intact for IndexedDB indexing
    const record = { ...encrypted, id: data.id, receiptNo: data.receiptNo, patientName: data.patientName };
    return db.put(storeName, record);
  }
  return db.put(storeName, data);
}

export async function putAll(storeName, items) {
  const db = await getDb();
  const shouldEncrypt = ENCRYPTED_STORES.has(storeName) && isEncryptionAvailable();
  const tx = db.transaction(storeName, 'readwrite');
  const prepared = shouldEncrypt
    ? await Promise.all(items.map(async item => {
        const encrypted = await encrypt(item);
        return { ...encrypted, id: item.id, receiptNo: item.receiptNo, patientName: item.patientName };
      }))
    : items;
  await Promise.all([
    ...prepared.map(item => tx.store.put(item)),
    tx.done,
  ]);
}

export async function remove(storeName, id) {
  const db = await getDb();
  return db.delete(storeName, id);
}

export async function clearStore(storeName) {
  const db = await getDb();
  return db.clear(storeName);
}

// ── Cache helpers (for API response caching) ──

export async function cacheSet(key, value, ttlMs = 5 * 60 * 1000) {
  const db = await getDb();
  await db.put('cache', {
    key,
    value,
    expiresAt: Date.now() + ttlMs,
  });
}

export async function cacheGet(key) {
  const db = await getDb();
  const entry = await db.get('cache', key);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    await db.delete('cache', key);
    return null;
  }
  return entry.value;
}

// ── Cache cleanup (remove expired entries) ──

export async function cleanExpiredCache() {
  const db = await getDb();
  const tx = db.transaction('cache', 'readwrite');
  const store = tx.objectStore('cache');
  const all = await store.getAll();
  const now = Date.now();
  for (const entry of all) {
    if (entry.expiresAt < now) {
      await store.delete(entry.key);
    }
  }
  await tx.done;
}

// ── Bulk refresh (pull from server and cache locally) ──

export async function refreshStore(storeName, fetchFn) {
  try {
    const data = await fetchFn();
    if (Array.isArray(data) && data.length > 0) {
      await clearStore(storeName);
      await putAll(storeName, data);
    }
    return data;
  } catch (err) {
    // Offline — return cached data
    console.warn(`Offline: returning cached ${storeName}`);
    return getAll(storeName);
  }
}
