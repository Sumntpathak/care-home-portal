// ═══════════════════════════════════════════════════════════
//  API Layer — Demo mode (client-side) OR Cloudflare Workers backend
// ═══════════════════════════════════════════════════════════
import * as demo from "./demoApi";
import * as dataLayer from "../lib/dataLayer";

// Demo mode: runs entirely client-side with in-memory data
// Set to false to use real Cloudflare Workers backend
const DEMO_MODE = import.meta.env.VITE_DEMO_MODE !== "false";

// Cloudflare Workers API base URL
import { getApiUrl } from "../lib/serverDiscovery";

// Dynamic API base — uses serverDiscovery to pick LAN vs Cloud
const STATIC_API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8787";
function getBase() {
  // In demo mode, no API calls are made, so this doesn't matter
  // In production, prefer discovered URL, fall back to env var
  try { return getApiUrl() || STATIC_API_BASE; } catch { return STATIC_API_BASE; }
}

// ── HTTP Client for Workers backend ──
async function api(method, path, data = null) {
  const opts = {
    method,
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  };

  // CSRF protection for state-changing requests
  if (method !== "GET") {
    const csrfMeta = document.querySelector('meta[name="csrf-token"]');
    const csrfCookie = document.cookie.match(/csrf_token=([^;]+)/);
    const csrfToken = csrfMeta?.content || csrfCookie?.[1] || "";
    if (csrfToken) {
      opts.headers["X-CSRF-Token"] = csrfToken;
    }
  }

  if (data && method !== "GET") {
    opts.body = JSON.stringify(data);
  }

  let url = `${getBase()}${path}`;
  // For GET with data, append as query params
  if (data && method === "GET") {
    const params = new URLSearchParams();
    Object.entries(data).forEach(([k, v]) => {
      if (v != null && v !== "") params.set(k, v);
    });
    const qs = params.toString();
    if (qs) url += `?${qs}`;
  }

  const res = await fetch(url, opts);

  // Handle 401 — try refresh
  if (res.status === 401 && !path.includes("/auth/")) {
    const refreshed = await refreshToken();
    if (refreshed) {
      // Retry original request
      const retry = await fetch(url, opts);
      if (!retry.ok) throw new Error(await retry.text());
      return retry.json();
    }
    // Refresh failed — trigger logout
    window.dispatchEvent(new CustomEvent("auth:logout"));
    throw new Error("Session expired");
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || "Request failed");
  }

  return res.json();
}

async function refreshToken() {
  try {
    const res = await fetch(`${getBase()}/api/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });
    return res.ok;
  } catch {
    return false;
  }
}

// Shorthand helpers
const GET = (path, params) => api("GET", path, params);
const POST = (path, data) => api("POST", path, data);
const PUT = (path, data) => api("PUT", path, data);
const PATCH = (path, data) => api("PATCH", path, data);
const DELETE = (path) => api("DELETE", path);

// ═══════════════════════════════════════════════════════════
//  Exported API functions — demo or real backend
// ═══════════════════════════════════════════════════════════

// ── Auth ──
export const login = DEMO_MODE
  ? demo.login
  : (username, password) => POST("/api/auth/login", { username, password });

export const patientLogin = DEMO_MODE
  ? demo.patientLogin
  : (receipt) => POST("/api/auth/patient-login", { receiptNo: receipt });

export const authMe = DEMO_MODE
  ? () => Promise.resolve(null)
  : () => GET("/api/auth/me");

export const authLogout = DEMO_MODE
  ? () => Promise.resolve()
  : () => POST("/api/auth/logout");

// ── Dashboard ──
export const getDashboard = DEMO_MODE
  ? demo.getDashboard
  : () => dataLayer.read("cache", () => GET("/api/dashboard"), { cacheKey: "dashboard" });

// ── Users / Staff ──
export const getUsers = DEMO_MODE ? demo.getUsers : () => dataLayer.read("users", () => GET("/api/users"));
export const addUser = DEMO_MODE
  ? demo.addUser
  : (d) => dataLayer.write("users", d, () => POST("/api/users", d), { method: "POST", url: "/api/users" });
export const updateUser = DEMO_MODE
  ? demo.updateUser
  : (d) => dataLayer.write("users", d, () => PUT(`/api/users/${d.id}`, d), { method: "PUT", url: `/api/users/${d.id}` });
export const deleteUser = DEMO_MODE
  ? demo.deleteUser
  : (id) => dataLayer.write("users", { id }, () => DELETE(`/api/users/${id}`), { method: "DELETE", url: `/api/users/${id}` });

// ── Salary ──
export const getSalaryRecords = DEMO_MODE ? demo.getSalaryRecords : () => dataLayer.read("salaryRecords", () => GET("/api/salary"));
export const addSalaryRecord = DEMO_MODE
  ? demo.addSalaryRecord
  : (d) => dataLayer.write("salaryRecords", d, () => POST("/api/salary", d), { method: "POST", url: "/api/salary" });
export const getStaffSalary = DEMO_MODE
  ? demo.getStaffSalary
  : (name) => dataLayer.read("salaryRecords", () => GET(`/api/salary/${encodeURIComponent(name)}`), { cacheKey: `salary-${name}` });

// ── Patients ──
export const getPatients = DEMO_MODE ? demo.getPatients : () => dataLayer.read("patients", () => GET("/api/patients"));
export const addPatient = DEMO_MODE
  ? demo.addPatient
  : (d) => dataLayer.write("patients", d, () => POST("/api/patients", d), { method: "POST", url: "/api/patients" });

// ── Appointments ──
export const getAppointments = DEMO_MODE
  ? demo.getAppointments
  : (filter, date) => dataLayer.read("appointments", () => GET("/api/appointments", { status: filter, date }), { cacheKey: `appts-${filter}-${date}` });

export const createAppointment = DEMO_MODE
  ? demo.createAppointment
  : (d) => dataLayer.write("appointments", d, () => POST("/api/appointments", d), { method: "POST", url: "/api/appointments" });

export const updateAppointmentStatus = DEMO_MODE
  ? demo.updateAppointmentStatus
  : (receiptNo, status) => dataLayer.write("appointments", { receiptNo, status }, () => PATCH(`/api/appointments/${encodeURIComponent(receiptNo)}/status`, { status }), { method: "PATCH", url: `/api/appointments/${receiptNo}/status` });

// ── Doctor ──
export const getDoctorAppointments = DEMO_MODE
  ? demo.getDoctorAppointments
  : (doctor) => dataLayer.read("appointments", () => GET(`/api/appointments/doctor/${encodeURIComponent(doctor)}`), { cacheKey: `doc-appts-${doctor}` });

export const getDoctorPrescriptions = DEMO_MODE
  ? demo.getDoctorPrescriptions
  : (doctor) => dataLayer.read("prescriptions", () => GET(`/api/prescriptions/doctor/${encodeURIComponent(doctor)}`), { cacheKey: `doc-rx-${doctor}` });

// ── Prescriptions ──
export const getPrescriptions = DEMO_MODE
  ? demo.getPrescriptions
  : (filter) => dataLayer.read("prescriptions", () => GET("/api/prescriptions", { status: filter }), { cacheKey: `rx-${filter}` });

export const savePrescription = DEMO_MODE
  ? demo.savePrescription
  : (d) => dataLayer.write("prescriptions", d, () => POST("/api/prescriptions", d), { method: "POST", url: "/api/prescriptions" });

// ── Dispensary ──
export const getDispensaryQueue = DEMO_MODE
  ? demo.getDispensaryQueue
  : () => dataLayer.read("prescriptions", () => GET("/api/dispensary/queue"), { cacheKey: "dispensary-queue" });
export const getDispensedRecords = DEMO_MODE
  ? demo.getDispensedRecords
  : () => dataLayer.read("prescriptions", () => GET("/api/dispensary/dispensed"), { cacheKey: "dispensed-records" });
export const markDispensed = DEMO_MODE
  ? demo.markDispensed
  : (receiptNo) => dataLayer.write("prescriptions", { receiptNo }, () => PATCH(`/api/dispensary/${encodeURIComponent(receiptNo)}/dispense`), { method: "PATCH", url: `/api/dispensary/${receiptNo}/dispense` });

// ── Medicines ──
export const getMedicines = DEMO_MODE ? demo.getMedicines : () => dataLayer.read("medicines", () => GET("/api/medicines"));
export const addMedicine = DEMO_MODE
  ? demo.addMedicine
  : (d) => dataLayer.write("medicines", d, () => POST("/api/medicines", d), { method: "POST", url: "/api/medicines" });
export const updateMedicine = DEMO_MODE
  ? demo.updateMedicine
  : (d) => dataLayer.write("medicines", d, () => PUT(`/api/medicines/${d.id}`, d), { method: "PUT", url: `/api/medicines/${d.id}` });
export const getLowStock = DEMO_MODE
  ? demo.getLowStock
  : () => dataLayer.read("medicines", () => GET("/api/medicines/low-stock"), { cacheKey: "low-stock" });

// ── Billing ──
export const getBilling = DEMO_MODE ? demo.getBilling : () => dataLayer.read("billing", () => GET("/api/billing"));
export const updateBilling = DEMO_MODE
  ? demo.updateBilling
  : (d) => dataLayer.write("billing", d, () => PUT(`/api/billing/${d.receiptNo}`, d), { method: "PUT", url: `/api/billing/${d.receiptNo}` });

// ── Duty Roster ──
export const getDutyRoster = DEMO_MODE
  ? demo.getDutyRoster
  : () => dataLayer.read("users", () => GET("/api/duty-roster"), { cacheKey: "duty-roster" });

// ── Home Care ──
export const getHomeCarePatients = DEMO_MODE ? demo.getHomeCarePatients : () => dataLayer.read("homeCareNotes", () => GET("/api/home-care/patients"));
export const addHomeCarePatient = DEMO_MODE
  ? demo.addHomeCarePatient
  : (d) => dataLayer.write("homeCareNotes", d, () => POST("/api/home-care/patients", d), { method: "POST", url: "/api/home-care/patients" });
export const getHomeCareNotes = DEMO_MODE
  ? demo.getHomeCareNotes
  : (patientId) => dataLayer.read("homeCareNotes", () => GET(`/api/home-care/notes/${patientId}`), { cacheKey: `hc-notes-${patientId}` });
export const addHomeCareNote = DEMO_MODE
  ? demo.addHomeCareNote
  : (d) => dataLayer.write("homeCareNotes", d, () => POST("/api/home-care/notes", d), { method: "POST", url: "/api/home-care/notes" });
export const updateHomeCarePatient = DEMO_MODE
  ? demo.updateHomeCarePatient
  : (d) => dataLayer.write("homeCareNotes", d, () => PUT(`/api/home-care/patients/${d.id}`, d), { method: "PUT", url: `/api/home-care/patients/${d.id}` });

// ── Incidents ──
export const getIncidents = DEMO_MODE ? demo.getIncidents : () => dataLayer.read("incidents", () => GET("/api/incidents"));
export const addIncident = DEMO_MODE
  ? demo.addIncident
  : (d) => dataLayer.write("incidents", d, () => POST("/api/incidents", d), { method: "POST", url: "/api/incidents" });
export const updateIncident = DEMO_MODE
  ? demo.updateIncident
  : (d) => dataLayer.write("incidents", d, () => PUT(`/api/incidents/${d.id}`, d), { method: "PUT", url: `/api/incidents/${d.id}` });

// ── Rooms / Beds ──
export const getRooms = DEMO_MODE ? demo.getRooms : () => dataLayer.read("rooms", () => GET("/api/rooms"));
export const updateRoom = DEMO_MODE
  ? demo.updateRoom
  : (d) => dataLayer.write("rooms", d, () => PUT(`/api/rooms/${d.id}`, d), { method: "PUT", url: `/api/rooms/${d.id}` });
export const addRoom = DEMO_MODE
  ? demo.addRoom
  : (d) => dataLayer.write("rooms", d, () => POST("/api/rooms", d), { method: "POST", url: "/api/rooms" });
export const deleteRoom = DEMO_MODE
  ? demo.deleteRoom
  : (id) => dataLayer.write("rooms", { id }, () => DELETE(`/api/rooms/${id}`), { method: "DELETE", url: `/api/rooms/${id}` });

// ── Visitors ──
export const getVisitors = DEMO_MODE
  ? demo.getVisitors
  : (date) => dataLayer.read("visitors", () => GET("/api/visitors", { date }), { cacheKey: `visitors-${date}` });
export const addVisitor = DEMO_MODE
  ? demo.addVisitor
  : (d) => dataLayer.write("visitors", d, () => POST("/api/visitors", d), { method: "POST", url: "/api/visitors" });
export const checkOutVisitor = DEMO_MODE
  ? demo.checkOutVisitor
  : (id) => dataLayer.write("visitors", { id }, () => PATCH(`/api/visitors/${id}/checkout`), { method: "PATCH", url: `/api/visitors/${id}/checkout` });

// ── Shift Handovers ──
export const getShiftHandovers = DEMO_MODE ? demo.getShiftHandovers : () => dataLayer.read("shiftHandovers", () => GET("/api/handovers"));
export const addShiftHandover = DEMO_MODE
  ? demo.addShiftHandover
  : (d) => dataLayer.write("shiftHandovers", d, () => POST("/api/handovers", d), { method: "POST", url: "/api/handovers" });
export const acknowledgeHandover = DEMO_MODE
  ? demo.acknowledgeHandover
  : (id) => dataLayer.write("shiftHandovers", { id }, () => PATCH(`/api/handovers/${id}/acknowledge`), { method: "PATCH", url: `/api/handovers/${id}/acknowledge` });

// ── Care Plans ──
export const getCarePlans = DEMO_MODE ? demo.getCarePlans : () => dataLayer.read("carePlans", () => GET("/api/care-plans"));
export const getCarePlan = DEMO_MODE
  ? demo.getCarePlan
  : (patientId) => dataLayer.read("carePlans", () => GET(`/api/care-plans/${patientId}`), { cacheKey: `care-plan-${patientId}` });
export const saveCarePlan = DEMO_MODE
  ? demo.saveCarePlan
  : (d) => dataLayer.write("carePlans", d, () => PUT(`/api/care-plans/${d.patientId}`, d), { method: "PUT", url: `/api/care-plans/${d.patientId}` });

// ── Dietary Plans ──
export const getDietaryPlans = DEMO_MODE ? demo.getDietaryPlans : () => dataLayer.read("dietaryPlans", () => GET("/api/dietary"));
export const saveDietaryPlan = DEMO_MODE
  ? demo.saveDietaryPlan
  : (d) => dataLayer.write("dietaryPlans", d, () => PUT(`/api/dietary/${d.patientId}`, d), { method: "PUT", url: `/api/dietary/${d.patientId}` });

// ── Medication Schedule ──
export const getMedSchedule = DEMO_MODE ? demo.getMedSchedule : () => dataLayer.read("medSchedule", () => GET("/api/med-schedule"));
export const markMedGiven = DEMO_MODE
  ? demo.markMedGiven
  : (patientId, medIndex, givenBy) => dataLayer.write("medSchedule", { patientId, medIndex, givenBy }, () => PATCH(`/api/med-schedule/${patientId}/give`, { medIndex, givenBy }), { method: "PATCH", url: `/api/med-schedule/${patientId}/give` });

// ── Family Updates ──
export const getFamilyUpdates = DEMO_MODE
  ? demo.getFamilyUpdates
  : (patientId) => dataLayer.read("familyUpdates", () => GET("/api/family-updates", { patientId }), { cacheKey: `family-updates-${patientId}` });
export const addFamilyUpdate = DEMO_MODE
  ? demo.addFamilyUpdate
  : (d) => dataLayer.write("familyUpdates", d, () => POST("/api/family-updates", d), { method: "POST", url: "/api/family-updates" });

// ── Staff Activity ──
export const getStaffActivity = DEMO_MODE ? demo.getStaffActivity : () => dataLayer.read("staffActivity", () => GET("/api/activity"));
export const logStaffAction = DEMO_MODE
  ? demo.logStaffAction
  : (d) => dataLayer.write("staffActivity", d, () => POST("/api/activity", d), { method: "POST", url: "/api/activity" });

// ── Maternity Care ──
export const getMaternityFiles = DEMO_MODE ? demo.getMaternityFiles : () => dataLayer.read("maternityFiles", () => GET("/api/maternity"));
export const getMaternityFile = DEMO_MODE
  ? demo.getMaternityFile
  : (id) => dataLayer.read("maternityFiles", () => GET(`/api/maternity/${id}`), { cacheKey: `maternity-${id}` });
export const getPatientMaternityFile = DEMO_MODE
  ? demo.getPatientMaternityFile
  : (name) => dataLayer.read("maternityFiles", () => GET(`/api/maternity/patient/${encodeURIComponent(name)}`), { cacheKey: `maternity-patient-${name}` });
export const getDoctorMaternityFiles = DEMO_MODE
  ? demo.getDoctorMaternityFiles
  : (name) => dataLayer.read("maternityFiles", () => GET(`/api/maternity/doctor/${encodeURIComponent(name)}`), { cacheKey: `maternity-doctor-${name}` });
export const createMaternityFile = DEMO_MODE
  ? demo.createMaternityFile
  : (d) => dataLayer.write("maternityFiles", d, () => POST("/api/maternity", d), { method: "POST", url: "/api/maternity" });
export const updateMaternityFile = DEMO_MODE
  ? demo.updateMaternityFile
  : (id, d) => dataLayer.write("maternityFiles", d, () => PUT(`/api/maternity/${id}`, d), { method: "PUT", url: `/api/maternity/${id}` });
export const addMaternityVisit = DEMO_MODE
  ? demo.addMaternityVisit
  : (id, d) => dataLayer.write("maternityFiles", d, () => POST(`/api/maternity/${id}/visits`, d), { method: "POST", url: `/api/maternity/${id}/visits` });
export const addMaternityCareNote = DEMO_MODE
  ? demo.addMaternityCareNote
  : (id, d) => dataLayer.write("maternityFiles", d, () => POST(`/api/maternity/${id}/notes`, d), { method: "POST", url: `/api/maternity/${id}/notes` });
export const updateMaternityStatus = DEMO_MODE
  ? demo.updateMaternityStatus
  : (id, s, d) => dataLayer.write("maternityFiles", { status: s, ...d }, () => PATCH(`/api/maternity/${id}/status`, { status: s, ...d }), { method: "PATCH", url: `/api/maternity/${id}/status` });

// ── Data Layer utilities (re-export for AuthContext / pre-caching) ──
export { precacheAll } from "../lib/dataLayer";
