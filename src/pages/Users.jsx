import { useState, useEffect } from "react";
import { getUsers, addUser, updateUser, deleteUser, getSalaryRecords, addSalaryRecord, getStaffActivity } from "../api/sheets";
import { Plus, Printer, X, IndianRupee, Search, Edit3, Trash2, Key, Eye, EyeOff, Shield, UserCheck, Clock, ChevronDown, ChevronUp, Phone, Mail, AlertTriangle } from "lucide-react";
import { sanitizeHTML, validateName, validateEmail, validatePassword } from "../utils/security";
import { HOSPITAL } from "../print/hospital";
import { usePagination } from "../components/Pagination";

/* ════════════════════════════════
   SALARY MODAL (kept from original)
   ════════════════════════════════ */
function SalaryModal({ staff, onClose }) {
  const [records, setRecords] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    month: new Date().toLocaleDateString("en-IN",{month:"long",year:"numeric"}),
    basic:"", hra:"", allowances:"", pf:"", tax:"", deductions:"", netPay:"",
  });
  const set = (k,v) => setForm(p=>({...p,[k]:v}));
  const autoNet = () => {
    const gross = (parseFloat(form.basic)||0) + (parseFloat(form.hra)||0) + (parseFloat(form.allowances)||0);
    const ded   = (parseFloat(form.pf)||0) + (parseFloat(form.tax)||0) + (parseFloat(form.deductions)||0);
    setForm(p=>({...p, netPay: String(Math.max(0, gross-ded)) }));
  };

  useEffect(() => {
    getSalaryRecords && getSalaryRecords()
      .then(r => setRecords((Array.isArray(r)?r:r.data||[]).filter(x=>x.staffName===staff.name)))
      .catch(() => {});
  }, [staff.name]);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await addSalaryRecord({ ...form, staffName:staff.name, designation:staff.position||staff.role });
      setShowForm(false);
      getSalaryRecords()
        .then(r => setRecords((Array.isArray(r)?r:r.data||[]).filter(x=>x.staffName===staff.name)));
    } catch {} finally { setSaving(false); }
  };

  const printSlip = (rec) => {
    const win = window.open("","_blank");
    if (!win) return;
    const today = new Date().toLocaleDateString("en-IN");
    // Sanitize all user-provided values to prevent XSS
    const safeName = sanitizeHTML(staff.name);
    const safePosition = sanitizeHTML(staff.position || staff.role);
    win.document.write(`
<!DOCTYPE html><html><head><title>Salary Slip</title>
<style>body{font-family:Arial,sans-serif;font-size:12px;padding:24px;max-width:500px;margin:0 auto}
h1{font-size:18px;color:#1a3558;font-weight:800;text-align:center;margin-bottom:4px}
.sub{text-align:center;font-size:11px;color:#64748b;margin-bottom:14px}
.divider{border-top:2px solid #1a3558;margin:10px 0}
table{width:100%;border-collapse:collapse}td{padding:5px 8px;font-size:12px}
.label{color:#64748b;font-weight:600}.right{text-align:right}.bold{font-weight:700}
.total{background:#f8f9fc;font-weight:700}</style></head>
<body>
<h1>${sanitizeHTML(HOSPITAL.name)}</h1>
<div class="sub">${sanitizeHTML(HOSPITAL.address)} · Ph: ${sanitizeHTML(HOSPITAL.phone)}</div>
<div class="divider"></div>
<div style="display:flex;justify-content:space-between;margin-bottom:12px">
  <div><b>Employee:</b> ${safeName}</div>
  <div><b>Period:</b> ${sanitizeHTML(String(rec?.month||form.month))}</div>
</div>
<div><b>Designation:</b> ${safePosition}</div>
<div class="divider"></div>
<table>
<tr><td class="label">Basic Salary</td><td class="right">₹${sanitizeHTML(String(rec?.basic||form.basic||0))}</td></tr>
<tr><td class="label">HRA</td><td class="right">₹${sanitizeHTML(String(rec?.hra||form.hra||0))}</td></tr>
<tr><td class="label">Allowances</td><td class="right">₹${sanitizeHTML(String(rec?.allowances||form.allowances||0))}</td></tr>
<tr style="border-top:1px solid #e2e8f0"><td class="label bold">Gross Pay</td>
  <td class="right bold">₹${sanitizeHTML(String((parseFloat(rec?.basic||form.basic)||0)+(parseFloat(rec?.hra||form.hra)||0)+(parseFloat(rec?.allowances||form.allowances)||0)))}</td></tr>
</table>
<div class="divider"></div>
<table>
<tr><td class="label">Provident Fund (PF)</td><td class="right">₹${sanitizeHTML(String(rec?.pf||form.pf||0))}</td></tr>
<tr><td class="label">Income Tax</td><td class="right">₹${sanitizeHTML(String(rec?.tax||form.tax||0))}</td></tr>
<tr><td class="label">Other Deductions</td><td class="right">₹${sanitizeHTML(String(rec?.deductions||form.deductions||0))}</td></tr>
</table>
<div class="divider"></div>
<table><tr class="total"><td>NET PAY</td><td class="right">₹${sanitizeHTML(String(rec?.netPay||form.netPay||0))}</td></tr></table>
<div style="margin-top:24px;display:flex;justify-content:space-between;font-size:11px;color:#94a3b8">
  <span>Generated: ${today}</span><span>Employee Signature: ___________</span>
</div>
</body></html>`);
    win.document.close(); win.print();
  };

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.55)",backdropFilter:"blur(2px)",zIndex:1000,display:"flex",alignItems:"flex-start",justifyContent:"center",padding:"clamp(16px, 4vw, 40px)",paddingTop:"clamp(24px, 5vh, 60px)",overflowY:"auto"}}>
      <div style={{background:"var(--surface)",borderRadius:"10px",padding:"24px",maxWidth:"min(95vw, 540px)",width:"100%",boxShadow:"0 4px 24px rgba(0,0,0,.15)",maxHeight:"calc(100vh - 80px)",overflowY:"auto",animation:"modalIn .2s ease-out"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"16px"}}>
          <div>
            <h3 style={{fontSize:"16px",fontWeight:"700",color:"var(--text)"}}>Salary Slips — {staff.name}</h3>
            <p style={{fontSize:"12px",color:"var(--text-light)"}}>{staff.position||staff.role}</p>
          </div>
          <button className="btn-icon" onClick={onClose}><X size={15}/></button>
        </div>

        <button className="btn btn-primary btn-sm" style={{marginBottom:"14px"}} onClick={() => setShowForm(s=>!s)}>
          <Plus size={13}/> Generate New Slip
        </button>

        {showForm && (
          <form onSubmit={save} className="form-grid" style={{marginBottom:"16px",background:"var(--subtle)",padding:"14px",borderRadius:"8px"}}>
            <div className="field"><label>Month / Period</label><input value={form.month} onChange={e=>set("month",e.target.value)} /></div>
            <div className="form-row">
              <div className="field"><label>Basic Salary (₹)</label><input type="number" value={form.basic} onChange={e=>set("basic",e.target.value)} onBlur={autoNet} /></div>
              <div className="field"><label>HRA (₹)</label><input type="number" value={form.hra} onChange={e=>set("hra",e.target.value)} onBlur={autoNet} /></div>
            </div>
            <div className="form-row">
              <div className="field"><label>Allowances (₹)</label><input type="number" value={form.allowances} onChange={e=>set("allowances",e.target.value)} onBlur={autoNet} /></div>
              <div className="field"><label>PF Deduction (₹)</label><input type="number" value={form.pf} onChange={e=>set("pf",e.target.value)} onBlur={autoNet} /></div>
            </div>
            <div className="form-row">
              <div className="field"><label>Tax (₹)</label><input type="number" value={form.tax} onChange={e=>set("tax",e.target.value)} onBlur={autoNet} /></div>
              <div className="field"><label>Other Deductions (₹)</label><input type="number" value={form.deductions} onChange={e=>set("deductions",e.target.value)} onBlur={autoNet} /></div>
            </div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:"var(--primary-light)",padding:"10px 14px",borderRadius:"6px"}}>
              <span style={{fontWeight:"700",color:"var(--text)"}}>Net Pay</span>
              <span style={{fontSize:"18px",fontWeight:"800",color:"var(--text)"}}>₹{form.netPay || 0}</span>
            </div>
            <div style={{display:"flex",gap:"8px"}}>
              <button className="btn btn-primary" type="submit" disabled={saving}>Save</button>
              <button className="btn btn-outline" type="button" onClick={() => printSlip(null)}><Printer size={13}/> Preview &amp; Print</button>
            </div>
          </form>
        )}

        {records.length > 0 && (
          <div>
            <div className="section-title">Previous Slips</div>
            <table className="data-table" style={{fontSize:"12px"}}>
              <thead><tr><th>Month</th><th>Basic</th><th>Net Pay</th><th>Action</th></tr></thead>
              <tbody>
                {records.map((r,i) => (
                  <tr key={i}>
                    <td>{r.month}</td>
                    <td>₹{r.basic}</td>
                    <td style={{fontWeight:"700"}}>₹{r.netPay}</td>
                    <td><button className="btn btn-sm btn-outline" onClick={() => printSlip(r)}><Printer size={12}/> Print</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════
   EDIT STAFF MODAL
   ════════════════════════════════ */
function EditModal({ staff, onClose, onSave }) {
  const [form, setForm] = useState({
    name: staff.name || "",
    username: staff.username || "",
    email: staff.email || "",
    phone: staff.phone || "",
    role: staff.role || "Staff",
    position: staff.position || "Appointment Desk",
    specialization: staff.specialization || "",
    shiftStart: staff.shiftStart || "09:00",
    shiftEnd: staff.shiftEnd || "17:00",
    status: staff.status || "Active",
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const set = (k,v) => setForm(p=>({...p,[k]:v}));

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name) { setErr("Name is required."); return; }
    setSaving(true); setErr("");
    try {
      await updateUser({ id: staff.id, ...form });
      onSave();
    } catch { setErr("Failed to update."); }
    finally { setSaving(false); }
  };

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.55)",backdropFilter:"blur(2px)",zIndex:1000,display:"flex",alignItems:"flex-start",justifyContent:"center",padding:"clamp(16px, 4vw, 40px)",paddingTop:"clamp(24px, 5vh, 60px)",overflowY:"auto"}}>
      <div style={{background:"var(--surface)",borderRadius:"10px",padding:"24px",maxWidth:"min(95vw, 520px)",width:"100%",boxShadow:"0 4px 24px rgba(0,0,0,.15)",maxHeight:"calc(100vh - 80px)",overflowY:"auto",animation:"modalIn .2s ease-out"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"16px"}}>
          <h3 style={{fontSize:"16px",fontWeight:"700",color:"var(--text)"}}>Edit Staff — {staff.name}</h3>
          <button className="btn-icon" onClick={onClose}><X size={15}/></button>
        </div>
        {err && <div className="alert-bar alert-danger" style={{marginBottom:"10px"}}>{err}</div>}
        <form onSubmit={handleSave} className="form-grid">
          <div className="form-row">
            <div className="field"><label>Full Name <span className="req">*</span></label><input value={form.name} onChange={e=>set("name",e.target.value)} /></div>
            <div className="field"><label>Username</label><input value={form.username} onChange={e=>set("username",e.target.value)} /></div>
          </div>
          <div className="form-row">
            <div className="field"><label>Email</label><input type="email" value={form.email} onChange={e=>set("email",e.target.value)} /></div>
            <div className="field"><label>Phone</label><input value={form.phone} onChange={e=>set("phone",e.target.value)} /></div>
          </div>
          <div className="form-row">
            <div className="field">
              <label>Role</label>
              <select value={form.role} onChange={e=>set("role",e.target.value)}>
                <option>Staff</option><option>Doctor</option><option>Admin</option>
              </select>
            </div>
            <div className="field">
              <label>Status</label>
              <select value={form.status} onChange={e=>set("status",e.target.value)}>
                <option>Active</option><option>Inactive</option><option>On Leave</option>
              </select>
            </div>
          </div>
          {form.role === "Staff" && (
            <div className="field">
              <label>Position</label>
              <select value={form.position} onChange={e=>set("position",e.target.value)}>
                <option>Appointment Desk</option><option>Receptionist</option>
                <option>Dispensary</option><option>Lab</option>
                <option>Home Care</option><option>General Attendant</option><option>Security</option>
              </select>
            </div>
          )}
          {form.role === "Doctor" && (
            <div className="field"><label>Specialization / Degree</label><input value={form.specialization} onChange={e=>set("specialization",e.target.value)} /></div>
          )}
          <div className="form-row">
            <div className="field"><label>Shift Start</label><input type="time" value={form.shiftStart} onChange={e=>set("shiftStart",e.target.value)} /></div>
            <div className="field"><label>Shift End</label><input type="time" value={form.shiftEnd} onChange={e=>set("shiftEnd",e.target.value)} /></div>
          </div>
          <div style={{display:"flex",gap:"8px"}}>
            <button className="btn btn-primary" type="submit" disabled={saving}>
              {saving ? <span className="spinner" style={{width:"14px",height:"14px"}}/> : "Save Changes"}
            </button>
            <button className="btn btn-outline" type="button" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ════════════════════════════════
   RESET PASSWORD MODAL
   ════════════════════════════════ */
function PasswordModal({ staff, onClose, onSave }) {
  const [newPass, setNewPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);

  const handleReset = async (e) => {
    e.preventDefault();
    if (!newPass) { setErr("Enter a new password."); return; }
    if (newPass.length < 6) { setErr("Password must be at least 6 characters."); return; }
    if (newPass !== confirm) { setErr("Passwords do not match."); return; }
    setSaving(true); setErr("");
    try {
      await updateUser({ id: staff.id, password: newPass });
      setDone(true);
    } catch { setErr("Failed to reset password."); }
    finally { setSaving(false); }
  };

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.55)",backdropFilter:"blur(2px)",zIndex:1000,display:"flex",alignItems:"flex-start",justifyContent:"center",padding:"clamp(16px, 4vw, 40px)",paddingTop:"clamp(24px, 5vh, 60px)",overflowY:"auto"}}>
      <div style={{background:"var(--surface)",borderRadius:"10px",padding:"24px",maxWidth:"min(95vw, 400px)",width:"100%",boxShadow:"0 4px 24px rgba(0,0,0,.15)",maxHeight:"calc(100vh - 80px)",overflowY:"auto",animation:"modalIn .2s ease-out"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"16px"}}>
          <h3 style={{fontSize:"16px",fontWeight:"700",color:"var(--text)"}}>Reset Password</h3>
          <button className="btn-icon" onClick={onClose}><X size={15}/></button>
        </div>

        <div style={{display:"flex",alignItems:"center",gap:"10px",padding:"10px 14px",background:"var(--subtle)",borderRadius:"8px",marginBottom:"14px"}}>
          <Shield size={16} style={{color:"var(--primary)",flexShrink:0}} />
          <div>
            <div style={{fontSize:"13px",fontWeight:"600",color:"var(--text)"}}>{staff.name}</div>
            <div style={{fontSize:"11px",color:"var(--text-light)"}}>{staff.role} · {staff.username}</div>
          </div>
        </div>

        {done ? (
          <div>
            <div className="alert-bar alert-success" style={{marginBottom:"14px"}}>
              Password reset successfully for <strong>{staff.name}</strong>.
            </div>
            <button className="btn btn-primary" style={{width:"100%",justifyContent:"center"}} onClick={() => { onSave(); onClose(); }}>Done</button>
          </div>
        ) : (
          <form onSubmit={handleReset} className="form-grid">
            {err && <div className="alert-bar alert-danger" style={{marginBottom:"10px"}}>{err}</div>}
            <div className="field">
              <label>New Password <span className="req">*</span></label>
              <div style={{position:"relative"}}>
                <input type={show?"text":"password"} value={newPass} onChange={e=>setNewPass(e.target.value)} placeholder="Min 6 characters" style={{paddingRight:"36px"}} />
                <button type="button" onClick={()=>setShow(s=>!s)} style={{position:"absolute",right:"8px",top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:"var(--text-light)",cursor:"pointer"}}>
                  {show ? <EyeOff size={14}/> : <Eye size={14}/>}
                </button>
              </div>
            </div>
            <div className="field">
              <label>Confirm Password <span className="req">*</span></label>
              <input type={show?"text":"password"} value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="Re-enter password" />
            </div>
            <button className="btn btn-primary" type="submit" disabled={saving} style={{width:"100%",justifyContent:"center"}}>
              {saving ? <span className="spinner" style={{width:"14px",height:"14px"}}/> : <><Key size={14}/> Reset Password</>}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════
   CONFIRM DELETE MODAL
   ════════════════════════════════ */
function DeleteConfirm({ staff, onClose, onConfirm }) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteUser(staff.id);
      onConfirm();
    } catch {}
    finally { setDeleting(false); }
  };

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:"16px"}}>
      <div style={{background:"var(--surface)",borderRadius:"10px",padding:"24px",maxWidth:"400px",width:"100%",boxShadow:"0 4px 24px rgba(0,0,0,.15)",textAlign:"center"}}>
        <div style={{width:"48px",height:"48px",borderRadius:"50%",background:"var(--danger-light)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 14px"}}>
          <AlertTriangle size={22} style={{color:"var(--danger)"}} />
        </div>
        <h3 style={{fontSize:"16px",fontWeight:"700",color:"var(--text)",marginBottom:"6px"}}>Remove Staff Member?</h3>
        <p style={{fontSize:"13px",color:"var(--text-secondary)",marginBottom:"18px"}}>
          This will permanently remove <strong>{staff.name}</strong> ({staff.role}). This action cannot be undone.
        </p>
        <div style={{display:"flex",gap:"8px",justifyContent:"center"}}>
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn" style={{background:"var(--danger)",color:"#fff",border:"none"}} onClick={handleDelete} disabled={deleting}>
            {deleting ? <span className="spinner" style={{width:"14px",height:"14px"}}/> : <><Trash2 size={13}/> Remove</>}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════
   MAIN COMPONENT
   ════════════════════════════════════════════ */
const fmtTime = (v) => {
  if (!v) return "—";
  const s = String(v);
  if (s.includes("T")) {
    const d = new Date(s);
    return `${String(d.getUTCHours()).padStart(2,"0")}:${String(d.getUTCMinutes()).padStart(2,"0")}`;
  }
  return s;
};

const POSITIONS = ["Appointment Desk","Receptionist","Dispensary","Lab","Home Care","General Attendant","Security"];

export default function Users() {
  const [users, setUsers]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [salaryFor, setSalaryFor] = useState(null);
  const [editUser, setEditUser]   = useState(null);
  const [resetPw, setResetPw]     = useState(null);
  const [delUser, setDelUser]     = useState(null);
  const [saving, setSaving]       = useState(false);
  const [err, setErr]             = useState("");
  const [search, setSearch]       = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [showPass, setShowPass]   = useState(false);
  const [activity, setActivity]   = useState([]);
  const [showActivity, setShowActivity] = useState(false);

  const [form, setForm] = useState({
    name:"", username:"", password:"", email:"", phone:"",
    role:"Staff", position:"Appointment Desk",
    specialization:"", shiftStart:"09:00", shiftEnd:"17:00",
  });
  const set = (k,v) => setForm(p=>({...p,[k]:v}));

  const load = () => {
    setLoading(true);
    getUsers()
      .then(r => setUsers(Array.isArray(r) ? r : r.data || []))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    getStaffActivity()
      .then(r => setActivity(Array.isArray(r) ? r : r.data || []))
      .catch(() => {});
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.name || !form.username || !form.password) { setErr("Name, username, and password are required."); return; }
    if (!validateName(form.name)) { setErr("Name must be 2-100 characters with no special characters."); return; }
    if (!validatePassword(form.password)) { setErr("Password must be 6-128 characters."); return; }
    if (form.email && !validateEmail(form.email)) { setErr("Invalid email format."); return; }
    setSaving(true); setErr("");
    try {
      const r = await addUser(form);
      if (r.success !== false) {
        setShowForm(false);
        setForm({name:"",username:"",password:"",email:"",phone:"",role:"Staff",position:"Appointment Desk",specialization:"",shiftStart:"09:00",shiftEnd:"17:00"});
        load();
      } else setErr(r.message||"Failed.");
    } catch { setErr("Error adding user."); }
    finally { setSaving(false); }
  };

  const toggleStatus = async (u) => {
    const newStatus = u.status === "Active" ? "Inactive" : "Active";
    await updateUser({ id: u.id, status: newStatus });
    load();
  };

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      (u.name||"").toLowerCase().includes(q) ||
      (u.username||"").toLowerCase().includes(q) ||
      (u.email||"").toLowerCase().includes(q) ||
      (u.phone||"").toLowerCase().includes(q) ||
      (u.position||"").toLowerCase().includes(q);
    const matchRole = filterRole === "all" || u.role === filterRole;
    return matchSearch && matchRole;
  });

  const { paginated, Pager } = usePagination(filtered, 25);

  const stats = {
    total: users.length,
    active: users.filter(u => u.status === "Active").length,
    doctors: users.filter(u => u.role === "Doctor").length,
    staff: users.filter(u => u.role === "Staff").length,
    admins: users.filter(u => u.role === "Admin").length,
  };

  const roleColors = { Admin:"var(--danger)", Doctor:"var(--success)", Staff:"var(--info)" };
  const statusColors = { Active:"badge-green", Inactive:"badge-red", "On Leave":"badge-yellow" };

  return (
    <div className="fade-in">
      {salaryFor && <SalaryModal staff={salaryFor} onClose={() => setSalaryFor(null)} />}
      {editUser && <EditModal staff={editUser} onClose={() => setEditUser(null)} onSave={() => { setEditUser(null); load(); }} />}
      {resetPw && <PasswordModal staff={resetPw} onClose={() => setResetPw(null)} onSave={load} />}
      {delUser && <DeleteConfirm staff={delUser} onClose={() => setDelUser(null)} onConfirm={() => { setDelUser(null); load(); }} />}

      <div className="page-header">
        <div><h2>Staff Management</h2><p>Add, edit, remove staff &amp; manage credentials</p></div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}><Plus size={13}/> Add Staff</button>
      </div>

      {/* Stats */}
      <div className="stat-grid" style={{marginBottom:"14px"}}>
        <div className="stat-card" style={{"--accent-color":"var(--text)"}}><div className="val">{stats.total}</div><div className="label">Total Staff</div></div>
        <div className="stat-card" style={{"--accent-color":"var(--success)"}}><div className="val">{stats.active}</div><div className="label">Active</div></div>
        <div className="stat-card" style={{"--accent-color":"var(--info)"}}><div className="val">{stats.doctors}</div><div className="label">Doctors</div></div>
        <div className="stat-card" style={{"--accent-color":"var(--warning)"}}><div className="val">{stats.staff}</div><div className="label">Staff</div></div>
      </div>

      {/* Add Staff Form */}
      {showForm && (
        <div className="card" style={{border:"2px solid var(--primary)",marginBottom:"16px"}}>
          <div className="card-header">
            <h3>Add New Staff Member</h3>
            <button className="btn-icon" onClick={() => setShowForm(false)}><X size={15}/></button>
          </div>
          {err && <div className="alert-bar alert-danger" style={{marginBottom:"10px"}}>{err}</div>}
          <form onSubmit={handleAdd} className="form-grid">
            <div className="form-row">
              <div className="field"><label>Full Name <span className="req">*</span></label><input value={form.name} onChange={e=>set("name",e.target.value)} placeholder="e.g. Dr. Priya Sharma" /></div>
              <div className="field"><label>Username / Login ID <span className="req">*</span></label><input value={form.username} onChange={e=>set("username",e.target.value)} placeholder="e.g. priya.sharma" /></div>
            </div>
            <div className="form-row">
              <div className="field">
                <label>Password <span className="req">*</span></label>
                <div style={{position:"relative"}}>
                  <input type={showPass?"text":"password"} value={form.password} onChange={e=>set("password",e.target.value)} placeholder="Min 6 characters" style={{paddingRight:"36px"}} />
                  <button type="button" onClick={()=>setShowPass(s=>!s)} style={{position:"absolute",right:"8px",top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:"var(--text-light)",cursor:"pointer"}}>
                    {showPass ? <EyeOff size={14}/> : <Eye size={14}/>}
                  </button>
                </div>
              </div>
              <div className="field">
                <label>Role <span className="req">*</span></label>
                <select value={form.role} onChange={e=>set("role",e.target.value)}>
                  <option>Staff</option><option>Doctor</option><option>Admin</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="field"><label>Email</label><input type="email" value={form.email} onChange={e=>set("email",e.target.value)} placeholder="name@shanticare.in" /></div>
              <div className="field"><label>Phone</label><input value={form.phone} onChange={e=>set("phone",e.target.value)} placeholder="10-digit mobile" /></div>
            </div>
            {form.role === "Staff" && (
              <div className="field">
                <label>Position</label>
                <select value={form.position} onChange={e=>set("position",e.target.value)}>
                  {POSITIONS.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
            )}
            {form.role === "Doctor" && (
              <div className="field"><label>Specialization / Degree</label><input value={form.specialization} onChange={e=>set("specialization",e.target.value)} placeholder="MBBS, MD, Cardiologist…" /></div>
            )}
            <div className="form-row">
              <div className="field"><label>Shift Start</label><input type="time" value={form.shiftStart} onChange={e=>set("shiftStart",e.target.value)} /></div>
              <div className="field"><label>Shift End</label><input type="time" value={form.shiftEnd} onChange={e=>set("shiftEnd",e.target.value)} /></div>
            </div>
            <div style={{display:"flex",gap:"8px"}}>
              <button className="btn btn-primary" type="submit" disabled={saving}>
                {saving ? <span className="spinner" style={{width:"14px",height:"14px"}}/> : <><Plus size={13}/> Add Staff</>}
              </button>
              <button className="btn btn-outline" type="button" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Staff Table */}
      <div className="card">
        <div className="card-header" style={{flexWrap:"wrap",gap:"8px"}}>
          <h3>All Staff ({filtered.length})</h3>
          <div style={{display:"flex",gap:"6px",flexWrap:"wrap"}}>
            {[["all","All"],["Admin","Admin"],["Doctor","Doctors"],["Staff","Staff"]].map(([val,label]) => (
              <button key={val} className={`btn btn-sm ${filterRole===val ? "btn-primary" : "btn-outline"}`}
                onClick={() => setFilterRole(val)}>
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="search-box" style={{marginBottom:"10px"}}>
          <Search size={14}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name, username, email, phone, position…" />
        </div>

        {loading ? <div className="loading-box"><span className="spinner"/></div> : (
          <div className="table-wrap">
            <table className="data-table resp-cards">
              <thead><tr>
                <th>Staff Member</th>
                <th>Role / Position</th>
                <th>Credentials</th>
                <th>Contact</th>
                <th>Shift</th>
                <th>Status</th>
                <th>Actions</th>
              </tr></thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={7} style={{textAlign:"center",color:"var(--text-light)",padding:"28px"}}>No staff found</td></tr>
                )}
                {paginated.map((u,i) => (
                  <tr key={u.id||i} style={{opacity: u.status === "Inactive" ? 0.5 : 1}}>
                    <td data-label="Name" className="cell-name">
                      <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
                        <div style={{width:"32px",height:"32px",borderRadius:"50%",background:roleColors[u.role]||"var(--subtle)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"11px",fontWeight:"700",color:"#fff",flexShrink:0}}>
                          {(u.name||"?")[0]}
                        </div>
                        <div>
                          <div>{u.name}</div>
                          {u.specialization && <div style={{fontSize:"10px",color:"var(--text-light)"}}>{u.specialization}</div>}
                        </div>
                      </div>
                    </td>
                    <td data-label="Role">
                      <span style={{color:roleColors[u.role]||"var(--text-secondary)",fontSize:"11px",fontWeight:"600"}}>{u.role}</span>
                      {u.position && <span style={{fontSize:"11px",color:"var(--text-light)",marginLeft:"6px"}}>· {u.position}</span>}
                    </td>
                    <td data-label="Credentials">
                      <div style={{fontSize:"12px",fontFamily:"monospace"}}>{u.username||"—"}</div>
                    </td>
                    <td data-label="Contact">
                      <div style={{fontSize:"11px"}}>
                        {u.phone && <div style={{display:"flex",alignItems:"center",gap:"3px"}}><Phone size={10}/> {u.phone}</div>}
                        {u.email && <div style={{display:"flex",alignItems:"center",gap:"3px",color:"var(--text-light)"}}><Mail size={10}/> {u.email}</div>}
                        {!u.phone && !u.email && "—"}
                      </div>
                    </td>
                    <td data-label="Shift" style={{fontSize:"12px",fontFamily:"monospace"}}>
                      {u.shiftStart || u.shiftEnd ? `${fmtTime(u.shiftStart)} – ${fmtTime(u.shiftEnd)}` : "—"}
                    </td>
                    <td data-label="Status">
                      <button className={`badge ${statusColors[u.status]||"badge-green"}`}
                        onClick={() => toggleStatus(u)}
                        title="Click to toggle status"
                        style={{cursor:"pointer",border:"none",fontFamily:"'Inter',sans-serif"}}>
                        {u.status||"Active"}
                      </button>
                    </td>
                    <td data-label="Actions">
                      <div style={{display:"flex",gap:"4px",flexWrap:"wrap"}}>
                        <button className="btn btn-sm btn-outline" title="Edit" onClick={() => setEditUser(u)}><Edit3 size={12}/></button>
                        <button className="btn btn-sm btn-outline" title="Reset Password" onClick={() => setResetPw(u)}><Key size={12}/></button>
                        <button className="btn btn-sm btn-outline" title="Salary" onClick={() => setSalaryFor(u)}><IndianRupee size={12}/></button>
                        <button className="btn btn-sm btn-outline" title="Remove" onClick={() => setDelUser(u)}
                          style={{color:"var(--danger)",borderColor:"var(--danger)"}}><Trash2 size={12}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pager />
          </div>
        )}
      </div>

      {/* Staff Activity Log */}
      <div className="card" style={{marginTop:"14px"}}>
        <div className="card-header" style={{cursor:"pointer"}} onClick={() => setShowActivity(s=>!s)}>
          <h3 style={{display:"flex",alignItems:"center",gap:"6px"}}><Clock size={14}/> Staff Activity Log</h3>
          {showActivity ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
        </div>
        {showActivity && (
          activity.length === 0 ? (
            <div style={{padding:"20px",textAlign:"center",color:"var(--text-light)",fontSize:"13px"}}>No activity recorded yet</div>
          ) : (
            <div className="table-wrap">
              <table className="data-table" style={{fontSize:"12px"}}>
                <thead><tr><th>Staff</th><th>Role</th><th>Action</th><th>Time</th><th>Date</th></tr></thead>
                <tbody>
                  {activity.slice(0,20).map((a,i) => (
                    <tr key={i}>
                      <td className="cell-name">{a.name}</td>
                      <td><span style={{color:roleColors[a.role]||"var(--text-secondary)",fontSize:"11px",fontWeight:"600"}}>{a.role}</span></td>
                      <td>
                        <span style={{
                          padding:"2px 8px",borderRadius:"4px",fontSize:"11px",fontWeight:"600",
                          background: a.action === "Login" ? "var(--success-light,#e6f5f0)" : "var(--danger-light,#fce8e5)",
                          color: a.action === "Login" ? "var(--success)" : "var(--danger)",
                        }}>
                          {a.action}
                        </span>
                      </td>
                      <td style={{fontFamily:"monospace"}}>{a.time}</td>
                      <td>{a.date}</td>
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
