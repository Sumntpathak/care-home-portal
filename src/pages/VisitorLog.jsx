import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { getVisitors, addVisitor, checkOutVisitor, getHomeCarePatients } from "../api/sheets";
import { UserCheck, Plus, X, Search, LogOut, Clock } from "lucide-react";
import { useToast } from "../components/Toast";


export default function VisitorLog() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [visitors, setVisitors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split("T")[0]);
  const [form, setForm] = useState({
    visitorName: "", relationship: "", patient: "", patientName: "",
    phone: "", purpose: "Regular Visit",
    timeIn: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false }),
    healthScreening: "Passed", temperature: "", notes: "",
  });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const load = () => {
    setLoading(true);
    Promise.all([getVisitors(), getHomeCarePatients()])
      .then(([vis, pts]) => {
        setVisitors(Array.isArray(vis) ? vis : vis.data || []);
        setPatients(Array.isArray(pts) ? pts : pts.data || []);
      })
      .catch(() => addToast("Failed to load visitors.", "error"))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.visitorName || !form.patientName) return;
    setSaving(true);
    try {
      await addVisitor({ ...form, date: dateFilter, badge: `V-${Date.now().toString().slice(-3)}` });
      setShowForm(false);
      load();
    } catch { addToast("Failed to check in visitor.", "error"); } finally { setSaving(false); }
  };

  const handleCheckOut = async (id) => {
    await checkOutVisitor(id);
    load();
  };

  const filtered = visitors
    .filter(v => !dateFilter || v.date === dateFilter)
    .filter(v => {
      const q = search.toLowerCase();
      return !q || v.visitorName?.toLowerCase().includes(q) || v.patientName?.toLowerCase().includes(q);
    });

  const currentlyIn = visitors.filter(v => v.date === new Date().toISOString().split("T")[0] && !v.timeOut).length;

  return (
    <div className="fade-in">
      <div className="page-header">
        <div><h2>Visitor Log</h2><p>Track visitors, health screening, and check-in/out</p></div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}><Plus size={13} /> Check In Visitor</button>
        </div>
      </div>

      {/* Stats */}
      <div className="stat-grid">
        <div className="stat-card" style={{ "--accent-color": "var(--text)" }}>
          <div className="val">{filtered.length}</div>
          <div className="label">Total Visitors Today</div>
        </div>
        <div className="stat-card" style={{ "--accent-color": "var(--success)" }}>
          <div className="val">{currentlyIn}</div>
          <div className="label">Currently Inside</div>
        </div>
        <div className="stat-card" style={{ "--accent-color": "var(--info)" }}>
          <div className="val">{filtered.filter(v => v.timeOut).length}</div>
          <div className="label">Checked Out</div>
        </div>
      </div>

      {/* Check-In Form */}
      {showForm && (
        <div className="card" style={{ border: "2px solid var(--text)", marginBottom: "16px" }}>
          <div className="card-header">
            <h3>Check In Visitor</h3>
            <button className="btn-icon" onClick={() => setShowForm(false)}><X size={15} /></button>
          </div>
          <form onSubmit={handleSubmit} className="form-grid">
            <div className="form-row">
              <div className="field"><label>Visitor Name <span className="req">*</span></label><input value={form.visitorName} onChange={e => set("visitorName", e.target.value)} /></div>
              <div className="field"><label>Phone</label><input value={form.phone} onChange={e => set("phone", e.target.value)} /></div>
            </div>
            <div className="form-row">
              <div className="field"><label>Visiting Resident <span className="req">*</span></label>
                <select value={form.patient} onChange={e => {
                  const p = patients.find(p => p.id === e.target.value);
                  set("patient", e.target.value);
                  set("patientName", p?.name || "");
                }}>
                  <option value="">— Select Resident —</option>
                  {patients.map(p => <option key={p.id} value={p.id}>{p.name} (Room {p.room})</option>)}
                </select>
              </div>
              <div className="field"><label>Relationship</label>
                <select value={form.relationship} onChange={e => set("relationship", e.target.value)}>
                  <option value="">Select...</option>
                  {["Son", "Daughter", "Spouse", "Grandchild", "Sibling", "Friend", "Other"].map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row3">
              <div className="field"><label>Time In</label><input type="time" value={form.timeIn} onChange={e => set("timeIn", e.target.value)} /></div>
              <div className="field"><label>Purpose</label>
                <select value={form.purpose} onChange={e => set("purpose", e.target.value)}>
                  {["Regular Visit", "Medical Update", "Brought Supplies", "Doctor Consultation", "Administrative", "Other"].map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div className="field"><label>Temperature (°F)</label><input value={form.temperature} onChange={e => set("temperature", e.target.value)} placeholder="98.6" /></div>
            </div>
            <div className="form-row">
              <div className="field"><label>Health Screening</label>
                <select value={form.healthScreening} onChange={e => set("healthScreening", e.target.value)}>
                  <option>Passed</option><option>Failed — Entry Denied</option>
                </select>
              </div>
              <div className="field"><label>Notes</label><input value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Brought food, supplies, etc." /></div>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? "Saving..." : "Check In"}</button>
              <button className="btn btn-outline" type="button" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="card" style={{ marginBottom: "14px" }}>
        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          <div className="field" style={{ marginBottom: 0 }}>
            <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} style={{ padding: "7px 10px" }} />
          </div>
          <div className="search-box" style={{ marginBottom: 0, flex: 1, minWidth: "200px" }}>
            <Search size={14} />
            <input placeholder="Search visitor or resident..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Visitor List */}
      <div className="card">
        {loading ? <div className="loading-box"><span className="spinner" /></div> : (
          filtered.length === 0 ? (
            <div className="empty-state"><UserCheck size={36} /><div>No visitors recorded</div></div>
          ) : (
            <div className="table-wrap">
              <table className="data-table resp-cards">
                <thead><tr>
                  <th>Visitor</th><th>Visiting</th><th>Relationship</th><th>In</th><th>Out</th><th>Purpose</th><th>Screening</th><th>Actions</th>
                </tr></thead>
                <tbody>
                  {filtered.map(v => (
                    <tr key={v.id}>
                      <td data-label="Visitor" className="cell-name">{v.visitorName}<br /><span style={{ fontSize: "11px", color: "var(--text-light)" }}>{v.phone}</span></td>
                      <td data-label="Visiting"><strong>{v.patientName}</strong></td>
                      <td data-label="Relationship">{v.relationship || "—"}</td>
                      <td data-label="In" style={{ fontFamily: "monospace", fontSize: "12px" }}>{v.timeIn}</td>
                      <td data-label="Out" style={{ fontFamily: "monospace", fontSize: "12px" }}>{v.timeOut || <span className="badge badge-green">Inside</span>}</td>
                      <td data-label="Purpose" style={{ fontSize: "12px" }}>{v.purpose}</td>
                      <td data-label="Screening">
                        <span className={`badge ${v.healthScreening === "Passed" ? "badge-green" : "badge-red"}`}>{v.healthScreening === "Passed" ? "✓ Passed" : "✗ Failed"}</span>
                      </td>
                      <td data-label="Actions">
                        {!v.timeOut && (
                          <button className="btn btn-sm btn-outline" onClick={() => handleCheckOut(v.id)}>
                            <LogOut size={11} /> Check Out
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>
    </div>
  );
}
