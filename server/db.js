/**
 * SQLite Database Layer for LAN Server
 *
 * Stores all care home data locally on the hospital network.
 * Uses better-sqlite3 for synchronous, fast access.
 */
import Database from 'better-sqlite3';
import { randomUUID } from 'crypto';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, 'data');
mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(join(DATA_DIR, 'shanti-care.db'), {
  verbose: process.env.DEBUG ? console.log : null,
});

// Enable WAL mode for better concurrent read/write performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ── Schema Initialization ──

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    username TEXT UNIQUE,
    email TEXT,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'Staff',
    position TEXT,
    specialization TEXT,
    shiftStart TEXT,
    shiftEnd TEXT,
    status TEXT DEFAULT 'Active',
    password TEXT,
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS patients (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    age INTEGER,
    gender TEXT,
    room TEXT,
    condition TEXT,
    guardian TEXT,
    status TEXT DEFAULT 'Active',
    patientType TEXT DEFAULT 'General',
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS appointments (
    receiptNo TEXT PRIMARY KEY,
    patientName TEXT,
    phone TEXT,
    doctor TEXT,
    date TEXT,
    type TEXT,
    billAmount REAL DEFAULT 0,
    status TEXT DEFAULT 'Scheduled',
    notes TEXT,
    createdBy TEXT,
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS prescriptions (
    receiptNo TEXT PRIMARY KEY,
    patientName TEXT,
    doctorName TEXT,
    diagnosis TEXT,
    medications TEXT,
    dosage TEXT,
    timing TEXT,
    amount TEXT,
    notes TEXT,
    dietPlan TEXT,
    consultFee TEXT,
    status TEXT DEFAULT 'To Dispensary',
    date TEXT,
    createdAt TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS medicines (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT,
    stock INTEGER DEFAULT 0,
    minStock INTEGER DEFAULT 10,
    unit TEXT,
    price REAL DEFAULT 0,
    supplier TEXT,
    expiry TEXT,
    updatedAt TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS billing (
    receiptNo TEXT PRIMARY KEY,
    patientName TEXT,
    date TEXT,
    doctor TEXT,
    amount REAL DEFAULT 0,
    status TEXT DEFAULT 'Pending',
    type TEXT,
    paidAt TEXT,
    updatedAt TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS incidents (
    id TEXT PRIMARY KEY,
    patientName TEXT,
    type TEXT,
    severity TEXT,
    description TEXT,
    reportedBy TEXT,
    status TEXT DEFAULT 'Open',
    resolution TEXT,
    date TEXT,
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS rooms (
    id TEXT PRIMARY KEY,
    roomNumber TEXT,
    type TEXT,
    rate REAL DEFAULT 0,
    beds TEXT,
    floor TEXT,
    updatedAt TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS visitors (
    id TEXT PRIMARY KEY,
    visitorName TEXT,
    patientName TEXT,
    relation TEXT,
    phone TEXT,
    purpose TEXT,
    timeIn TEXT,
    timeOut TEXT,
    date TEXT,
    createdAt TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS shift_handovers (
    id TEXT PRIMARY KEY,
    fromStaff TEXT,
    toStaff TEXT,
    shift TEXT,
    notes TEXT,
    criticalItems TEXT,
    status TEXT DEFAULT 'Pending',
    date TEXT,
    createdAt TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS care_plans (
    id TEXT PRIMARY KEY,
    patientId TEXT,
    patientName TEXT,
    goals TEXT,
    medications TEXT,
    activities TEXT,
    notes TEXT,
    updatedBy TEXT,
    updatedAt TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS dietary_plans (
    id TEXT PRIMARY KEY,
    patientId TEXT,
    patientName TEXT,
    diet TEXT,
    allergies TEXT,
    restrictions TEXT,
    mealPlan TEXT,
    updatedAt TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS med_schedule (
    id TEXT PRIMARY KEY,
    patientId TEXT,
    patientName TEXT,
    room TEXT,
    schedule TEXT,
    updatedAt TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS home_care_patients (
    id TEXT PRIMARY KEY,
    name TEXT,
    age INTEGER,
    room TEXT,
    condition TEXT,
    admitDate TEXT,
    status TEXT DEFAULT 'Active',
    updatedAt TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS home_care_notes (
    id TEXT PRIMARY KEY,
    patientId TEXT,
    note TEXT,
    type TEXT,
    recordedBy TEXT,
    date TEXT,
    createdAt TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS family_updates (
    id TEXT PRIMARY KEY,
    patientId TEXT,
    patientName TEXT,
    message TEXT,
    postedBy TEXT,
    readByFamily INTEGER DEFAULT 0,
    date TEXT,
    createdAt TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS staff_activity (
    id TEXT PRIMARY KEY,
    name TEXT,
    role TEXT,
    action TEXT,
    time TEXT,
    date TEXT
  );

  CREATE TABLE IF NOT EXISTS change_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entityType TEXT NOT NULL,
    entityId TEXT NOT NULL,
    operation TEXT NOT NULL,
    data TEXT,
    timestamp TEXT DEFAULT (datetime('now')),
    syncedToCloud INTEGER DEFAULT 0
  );

  CREATE INDEX IF NOT EXISTS idx_change_log_synced ON change_log(syncedToCloud);
  CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date);
  CREATE INDEX IF NOT EXISTS idx_billing_date ON billing(date);
`);

// ── Generic CRUD Helpers ──

export function getAll(table) {
  return db.prepare(`SELECT * FROM ${table}`).all();
}

export function getById(table, id, keyField = 'id') {
  return db.prepare(`SELECT * FROM ${table} WHERE ${keyField} = ?`).get(id);
}

export function insert(table, data) {
  const keys = Object.keys(data);
  const placeholders = keys.map(() => '?').join(', ');
  const stmt = db.prepare(`INSERT OR REPLACE INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`);
  stmt.run(...keys.map(k => typeof data[k] === 'object' ? JSON.stringify(data[k]) : data[k]));
  logChange(table, data.id || data.receiptNo, 'UPSERT', data);
  return data;
}

export function update(table, id, data, keyField = 'id') {
  const sets = Object.keys(data).filter(k => k !== keyField).map(k => `${k} = ?`).join(', ');
  const values = Object.keys(data).filter(k => k !== keyField).map(k => typeof data[k] === 'object' ? JSON.stringify(data[k]) : data[k]);
  db.prepare(`UPDATE ${table} SET ${sets}, updatedAt = datetime('now') WHERE ${keyField} = ?`).run(...values, id);
  logChange(table, id, 'UPDATE', data);
}

export function remove(table, id, keyField = 'id') {
  db.prepare(`DELETE FROM ${table} WHERE ${keyField} = ?`).run(id);
  logChange(table, id, 'DELETE', null);
}

export function query(sql, params = []) {
  return db.prepare(sql).all(...params);
}

export function run(sql, params = []) {
  return db.prepare(sql).run(...params);
}

// ── Change Log for Cloud Sync ──

function logChange(entityType, entityId, operation, data) {
  db.prepare(`INSERT INTO change_log (entityType, entityId, operation, data) VALUES (?, ?, ?, ?)`)
    .run(entityType, entityId || '', operation, data ? JSON.stringify(data) : null);
}

export function getUnsyncedChanges(limit = 100) {
  return db.prepare(`SELECT * FROM change_log WHERE syncedToCloud = 0 ORDER BY id ASC LIMIT ?`).all(limit);
}

export function markSynced(ids) {
  const placeholders = ids.map(() => '?').join(',');
  db.prepare(`UPDATE change_log SET syncedToCloud = 1 WHERE id IN (${placeholders})`).run(...ids);
}

export function genId(prefix = '') {
  return prefix ? `${prefix}-${randomUUID().slice(0, 8)}` : randomUUID();
}

export default db;
