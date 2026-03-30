import { useState, useEffect } from "react";
import { getCarePlans } from "../api/sheets";
import { ClipboardList, Search, ChevronDown, ChevronUp, Target, Pill, Activity, UtensilsCrossed } from "lucide-react";
import { useToast } from "../components/Toast";
import FreshnessIndicator from "../components/FreshnessIndicator";


const GOAL_COLORS = { "Achieved": "var(--success)", "In Progress": "var(--info)", "Needs Attention": "var(--danger)" };

export default function CarePlans() {
  const { addToast } = useToast();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    getCarePlans()
      .then(r => setPlans(Array.isArray(r) ? r : r.data || []))
      .catch(() => { setPlans([]); addToast("Failed to load care plans.", "error"); })
      .finally(() => setLoading(false));
  }, []);

  const filtered = plans.filter(p => {
    const q = search.toLowerCase();
    return !q || p.patientName?.toLowerCase().includes(q) || p.diagnosis?.toLowerCase().includes(q);
  });

  const needsReview = plans.filter(p => {
    const review = new Date(p.reviewDate);
    const now = new Date();
    const diff = (review - now) / (1000 * 60 * 60 * 24);
    return diff <= 14;
  }).length;

  return (
    <div className="fade-in">
      <div className="page-header">
        <div><h2>Care Plans</h2><p>Individualized care plans for each resident</p></div>
        <FreshnessIndicator storeName="carePlans" onRefresh={() => {
          getCarePlans()
            .then(r => setPlans(Array.isArray(r) ? r : r.data || []))
            .catch(() => addToast("Failed to load care plans.", "error"));
        }} label="Data" />
      </div>

      {needsReview > 0 && (
        <div className="alert-bar alert-warn" style={{ marginBottom: "12px" }}>
          <ClipboardList size={14} /> {needsReview} care plan{needsReview > 1 ? "s" : ""} due for review within 14 days
        </div>
      )}

      <div className="search-box" style={{ marginBottom: "14px" }}>
        <Search size={14} />
        <input placeholder="Search by resident name or diagnosis..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? <div className="loading-box"><span className="spinner" /></div> : (
        filtered.length === 0 ? (
          <div className="card"><div className="empty-state"><ClipboardList size={36} /><div>No care plans found</div></div></div>
        ) : (
          filtered.map(plan => {
            const isExpanded = expanded === plan.id;
            const reviewDue = new Date(plan.reviewDate);
            const daysUntilReview = Math.ceil((reviewDue - new Date()) / (1000 * 60 * 60 * 24));
            const reviewUrgent = daysUntilReview <= 14;

            return (
              <div key={plan.id} className="card" style={{ borderLeft: `4px solid ${reviewUrgent ? "var(--danger)" : "var(--text)"}`, cursor: "pointer" }}
                onClick={() => setExpanded(isExpanded ? null : plan.id)}>
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: isExpanded ? "16px" : 0 }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                      <span style={{ fontWeight: 700, fontSize: "15px", color: "var(--text)" }}>{plan.patientName}</span>
                      <span className="badge badge-blue">{plan.patientId}</span>
                      <span className={`badge ${reviewUrgent ? "badge-red" : "badge-green"}`}>{plan.status}</span>
                    </div>
                    <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>{plan.diagnosis}</p>
                    <p style={{ fontSize: "11px", color: reviewUrgent ? "var(--danger)" : "var(--text-light)", marginTop: "2px", fontWeight: reviewUrgent ? 700 : 400 }}>
                      Next Review: {plan.reviewDate} {reviewUrgent ? `(${daysUntilReview <= 0 ? "OVERDUE" : `in ${daysUntilReview} days`})` : ""}
                    </p>
                  </div>
                  {isExpanded ? <ChevronUp size={18} color="var(--text-light)" /> : <ChevronDown size={18} color="var(--text-light)" />}
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div onClick={e => e.stopPropagation()}>
                    {/* Goals */}
                    <div style={{ marginBottom: "16px" }}>
                      <div className="section-title"><Target size={13} style={{ marginRight: 4 }} /> Care Goals</div>
                      {plan.goals?.map((g, i) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "var(--subtle)", borderRadius: "5px", marginBottom: "6px", borderLeft: `3px solid ${GOAL_COLORS[g.status] || "var(--text-light)"}` }}>
                          <div>
                            <div style={{ fontSize: "13px", fontWeight: 600 }}>{g.goal}</div>
                            <div style={{ fontSize: "11px", color: "var(--text-light)" }}>Target: {g.target}</div>
                          </div>
                          <span className="badge" style={{ background: `${GOAL_COLORS[g.status]}15`, color: GOAL_COLORS[g.status] }}>{g.status}</span>
                        </div>
                      ))}
                    </div>

                    {/* Medications */}
                    <div style={{ marginBottom: "16px" }}>
                      <div className="section-title"><Pill size={13} style={{ marginRight: 4 }} /> Prescribed Medications</div>
                      <div className="table-wrap">
                        <table className="data-table">
                          <thead><tr><th>Medication</th><th>Timing</th><th>Notes</th></tr></thead>
                          <tbody>
                            {plan.medications?.map((m, i) => (
                              <tr key={i}>
                                <td className="cell-name">{m.name}</td>
                                <td style={{ fontSize: "12px" }}>{m.timing}</td>
                                <td style={{ fontSize: "12px", color: "var(--text-muted)" }}>{m.notes || "—"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Activities */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "16px" }}>
                      <div>
                        <div className="section-title"><Activity size={13} style={{ marginRight: 4 }} /> Activities & Exercises</div>
                        {plan.activities?.map((a, i) => (
                          <div key={i} style={{ fontSize: "13px", padding: "3px 0", display: "flex", gap: "6px" }}>
                            <span style={{ color: "var(--success)" }}>•</span> {a}
                          </div>
                        ))}
                      </div>
                      <div>
                        <div className="section-title"><UtensilsCrossed size={13} style={{ marginRight: 4 }} /> Dietary Requirements</div>
                        <p style={{ fontSize: "13px", lineHeight: 1.6 }}>{plan.dietary}</p>
                      </div>
                    </div>

                    {/* Special Instructions */}
                    {plan.specialInstructions && (
                      <div style={{ background: "var(--warning-light)", padding: "12px", borderRadius: "6px", marginBottom: "12px" }}>
                        <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--warning)", marginBottom: "4px" }}>SPECIAL INSTRUCTIONS</div>
                        <p style={{ fontSize: "13px", color: "var(--warning)", lineHeight: 1.5 }}>{plan.specialInstructions}</p>
                      </div>
                    )}

                    {plan.notes && (
                      <div style={{ fontSize: "13px", color: "var(--text-muted)", fontStyle: "italic" }}>
                        <strong>Notes:</strong> {plan.notes}
                      </div>
                    )}

                    <div style={{ fontSize: "11px", color: "var(--text-light)", marginTop: "10px" }}>
                      Created by {plan.createdBy} on {plan.createdDate}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )
      )}
    </div>
  );
}
