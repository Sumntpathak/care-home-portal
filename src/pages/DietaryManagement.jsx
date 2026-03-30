import { useState, useEffect } from "react";
import { getDietaryPlans } from "../api/sheets";
import { UtensilsCrossed, Search, Printer, AlertTriangle } from "lucide-react";
import { printFullPage } from "../print";
import { useToast } from "../components/Toast";

const DIET_COLORS = {
  "Diabetic": "var(--warning)",
  "Renal": "var(--danger)",
  "Soft / Dysphagia Level 2": "var(--info)",
  "Pureed / Parkinson's": "var(--purple)",
  "Liquid / Semi-solid": "var(--info)",
};

const MEAL_LABELS = {
  breakfast: "Breakfast (8:00 AM)",
  midMorning: "Mid-Morning (10:30 AM)",
  lunch: "Lunch (12:30 PM)",
  evening: "Evening Snack (4:00 PM)",
  dinner: "Dinner (7:30 PM)",
  bedtime: "Bedtime (9:00 PM)",
};

export default function DietaryManagement() {
  const { addToast } = useToast();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedDiet, setSelectedDiet] = useState("all");

  useEffect(() => {
    getDietaryPlans()
      .then(r => setPlans(Array.isArray(r) ? r : r.data || []))
      .catch(() => { setPlans([]); addToast("Failed to load dietary plans.", "error"); })
      .finally(() => setLoading(false));
  }, []);

  const dietTypes = [...new Set(plans.map(p => p.dietType))];
  const filtered = plans
    .filter(p => selectedDiet === "all" || p.dietType === selectedDiet)
    .filter(p => {
      const q = search.toLowerCase();
      return !q || p.patientName?.toLowerCase().includes(q) || p.dietType?.toLowerCase().includes(q);
    });

  const restrictedCount = plans.filter(p => p.restrictions).length;

  return (
    <div className="fade-in">
      <div className="page-header">
        <div><h2>Dietary Management</h2><p>Meal plans, allergies, and dietary restrictions for each resident</p></div>
        <button className="btn btn-outline btn-sm" onClick={() => printFullPage()}><Printer size={13} /> Print Kitchen Sheet</button>
      </div>

      {/* Summary */}
      <div className="stat-grid">
        <div className="stat-card" style={{ "--accent-color": "var(--text)" }}>
          <div className="val">{plans.length}</div>
          <div className="label">Meal Plans Active</div>
        </div>
        {dietTypes.map(dt => (
          <div key={dt} className="stat-card" style={{ "--accent-color": DIET_COLORS[dt] || "var(--text-muted)" }}>
            <div className="val">{plans.filter(p => p.dietType === dt).length}</div>
            <div className="label">{dt}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: "14px" }}>
        <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
          <div className="search-box" style={{ marginBottom: 0, flex: 1, minWidth: "200px" }}>
            <Search size={14} />
            <input placeholder="Search resident..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button className={`btn btn-sm ${selectedDiet === "all" ? "btn-primary" : "btn-outline"}`} onClick={() => setSelectedDiet("all")}>All</button>
          {dietTypes.map(dt => (
            <button key={dt} className={`btn btn-sm ${selectedDiet === dt ? "btn-primary" : "btn-outline"}`} onClick={() => setSelectedDiet(dt)}>
              {dt.split("/")[0].trim()}
            </button>
          ))}
        </div>
      </div>

      {/* Diet Cards */}
      {loading ? <div className="loading-box"><span className="spinner" /></div> : (
        filtered.length === 0 ? (
          <div className="card"><div className="empty-state"><UtensilsCrossed size={36} /><div>No dietary plans found</div></div></div>
        ) : (
          filtered.map(plan => (
            <div key={plan.patientId} className="card" style={{ borderLeft: `4px solid ${DIET_COLORS[plan.dietType] || "var(--text-muted)"}` }}>
              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "14px", flexWrap: "wrap", gap: "8px" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    <span style={{ fontWeight: 700, fontSize: "15px", color: "var(--text)" }}>{plan.patientName}</span>
                    <span className="badge" style={{ color: DIET_COLORS[plan.dietType] || "var(--text-muted)" }}>{plan.dietType}</span>
                  </div>
                  <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>Room {plan.room} · {plan.calories} cal/day</p>
                </div>
                {plan.allergies && plan.allergies !== "None" && (
                  <div style={{ background: "var(--danger-light)", padding: "6px 10px", borderRadius: "5px", display: "flex", alignItems: "center", gap: "4px" }}>
                    <AlertTriangle size={12} color="var(--danger)" />
                    <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--danger)" }}>Allergy: {plan.allergies}</span>
                  </div>
                )}
              </div>

              {/* Restrictions */}
              {plan.restrictions && (
                <div style={{ background: "var(--warning-light)", padding: "8px 12px", borderRadius: "5px", marginBottom: "14px" }}>
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--warning)" }}>RESTRICTIONS: </span>
                  <span style={{ fontSize: "12px", color: "var(--warning)" }}>{plan.restrictions}</span>
                </div>
              )}

              {/* Meal Table */}
              <div className="table-wrap">
                <table className="data-table">
                  <thead><tr><th style={{ width: "30%" }}>Meal</th><th>Menu</th></tr></thead>
                  <tbody>
                    {Object.entries(MEAL_LABELS).map(([key, label]) => (
                      plan.meals?.[key] && (
                        <tr key={key}>
                          <td style={{ fontWeight: 600, fontSize: "12px", color: "var(--text)" }}>{label}</td>
                          <td style={{ fontSize: "13px" }}>{plan.meals[key]}</td>
                        </tr>
                      )
                    ))}
                  </tbody>
                </table>
              </div>

              {plan.notes && (
                <div style={{ marginTop: "10px", fontSize: "12px", color: "var(--text-muted)", fontStyle: "italic" }}>
                  <strong>Kitchen Notes:</strong> {plan.notes}
                </div>
              )}
            </div>
          ))
        )
      )}
    </div>
  );
}
