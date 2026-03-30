/**
 * Clinical Audit & Engine Validation
 * Doctors review clinical engine outputs and provide feedback:
 * - Valid: Alert was clinically relevant
 * - Override: Alert seen but doctor chose to proceed
 * - False Positive: Alert was not clinically relevant
 */
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import { getAuditTrail, getAuditStats, markFeedback, exportAuditTrail } from "../utils/auditTrail";
import { Shield, Check, AlertTriangle, XCircle, Download, RefreshCw, Filter, BarChart3, FileText, ChevronDown } from "lucide-react";

const ENGINE_LABELS = {
  drugInteractions: { label: "Drug Interactions", color: "#dc2626", bg: "#fef2f2" },
  dietEngine: { label: "Diet Engine", color: "#15803d", bg: "#ecfdf5" },
  vitalsAnalyzer: { label: "Vitals Analyzer", color: "#2563eb", bg: "#eff6ff" },
  handoverEngine: { label: "Handover Generator", color: "#7c3aed", bg: "#f5f3ff" },
};

const RISK_COLORS = {
  "high-risk": { bg: "#fef2f2", color: "#dc2626" },
  "moderate-risk": { bg: "#fffbeb", color: "#d97706" },
  "low-risk": { bg: "#ecfdf5", color: "#15803d" },
  "safe": { bg: "#f9fafb", color: "#6b7280" },
};

const FEEDBACK_ACTIONS = [
  { key: "valid", label: "Valid", icon: Check, color: "#15803d", bg: "#ecfdf5", desc: "Alert was clinically relevant and acted upon" },
  { key: "override", label: "Override", icon: AlertTriangle, color: "#d97706", bg: "#fffbeb", desc: "Alert seen but chose to proceed with clinical justification" },
  { key: "false-positive", label: "False Positive", icon: XCircle, color: "#dc2626", bg: "#fef2f2", desc: "Alert was not clinically relevant for this patient" },
];

export default function ClinicalAudit() {
  const { user, isDoctor, isAdmin } = useAuth();
  const { addToast } = useToast();
  const [entries, setEntries] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ engine: "", feedback: "" });
  const [expandedId, setExpandedId] = useState(null);
  const [feedbackForm, setFeedbackForm] = useState({ id: null, action: "", reason: "" });

  const load = () => {
    setLoading(true);
    const filters = {};
    if (filter.engine) filters.engineName = filter.engine;
    if (filter.feedback) filters.feedbackAction = filter.feedback;
    setEntries(getAuditTrail(filters));
    setStats(getAuditStats());
    setLoading(false);
  };

  useEffect(load, [filter.engine, filter.feedback]);

  const handleFeedback = (auditId, action, reason) => {
    const success = markFeedback(auditId, {
      action,
      reason: reason || "",
      by: user?.name || "Doctor",
    });
    if (success) {
      addToast(`Marked as "${action}".`, "success");
      setFeedbackForm({ id: null, action: "", reason: "" });
      load();
    } else {
      addToast("Failed to save feedback.", "error");
    }
  };

  const handleExport = (format) => {
    const data = exportAuditTrail(format);
    const blob = new Blob([data], { type: format === "csv" ? "text/csv" : "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `clinical-audit-${new Date().toISOString().split("T")[0]}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
    addToast(`Exported as ${format.toUpperCase()}.`, "success");
  };

  const needsReview = entries.filter(e => !e.feedback).length;
  const reviewed = entries.filter(e => e.feedback).length;

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h2>Clinical Audit &amp; Engine Validation</h2>
          <p>Review and validate clinical engine outputs for quality assurance</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-outline btn-sm" onClick={() => handleExport("csv")}><Download size={13} /> CSV</button>
          <button className="btn btn-outline btn-sm" onClick={() => handleExport("json")}><Download size={13} /> JSON</button>
          <button className="btn btn-outline btn-sm" onClick={load}><RefreshCw size={13} /></button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="stat-grid stagger">
          <div className="stat-card">
            <div className="stat-icon" style={{ background: "var(--primary-light)" }}><BarChart3 size={20} color="var(--primary)" /></div>
            <div className="label">Total Engine Calls</div>
            <div className="val">{stats.totalCalls}</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: "var(--warning-light)" }}><AlertTriangle size={20} color="var(--warning)" /></div>
            <div className="label">Needs Review</div>
            <div className="val" style={{ color: needsReview > 0 ? "var(--warning)" : "var(--success)" }}>{needsReview}</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: "var(--success-light)" }}><Check size={20} color="var(--success)" /></div>
            <div className="label">Reviewed</div>
            <div className="val">{reviewed}</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: "var(--danger-light)" }}><XCircle size={20} color="var(--danger)" /></div>
            <div className="label">False Positive Rate</div>
            <div className="val">{stats.falsePositiveRate}%</div>
          </div>
        </div>
      )}

      {/* Engine Breakdown */}
      {stats && stats.byEngine && (
        <div className="card" style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {Object.entries(stats.byEngine).map(([engine, count]) => {
              const cfg = ENGINE_LABELS[engine] || { label: engine, color: "#6b7280", bg: "#f9fafb" };
              return (
                <div key={engine} onClick={() => setFilter(f => ({ ...f, engine: f.engine === engine ? "" : engine }))}
                  style={{ padding: "8px 14px", borderRadius: 8, background: filter.engine === engine ? cfg.color : cfg.bg, color: filter.engine === engine ? "#fff" : cfg.color, fontSize: 12, fontWeight: 600, cursor: "pointer", border: `1px solid ${cfg.color}30` }}>
                  {cfg.label}: {count}
                </div>
              );
            })}
            {filter.engine && (
              <button style={{ padding: "8px 14px", borderRadius: 8, background: "var(--subtle)", color: "var(--text-muted)", fontSize: 12, border: "1px solid var(--border)", cursor: "pointer" }}
                onClick={() => setFilter(f => ({ ...f, engine: "" }))}>
                Clear Filter
              </button>
            )}
          </div>
        </div>
      )}

      {/* Feedback Filter */}
      <div className="tab-bar" style={{ marginBottom: 14 }}>
        <button className={`tab-btn ${!filter.feedback ? "active" : ""}`} onClick={() => setFilter(f => ({ ...f, feedback: "" }))}>All ({entries.length})</button>
        <button className={`tab-btn ${filter.feedback === "needs-review" ? "active" : ""}`} onClick={() => setFilter(f => ({ ...f, feedback: f.feedback === "needs-review" ? "" : "needs-review" }))}>Needs Review ({needsReview})</button>
        {FEEDBACK_ACTIONS.map(fa => (
          <button key={fa.key} className={`tab-btn ${filter.feedback === fa.key ? "active" : ""}`} onClick={() => setFilter(f => ({ ...f, feedback: f.feedback === fa.key ? "" : fa.key }))}>
            {fa.label}
          </button>
        ))}
      </div>

      {/* Entries */}
      {loading ? <div className="loading-box"><span className="spinner" /></div> : (
        <div className="card">
          {(filter.feedback === "needs-review" ? entries.filter(e => !e.feedback) : entries).length === 0 ? (
            <div className="empty-state"><Shield size={36} /><div>No audit entries</div></div>
          ) : (
            (filter.feedback === "needs-review" ? entries.filter(e => !e.feedback) : entries).map(entry => {
              const cfg = ENGINE_LABELS[entry.engineName] || { label: entry.engineName, color: "#6b7280", bg: "#f9fafb" };
              const risk = entry.output?.overallRisk || "unknown";
              const rc = RISK_COLORS[risk] || RISK_COLORS.safe;
              const isExpanded = expandedId === entry.id;

              return (
                <div key={entry.id} style={{ padding: "12px 14px", borderRadius: 8, marginBottom: 6, background: "var(--subtle)", border: "1px solid var(--border)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, cursor: "pointer" }}
                    onClick={() => setExpandedId(isExpanded ? null : entry.id)}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, flexWrap: "wrap" }}>
                        <span style={{ padding: "2px 8px", borderRadius: 4, background: cfg.bg, color: cfg.color, fontSize: 10, fontWeight: 700 }}>{cfg.label}</span>
                        <span style={{ padding: "2px 8px", borderRadius: 4, background: rc.bg, color: rc.color, fontSize: 10, fontWeight: 600 }}>{risk}</span>
                        <span style={{ fontSize: 10, color: "var(--text-light)", fontFamily: "monospace" }}>{entry.id}</span>
                        {entry.feedback && (
                          <span style={{ padding: "2px 8px", borderRadius: 4, background: entry.feedback.action === "valid" ? "#ecfdf5" : entry.feedback.action === "override" ? "#fffbeb" : "#fef2f2", color: entry.feedback.action === "valid" ? "#15803d" : entry.feedback.action === "override" ? "#d97706" : "#dc2626", fontSize: 10, fontWeight: 700 }}>
                            {entry.feedback.action.toUpperCase()} by {entry.feedback.by}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                        {new Date(entry.timestamp).toLocaleString("en-IN")} · Triggered by {entry.user}
                        {entry.output?.interactionCount != null && ` · ${entry.output.interactionCount} interaction(s)`}
                        {entry.output?.alertCount != null && ` · ${entry.output.alertCount} alert(s)`}
                      </div>
                    </div>
                    <ChevronDown size={14} style={{ color: "var(--text-muted)", transform: isExpanded ? "rotate(180deg)" : "none", transition: ".2s" }} />
                  </div>

                  {isExpanded && (
                    <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--border)" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", marginBottom: 4 }}>Input</div>
                          <pre style={{ fontSize: 11, background: "var(--surface)", padding: 8, borderRadius: 6, overflow: "auto", maxHeight: 120, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                            {JSON.stringify(entry.input, null, 2)}
                          </pre>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", marginBottom: 4 }}>Output Summary</div>
                          <pre style={{ fontSize: 11, background: "var(--surface)", padding: 8, borderRadius: 6, overflow: "auto", maxHeight: 120, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                            {JSON.stringify(entry.output, null, 2)}
                          </pre>
                        </div>
                      </div>

                        {entry.output?.suppressedAlerts > 0 && (
                          <div style={{ marginTop: 8, padding: "8px 12px", background: "var(--info-light)", borderRadius: 6, fontSize: 11, color: "var(--info)" }}>
                            <strong>Causal Reasoning:</strong> {entry.output.suppressedAlerts} alert(s) were suppressed because they were identified as secondary effects of a primary finding. This reduces alert fatigue while preserving the root cause.
                          </div>
                        )}
                        {entry.output?.causalReasoning > 0 && (
                          <div style={{ marginTop: 4, padding: "8px 12px", background: "var(--purple-light)", borderRadius: 6, fontSize: 11, color: "var(--purple)" }}>
                            <strong>Fusion Analysis:</strong> {entry.output.causalReasoning} causal chain(s) detected. {entry.output.drugVitalFusions > 0 ? `${entry.output.drugVitalFusions} drug-vital correlation(s) found.` : ""}
                          </div>
                        )}
                        {entry.output?.confidenceLabel && (
                          <div style={{ marginTop: 4, padding: "8px 12px", background: "var(--subtle)", borderRadius: 6, fontSize: 11, color: "var(--text-secondary)" }}>
                            <strong>Confidence:</strong> {entry.output.confidenceLabel} ({Math.round((entry.output.confidence || 0) * 100)}%) — {entry.output.confidenceExplanation || ""}
                          </div>
                        )}

                      {!entry.feedback && (isDoctor || isAdmin) && (
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>Doctor Validation</div>
                          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                            {FEEDBACK_ACTIONS.map(fa => {
                              const Icon = fa.icon;
                              const isSelected = feedbackForm.id === entry.id && feedbackForm.action === fa.key;
                              return (
                                <button key={fa.key} onClick={() => setFeedbackForm({ id: entry.id, action: fa.key, reason: "" })}
                                  style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "10px 8px", borderRadius: 8, border: isSelected ? `2px solid ${fa.color}` : "1px solid var(--border)", background: isSelected ? fa.bg : "var(--surface)", cursor: "pointer", fontSize: 11, fontWeight: 600, color: isSelected ? fa.color : "var(--text-secondary)" }}>
                                  <Icon size={16} />
                                  {fa.label}
                                </button>
                              );
                            })}
                          </div>
                          {feedbackForm.id === entry.id && feedbackForm.action && (
                            <div>
                              <input value={feedbackForm.reason} onChange={e => setFeedbackForm(f => ({ ...f, reason: e.target.value }))}
                                placeholder="Reason (optional)" style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid var(--border)", fontSize: 12, marginBottom: 8 }} />
                              <button className="btn btn-primary btn-sm" onClick={() => handleFeedback(entry.id, feedbackForm.action, feedbackForm.reason)}>
                                <Check size={12} /> Confirm {feedbackForm.action}
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {entry.feedback && (
                        <div style={{ padding: "8px 12px", borderRadius: 6, background: entry.feedback.action === "valid" ? "#ecfdf5" : entry.feedback.action === "override" ? "#fffbeb" : "#fef2f2", fontSize: 12 }}>
                          <strong>Feedback:</strong> {entry.feedback.action} by {entry.feedback.by} at {new Date(entry.feedback.at).toLocaleString("en-IN")}
                          {entry.feedback.reason && <div style={{ marginTop: 4, color: "var(--text-secondary)" }}>Reason: {entry.feedback.reason}</div>}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
