/**
 * Hospital Print Templates
 * ========================
 * Every printable document in the hospital system.
 * Each template uses the same building blocks from PrintBlocks.
 *
 * Usage:
 *   import { OpdReceipt, PrescriptionA4, DispenseSlip } from "../print/templates";
 *   <OpdReceipt data={appointment} />  // renders inside a print target div
 */

import { HOSPITAL, P, DOC_CONFIG } from "./hospital";
import { HospitalHeader, HospitalFooter, SectionTitle, SignatureBlock, DataTable, ReceiptBar, FeeRow, S } from "./PrintBlocks";

/* ── helpers ── */
const fmt = (d) => { if (!d) return "—"; try { return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); } catch { return String(d); } };
const fmtDT = (d) => { if (!d) return "—"; try { return new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true }); } catch { return String(d); } };
const fmtTime = () => new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
const fmtToday = () => new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });

/* Wrapper for all print content */
const PrintPage = ({ id, children }) => (
  <div id={id} style={{ fontFamily: "Arial, Helvetica, sans-serif", fontSize: 11, color: P.text, lineHeight: 1.45, background: P.white }}>
    {children}
  </div>
);

/* ══════════════════════════════════════════════════════════════
   1. OPD RECEIPT (A5) — given to patient after appointment booking
   ══════════════════════════════════════════════════════════════ */

export function OpdReceipt({ data: a }) {
  if (!a) return null;
  const fee = Number(a.billAmount || a.bill || 0);
  return (
    <PrintPage id="print-opd-receipt">
      <HospitalHeader docTitle={DOC_CONFIG["opd-receipt"].title} />
      <ReceiptBar receiptNo={a.receiptNo} dateTime={`${fmtToday()} ${fmtTime()}`} status={a.status} />

      <SectionTitle>Patient Details</SectionTitle>
      <table style={S.table}><tbody>
        <tr style={S.rowAlt}><td style={S.label}>Patient Name</td><td style={{ ...S.cell, fontWeight: 700 }}>{a.patientName || "—"}</td><td style={S.label}>Phone</td><td style={S.cell}>{a.phone || "—"}</td></tr>
        <tr><td style={S.label}>Consulting Doctor</td><td style={{ ...S.cell, fontWeight: 700, color: P.navy }}>{a.doctor || "—"}</td><td style={S.label}>Department</td><td style={S.cell}>{a.type || "—"}</td></tr>
        {a.notes && <tr style={S.rowAlt}><td style={S.label}>Chief Complaint</td><td colSpan={3} style={S.cell}>{a.notes}</td></tr>}
      </tbody></table>

      <SectionTitle>Consultation Fee</SectionTitle>
      <FeeRow amount={fee} paid={fee > 0} />

      {/* Rx placeholder */}
      <div style={{ padding: "10px 12px", minHeight: 40, border: `1px solid ${P.borderLt}`, borderRadius: 2, marginBottom: 8 }}>
        <div style={{ fontSize: 16, fontWeight: 800, fontStyle: "italic", color: P.navy, marginBottom: 3 }}>&#8478;</div>
        <div style={{ fontSize: 9, color: P.light, fontStyle: "italic" }}>Prescription will be written by the doctor during consultation. Present this receipt at the doctor's chamber.</div>
      </div>

      {/* Instructions */}
      <div style={{ padding: "6px 10px", background: P.orangeBg, border: `1px solid #fde68a`, borderRadius: 2, marginBottom: 8, fontSize: 9, lineHeight: 1.6, color: "#78350f" }}>
        <strong style={{ color: "#92400e" }}>INSTRUCTIONS:</strong> 1. Keep receipt safe. 2. Present at doctor's chamber. 3. Collect medicines from dispensary after consultation. 4. Valid for today only.
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: P.light, marginBottom: 4 }}>
        <span>Created by: {a.createdBy || "Reception"}</span>
        <div style={{ borderTop: `1px solid ${P.navy}`, paddingTop: 2, minWidth: 100, textAlign: "center", fontWeight: 600, color: P.navy, fontSize: 10 }}>Authorized Signatory</div>
      </div>

      <HospitalFooter />
    </PrintPage>
  );
}

/* ══════════════════════════════════════════════════════════════
   2. PRESCRIPTION (A4) — doctor's prescription
   ══════════════════════════════════════════════════════════════ */

export function PrescriptionA4({ data: { receiptNo, patient, doctorName, degree, diagnosis, meds = [], notes, dietPlan } }) {
  /* Parse diet if it's a JSON string */
  let diet = dietPlan;
  if (typeof diet === "string") { try { diet = JSON.parse(diet); } catch { diet = null; } }

  return (
    <PrintPage id="print-prescription">
      <HospitalHeader docTitle={DOC_CONFIG["prescription"].title} />

      {/* Doctor bar */}
      <div style={{ background: P.labelBg, borderBottom: `1px solid ${P.borderLt}`, padding: "6px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: P.navy }}>{doctorName || "—"}</div>
          {degree && <div style={{ fontSize: 10, color: P.muted }}>{degree}</div>}
        </div>
        <div style={{ fontSize: 10, color: P.muted }}>Slip No: <strong style={{ fontFamily: "monospace", color: P.navy }}>{receiptNo || "—"}</strong></div>
      </div>

      {/* Patient */}
      <table style={S.table}><tbody>
        <tr style={S.rowAlt}>
          <td style={S.label}>Patient</td><td style={{ ...S.cell, fontWeight: 700 }}>{patient?.patientName || patient?.name || "—"}</td>
          <td style={S.label}>Phone</td><td style={S.cell}>{patient?.phone || "—"}</td>
          <td style={S.label}>Type</td><td style={S.cell}>{patient?.type || "OPD"}</td>
        </tr>
      </tbody></table>

      {/* Diagnosis */}
      <SectionTitle>Diagnosis</SectionTitle>
      <div style={{ padding: "5px 10px", background: P.accentBg, borderLeft: `3px solid ${P.accent}`, borderRadius: 2, marginBottom: 6, fontSize: 12, fontWeight: 600, color: P.navy }}>{diagnosis || "—"}</div>

      {/* Rx */}
      <SectionTitle>&#8478; Medicines</SectionTitle>
      {meds.length > 0 && (
        <DataTable
          headers={["#", "Medicine / Dose", "When", "Frequency", "Duration", "Qty"]}
          rows={meds.map((m, i) => [
            i + 1,
            <span key={i}><strong>{m.name || "—"}</strong>{m.dose ? ` — ${m.dose}` : ""}{m.notes ? <div style={{ fontSize: 9, color: P.light, fontStyle: "italic" }}>{m.notes}</div> : null}</span>,
            m.timing || "—", m.frequency || "—", m.duration || "—", m.qty || "—",
          ])}
        />
      )}

      {notes && (
        <div style={{ padding: "4px 10px", background: P.rowAlt, border: `1px solid ${P.border}`, borderRadius: 2, fontSize: 10, marginBottom: 6 }}>
          <strong>Instructions:</strong> {notes}
        </div>
      )}

      {/* Diet Chart */}
      {diet && diet.meals && (
        <div style={{ pageBreakInside: "avoid" }}>
          <SectionTitle>Diet Recommendations</SectionTitle>
          <table style={{ ...S.table, fontSize: 10 }}>
            <tbody>
              <tr style={{ background: P.accentBg }}>
                <td colSpan={2} style={S.cell}>
                  <strong>Diet Type:</strong> {diet.dietType || "General"} &nbsp;&nbsp;
                  {diet.calories && <><strong>Calories:</strong> {diet.calories}</>}
                </td>
              </tr>
              {["breakfast","midMorning","lunch","evening","dinner","bedtime"].map(slot => {
                const meal = diet.meals[slot];
                if (!meal) return null;
                const label = slot === "midMorning" ? "Mid-Morning" : slot.charAt(0).toUpperCase() + slot.slice(1);
                return <tr key={slot}><td style={{ ...S.label, width: 100 }}>{label}</td><td style={S.cell}>{meal}</td></tr>;
              })}
              {diet.restrictions?.length > 0 && (
                <tr><td style={{ ...S.label, color: P.red }}>Avoid</td><td style={{ ...S.cell, color: P.red }}>{diet.restrictions.join(", ")}</td></tr>
              )}
              {diet.tips?.length > 0 && (
                <tr><td style={S.label}>Tips</td><td style={S.cell}>{diet.tips.join(" | ")}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <SignatureBlock signatures={[
        { label: "Show at Dispensary", name: `Receipt: ${receiptNo}` },
        { label: "Doctor's Signature & Stamp", name: doctorName },
      ]} />
      <HospitalFooter />
    </PrintPage>
  );
}

/* ══════════════════════════════════════════════════════════════
   3. DISPENSARY SLIP (A5) — given when medicines dispensed
   ══════════════════════════════════════════════════════════════ */

export function DispenseSlip({ data: item }) {
  if (!item) return null;
  let meds = [];
  try { meds = typeof item.medications === "string" ? JSON.parse(item.medications) : item.medications || []; } catch { meds = []; }
  if (!Array.isArray(meds)) meds = [];

  /* Parse diet if available */
  let diet = item.dietPlan;
  if (typeof diet === "string") { try { diet = JSON.parse(diet); } catch { diet = null; } }

  const consultFee = parseFloat(item.consultFee || item.billAmount || 0);
  const medAmount = parseFloat(item.medicineAmount || 0);
  const totalBill = consultFee + medAmount;

  return (
    <PrintPage id="print-dispense-slip">
      <HospitalHeader docTitle={DOC_CONFIG["dispense-slip"].title} />

      <table style={S.table}><tbody>
        <tr style={S.rowAlt}>
          <td style={S.label}>Slip No</td><td style={{ ...S.cell, fontFamily: "monospace", fontWeight: 700 }}>{item.receiptNo || "—"}</td>
          <td style={S.label}>Date</td><td style={S.cell}>{fmtToday()}</td>
        </tr>
        <tr>
          <td style={S.label}>Patient</td><td style={{ ...S.cell, fontWeight: 700 }}>{item.patientName || "—"}</td>
          <td style={S.label}>Doctor</td><td style={{ ...S.cell, fontWeight: 600, color: P.navy }}>{item.doctor || item.doctorName || "—"}</td>
        </tr>
        {item.diagnosis && <tr style={S.rowAlt}><td style={S.label}>Diagnosis</td><td colSpan={3} style={S.cell}>{item.diagnosis}</td></tr>}
      </tbody></table>

      <SectionTitle>Medicines Dispensed</SectionTitle>
      {meds.length > 0 ? (
        <DataTable
          headers={["#", "Medicine", "Dose", "When", "Frequency", "Duration", "Qty"]}
          rows={meds.map((m, i) => [i + 1, m.name || "—", m.dose || "—", m.timing || "—", m.frequency || "—", m.duration || "—", m.qty || "—"])}
        />
      ) : (
        item.medications && <div style={{ padding: "4px 10px", fontSize: 11, border: `1px solid ${P.border}`, borderRadius: 2, marginBottom: 6 }}>{item.medications}</div>
      )}

      {item.notes && <div style={{ padding: "4px 10px", background: P.rowAlt, border: `1px solid ${P.border}`, borderRadius: 2, fontSize: 10, marginBottom: 6 }}><strong>Notes:</strong> {item.notes}</div>}

      {/* Diet Chart */}
      {diet && diet.meals && (
        <div style={{ pageBreakInside: "avoid" }}>
          <SectionTitle>Diet Recommendations</SectionTitle>
          <table style={{ ...S.table, fontSize: 10 }}>
            <tbody>
              <tr style={{ background: P.accentBg }}><td colSpan={2} style={S.cell}><strong>Diet:</strong> {diet.dietType || "General"}{diet.calories ? ` · ${diet.calories}` : ""}</td></tr>
              {["breakfast","lunch","dinner"].map(slot => {
                const meal = diet.meals[slot];
                if (!meal) return null;
                return <tr key={slot}><td style={{ ...S.label, width: 80 }}>{slot.charAt(0).toUpperCase() + slot.slice(1)}</td><td style={S.cell}>{meal}</td></tr>;
              })}
              {diet.restrictions?.length > 0 && <tr><td style={{ ...S.label, color: P.red }}>Avoid</td><td style={{ ...S.cell, color: P.red }}>{diet.restrictions.join(", ")}</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* Billing */}
      {totalBill > 0 && (
        <div style={{ pageBreakInside: "avoid" }}>
          <SectionTitle>Billing Summary</SectionTitle>
          <table style={{ ...S.table, fontSize: 10 }}>
            <tbody>
              {consultFee > 0 && <tr><td style={S.cell}>Consultation Fee</td><td style={{ ...S.cell, textAlign: "right" }}>&#8377;{consultFee.toLocaleString("en-IN")}</td></tr>}
              {medAmount > 0 && <tr><td style={S.cell}>Medicine Charges</td><td style={{ ...S.cell, textAlign: "right" }}>&#8377;{medAmount.toLocaleString("en-IN")}</td></tr>}
              <tr style={{ background: P.labelBg }}><td style={{ ...S.cell, fontWeight: 800, color: P.navy }}>TOTAL</td><td style={{ ...S.cell, textAlign: "right", fontWeight: 800, fontSize: 13, fontFamily: "monospace", color: P.navy }}>&#8377;{totalBill.toLocaleString("en-IN")}</td></tr>
            </tbody>
          </table>
        </div>
      )}

      <SignatureBlock signatures={[
        { label: "Patient Signature" },
        { label: "Dispensed By" },
      ]} />
      <HospitalFooter />
    </PrintPage>
  );
}

/* ══════════════════════════════════════════════════════════════
   4. UNIFIED VISIT RECEIPT (A4) — complete OPD visit summary
   ══════════════════════════════════════════════════════════════ */

export function VisitReceipt({ data: { appointment = {}, prescription, dispensary, tests, dietPlan, healthAdvice } }) {
  let meds = [];
  try { meds = typeof prescription?.medications === "string" ? JSON.parse(prescription.medications) : prescription?.medications || []; } catch { meds = []; }

  const hasPrescription = prescription && (prescription.diagnosis || meds.length > 0);
  const hasDispensary = dispensary && (dispensary.dispensedAt || dispensary.dispensedBy);
  const hasTests = Array.isArray(tests) && tests.length > 0;
  const hasDiet = dietPlan && (dietPlan.dietType || dietPlan.meals);
  const hasAdvice = healthAdvice && (healthAdvice.summary || healthAdvice.recommendations);
  const fee = appointment.billAmount != null ? Number(appointment.billAmount) : null;

  return (
    <PrintPage id="print-visit-receipt">
      <HospitalHeader docTitle="OPD VISIT RECEIPT" />
      <ReceiptBar receiptNo={appointment.receiptNo} dateTime={fmtDT(appointment.date)} status={appointment.status} />

      <SectionTitle>Patient Details</SectionTitle>
      <table style={S.table}><tbody>
        <tr style={S.rowAlt}><td style={S.label}>Patient Name</td><td style={{ ...S.cell, fontWeight: 700 }}>{appointment.patientName || "—"}</td><td style={S.label}>Phone</td><td style={S.cell}>{appointment.phone || "—"}</td></tr>
        <tr><td style={S.label}>Doctor</td><td style={{ ...S.cell, fontWeight: 700, color: P.navy }}>{appointment.doctor || "—"}</td><td style={S.label}>Department</td><td style={S.cell}>{appointment.type || "—"}</td></tr>
        {appointment.notes && <tr style={S.rowAlt}><td style={S.label}>Complaint</td><td colSpan={3} style={S.cell}>{appointment.notes}</td></tr>}
      </tbody></table>

      <SectionTitle>Consultation Fee</SectionTitle>
      <FeeRow amount={fee} paid={fee > 0} />

      {hasPrescription && (
        <div style={S.section}>
          <SectionTitle>Prescription</SectionTitle>
          {prescription.diagnosis && <div style={{ padding: "4px 10px", background: P.accentBg, borderLeft: `3px solid ${P.accent}`, borderRadius: 2, marginBottom: 5, fontSize: 11 }}><strong>Diagnosis:</strong> {prescription.diagnosis}</div>}
          {meds.length > 0 && (
            <DataTable
              headers={["#", "Medicine / Dose", "When", "Frequency", "Duration", "Qty"]}
              rows={meds.map((m, i) => [i + 1, <span key={i}><strong>{m.name || m.medicine || "—"}</strong>{(m.dose || m.dosage) ? ` — ${m.dose || m.dosage}` : ""}</span>, m.whenToTake || m.when || m.timing || "—", m.frequency || "—", m.duration || "—", m.qty || m.quantity || "—"])}
            />
          )}
          {prescription.notes && <div style={{ padding: "3px 10px", background: P.rowAlt, border: `1px solid ${P.border}`, borderRadius: 2, fontSize: 10 }}><strong>Instructions:</strong> {prescription.notes}</div>}
        </div>
      )}

      {hasDispensary && (
        <div style={S.section}>
          <SectionTitle>Dispensary</SectionTitle>
          <table style={S.table}><tbody>
            <tr style={{ background: P.greenBg }}>
              <td style={{ ...S.cell, fontWeight: 700, color: P.green }}>Medicines Dispensed</td>
              {dispensary.dispensedBy && <td style={S.cell}><strong>By:</strong> {dispensary.dispensedBy}</td>}
              {dispensary.dispensedAt && <td style={S.cell}><strong>At:</strong> {fmtDT(dispensary.dispensedAt)}</td>}
            </tr>
          </tbody></table>
        </div>
      )}

      {hasTests && (
        <div style={S.section}>
          <SectionTitle>Lab Tests</SectionTitle>
          <DataTable headers={["#", "Test", "Result", "Date"]} rows={tests.map((t, i) => [i + 1, t.name || "—", t.result || "Pending", fmt(t.date)])} />
        </div>
      )}

      {hasDiet && (
        <div style={S.section}>
          <SectionTitle>Diet Recommendations</SectionTitle>
          <table style={S.table}><tbody>
            {(dietPlan.dietType || dietPlan.calories) && <tr style={{ background: P.accentBg }}><td colSpan={2} style={S.cell}>{dietPlan.dietType && <><strong>Type:</strong> {dietPlan.dietType} &nbsp;</>}{dietPlan.calories && <><strong>Cal:</strong> {dietPlan.calories} kcal</>}</td></tr>}
            {dietPlan.meals && (Array.isArray(dietPlan.meals) ? dietPlan.meals : Object.entries(dietPlan.meals).map(([k, v]) => ({ label: k, items: v }))).map((meal, i) => (
              <tr key={i}><td style={{ ...S.label, width: 100, textTransform: "capitalize" }}>{meal.label || meal.time || meal.name || `Meal ${i + 1}`}</td><td style={S.cell}>{typeof meal.items === "string" ? meal.items : Array.isArray(meal.items) ? meal.items.join(", ") : meal.description || "—"}</td></tr>
            ))}
          </tbody></table>
        </div>
      )}

      {hasAdvice && (
        <div style={S.section}>
          <SectionTitle>Health Advisory</SectionTitle>
          <div style={{ border: `1px solid ${P.border}`, borderRadius: 2, padding: 8, fontSize: 10 }}>
            {healthAdvice.summary && <p style={{ margin: "0 0 4px", lineHeight: 1.5 }}>{healthAdvice.summary}</p>}
            {healthAdvice.recommendations && <div><strong>Recommendations:</strong><ul style={{ margin: "2px 0 0", paddingLeft: 16, lineHeight: 1.6 }}>{(Array.isArray(healthAdvice.recommendations) ? healthAdvice.recommendations : [healthAdvice.recommendations]).map((r, i) => <li key={i}>{r}</li>)}</ul></div>}
            {healthAdvice.warnings && <div style={{ padding: "4px 8px", background: P.redBg, borderLeft: `3px solid ${P.red}`, borderRadius: 2, marginTop: 4 }}><strong style={{ color: P.red }}>Warnings:</strong> {Array.isArray(healthAdvice.warnings) ? healthAdvice.warnings.join("; ") : healthAdvice.warnings}</div>}
          </div>
        </div>
      )}

      <SignatureBlock signatures={[
        { label: "Doctor", name: appointment.doctor },
        { label: "Dispensary", name: dispensary?.dispensedBy },
        { label: "Patient / Guardian", name: appointment.patientName },
      ]} />
      <HospitalFooter />
    </PrintPage>
  );
}

/* ══════════════════════════════════════════════════════════════
   5. DAILY CARE REPORT (A4) — home care daily notes
   ══════════════════════════════════════════════════════════════ */

export function DailyCareReport({ data: { patient, notes = [] } }) {
  return (
    <PrintPage id="print-daily-report">
      <HospitalHeader docTitle={DOC_CONFIG["daily-report"].title} />

      <table style={S.table}><tbody>
        <tr style={S.rowAlt}><td style={S.label}>Patient</td><td style={{ ...S.cell, fontWeight: 700 }}>{patient?.name || "—"}</td><td style={S.label}>Room</td><td style={S.cell}>{patient?.room || "—"}</td></tr>
        <tr><td style={S.label}>Age / Gender</td><td style={S.cell}>{patient?.age ? `${patient.age} yrs` : "—"} / {patient?.gender || "—"}</td><td style={S.label}>Condition</td><td style={S.cell}>{patient?.condition || "—"}</td></tr>
        <tr style={S.rowAlt}><td style={S.label}>Admit Date</td><td style={S.cell}>{patient?.admitDate || "—"}</td><td style={S.label}>Report Date</td><td style={{ ...S.cell, fontWeight: 600 }}>{fmtToday()}</td></tr>
      </tbody></table>

      {notes.length === 0 ? (
        <div style={{ padding: 20, textAlign: "center", color: P.muted, fontStyle: "italic" }}>No daily care notes recorded.</div>
      ) : notes.map((n, i) => (
        <div key={i} style={{ marginBottom: 10, pageBreakInside: "avoid" }}>
          <div style={{ display: "flex", justifyContent: "space-between", background: P.navy, color: P.white, padding: "4px 10px", borderRadius: "2px 2px 0 0", fontSize: 10 }}>
            <span style={{ fontWeight: 700 }}>{n.date || "—"} — {n.shift || "—"} Shift</span>
            <span style={{ opacity: 0.8 }}>By: {n.recordedBy || "Nurse"}</span>
          </div>
          <table style={{ ...S.table, borderTop: "none", marginBottom: 0 }}>
            <thead><tr style={{ background: P.labelBg }}>
              {["Temp (°F)", "BP", "Pulse", "SpO₂ (%)", "Glucose", "Weight (kg)"].map(h => <th key={h} style={{ ...S.thCell, background: P.labelBg, color: "#334155", border: `1px solid ${P.border}` }}>{h}</th>)}
            </tr></thead>
            <tbody><tr>
              {[n.temp, n.bp, n.pulse, n.spo2, n.glucose, n.weight].map((v, vi) => (
                <td key={vi} style={{ ...S.cell, textAlign: "center", fontWeight: 700, fontSize: 12, color: v ? P.text : P.light }}>{v || "—"}</td>
              ))}
            </tr></tbody>
          </table>
          <table style={{ ...S.table, borderTop: "none", marginBottom: 0 }}><tbody>
            {[["Observations", n.observations], ["Medications", n.medications], ["Nursing", n.nursing], ["Diet", n.diet], ["Mood", n.moodBehaviour]].filter(([, v]) => v).map(([l, v]) => (
              <tr key={l}><td style={{ ...S.label, width: 110 }}>{l}</td><td style={S.cell}>{v}</td></tr>
            ))}
          </tbody></table>
        </div>
      ))}

      <SignatureBlock signatures={[{ label: "Nursing In-Charge" }, { label: "Attending Physician" }]} />
      <HospitalFooter />
    </PrintPage>
  );
}

/* ══════════════════════════════════════════════════════════════
   6. DISCHARGE FILE (A4) — complete patient discharge summary
   ══════════════════════════════════════════════════════════════ */

export function DischargeFile({ data: { patient, notes = [], medications = [], dischargeInfo = {} } }) {
  const stayDays = () => {
    if (!patient?.admitDate || !dischargeInfo.dischargeDate) return "—";
    const diff = Math.ceil((new Date(dischargeInfo.dischargeDate) - new Date(patient.admitDate)) / 86400000);
    return diff >= 0 ? `${diff} day${diff !== 1 ? "s" : ""}` : "—";
  };

  const allMeds = notes.filter(n => n.medications).map(n => ({ date: n.date, shift: n.shift, meds: n.medications }));

  return (
    <PrintPage id="print-discharge">
      <HospitalHeader docTitle={DOC_CONFIG["discharge"].title} />

      <SectionTitle>Patient Demographics</SectionTitle>
      <table style={S.table}><tbody>
        <tr><td style={S.label}>Patient Name</td><td style={{ ...S.cell, fontWeight: 700 }}>{patient?.name || "—"}</td><td style={S.label}>Patient ID</td><td style={S.cell}>{patient?.id || "—"}</td></tr>
        <tr style={S.rowAlt}><td style={S.label}>Age / Gender</td><td style={S.cell}>{patient?.age || "—"} yrs / {patient?.gender || "—"}</td><td style={S.label}>Room</td><td style={S.cell}>{patient?.room || "—"}</td></tr>
        <tr><td style={S.label}>Guardian</td><td style={S.cell}>{patient?.guardian || "—"}</td><td style={S.label}>Phone</td><td style={S.cell}>{patient?.phone || "—"}</td></tr>
        <tr style={S.rowAlt}><td style={S.label}>Admit Date</td><td style={S.cell}>{patient?.admitDate || "—"}</td><td style={S.label}>Discharge Date</td><td style={S.cell}>{dischargeInfo.dischargeDate || "—"}</td></tr>
        <tr><td style={S.label}>Duration</td><td style={S.cell}>{stayDays()}</td><td style={S.label}>Condition</td><td style={S.cell}>{patient?.condition || "—"}</td></tr>
      </tbody></table>

      <SectionTitle>Daily Vitals Log</SectionTitle>
      {notes.length > 0 ? (
        <DataTable
          headers={["Date", "Shift", "Temp", "BP", "Pulse", "SpO₂", "Glucose", "Weight", "Observations", "By"]}
          rows={notes.map(n => [n.date || "—", n.shift || "—", n.temp || "—", n.bp || "—", n.pulse || "—", n.spo2 || "—", n.glucose || "—", n.weight || "—", <span key={n.date} style={{ fontSize: 9 }}>{n.observations || "—"}</span>, n.recordedBy || "Nurse"])}
        />
      ) : <div style={{ padding: 10, color: P.muted, fontStyle: "italic", fontSize: 10 }}>No vitals recorded during stay.</div>}

      {/* Vitals summary */}
      {notes.length >= 2 && (() => {
        const rows = ["temp", "bp", "pulse", "spo2", "glucose", "weight"].map((key, ki) => {
          const labels = ["Temperature", "Blood Pressure", "Pulse", "SpO₂", "Glucose", "Weight"];
          const vals = notes.map(n => parseFloat(n[key])).filter(v => !isNaN(v));
          if (!vals.length) return null;
          return [labels[ki], vals.length, Math.min(...vals), Math.max(...vals), (vals.reduce((a, b) => a + b) / vals.length).toFixed(1), notes[0]?.[key] || "—"];
        }).filter(Boolean);
        if (!rows.length) return null;
        return (<><SectionTitle>Vitals Summary</SectionTitle><DataTable headers={["Vital", "Readings", "Min", "Max", "Average", "Latest"]} rows={rows} /></>);
      })()}

      <SectionTitle>Medications During Stay</SectionTitle>
      {allMeds.length > 0 || medications.length > 0 ? (
        <DataTable
          headers={["Date", "Shift / Schedule", "Medications"]}
          rows={[
            ...allMeds.map(m => [m.date, m.shift, m.meds]),
            ...medications.map(m => [m.date || m.startDate || "—", m.time || m.schedule || "Scheduled", `${m.medication || m.medicine || "—"} ${m.dosage ? `(${m.dosage})` : ""}`]),
          ]}
        />
      ) : <div style={{ padding: 10, color: P.muted, fontStyle: "italic", fontSize: 10 }}>No medication records.</div>}

      {notes.some(n => n.nursing) && (<><SectionTitle>Nursing Notes</SectionTitle><DataTable headers={["Date", "Shift", "Notes"]} rows={notes.filter(n => n.nursing).map(n => [n.date, n.shift, n.nursing])} /></>)}
      {notes.some(n => n.diet) && (<><SectionTitle>Diet Log</SectionTitle><DataTable headers={["Date", "Shift", "Diet / Intake"]} rows={notes.filter(n => n.diet).map(n => [n.date, n.shift, n.diet])} /></>)}

      <SectionTitle>Discharge Summary</SectionTitle>
      <table style={S.table}><tbody>
        <tr><td style={S.label}>Discharge Date</td><td style={S.cell}>{dischargeInfo.dischargeDate || "—"}</td></tr>
        <tr style={S.rowAlt}><td style={S.label}>Reason</td><td style={S.cell}>{dischargeInfo.dischargeReason || "—"}</td></tr>
        <tr><td style={{ ...S.label, verticalAlign: "top" }}>Instructions</td><td style={{ ...S.cell, whiteSpace: "pre-wrap" }}>{dischargeInfo.dischargeSummary || "—"}</td></tr>
      </tbody></table>

      <SignatureBlock signatures={[
        { label: "Attending Physician" },
        { label: "Nursing In-Charge" },
        { label: "Patient / Guardian" },
      ]} />
      <HospitalFooter />
    </PrintPage>
  );
}
