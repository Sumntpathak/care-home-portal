import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { getMedSchedule, markMedGiven } from "../api/sheets";
import { Pill, Check, Clock, AlertTriangle, RefreshCw } from "lucide-react";
import { useToast } from "../components/Toast";
import FreshnessIndicator from "../components/FreshnessIndicator";
import { getSyncQueue } from "../lib/syncManager";


export default function MedSchedule() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [giving, setGiving] = useState(new Set());

  const load = () => {
    setLoading(true);
    getMedSchedule()
      .then(r => setSchedule(Array.isArray(r) ? r : r.data || []))
      .catch(() => setSchedule([]))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const handleGive = async (patientId, medIndex) => {
    const key = `${patientId}-${medIndex}`;
    if (giving.has(key)) return; // prevent double-administration

    // Double-administration guard: check if another device already queued this
    try {
      const queue = await getSyncQueue();
      const duplicate = queue.find(q =>
        q.entityType === 'med-administration' &&
        q.status === 'pending' &&
        q.body?.patientId === patientId &&
        q.body?.medIndex === medIndex
      );
      if (duplicate) {
        addToast("This medication may have already been administered from another device. Please verify before proceeding.", "warning");
      }
    } catch {}

    setGiving(prev => new Set(prev).add(key));
    try {
      const r = await markMedGiven(patientId, medIndex, user?.name || "Nurse");
      if (r.success === true) {
        addToast("Medication marked as given.", "success");
        load();
      } else {
        addToast(r.error || "Failed to record medication.", "error");
      }
    } catch {
      addToast("Connection error.", "error");
    } finally {
      setGiving(prev => { const next = new Set(prev); next.delete(key); return next; });
    }
  };

  const now = new Date();
  const currentHour = now.getHours();
  const currentTime = `${String(currentHour).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  // Calculate stats
  const allMeds = schedule.flatMap(p => p.schedule.map(m => ({ ...m, patientId: p.patientId, patientName: p.patientName, room: p.room })));
  const totalDue = allMeds.length;
  const given = allMeds.filter(m => m.given).length;
  const pending = allMeds.filter(m => !m.given).length;
  const overdue = allMeds.filter(m => !m.given && m.time < currentTime).length;
  const upcoming = allMeds.filter(m => !m.given && m.time >= currentTime).length;

  const filteredSchedule = schedule.map(p => ({
    ...p,
    schedule: p.schedule.filter(m => {
      if (filter === "given") return m.given;
      if (filter === "pending") return !m.given;
      if (filter === "overdue") return !m.given && m.time < currentTime;
      return true;
    }),
  })).filter(p => p.schedule.length > 0);

  return (
    <div className="fade-in">
      <div className="page-header">
        <div><h2>Medication Rounds</h2><p>Daily medication schedule and administration tracking</p></div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <FreshnessIndicator storeName="medSchedule" onRefresh={load} label="Data" />
          <button className="btn btn-outline btn-sm" onClick={load}><RefreshCw size={13} /> Refresh</button>
        </div>
      </div>

      {/* Stats */}
      <div className="stat-grid">
        <div className="stat-card" style={{ "--accent-color": "var(--text)" }}>
          <div className="val">{totalDue}</div>
          <div className="label">Total Today</div>
        </div>
        <div className="stat-card" style={{ "--accent-color": "var(--success)" }}>
          <div className="val">{given}</div>
          <div className="label">Administered</div>
          <div className="sub" style={{ color: "var(--success)" }}>{totalDue ? Math.round((given / totalDue) * 100) : 0}% complete</div>
        </div>
        <div className="stat-card" style={{ "--accent-color": overdue > 0 ? "var(--danger)" : "var(--info)" }}>
          <div className="val">{overdue}</div>
          <div className="label">Overdue</div>
          {overdue > 0 && <div className="sub" style={{ color: "var(--danger)" }}>Needs immediate attention</div>}
        </div>
        <div className="stat-card" style={{ "--accent-color": "var(--purple)" }}>
          <div className="val">{upcoming}</div>
          <div className="label">Upcoming</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="card" style={{ marginBottom: "14px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
          <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)" }}>Today's Progress</span>
          <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text)" }}>{given}/{totalDue}</span>
        </div>
        <div style={{ height: "10px", background: "var(--subtle)", borderRadius: "5px", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${totalDue ? (given / totalDue) * 100 : 0}%`, background: "linear-gradient(90deg, var(--success), var(--success))", borderRadius: "5px", transition: "width .3s" }} />
        </div>
      </div>

      {overdue > 0 && (
        <div className="alert-bar alert-danger" style={{ marginBottom: "12px" }}>
          <AlertTriangle size={14} /> {overdue} medication{overdue > 1 ? "s" : ""} overdue! Administer immediately or document reason.
        </div>
      )}

      {/* Filters */}
      <div className="tab-bar" style={{ marginBottom: "14px" }}>
        {[["all", `All (${totalDue})`], ["pending", `Pending (${pending})`], ["overdue", `Overdue (${overdue})`], ["given", `Given (${given})`]].map(([key, label]) => (
          <button key={key} className={`tab-btn ${filter === key ? "active" : ""}`} onClick={() => setFilter(key)}>{label}</button>
        ))}
      </div>

      {/* Schedule by Patient */}
      {loading ? <div className="loading-box"><span className="spinner" /></div> : (
        filteredSchedule.length === 0 ? (
          <div className="card"><div className="empty-state"><Pill size={36} /><div>No medications to show</div></div></div>
        ) : (
          filteredSchedule.map(patient => {
            const patientGiven = patient.schedule.filter(m => m.given).length;
            const patientTotal = patient.schedule.length;
            return (
              <div key={patient.patientId} className="card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <div>
                    <span style={{ fontWeight: 700, color: "var(--text)", marginRight: "8px" }}>{patient.patientName}</span>
                    <span className="badge badge-blue">Room {patient.room}</span>
                  </div>
                  <span style={{ fontSize: "12px", fontWeight: 600, color: patientGiven === patientTotal ? "var(--success)" : "var(--text-muted)" }}>
                    {patientGiven}/{patientTotal} given
                  </span>
                </div>

                {patient.schedule.map((med, i) => {
                  const isOverdue = !med.given && med.time < currentTime;
                  const origIndex = schedule.find(s => s.patientId === patient.patientId)?.schedule.findIndex(
                    m => m.medication === med.medication && m.time === med.time
                  );

                  return (
                    <div key={i} style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "10px 12px", borderRadius: "6px", marginBottom: "6px",
                      background: med.given ? "var(--success-light)" : isOverdue ? "var(--danger-light)" : "var(--subtle)",
                      border: `1px solid ${med.given ? "rgba(91,160,140,.25)" : isOverdue ? "rgba(212,104,90,.25)" : "var(--border)"}`,
                      gap: "12px", flexWrap: "wrap",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1 }}>
                        <div style={{
                          width: "36px", height: "36px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center",
                          background: med.given ? "var(--success-light)" : isOverdue ? "var(--danger-light)" : "var(--info-light)",
                        }}>
                          {med.given ? <Check size={16} color="var(--success)" /> : <Clock size={16} color={isOverdue ? "var(--danger)" : "var(--info)"} />}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: "13px" }}>{med.medication}</div>
                          <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{med.dose} · {med.timing}</div>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{ fontFamily: "monospace", fontSize: "13px", fontWeight: 600, color: isOverdue ? "var(--danger)" : "var(--text-secondary)" }}>{med.time}</span>
                        {med.given ? (
                          <span style={{ fontSize: "11px", color: "var(--success)" }}>
                            <Check size={11} /> Given at {med.givenAt} by {med.givenBy}
                          </span>
                        ) : (
                          <button className={`btn btn-sm ${isOverdue ? "btn-danger" : "btn-success"}`}
                            disabled={giving.has(`${patient.patientId}-${origIndex >= 0 ? origIndex : i}`)}
                            onClick={() => handleGive(patient.patientId, origIndex >= 0 ? origIndex : i)}>
                            <Check size={12} /> Mark Given
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })
        )
      )}
    </div>
  );
}
