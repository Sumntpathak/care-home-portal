/**
 * Doctor Testing Dashboard
 * Shows session stats, engine call breakdown, feedback summary, and export.
 */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import { getAuditTrail, getAuditStats, exportAuditTrail } from "../utils/auditTrail";
import { BarChart3, Clock, Check, XCircle, AlertTriangle, Download, Pill, Activity, Heart, ArrowRightLeft, Shield, FileText, ChevronRight } from "lucide-react";

const ENGINE_COLORS = {
  drugInteractions: { label: "Drug Interactions", color: "#dc2626", icon: Pill },
  vitalsAnalyzer: { label: "Vitals Analyzer", color: "#3b82f6", icon: Activity },
  dietEngine: { label: "Diet Engine", color: "#10b981", icon: Heart },
  handoverEngine: { label: "Handover Generator", color: "#8b5cf6", icon: ArrowRightLeft },
  clinicalPipeline: { label: "Clinical Pipeline", color: "#f59e0b", icon: Shield },
};

export default function DoctorTestingDashboard() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [entries, setEntries] = useState([]);
  const [session, setSession] = useState(null);
  const [elapsed, setElapsed] = useState("");

  useEffect(() => {
    setStats(getAuditStats());
    setEntries(getAuditTrail({ user: user?.name }));
    try {
      const s = JSON.parse(localStorage.getItem("doctor_testing_session") || "null");
      setSession(s);
    } catch {}
  }, [user?.name]);

  // Elapsed time ticker
  useEffect(() => {
    if (!session?.startTime) return;
    const tick = () => {
      const diff = Date.now() - new Date(session.startTime).getTime();
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setElapsed(`${h > 0 ? h + "h " : ""}${m}m ${s}s`);
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [session?.startTime]);

  const handleExport = (format) => {
    const data = exportAuditTrail(format);
    const blob = new Blob([data], { type: format === "csv" ? "text/csv" : "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `clinical-validation-${user?.name?.replace(/\s+/g, "-") || "doctor"}-${new Date().toISOString().split("T")[0]}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
    addToast(`Exported as ${format.toUpperCase()}.`, "success");
  };

  const feedbackEntries = entries.filter(e => e.feedback);
  const validCount = feedbackEntries.filter(e => e.feedback?.action === "valid").length;
  const overrideCount = feedbackEntries.filter(e => e.feedback?.action === "override").length;
  const fpCount = feedbackEntries.filter(e => e.feedback?.action === "false-positive").length;
  const needsReview = entries.filter(e => !e.feedback).length;

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h2>Testing Dashboard</h2>
          <p>Your clinical engine testing session — {user?.name || "Doctor"}</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-outline btn-sm" onClick={() => handleExport("csv")}><Download size={13} /> CSV</button>
          <button className="btn btn-primary btn-sm" onClick={() => handleExport("json")}><Download size={13} /> JSON Report</button>
        </div>
      </div>

      {/* Session info */}
      {session && (
        <div className="card" style={{ marginBottom: 14, background: "var(--info-light)", border: "1px solid rgba(59,130,246,.2)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Clock size={18} color="var(--info)" />
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text)" }}>Testing Session Active</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Started: {new Date(session.startTime).toLocaleString("en-IN")}</div>
              </div>
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: "var(--info)", fontFamily: "monospace" }}>{elapsed}</div>
          </div>
        </div>
      )}

      {/* Stats grid */}
      <div className="stat-grid stagger">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "var(--primary-light)" }}><BarChart3 size={20} color="var(--primary)" /></div>
          <div className="label">Total Engine Calls</div>
          <div className="val">{stats?.totalCalls || 0}</div>
        </div>
        <div className="stat-card" onClick={() => navigate("/clinical-audit")} style={{ cursor: "pointer" }}>
          <div className="stat-icon" style={{ background: "var(--warning-light)" }}><AlertTriangle size={20} color="var(--warning)" /></div>
          <div className="label">Needs Your Review</div>
          <div className="val" style={{ color: needsReview > 0 ? "var(--warning)" : "var(--success)" }}>{needsReview}</div>
          {needsReview > 0 && <div className="sub" style={{ color: "var(--warning)" }}>Click to review</div>}
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "var(--success-light)" }}><Check size={20} color="var(--success)" /></div>
          <div className="label">Validated (Valid)</div>
          <div className="val">{validCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "var(--danger-light)" }}><XCircle size={20} color="var(--danger)" /></div>
          <div className="label">False Positive Rate</div>
          <div className="val">{stats?.falsePositiveRate || 0}%</div>
        </div>
      </div>

      {/* Engine breakdown */}
      <div className="card" style={{ marginBottom: 14 }}>
        <div className="card-header"><h3>Engine Call Breakdown</h3></div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
          {Object.entries(stats?.byEngine || {}).map(([engine, count]) => {
            const cfg = ENGINE_COLORS[engine] || { label: engine, color: "#6b7280", icon: Shield };
            const Icon = cfg.icon;
            return (
              <div key={engine} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderRadius: 8, background: "var(--subtle)", border: "1px solid var(--border)" }}>
                <Icon size={18} color={cfg.color} />
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: cfg.color }}>{count}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{cfg.label}</div>
                </div>
              </div>
            );
          })}
          {Object.keys(stats?.byEngine || {}).length === 0 && (
            <div style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)", fontSize: 13, gridColumn: "1 / -1" }}>
              No engine calls yet. Start by writing a prescription or reviewing patients.
            </div>
          )}
        </div>
      </div>

      {/* Feedback summary */}
      <div className="card" style={{ marginBottom: 14 }}>
        <div className="card-header">
          <h3>Your Feedback Summary</h3>
          <button className="btn btn-outline btn-sm" onClick={() => navigate("/clinical-audit")}>Review Alerts <ChevronRight size={13} /></button>
        </div>
        {feedbackEntries.length === 0 ? (
          <div style={{ padding: "24px", textAlign: "center", color: "var(--text-muted)" }}>
            <Shield size={32} style={{ marginBottom: 8, opacity: 0.3 }} />
            <div style={{ fontSize: 13 }}>No feedback given yet. Go to <strong>Clinical Audit</strong> to review engine alerts and mark them as Valid, Override, or False Positive.</div>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 16, padding: "8px 0", flexWrap: "wrap" }}>
            <div style={{ textAlign: "center", padding: "12px 24px" }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: "var(--success)" }}>{validCount}</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Valid</div>
            </div>
            <div style={{ textAlign: "center", padding: "12px 24px" }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: "var(--warning)" }}>{overrideCount}</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Override</div>
            </div>
            <div style={{ textAlign: "center", padding: "12px 24px" }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: "var(--danger)" }}>{fpCount}</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>False Positive</div>
            </div>
            <div style={{ textAlign: "center", padding: "12px 24px" }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: "var(--info)" }}>{needsReview}</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Pending Review</div>
            </div>
          </div>
        )}
      </div>

      {/* Recent engine calls */}
      <div className="card">
        <div className="card-header"><h3>Recent Engine Calls</h3></div>
        {entries.length === 0 ? (
          <div style={{ padding: "24px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
            No engine calls recorded in this session. Write a prescription to trigger the drug interaction engine.
          </div>
        ) : (
          entries.slice(0, 10).map(entry => {
            const cfg = ENGINE_COLORS[entry.engineName] || { label: entry.engineName, color: "#6b7280" };
            return (
              <div key={entry.id} style={{ padding: "10px 0", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ padding: "2px 8px", borderRadius: 4, background: `${cfg.color}15`, color: cfg.color, fontSize: 10, fontWeight: 700 }}>{cfg.label}</span>
                    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{new Date(entry.timestamp).toLocaleTimeString("en-IN")}</span>
                  </div>
                  {entry.output?.overallRisk && (
                    <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 2 }}>Risk: {entry.output.overallRisk} · Interactions: {entry.output.interactionCount ?? "—"}</div>
                  )}
                </div>
                {entry.feedback ? (
                  <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 700, background: entry.feedback.action === "valid" ? "var(--success-light)" : entry.feedback.action === "override" ? "var(--warning-light)" : "var(--danger-light)", color: entry.feedback.action === "valid" ? "var(--success)" : entry.feedback.action === "override" ? "var(--warning)" : "var(--danger)" }}>
                    {entry.feedback.action.toUpperCase()}
                  </span>
                ) : (
                  <span style={{ fontSize: 10, color: "var(--text-muted)" }}>Pending review</span>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
