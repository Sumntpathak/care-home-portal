// ═══════════════════════════════════════════════════════════
//  DEMO API — Local mock API that mirrors Google Sheets API
//  All data is stored in-memory via demoData.js
// ═══════════════════════════════════════════════════════════
import { getDemoStore, genId } from "./demoData";

const delay = (ms = 200) => new Promise(r => setTimeout(r, ms + Math.random() * 150));
const today = () => new Date().toISOString().split("T")[0];

// ── Auth ──
export async function login(username, password) {
  await delay(300);
  const s = getDemoStore();
  const u = s.users.find(u =>
    (u.username === username || u.email === username) &&
    (password === "admin123" || password === "doc123" || password === "staff123")
  );
  if (u) {
    // Track login activity
    if (!s.staffActivity) s.staffActivity = [];
    s.staffActivity.unshift({ id: genId("ACT"), name: u.name, role: u.role, action: "Login", time: new Date().toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",hour12:true}), date: today() });
    return { success: true, user: { name: u.name, role: u.role, position: u.position, email: u.email } };
  }
  return { success: false, message: "Invalid credentials. Try demo buttons." };
}

export async function patientLogin(receipt) {
  await delay(300);
  const s = getDemoStore();
  const appts = s.appointments.filter(a => a.receiptNo === receipt);
  if (appts.length === 0) return { success: false, message: "Receipt not found. Try REC-1005-0005" };
  const records = s.prescriptions.filter(r => r.receiptNo === receipt);
  return {
    success: true,
    patient: { name: appts[0].patientName, receiptNo: receipt, phone: appts[0].phone },
    appointments: appts,
    records,
  };
}

export async function registerDoctor(data) {
  await delay(300);
  const s = getDemoStore();
  // Check email uniqueness
  const existing = s.users.find(u => u.email === data.email);
  if (existing) return { success: false, message: "Email already registered. Please log in." };

  const user = {
    id: genId("DR"),
    name: data.name,
    email: data.email,
    username: data.email.split("@")[0],
    phone: data.phone || "",
    role: "Doctor",
    position: data.specialization || "General Physician",
    specialization: data.specialization || "General Physician",
    degree: data.degree || "MBBS",
    license: data.license || "",
    testingMode: true,
    status: "Active",
    password: data.password,
  };
  s.users.push(user);

  // Log activity
  if (!s.staffActivity) s.staffActivity = [];
  s.staffActivity.unshift({ id: genId("ACT"), name: user.name, role: "Doctor", action: "Registered (Testing)", time: new Date().toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",hour12:true}), date: new Date().toISOString().split("T")[0] });

  return { success: true, user: { name: user.name, role: "Doctor", position: user.specialization, email: user.email, specialization: user.specialization, testingMode: true } };
}

// ── Dashboard ──
export async function getDashboard(role, name, position) {
  await delay(200);
  const s = getDemoStore();
  const todayAppts = s.appointments.filter(a => a.date === today());
  const data = {
    totalPatients: s.patients.length,
    todayAppointments: todayAppts.length,
    totalMedicines: s.medicines.length,
    lowStock: s.medicines.filter(m => m.stock <= m.minStock).length,
    revenue: s.billing.filter(b => b.date === today() && b.status === "Paid").reduce((sum, b) => sum + (b.amount || 0), 0),
    pendingBills: s.billing.filter(b => b.status === "Pending").length,
    pendingDispensary: s.prescriptions.filter(p => p.status === "To Dispensary").length,
    dispensedToday: s.prescriptions.filter(p => p.status === "Dispensed" && p.date === today()).length,
    todayList: todayAppts,
    // Nursing home specific
    totalResidents: s.homeCarePatients.length,
    occupiedBeds: s.rooms.flatMap(r => r.beds).filter(b => b.status === "Occupied").length,
    totalBeds: s.rooms.flatMap(r => r.beds).length,
    availableBeds: s.rooms.flatMap(r => r.beds).filter(b => b.status === "Available").length,
    activeIncidents: s.incidents.filter(i => i.status !== "Resolved").length,
    todayVisitors: s.visitors.filter(v => v.date === today()).length,
    pendingHandovers: s.shiftHandovers.filter(h => h.status === "Pending").length,
  };
  if (role === "Doctor") {
    data.myWaiting = todayAppts.filter(a => a.doctor === name && (a.status === "With Doctor" || a.status === "Scheduled")).length;
    data.myRx = s.prescriptions.filter(p => p.doctor === name).length;
  }
  return { data };
}

// ── Users ──
export async function getUsers() {
  await delay();
  return { data: getDemoStore().users };
}
export async function addUser(d) {
  await delay();
  const u = { id: genId("U"), ...d, status: "Active" };
  getDemoStore().users.push(u);
  return { success: true, user: u };
}
// Whitelist fields to prevent prototype pollution / privilege escalation
const USER_EDITABLE_FIELDS = ["name", "username", "email", "phone", "role", "position", "specialization", "shiftStart", "shiftEnd", "status", "password"];

export async function updateUser(d) {
  await delay();
  const s = getDemoStore();
  const u = s.users.find(u => u.id === d.id);
  if (u) {
    for (const key of USER_EDITABLE_FIELDS) {
      if (d[key] !== undefined) u[key] = d[key];
    }
  }
  return { success: true };
}
export async function deleteUser(id) {
  await delay();
  const s = getDemoStore();
  const idx = s.users.findIndex(u => u.id === id);
  if (idx >= 0) s.users.splice(idx, 1);
  return { success: true };
}

// ── Salary ──
export async function getSalaryRecords() { await delay(); return { data: getDemoStore().salaryRecords }; }
export async function addSalaryRecord(d) {
  await delay();
  const r = { id: genId("SAL"), ...d, date: today() };
  getDemoStore().salaryRecords.push(r);
  return { success: true };
}
export async function getStaffSalary(name) {
  await delay();
  return { data: getDemoStore().salaryRecords.filter(r => r.name === name) };
}

// ── Patients ──
export async function getPatients() { await delay(); return { data: getDemoStore().patients }; }
export async function addPatient(d) {
  await delay();
  const p = { id: genId("PAT"), ...d, status: "Active" };
  getDemoStore().patients.push(p);
  return { success: true, patient: p };
}

// ── Appointments ──
export async function getAppointments(filter, date) {
  await delay();
  let appts = getDemoStore().appointments;
  if (date) appts = appts.filter(a => a.date === date);
  if (filter && filter !== "all") appts = appts.filter(a => a.status === filter);
  return { data: appts };
}
export async function createAppointment(d) {
  await delay();
  const receiptNo = `REC-${Date.now().toString().slice(-4)}-${Math.floor(Math.random()*9000+1000)}`;
  const appt = { receiptNo, ...d, status: "Scheduled", date: d.date || today() };
  getDemoStore().appointments.unshift(appt);
  getDemoStore().billing.unshift({ receiptNo, patientName: d.patientName, date: appt.date, doctor: d.doctor, amount: Number(d.bill) || 500, status: "Pending", type: "Consultation" });
  return { success: true, receiptNo, appointment: appt };
}
export async function updateAppointmentStatus(receiptNo, status) {
  await delay();
  const a = getDemoStore().appointments.find(a => a.receiptNo === receiptNo);
  if (a) a.status = status;
  return { success: true };
}

// ── Doctor ──
export async function getDoctorAppointments(doctor) {
  await delay();
  return { data: getDemoStore().appointments.filter(a => a.doctor === doctor) };
}
export async function getDoctorPrescriptions(doctor) {
  await delay();
  return { data: getDemoStore().prescriptions.filter(p => p.doctor === doctor) };
}

// ── Prescriptions ──
export async function getPrescriptions(filter) {
  await delay();
  let rx = getDemoStore().prescriptions;
  if (filter && filter !== "all") rx = rx.filter(r => r.status === filter);
  return { data: rx };
}
export async function savePrescription(d) {
  await delay();
  getDemoStore().prescriptions.unshift({ ...d, date: d.date || today() });
  const a = getDemoStore().appointments.find(a => a.receiptNo === d.receiptNo);
  if (a) a.status = "To Dispensary";
  return { success: true };
}

// ── Dispensary ──
export async function getDispensaryQueue() {
  await delay();
  return { data: getDemoStore().prescriptions.filter(p => p.status === "To Dispensary") };
}
export async function getDispensedRecords() {
  await delay();
  return { data: getDemoStore().prescriptions.filter(p => p.status === "Dispensed") };
}
export async function markDispensed(receiptNo) {
  await delay();
  const rx = getDemoStore().prescriptions.find(p => p.receiptNo === receiptNo);
  if (rx) rx.status = "Dispensed";
  const a = getDemoStore().appointments.find(a => a.receiptNo === receiptNo);
  if (a) a.status = "Dispensed";
  return { success: true };
}

// ── Medicines ──
export async function getMedicines() { await delay(); return { data: getDemoStore().medicines }; }
export async function addMedicine(d) {
  await delay();
  const m = { id: genId("M"), ...d };
  getDemoStore().medicines.push(m);
  return { success: true };
}
export async function updateMedicine(d) {
  await delay();
  const s = getDemoStore();
  const idx = s.medicines.findIndex(m => m.id === d.id || m.name === d.name);
  if (idx >= 0) Object.assign(s.medicines[idx], d);
  return { success: true };
}
export async function getLowStock() {
  await delay();
  return { data: getDemoStore().medicines.filter(m => m.stock <= m.minStock) };
}

// ── Billing ──
export async function getBilling() { await delay(); return { data: getDemoStore().billing }; }
export async function updateBilling(d) {
  await delay();
  const b = getDemoStore().billing.find(b => b.receiptNo === d.receiptNo);
  if (b) Object.assign(b, d);
  return { success: true };
}

// ── Duty Roster ──
export async function getDutyRoster() {
  await delay();
  return { data: getDemoStore().users.map(u => ({ name: u.name, role: u.role, position: u.position, shiftStart: u.shiftStart, shiftEnd: u.shiftEnd, status: u.status })) };
}

// ── Home Care ──
export async function getHomeCarePatients() { await delay(); return { data: getDemoStore().homeCarePatients }; }
export async function addHomeCarePatient(d) {
  await delay();
  const p = { id: genId("HC"), ...d, status: "Active" };
  getDemoStore().homeCarePatients.push(p);
  return { success: true };
}
export async function getHomeCareNotes(patientId) {
  await delay();
  return { data: getDemoStore().homeCareNotes.filter(n => n.patientId === patientId) };
}
export async function addHomeCareNote(d) {
  await delay();
  const n = { id: genId("NOTE"), ...d };
  getDemoStore().homeCareNotes.unshift(n);
  return { success: true };
}
export async function updateHomeCarePatient(d) {
  await delay();
  const s = getDemoStore();
  const p = s.homeCarePatients.find(p => p.id === d.id);
  if (p) Object.assign(p, d);
  return { success: true };
}

// ══════════════════════════════════════════════════
//  NEW FEATURES — Nursing Home specific
// ══════════════════════════════════════════════════

// ── Incidents ──
export async function getIncidents() { await delay(); return { data: getDemoStore().incidents }; }
export async function addIncident(d) {
  await delay();
  const inc = { id: genId("INC"), ...d, date: d.date || today(), status: "Open" };
  getDemoStore().incidents.unshift(inc);
  return { success: true, incident: inc };
}
export async function updateIncident(d) {
  await delay();
  const inc = getDemoStore().incidents.find(i => i.id === d.id);
  if (inc) Object.assign(inc, d);
  return { success: true };
}

// ── Rooms / Beds ──
export async function getRooms() { await delay(); return { data: getDemoStore().rooms }; }
export async function updateRoom(d) {
  await delay();
  const room = getDemoStore().rooms.find(r => r.id === d.id);
  if (room) Object.assign(room, d);
  return { success: true };
}
export async function addRoom(d) {
  await delay();
  const room = { id: genId("R"), ...d };
  getDemoStore().rooms.push(room);
  return { success: true, room };
}
export async function deleteRoom(id) {
  await delay();
  const s = getDemoStore();
  const idx = s.rooms.findIndex(r => r.id === id);
  if (idx >= 0) s.rooms.splice(idx, 1);
  return { success: true };
}

// ── Visitors ──
export async function getVisitors(date) {
  await delay();
  let v = getDemoStore().visitors;
  if (date) v = v.filter(vis => vis.date === date);
  return { data: v };
}
export async function addVisitor(d) {
  await delay();
  const v = { id: genId("VIS"), ...d, date: d.date || today() };
  getDemoStore().visitors.unshift(v);
  return { success: true, visitor: v };
}
export async function checkOutVisitor(id) {
  await delay();
  const v = getDemoStore().visitors.find(v => v.id === id);
  if (v) v.timeOut = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false });
  return { success: true };
}

// ── Shift Handovers ──
export async function getShiftHandovers() { await delay(); return { data: getDemoStore().shiftHandovers }; }
export async function addShiftHandover(d) {
  await delay();
  const h = { id: genId("HO"), ...d, date: d.date || today(), status: "Pending" };
  getDemoStore().shiftHandovers.unshift(h);
  return { success: true };
}
export async function acknowledgeHandover(id) {
  await delay();
  const h = getDemoStore().shiftHandovers.find(h => h.id === id);
  if (h) h.status = "Acknowledged";
  return { success: true };
}

// ── Care Plans ──
export async function getCarePlans() { await delay(); return { data: getDemoStore().carePlans }; }
export async function getCarePlan(patientId) {
  await delay();
  return { data: getDemoStore().carePlans.find(c => c.patientId === patientId) || null };
}
export async function saveCarePlan(d) {
  await delay();
  const s = getDemoStore();
  const idx = s.carePlans.findIndex(c => c.patientId === d.patientId);
  if (idx >= 0) Object.assign(s.carePlans[idx], d);
  else s.carePlans.push({ id: genId("CP"), ...d });
  return { success: true };
}

// ── Dietary Plans ──
export async function getDietaryPlans() { await delay(); return { data: getDemoStore().dietaryPlans }; }
export async function saveDietaryPlan(d) {
  await delay();
  const s = getDemoStore();
  const idx = s.dietaryPlans.findIndex(p => p.patientId === d.patientId);
  if (idx >= 0) Object.assign(s.dietaryPlans[idx], d);
  else s.dietaryPlans.push(d);
  return { success: true };
}

// ── Medication Schedule ──
export async function getMedSchedule() { await delay(); return { data: getDemoStore().medSchedule }; }
export async function markMedGiven(patientId, medIndex, givenBy) {
  await delay();
  const s = getDemoStore();
  const patient = s.medSchedule.find(m => m.patientId === patientId);
  if (patient && patient.schedule[medIndex]) {
    patient.schedule[medIndex].given = true;
    patient.schedule[medIndex].givenBy = givenBy;
    patient.schedule[medIndex].givenAt = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false });
  }
  return { success: true };
}

// ── Family Updates ──
export async function getFamilyUpdates(patientId) {
  await delay();
  let updates = getDemoStore().familyUpdates;
  if (patientId) updates = updates.filter(u => u.patientId === patientId);
  return { data: updates };
}
export async function addFamilyUpdate(d) {
  await delay();
  const u = { id: genId("FU"), ...d, date: d.date || today(), readByFamily: false };
  getDemoStore().familyUpdates.unshift(u);
  return { success: true };
}

// ── Staff Activity ──
export async function getStaffActivity() {
  await delay();
  const s = getDemoStore();
  if (!s.staffActivity) s.staffActivity = [];
  return { data: s.staffActivity };
}
export async function logStaffAction(d) {
  await delay();
  const s = getDemoStore();
  if (!s.staffActivity) s.staffActivity = [];
  s.staffActivity.unshift({ id: genId("ACT"), ...d, time: new Date().toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",hour12:true}), date: d.date || today() });
  return { success: true };
}

// ══════════════════════════════════════════════════
//  MATERNITY CARE
// ══════════════════════════════════════════════════

export async function getMaternityFiles() {
  await delay();
  return { data: getDemoStore().maternityFiles || [] };
}

export async function getMaternityFile(fileId) {
  await delay();
  const f = getDemoStore().maternityFiles?.find(f => f.id === fileId);
  return f ? { data: f } : { data: null };
}

export async function getPatientMaternityFile(patientName) {
  await delay();
  const f = getDemoStore().maternityFiles?.find(f => f.patientName === patientName && f.status !== "Closed");
  return { data: f || null };
}

export async function getDoctorMaternityFiles(doctorName) {
  await delay();
  const files = (getDemoStore().maternityFiles || []).filter(f => f.obstetrician === doctorName && f.status !== "Closed");
  return { data: files };
}

export async function createMaternityFile(data) {
  await delay();
  const s = getDemoStore();
  if (!s.maternityFiles) s.maternityFiles = [];
  const file = { ...data, id: `MAT-${Date.now()}`, status: data.status || "Open", createdAt: new Date().toISOString(), visits: [], careNotes: [] };
  s.maternityFiles.unshift(file);
  return { success: true, data: file };
}

export async function updateMaternityFile(fileId, updates) {
  await delay();
  const s = getDemoStore();
  const f = s.maternityFiles?.find(f => f.id === fileId);
  if (!f) return { success: false, error: "File not found" };
  Object.assign(f, updates);
  return { success: true, data: f };
}

export async function addMaternityVisit(fileId, visit) {
  await delay();
  const s = getDemoStore();
  const f = s.maternityFiles?.find(f => f.id === fileId);
  if (!f) return { success: false, error: "File not found" };
  f.visits = f.visits || [];
  f.visits.push({ ...visit, id: `MV-${Date.now()}` });
  // Auto-transition Open -> Active
  if (f.status === "Open") f.status = "Active";
  return { success: true };
}

export async function addMaternityCareNote(fileId, note) {
  await delay();
  const s = getDemoStore();
  const f = s.maternityFiles?.find(f => f.id === fileId);
  if (!f) return { success: false, error: "File not found" };
  f.careNotes = f.careNotes || [];
  f.careNotes.unshift({ ...note, id: `MCN-${Date.now()}` });
  return { success: true };
}

export async function updateMaternityStatus(fileId, status, details = {}) {
  await delay();
  const s = getDemoStore();
  const f = s.maternityFiles?.find(f => f.id === fileId);
  if (!f) return { success: false, error: "File not found" };
  f.status = status;
  if (status === "Delivered") { f.deliveryDate = details.deliveryDate || new Date().toISOString().split("T")[0]; f.deliveryNotes = details.deliveryNotes || ""; }
  if (status === "Closed") { f.closedAt = new Date().toISOString(); f.closedReason = details.closedReason || "Normal Closure"; }
  return { success: true };
}
