import { useState, useEffect } from "react";
import { getMedicines, addMedicine } from "../api/sheets";
import { Search, Plus, AlertTriangle, X } from "lucide-react";
import { useToast } from "../components/Toast";


export default function Medicines() {
  const { addToast } = useToast();
  const [meds, setMeds]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [err, setErr]         = useState("");
  const [tab, setTab]         = useState("all");

  const [form, setForm] = useState({
    name:"", category:"", stock:"", unit:"tablets", minStock:"10", price:"", supplier:"", batchNo:"", expiry:"",
  });
  const set = (k,v) => setForm(p=>({...p,[k]:v}));

  const load = () => {
    setLoading(true);
    getMedicines()
      .then(r => setMeds(Array.isArray(r) ? r : r.data || []))
      .catch(() => { setMeds([]); addToast("Failed to load medicines.", "error"); })
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.name || !form.stock) { setErr("Name and stock are required."); return; }
    setSaving(true); setErr("");
    try {
      const r = await addMedicine(form);
      if (r.success !== false) { setShowForm(false); setForm({name:"",category:"",stock:"",unit:"tablets",minStock:"10",price:"",supplier:"",batchNo:"",expiry:""}); load(); }
      else setErr(r.message || "Failed.");
    } catch { setErr("Error. Try again."); addToast("Failed to add medicine.", "error"); }
    finally { setSaving(false); }
  };

  const filtered = meds.filter(m => {
    const q = search.toLowerCase();
    const match = m.name?.toLowerCase().includes(q) || m.category?.toLowerCase().includes(q) || m.supplier?.toLowerCase().includes(q);
    if (tab === "low")  return match && (m.isLow || parseInt(m.stock) <= parseInt(m.minStock || 10));
    return match;
  });

  const lowMeds = meds.filter(m => m.isLow || parseInt(m.stock) <= parseInt(m.minStock || 10));

  const today = new Date().toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"});

  return (
    <div className="fade-in">
      {/* Print-only low stock report */}
      <div className="print-only">
        <div style={{textAlign:"center",borderBottom:"2px solid #1a3558",paddingBottom:"10px",marginBottom:"14px"}}>
          <div style={{fontSize:"18px",fontWeight:"800",color:"#1a3558"}}>Shanti Care Home</div>
          <div style={{fontSize:"11px",color:"#64748b"}}>123 Serenity Lane · Ph: +91-98765-43210</div>
          <div style={{display:"flex",justifyContent:"space-between",marginTop:"6px",fontSize:"11px",borderTop:"1px solid #e2e8f0",paddingTop:"6px"}}>
            <span><strong>LOW STOCK REPORT</strong></span>
            <span>Date: <strong>{today}</strong></span>
          </div>
        </div>
      </div>

      <div className="page-header">
        <div>
          <h2>Medicine Stock</h2>
          <p>Inventory management</p>
        </div>
        <div style={{display:"flex",gap:"8px"}}>
          <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>
            <Plus size={13}/> Add Medicine
          </button>
        </div>
      </div>

      {lowMeds.length > 0 && (
        <div className="alert-bar alert-danger" style={{marginBottom:"14px"}}>
          <AlertTriangle size={14}/> {lowMeds.length} medicine{lowMeds.length>1?"s":""} running LOW — reorder needed
        </div>
      )}

      {/* Add Form */}
      {showForm && (
        <div className="card" style={{border:"2px solid var(--text)",marginBottom:"16px"}}>
          <div className="card-header">
            <h3>Add New Medicine</h3>
            <button className="btn-icon" onClick={() => setShowForm(false)}><X size={15}/></button>
          </div>
          {err && <div className="alert-bar alert-danger" style={{marginBottom:"12px"}}>{err}</div>}
          <form onSubmit={handleAdd} className="form-grid">
            <div className="form-row">
              <div className="field"><label>Medicine Name <span className="req">*</span></label><input value={form.name} onChange={e=>set("name",e.target.value)} /></div>
              <div className="field"><label>Category</label><input value={form.category} onChange={e=>set("category",e.target.value)} placeholder="Antibiotic, Painkiller…" /></div>
            </div>
            <div className="form-row3">
              <div className="field"><label>Current Stock <span className="req">*</span></label><input type="number" value={form.stock} onChange={e=>set("stock",e.target.value)} /></div>
              <div className="field"><label>Unit</label><select value={form.unit} onChange={e=>set("unit",e.target.value)}><option>tablets</option><option>capsules</option><option>ml</option><option>vials</option><option>strips</option><option>pcs</option></select></div>
              <div className="field"><label>Min Stock Alert</label><input type="number" value={form.minStock} onChange={e=>set("minStock",e.target.value)} /></div>
            </div>
            <div className="form-row">
              <div className="field"><label>Price (₹)</label><input type="number" value={form.price} onChange={e=>set("price",e.target.value)} /></div>
              <div className="field"><label>Supplier</label><input value={form.supplier} onChange={e=>set("supplier",e.target.value)} /></div>
            </div>
            <div className="form-row">
              <div className="field"><label>Batch / Lot No.</label><input value={form.batchNo} onChange={e=>set("batchNo",e.target.value)} placeholder="B-2026-001" /></div>
              <div className="field"><label>Expiry Date</label><input type="date" value={form.expiry} onChange={e=>set("expiry",e.target.value)} /></div>
            </div>
            <div style={{display:"flex",gap:"8px"}}>
              <button className="btn btn-primary" type="submit" disabled={saving}>
                {saving ? <span className="spinner" style={{width:"14px",height:"14px"}}/> : <><Plus size={13}/> Add Medicine</>}
              </button>
              <button className="btn btn-outline" type="button" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <div className="tab-bar" style={{marginBottom:0,borderBottom:"none"}}>
            <button className={`tab-btn ${tab==="all"?"active":""}`} onClick={() => setTab("all")}>All Medicines ({meds.length})</button>
            <button className={`tab-btn ${tab==="low"?"active":""}`} onClick={() => setTab("low")}>
              Low Stock {lowMeds.length > 0 && <span className="badge badge-red" style={{marginLeft:"4px"}}>{lowMeds.length}</span>}
            </button>
          </div>
        </div>
        <div className="search-box">
          <Search size={14}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search medicine, category, supplier…" />
        </div>
        {loading ? <div className="loading-box"><span className="spinner"/></div> : (
          <div className="table-wrap">
            <table className="data-table resp-cards">
              <thead><tr>
                <th>Name</th><th>Category</th><th>Stock</th><th>Expiry</th><th>Unit</th><th>Min</th><th>Price</th><th>Supplier</th><th>Status</th>
              </tr></thead>
              <tbody>
                {filtered.length === 0 && <tr><td colSpan={9} style={{textAlign:"center",color:"var(--text-light)",padding:"28px"}}>No medicines found</td></tr>}
                {filtered.map((m,i) => {
                  const isLow = m.isLow || parseInt(m.stock) <= parseInt(m.minStock || 10);
                  return (
                    <tr key={i} style={isLow?{background:"var(--danger-light)"}:{}}>
                      <td data-label="Name" className="cell-name">{m.name}</td>
                      <td data-label="Category"><span className="badge badge-blue">{m.category || "—"}</span></td>
                      <td data-label="Stock">
                        <span style={{fontWeight:"700",color: isLow ? "var(--danger)" : "var(--success)"}}>{m.stock}</span>
                      </td>
                      <td data-label="Expiry" style={{fontSize:"12px"}}>{(() => {
                        if (!m.expiry) return "—";
                        const exp = new Date(m.expiry);
                        const now = new Date();
                        const daysLeft = Math.ceil((exp - now) / 86400000);
                        const color = daysLeft < 0 ? "var(--danger)" : daysLeft < 90 ? "var(--warning)" : "var(--text-muted)";
                        return <span style={{color, fontWeight: daysLeft < 90 ? 600 : 400}}>{exp.toLocaleDateString("en-IN", {month:"short",year:"numeric"})}{daysLeft < 0 ? " (EXPIRED)" : daysLeft < 90 ? ` (${daysLeft}d)` : ""}</span>;
                      })()}</td>
                      <td data-label="Unit">{m.unit || "—"}</td>
                      <td data-label="Min Stock">{m.minStock || 10}</td>
                      <td data-label="Price">{m.price ? `₹${m.price}` : "—"}</td>
                      <td data-label="Supplier">{m.supplier || "—"}</td>
                      <td data-label="Status">
                        {isLow
                          ? <span className="badge badge-red"><AlertTriangle size={10} style={{marginRight:"3px"}}/>LOW</span>
                          : <span className="badge badge-green">OK</span>
                        }
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
