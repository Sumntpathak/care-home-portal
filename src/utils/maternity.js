/**
 * Maternity Calculation Utilities
 * Shared between MaternityCare page, PatientPortal, DoctorAppts
 */

export const TRIMESTERS = ["First Trimester (1-12 weeks)", "Second Trimester (13-26 weeks)", "Third Trimester (27-40 weeks)"];
export const CARE_TYPES = ["Natural Pregnancy", "IVF / Assisted", "High-Risk Pregnancy", "Surrogacy"];
export const FILE_STATUSES = ["Open", "Active", "Delivered", "Closed"];
export const VISIT_TYPES = ["Prenatal Checkup", "Ultrasound / Scan", "Blood Work", "IVF Consultation", "IVF Embryo Transfer", "IVF Monitoring", "Glucose Tolerance Test", "Amniocentesis", "Non-Stress Test", "Delivery Planning", "Emergency Visit", "Post-Natal Checkup"];
export const RISK_FACTORS = ["Gestational Diabetes", "Pre-eclampsia", "Placenta Previa", "Multiple Pregnancy (Twins/Triplets)", "Advanced Maternal Age (35+)", "Previous C-Section", "Rh Incompatibility", "Thyroid Disorder", "Anemia", "Previous Miscarriage", "PCOS History"];
export const IVF_STAGES = ["Initial Consultation", "Ovarian Stimulation", "Egg Retrieval", "Fertilization", "Embryo Culture", "Embryo Transfer", "2-Week Wait (TWW)", "Pregnancy Test", "Ongoing Monitoring"];

export const STATUS_STYLE = {
  Open:      { bg: "var(--info-light)", color: "var(--info)", label: "Open" },
  Active:    { bg: "var(--success-light)", color: "var(--success)", label: "Active" },
  Delivered: { bg: "var(--purple-light)", color: "var(--purple)", label: "Delivered" },
  Closed:    { bg: "var(--subtle)", color: "var(--text-muted)", label: "Closed" },
};

/** Calculate Expected Delivery Date from Last Menstrual Period */
export function calcEDD(lmp) {
  if (!lmp) return "";
  const d = new Date(lmp);
  d.setDate(d.getDate() + 280);
  return d.toISOString().split("T")[0];
}

/** Calculate gestational weeks from LMP */
export function calcWeeks(lmp) {
  if (!lmp) return null;
  const diff = Date.now() - new Date(lmp).getTime();
  const weeks = Math.floor(diff / (7 * 24 * 60 * 60 * 1000));
  return weeks >= 0 ? weeks : null;
}

/** Get trimester string from weeks */
export function getTrimester(weeks) {
  if (weeks == null || weeks < 0) return TRIMESTERS[0];
  if (weeks <= 12) return TRIMESTERS[0];
  if (weeks <= 26) return TRIMESTERS[1];
  return TRIMESTERS[2];
}

/** Calculate weeks for a given date relative to LMP */
export function weeksAtDate(lmp, date) {
  if (!lmp || !date) return null;
  const diff = new Date(date).getTime() - new Date(lmp).getTime();
  return Math.floor(diff / (7 * 24 * 60 * 60 * 1000));
}

/** Format date for display */
export function fmtDate(d) {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); }
  catch { return String(d); }
}

/** Get progress percentage (0-100) for pregnancy */
export function getProgress(lmp) {
  const w = calcWeeks(lmp);
  if (w == null) return 0;
  return Math.min(Math.max((w / 40) * 100, 0), 100);
}

/** Get color for weeks badge */
export function weeksColor(weeks) {
  if (weeks == null) return "var(--text-muted)";
  if (weeks > 36) return "var(--danger)";
  if (weeks > 26) return "var(--warning)";
  return "var(--success)";
}

/** Generate an LMP date that results in the given gestational weeks (from today) */
export function lmpForWeeks(weeks) {
  const d = new Date();
  d.setDate(d.getDate() - (weeks * 7));
  return d.toISOString().split("T")[0];
}
