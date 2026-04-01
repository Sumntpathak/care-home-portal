// ═══════════════════════════════════════════════════════════
//  DEMO DATA — Realistic nursing home data for local demo
//  Everything works offline, no backend needed
// ═══════════════════════════════════════════════════════════

import { lmpForWeeks, calcEDD, getTrimester } from "../utils/maternity";

const today = new Date().toISOString().split("T")[0];
const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString().split("T")[0];
const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString().split("T")[0];
const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];
const twoWeeksAgo = new Date(Date.now() - 14 * 86400000).toISOString().split("T")[0];
const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];

// ── USERS ──
export const USERS = [
  { id: "U001", name: "Sumant Pathak", email: "pathaksumnt4u@gmail.com", username: "pathaksumnt4u@gmail.com", role: "Admin", position: "Administrator", shiftStart: "09:00", shiftEnd: "18:00", status: "Active", phone: "9876543210" },
  { id: "U002", name: "Dr. Meena Sharma", email: "dr.meena@shanticare.in", username: "dr.meena", role: "Doctor", position: "General Physician", specialization: "Geriatric Medicine", shiftStart: "09:00", shiftEnd: "17:00", status: "Active", phone: "9876543211" },
  { id: "U003", name: "Dr. Rajesh Kumar", email: "dr.rajesh@shanticare.in", username: "dr.rajesh", role: "Doctor", position: "Physician", specialization: "Internal Medicine", shiftStart: "10:00", shiftEnd: "18:00", status: "Active", phone: "9876543212" },
  { id: "U004", name: "Neeta Verma", email: "neeta@shanticare.in", username: "neeta", role: "Staff", position: "Appointment Desk", shiftStart: "08:00", shiftEnd: "16:00", status: "Active", phone: "9876543213" },
  { id: "U005", name: "Amit Patel", email: "amit@shanticare.in", username: "amit", role: "Staff", position: "Dispensary", shiftStart: "09:00", shiftEnd: "17:00", status: "Active", phone: "9876543214" },
  { id: "U006", name: "Sunita Devi", email: "sunita@shanticare.in", username: "sunita", role: "Staff", position: "Home Care", shiftStart: "07:00", shiftEnd: "15:00", status: "Active", phone: "9876543215" },
  { id: "U007", name: "Priya Nair", email: "priya@shanticare.in", username: "priya", role: "Staff", position: "Home Care", shiftStart: "15:00", shiftEnd: "23:00", status: "Active", phone: "9876543216" },
  { id: "U008", name: "Ravi Shankar", email: "ravi@shanticare.in", username: "ravi", role: "Staff", position: "Home Care", shiftStart: "23:00", shiftEnd: "07:00", status: "Active", phone: "9876543217" },
  { id: "U009", name: "Kavita Singh", email: "kavita@shanticare.in", username: "kavita", role: "Staff", position: "Lab", shiftStart: "09:00", shiftEnd: "17:00", status: "Active", phone: "9876543218" },
  { id: "U010", name: "Deepak Gupta", email: "deepak@shanticare.in", username: "deepak", role: "Staff", position: "General", shiftStart: "08:00", shiftEnd: "20:00", status: "Active", phone: "9876543219" },
];

// ── PATIENTS (Residents) ──
export const PATIENTS = [
  { id: "PAT-100001", name: "Kamla Devi", age: 82, gender: "Female", phone: "9811111111", room: "101-A", condition: "Diabetes, Hypertension", guardian: "Rajesh (Son) - 9822222222", status: "Active", admitDate: "2025-06-15", bloodGroup: "B+", allergies: "Penicillin", emergencyContact: "9822222222" },
  { id: "PAT-100002", name: "Ramesh Chand", age: 78, gender: "Male", phone: "9811111112", room: "102-A", condition: "Post-stroke recovery", guardian: "Anita (Daughter) - 9822222223", status: "Active", admitDate: "2025-08-20", bloodGroup: "O+", allergies: "None", emergencyContact: "9822222223" },
  { id: "PAT-100003", name: "Savitri Bai", age: 85, gender: "Female", phone: "9811111113", room: "103-A", condition: "Dementia - Mild", guardian: "Vikram (Son) - 9822222224", status: "Active", admitDate: "2025-09-10", bloodGroup: "A+", allergies: "Sulfa drugs", emergencyContact: "9822222224" },
  { id: "PAT-100004", name: "Mohan Lal", age: 76, gender: "Male", phone: "9811111114", room: "104-A", condition: "COPD, Arthritis", guardian: "Suman (Wife) - 9822222225", status: "Active", admitDate: "2025-10-01", bloodGroup: "AB+", allergies: "None", emergencyContact: "9822222225" },
  { id: "PAT-100005", name: "Parvati Sharma", age: 88, gender: "Female", phone: "9811111115", room: "105-A", condition: "Parkinson's Disease", guardian: "Deepak (Son) - 9822222226", status: "Active", admitDate: "2025-11-05", bloodGroup: "B-", allergies: "Aspirin", emergencyContact: "9822222226" },
  { id: "PAT-100006", name: "Balwant Singh", age: 81, gender: "Male", phone: "9811111116", room: "201-A", condition: "Heart Failure - Stable", guardian: "Jaspal (Son) - 9822222227", status: "Active", admitDate: "2025-12-12", bloodGroup: "O-", allergies: "None", emergencyContact: "9822222227" },
  { id: "PAT-100007", name: "Laxmi Narayan", age: 79, gender: "Female", phone: "9811111117", room: "201-B", condition: "Diabetes, Vision Impaired", guardian: "Suresh (Son) - 9822222228", status: "Active", admitDate: "2026-01-08", bloodGroup: "A-", allergies: "Ibuprofen", emergencyContact: "9822222228" },
  { id: "PAT-100008", name: "Har Prasad", age: 90, gender: "Male", phone: "9811111118", room: "202-A", condition: "Bedridden - Fracture Recovery", guardian: "Meena (Daughter) - 9822222229", status: "Active", admitDate: "2026-02-01", bloodGroup: "B+", allergies: "None", emergencyContact: "9822222229" },
  { id: "PAT-100009", name: "Shanti Devi", age: 74, gender: "Female", phone: "9811111119", room: "202-B", condition: "Stable - Mild Anxiety", guardian: "Rahul (Son) - 9822222230", status: "Active", admitDate: "2026-02-15", bloodGroup: "O+", allergies: "Codeine", emergencyContact: "9822222230" },
  { id: "PAT-100010", name: "Krishna Kumar", age: 83, gender: "Male", phone: "9811111120", room: "203-A", condition: "Alzheimer's - Moderate", guardian: "Priya (Daughter) - 9822222231", status: "Active", admitDate: "2026-03-01", bloodGroup: "A+", allergies: "None", emergencyContact: "9822222231" },
  { id: "PAT-100011", name: "Geeta Rani", age: 77, gender: "Female", phone: "9811111121", room: "203-B", condition: "Osteoporosis, Hypertension", guardian: "Anil (Son) - 9822222232", status: "Active", admitDate: "2025-07-20", bloodGroup: "AB-", allergies: "Latex", emergencyContact: "9822222232" },
  { id: "PAT-100012", name: "Jagdish Prasad", age: 86, gender: "Male", phone: "9811111122", room: "204-A", condition: "Critical - Kidney Disease", guardian: "Rekha (Daughter) - 9822222233", status: "Active", admitDate: "2026-01-25", bloodGroup: "B+", allergies: "Morphine", emergencyContact: "9822222233" },
  // ── Maternity Patients ──
  { name: "Anjali Verma", age: 28, gender: "Female", phone: "9855000001", room: "MAT-101", condition: "Pregnancy - 34 weeks", guardian: "Rohit Verma (Husband)", status: "Active", bloodGroup: "B+", admitDate: new Date(Date.now() - 34*7*24*60*60*1000).toISOString().split("T")[0], patientType: "Maternity" },
  { name: "Priya Reddy", age: 34, gender: "Female", phone: "9855000002", room: "MAT-102", condition: "High-Risk Twin Pregnancy", guardian: "Venkat Reddy (Husband)", status: "Active", bloodGroup: "A+", admitDate: new Date(Date.now() - 20*7*24*60*60*1000).toISOString().split("T")[0], patientType: "Maternity" },
  { name: "Kavita Joshi", age: 36, gender: "Female", phone: "9855000003", room: "", condition: "IVF Treatment - Cycle 2", guardian: "Amit Joshi (Husband)", status: "Active", bloodGroup: "O+", patientType: "IVF" },
  { name: "Meera Gupta", age: 26, gender: "Female", phone: "9855000004", room: "MAT-103", condition: "Post-Delivery Care", guardian: "Rahul Gupta (Husband)", status: "Active", bloodGroup: "AB+", admitDate: new Date(Date.now() - 41*7*24*60*60*1000).toISOString().split("T")[0], patientType: "Maternity" },
];

// ── ROOMS / BEDS ──
export const ROOMS = [
  { id: "101", name: "Room 101", floor: "Ground", type: "Single", beds: [{ id: "101-A", status: "Occupied", patient: "PAT-100001" }], amenities: "AC, Attached Bath, TV", rate: 2500 },
  { id: "102", name: "Room 102", floor: "Ground", type: "Single", beds: [{ id: "102-A", status: "Occupied", patient: "PAT-100002" }], amenities: "AC, Attached Bath, TV", rate: 2500 },
  { id: "103", name: "Room 103", floor: "Ground", type: "Single", beds: [{ id: "103-A", status: "Occupied", patient: "PAT-100003" }], amenities: "AC, Attached Bath", rate: 2200 },
  { id: "104", name: "Room 104", floor: "Ground", type: "Single", beds: [{ id: "104-A", status: "Occupied", patient: "PAT-100004" }], amenities: "AC, Attached Bath", rate: 2200 },
  { id: "105", name: "Room 105", floor: "Ground", type: "Single", beds: [{ id: "105-A", status: "Occupied", patient: "PAT-100005" }], amenities: "AC, Attached Bath, Oxygen", rate: 2800 },
  { id: "201", name: "Room 201", floor: "First", type: "Double", beds: [{ id: "201-A", status: "Occupied", patient: "PAT-100006" }, { id: "201-B", status: "Occupied", patient: "PAT-100007" }], amenities: "AC, Shared Bath, TV", rate: 1800 },
  { id: "202", name: "Room 202", floor: "First", type: "Double", beds: [{ id: "202-A", status: "Occupied", patient: "PAT-100008" }, { id: "202-B", status: "Occupied", patient: "PAT-100009" }], amenities: "AC, Shared Bath", rate: 1800 },
  { id: "203", name: "Room 203", floor: "First", type: "Double", beds: [{ id: "203-A", status: "Occupied", patient: "PAT-100010" }, { id: "203-B", status: "Occupied", patient: "PAT-100011" }], amenities: "AC, Shared Bath, TV", rate: 1800 },
  { id: "204", name: "Room 204", floor: "First", type: "Double", beds: [{ id: "204-A", status: "Occupied", patient: "PAT-100012" }, { id: "204-B", status: "Available", patient: null }], amenities: "AC, Shared Bath, Oxygen", rate: 2000 },
  { id: "205", name: "Room 205", floor: "First", type: "Double", beds: [{ id: "205-A", status: "Available", patient: null }, { id: "205-B", status: "Available", patient: null }], amenities: "AC, Shared Bath", rate: 1800 },
  { id: "301", name: "Room 301", floor: "Second", type: "Single", beds: [{ id: "301-A", status: "Available", patient: null }], amenities: "AC, Attached Bath, TV, Balcony", rate: 3000 },
  { id: "302", name: "Room 302", floor: "Second", type: "Single", beds: [{ id: "302-A", status: "Maintenance", patient: null }], amenities: "AC, Attached Bath, TV", rate: 2500 },
];

// ── APPOINTMENTS ──
export const APPOINTMENTS = [
  { receiptNo: "REC-1005-0001", date: today, patientName: "Kamla Devi", phone: "9811111111", doctor: "Dr. Meena Sharma", type: "Follow-up", bill: 500, status: "With Doctor", createdBy: "Neeta Verma" },
  { receiptNo: "REC-1005-0002", date: today, patientName: "Mohan Lal", phone: "9811111114", doctor: "Dr. Meena Sharma", type: "Check-up", bill: 500, status: "Scheduled", createdBy: "Neeta Verma" },
  { receiptNo: "REC-1005-0003", date: today, patientName: "Balwant Singh", phone: "9811111116", doctor: "Dr. Rajesh Kumar", type: "Cardiology Review", bill: 800, status: "Scheduled", createdBy: "Neeta Verma" },
  { receiptNo: "REC-1005-0004", date: yesterday, patientName: "Parvati Sharma", phone: "9811111115", doctor: "Dr. Meena Sharma", type: "Follow-up", bill: 500, status: "Completed", createdBy: "Neeta Verma" },
  { receiptNo: "REC-1005-0005", date: yesterday, patientName: "Shanti Devi", phone: "9811111119", doctor: "Dr. Rajesh Kumar", type: "New Consultation", bill: 600, status: "Dispensed", createdBy: "Neeta Verma" },
  { receiptNo: "REC-1005-0006", date: twoDaysAgo, patientName: "Laxmi Narayan", phone: "9811111117", doctor: "Dr. Meena Sharma", type: "Eye Check", bill: 700, status: "Completed", createdBy: "Neeta Verma" },
  { receiptNo: "REC-1005-0007", date: threeDaysAgo, patientName: "Geeta Rani", phone: "9811111121", doctor: "Dr. Rajesh Kumar", type: "Follow-up", bill: 500, status: "Completed", createdBy: "Neeta Verma" },
  // Maternity appointment
  { receiptNo: "REC-2005-0001", patientName: "Anjali Verma", phone: "9855000001", doctor: "Dr. Meena Sharma", type: "Prenatal Checkup", status: "Completed", date: today, bill: "500", notes: "Routine prenatal visit", createdBy: "Neeta Verma" },
];

// ── PRESCRIPTIONS ──
export const PRESCRIPTIONS = [
  {
    receiptNo: "REC-1005-0004", date: yesterday, doctor: "Dr. Meena Sharma", patientName: "Parvati Sharma",
    diagnosis: "Parkinson's tremor management, routine follow-up",
    medications: JSON.stringify([
      { name: "Syndopa Plus", dose: "110mg", timing: "After Food", frequency: "Twice daily", duration: "30 days", qty: "60", notes: "Do not crush" },
      { name: "Trihexyphenidyl", dose: "2mg", timing: "Before Food", frequency: "Three times", duration: "30 days", qty: "90", notes: "" },
    ]),
    status: "Dispensed", notes: "Patient stable. Continue current regimen. Next review in 4 weeks."
  },
  {
    receiptNo: "REC-1005-0005", date: yesterday, doctor: "Dr. Rajesh Kumar", patientName: "Shanti Devi",
    diagnosis: "Mild anxiety, sleep disturbance",
    medications: JSON.stringify([
      { name: "Alprazolam", dose: "0.25mg", timing: "After Food", frequency: "At bedtime", duration: "14 days", qty: "14", notes: "Low dose, review in 2 weeks" },
      { name: "Melatonin", dose: "3mg", timing: "Before Sleep", frequency: "Once daily", duration: "30 days", qty: "30", notes: "" },
    ]),
    status: "Dispensed", notes: "Counselling recommended. Monitor for drowsiness."
  },
  {
    receiptNo: "REC-1005-0006", date: twoDaysAgo, doctor: "Dr. Meena Sharma", patientName: "Laxmi Narayan",
    diagnosis: "Diabetic retinopathy screening, blood sugar control",
    medications: JSON.stringify([
      { name: "Metformin", dose: "500mg", timing: "After Food", frequency: "Twice daily", duration: "30 days", qty: "60", notes: "" },
      { name: "Brimonidine Eye Drops", dose: "0.2%", timing: "As Directed", frequency: "Twice daily", duration: "30 days", qty: "1 bottle", notes: "Both eyes" },
    ]),
    status: "Completed", notes: "Ophthalmology referral given. HbA1c due next month."
  },
];

// ── MEDICINES ──
export const MEDICINES = [
  { id: "M001", name: "Metformin 500mg", category: "Antidiabetic", stock: 450, unit: "Tablets", minStock: 100, price: 2.5, supplier: "Sun Pharma", expiry: "2027-06-30" },
  { id: "M002", name: "Amlodipine 5mg", category: "Antihypertensive", stock: 320, unit: "Tablets", minStock: 80, price: 3.0, supplier: "Cipla", expiry: "2027-08-15" },
  { id: "M003", name: "Atorvastatin 10mg", category: "Cholesterol", stock: 200, unit: "Tablets", minStock: 50, price: 5.0, supplier: "Cipla", expiry: "2027-04-20" },
  { id: "M004", name: "Syndopa Plus 110mg", category: "Neurological", stock: 150, unit: "Tablets", minStock: 40, price: 8.0, supplier: "Sun Pharma", expiry: "2027-05-10" },
  { id: "M005", name: "Paracetamol 500mg", category: "Analgesic", stock: 800, unit: "Tablets", minStock: 200, price: 1.0, supplier: "Mankind", expiry: "2027-12-31" },
  { id: "M006", name: "Omeprazole 20mg", category: "Antacid", stock: 250, unit: "Capsules", minStock: 60, price: 4.0, supplier: "Dr. Reddy's", expiry: "2027-07-15" },
  { id: "M007", name: "Calcium + Vit D3", category: "Supplement", stock: 180, unit: "Tablets", minStock: 50, price: 6.0, supplier: "Abbott", expiry: "2027-09-30" },
  { id: "M008", name: "Alprazolam 0.25mg", category: "Anxiolytic", stock: 45, unit: "Tablets", minStock: 30, price: 3.5, supplier: "Torrent", expiry: "2027-03-20" },
  { id: "M009", name: "Insulin Glargine", category: "Antidiabetic", stock: 12, unit: "Pens", minStock: 10, price: 450.0, supplier: "Sanofi", expiry: "2026-11-30" },
  { id: "M010", name: "Nebulizer Solution", category: "Respiratory", stock: 25, unit: "Vials", minStock: 20, price: 35.0, supplier: "Cipla", expiry: "2027-01-15" },
  { id: "M011", name: "Adult Diapers (L)", category: "Consumable", stock: 150, unit: "Pieces", minStock: 50, price: 25.0, supplier: "Nobel Hygiene", expiry: "2028-12-31" },
  { id: "M012", name: "Surgical Gloves", category: "Consumable", stock: 300, unit: "Pairs", minStock: 100, price: 8.0, supplier: "Top Glove", expiry: "2028-06-30" },
  { id: "M013", name: "Trihexyphenidyl 2mg", category: "Neurological", stock: 8, unit: "Tablets", minStock: 30, price: 4.5, supplier: "Sun Pharma", expiry: "2027-04-30" },
  { id: "M014", name: "Brimonidine Eye Drops", category: "Ophthalmic", stock: 6, unit: "Bottles", minStock: 5, price: 120.0, supplier: "Allergan", expiry: "2026-08-15" },
];

// ── BILLING ──
export const BILLING = [
  { receiptNo: "REC-1005-0001", patientName: "Kamla Devi", date: today, doctor: "Dr. Meena Sharma", amount: 500, status: "Pending", type: "Consultation" },
  { receiptNo: "REC-1005-0002", patientName: "Mohan Lal", date: today, doctor: "Dr. Meena Sharma", amount: 500, status: "Pending", type: "Consultation" },
  { receiptNo: "REC-1005-0003", patientName: "Balwant Singh", date: today, doctor: "Dr. Rajesh Kumar", amount: 800, status: "Pending", type: "Consultation" },
  { receiptNo: "REC-1005-0004", patientName: "Parvati Sharma", date: yesterday, doctor: "Dr. Meena Sharma", amount: 500, status: "Paid", type: "Consultation" },
  { receiptNo: "REC-1005-0005", patientName: "Shanti Devi", date: yesterday, doctor: "Dr. Rajesh Kumar", amount: 600, status: "Paid", type: "Consultation" },
  { receiptNo: "REC-1005-0006", patientName: "Laxmi Narayan", date: twoDaysAgo, doctor: "Dr. Meena Sharma", amount: 700, status: "Paid", type: "Consultation" },
  { receiptNo: "ROOM-MAR-001", patientName: "Kamla Devi", date: "2026-03-01", doctor: "—", amount: 75000, status: "Paid", type: "Room Charges (March)" },
  { receiptNo: "ROOM-MAR-002", patientName: "Ramesh Chand", date: "2026-03-01", doctor: "—", amount: 75000, status: "Pending", type: "Room Charges (March)" },
];

// ── SALARY RECORDS ──
export const SALARY_RECORDS = [
  { id: "SAL-001", name: "Neeta Verma", month: "March", year: "2026", basic: 18000, allowances: 5000, deductions: 2400, net: 20600, status: "Pending", date: "2026-03-01" },
  { id: "SAL-002", name: "Amit Patel", month: "March", year: "2026", basic: 16000, allowances: 4000, deductions: 2000, net: 18000, status: "Pending", date: "2026-03-01" },
  { id: "SAL-003", name: "Sunita Devi", month: "February", year: "2026", basic: 20000, allowances: 6000, deductions: 2800, net: 23200, status: "Paid", date: "2026-02-28" },
  { id: "SAL-004", name: "Dr. Meena Sharma", month: "February", year: "2026", basic: 60000, allowances: 15000, deductions: 8000, net: 67000, status: "Paid", date: "2026-02-28" },
];

// ── HOME CARE PATIENTS (admitted residents) ──
export const HOME_CARE_PATIENTS = PATIENTS.map(p => ({
  id: p.id, name: p.name, age: p.age, gender: p.gender, phone: p.phone,
  room: p.room, condition: p.condition, guardian: p.guardian,
  admitDate: p.admitDate, status: "Active", notes: "",
}));

// ── HOME CARE NOTES ──
export const HOME_CARE_NOTES = [
  { id: "NOTE-001", patientId: "PAT-100001", date: today, shift: "Morning", temp: "98.4", bp: "140/85", pulse: "78", spo2: "96", glucose: "165", weight: "58", medications: "Metformin 500mg, Amlodipine 5mg given", observations: "Blood sugar slightly elevated. Patient alert and oriented.", nursing: "Monitor sugar before lunch", diet: "Diabetic diet - breakfast taken fully", moodBehaviour: "Cheerful, chatted with roommate", caregiver: "Sunita Devi" },
  { id: "NOTE-002", patientId: "PAT-100001", date: yesterday, shift: "Morning", temp: "98.2", bp: "135/82", pulse: "76", spo2: "97", glucose: "142", weight: "58", medications: "Metformin 500mg, Amlodipine 5mg given", observations: "Stable. Walked in corridor with walker.", nursing: "Encourage light exercise", diet: "Ate well. Good fluid intake.", moodBehaviour: "Good mood, watched TV", caregiver: "Sunita Devi" },
  { id: "NOTE-003", patientId: "PAT-100002", date: today, shift: "Morning", temp: "98.6", bp: "130/80", pulse: "82", spo2: "95", glucose: "—", weight: "72", medications: "Ecosprin 75mg, Clopidogrel given", observations: "Left-side weakness persistent. Physio exercises done.", nursing: "Continue physiotherapy. Watch for swallowing difficulty.", diet: "Soft diet — ate 75%", moodBehaviour: "Quiet, seems tired", caregiver: "Sunita Devi" },
  { id: "NOTE-004", patientId: "PAT-100005", date: today, shift: "Morning", temp: "97.8", bp: "125/78", pulse: "72", spo2: "97", glucose: "—", weight: "52", medications: "Syndopa Plus 110mg, Trihexyphenidyl 2mg", observations: "Tremor manageable today. Walked with walker to dining area.", nursing: "Monitor gait stability. Fall prevention measures in place.", diet: "Pureed food — ate 60%", moodBehaviour: "Calm, participated in morning prayer", caregiver: "Sunita Devi" },
  { id: "NOTE-005", patientId: "PAT-100008", date: today, shift: "Morning", temp: "98.8", bp: "120/75", pulse: "80", spo2: "96", glucose: "—", weight: "65", medications: "Calcium + Vit D3, Paracetamol SOS", observations: "Bedridden. Hip fracture healing. Bed sore Grade 1 on sacrum.", nursing: "Position change every 2 hours. Wound dressing done.", diet: "Liquid diet — fair intake", moodBehaviour: "Low mood, misses home", caregiver: "Priya Nair" },
  { id: "NOTE-006", patientId: "PAT-100012", date: today, shift: "Morning", temp: "99.1", bp: "150/90", pulse: "88", spo2: "94", glucose: "—", weight: "70", medications: "Dialysis day — pre-dialysis meds given", observations: "Mild oedema in feet. Urine output reduced. Creatinine review pending.", nursing: "Strict fluid monitoring. Weigh before and after dialysis.", diet: "Renal diet — low potassium, restricted fluids", moodBehaviour: "Anxious about dialysis", caregiver: "Sunita Devi" },
];

// ── INCIDENTS ──
export const INCIDENTS = [
  { id: "INC-001", date: yesterday, time: "14:30", type: "Fall", severity: "Moderate", patient: "PAT-100005", patientName: "Parvati Sharma", location: "Corridor near Room 105", description: "Patient lost balance while walking to dining area. Fell on left side. No visible head injury.", injuryDetails: "Bruise on left forearm, minor abrasion on left knee", actionTaken: "Helped patient up, vitals checked, ice pack applied, Dr. Meena informed", reportedBy: "Sunita Devi", witnessedBy: "Deepak Gupta", doctorNotified: "Dr. Meena Sharma", familyNotified: true, followUp: "X-ray ordered — no fracture. Extra supervision during mobility.", status: "Resolved" },
  { id: "INC-002", date: twoDaysAgo, time: "22:15", type: "Medical Emergency", severity: "High", patient: "PAT-100012", patientName: "Jagdish Prasad", location: "Room 204-A", description: "Patient complained of severe breathlessness. SpO2 dropped to 88%. Oxygen administered immediately.", injuryDetails: "No physical injury — respiratory distress episode", actionTaken: "O2 at 4L/min via nasal cannula, Dr. Rajesh called, vitals monitored every 15 min", reportedBy: "Ravi Shankar", witnessedBy: "—", doctorNotified: "Dr. Rajesh Kumar", familyNotified: true, followUp: "Stabilized by 23:00. SpO2 back to 94%. Review kidney function.", status: "Monitoring" },
  { id: "INC-003", date: weekAgo, time: "08:45", type: "Medication Error", severity: "Low", patient: "PAT-100003", patientName: "Savitri Bai", location: "Room 103-A", description: "Morning medication given 30 minutes late due to shift handover delay.", injuryDetails: "No adverse effect", actionTaken: "Medication administered. Handover process reviewed with night staff.", reportedBy: "Sunita Devi", witnessedBy: "—", doctorNotified: "—", familyNotified: false, followUp: "Shift handover checklist updated. No patient harm.", status: "Resolved" },
  { id: "INC-004", date: weekAgo, time: "16:00", type: "Behavioral", severity: "Low", patient: "PAT-100010", patientName: "Krishna Kumar", location: "Common Area", description: "Patient became agitated and confused. Tried to leave the building. Sundowning episode.", injuryDetails: "None", actionTaken: "Gently redirected to room. Calming music played. PRN medication offered but declined.", reportedBy: "Priya Nair", witnessedBy: "Deepak Gupta", doctorNotified: "Dr. Meena Sharma", familyNotified: true, followUp: "Increase evening supervision. Consider earlier dinner time.", status: "Resolved" },
];

// ── VISITORS ──
export const VISITORS = [
  { id: "VIS-001", date: today, timeIn: "10:00", timeOut: "12:30", visitorName: "Rajesh Kumar", relationship: "Son", patient: "PAT-100001", patientName: "Kamla Devi", phone: "9822222222", purpose: "Regular Visit", healthScreening: "Passed", temperature: "98.2", badge: "V-001", notes: "" },
  { id: "VIS-002", date: today, timeIn: "11:00", timeOut: null, visitorName: "Anita Chand", relationship: "Daughter", patient: "PAT-100002", patientName: "Ramesh Chand", phone: "9822222223", purpose: "Regular Visit", healthScreening: "Passed", temperature: "98.0", badge: "V-002", notes: "Brought home-cooked food (approved by dietician)" },
  { id: "VIS-003", date: yesterday, timeIn: "14:00", timeOut: "16:00", visitorName: "Deepak Sharma", relationship: "Son", patient: "PAT-100005", patientName: "Parvati Sharma", phone: "9822222226", purpose: "After Fall Visit", healthScreening: "Passed", temperature: "98.4", badge: "V-003", notes: "Discussed fall incident with nurse. Satisfied with care." },
  { id: "VIS-004", date: yesterday, timeIn: "10:30", timeOut: "11:30", visitorName: "Rekha Prasad", relationship: "Daughter", patient: "PAT-100012", patientName: "Jagdish Prasad", phone: "9822222233", purpose: "Medical Update", healthScreening: "Passed", temperature: "98.6", badge: "V-004", notes: "Met with Dr. Rajesh regarding dialysis schedule" },
  { id: "VIS-005", date: twoDaysAgo, timeIn: "15:00", timeOut: "17:00", visitorName: "Vikram Bai", relationship: "Son", patient: "PAT-100003", patientName: "Savitri Bai", phone: "9822222224", purpose: "Regular Visit", healthScreening: "Passed", temperature: "97.8", badge: "V-005", notes: "" },
];

// ── SHIFT HANDOVERS ──
export const SHIFT_HANDOVERS = [
  {
    id: "HO-001", date: today, fromShift: "Night", toShift: "Morning", handedBy: "Ravi Shankar", receivedBy: "Sunita Devi", time: "07:00",
    summary: "Quiet night overall. Jagdish Prasad (204-A) had mild restlessness around 3 AM — repositioned and settled. All other residents slept well.",
    criticalAlerts: [
      { patient: "Jagdish Prasad", room: "204-A", alert: "SpO2 monitor — keep above 93%. Dialysis scheduled today at 10 AM." },
      { patient: "Har Prasad", room: "202-A", alert: "Position change due at 8 AM. Check sacral bed sore dressing." },
    ],
    pendingTasks: ["8 AM medications for all residents", "Breakfast service at 8:30", "Dr. Meena rounds expected at 9:30"],
    incidents: "None during night shift",
    status: "Acknowledged"
  },
  {
    id: "HO-002", date: yesterday, fromShift: "Morning", toShift: "Afternoon", handedBy: "Sunita Devi", receivedBy: "Priya Nair", time: "15:00",
    summary: "Parvati Sharma (105-A) had a fall at 14:30 — see incident report INC-001. X-ray done, no fracture. Extra supervision needed. All morning medications administered. Vitals documented.",
    criticalAlerts: [
      { patient: "Parvati Sharma", room: "105-A", alert: "Post-fall monitoring — check every 30 min for 4 hours. Left arm bruised." },
      { patient: "Krishna Kumar", room: "203-A", alert: "Sundowning risk — redirect gently if agitated. Keep room well-lit." },
    ],
    pendingTasks: ["3 PM medications", "Physio for Ramesh Chand at 4 PM", "Evening vitals at 6 PM"],
    incidents: "Fall — Parvati Sharma (INC-001). Dr. Meena examined, no fracture.",
    status: "Acknowledged"
  },
];

// ── CARE PLANS ──
export const CARE_PLANS = [
  {
    id: "CP-001", patientId: "PAT-100001", patientName: "Kamla Devi", createdDate: "2025-06-20", reviewDate: "2026-04-15", createdBy: "Dr. Meena Sharma", status: "Active",
    diagnosis: "Type 2 Diabetes Mellitus, Essential Hypertension",
    goals: [
      { goal: "Maintain fasting blood glucose below 140 mg/dL", target: "3 months", status: "In Progress" },
      { goal: "Maintain BP below 140/90 mmHg", target: "Ongoing", status: "Achieved" },
      { goal: "Prevent diabetic complications (foot, eye, kidney)", target: "Ongoing", status: "In Progress" },
    ],
    medications: [
      { name: "Metformin 500mg", timing: "After breakfast & dinner", notes: "Monitor renal function quarterly" },
      { name: "Amlodipine 5mg", timing: "Morning after breakfast", notes: "Check for ankle oedema" },
      { name: "Atorvastatin 10mg", timing: "Night after dinner", notes: "" },
    ],
    activities: ["Daily morning walk (15 min with walker)", "Chair yoga twice weekly", "Blood sugar check before meals"],
    dietary: "Diabetic diet — low GI, no added sugar, limited rice. 1500 cal/day.",
    specialInstructions: "Foot examination weekly. Eye check every 6 months. HbA1c every 3 months.",
    notes: "Patient compliant. Family supportive. Rajesh (son) visits weekly."
  },
  {
    id: "CP-002", patientId: "PAT-100002", patientName: "Ramesh Chand", createdDate: "2025-08-25", reviewDate: "2026-04-20", createdBy: "Dr. Rajesh Kumar", status: "Active",
    diagnosis: "Left hemiparesis — post ischemic stroke (Aug 2025)",
    goals: [
      { goal: "Improve left arm mobility — regain partial function", target: "6 months", status: "In Progress" },
      { goal: "Independent transfer from bed to wheelchair", target: "3 months", status: "Achieved" },
      { goal: "Prevent secondary stroke", target: "Ongoing", status: "In Progress" },
    ],
    medications: [
      { name: "Ecosprin 75mg", timing: "After lunch", notes: "Antiplatelet — do not stop without consult" },
      { name: "Clopidogrel 75mg", timing: "After lunch", notes: "Dual antiplatelet therapy" },
      { name: "Atorvastatin 20mg", timing: "Night", notes: "" },
    ],
    activities: ["Physiotherapy daily (AM & PM sessions)", "Speech therapy 3x/week", "Assisted walking with frame 10 min/day"],
    dietary: "Soft diet — small frequent meals. Thickened liquids (swallowing assessment passed for soft solids).",
    specialInstructions: "Swallowing precautions during meals. Keep head elevated 30°. Fall risk — bed rails up at night.",
    notes: "Remarkable progress in 6 months. Daughter Anita very involved in care."
  },
  {
    id: "CP-003", patientId: "PAT-100005", patientName: "Parvati Sharma", createdDate: "2025-11-10", reviewDate: "2026-04-10", createdBy: "Dr. Meena Sharma", status: "Active",
    diagnosis: "Parkinson's Disease (Stage 2-3)",
    goals: [
      { goal: "Manage tremor and maintain mobility", target: "Ongoing", status: "In Progress" },
      { goal: "Prevent falls", target: "Ongoing", status: "Needs Attention" },
      { goal: "Maintain adequate nutrition despite swallowing difficulty", target: "Ongoing", status: "In Progress" },
    ],
    medications: [
      { name: "Syndopa Plus 110mg", timing: "Morning & evening — 30 min before food", notes: "Timing critical — do not delay" },
      { name: "Trihexyphenidyl 2mg", timing: "Three times daily before food", notes: "Watch for dry mouth, confusion" },
    ],
    activities: ["Guided walking with walker 2x daily", "Hand exercises for dexterity", "Music therapy weekly"],
    dietary: "Pureed/soft food. Small frequent meals. Protein timing — avoid high protein near Syndopa dose.",
    specialInstructions: "High fall risk — non-slip socks, clear pathways, assist during transfers. Recent fall (INC-001) — extra vigilance.",
    notes: "Aspirin allergy noted. Son Deepak visits alternate weekends."
  },
  {
    id: "CP-004", patientId: "PAT-100012", patientName: "Jagdish Prasad", createdDate: "2026-01-28", reviewDate: "2026-04-01", createdBy: "Dr. Rajesh Kumar", status: "Active",
    diagnosis: "Chronic Kidney Disease Stage 4, on hemodialysis",
    goals: [
      { goal: "Maintain stable renal function on dialysis", target: "Ongoing", status: "In Progress" },
      { goal: "Manage fluid overload and blood pressure", target: "Ongoing", status: "Needs Attention" },
      { goal: "Maintain adequate nutrition with renal restrictions", target: "Ongoing", status: "In Progress" },
    ],
    medications: [
      { name: "Erythropoietin injection", timing: "Post-dialysis (Mon/Wed/Fri)", notes: "For anemia" },
      { name: "Calcium Acetate", timing: "With meals", notes: "Phosphate binder" },
      { name: "Telmisartan 40mg", timing: "Morning", notes: "For BP — hold if SBP < 100" },
    ],
    activities: ["Light chair exercises on non-dialysis days", "Breathing exercises daily", "Short walks when tolerated"],
    dietary: "Renal diet — low potassium, low phosphorus, restricted fluids (1L/day). High-quality protein 0.8g/kg.",
    specialInstructions: "Dialysis Mon/Wed/Fri at 10 AM. Strict I/O charting. Daily weight. Morphine allergy — DO NOT GIVE.",
    notes: "Critical patient. Daughter Rekha is primary decision maker. DNR discussion pending."
  },
];

// ── DIETARY PLANS ──
export const DIETARY_PLANS = [
  { patientId: "PAT-100001", patientName: "Kamla Devi", room: "101-A", dietType: "Diabetic", allergies: "Penicillin (not food)", restrictions: "No added sugar, limited rice/potato, no fruit juice", calories: 1500, meals: { breakfast: "Oats porridge, boiled egg, sugar-free tea", midMorning: "Handful of almonds, buttermilk", lunch: "2 roti, dal, green vegetables, salad, curd", evening: "Roasted chana, green tea", dinner: "1 roti, vegetable soup, grilled paneer", bedtime: "Warm milk (no sugar)" }, notes: "Good appetite. Enjoys South Indian food on Sundays (adjust carbs)." },
  { patientId: "PAT-100002", patientName: "Ramesh Chand", room: "102-A", dietType: "Soft / Dysphagia Level 2", allergies: "None", restrictions: "No thin liquids (thickened only), no hard/crunchy food", calories: 1800, meals: { breakfast: "Soft idli with sambar (mashed), banana smoothie", midMorning: "Custard", lunch: "Soft rice, dal (mashed), boiled vegetables (soft), curd", evening: "Kheer, thickened juice", dinner: "Soft khichdi, mashed pumpkin, dal soup", bedtime: "Warm thickened milk" }, notes: "Swallowing assessment: passed for soft solids. Review monthly. Needs supervision during meals." },
  { patientId: "PAT-100005", patientName: "Parvati Sharma", room: "105-A", dietType: "Pureed / Parkinson's", allergies: "Aspirin (not food)", restrictions: "Avoid high protein near Syndopa dose (30 min gap). No hard food.", calories: 1400, meals: { breakfast: "Pureed fruit, soft dalia, tea", midMorning: "Banana mash, juice", lunch: "Pureed rice-dal, vegetable puree, curd", evening: "Soup, soft biscuit (soaked)", dinner: "Khichdi puree, mashed potato, dal", bedtime: "Warm milk" }, notes: "Eating slowly — allow 30-40 min per meal. Tremor makes self-feeding difficult. Assist needed." },
  { patientId: "PAT-100008", patientName: "Har Prasad", room: "202-A", dietType: "Liquid / Semi-solid", allergies: "None", restrictions: "Bedridden — liquid/semi-solid only until doctor reassesses", calories: 1200, meals: { breakfast: "Porridge, fruit juice, tea", midMorning: "Protein shake", lunch: "Dal soup, rice water, fruit custard", evening: "Coconut water, soup", dinner: "Khichdi (very soft), dal, curd", bedtime: "Warm milk with turmeric" }, notes: "Low appetite. Encourage fluids. Consider nutritional supplement if intake stays below 60%." },
  { patientId: "PAT-100012", patientName: "Jagdish Prasad", room: "204-A", dietType: "Renal", allergies: "Morphine (not food)", restrictions: "Low potassium, low phosphorus, restricted fluids (1L/day), limited salt", calories: 1600, meals: { breakfast: "White bread toast, egg white, apple, tea (counted in fluids)", midMorning: "Rice cracker, small water", lunch: "White rice, chicken/fish (small), cabbage, limited dal", evening: "Dry snack (no banana/orange/tomato)", dinner: "Roti, paneer (small), lauki vegetable", bedtime: "No fluid after 8 PM" }, notes: "STRICT fluid monitoring on dialysis days. Potassium-rich foods FORBIDDEN (banana, orange, potato, tomato, coconut water)." },
];

// ── MEDICATION SCHEDULE (daily rounds) ──
export const MED_SCHEDULE = [
  { patientId: "PAT-100001", patientName: "Kamla Devi", room: "101-A", schedule: [
    { time: "08:00", medication: "Metformin 500mg", dose: "1 tab", timing: "After breakfast", given: true, givenBy: "Sunita Devi", givenAt: "08:10" },
    { time: "08:00", medication: "Amlodipine 5mg", dose: "1 tab", timing: "After breakfast", given: true, givenBy: "Sunita Devi", givenAt: "08:10" },
    { time: "20:00", medication: "Metformin 500mg", dose: "1 tab", timing: "After dinner", given: false, givenBy: null, givenAt: null },
    { time: "21:00", medication: "Atorvastatin 10mg", dose: "1 tab", timing: "After dinner", given: false, givenBy: null, givenAt: null },
  ]},
  { patientId: "PAT-100002", patientName: "Ramesh Chand", room: "102-A", schedule: [
    { time: "13:00", medication: "Ecosprin 75mg", dose: "1 tab", timing: "After lunch", given: true, givenBy: "Sunita Devi", givenAt: "13:15" },
    { time: "13:00", medication: "Clopidogrel 75mg", dose: "1 tab", timing: "After lunch", given: true, givenBy: "Sunita Devi", givenAt: "13:15" },
    { time: "21:00", medication: "Atorvastatin 20mg", dose: "1 tab", timing: "After dinner", given: false, givenBy: null, givenAt: null },
  ]},
  { patientId: "PAT-100005", patientName: "Parvati Sharma", room: "105-A", schedule: [
    { time: "07:30", medication: "Syndopa Plus 110mg", dose: "1 tab", timing: "30 min before breakfast", given: true, givenBy: "Sunita Devi", givenAt: "07:35" },
    { time: "07:30", medication: "Trihexyphenidyl 2mg", dose: "1 tab", timing: "Before breakfast", given: true, givenBy: "Sunita Devi", givenAt: "07:35" },
    { time: "13:00", medication: "Trihexyphenidyl 2mg", dose: "1 tab", timing: "Before lunch", given: true, givenBy: "Sunita Devi", givenAt: "12:55" },
    { time: "19:00", medication: "Syndopa Plus 110mg", dose: "1 tab", timing: "30 min before dinner", given: false, givenBy: null, givenAt: null },
    { time: "19:00", medication: "Trihexyphenidyl 2mg", dose: "1 tab", timing: "Before dinner", given: false, givenBy: null, givenAt: null },
  ]},
  { patientId: "PAT-100012", patientName: "Jagdish Prasad", room: "204-A", schedule: [
    { time: "08:00", medication: "Telmisartan 40mg", dose: "1 tab", timing: "Morning", given: true, givenBy: "Sunita Devi", givenAt: "08:05" },
    { time: "08:00", medication: "Calcium Acetate", dose: "1 tab", timing: "With breakfast", given: true, givenBy: "Sunita Devi", givenAt: "08:20" },
    { time: "13:00", medication: "Calcium Acetate", dose: "1 tab", timing: "With lunch", given: true, givenBy: "Sunita Devi", givenAt: "13:10" },
    { time: "20:00", medication: "Calcium Acetate", dose: "1 tab", timing: "With dinner", given: false, givenBy: null, givenAt: null },
  ]},
];

// ── FAMILY UPDATES ──
export const FAMILY_UPDATES = [
  { id: "FU-001", date: today, patientId: "PAT-100001", patientName: "Kamla Devi", type: "Daily Update", message: "Your mother had a good day. Vitals are stable. Blood sugar was slightly high at breakfast (165 mg/dL) but came down to 128 by lunch. She enjoyed morning walk and had full meals. She's asking about you!", postedBy: "Sunita Devi", readByFamily: true },
  { id: "FU-002", date: yesterday, patientId: "PAT-100005", patientName: "Parvati Sharma", type: "Incident Notification", message: "We want to inform you that your mother had a minor fall this afternoon while walking to the dining area. She has a small bruise on her left forearm. Dr. Meena examined her and X-ray confirmed no fracture. She is comfortable and resting. We have increased supervision. Please call us if you have any questions.", postedBy: "Sunita Devi", readByFamily: true },
  { id: "FU-003", date: today, patientId: "PAT-100002", patientName: "Ramesh Chand", type: "Daily Update", message: "Your father had a productive physiotherapy session today. His left arm movement is gradually improving. He ate 75% of his meals. He seemed a bit tired in the evening but is resting well now.", postedBy: "Sunita Devi", readByFamily: false },
  { id: "FU-004", date: today, patientId: "PAT-100012", patientName: "Jagdish Prasad", type: "Medical Update", message: "Dialysis completed successfully today. Fluid removal was 2.1 liters. BP was stable throughout. He tolerated it well but is tired. Tomorrow is a rest day — no dialysis. Dr. Rajesh will review lab reports on Monday.", postedBy: "Priya Nair", readByFamily: false },
  { id: "FU-005", date: twoDaysAgo, patientId: "PAT-100010", patientName: "Krishna Kumar", type: "Behavioral Update", message: "Your father had a sundowning episode yesterday evening — he became confused and tried to leave the building. Staff gently redirected him and he settled. This is a known pattern with Alzheimer's and we have increased evening supervision. Dr. Meena may adjust his evening routine.", postedBy: "Priya Nair", readByFamily: true },
];

// ── STAFF ACTIVITY LOG ──
export const STAFF_ACTIVITY = [
  { id: "ACT-001", name: "Sumant Pathak", role: "Admin", action: "Login", time: "09:05 AM", date: today },
  { id: "ACT-002", name: "Dr. Meena Sharma", role: "Doctor", action: "Login", time: "09:12 AM", date: today },
  { id: "ACT-003", name: "Neeta Verma", role: "Staff", action: "Login", time: "08:02 AM", date: today },
  { id: "ACT-004", name: "Amit Patel", role: "Staff", action: "Login", time: "09:00 AM", date: today },
  { id: "ACT-005", name: "Sunita Devi", role: "Staff", action: "Login", time: "07:00 AM", date: today },
  { id: "ACT-006", name: "Sunita Devi", role: "Staff", action: "Logout", time: "03:05 PM", date: yesterday },
  { id: "ACT-007", name: "Priya Nair", role: "Staff", action: "Login", time: "03:00 PM", date: yesterday },
  { id: "ACT-008", name: "Neeta Verma", role: "Staff", action: "Logout", time: "04:05 PM", date: yesterday },
  { id: "ACT-009", name: "Dr. Rajesh Kumar", role: "Doctor", action: "Login", time: "10:10 AM", date: yesterday },
  { id: "ACT-010", name: "Dr. Rajesh Kumar", role: "Doctor", action: "Logout", time: "06:15 PM", date: yesterday },
];

// ── MATERNITY FILES ──
const daysAgo = (n) => new Date(Date.now() - n*24*60*60*1000).toISOString().split("T")[0];
const weeksAgo = (n) => daysAgo(n * 7);
const daysLater = (n) => new Date(Date.now() + n*24*60*60*1000).toISOString().split("T")[0];

export const MATERNITY_FILES = [
  {
    id: "MAT-001", patientId: "PAT-200001", patientName: "Anjali Verma", age: 28, phone: "9855000001",
    careType: "Natural Pregnancy", bloodGroup: "B+", partnerName: "Rohit Verma", partnerBloodGroup: "O+",
    obstetrician: "Dr. Meena Sharma", riskFactors: [], notes: "First pregnancy, no complications.",
    status: "Active", ivfCycle: "", ivfStage: "", ivfClinic: "",
    lmpDate: lmpForWeeks(34),
    eddDate: calcEDD(lmpForWeeks(34)),
    trimester: getTrimester(34),
    createdAt: new Date(Date.now() - 32*7*24*60*60*1000).toISOString(),
    deliveryDate: null, deliveryNotes: "", closedAt: null, closedReason: "",
    visits: [
      { date: weeksAgo(8), type: "Prenatal Checkup", doctor: "Dr. Meena Sharma", weight: "62", bp: "118/76", fetalHR: "148", fundusHeight: "24", notes: "Normal progress. All vitals good.", nextVisit: "" },
      { date: weeksAgo(4), type: "Ultrasound / Scan", doctor: "Dr. Meena Sharma", weight: "64", bp: "120/78", fetalHR: "145", fundusHeight: "28", notes: "Growth scan normal. Baby weighing ~1.8kg. Placenta anterior.", nextVisit: "" },
      { date: weeksAgo(2), type: "Prenatal Checkup", doctor: "Dr. Meena Sharma", weight: "65", bp: "122/80", fetalHR: "142", fundusHeight: "30", notes: "All normal. Iron supplement continued.", nextVisit: "" },
      { date: daysAgo(0), type: "Non-Stress Test", doctor: "Dr. Meena Sharma", weight: "66", bp: "120/78", fetalHR: "140", fundusHeight: "32", notes: "NST reactive. Good fetal movement.", nextVisit: daysLater(14) },
    ],
    careNotes: [
      { date: daysAgo(0), shift: "Morning", bp: "120/78", weight: "66", fetalHR: "140", fundusHeight: "32", edema: "Mild ankle", urine: "Normal", observations: "Patient comfortable. Good fetal movement. Sleeping well.", medications: "Iron + Folic Acid, Calcium 500mg", nurse: "Sunita Devi" },
      { date: daysAgo(1), shift: "Morning", bp: "118/76", weight: "65.5", fetalHR: "142", fundusHeight: "32", edema: "None", urine: "Normal", observations: "Mild back pain, advised warm compress. Diet intake good.", medications: "Iron + Folic Acid, Calcium 500mg", nurse: "Rekha Sharma" },
    ],
  },
  {
    id: "MAT-002", patientId: "PAT-200002", patientName: "Priya Reddy", age: 34, phone: "9855000002",
    careType: "High-Risk Pregnancy", bloodGroup: "A+", partnerName: "Venkat Reddy", partnerBloodGroup: "AB+",
    obstetrician: "Dr. Meena Sharma", riskFactors: ["Multiple Pregnancy (Twins/Triplets)", "Advanced Maternal Age (35+)", "Gestational Diabetes"],
    notes: "Twin pregnancy. GDM diagnosed at 18 weeks. Monitoring closely.",
    status: "Active", ivfCycle: "", ivfStage: "", ivfClinic: "",
    lmpDate: lmpForWeeks(22),
    eddDate: calcEDD(lmpForWeeks(22)),
    trimester: getTrimester(22),
    createdAt: new Date(Date.now() - 20*7*24*60*60*1000).toISOString(),
    deliveryDate: null, deliveryNotes: "", closedAt: null, closedReason: "",
    visits: [
      { date: weeksAgo(10), type: "Prenatal Checkup", doctor: "Dr. Meena Sharma", weight: "70", bp: "130/84", fetalHR: "150/148", fundusHeight: "18", notes: "Twin pregnancy confirmed. Both heartbeats strong.", nextVisit: "" },
      { date: weeksAgo(4), type: "Glucose Tolerance Test", doctor: "Dr. Meena Sharma", weight: "73", bp: "128/82", fetalHR: "146/144", fundusHeight: "22", notes: "GDM diagnosed. Started dietary management + glucose monitoring.", nextVisit: "" },
      { date: daysAgo(7), type: "Ultrasound / Scan", doctor: "Dr. Meena Sharma", weight: "74", bp: "126/80", fetalHR: "144/142", fundusHeight: "26", notes: "Both babies growing well. Twin A: 480g, Twin B: 460g.", nextVisit: "" },
    ],
    careNotes: [
      { date: daysAgo(0), shift: "Morning", bp: "128/82", weight: "74", fetalHR: "144/142", fundusHeight: "26", edema: "Mild", urine: "Trace protein", observations: "GDM diet followed. Blood sugar fasting 98, PP 136. Both babies active.", medications: "Iron, Folic Acid, Calcium, Metformin 500mg", nurse: "Sunita Devi" },
    ],
  },
  {
    id: "MAT-003", patientId: "PAT-200003", patientName: "Kavita Joshi", age: 36, phone: "9855000003",
    careType: "IVF / Assisted", bloodGroup: "O+", partnerName: "Amit Joshi", partnerBloodGroup: "B+",
    obstetrician: "Dr. Meena Sharma", riskFactors: ["Advanced Maternal Age (35+)", "PCOS History", "Previous Miscarriage"],
    notes: "IVF Cycle 2. First cycle unsuccessful. PCOS managed with Metformin.",
    status: "Open", ivfCycle: "Cycle 2", ivfStage: "Embryo Transfer", ivfClinic: "City Fertility Centre",
    lmpDate: "", eddDate: "", trimester: "",
    createdAt: new Date(Date.now() - 30*24*60*60*1000).toISOString(),
    deliveryDate: null, deliveryNotes: "", closedAt: null, closedReason: "",
    visits: [
      { date: weeksAgo(3), type: "IVF Consultation", doctor: "Dr. Meena Sharma", weight: "58", bp: "120/78", fetalHR: "", fundusHeight: "", notes: "Cycle 2 planning. Stimulation protocol adjusted.", nextVisit: "" },
      { date: daysAgo(7), type: "IVF Monitoring", doctor: "Dr. Meena Sharma", weight: "58", bp: "118/76", fetalHR: "", fundusHeight: "", notes: "4 follicles responding. Trigger shot scheduled.", nextVisit: "" },
      { date: daysAgo(0), type: "IVF Embryo Transfer", doctor: "Dr. Meena Sharma", weight: "58", bp: "116/74", fetalHR: "", fundusHeight: "", notes: "2 embryos transferred (Grade A). Bed rest advised for 48 hours.", nextVisit: daysLater(14) },
    ],
    careNotes: [],
  },
  {
    id: "MAT-004", patientId: "PAT-200004", patientName: "Meera Gupta", age: 26, phone: "9855000004",
    careType: "Natural Pregnancy", bloodGroup: "AB+", partnerName: "Rahul Gupta", partnerBloodGroup: "A+",
    obstetrician: "Dr. Meena Sharma", riskFactors: [],
    notes: "Normal pregnancy. Delivered healthy baby girl.",
    status: "Delivered", ivfCycle: "", ivfStage: "", ivfClinic: "",
    lmpDate: lmpForWeeks(41),
    eddDate: calcEDD(lmpForWeeks(41)),
    trimester: "Third Trimester (27-40 weeks)",
    createdAt: new Date(Date.now() - 39*7*24*60*60*1000).toISOString(),
    deliveryDate: new Date(Date.now() - 5*24*60*60*1000).toISOString().split("T")[0],
    deliveryNotes: "Normal vaginal delivery. Baby girl 3.2kg. APGAR 8/9. Mother and baby healthy.",
    closedAt: null, closedReason: "",
    visits: [
      { date: weeksAgo(12), type: "Prenatal Checkup", doctor: "Dr. Meena Sharma", weight: "58", bp: "116/74", fetalHR: "148", fundusHeight: "28", notes: "Normal progress.", nextVisit: "" },
      { date: weeksAgo(4), type: "Delivery Planning", doctor: "Dr. Meena Sharma", weight: "63", bp: "120/78", fetalHR: "140", fundusHeight: "36", notes: "Hospital bag ready. Normal delivery planned.", nextVisit: "" },
      { date: daysAgo(5), type: "Post-Natal Checkup", doctor: "Dr. Meena Sharma", weight: "58", bp: "118/76", fetalHR: "", fundusHeight: "", notes: "Post-delivery day 1. Mother recovering well. Breastfeeding established.", nextVisit: daysLater(7) },
    ],
    careNotes: [
      { date: daysAgo(5), shift: "Morning", bp: "118/76", weight: "58", fetalHR: "", fundusHeight: "", edema: "None", urine: "Normal", observations: "Post-delivery day 1. Stitches clean. Breastfeeding good. Baby latching well.", medications: "Iron, Calcium, Paracetamol SOS", nurse: "Rekha Sharma" },
    ],
  },
];

// ── Helper: generate unique ID ──
let _counter = Date.now();
export function genId(prefix = "ID") {
  return `${prefix}-${(++_counter).toString(36).toUpperCase()}`;
}

// ── Persistent state (survives within session) ──
// We clone arrays so mutations don't affect originals on re-import
function clone(arr) { return JSON.parse(JSON.stringify(arr)); }

export function getDemoStore() {
  if (!window.__demoStore) {
    window.__demoStore = {
      users: clone(USERS),
      patients: clone(PATIENTS),
      rooms: clone(ROOMS),
      appointments: clone(APPOINTMENTS),
      prescriptions: clone(PRESCRIPTIONS),
      medicines: clone(MEDICINES),
      billing: clone(BILLING),
      salaryRecords: clone(SALARY_RECORDS),
      homeCarePatients: clone(HOME_CARE_PATIENTS),
      homeCareNotes: clone(HOME_CARE_NOTES),
      incidents: clone(INCIDENTS),
      visitors: clone(VISITORS),
      shiftHandovers: clone(SHIFT_HANDOVERS),
      carePlans: clone(CARE_PLANS),
      dietaryPlans: clone(DIETARY_PLANS),
      medSchedule: clone(MED_SCHEDULE),
      familyUpdates: clone(FAMILY_UPDATES),
      staffActivity: clone(STAFF_ACTIVITY),
      maternityFiles: clone(MATERNITY_FILES),
    };

    // Restore registered test doctors from localStorage (survive page refresh)
    try {
      const saved = JSON.parse(localStorage.getItem("registered_test_doctors") || "[]");
      saved.forEach(doc => {
        if (!window.__demoStore.users.find(u => u.email === doc.email)) {
          window.__demoStore.users.push(doc);
        }
      });
    } catch {}
  }
  return window.__demoStore;
}

/** Save a test doctor to localStorage so they survive page refresh */
export function persistTestDoctor(user) {
  try {
    const saved = JSON.parse(localStorage.getItem("registered_test_doctors") || "[]");
    if (!saved.find(u => u.email === user.email)) {
      saved.push(user);
      localStorage.setItem("registered_test_doctors", JSON.stringify(saved));
    }
  } catch {}
}
