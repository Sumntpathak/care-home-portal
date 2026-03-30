import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { getFamilyUpdates, addFamilyUpdate, getHomeCarePatients } from "../api/sheets";
import { Heart, Plus, X, Search, Send, Bell, MessageCircle, Eye } from "lucide-react";
import { useToast } from "../components/Toast";

const TYPE_COLORS = {
  "Daily Update": { bg: "var(--info-light)", color: "var(--info)" },
  "Medical Update": { bg: "var(--purple-light)", color: "var(--purple)" },
  "Incident Notification": { bg: "var(--danger-light)", color: "var(--danger)" },
  "Behavioral Update": { bg: "var(--warning-light)", color: "var(--warning)" },
  "Milestone": { bg: "var(--success-light)", color: "var(--success)" },
};

export default function FamilyPortal() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [updates, setUpdates] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filterPatient, setFilterPatient] = useState("all");
  const [form, setForm] = useState({
    patientId: "", patientName: "", type: "Daily Update", message: "", postedBy: user?.name || "",
  });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const load = () => {
    setLoading(true);
    Promise.all([getFamilyUpdates(), getHomeCarePatients()])
      .then(([upd, pts]) => {
        setUpdates(Array.isArray(upd) ? upd : upd.data || []);
        setPatients(Array.isArray(pts) ? pts : pts.data || []);
      })
      .catch(() => addToast("Failed to load family updates.", "error"))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.message || !form.patientName) return;
    setSaving(true);
    try {
      await addFamilyUpdate(form);
      setShowForm(false);
      setForm({ patientId: "", patientName: "", type: "Daily Update", message: "", postedBy: user?.name || "" });
      load();
    } catch { addToast("Failed to post family update.", "error"); } finally { setSaving(false); }
  };

  const filtered = filterPatient === "all" ? updates : updates.filter(u => u.patientId === filterPatient);
  const unread = updates.filter(u => !u.readByFamily).length;

  return (
    <div className="fade-in">
      <div className="page-header">
        <div><h2>Family Updates</h2><p>Communication portal for resident families</p></div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}><Send size={13} /> Post Update</button>
      </div>

      {/* Stats */}
      <div className="stat-grid">
        <div className="stat-card" style={{ "--accent-color": "var(--text)" }}>
          <div className="val">{updates.length}</div>
          <div className="label">Total Updates</div>
        </div>
        <div className="stat-card" style={{ "--accent-color": "var(--warning)" }}>
          <div className="val">{unread}</div>
          <div className="label">Unread by Family</div>
        </div>
        <div className="stat-card" style={{ "--accent-color": "var(--success)" }}>
          <div className="val">{updates.filter(u => u.date === new Date().toISOString().split("T")[0]).length}</div>
          <div className="label">Posted Today</div>
        </div>
      </div>

      {/* New Update Form */}
      {showForm && (
        <div className="card" style={{ border: "2px solid var(--text)", marginBottom: "16px" }}>
          <div className="card-header">
            <h3><MessageCircle size={15} style={{ marginRight: 4 }} /> Post Family Update</h3>
            <button className="btn-icon" onClick={() => setShowForm(false)}><X size={15} /></button>
          </div>
          <form onSubmit={handleSubmit} className="form-grid">
            <div className="form-row">
              <div className="field"><label>Resident <span className="req">*</span></label>
                <select value={form.patientId} onChange={e => {
                  const p = patients.find(p => p.id === e.target.value);
                  set("patientId", e.target.value);
                  set("patientName", p?.name || "");
                }}>
                  <option value="">— Select Resident —</option>
                  {patients.map(p => <option key={p.id} value={p.id}>{p.name} (Room {p.room})</option>)}
                </select>
              </div>
              <div className="field"><label>Update Type</label>
                <select value={form.type} onChange={e => set("type", e.target.value)}>
                  {Object.keys(TYPE_COLORS).map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div className="field"><label>Message <span className="req">*</span></label>
              <textarea value={form.message} onChange={e => set("message", e.target.value)} rows={4}
                placeholder="Write a caring, informative update for the family. Be specific about how their loved one is doing today..." />
            </div>
            <div className="field"><label>Posted By</label><input value={form.postedBy} onChange={e => set("postedBy", e.target.value)} /></div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? "Posting..." : "Post Update"}</button>
              <button className="btn btn-outline" type="button" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Filter by Patient */}
      <div className="card" style={{ marginBottom: "14px" }}>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)" }}>Filter by resident:</span>
          <button className={`btn btn-sm ${filterPatient === "all" ? "btn-primary" : "btn-outline"}`} onClick={() => setFilterPatient("all")}>All</button>
          {[...new Set(updates.map(u => u.patientId))].map(pid => {
            const name = updates.find(u => u.patientId === pid)?.patientName || pid;
            return (
              <button key={pid} className={`btn btn-sm ${filterPatient === pid ? "btn-primary" : "btn-outline"}`}
                onClick={() => setFilterPatient(pid)}>
                {name.split(" ")[0]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Updates Timeline */}
      {loading ? <div className="loading-box"><span className="spinner" /></div> : (
        filtered.length === 0 ? (
          <div className="card"><div className="empty-state"><Heart size={36} /><div>No family updates yet</div></div></div>
        ) : (
          <div>
            {filtered.map(update => {
              const tc = TYPE_COLORS[update.type] || { bg: "var(--subtle)", color: "var(--text-muted)" };
              return (
                <div key={update.id} className="card" style={{ borderLeft: `4px solid ${tc.color}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "10px", flexWrap: "wrap", gap: "8px" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                        <span style={{ fontWeight: 700, color: "var(--text)" }}>{update.patientName}</span>
                        <span className="badge" style={{ background: tc.bg, color: tc.color }}>{update.type}</span>
                      </div>
                      <div style={{ fontSize: "12px", color: "var(--text-light)" }}>{update.date} · Posted by {update.postedBy}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      {update.readByFamily ? (
                        <span style={{ fontSize: "11px", color: "var(--success)", display: "flex", alignItems: "center", gap: "3px" }}>
                          <Eye size={11} /> Read by family
                        </span>
                      ) : (
                        <span style={{ fontSize: "11px", color: "var(--warning)", display: "flex", alignItems: "center", gap: "3px" }}>
                          <Bell size={11} /> Not yet read
                        </span>
                      )}
                    </div>
                  </div>
                  <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{update.message}</p>
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}
