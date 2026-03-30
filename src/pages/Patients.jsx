import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getPatients, addPatient } from "../api/sheets";
import { Plus, X, UserCircle } from "lucide-react";
import DataTable from "../components/DataTable";
import { initials, conditionColor } from "../utils/formatters";
import { validateName, validatePhone } from "../utils/security";
import { useToast } from "../components/Toast";

export default function Patients() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [err, setErr]           = useState("");

  const [form, setForm] = useState({
    name:"", phone:"", age:"", gender:"Male", room:"", condition:"", guardian:"", status:"Active", patientType:"General",
  });
  const set = (k,v) => setForm(p=>({...p,[k]:v}));

  const load = () => {
    setLoading(true);
    getPatients()
      .then(r => setPatients(Array.isArray(r) ? r : r.data || []))
      .catch(() => { setPatients([]); addToast("Failed to load patients.", "error"); })
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!validateName(form.name)) { setErr("Name must be 2-100 characters, no special tags."); return; }
    if (!validatePhone(form.phone)) { setErr("Phone must be 10-13 digits."); return; }
    if (form.age && (isNaN(form.age) || form.age < 0 || form.age > 150)) { setErr("Age must be between 0 and 150."); return; }
    setSaving(true); setErr("");
    try {
      const r = await addPatient(form);
      if (r.success !== false) {
        setShowForm(false);
        setForm({name:"",phone:"",age:"",gender:"Male",room:"",condition:"",guardian:"",status:"Active",patientType:"General"});
        load();
      } else setErr(r.message||"Failed.");
    } catch { setErr("Connection error. Please try again."); }
    finally { setSaving(false); }
  };

  const columns = [
    { key: "name", label: "Patient", render: (p) => (
      <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
        <div style={{width:"30px",height:"30px",background:"var(--primary-light)",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"11px",fontWeight:"700",color:"var(--text)",flexShrink:0}}>
          {initials(p.name)}
        </div>
        <div className="cell-name">{p.name}<br/><span style={{fontSize:"11px",color:"var(--text-light)"}}>{p.phone}</span></div>
      </div>
    )},
    { key: "id", label: "ID", cellStyle: {fontFamily:"monospace",fontSize:"12px"} },
    { key: "ageGender", label: "Age / Gender", render: (p) => `${p.age ? `${p.age} yrs` : "—"} · ${p.gender}` },
    { key: "room", label: "Room" },
    { key: "condition", label: "Condition", render: (p) => { const c = conditionColor(p.condition); return <span style={{background:c.bg,color:c.color,padding:"2px 8px",borderRadius:"4px",fontSize:"11px",fontWeight:"600"}}>{p.condition||"—"}</span>; }},
    { key: "guardian", label: "Guardian", cellStyle: {fontSize:"12px"} },
    { key: "status", label: "Status", render: (p) => <span className="badge badge-green">{p.status||"Active"}</span> },
  ];

  return (
    <div className="fade-in">
      <div className="page-header">
        <div><h2>Patients</h2><p>{patients.length} registered patients</p></div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}><Plus size={13}/> Add Patient</button>
      </div>

      {showForm && (
        <div className="card" style={{border:"2px solid var(--text)",marginBottom:"16px"}}>
          <div className="card-header">
            <h3>Register New Patient</h3>
            <button className="btn-icon" onClick={() => setShowForm(false)}><X size={15}/></button>
          </div>
          {err && <div className="alert-bar alert-danger" style={{marginBottom:"10px"}}>{err}</div>}
          <form onSubmit={handleAdd} className="form-grid">
            <div className="form-row">
              <div className="field"><label>Full Name <span className="req">*</span></label><input value={form.name} onChange={e=>set("name",e.target.value)} /></div>
              <div className="field"><label>Phone <span className="req">*</span></label><input value={form.phone} onChange={e=>set("phone",e.target.value)} /></div>
            </div>
            <div className="form-row3">
              <div className="field"><label>Age</label><input type="number" value={form.age} onChange={e=>set("age",e.target.value)} /></div>
              <div className="field"><label>Gender</label>
                <select value={form.gender} onChange={e=>set("gender",e.target.value)}><option>Male</option><option>Female</option><option>Other</option></select>
              </div>
              <div className="field"><label>Room No.</label><input value={form.room} onChange={e=>set("room",e.target.value)} placeholder="101, Ward-B…" /></div>
            </div>
            <div className="form-row3">
              <div className="field"><label>Patient Type</label>
                <select value={form.patientType} onChange={e=>set("patientType",e.target.value)}>
                  <option>General</option><option>Maternity</option><option>IVF</option><option>Pediatric</option><option>Geriatric</option>
                </select>
              </div>
              <div className="field"><label>Condition</label><input value={form.condition} onChange={e=>set("condition",e.target.value)} placeholder="Stable, Critical…" /></div>
              <div className="field"><label>Guardian / Emergency Contact</label><input value={form.guardian} onChange={e=>set("guardian",e.target.value)} /></div>
            </div>
            <div style={{display:"flex",gap:"8px"}}>
              <button className="btn btn-primary" type="submit" disabled={saving}>
                {saving ? <span className="spinner" style={{width:"14px",height:"14px"}}/> : <><Plus size={13}/> Register</>}
              </button>
              <button className="btn btn-outline" type="button" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <DataTable
          columns={columns}
          data={patients}
          searchFields={["name", "id", "room", "phone"]}
          searchPlaceholder="Search by name, ID, room, phone…"
          onRowClick={(p) => navigate(`/patients/${p.id}`)}
          emptyMessage="No patients found"
          loading={loading}
        />
      </div>
    </div>
  );
}
