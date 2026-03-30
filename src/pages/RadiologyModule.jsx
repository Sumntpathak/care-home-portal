/**
 * Radiology / Imaging Module
 * - Order imaging studies
 * - Upload/view results
 * - Track status
 */
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import { Plus, X, Image, Eye, Check, Clock, FileText, Upload } from "lucide-react";

const IMAGING_TYPES = [
  { code: "XRAY", name: "X-Ray", category: "Radiology", bodyParts: ["Chest", "Abdomen", "Spine", "Skull", "Extremities", "Pelvis", "Hand", "Foot", "Knee", "Shoulder"] },
  { code: "USG", name: "Ultrasound", category: "Radiology", bodyParts: ["Abdomen", "Pelvis", "Obstetric", "Thyroid", "Breast", "Musculoskeletal", "Doppler"] },
  { code: "CT", name: "CT Scan", category: "Radiology", bodyParts: ["Brain", "Chest", "Abdomen", "Spine", "Whole Body"] },
  { code: "MRI", name: "MRI", category: "Radiology", bodyParts: ["Brain", "Spine", "Knee", "Shoulder", "Abdomen", "Pelvis"] },
  { code: "ECG", name: "ECG / EKG", category: "Cardiology", bodyParts: ["12-Lead", "Stress Test", "Holter Monitor"] },
  { code: "ECHO", name: "Echocardiogram", category: "Cardiology", bodyParts: ["2D Echo", "Doppler Echo", "Stress Echo"] },
  { code: "DEXA", name: "DEXA Scan", category: "Radiology", bodyParts: ["Spine", "Hip", "Whole Body"] },
];

const STATUS_MAP = {
  Ordered: { bg: "var(--info-light)", color: "var(--info)" },
  Scheduled: { bg: "var(--warning-light)", color: "var(--warning)" },
  Completed: { bg: "var(--success-light)", color: "var(--success)" },
  Reported: { bg: "var(--primary-light)", color: "var(--primary)" },
};

export default function RadiologyModule() {
  const { user, isAdmin, isDoctor } = useAuth();
  const { addToast } = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [viewOrder, setViewOrder] = useState(null);

  useEffect(() => {
    setTimeout(() => {
      setOrders([
        { id: "RAD-A1B2", patientName: "Kamla Devi", patientId: "PAT-0042", type: "XRAY", bodyPart: "Chest", priority: "Routine", status: "Reported", orderedBy: "Dr. Meena Sharma", orderedAt: new Date(Date.now() - 86400000).toISOString(), findings: "Mild cardiomegaly. No pleural effusion. Lung fields clear. No bony abnormality.", impression: "Mild cardiomegaly — correlate with echocardiography.", reportedBy: "Dr. R. Patel (Radiologist)" },
        { id: "RAD-C3D4", patientName: "Rajesh Kumar", patientId: "PAT-0078", type: "USG", bodyPart: "Abdomen", priority: "Urgent", status: "Ordered", orderedBy: "Dr. Anil Gupta", orderedAt: new Date().toISOString(), findings: null, impression: null, reportedBy: null },
      ]);
      setLoading(false);
    }, 300);
  }, []);

  const [form, setForm] = useState({ patientName: "", type: "XRAY", bodyPart: "", priority: "Routine", clinicalHistory: "" });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleOrder = () => {
    if (!form.patientName || !form.bodyPart) return;
    const order = { id: `RAD-${Date.now().toString(36).toUpperCase().slice(-4)}`, ...form, status: "Ordered", orderedBy: user?.name, orderedAt: new Date().toISOString(), findings: null, impression: null, reportedBy: null };
    setOrders(prev => [order, ...prev]);
    setShowNew(false);
    setForm({ patientName: "", type: "XRAY", bodyPart: "", priority: "Routine", clinicalHistory: "" });
    addToast("Imaging order placed.", "success");
  };

  const selectedType = IMAGING_TYPES.find(t => t.code === form.type);

  return (
    <div className="fade-in">
      <div className="page-header">
        <div><h2>Radiology &amp; Imaging</h2><p>Imaging orders, reports &amp; PACS viewer</p></div>
        {(isAdmin || isDoctor) && <button className="btn btn-primary btn-sm" onClick={() => setShowNew(true)}><Plus size={13} /> New Order</button>}
      </div>

      <div className="stat-grid stagger">
        {[["Ordered", orders.filter(o => o.status === "Ordered").length, "var(--info)"], ["Scheduled", orders.filter(o => o.status === "Scheduled").length, "var(--warning)"], ["Completed", orders.filter(o => o.status === "Completed").length, "var(--success)"], ["Reported", orders.filter(o => o.status === "Reported").length, "var(--primary)"]].map(([label, count, color]) => (
          <div key={label} className="stat-card"><div className="val" style={{ color }}>{count}</div><div className="label">{label}</div></div>
        ))}
      </div>

      {showNew && (
        <div className="card" style={{ border: "2px solid var(--text)", marginBottom: 16 }}>
          <div className="card-header"><h3>New Imaging Order</h3><button className="btn-icon" onClick={() => setShowNew(false)}><X size={15} /></button></div>
          <div className="form-grid">
            <div className="form-row">
              <div className="field"><label>Patient Name <span className="req">*</span></label><input value={form.patientName} onChange={e => set("patientName", e.target.value)} /></div>
              <div className="field"><label>Priority</label><select value={form.priority} onChange={e => set("priority", e.target.value)}><option>Routine</option><option>Urgent</option><option>STAT</option></select></div>
            </div>
            <div className="form-row">
              <div className="field"><label>Imaging Type</label><select value={form.type} onChange={e => { set("type", e.target.value); set("bodyPart", ""); }}>{IMAGING_TYPES.map(t => <option key={t.code} value={t.code}>{t.name}</option>)}</select></div>
              <div className="field"><label>Body Part / View <span className="req">*</span></label><select value={form.bodyPart} onChange={e => set("bodyPart", e.target.value)}><option value="">Select...</option>{selectedType?.bodyParts.map(p => <option key={p}>{p}</option>)}</select></div>
            </div>
            <div className="field"><label>Clinical History / Indication</label><textarea value={form.clinicalHistory} onChange={e => set("clinicalHistory", e.target.value)} rows={2} placeholder="Relevant clinical information..." /></div>
            <button className="btn btn-primary" onClick={handleOrder} disabled={!form.patientName || !form.bodyPart}><Image size={13} /> Place Order</button>
          </div>
        </div>
      )}

      {loading ? <div className="loading-box"><span className="spinner" /></div> : (
        <div className="card">
          {orders.length === 0 ? <div className="empty-state"><Image size={36} /><div>No imaging orders</div></div> : orders.map(o => {
            const sc = STATUS_MAP[o.status] || STATUS_MAP.Ordered;
            const typeName = IMAGING_TYPES.find(t => t.code === o.type)?.name || o.type;
            return (
              <div key={o.id} style={{ padding: "14px 16px", borderRadius: 8, marginBottom: 8, background: "var(--subtle)", border: "1px solid var(--border)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontFamily: "monospace", fontSize: 12, fontWeight: 600, color: "var(--text-muted)" }}>{o.id}</span>
                      <span style={{ padding: "2px 8px", borderRadius: 4, background: sc.bg, color: sc.color, fontSize: 11, fontWeight: 600 }}>{o.status}</span>
                      {o.priority !== "Routine" && <span style={{ padding: "2px 8px", borderRadius: 4, background: "var(--danger-light)", color: "var(--danger)", fontSize: 10, fontWeight: 700 }}>{o.priority.toUpperCase()}</span>}
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text)" }}>{o.patientName}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{typeName} — {o.bodyPart}</div>
                    <div style={{ fontSize: 11, color: "var(--text-light)", marginTop: 2 }}>By {o.orderedBy} · {new Date(o.orderedAt).toLocaleString("en-IN")}</div>
                  </div>
                  <div style={{ display: "flex", gap: 4 }}>
                    {o.status === "Ordered" && <button className="btn btn-sm btn-outline" onClick={() => { setOrders(prev => prev.map(x => x.id === o.id ? { ...x, status: "Scheduled" } : x)); addToast("Scheduled.", "info"); }}><Clock size={11} /> Schedule</button>}
                    {o.status === "Reported" && <button className="btn btn-sm btn-success" onClick={() => setViewOrder(o)}><Eye size={11} /> View Report</button>}
                  </div>
                </div>
                {o.status === "Reported" && o.impression && (
                  <div style={{ marginTop: 8, padding: "8px 12px", background: "var(--primary-light)", borderRadius: 6, fontSize: 12, color: "var(--primary)" }}>
                    <strong>Impression:</strong> {o.impression}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {viewOrder && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", backdropFilter: "blur(2px)", zIndex: 1000, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "clamp(16px, 4vw, 40px)", paddingTop: "clamp(24px, 5vh, 60px)", overflowY: "auto" }}>
          <div style={{ background: "var(--surface)", borderRadius: 14, padding: 24, maxWidth: "min(95vw, 700px)", width: "100%", maxHeight: "calc(100vh - 80px)", overflowY: "auto", animation: "modalIn .2s ease-out" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700 }}>Radiology Report — {viewOrder.id}</h3>
              <button className="btn-icon" onClick={() => setViewOrder(null)}><X size={15} /></button>
            </div>
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 12 }}>{viewOrder.patientName} · {IMAGING_TYPES.find(t => t.code === viewOrder.type)?.name} — {viewOrder.bodyPart}</div>
            {viewOrder.findings && <div style={{ marginBottom: 12 }}><div style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>Findings:</div><div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7 }}>{viewOrder.findings}</div></div>}
            {viewOrder.impression && <div style={{ padding: "10px 14px", background: "var(--primary-light)", borderRadius: 8, marginBottom: 12 }}><div style={{ fontSize: 12, fontWeight: 700, color: "var(--primary)", marginBottom: 4 }}>Impression:</div><div style={{ fontSize: 13, color: "var(--text)" }}>{viewOrder.impression}</div></div>}
            {viewOrder.reportedBy && <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Reported by: {viewOrder.reportedBy}</div>}
          </div>
        </div>
      )}
    </div>
  );
}
