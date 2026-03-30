/**
 * Shanti Care LAN Server
 *
 * Runs on the hospital local network for fast sync between devices.
 * SQLite database + WebSocket for real-time updates.
 *
 * Usage: node index.js
 * Environment: PORT (default 8787), CLOUD_API_URL (for replication)
 */
import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import * as db from './db.js';

const PORT = process.env.PORT || 8787;
const CLOUD_API_URL = process.env.CLOUD_API_URL || '';

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));

// ── Health Check ──
app.head('/api/health', (req, res) => res.sendStatus(204));
app.get('/api/health', (req, res) => res.json({ status: 'ok', server: 'lan', timestamp: new Date().toISOString() }));

// ── Generic CRUD Factory ──
function crudRoutes(path, table, keyField = 'id') {
  app.get(`/api/${path}`, (req, res) => {
    try {
      const data = db.getAll(table);
      res.json({ data });
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  app.get(`/api/${path}/:id`, (req, res) => {
    try {
      const item = db.getById(table, req.params.id, keyField);
      if (!item) return res.status(404).json({ error: 'Not found' });
      res.json({ data: item });
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  app.post(`/api/${path}`, (req, res) => {
    try {
      const data = { [keyField]: req.body[keyField] || db.genId(), ...req.body };
      db.insert(table, data);
      broadcast('change', { entityType: table, entityId: data[keyField], operation: 'upsert', data });
      res.json({ success: true, data, [keyField]: data[keyField] });
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  app.put(`/api/${path}/:id`, (req, res) => {
    try {
      const existing = db.getById(table, req.params.id, keyField);
      if (!existing) return res.status(404).json({ error: 'Not found' });

      // Conflict detection via version/timestamp
      if (req.body._version && existing._version && req.body._version < existing._version) {
        return res.status(409).json({
          error: 'Conflict',
          serverVersion: existing,
          clientVersion: req.body,
        });
      }

      db.update(table, req.params.id, { ...req.body, _version: (existing._version || 0) + 1 }, keyField);
      const updated = db.getById(table, req.params.id, keyField);
      broadcast('change', { entityType: table, entityId: req.params.id, operation: 'upsert', data: updated });
      res.json({ success: true, data: updated });
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  app.patch(`/api/${path}/:id`, (req, res) => {
    try {
      db.update(table, req.params.id, req.body, keyField);
      const updated = db.getById(table, req.params.id, keyField);
      broadcast('change', { entityType: table, entityId: req.params.id, operation: 'upsert', data: updated });
      res.json({ success: true, data: updated });
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  app.delete(`/api/${path}/:id`, (req, res) => {
    try {
      db.remove(table, req.params.id, keyField);
      broadcast('change', { entityType: table, entityId: req.params.id, operation: 'delete' });
      res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
  });
}

// ── Register All Entity Routes ──
crudRoutes('users', 'users');
crudRoutes('patients', 'patients');
crudRoutes('appointments', 'appointments', 'receiptNo');
crudRoutes('prescriptions', 'prescriptions', 'receiptNo');
crudRoutes('medicines', 'medicines');
crudRoutes('billing', 'billing', 'receiptNo');
crudRoutes('incidents', 'incidents');
crudRoutes('rooms', 'rooms');
crudRoutes('visitors', 'visitors');
crudRoutes('handovers', 'shift_handovers');
crudRoutes('care-plans', 'care_plans');
crudRoutes('dietary', 'dietary_plans');
crudRoutes('med-schedule', 'med_schedule');
crudRoutes('home-care/patients', 'home_care_patients');
crudRoutes('home-care/notes', 'home_care_notes');
crudRoutes('family-updates', 'family_updates');
crudRoutes('activity', 'staff_activity');

// ── Special Routes ──

// Dashboard aggregation
app.get('/api/dashboard', (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const patients = db.getAll('patients');
    const appointments = db.getAll('appointments').filter(a => a.date === today);
    const medicines = db.getAll('medicines');
    const billing = db.getAll('billing');
    const rooms = db.getAll('rooms');
    const incidents = db.getAll('incidents');
    const visitors = db.getAll('visitors').filter(v => v.date === today);
    const handovers = db.getAll('shift_handovers');
    const prescriptions = db.getAll('prescriptions');
    const homeCare = db.getAll('home_care_patients');

    const allBeds = rooms.flatMap(r => {
      try { return JSON.parse(r.beds || '[]'); } catch { return []; }
    });

    res.json({
      data: {
        totalPatients: patients.length,
        todayAppointments: appointments.length,
        totalMedicines: medicines.length,
        lowStock: medicines.filter(m => m.stock <= m.minStock).length,
        revenue: billing.filter(b => b.date === today && b.status === 'Paid').reduce((s, b) => s + (b.amount || 0), 0),
        pendingBills: billing.filter(b => b.status === 'Pending').length,
        pendingDispensary: prescriptions.filter(p => p.status === 'To Dispensary').length,
        dispensedToday: prescriptions.filter(p => p.status === 'Dispensed' && p.date === today).length,
        todayList: appointments,
        totalResidents: homeCare.length,
        occupiedBeds: allBeds.filter(b => b.status === 'Occupied').length,
        totalBeds: allBeds.length,
        availableBeds: allBeds.filter(b => b.status === 'Available').length,
        activeIncidents: incidents.filter(i => i.status !== 'Resolved').length,
        todayVisitors: visitors.length,
        pendingHandovers: handovers.filter(h => h.status === 'Pending').length,
      }
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Dispensary queue
app.get('/api/dispensary/queue', (req, res) => {
  const data = db.query("SELECT * FROM prescriptions WHERE status = 'To Dispensary'");
  res.json({ data });
});
app.get('/api/dispensary/dispensed', (req, res) => {
  const data = db.query("SELECT * FROM prescriptions WHERE status = 'Dispensed'");
  res.json({ data });
});
app.patch('/api/dispensary/:receiptNo/dispense', (req, res) => {
  db.update('prescriptions', req.params.receiptNo, { status: 'Dispensed' }, 'receiptNo');
  db.update('appointments', req.params.receiptNo, { status: 'Dispensed' }, 'receiptNo');
  broadcast('change', { entityType: 'prescriptions', entityId: req.params.receiptNo, operation: 'upsert' });
  res.json({ success: true });
});

// Low stock medicines
app.get('/api/medicines/low-stock', (req, res) => {
  const data = db.query("SELECT * FROM medicines WHERE stock <= minStock");
  res.json({ data });
});

// Duty roster
app.get('/api/duty-roster', (req, res) => {
  const data = db.query("SELECT name, role, position, shiftStart, shiftEnd, status FROM users");
  res.json({ data });
});

// Appointment status update
app.patch('/api/appointments/:receiptNo/status', (req, res) => {
  db.update('appointments', req.params.receiptNo, { status: req.body.status }, 'receiptNo');
  broadcast('change', { entityType: 'appointments', entityId: req.params.receiptNo, operation: 'upsert' });
  res.json({ success: true });
});

// Med schedule — mark given
app.patch('/api/med-schedule/:patientId/give', (req, res) => {
  const record = db.getById('med_schedule', req.params.patientId, 'patientId');
  if (!record) return res.status(404).json({ error: 'Patient schedule not found' });

  let schedule;
  try { schedule = JSON.parse(record.schedule || '[]'); } catch { schedule = []; }

  const { medIndex, givenBy } = req.body;
  if (schedule[medIndex]) {
    // Double-administration check
    if (schedule[medIndex].given) {
      return res.status(409).json({
        error: 'Medication already administered',
        givenBy: schedule[medIndex].givenBy,
        givenAt: schedule[medIndex].givenAt,
      });
    }
    schedule[medIndex].given = true;
    schedule[medIndex].givenBy = givenBy;
    schedule[medIndex].givenAt = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
  }

  db.update('med_schedule', req.params.patientId, { schedule: JSON.stringify(schedule) }, 'patientId');
  broadcast('change', { entityType: 'med_schedule', entityId: req.params.patientId, operation: 'upsert' });
  res.json({ success: true });
});

// Visitor checkout
app.patch('/api/visitors/:id/checkout', (req, res) => {
  db.update('visitors', req.params.id, {
    timeOut: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })
  });
  res.json({ success: true });
});

// Handover acknowledge
app.patch('/api/handovers/:id/acknowledge', (req, res) => {
  db.update('shift_handovers', req.params.id, { status: 'Acknowledged' });
  res.json({ success: true });
});

// ── Cloud Replication Endpoint ──
app.get('/api/sync/changes', (req, res) => {
  const changes = db.getUnsyncedChanges(100);
  res.json({ data: changes });
});
app.post('/api/sync/mark-synced', (req, res) => {
  const { ids } = req.body;
  if (Array.isArray(ids) && ids.length > 0) {
    db.markSynced(ids);
  }
  res.json({ success: true });
});

// ── HTTP Server + WebSocket ──
const server = createServer(app);

const wss = new WebSocketServer({ server, path: '/ws' });
const clients = new Map(); // deviceId → ws

wss.on('connection', (ws) => {
  let deviceId = null;

  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw.toString());

      if (msg.type === 'join') {
        deviceId = msg.deviceId;
        clients.set(deviceId, ws);
        console.log(`[WS] Device joined: ${deviceId} (${clients.size} total)`);
      }

      if (msg.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong' }));
      }

      // Relay changes to all other clients
      if (msg.type === 'change') {
        for (const [id, client] of clients) {
          if (id !== deviceId && client.readyState === 1) {
            client.send(raw.toString());
          }
        }
      }
    } catch {}
  });

  ws.on('close', () => {
    if (deviceId) {
      clients.delete(deviceId);
      console.log(`[WS] Device left: ${deviceId} (${clients.size} remaining)`);
    }
  });
});

function broadcast(type, data) {
  const msg = JSON.stringify({ type, ...data, timestamp: new Date().toISOString() });
  for (const [, client] of clients) {
    if (client.readyState === 1) client.send(msg);
  }
}

// ── Cloud Replication Job (every 5 minutes) ──
async function replicateToCloud() {
  if (!CLOUD_API_URL) return;
  try {
    const changes = db.getUnsyncedChanges(50);
    if (changes.length === 0) return;

    const res = await fetch(`${CLOUD_API_URL}/api/sync/ingest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ changes }),
    });

    if (res.ok) {
      db.markSynced(changes.map(c => c.id));
      console.log(`[Sync] Replicated ${changes.length} changes to cloud`);
    }
  } catch (err) {
    console.warn('[Sync] Cloud replication failed:', err.message);
  }
}

setInterval(replicateToCloud, 5 * 60 * 1000); // Every 5 minutes

// ── Start Server ──
server.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔══════════════════════════════════════════════════╗
║  Shanti Care LAN Server                         ║
║  Running on http://0.0.0.0:${PORT}                  ║
║  WebSocket: ws://0.0.0.0:${PORT}/ws                 ║
║  Database: server/data/shanti-care.db            ║
╠══════════════════════════════════════════════════╣
║  Configure devices with:                         ║
║  VITE_LAN_URL=http://<this-ip>:${PORT}              ║
╚══════════════════════════════════════════════════╝
  `);
});
