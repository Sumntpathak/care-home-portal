import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getPatients, getHomeCareNotes, getCarePlan, getPrescriptions, getAppointments } from "../api/sheets";
import { formatDateShort } from "../utils/dateUtils";
import {
  ArrowLeft, User, Phone, MapPin, Heart, Calendar,
  Activity, FileText, Pill, ClipboardList, AlertTriangle, ChevronRight, FolderOpen
} from "lucide-react";

export default function PatientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState("overview");
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [careNotes, setCareNotes] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [carePlan, setCarePlan] = useState(null);

  useEffect(() => {
    getPatients()
      .then(r => {
        const list = Array.isArray(r) ? r : r.data || [];
        const found = list.find(p => p.id === id || String(list.indexOf(p)) === id);
        setPatient(found || null);

        if (found) {
          // Load related data
          Promise.all([
            getHomeCareNotes(found.id).then(r => setCareNotes(r?.data || [])).catch(() => {}),
            getCarePlan(found.id).then(r => setCarePlan(r?.data || null)).catch(() => {}),
            getPrescriptions("all").then(r => {
              const all = r?.data || [];
              setPrescriptions(all.filter(rx => rx.patientId === found.id || rx.patientName?.toLowerCase() === found.name?.toLowerCase()));
            }).catch(() => {}),
            getAppointments("all").then(r => {
              const all = r?.data || [];
              setAppointments(all.filter(a => a.patientId === found.id || a.patientName?.toLowerCase() === found.name?.toLowerCase()));
            }).catch(() => {}),
          ]);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="loading-box"><span className="spinner" /><span>Loading patient record...</span></div>;
  if (!patient) return (
    <div className="card" style={{ textAlign: "center", padding: "40px" }}>
      <p style={{ color: "var(--text-muted)", marginBottom: "12px" }}>Patient not found.</p>
      <button className="btn btn-outline btn-sm" onClick={() => navigate("/patients")}>Back to Patients</button>
    </div>
  );

  const initials = (name = "") => name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="fade-in">
      {/* Print header */}
      <div className="print-only" style={{ textAlign: "center", borderBottom: "2px solid #1a3558", paddingBottom: "10px", marginBottom: "14px" }}>
        <div style={{ fontSize: "18px", fontWeight: 800, color: "#1a3558" }}>Shanti Care Home</div>
        <div style={{ fontSize: "11px", color: "#64748b" }}>Patient Record · {new Date().toLocaleDateString("en-IN")}</div>
      </div>

      <div className="page-header no-print">
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button className="btn-icon" onClick={() => navigate("/patients")}><ArrowLeft size={16} /></button>
          <div>
            <h2>{patient.name}</h2>
            <p>ID: {patient.id} · {patient.age} yrs · {patient.gender}</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button className="btn btn-outline btn-sm" onClick={() => navigate("/medical-file")}>
            <FolderOpen size={14} /> Medical File
          </button>
        </div>
      </div>

      {/* Patient Header */}
      <div className="medical-file" style={{ marginBottom: "20px" }}>
        <div className="medical-file-header">
          <div className="medical-file-avatar">{initials(patient.name)}</div>
          <div className="medical-file-info">
            <h2>{patient.name}</h2>
            <p>{patient.age ? `${patient.age} years` : ""} {patient.gender ? `· ${patient.gender}` : ""} {patient.bloodGroup ? `· ${patient.bloodGroup}` : ""}</p>
            <div className="medical-file-badges">
              <span className="medical-file-badge">{patient.status || "Active"}</span>
              {patient.room && <span className="medical-file-badge">Room {patient.room}</span>}
              {patient.condition && <span className="medical-file-badge">{patient.condition}</span>}
            </div>
          </div>
        </div>
        <div className="medical-file-body">
          <div className="detail-grid">
            {[
              ["Phone", patient.phone],
              ["Room", patient.room],
              ["Guardian", patient.guardian],
              ["Admitted", patient.admitDate ? formatDateShort(patient.admitDate) : "—"],
              ["Emergency", patient.emergencyContact],
              ["Blood Group", patient.bloodGroup],
            ].filter(([, v]) => v).map(([k, v]) => (
              <div key={k} className="detail-item">
                <div className="d-label">{k}</div>
                <div className="d-value">{v || "—"}</div>
              </div>
            ))}
            {patient.allergies && patient.allergies !== "None" && (
              <div className="detail-item" style={{ gridColumn: "1 / -1", borderColor: "rgba(212,104,90,.2)", background: "var(--danger-light)" }}>
                <div className="d-label" style={{ color: "var(--danger)" }}>
                  <AlertTriangle size={12} style={{ display: "inline", marginRight: "4px" }} />Allergies
                </div>
                <div className="d-value" style={{ color: "var(--danger)" }}>{patient.allergies}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="stat-grid" style={{ marginBottom: "16px" }}>
        <div className="stat-card" onClick={() => setTab("visits")} style={{ padding: "14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <Calendar size={16} color="var(--info)" />
            <span className="label" style={{ marginBottom: 0 }}>OPD Visits</span>
          </div>
          <div className="val" style={{ fontSize: "22px" }}>{appointments.length}</div>
        </div>
        <div className="stat-card" onClick={() => setTab("prescriptions")} style={{ padding: "14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <FileText size={16} color="var(--purple)" />
            <span className="label" style={{ marginBottom: 0 }}>Prescriptions</span>
          </div>
          <div className="val" style={{ fontSize: "22px" }}>{prescriptions.length}</div>
        </div>
        <div className="stat-card" onClick={() => setTab("care-notes")} style={{ padding: "14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <Activity size={16} color="var(--accent)" />
            <span className="label" style={{ marginBottom: 0 }}>Care Notes</span>
          </div>
          <div className="val" style={{ fontSize: "22px" }}>{careNotes.length}</div>
        </div>
      </div>

      <div className="tab-bar no-print">
        {["overview", "visits", "prescriptions", "care-notes"].map(t => (
          <button key={t} className={`tab-btn ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>
            {t.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="fade-in">
          {/* Care Plan Summary */}
          {carePlan && (
            <div className="card" style={{ borderLeft: "3px solid var(--primary)" }}>
              <div className="card-header">
                <h3>Active Care Plan</h3>
                <span className="badge badge-blue">Review: {formatDateShort(carePlan.reviewDate)}</span>
              </div>
              <p style={{ fontSize: "14px", fontWeight: 600, marginBottom: "10px" }}>{carePlan.diagnosis}</p>
              {carePlan.goals?.map((g, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                  <span className={`badge ${g.status === "Achieved" ? "badge-green" : g.status === "In Progress" ? "badge-blue" : "badge-yellow"}`}>
                    {g.status}
                  </span>
                  <span style={{ fontSize: "13px" }}>{g.goal}</span>
                </div>
              ))}
              {carePlan.specialInstructions && (
                <div className="alert-bar alert-warn" style={{ marginTop: "12px" }}>
                  <AlertTriangle size={14} /> {carePlan.specialInstructions}
                </div>
              )}
            </div>
          )}

          {/* Latest care note */}
          {careNotes.length > 0 && (
            <div className="card" style={{ borderLeft: "3px solid var(--accent)" }}>
              <div className="card-header">
                <h3>Latest Care Note</h3>
                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{formatDateShort(careNotes[0].date)} — {careNotes[0].shift}</span>
              </div>
              <div className="vitals-grid" style={{ marginBottom: "12px" }}>
                {[
                  { label: "Temp", value: careNotes[0].temp || careNotes[0].temperature },
                  { label: "BP", value: careNotes[0].bp },
                  { label: "Pulse", value: careNotes[0].pulse },
                  { label: "SpO2", value: careNotes[0].spo2 },
                  { label: "Glucose", value: careNotes[0].glucose },
                ].filter(v => v.value && v.value !== "—").map((v, j) => (
                  <div key={j} className="vital-card">
                    <div className="vital-value">{v.value}</div>
                    <div className="vital-label">{v.label}</div>
                  </div>
                ))}
              </div>
              {careNotes[0].observations && <p style={{ fontSize: "13px" }}><strong>Observations:</strong> {careNotes[0].observations}</p>}
            </div>
          )}

          {!carePlan && careNotes.length === 0 && (
            <div className="card"><div className="empty-state">No detailed records yet. Navigate tabs for more information.</div></div>
          )}
        </div>
      )}

      {tab === "visits" && (
        <div className="card fade-in">
          <div className="card-header"><h3>OPD Visit History</h3></div>
          {appointments.length > 0 ? (
            <div className="table-wrap">
              <table className="data-table resp-cards">
                <thead><tr><th>Date</th><th>Receipt</th><th>Doctor</th><th>Type</th><th>Status</th></tr></thead>
                <tbody>
                  {appointments.map((a, i) => (
                    <tr key={i}>
                      <td data-label="Date">{formatDateShort(a.date)}</td>
                      <td data-label="Receipt" style={{ fontFamily: "monospace", fontSize: "12px" }}>{a.receiptNo}</td>
                      <td data-label="Doctor">{a.doctor}</td>
                      <td data-label="Type">{a.type}</td>
                      <td data-label="Status"><span className={`badge ${a.status === "Completed" || a.status === "Dispensed" ? "badge-green" : "badge-blue"}`}>{a.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <div className="empty-state">No OPD visits recorded.</div>}
        </div>
      )}

      {tab === "prescriptions" && (
        <div className="fade-in">
          {prescriptions.length > 0 ? prescriptions.map((rx, i) => {
            let meds = [];
            try { meds = JSON.parse(rx.medications || "[]"); } catch {}
            return (
              <div key={i} className="card" style={{ borderLeft: "3px solid var(--purple)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: 700 }}>{rx.diagnosis || "Prescription"}</div>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                      {formatDateShort(rx.date)} · {rx.doctor || rx.doctorName} · {rx.receiptNo}
                    </div>
                  </div>
                  <span className={`badge ${rx.status === "Dispensed" ? "badge-green" : "badge-purple"}`}>{rx.status}</span>
                </div>
                {meds.length > 0 && (
                  <div className="table-wrap">
                    <table className="data-table">
                      <thead><tr><th>Medicine</th><th>Dose</th><th>When</th><th>Frequency</th><th>Duration</th></tr></thead>
                      <tbody>
                        {meds.map((m, j) => (
                          <tr key={j}>
                            <td className="cell-name">{m.name}</td>
                            <td>{m.dose || "—"}</td>
                            <td>{m.timing || "—"}</td>
                            <td>{m.frequency || "—"}</td>
                            <td>{m.duration || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          }) : <div className="card"><div className="empty-state">No prescriptions found.</div></div>}
        </div>
      )}

      {tab === "care-notes" && (
        <div className="fade-in">
          {careNotes.length > 0 ? careNotes.map((n, i) => (
            <div key={i} className="card" style={{ borderLeft: "3px solid var(--accent)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", flexWrap: "wrap", gap: "6px" }}>
                <div style={{ fontWeight: 700, color: "var(--text)" }}>{formatDateShort(n.date)} — {n.shift} Shift</div>
                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>by {n.caregiver || n.by || "Staff"}</span>
              </div>
              <div className="vitals-grid" style={{ marginBottom: "12px" }}>
                {[
                  { label: "Temp", value: n.temperature || n.temp },
                  { label: "BP", value: n.bp },
                  { label: "Pulse", value: n.pulse },
                  { label: "SpO2", value: n.spo2 },
                  { label: "Glucose", value: n.glucose },
                  { label: "Weight", value: n.weight },
                ].filter(v => v.value && v.value !== "—").map((v, j) => (
                  <div key={j} className="vital-card">
                    <div className="vital-value">{v.value}</div>
                    <div className="vital-label">{v.label}</div>
                  </div>
                ))}
              </div>
              {n.observations && <p style={{ fontSize: "13px", marginBottom: "4px" }}><strong>Observations:</strong> {n.observations}</p>}
              {n.diet && <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "4px" }}><strong>Diet:</strong> {n.diet}</p>}
              {n.moodBehaviour && <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}><strong>Mood:</strong> {n.moodBehaviour}</p>}
            </div>
          )) : <div className="card"><div className="empty-state">No care notes recorded.</div></div>}
        </div>
      )}
    </div>
  );
}
