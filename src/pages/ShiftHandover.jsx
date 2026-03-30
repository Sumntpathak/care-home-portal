import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { getShiftHandovers, addShiftHandover, acknowledgeHandover, getHomeCarePatients, getHomeCareNotes, getMedSchedule, getIncidents } from "../api/sheets";
import { generateHandoverSummary } from "../utils/handoverEngine";
import { ArrowRightLeft, Plus, X, CheckCircle, AlertTriangle, Clock, Sparkles } from "lucide-react";
import { useToast } from "../components/Toast";


const SHIFTS = ["Morning", "Afternoon", "Evening", "Night"];

// ── Auto Handover Preview Modal ──
function AIHandoverModal({ report, onUse, onClose }) {
  if (!report) return null;

  const medSummary = report.medicationSummary || {};
  const total = (medSummary.given || 0) + (medSummary.pending || 0) + (medSummary.missed || 0);
  const compliancePercent = total > 0 ? Math.round(((medSummary.given || 0) / total) * 100) : 0;

  const priorityColor = (priority) => {
    if (priority === "high") return { bg: "#fee2e2", border: "#dc2626", text: "#dc2626" };
    if (priority === "medium") return { bg: "#fef3c7", border: "#d97706", text: "#92400e" };
    return { bg: "#dbeafe", border: "#3b82f6", text: "#1d4ed8" };
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", backdropFilter: "blur(2px)", zIndex: 1000, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "clamp(16px, 4vw, 40px)", paddingTop: "clamp(24px, 5vh, 60px)", overflowY: "auto" }}>
      <div style={{ background: "var(--card-bg, #fff)", borderRadius: "10px", maxWidth: "min(95vw, 720px)", width: "100%", boxShadow: "0 8px 40px rgba(0,0,0,.2)", maxHeight: "calc(100vh - 80px)", overflowY: "auto", animation: "modalIn .2s ease-out", color: "var(--text, #1a1a1a)" }}>
        <div style={{ padding: "24px 28px" }}>
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px", borderBottom: "2px solid var(--border, #e2e8f0)", paddingBottom: "14px" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                <Sparkles size={18} style={{ color: "#8b5cf6" }} />
                <span style={{ fontSize: "18px", fontWeight: "800", color: "var(--text)" }}>AI-Generated Handover</span>
              </div>
              <div style={{ fontSize: "12px", color: "var(--text-muted, #94a3b8)" }}>
                {report.shiftInfo?.fromShift} → {report.shiftInfo?.toShift} · {report.shiftInfo?.date} · {report.handoverTime}
              </div>
            </div>
            <button className="btn-icon" onClick={onClose}><X size={16} /></button>
          </div>

          {/* Summary */}
          <div style={{ background: "var(--hover-bg, #f8fafc)", padding: "14px 16px", borderRadius: "8px", marginBottom: "16px", borderLeft: "4px solid #8b5cf6" }}>
            <div style={{ fontSize: "12px", fontWeight: "700", color: "#8b5cf6", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Shift Summary</div>
            <p style={{ fontSize: "13px", lineHeight: 1.6, margin: 0, color: "var(--text-secondary, #475569)" }}>{report.summary}</p>
          </div>

          {/* Critical Alerts */}
          {report.criticalAlerts && report.criticalAlerts.length > 0 && (
            <div style={{ marginBottom: "16px" }}>
              <div style={{ fontSize: "13px", fontWeight: "700", color: "var(--danger, #dc2626)", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                <AlertTriangle size={14} /> Critical Alerts ({report.criticalAlerts.length})
              </div>
              {report.criticalAlerts.map((alert, i) => {
                const colors = priorityColor(alert.priority);
                return (
                  <div key={i} style={{ background: colors.bg, borderLeft: `4px solid ${colors.border}`, padding: "10px 14px", borderRadius: "6px", marginBottom: "6px", fontSize: "13px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: "8px" }}>
                      <div>
                        <strong style={{ color: colors.text }}>{alert.patient || "General"}</strong>
                        {alert.room && <span style={{ color: "#64748b", fontSize: "11px" }}> (Room {alert.room})</span>}
                        <div style={{ marginTop: "2px", color: "#374151" }}>{alert.alert}</div>
                      </div>
                      <span style={{ fontSize: "10px", fontWeight: "700", textTransform: "uppercase", padding: "2px 8px", borderRadius: "10px", background: colors.border, color: "#fff", whiteSpace: "nowrap", flexShrink: 0 }}>{alert.priority}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Patient Updates */}
          {report.patientUpdates && report.patientUpdates.length > 0 && (
            <div style={{ marginBottom: "16px" }}>
              <div style={{ fontSize: "13px", fontWeight: "700", color: "var(--text)", marginBottom: "8px" }}>Patient Updates ({report.patientUpdates.length})</div>
              <div style={{ border: "1px solid var(--border, #e2e8f0)", borderRadius: "8px", overflow: "hidden" }}>
                {report.patientUpdates.map((pu, i) => {
                  const statusColors = { stable: "#15803d", critical: "#dc2626", declining: "#d97706", improving: "#2563eb" };
                  const statusColor = statusColors[pu.status] || "#64748b";
                  return (
                    <div key={i} style={{ padding: "12px 14px", borderBottom: i < report.patientUpdates.length - 1 ? "1px solid var(--border, #e2e8f0)" : "none", fontSize: "12px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <strong style={{ fontSize: "13px" }}>{pu.patient}</strong>
                          <span style={{ fontSize: "11px", color: "#64748b" }}>Room {pu.room || "—"}</span>
                        </div>
                        <span style={{ fontSize: "11px", fontWeight: "700", padding: "2px 8px", borderRadius: "10px", background: statusColor + "1a", color: statusColor, textTransform: "capitalize" }}>{pu.status}</span>
                      </div>
                      {pu.vitals && (pu.vitals.temp || pu.vitals.bp || pu.vitals.pulse || pu.vitals.spo2) && (
                        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "4px", fontSize: "11px", color: "#64748b" }}>
                          {pu.vitals.temp && <span>Temp: <strong>{pu.vitals.temp}</strong></span>}
                          {pu.vitals.bp && <span>BP: <strong>{pu.vitals.bp}</strong></span>}
                          {pu.vitals.pulse && <span>Pulse: <strong>{pu.vitals.pulse}</strong></span>}
                          {pu.vitals.spo2 && <span>SpO2: <strong>{pu.vitals.spo2}</strong></span>}
                        </div>
                      )}
                      {pu.keyObservations && <div style={{ color: "var(--text-secondary, #475569)", fontSize: "12px" }}>{pu.keyObservations}</div>}
                      {pu.concerns && pu.concerns.length > 0 && (
                        <div style={{ marginTop: "4px" }}>
                          {pu.concerns.map((c, ci) => (
                            <div key={ci} style={{ fontSize: "11px", color: "#d97706", display: "flex", alignItems: "start", gap: "4px", marginTop: "2px" }}>
                              <AlertTriangle size={10} style={{ marginTop: "2px", flexShrink: 0 }} /> {c}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Medication Compliance */}
          <div style={{ marginBottom: "16px" }}>
            <div style={{ fontSize: "13px", fontWeight: "700", color: "var(--text)", marginBottom: "8px" }}>Medication Compliance</div>
            <div style={{ background: "var(--hover-bg, #f8fafc)", padding: "12px 16px", borderRadius: "8px", border: "1px solid var(--border, #e2e8f0)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "12px" }}>
                <span style={{ color: "var(--text-secondary)" }}>Compliance Rate</span>
                <strong style={{ color: compliancePercent >= 90 ? "#15803d" : compliancePercent >= 70 ? "#d97706" : "#dc2626" }}>{compliancePercent}%</strong>
              </div>
              <div style={{ width: "100%", height: "8px", background: "var(--border, #e2e8f0)", borderRadius: "4px", overflow: "hidden" }}>
                <div style={{ width: `${compliancePercent}%`, height: "100%", borderRadius: "4px", background: compliancePercent >= 90 ? "#15803d" : compliancePercent >= 70 ? "#d97706" : "#dc2626", transition: "width 0.5s ease" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px", fontSize: "12px" }}>
                <span style={{ color: "#15803d" }}>Given: {medSummary.given || 0}</span>
                <span style={{ color: "#d97706" }}>Pending: {medSummary.pending || 0}</span>
                <span style={{ color: "#dc2626" }}>Missed: {medSummary.missed || 0}</span>
              </div>
            </div>
          </div>

          {/* Pending Tasks */}
          {report.pendingTasks && report.pendingTasks.length > 0 && (
            <div style={{ marginBottom: "16px" }}>
              <div style={{ fontSize: "13px", fontWeight: "700", color: "var(--text)", marginBottom: "8px" }}>Pending Tasks ({report.pendingTasks.length})</div>
              {report.pendingTasks.map((task, i) => {
                const taskText = typeof task === "string" ? task : task.task || task.description || "";
                return (
                  <div key={i} style={{ display: "flex", alignItems: "start", gap: "8px", padding: "6px 0", borderBottom: "1px solid var(--border, #f1f5f9)", fontSize: "13px" }}>
                    <input type="checkbox" disabled style={{ marginTop: "3px", flexShrink: 0 }} />
                    <span style={{ color: "var(--text-secondary)" }}>{taskText}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Incidents */}
          {report.incidentSummary && report.incidentSummary.length > 0 && (
            <div style={{ marginBottom: "16px" }}>
              <div style={{ fontSize: "13px", fontWeight: "700", color: "var(--text)", marginBottom: "8px" }}>Incidents</div>
              {report.incidentSummary.map((inc, i) => (
                <div key={i} style={{ background: "#fef3c7", padding: "8px 12px", borderRadius: "6px", marginBottom: "6px", fontSize: "12px", borderLeft: "3px solid #d97706", color: "#374151" }}>
                  {inc}
                </div>
              ))}
            </div>
          )}

          {/* Recommendations */}
          {report.recommendations && report.recommendations.length > 0 && (
            <div style={{ marginBottom: "16px" }}>
              <div style={{ fontSize: "13px", fontWeight: "700", color: "var(--text)", marginBottom: "8px" }}>Recommendations</div>
              <div style={{ background: "#ede9fe", padding: "12px 16px", borderRadius: "8px", border: "1px solid #c4b5fd" }}>
                {report.recommendations.map((rec, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "start", gap: "8px", padding: "4px 0", fontSize: "12px", color: "#4c1d95" }}>
                    <span style={{ color: "#7c3aed", fontWeight: "700", flexShrink: 0 }}>{i + 1}.</span>
                    <span>{rec}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: "flex", gap: "8px", borderTop: "1px solid var(--border, #e2e8f0)", paddingTop: "16px" }}>
            <button className="btn btn-primary" style={{ flex: 1, justifyContent: "center" }} onClick={onUse}>
              <CheckCircle size={13} /> Use This Handover
            </button>
            <button className="btn btn-outline" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ShiftHandover() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [handovers, setHandovers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [form, setForm] = useState({
    fromShift: "Morning", toShift: "Afternoon",
    handedBy: user?.name || "", receivedBy: "",
    time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false }),
    summary: "",
    criticalAlerts: [{ patient: "", room: "", alert: "" }],
    pendingTasks: [""],
    incidents: "",
  });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  // Auto Handover state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiReport, setAiReport] = useState(null);

  const load = () => {
    setLoading(true);
    getShiftHandovers()
      .then(r => setHandovers(Array.isArray(r) ? r : r.data || []))
      .catch(() => { setHandovers([]); addToast("Failed to load handovers.", "error"); })
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const addAlert = () => set("criticalAlerts", [...form.criticalAlerts, { patient: "", room: "", alert: "" }]);
  const updateAlert = (i, k, v) => {
    const alerts = [...form.criticalAlerts];
    alerts[i] = { ...alerts[i], [k]: v };
    set("criticalAlerts", alerts);
  };
  const removeAlert = (i) => set("criticalAlerts", form.criticalAlerts.filter((_, idx) => idx !== i));

  const addTask = () => set("pendingTasks", [...form.pendingTasks, ""]);
  const updateTask = (i, v) => {
    const tasks = [...form.pendingTasks];
    tasks[i] = v;
    set("pendingTasks", tasks);
  };
  const removeTask = (i) => set("pendingTasks", form.pendingTasks.filter((_, idx) => idx !== i));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.summary) return;
    setSaving(true);
    try {
      await addShiftHandover({
        ...form,
        criticalAlerts: form.criticalAlerts.filter(a => a.alert),
        pendingTasks: form.pendingTasks.filter(t => t),
      });
      setShowForm(false);
      load();
    } catch { addToast("Failed to submit handover.", "error"); } finally { setSaving(false); }
  };

  const handleAcknowledge = async (id) => {
    await acknowledgeHandover(id);
    load();
  };

  // Auto Handover generation
  const handleAIGenerate = async () => {
    setAiLoading(true);
    try {
      const [patients, notes, medSchedule, incidents] = await Promise.all([
        getHomeCarePatients().then(r => Array.isArray(r) ? r : r.data || []),
        getHomeCareNotes().then(r => Array.isArray(r) ? r : r.data || []),
        getMedSchedule().then(r => Array.isArray(r) ? r : r.data || []),
        getIncidents().then(r => Array.isArray(r) ? r : r.data || []),
      ]);

      const shiftData = {
        fromShift: form.fromShift,
        toShift: form.toShift,
        date: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
        handedBy: form.handedBy || user?.name || "Duty Nurse",
        patients: patients.filter(p => p.status === "Active" || p.status === "active" || !p.status),
        notes,
        medSchedule,
        incidents,
      };

      const report = generateHandoverSummary(shiftData);
      setAiReport(report);
    } catch (err) {
      console.error("Auto Handover generation failed:", err);
      addToast("Failed to generate auto handover.", "error");
    } finally {
      setAiLoading(false);
    }
  };

  // Pre-fill form from auto report
  const handleUseAIReport = () => {
    if (!aiReport) return;

    const alerts = (aiReport.criticalAlerts || []).map(a => ({
      patient: a.patient || "",
      room: a.room || "",
      alert: a.alert || "",
    }));

    const tasks = (aiReport.pendingTasks || []).map(t =>
      typeof t === "string" ? t : t.task || t.description || ""
    ).filter(Boolean);

    const incidentText = (aiReport.incidentSummary || []).join("; ");

    setForm(prev => ({
      ...prev,
      fromShift: aiReport.shiftInfo?.fromShift || prev.fromShift,
      toShift: aiReport.shiftInfo?.toShift || prev.toShift,
      summary: aiReport.summary || "",
      criticalAlerts: alerts.length > 0 ? alerts : [{ patient: "", room: "", alert: "" }],
      pendingTasks: tasks.length > 0 ? tasks : [""],
      incidents: incidentText || "",
    }));

    setAiReport(null);
    setShowForm(true);
  };

  const pending = handovers.filter(h => h.status === "Pending").length;

  return (
    <div className="fade-in">
      {/* Auto Handover Modal */}
      {aiReport && (
        <AIHandoverModal
          report={aiReport}
          onUse={handleUseAIReport}
          onClose={() => setAiReport(null)}
        />
      )}

      <div className="page-header">
        <div><h2>Shift Handover</h2><p>Structured shift handoff for continuity of care</p></div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            className="btn btn-outline btn-sm"
            onClick={handleAIGenerate}
            disabled={aiLoading}
            style={{ borderColor: "#8b5cf6", color: "#8b5cf6" }}
          >
            {aiLoading ? <><span className="spinner" style={{ width: 13, height: 13 }} /> Generating...</> : <><Sparkles size={13} /> Auto Handover</>}
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}><Plus size={13} /> New Handover</button>
        </div>
      </div>

      {pending > 0 && (
        <div className="alert-bar alert-warn" style={{ marginBottom: "12px" }}>
          <AlertTriangle size={14} /> {pending} handover{pending > 1 ? "s" : ""} awaiting acknowledgement
        </div>
      )}

      {/* Handover Form */}
      {showForm && (
        <div className="card" style={{ border: "2px solid var(--text)", marginBottom: "16px" }}>
          <div className="card-header">
            <h3><ArrowRightLeft size={15} style={{ marginRight: 4 }} /> Create Shift Handover</h3>
            <button className="btn-icon" onClick={() => setShowForm(false)}><X size={15} /></button>
          </div>
          <form onSubmit={handleSubmit} className="form-grid">
            <div className="form-row3">
              <div className="field"><label>From Shift</label>
                <select value={form.fromShift} onChange={e => set("fromShift", e.target.value)}>
                  {SHIFTS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="field"><label>To Shift</label>
                <select value={form.toShift} onChange={e => set("toShift", e.target.value)}>
                  {SHIFTS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="field"><label>Time</label><input type="time" value={form.time} onChange={e => set("time", e.target.value)} /></div>
            </div>
            <div className="form-row">
              <div className="field"><label>Handed By</label><input value={form.handedBy} onChange={e => set("handedBy", e.target.value)} /></div>
              <div className="field"><label>Received By</label><input value={form.receivedBy} onChange={e => set("receivedBy", e.target.value)} /></div>
            </div>

            <div className="field"><label>Shift Summary <span className="req">*</span></label>
              <textarea value={form.summary} onChange={e => set("summary", e.target.value)} rows={3} placeholder="Overall summary of the shift — key events, patient status, concerns..." />
            </div>

            {/* Critical Alerts */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--danger)" }}>Critical Patient Alerts</label>
                <button type="button" className="btn btn-sm btn-outline" onClick={addAlert}><Plus size={11} /> Add</button>
              </div>
              {form.criticalAlerts.map((a, i) => (
                <div key={i} style={{ display: "flex", gap: "8px", marginBottom: "8px", alignItems: "start" }}>
                  <input style={{ width: "25%", padding: "7px 10px", border: "1.5px solid var(--border)", borderRadius: "5px", fontSize: "13px" }} placeholder="Patient" value={a.patient} onChange={e => updateAlert(i, "patient", e.target.value)} />
                  <input style={{ width: "15%", padding: "7px 10px", border: "1.5px solid var(--border)", borderRadius: "5px", fontSize: "13px" }} placeholder="Room" value={a.room} onChange={e => updateAlert(i, "room", e.target.value)} />
                  <input style={{ flex: 1, padding: "7px 10px", border: "1.5px solid var(--border)", borderRadius: "5px", fontSize: "13px" }} placeholder="Alert details..." value={a.alert} onChange={e => updateAlert(i, "alert", e.target.value)} />
                  {form.criticalAlerts.length > 1 && <button type="button" className="btn-icon" onClick={() => removeAlert(i)} style={{ padding: "6px" }}><X size={12} /></button>}
                </div>
              ))}
            </div>

            {/* Pending Tasks */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)" }}>Pending Tasks for Next Shift</label>
                <button type="button" className="btn btn-sm btn-outline" onClick={addTask}><Plus size={11} /> Add</button>
              </div>
              {form.pendingTasks.map((t, i) => (
                <div key={i} style={{ display: "flex", gap: "8px", marginBottom: "6px" }}>
                  <input style={{ flex: 1, padding: "7px 10px", border: "1.5px solid var(--border)", borderRadius: "5px", fontSize: "13px" }} placeholder="Task..." value={t} onChange={e => updateTask(i, e.target.value)} />
                  {form.pendingTasks.length > 1 && <button type="button" className="btn-icon" onClick={() => removeTask(i)} style={{ padding: "6px" }}><X size={12} /></button>}
                </div>
              ))}
            </div>

            <div className="field"><label>Incidents During Shift</label><input value={form.incidents} onChange={e => set("incidents", e.target.value)} placeholder="Any incidents? Reference incident IDs if applicable..." /></div>

            <div style={{ display: "flex", gap: "8px" }}>
              <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? "Saving..." : "Submit Handover"}</button>
              <button className="btn btn-outline" type="button" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Handover List */}
      <div className="card">
        {loading ? <div className="loading-box"><span className="spinner" /></div> : (
          handovers.length === 0 ? (
            <div className="empty-state"><ArrowRightLeft size={36} /><div>No handover records yet</div></div>
          ) : (
            handovers.map(h => (
              <div key={h.id} style={{ border: "1px solid var(--border)", borderRadius: "8px", padding: "16px", marginBottom: "12px", borderLeft: `4px solid ${h.status === "Acknowledged" ? "var(--success)" : "var(--warning)"}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "10px", flexWrap: "wrap", gap: "8px" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                      <ArrowRightLeft size={14} color="var(--text)" />
                      <span style={{ fontWeight: 700, color: "var(--text)" }}>{h.fromShift} → {h.toShift}</span>
                      <span className="badge" style={{ background: h.status === "Acknowledged" ? "var(--success-light)" : "var(--warning-light)", color: h.status === "Acknowledged" ? "var(--success)" : "var(--warning)" }}>{h.status}</span>
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                      <Clock size={11} style={{ marginRight: 3 }} />{h.date} at {h.time} · {h.handedBy} → {h.receivedBy}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "6px" }}>
                    {h.status === "Pending" && (
                      <button className="btn btn-sm btn-success" onClick={() => handleAcknowledge(h.id)}>
                        <CheckCircle size={12} /> Acknowledge
                      </button>
                    )}
                    <button className="btn btn-sm btn-outline" onClick={() => setExpanded(expanded === h.id ? null : h.id)}>
                      {expanded === h.id ? "Collapse" : "Details"}
                    </button>
                  </div>
                </div>

                <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: expanded === h.id ? "12px" : 0 }}>{h.summary}</p>

                {expanded === h.id && (
                  <div style={{ marginTop: "12px" }}>
                    {h.criticalAlerts?.length > 0 && (
                      <div style={{ marginBottom: "12px" }}>
                        <div className="section-title" style={{ color: "var(--danger)" }}>Critical Alerts</div>
                        {h.criticalAlerts.map((a, i) => (
                          <div key={i} style={{ background: "var(--danger-light)", padding: "8px 12px", borderRadius: "5px", marginBottom: "6px", fontSize: "13px", borderLeft: "3px solid var(--danger)" }}>
                            <strong>{a.patient}</strong> (Room {a.room}): {a.alert}
                          </div>
                        ))}
                      </div>
                    )}
                    {h.pendingTasks?.length > 0 && (
                      <div style={{ marginBottom: "12px" }}>
                        <div className="section-title">Pending Tasks</div>
                        {h.pendingTasks.map((t, i) => (
                          <div key={i} style={{ fontSize: "13px", padding: "4px 0", display: "flex", alignItems: "center", gap: "6px" }}>
                            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--text)", display: "inline-block" }} />{t}
                          </div>
                        ))}
                      </div>
                    )}
                    {h.incidents && (
                      <div>
                        <div className="section-title">Incidents</div>
                        <p style={{ fontSize: "13px" }}>{h.incidents}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )
        )}
      </div>
    </div>
  );
}
