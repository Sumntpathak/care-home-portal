/**
 * Lab / LIMS Module
 * Laboratory Information Management System
 * - Order lab tests
 * - Track sample collection & processing
 * - Enter results with reference ranges
 * - Flag abnormal values
 * - Print lab reports
 */
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import { Plus, X, Search, Printer, FlaskConical, Check, Clock, AlertTriangle, FileText, RefreshCw } from "lucide-react";
import DataTable from "../components/DataTable";

// Common lab tests with reference ranges
const LAB_TESTS = {
  "CBC": {
    name: "Complete Blood Count",
    category: "Hematology",
    parameters: [
      { name: "Hemoglobin", unit: "g/dL", refRange: "12.0-17.5", refMin: 12.0, refMax: 17.5 },
      { name: "WBC", unit: "\u00d710\u00b3/\u00b5L", refRange: "4.5-11.0", refMin: 4.5, refMax: 11.0 },
      { name: "Platelets", unit: "\u00d710\u00b3/\u00b5L", refRange: "150-400", refMin: 150, refMax: 400 },
      { name: "RBC", unit: "\u00d710\u2076/\u00b5L", refRange: "4.5-5.5", refMin: 4.5, refMax: 5.5 },
      { name: "Hematocrit", unit: "%", refRange: "36-54", refMin: 36, refMax: 54 },
      { name: "MCV", unit: "fL", refRange: "80-100", refMin: 80, refMax: 100 },
      { name: "MCH", unit: "pg", refRange: "27-33", refMin: 27, refMax: 33 },
      { name: "ESR", unit: "mm/hr", refRange: "0-20", refMin: 0, refMax: 20 },
    ],
    tat: "4 hours",
  },
  "LFT": {
    name: "Liver Function Test",
    category: "Biochemistry",
    parameters: [
      { name: "Total Bilirubin", unit: "mg/dL", refRange: "0.1-1.2", refMin: 0.1, refMax: 1.2 },
      { name: "Direct Bilirubin", unit: "mg/dL", refRange: "0.0-0.3", refMin: 0.0, refMax: 0.3 },
      { name: "SGOT (AST)", unit: "U/L", refRange: "5-40", refMin: 5, refMax: 40 },
      { name: "SGPT (ALT)", unit: "U/L", refRange: "7-56", refMin: 7, refMax: 56 },
      { name: "ALP", unit: "U/L", refRange: "44-147", refMin: 44, refMax: 147 },
      { name: "Total Protein", unit: "g/dL", refRange: "6.0-8.3", refMin: 6.0, refMax: 8.3 },
      { name: "Albumin", unit: "g/dL", refRange: "3.5-5.0", refMin: 3.5, refMax: 5.0 },
    ],
    tat: "6 hours",
  },
  "KFT": {
    name: "Kidney Function Test",
    category: "Biochemistry",
    parameters: [
      { name: "Blood Urea", unit: "mg/dL", refRange: "7-20", refMin: 7, refMax: 20 },
      { name: "Serum Creatinine", unit: "mg/dL", refRange: "0.6-1.2", refMin: 0.6, refMax: 1.2 },
      { name: "eGFR", unit: "mL/min", refRange: ">90", refMin: 90, refMax: 999 },
      { name: "Uric Acid", unit: "mg/dL", refRange: "3.5-7.2", refMin: 3.5, refMax: 7.2 },
      { name: "Sodium", unit: "mEq/L", refRange: "136-145", refMin: 136, refMax: 145 },
      { name: "Potassium", unit: "mEq/L", refRange: "3.5-5.0", refMin: 3.5, refMax: 5.0 },
      { name: "Chloride", unit: "mEq/L", refRange: "98-106", refMin: 98, refMax: 106 },
    ],
    tat: "6 hours",
  },
  "LIPID": {
    name: "Lipid Profile",
    category: "Biochemistry",
    parameters: [
      { name: "Total Cholesterol", unit: "mg/dL", refRange: "<200", refMin: 0, refMax: 200 },
      { name: "HDL Cholesterol", unit: "mg/dL", refRange: ">40", refMin: 40, refMax: 999 },
      { name: "LDL Cholesterol", unit: "mg/dL", refRange: "<100", refMin: 0, refMax: 100 },
      { name: "Triglycerides", unit: "mg/dL", refRange: "<150", refMin: 0, refMax: 150 },
      { name: "VLDL", unit: "mg/dL", refRange: "5-40", refMin: 5, refMax: 40 },
    ],
    tat: "6 hours",
  },
  "THYROID": {
    name: "Thyroid Function Test",
    category: "Endocrinology",
    parameters: [
      { name: "TSH", unit: "\u00b5IU/mL", refRange: "0.4-4.0", refMin: 0.4, refMax: 4.0 },
      { name: "Free T3", unit: "pg/mL", refRange: "2.3-4.2", refMin: 2.3, refMax: 4.2 },
      { name: "Free T4", unit: "ng/dL", refRange: "0.8-1.8", refMin: 0.8, refMax: 1.8 },
    ],
    tat: "12 hours",
  },
  "HBA1C": {
    name: "Glycosylated Hemoglobin",
    category: "Diabetology",
    parameters: [
      { name: "HbA1c", unit: "%", refRange: "<5.7", refMin: 0, refMax: 5.7 },
      { name: "Estimated Avg Glucose", unit: "mg/dL", refRange: "<117", refMin: 0, refMax: 117 },
    ],
    tat: "24 hours",
  },
  "URINE": {
    name: "Urine Routine & Microscopy",
    category: "Clinical Pathology",
    parameters: [
      { name: "Color", unit: "", refRange: "Pale Yellow", refMin: null, refMax: null },
      { name: "pH", unit: "", refRange: "4.5-8.0", refMin: 4.5, refMax: 8.0 },
      { name: "Specific Gravity", unit: "", refRange: "1.005-1.030", refMin: 1.005, refMax: 1.030 },
      { name: "Protein", unit: "", refRange: "Nil", refMin: null, refMax: null },
      { name: "Glucose", unit: "", refRange: "Nil", refMin: null, refMax: null },
      { name: "Pus Cells", unit: "/hpf", refRange: "0-5", refMin: 0, refMax: 5 },
      { name: "RBC", unit: "/hpf", refRange: "0-2", refMin: 0, refMax: 2 },
    ],
    tat: "2 hours",
  },
  "BLOOD_SUGAR": {
    name: "Blood Sugar (FBS/PPBS/RBS)",
    category: "Biochemistry",
    parameters: [
      { name: "Fasting Blood Sugar", unit: "mg/dL", refRange: "70-100", refMin: 70, refMax: 100 },
      { name: "Post Prandial Blood Sugar", unit: "mg/dL", refRange: "<140", refMin: 0, refMax: 140 },
    ],
    tat: "2 hours",
  },
};

const SAMPLE_TYPES = ["Blood (EDTA)", "Blood (Serum)", "Blood (Citrate)", "Urine", "Stool", "Sputum", "Swab", "CSF", "Other"];

const STATUS_COLORS = {
  Ordered: { bg: "var(--info-light)", color: "var(--info)" },
  "Sample Collected": { bg: "var(--warning-light)", color: "var(--warning)" },
  Processing: { bg: "var(--purple-light)", color: "var(--purple)" },
  Completed: { bg: "var(--success-light)", color: "var(--success)" },
  Cancelled: { bg: "var(--danger-light)", color: "var(--danger)" },
};

function flagValue(value, param) {
  if (param.refMin == null || param.refMax == null) return "normal";
  const v = parseFloat(value);
  if (isNaN(v)) return "normal";
  if (v < param.refMin * 0.7 || v > param.refMax * 1.5) return "critical";
  if (v < param.refMin || v > param.refMax) return "abnormal";
  return "normal";
}

function flagColor(flag) {
  if (flag === "critical") return { bg: "#fef2f2", color: "#dc2626", symbol: "\u2191\u2191" };
  if (flag === "abnormal") return { bg: "#fffbeb", color: "#d97706", symbol: "\u2191" };
  return { bg: "#ecfdf5", color: "#15803d", symbol: "" };
}

// ── New Order Modal ──
function NewOrderModal({ onClose, onSave }) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    patientName: "", patientId: "", tests: [], sampleType: SAMPLE_TYPES[0], priority: "Routine", notes: "", orderedBy: user?.name || "",
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const toggleTest = (key) => {
    setForm(p => ({
      ...p,
      tests: p.tests.includes(key) ? p.tests.filter(t => t !== key) : [...p.tests, key],
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.patientName) return;
    if (form.tests.length === 0) return;
    setSaving(true);
    await onSave({
      ...form,
      id: `LAB-${Date.now().toString(36).toUpperCase()}`,
      status: "Ordered",
      orderedAt: new Date().toISOString(),
      results: null,
    });
    setSaving(false);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", backdropFilter: "blur(2px)", zIndex: 1000, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "clamp(16px, 4vw, 40px)", paddingTop: "clamp(24px, 5vh, 60px)", overflowY: "auto" }}>
      <div style={{ background: "var(--surface)", borderRadius: 14, padding: 24, maxWidth: "min(95vw, 600px)", width: "100%", maxHeight: "calc(100vh - 80px)", overflowY: "auto", boxShadow: "0 12px 48px rgba(0,0,0,.2)", animation: "modalIn .2s ease-out" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700 }}>New Lab Order</h3>
          <button className="btn-icon" onClick={onClose}><X size={15} /></button>
        </div>

        <form onSubmit={handleSave} className="form-grid">
          <div className="form-row">
            <div className="field"><label>Patient Name <span className="req">*</span></label><input value={form.patientName} onChange={e => set("patientName", e.target.value)} placeholder="Full name" /></div>
            <div className="field"><label>Patient ID</label><input value={form.patientId} onChange={e => set("patientId", e.target.value)} placeholder="PAT-XXXX" /></div>
          </div>

          <div className="field">
            <label>Select Tests <span className="req">*</span></label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {Object.entries(LAB_TESTS).map(([key, test]) => (
                <button key={key} type="button" onClick={() => toggleTest(key)}
                  style={{
                    padding: "6px 12px", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer",
                    background: form.tests.includes(key) ? "var(--primary)" : "var(--subtle)",
                    color: form.tests.includes(key) ? "#fff" : "var(--text-secondary)",
                    border: form.tests.includes(key) ? "1px solid var(--primary)" : "1px solid var(--border)",
                  }}>
                  {form.tests.includes(key) && <Check size={11} style={{ marginRight: 4 }} />}
                  {key} — {test.name}
                </button>
              ))}
            </div>
          </div>

          <div className="form-row">
            <div className="field">
              <label>Sample Type</label>
              <select value={form.sampleType} onChange={e => set("sampleType", e.target.value)}>
                {SAMPLE_TYPES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Priority</label>
              <select value={form.priority} onChange={e => set("priority", e.target.value)}>
                <option>Routine</option><option>Urgent</option><option>STAT</option>
              </select>
            </div>
          </div>

          <div className="field"><label>Clinical Notes</label><textarea value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Relevant clinical information..." rows={2} /></div>

          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-primary" type="submit" disabled={saving || !form.patientName || form.tests.length === 0}>
              {saving ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <><FlaskConical size={13} /> Place Order</>}
            </button>
            <button className="btn btn-outline" type="button" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Result Entry Modal ──
function ResultEntryModal({ order, onClose, onSave }) {
  const [results, setResults] = useState(() => {
    const r = {};
    order.tests.forEach(testKey => {
      const test = LAB_TESTS[testKey];
      if (test) {
        test.parameters.forEach(p => {
          r[`${testKey}_${p.name}`] = order.results?.[`${testKey}_${p.name}`] || "";
        });
      }
    });
    return r;
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave(order.id, results);
    setSaving(false);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", backdropFilter: "blur(2px)", zIndex: 1000, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "clamp(16px, 4vw, 40px)", paddingTop: "clamp(24px, 5vh, 60px)", overflowY: "auto" }}>
      <div style={{ background: "var(--surface)", borderRadius: 14, padding: 24, maxWidth: "min(95vw, 700px)", width: "100%", maxHeight: "calc(100vh - 80px)", overflowY: "auto", boxShadow: "0 12px 48px rgba(0,0,0,.2)", animation: "modalIn .2s ease-out" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700 }}>Enter Results — {order.id}</h3>
            <p style={{ fontSize: 12, color: "var(--text-muted)" }}>{order.patientName} · {order.tests.map(t => LAB_TESTS[t]?.name || t).join(", ")}</p>
          </div>
          <button className="btn-icon" onClick={onClose}><X size={15} /></button>
        </div>

        {order.tests.map(testKey => {
          const test = LAB_TESTS[testKey];
          if (!test) return null;
          return (
            <div key={testKey} style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 8, padding: "6px 10px", background: "var(--subtle)", borderRadius: 6 }}>
                {test.name} ({testKey})
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 100px 80px", gap: "4px 8px", fontSize: 12, alignItems: "center" }}>
                <div style={{ fontWeight: 600, color: "var(--text-muted)" }}>Parameter</div>
                <div style={{ fontWeight: 600, color: "var(--text-muted)" }}>Result</div>
                <div style={{ fontWeight: 600, color: "var(--text-muted)" }}>Ref Range</div>
                <div style={{ fontWeight: 600, color: "var(--text-muted)" }}>Flag</div>
                {test.parameters.map(p => {
                  const key = `${testKey}_${p.name}`;
                  const val = results[key];
                  const flag = val ? flagValue(val, p) : "normal";
                  const fc = flagColor(flag);
                  return [
                    <div key={`${key}-name`} style={{ fontSize: 12, color: "var(--text)" }}>{p.name} {p.unit && <span style={{ color: "var(--text-muted)" }}>({p.unit})</span>}</div>,
                    <input key={`${key}-input`} value={val} onChange={e => setResults(r => ({ ...r, [key]: e.target.value }))}
                      style={{ padding: "4px 8px", borderRadius: 4, border: "1px solid var(--border)", fontSize: 13, fontWeight: 600, width: "100%" }} />,
                    <div key={`${key}-ref`} style={{ fontSize: 11, color: "var(--text-muted)" }}>{p.refRange}</div>,
                    <div key={`${key}-flag`} style={{ padding: "2px 8px", borderRadius: 4, background: fc.bg, color: fc.color, fontSize: 11, fontWeight: 600, textAlign: "center" }}>
                      {flag === "normal" ? "Normal" : flag === "abnormal" ? `Abnormal ${fc.symbol}` : `Critical ${fc.symbol}`}
                    </div>,
                  ];
                })}
              </div>
            </div>
          );
        })}

        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <><Check size={13} /> Save Results</>}
          </button>
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ── Report View Modal ──
function ReportModal({ order, onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", backdropFilter: "blur(2px)", zIndex: 1000, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "clamp(16px, 4vw, 40px)", paddingTop: "clamp(24px, 5vh, 60px)", overflowY: "auto" }}>
      <div style={{ background: "#fff", borderRadius: 14, padding: 24, maxWidth: "min(95vw, 800px)", width: "100%", maxHeight: "calc(100vh - 80px)", overflowY: "auto", boxShadow: "0 12px 48px rgba(0,0,0,.2)", animation: "modalIn .2s ease-out" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#111" }}>Lab Report — {order.id}</h3>
            <p style={{ fontSize: 12, color: "#6b7280" }}>{order.patientName} · {new Date(order.orderedAt).toLocaleDateString("en-IN")}</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-outline btn-sm" onClick={() => window.print()}><Printer size={12} /> Print</button>
            <button className="btn-icon" onClick={onClose}><X size={15} /></button>
          </div>
        </div>

        {order.tests.map(testKey => {
          const test = LAB_TESTS[testKey];
          if (!test) return null;
          const hasAbnormal = test.parameters.some(p => {
            const val = order.results?.[`${testKey}_${p.name}`];
            return val && flagValue(val, p) !== "normal";
          });

          return (
            <div key={testKey} style={{ marginBottom: 16, border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden" }}>
              <div style={{ padding: "10px 14px", background: hasAbnormal ? "#fef2f2" : "#f9fafb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: "#111" }}>{test.name}</div>
                <span style={{ fontSize: 11, color: "#6b7280" }}>{test.category}</span>
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ background: "#f9fafb" }}>
                    <th style={{ padding: "8px 14px", textAlign: "left", fontWeight: 600, color: "#6b7280" }}>Parameter</th>
                    <th style={{ padding: "8px 14px", textAlign: "center", fontWeight: 600, color: "#6b7280" }}>Result</th>
                    <th style={{ padding: "8px 14px", textAlign: "center", fontWeight: 600, color: "#6b7280" }}>Unit</th>
                    <th style={{ padding: "8px 14px", textAlign: "center", fontWeight: 600, color: "#6b7280" }}>Reference</th>
                    <th style={{ padding: "8px 14px", textAlign: "center", fontWeight: 600, color: "#6b7280" }}>Flag</th>
                  </tr>
                </thead>
                <tbody>
                  {test.parameters.map(p => {
                    const val = order.results?.[`${testKey}_${p.name}`] || "\u2014";
                    const flag = val !== "\u2014" ? flagValue(val, p) : "normal";
                    const fc = flagColor(flag);
                    return (
                      <tr key={p.name} style={{ borderTop: "1px solid #f3f4f6", background: flag !== "normal" ? fc.bg : "#fff" }}>
                        <td style={{ padding: "8px 14px", color: "#111" }}>{p.name}</td>
                        <td style={{ padding: "8px 14px", textAlign: "center", fontWeight: 700, color: fc.color }}>{val} {fc.symbol}</td>
                        <td style={{ padding: "8px 14px", textAlign: "center", color: "#6b7280" }}>{p.unit}</td>
                        <td style={{ padding: "8px 14px", textAlign: "center", color: "#6b7280" }}>{p.refRange}</td>
                        <td style={{ padding: "8px 14px", textAlign: "center" }}>
                          <span style={{ padding: "2px 8px", borderRadius: 4, background: fc.bg, color: fc.color, fontSize: 10, fontWeight: 700 }}>
                            {flag === "normal" ? "Normal" : flag === "abnormal" ? "Abnormal" : "CRITICAL"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })}

        {order.notes && (
          <div style={{ padding: "10px 14px", background: "#f9fafb", borderRadius: 8, fontSize: 12, color: "#374151", marginBottom: 12 }}>
            <strong>Clinical Notes:</strong> {order.notes}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Lab Module Page ──
export default function LabModule() {
  const { user, isAdmin, isDoctor } = useAuth();
  const { addToast } = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all");
  const [showNewOrder, setShowNewOrder] = useState(false);
  const [resultEntry, setResultEntry] = useState(null);
  const [reportView, setReportView] = useState(null);

  // In demo mode, use local state. In production, wire to API.
  useEffect(() => {
    // Simulate loading demo data
    setTimeout(() => {
      setOrders([
        {
          id: "LAB-M1A2B3", patientName: "Kamla Devi", patientId: "PAT-0042",
          tests: ["CBC", "KFT", "BLOOD_SUGAR"], sampleType: "Blood (EDTA)", priority: "Routine",
          notes: "CKD Stage 3 \u2014 monitor creatinine and eGFR", orderedBy: "Dr. Meena Sharma",
          status: "Completed", orderedAt: new Date().toISOString(),
          results: {
            "CBC_Hemoglobin": "10.2", "CBC_WBC": "7.8", "CBC_Platelets": "185",
            "CBC_RBC": "3.9", "CBC_Hematocrit": "32", "CBC_MCV": "82", "CBC_MCH": "26", "CBC_ESR": "28",
            "KFT_Blood Urea": "38", "KFT_Serum Creatinine": "2.1", "KFT_eGFR": "42",
            "KFT_Uric Acid": "7.8", "KFT_Sodium": "138", "KFT_Potassium": "5.2", "KFT_Chloride": "101",
            "BLOOD_SUGAR_Fasting Blood Sugar": "142", "BLOOD_SUGAR_Post Prandial Blood Sugar": "210",
          },
        },
        {
          id: "LAB-X4Y5Z6", patientName: "Rajesh Kumar", patientId: "PAT-0078",
          tests: ["LIPID", "THYROID"], sampleType: "Blood (Serum)", priority: "Urgent",
          notes: "Annual screening", orderedBy: "Dr. Meena Sharma",
          status: "Sample Collected", orderedAt: new Date(Date.now() - 3600000).toISOString(),
          results: null,
        },
        {
          id: "LAB-P7Q8R9", patientName: "Sunita Verma", patientId: "PAT-0103",
          tests: ["HBA1C", "LFT"], sampleType: "Blood (EDTA)", priority: "Routine",
          notes: "Diabetic + hepatic steatosis follow-up", orderedBy: "Dr. Anil Gupta",
          status: "Processing", orderedAt: new Date(Date.now() - 7200000).toISOString(),
          results: null,
        },
      ]);
      setLoading(false);
    }, 300);
  }, []);

  const handleNewOrder = async (order) => {
    setOrders(prev => [order, ...prev]);
    setShowNewOrder(false);
    addToast("Lab order placed successfully.", "success");
  };

  const handleResultSave = async (orderId, results) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, results, status: "Completed" } : o));
    setResultEntry(null);
    addToast("Results saved. Report is ready.", "success");
  };

  const updateStatus = (orderId, status) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
    addToast(`Status updated to "${status}".`, "info");
  };

  // Filter
  const filtered = tab === "all" ? orders : orders.filter(o => o.status === tab);

  // Stats
  const ordered = orders.filter(o => o.status === "Ordered").length;
  const collected = orders.filter(o => o.status === "Sample Collected").length;
  const processing = orders.filter(o => o.status === "Processing").length;
  const completed = orders.filter(o => o.status === "Completed").length;

  return (
    <div className="fade-in">
      {showNewOrder && <NewOrderModal onClose={() => setShowNewOrder(false)} onSave={handleNewOrder} />}
      {resultEntry && <ResultEntryModal order={resultEntry} onClose={() => setResultEntry(null)} onSave={handleResultSave} />}
      {reportView && <ReportModal order={reportView} onClose={() => setReportView(null)} />}

      <div className="page-header">
        <div>
          <h2>Laboratory / LIMS</h2>
          <p>Lab orders, sample tracking &amp; result management</p>
        </div>
        {(isAdmin || isDoctor) && (
          <button className="btn btn-primary btn-sm" onClick={() => setShowNewOrder(true)}>
            <Plus size={13} /> New Lab Order
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="stat-grid stagger">
        <div className="stat-card" onClick={() => setTab("Ordered")} style={{ cursor: "pointer" }}>
          <div className="stat-icon" style={{ background: "var(--info-light)" }}><FlaskConical size={20} color="var(--info)" /></div>
          <div className="label">Ordered</div>
          <div className="val">{ordered}</div>
        </div>
        <div className="stat-card" onClick={() => setTab("Sample Collected")} style={{ cursor: "pointer" }}>
          <div className="stat-icon" style={{ background: "var(--warning-light)" }}><Clock size={20} color="var(--warning)" /></div>
          <div className="label">Collected</div>
          <div className="val">{collected}</div>
        </div>
        <div className="stat-card" onClick={() => setTab("Processing")} style={{ cursor: "pointer" }}>
          <div className="stat-icon" style={{ background: "var(--purple-light)" }}><RefreshCw size={20} color="var(--purple)" /></div>
          <div className="label">Processing</div>
          <div className="val">{processing}</div>
        </div>
        <div className="stat-card" onClick={() => setTab("Completed")} style={{ cursor: "pointer" }}>
          <div className="stat-icon" style={{ background: "var(--success-light)" }}><Check size={20} color="var(--success)" /></div>
          <div className="label">Completed</div>
          <div className="val">{completed}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tab-bar" style={{ marginBottom: 14 }}>
        {[["all", `All (${orders.length})`], ["Ordered", `Ordered (${ordered})`], ["Sample Collected", `Collected (${collected})`], ["Processing", `Processing (${processing})`], ["Completed", `Completed (${completed})`]].map(([key, label]) => (
          <button key={key} className={`tab-btn ${tab === key ? "active" : ""}`} onClick={() => setTab(key)}>{label}</button>
        ))}
      </div>

      {/* Orders List */}
      {loading ? <div className="loading-box"><span className="spinner" /></div> : (
        <div className="card">
          {filtered.length === 0 ? (
            <div className="empty-state"><FlaskConical size={36} /><div>No lab orders</div></div>
          ) : (
            filtered.map(order => {
              const sc = STATUS_COLORS[order.status] || STATUS_COLORS.Ordered;
              const hasAbnormal = order.results && order.tests.some(testKey => {
                const test = LAB_TESTS[testKey];
                return test?.parameters.some(p => {
                  const val = order.results[`${testKey}_${p.name}`];
                  return val && flagValue(val, p) !== "normal";
                });
              });

              return (
                <div key={order.id} style={{ padding: "14px 16px", borderRadius: 8, marginBottom: 8, background: "var(--subtle)", border: `1px solid var(--border)` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span style={{ fontFamily: "monospace", fontSize: 12, fontWeight: 600, color: "var(--text-muted)" }}>{order.id}</span>
                        <span style={{ padding: "2px 8px", borderRadius: 4, background: sc.bg, color: sc.color, fontSize: 11, fontWeight: 600 }}>{order.status}</span>
                        {order.priority === "STAT" && <span style={{ padding: "2px 8px", borderRadius: 4, background: "var(--danger-light)", color: "var(--danger)", fontSize: 10, fontWeight: 700 }}>STAT</span>}
                        {order.priority === "Urgent" && <span style={{ padding: "2px 8px", borderRadius: 4, background: "var(--warning-light)", color: "var(--warning)", fontSize: 10, fontWeight: 700 }}>URGENT</span>}
                        {hasAbnormal && <span style={{ padding: "2px 8px", borderRadius: 4, background: "#fef2f2", color: "#dc2626", fontSize: 10, fontWeight: 700 }}>ABNORMAL</span>}
                      </div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text)", marginBottom: 2 }}>{order.patientName}</div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                        {order.tests.map(t => LAB_TESTS[t]?.name || t).join(" \u00b7 ")}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--text-light)", marginTop: 4 }}>
                        Ordered by {order.orderedBy} \u00b7 {new Date(order.orderedAt).toLocaleString("en-IN")}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                      {order.status === "Ordered" && (
                        <button className="btn btn-sm btn-outline" onClick={() => updateStatus(order.id, "Sample Collected")}>
                          <Check size={11} /> Collect Sample
                        </button>
                      )}
                      {order.status === "Sample Collected" && (
                        <button className="btn btn-sm btn-outline" onClick={() => updateStatus(order.id, "Processing")}>
                          <RefreshCw size={11} /> Start Processing
                        </button>
                      )}
                      {(order.status === "Processing" || (order.status === "Sample Collected")) && (
                        <button className="btn btn-sm btn-primary" onClick={() => setResultEntry(order)}>
                          <FileText size={11} /> Enter Results
                        </button>
                      )}
                      {order.status === "Completed" && order.results && (
                        <button className="btn btn-sm btn-success" onClick={() => setReportView(order)}>
                          <FileText size={11} /> View Report
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
