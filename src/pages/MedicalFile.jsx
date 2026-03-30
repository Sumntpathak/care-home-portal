import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { getPatients, getAppointments, getPrescriptions, getHomeCareNotes, getCarePlan } from "../api/sheets";
import { formatDateShort } from "../utils/dateUtils";
import {
  Search, FileText, Download, User, Calendar, Pill, Activity,
  Heart, Stethoscope, ClipboardList, ChevronRight, ChevronDown, Eye,
  FolderOpen, AlertTriangle, Phone, MapPin, Shield, Clock
} from "lucide-react";

export default function MedicalFile() {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [fileData, setFileData] = useState(null);
  const [fileLoading, setFileLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    getPatients()
      .then(r => setPatients(Array.isArray(r) ? r : r.data || []))
      .catch(() => setPatients([]))
      .finally(() => setLoading(false));
  }, []);

  const loadMedicalFile = async (patient) => {
    setSelectedPatient(patient);
    setFileLoading(true);
    setActiveTab("overview");

    try {
      const [apptRes, rxRes, notesRes, cpRes] = await Promise.all([
        getAppointments("all"),
        getPrescriptions("all"),
        getHomeCareNotes(patient.id),
        getCarePlan(patient.id),
      ]);

      const appointments = (apptRes?.data || []).filter(a =>
        a.patientId === patient.id || a.patientName?.toLowerCase() === patient.name?.toLowerCase()
      );

      const prescriptions = (rxRes?.data || []).filter(r =>
        r.patientId === patient.id || r.patientName?.toLowerCase() === patient.name?.toLowerCase()
      );

      const careNotes = notesRes?.data || [];
      const carePlan = cpRes?.data || null;

      setFileData({ appointments, prescriptions, careNotes, carePlan });
    } catch {
      setFileData({ appointments: [], prescriptions: [], careNotes: [], carePlan: null });
    } finally {
      setFileLoading(false);
    }
  };

  const filtered = patients.filter(p => {
    const q = search.toLowerCase();
    return p.name?.toLowerCase().includes(q) || p.id?.toLowerCase().includes(q) || p.room?.toLowerCase().includes(q) || p.phone?.includes(q);
  });

  const initials = (name = "") => name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  // File view for selected patient
  if (selectedPatient) {
    const p = selectedPatient;
    const tabs = ["overview", "visits", "prescriptions", "vitals", "care-plan"];

    return (
      <div className="fade-in">
        {/* Print Header */}
        <div className="print-only" style={{ textAlign: "center", borderBottom: "2px solid #1a3558", paddingBottom: "10px", marginBottom: "14px" }}>
          <div style={{ fontSize: "18px", fontWeight: 800, color: "#1a3558" }}>Shanti Care Home</div>
          <div style={{ fontSize: "11px", color: "#64748b" }}>Digital Medical Record · Generated {new Date().toLocaleDateString("en-IN")}</div>
        </div>

        <div className="page-header no-print">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button className="btn-icon" onClick={() => { setSelectedPatient(null); setFileData(null); }}>
              <ChevronRight size={16} style={{ transform: "rotate(180deg)" }} />
            </button>
            <div>
              <h2 style={{ gap: "8px" }}>
                <FolderOpen size={20} /> Digital Medical File
              </h2>
              <p>{p.name} — ID: {p.id}</p>
            </div>
          </div>
        </div>

        {/* Patient Header Card */}
        <div className="medical-file" style={{ marginBottom: "20px" }}>
          <div className="medical-file-header">
            <div className="medical-file-avatar">{initials(p.name)}</div>
            <div className="medical-file-info">
              <h2>{p.name}</h2>
              <p>{p.age ? `${p.age} years` : ""} {p.gender ? `· ${p.gender}` : ""} {p.bloodGroup ? `· ${p.bloodGroup}` : ""}</p>
              <div className="medical-file-badges">
                <span className="medical-file-badge">ID: {p.id}</span>
                {p.room && <span className="medical-file-badge">Room {p.room}</span>}
                <span className="medical-file-badge">{p.status || "Active"}</span>
              </div>
            </div>
          </div>
          <div className="medical-file-body">
            <div className="detail-grid">
              <div className="detail-item">
                <div className="d-label"><Phone size={12} style={{ display: "inline", marginRight: "4px" }} />Phone</div>
                <div className="d-value">{p.phone || "—"}</div>
              </div>
              <div className="detail-item">
                <div className="d-label"><Heart size={12} style={{ display: "inline", marginRight: "4px" }} />Condition</div>
                <div className="d-value">{p.condition || "—"}</div>
              </div>
              <div className="detail-item">
                <div className="d-label"><User size={12} style={{ display: "inline", marginRight: "4px" }} />Guardian</div>
                <div className="d-value">{p.guardian || "—"}</div>
              </div>
              <div className="detail-item">
                <div className="d-label"><Calendar size={12} style={{ display: "inline", marginRight: "4px" }} />Admitted</div>
                <div className="d-value">{p.admitDate ? formatDateShort(p.admitDate) : "—"}</div>
              </div>
              {p.allergies && (
                <div className="detail-item" style={{ gridColumn: "1 / -1", borderColor: "rgba(212,104,90,.2)", background: "var(--danger-light)" }}>
                  <div className="d-label" style={{ color: "var(--danger)" }}>
                    <AlertTriangle size={12} style={{ display: "inline", marginRight: "4px" }} />Allergies
                  </div>
                  <div className="d-value" style={{ color: "var(--danger)" }}>{p.allergies}</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="tab-bar no-print">
          {tabs.map(t => (
            <button key={t} className={`tab-btn ${activeTab === t ? "active" : ""}`}
              onClick={() => setActiveTab(t)}>
              {t === "overview" && <><Activity size={14} /> Overview</>}
              {t === "visits" && <><Calendar size={14} /> OPD Visits</>}
              {t === "prescriptions" && <><Pill size={14} /> Prescriptions</>}
              {t === "vitals" && <><Heart size={14} /> Vitals & Notes</>}
              {t === "care-plan" && <><ClipboardList size={14} /> Care Plan</>}
            </button>
          ))}
        </div>

        {fileLoading ? (
          <div className="loading-box"><span className="spinner" /><span>Loading medical records...</span></div>
        ) : (
          <>
            {/* OVERVIEW TAB */}
            {activeTab === "overview" && (
              <div className="fade-in">
                {/* Summary Cards */}
                <div className="stat-grid" style={{ marginBottom: "20px" }}>
                  <div className="stat-card" onClick={() => setActiveTab("visits")}>
                    <div className="stat-icon" style={{ background: "var(--info-light)" }}>
                      <Calendar size={18} color="var(--info)" />
                    </div>
                    <div className="label">Total OPD Visits</div>
                    <div className="val">{fileData?.appointments?.length ?? 0}</div>
                  </div>
                  <div className="stat-card" onClick={() => setActiveTab("prescriptions")}>
                    <div className="stat-icon" style={{ background: "var(--purple-light)" }}>
                      <FileText size={18} color="var(--purple)" />
                    </div>
                    <div className="label">Prescriptions</div>
                    <div className="val">{fileData?.prescriptions?.length ?? 0}</div>
                  </div>
                  <div className="stat-card" onClick={() => setActiveTab("vitals")}>
                    <div className="stat-icon" style={{ background: "var(--accent-light)" }}>
                      <Activity size={18} color="var(--accent)" />
                    </div>
                    <div className="label">Care Notes</div>
                    <div className="val">{fileData?.careNotes?.length ?? 0}</div>
                  </div>
                </div>

                {/* Medical Timeline */}
                <div className="card">
                  <div className="card-header">
                    <h3>Medical Timeline</h3>
                  </div>
                  <div className="medical-timeline">
                    {/* Combine and sort all events */}
                    {[
                      ...(fileData?.appointments || []).map(a => ({
                        type: "visit", date: a.date, title: `OPD Visit — ${a.type || "General"}`,
                        desc: `Doctor: ${a.doctor} · Receipt: ${a.receiptNo} · Status: ${a.status}`,
                        color: "var(--info)"
                      })),
                      ...(fileData?.prescriptions || []).map(r => {
                        let meds = [];
                        try { meds = JSON.parse(r.medications || "[]"); } catch {}
                        return {
                          type: "prescription", date: r.date,
                          title: `Prescription — ${r.diagnosis || ""}`,
                          desc: `By ${r.doctor || r.doctorName} · ${meds.length > 0 ? meds.map(m => m.name).join(", ") : ""}`,
                          color: "var(--purple)"
                        };
                      }),
                      ...(fileData?.careNotes || []).map(n => ({
                        type: "care", date: n.date,
                        title: `Care Note — ${n.shift || ""} Shift`,
                        desc: n.observations || n.nursingNotes || "Routine care recorded",
                        color: "var(--accent)"
                      })),
                    ]
                      .sort((a, b) => new Date(b.date) - new Date(a.date))
                      .slice(0, 15)
                      .map((event, i) => (
                        <div key={i} className="timeline-item">
                          <div className="timeline-date">
                            <span style={{ color: event.color, fontWeight: 700 }}>
                              {event.type === "visit" ? "OPD" : event.type === "prescription" ? "Rx" : "Care"}
                            </span>
                            {" · "}{formatDateShort(event.date)}
                          </div>
                          <div className="timeline-title">{event.title}</div>
                          <div className="timeline-desc">{event.desc}</div>
                        </div>
                      ))
                    }
                    {(!fileData?.appointments?.length && !fileData?.prescriptions?.length && !fileData?.careNotes?.length) && (
                      <div className="empty-state">No medical records found for this patient.</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* VISITS TAB */}
            {activeTab === "visits" && (
              <div className="card fade-in">
                <div className="card-header">
                  <h3>OPD Visit History</h3>
                  <span className="badge badge-blue">{fileData?.appointments?.length || 0} visits</span>
                </div>
                {fileData?.appointments?.length > 0 ? (
                  <div className="table-wrap">
                    <table className="data-table resp-cards">
                      <thead>
                        <tr>
                          <th>Date</th><th>Receipt</th><th>Doctor</th><th>Type</th><th>Fee</th><th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {fileData.appointments.map((a, i) => (
                          <tr key={i}>
                            <td data-label="Date">{formatDateShort(a.date)}</td>
                            <td data-label="Receipt" style={{ fontFamily: "monospace", fontSize: "12px" }}>{a.receiptNo}</td>
                            <td data-label="Doctor" className="cell-name">{a.doctor}</td>
                            <td data-label="Type">{a.type}</td>
                            <td data-label="Fee" style={{ fontWeight: 600 }}>₹{a.bill || a.billAmount || 0}</td>
                            <td data-label="Status">
                              <span className={`badge ${
                                a.status === "Completed" || a.status === "Dispensed" ? "badge-green" :
                                a.status === "With Doctor" ? "badge-yellow" :
                                a.status === "To Dispensary" ? "badge-purple" : "badge-blue"
                              }`}>{a.status}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="empty-state">No OPD visits recorded.</div>
                )}
              </div>
            )}

            {/* PRESCRIPTIONS TAB */}
            {activeTab === "prescriptions" && (
              <div className="fade-in">
                {fileData?.prescriptions?.length > 0 ? (
                  fileData.prescriptions.map((rx, i) => {
                    let meds = [];
                    try { meds = JSON.parse(rx.medications || "[]"); } catch {}
                    return (
                      <div key={i} className="card" style={{ borderLeft: "3px solid var(--purple)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
                          <div>
                            <div style={{ fontSize: "15px", fontWeight: 700, color: "var(--text)" }}>
                              {rx.diagnosis || "Prescription"}
                            </div>
                            <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                              {formatDateShort(rx.date)} · {rx.doctor || rx.doctorName} · {rx.receiptNo}
                            </div>
                          </div>
                          <span className={`badge ${rx.status === "Dispensed" ? "badge-green" : "badge-purple"}`}>
                            {rx.status}
                          </span>
                        </div>

                        {meds.length > 0 && (
                          <div className="table-wrap" style={{ marginBottom: "8px" }}>
                            <table className="data-table">
                              <thead>
                                <tr><th>Medicine</th><th>Dose</th><th>When</th><th>Frequency</th><th>Duration</th><th>Qty</th></tr>
                              </thead>
                              <tbody>
                                {meds.map((m, j) => (
                                  <tr key={j}>
                                    <td className="cell-name">{m.name}</td>
                                    <td>{m.dose || "—"}</td>
                                    <td>{m.timing || "—"}</td>
                                    <td>{m.frequency || "—"}</td>
                                    <td>{m.duration || "—"}</td>
                                    <td>{m.qty || "—"}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                        {rx.notes && (
                          <div style={{ fontSize: "13px", color: "var(--text-secondary)", padding: "8px 0" }}>
                            <strong>Notes:</strong> {rx.notes}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="card"><div className="empty-state">No prescriptions found.</div></div>
                )}
              </div>
            )}

            {/* VITALS & NOTES TAB */}
            {activeTab === "vitals" && (
              <div className="fade-in">
                {fileData?.careNotes?.length > 0 ? (
                  fileData.careNotes.map((n, i) => (
                    <div key={i} className="card" style={{ borderLeft: "3px solid var(--accent)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", flexWrap: "wrap", gap: "6px" }}>
                        <div style={{ fontWeight: 700, color: "var(--text)" }}>
                          {formatDateShort(n.date)} — {n.shift} Shift
                        </div>
                        <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>by {n.caregiver || n.by || "Staff"}</span>
                      </div>

                      {/* Vitals Grid */}
                      <div className="vitals-grid" style={{ marginBottom: "14px" }}>
                        {[
                          { label: "Temp", value: n.temperature || n.temp, status: "good" },
                          { label: "BP", value: n.bp, status: "good" },
                          { label: "Pulse", value: n.pulse, status: "good" },
                          { label: "SpO2", value: n.spo2, status: "good" },
                          { label: "Glucose", value: n.glucose, status: n.glucose && parseInt(n.glucose) > 160 ? "warn" : "good" },
                          { label: "Weight", value: n.weight, status: "good" },
                        ].filter(v => v.value).map((v, j) => (
                          <div key={j} className="vital-card">
                            <div className="vital-value">{v.value}</div>
                            <div className="vital-label">{v.label}</div>
                            <div className={`vital-status ${v.status}`} />
                          </div>
                        ))}
                      </div>

                      {n.observations && (
                        <div style={{ fontSize: "13px", marginBottom: "6px" }}>
                          <strong>Observations:</strong> {n.observations}
                        </div>
                      )}
                      {n.nursingNotes && (
                        <div style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                          <strong>Notes:</strong> {n.nursingNotes}
                        </div>
                      )}
                      {n.diet && (
                        <div style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "4px" }}>
                          <strong>Diet:</strong> {n.diet}
                        </div>
                      )}
                      {n.mood && (
                        <div style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "4px" }}>
                          <strong>Mood:</strong> {n.mood}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="card"><div className="empty-state">No vitals or care notes recorded.</div></div>
                )}
              </div>
            )}

            {/* CARE PLAN TAB */}
            {activeTab === "care-plan" && (
              <div className="fade-in">
                {fileData?.carePlan ? (
                  <div className="card">
                    <div className="card-header">
                      <h3>Individualized Care Plan</h3>
                      <span className="badge badge-blue">
                        Review: {formatDateShort(fileData.carePlan.reviewDate)}
                      </span>
                    </div>

                    <div style={{ marginBottom: "16px" }}>
                      <div className="section-title">Diagnosis</div>
                      <p style={{ fontSize: "14px", fontWeight: 600 }}>{fileData.carePlan.diagnosis}</p>
                    </div>

                    {fileData.carePlan.goals?.length > 0 && (
                      <div style={{ marginBottom: "16px" }}>
                        <div className="section-title">Care Goals</div>
                        {fileData.carePlan.goals.map((g, i) => (
                          <div key={i} style={{
                            display: "flex", alignItems: "center", gap: "10px",
                            padding: "10px 14px", background: "var(--subtle)", borderRadius: "var(--radius-sm)",
                            marginBottom: "6px", border: "1px solid var(--border-light)"
                          }}>
                            <span className={`badge ${
                              g.status === "Achieved" ? "badge-green" :
                              g.status === "In Progress" ? "badge-blue" : "badge-yellow"
                            }`}>{g.status}</span>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: "13px" }}>{g.goal}</div>
                              {g.target && <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Target: {g.target}</div>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {fileData.carePlan.medications?.length > 0 && (
                      <div style={{ marginBottom: "16px" }}>
                        <div className="section-title">Medications</div>
                        <div className="table-wrap">
                          <table className="data-table">
                            <thead><tr><th>Medicine</th><th>Dose</th><th>Timing</th><th>Notes</th></tr></thead>
                            <tbody>
                              {fileData.carePlan.medications.map((m, i) => (
                                <tr key={i}>
                                  <td className="cell-name">{m.name}</td>
                                  <td>{m.dose}</td>
                                  <td>{m.timing}</td>
                                  <td style={{ color: "var(--text-muted)" }}>{m.notes || "—"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {fileData.carePlan.activities && (
                      <div style={{ marginBottom: "16px" }}>
                        <div className="section-title">Activities & Exercises</div>
                        <p style={{ fontSize: "13px" }}>{fileData.carePlan.activities}</p>
                      </div>
                    )}

                    {fileData.carePlan.dietary && (
                      <div style={{ marginBottom: "16px" }}>
                        <div className="section-title">Dietary Specifications</div>
                        <p style={{ fontSize: "13px" }}>{fileData.carePlan.dietary}</p>
                      </div>
                    )}

                    {fileData.carePlan.specialInstructions && (
                      <div>
                        <div className="section-title">Special Instructions</div>
                        <div className="alert-bar alert-warn">{fileData.carePlan.specialInstructions}</div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="card"><div className="empty-state">No care plan created for this patient yet.</div></div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  // Patient list view
  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h2><FolderOpen size={20} /> Digital Medical Files</h2>
          <p>Access complete medical records for any patient</p>
        </div>
      </div>

      <div className="card">
        <div className="search-box">
          <Search size={15} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, ID, room, or phone..."
          />
        </div>

        {loading ? (
          <div className="loading-box"><span className="spinner" /><span>Loading patients...</span></div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "12px" }}>
            {filtered.map((p, i) => (
              <div key={i} onClick={() => loadMedicalFile(p)} className="card" style={{
                cursor: "pointer", marginBottom: 0, padding: "16px",
                border: "1px solid var(--border)", transition: "all var(--transition)"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{
                    width: "44px", height: "44px", borderRadius: "12px",
                    background: "linear-gradient(135deg, var(--primary), var(--accent))",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "15px", fontWeight: 700, color: "#fff", flexShrink: 0
                  }}>
                    {initials(p.name)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: "14px", color: "var(--text)" }}>{p.name}</div>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                      {p.age ? `${p.age}y` : ""} {p.gender ? `· ${p.gender}` : ""} {p.room ? `· Room ${p.room}` : ""}
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                      {p.condition || ""}
                    </div>
                  </div>
                  <ChevronRight size={18} color="var(--text-light)" />
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div style={{ gridColumn: "1 / -1" }} className="empty-state">No patients found matching your search.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
