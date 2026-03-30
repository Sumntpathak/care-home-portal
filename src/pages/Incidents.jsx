import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { getIncidents, addIncident, updateIncident, getHomeCarePatients } from "../api/sheets";
import { AlertTriangle, Plus, X, Search, Shield, Clock } from "lucide-react";
import { usePagination } from "../components/Pagination";
import { useToast } from "../components/Toast";


const TYPES = ["Fall", "Medical Emergency", "Medication Error", "Behavioral", "Elopement Attempt", "Skin Integrity", "Infection", "Equipment Failure", "Other"];
const SEVERITIES = ["Low", "Moderate", "High", "Critical"];
const SEV_COLOR = { Low: "var(--success)", Moderate: "var(--warning)", High: "var(--danger)", Critical: "var(--danger)" };

export default function Incidents() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [incidents, setIncidents] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [detail, setDetail] = useState(null);
  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false }),
    type: "Fall", severity: "Moderate", patient: "", patientName: "",
    location: "", description: "", injuryDetails: "", actionTaken: "",
    reportedBy: user?.name || "", witnessedBy: "", doctorNotified: "",
    familyNotified: false, followUp: "",
  });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const load = () => {
    setLoading(true);
    Promise.all([getIncidents(), getHomeCarePatients()])
      .then(([inc, pts]) => {
        setIncidents(Array.isArray(inc) ? inc : inc.data || []);
        setPatients(Array.isArray(pts) ? pts : pts.data || []);
      })
      .catch(() => addToast("Failed to load incidents.", "error"))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.description) return;
    setSaving(true);
    try {
      await addIncident(form);
      setShowForm(false);
      load();
    } catch { addToast("Failed to submit incident report.", "error"); } finally { setSaving(false); }
  };

  const handleResolve = async (inc) => {
    await updateIncident({ ...inc, status: "Resolved" });
    load();
  };

  const filtered = incidents
    .filter(i => filter === "all" || i.status === filter || i.severity === filter || i.type === filter)
    .filter(i => {
      const q = search.toLowerCase();
      return !q || i.patientName?.toLowerCase().includes(q) || i.type?.toLowerCase().includes(q) || i.description?.toLowerCase().includes(q);
    });

  const { paginated, Pager } = usePagination(filtered, 25);

  const openCount = incidents.filter(i => i.status !== "Resolved").length;

  return (
    <div className="fade-in">
      {/* Detail Modal */}
      {detail && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", backdropFilter: "blur(2px)", zIndex: 1000, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "clamp(16px, 4vw, 40px)", paddingTop: "clamp(24px, 5vh, 60px)", overflowY: "auto" }}>
          <div style={{ background: "#fff", borderRadius: "10px", padding: "24px", maxWidth: "min(95vw, 650px)", width: "100%", maxHeight: "calc(100vh - 80px)", overflowY: "auto", boxShadow: "0 4px 24px rgba(0,0,0,.15)", animation: "modalIn .2s ease-out" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "16px" }}>
              <div>
                <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text)" }}>Incident Report — {detail.id}</h3>
                <p style={{ fontSize: "12px", color: "var(--text-light)" }}>{detail.date} at {detail.time}</p>
              </div>
              <div style={{ display: "flex", gap: "6px" }}>
                <button className="btn-icon" onClick={() => setDetail(null)}><X size={15} /></button>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "16px" }}>
              <div className="detail-item"><div className="d-label">Type</div><div className="d-value">{detail.type}</div></div>
              <div className="detail-item"><div className="d-label">Severity</div><div className="d-value" style={{ color: SEV_COLOR[detail.severity] }}>{detail.severity}</div></div>
              <div className="detail-item"><div className="d-label">Patient</div><div className="d-value">{detail.patientName || "—"}</div></div>
              <div className="detail-item"><div className="d-label">Location</div><div className="d-value">{detail.location || "—"}</div></div>
              <div className="detail-item"><div className="d-label">Reported By</div><div className="d-value">{detail.reportedBy}</div></div>
              <div className="detail-item"><div className="d-label">Witnessed By</div><div className="d-value">{detail.witnessedBy || "—"}</div></div>
              <div className="detail-item"><div className="d-label">Doctor Notified</div><div className="d-value">{detail.doctorNotified || "—"}</div></div>
              <div className="detail-item"><div className="d-label">Family Notified</div><div className="d-value">{detail.familyNotified ? "Yes" : "No"}</div></div>
            </div>

            <div style={{ marginBottom: "12px" }}>
              <div className="section-title">Description</div>
              <p style={{ fontSize: "13px", lineHeight: 1.6 }}>{detail.description}</p>
            </div>
            {detail.injuryDetails && <div style={{ marginBottom: "12px" }}><div className="section-title">Injury Details</div><p style={{ fontSize: "13px" }}>{detail.injuryDetails}</p></div>}
            {detail.actionTaken && <div style={{ marginBottom: "12px" }}><div className="section-title">Action Taken</div><p style={{ fontSize: "13px" }}>{detail.actionTaken}</p></div>}
            {detail.followUp && <div style={{ marginBottom: "12px" }}><div className="section-title">Follow-Up</div><p style={{ fontSize: "13px" }}>{detail.followUp}</p></div>}

            <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
              {detail.status !== "Resolved" && (
                <button className="btn btn-success btn-sm" onClick={() => { handleResolve(detail); setDetail(null); }}>Mark Resolved</button>
              )}
              <span className="badge" style={{ background: detail.status === "Resolved" ? "var(--success-light)" : "var(--warning-light)", color: detail.status === "Resolved" ? "var(--success)" : "var(--warning)", padding: "6px 12px" }}>
                {detail.status}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="page-header">
        <div>
          <h2>Incidents & Emergencies</h2>
          <p>Report, track, and resolve safety incidents</p>
        </div>
        <button className="btn btn-danger btn-sm" onClick={() => setShowForm(true)}><AlertTriangle size={13} /> Report Incident</button>
      </div>

      {openCount > 0 && (
        <div className="alert-bar alert-warn" style={{ marginBottom: "12px" }}>
          <AlertTriangle size={14} /> {openCount} open incident{openCount > 1 ? "s" : ""} requiring attention
        </div>
      )}

      {/* Report Form */}
      {showForm && (
        <div className="card" style={{ border: "2px solid var(--danger)", marginBottom: "16px" }}>
          <div className="card-header">
            <h3 style={{ color: "var(--danger)" }}><AlertTriangle size={15} style={{ marginRight: 4 }} /> New Incident Report</h3>
            <button className="btn-icon" onClick={() => setShowForm(false)}><X size={15} /></button>
          </div>
          <form onSubmit={handleSubmit} className="form-grid">
            <div className="form-row3">
              <div className="field"><label>Date</label><input type="date" value={form.date} onChange={e => set("date", e.target.value)} /></div>
              <div className="field"><label>Time</label><input type="time" value={form.time} onChange={e => set("time", e.target.value)} /></div>
              <div className="field"><label>Severity <span className="req">*</span></label>
                <select value={form.severity} onChange={e => set("severity", e.target.value)}>
                  {SEVERITIES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="field"><label>Incident Type <span className="req">*</span></label>
                <select value={form.type} onChange={e => set("type", e.target.value)}>
                  {TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="field"><label>Patient Involved</label>
                <select value={form.patient} onChange={e => {
                  const p = patients.find(p => p.id === e.target.value);
                  set("patient", e.target.value);
                  set("patientName", p?.name || "");
                }}>
                  <option value="">— Select Resident —</option>
                  {patients.map(p => <option key={p.id} value={p.id}>{p.name} ({p.room})</option>)}
                </select>
              </div>
            </div>
            <div className="field"><label>Location</label><input value={form.location} onChange={e => set("location", e.target.value)} placeholder="e.g., Corridor near Room 105" /></div>
            <div className="field"><label>Description <span className="req">*</span></label><textarea value={form.description} onChange={e => set("description", e.target.value)} rows={3} placeholder="What happened? Be specific..." /></div>
            <div className="field"><label>Injury Details</label><textarea value={form.injuryDetails} onChange={e => set("injuryDetails", e.target.value)} rows={2} placeholder="Describe any injuries..." /></div>
            <div className="field"><label>Action Taken</label><textarea value={form.actionTaken} onChange={e => set("actionTaken", e.target.value)} rows={2} placeholder="What was done immediately?" /></div>
            <div className="form-row">
              <div className="field"><label>Reported By</label><input value={form.reportedBy} onChange={e => set("reportedBy", e.target.value)} /></div>
              <div className="field"><label>Witnessed By</label><input value={form.witnessedBy} onChange={e => set("witnessedBy", e.target.value)} /></div>
            </div>
            <div className="form-row">
              <div className="field"><label>Doctor Notified</label><input value={form.doctorNotified} onChange={e => set("doctorNotified", e.target.value)} /></div>
              <div className="field" style={{ display: "flex", alignItems: "center", gap: 8, paddingTop: 20 }}>
                <input type="checkbox" checked={form.familyNotified} onChange={e => set("familyNotified", e.target.checked)} style={{ width: "auto" }} />
                <label style={{ margin: 0 }}>Family Notified</label>
              </div>
            </div>
            <div className="field"><label>Follow-Up Plan</label><textarea value={form.followUp} onChange={e => set("followUp", e.target.value)} rows={2} /></div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button className="btn btn-danger" type="submit" disabled={saving}>{saving ? "Saving..." : "Submit Report"}</button>
              <button className="btn btn-outline" type="button" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="card" style={{ marginBottom: "14px" }}>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
          <div className="search-box" style={{ marginBottom: 0, flex: 1, minWidth: "200px" }}>
            <Search size={14} />
            <input placeholder="Search incidents..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          {["all", "Open", "Monitoring", "Resolved"].map(f => (
            <button key={f} className={`btn btn-sm ${filter === f ? "btn-primary" : "btn-outline"}`} onClick={() => setFilter(f)}>
              {f === "all" ? "All" : f}
            </button>
          ))}
        </div>
      </div>

      {/* Incidents List */}
      <div className="card">
        {loading ? <div className="loading-box"><span className="spinner" /></div> : (
          filtered.length === 0 ? (
            <div className="empty-state"><Shield size={36} /><div>No incidents found</div></div>
          ) : (
            <div>
              {paginated.map(inc => (
                <div key={inc.id} onClick={() => setDetail(inc)}
                  style={{ border: "1px solid var(--border)", borderRadius: "8px", padding: "14px", marginBottom: "10px", cursor: "pointer", borderLeft: `4px solid ${SEV_COLOR[inc.severity] || "var(--text-light)"}`, transition: "all .15s" }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,.08)"}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "8px", flexWrap: "wrap", gap: "6px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <AlertTriangle size={14} color={SEV_COLOR[inc.severity]} />
                      <span style={{ fontWeight: 700, color: "var(--text)" }}>{inc.type}</span>
                      <span className="badge" style={{ background: `${SEV_COLOR[inc.severity]}18`, color: SEV_COLOR[inc.severity] }}>{inc.severity}</span>
                    </div>
                    <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                      <span className="badge" style={{ background: inc.status === "Resolved" ? "var(--success-light)" : inc.status === "Monitoring" ? "var(--warning-light)" : "var(--danger-light)", color: inc.status === "Resolved" ? "var(--success)" : inc.status === "Monitoring" ? "var(--warning)" : "var(--danger)" }}>{inc.status}</span>
                      <span style={{ fontSize: "11px", color: "var(--text-light)" }}>{inc.id}</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "16px", fontSize: "12px", color: "var(--text-muted)", marginBottom: "6px", flexWrap: "wrap" }}>
                    <span><Clock size={11} style={{ marginRight: 3 }} />{inc.date} {inc.time}</span>
                    {inc.patientName && <span>Patient: <strong>{inc.patientName}</strong></span>}
                    <span>Location: {inc.location || "—"}</span>
                  </div>
                  <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.5 }}>{inc.description?.substring(0, 150)}{inc.description?.length > 150 ? "..." : ""}</p>
                </div>
              ))}
              <Pager />
            </div>
          )
        )}
      </div>
    </div>
  );
}
