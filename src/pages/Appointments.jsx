import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { getAppointments, createAppointment, updateAppointmentStatus, getUsers, getPrescriptions } from "../api/sheets";
import { Plus, Printer, Search, X, FileText, MessageCircle, RefreshCw } from "lucide-react";
import UnifiedReceipt from "../components/UnifiedReceipt";
import { generateDietPlan, generateHealthAdvice } from "../utils/healthAdvisor";
import { printElement, OpdReceipt } from "../print";
import { usePagination } from "../components/Pagination";
import { validateName, validatePhone } from "../utils/security";
import { useToast } from "../components/Toast";

function statusBadge(s) {
  const map = {
    "Scheduled":     "var(--info-light):var(--info)",
    "With Doctor":   "var(--warning-light):var(--warning)",
    "To Dispensary": "var(--purple-light):var(--purple)",
    "Dispensed":     "var(--success-light):var(--success)",
    "Completed":     "var(--success-light):var(--success)",
  };
  const [bg,color] = (map[s]||"var(--subtle):var(--text-secondary)").split(":");
  return <span style={{background:bg,color,padding:"2px 8px",borderRadius:"4px",fontSize:"11px",fontWeight:"600"}}>{s}</span>;
}

function PrescriptionPrint({ appt, onClose }) {
  if (!appt) return null;
  return (
    <div className="modal-backdrop">
      <div className="modal-sheet print-receipt" style={{maxWidth:"520px"}}>
        <OpdReceipt data={appt} />
        <div className="no-print" style={{display:"flex",gap:"8px",marginTop:"14px"}}>
          <button className="btn btn-primary" style={{flex:1,justifyContent:"center"}} onClick={() => printElement("print-opd-receipt", { pageSize: "A5" })}>
            <Printer size={14}/> Print Receipt
          </button>
          <button className="btn btn-success no-print" style={{flex:1,justifyContent:"center"}}
            onClick={() => {
              const phone = appt.phone?.replace(/\D/g,'');
              if (!phone) return;
              const msg = `नमस्ते ${appt.patientName} जी,\nShanti Care Home में आपका OPD रजिस्ट्रेशन हो गया है।\nReceipt No: ${appt.receiptNo}\nडॉक्टर: ${appt.doctor}\nतारीख: ${appt.date}\nकृपया समय पर आएं। - Shanti Care`;
              window.open(`https://wa.me/91${phone}?text=${encodeURIComponent(msg)}`, '_blank');
            }}>
            <MessageCircle size={14}/> WhatsApp
          </button>
          <button className="btn btn-outline" onClick={onClose}><X size={14}/></button>
        </div>
      </div>
    </div>
  );
}

const TYPES = ["General Checkup","Cardiology","Orthopedics","ENT","Eye","Skin","Gynaecology","Paediatrics","Emergency","Follow-up","Neurology","Dental","Psychiatry"];

export default function Appointments() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [appts, setAppts]         = useState([]);
  const [doctors, setDoctors]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [printAppt, setPrintAppt] = useState(null);
  const [unifiedData, setUnifiedData] = useState(null);
  const [search, setSearch]       = useState("");
  const [saving, setSaving]       = useState(false);
  const [err, setErr]             = useState("");
  const today = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState({
    patientName:"", age:"", gender:"", phone:"", doctor:"", date:today, type:TYPES[0], billAmount:"100", notes:"",
  });
  const set = (k,v) => setForm(p => ({...p,[k]:v}));

  const load = () => {
    setLoading(true);
    getAppointments("all", today)
      .then(r => setAppts(r?.data || (Array.isArray(r) ? r : [])))
      .catch(() => setAppts([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // Fetch doctors from Users sheet
    getUsers()
      .then(r => {
        // Handle multiple response formats:
        // - dataLayer.read returns mapped array directly
        // - demo API returns { data: [...] }
        const list = Array.isArray(r) ? r : (r?.data || []);
        const docs = list
          .filter(u => String(u.role || "").toLowerCase() === "doctor")
          .map(u => String(u.name || "").trim())
          .filter(Boolean);
        if (docs.length) {
          setDoctors(docs);
          setForm(p => ({...p, doctor: docs[0]}));
        }
      })
      .catch(() => {});
  }, []);

  // Fallback: extract unique doctor names from loaded appointments
  useEffect(() => {
    if (appts.length && doctors.length === 0) {
      const unique = [...new Set(appts.map(a => a.doctor).filter(Boolean))];
      if (unique.length) {
        setDoctors(unique);
        setForm(p => ({...p, doctor: p.doctor || unique[0]}));
      }
    }
  }, [appts, doctors.length]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!validateName(form.patientName)) { setErr("Patient name must be 2-100 characters, no special tags."); return; }
    if (!validatePhone(form.phone)) { setErr("Phone must be 10-13 digits."); return; }
    if (form.billAmount && (parseFloat(form.billAmount) < 0)) { setErr("Consultation fee cannot be negative."); return; }
    if (!form.doctor) { setErr("Please select a doctor."); return; }
    if (!form.age || isNaN(parseInt(form.age)) || parseInt(form.age) <= 0) { setErr("Patient age is required."); return; }
    setSaving(true); setErr("");
    const payload = {
      patientName: form.patientName,
      age:         form.age ? parseInt(form.age) : null,
      gender:      form.gender || null,
      phone:       form.phone,
      doctor:      form.doctor,           // backend maps to 'Assigned Dr'
      date:        form.date,
      type:        form.type,
      billAmount:  parseFloat(form.billAmount) || 0,  // backend expects 'billAmount' → 'Bill Amount'
      createdBy:   user.name || "",
      notes:       form.notes,
    };
    try {
      const r = await createAppointment(payload);
      if (r.success) {
        // Use backend-generated receiptNo for the print slip
        setPrintAppt({ ...payload, receiptNo: r.receiptNo });
        setShowForm(false);
        setForm({ patientName:"", age:"", gender:"", phone:"", doctor: doctors[0]||"", date:today, type:TYPES[0], billAmount:"100", notes:"" });
        load();
      } else {
        setErr(r.error || r.message || "Failed to create appointment.");
      }
    } catch { setErr("Connection error. Try again."); }
    finally { setSaving(false); }
  };

  const sendToDoctor = async (receiptNo) => {
    if (!receiptNo) { addToast("Receipt number missing.", "error"); return; }
    try {
      const r = await updateAppointmentStatus(receiptNo, "With Doctor");
      if (r.success) load();
      else addToast(r.error || "Failed to update status.", "error");
    } catch { addToast("Connection error.", "error"); }
  };

  const showUnifiedReceipt = async (appt) => {
    try {
      const rxRes = await getPrescriptions();
      const allRx = Array.isArray(rxRes) ? rxRes : rxRes?.data || [];
      const rx = allRx.find(r => r.receiptNo === appt.receiptNo);
      const patient = { name: appt.patientName, age: appt.age || 40, condition: appt.type, diagnosis: rx?.diagnosis || appt.notes || appt.type };
      const dietPlan = generateDietPlan(patient);
      const healthAdvice = generateHealthAdvice(patient, null, rx?.diagnosis || appt.notes || appt.type);
      setUnifiedData({
        appointment: appt,
        prescription: rx || null,
        dietPlan,
        healthAdvice,
      });
    } catch {
      setUnifiedData({ appointment: appt, prescription: null, dietPlan: null, healthAdvice: null });
    }
  };

  const filtered = appts.filter(a => {
    const q = search.toLowerCase();
    return (
      String(a.patientName||"").toLowerCase().includes(q) ||
      String(a.receiptNo||"").toLowerCase().includes(q) ||
      String(a.doctor||"").toLowerCase().includes(q)
    );
  });

  const { paginated, Pager } = usePagination(filtered, 25);

  return (
    <div className="fade-in">
      {printAppt && <PrescriptionPrint appt={printAppt} onClose={() => setPrintAppt(null)} />}
      {unifiedData && (
        <UnifiedReceipt
          appointment={unifiedData.appointment}
          prescription={unifiedData.prescription}
          dietPlan={unifiedData.dietPlan}
          healthAdvice={unifiedData.healthAdvice}
          onClose={() => setUnifiedData(null)}
        />
      )}

      <div className="page-header">
        <div>
          <h2>Appointments</h2>
          <p>Manage OPD appointments &amp; prescription slips</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          <Plus size={15}/> New Appointment
        </button>
      </div>

      {/* New Appointment Form */}
      {showForm && (
        <div className="card" style={{border:"2px solid var(--text)",marginBottom:"16px"}}>
          <div className="card-header">
            <h3>New OPD Appointment</h3>
            <button className="btn-icon" onClick={() => setShowForm(false)}><X size={15}/></button>
          </div>
          {err && <div className="alert-bar alert-danger" style={{marginBottom:"12px"}}>{err}</div>}
          <form onSubmit={handleCreate} className="form-grid">
            <div className="form-row">
              <div className="field"><label>Patient Name <span className="req">*</span></label>
                <input value={form.patientName} onChange={e=>set("patientName",e.target.value)} placeholder="Full name" />
              </div>
              <div className="field"><label>Phone <span className="req">*</span></label>
                <input value={form.phone} onChange={e=>set("phone",e.target.value)} placeholder="10-digit mobile" />
              </div>
            </div>
            <div className="form-row">
              <div className="field">
                <label>Age <span className="req">*</span> <span style={{fontSize:"11px",color:"var(--text-muted)"}}>(years)</span></label>
                <input type="number" min="1" max="120" required value={form.age} onChange={e=>set("age",e.target.value)} placeholder="e.g. 35" />
              </div>
              <div className="field">
                <label>Gender</label>
                <select value={form.gender||""} onChange={e=>set("gender",e.target.value)}>
                  <option value="">— Not specified —</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="field">
                <label>Doctor <span className="req">*</span></label>
                <select value={form.doctor} onChange={e=>set("doctor",e.target.value)}>
                  {doctors.length === 0
                    ? <option value="">— Loading doctors… —</option>
                    : doctors.map(d => <option key={d} value={d}>{d}</option>)
                  }
                </select>
              </div>
              <div className="field">
                <label>Type <span className="req">*</span></label>
                <select value={form.type} onChange={e=>set("type",e.target.value)}>
                  {TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="field"><label>Date</label>
                <input type="date" value={form.date} onChange={e=>set("date",e.target.value)} />
              </div>
              <div className="field"><label>Consultation Fee (₹)</label>
                <input type="number" value={form.billAmount} onChange={e=>set("billAmount",e.target.value)} />
              </div>
            </div>
            <div className="field"><label>Chief Complaint / Notes</label>
              <textarea value={form.notes} onChange={e=>set("notes",e.target.value)} placeholder="e.g. Fever since 2 days, headache…" rows={2}/>
            </div>
            <div style={{display:"flex",gap:"8px"}}>
              <button className="btn btn-primary" type="submit" disabled={saving}>
                {saving
                  ? <span className="spinner" style={{width:"14px",height:"14px"}}/>
                  : <><Plus size={13}/> Create &amp; Print Slip</>
                }
              </button>
              <button className="btn btn-outline" type="button" onClick={() => { setShowForm(false); setErr(""); }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Appointments table */}
      <div className="card">
        <div className="card-header">
          <h3>Today's Appointments</h3>
          <button className="btn btn-outline btn-sm" onClick={load}><RefreshCw size={13} /> Refresh</button>
        </div>
        <div className="search-box">
          <Search size={14}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search patient, receipt, doctor…" />
        </div>
        {loading ? <div className="loading-box"><span className="spinner"/></div> : (
          <div className="table-wrap">
            <table className="data-table resp-cards">
              <thead><tr>
                <th>Receipt No.</th>
                <th>Patient</th>
                <th>Doctor</th>
                <th>Type</th>
                <th>Fee</th>
                <th>Status</th>
                <th>Actions</th>
              </tr></thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={7}><div className="table-empty-state"><Search size={28} /><div>No appointments found</div><p>Try changing your search or filters</p></div></td></tr>
                )}
                {paginated.map((a,i) => (
                  <tr key={i}>
                    <td data-label="Receipt" style={{fontFamily:"monospace",fontSize:"12px",fontWeight:"600"}}>
                      {a.receiptNo || <span style={{color:"var(--danger)",fontSize:"11px"}}>Not generated</span>}
                    </td>
                    <td data-label="Patient" className="cell-name">
                      {a.patientName}
                      <br/><span style={{fontSize:"11px",color:"var(--text-light)"}}>{a.phone}</span>
                    </td>
                    <td data-label="Doctor" style={{fontSize:"12px"}}>{a.doctor}</td>
                    <td data-label="Type" style={{fontSize:"12px"}}>{a.type}</td>
                    <td data-label="Fee" style={{fontWeight:"700"}}>₹{a.bill||a.billAmount||0}</td>
                    <td data-label="Status">{statusBadge(a.status)}</td>
                    <td data-label="Actions">
                      <div style={{display:"flex",gap:"4px",flexWrap:"wrap"}}>
                        {a.receiptNo && (
                          <button className="btn btn-sm btn-outline" title="Print Prescription Slip"
                            onClick={() => setPrintAppt(a)}>
                            <Printer size={12}/> Slip
                          </button>
                        )}
                        {a.receiptNo && (
                          <button className="btn btn-sm btn-outline" title="Full A4 Receipt with Diet & Advice"
                            onClick={() => showUnifiedReceipt(a)}>
                            <FileText size={12}/> Full Receipt
                          </button>
                        )}
                        {a.status === "Scheduled" && a.receiptNo && (
                          <button className="btn btn-sm btn-warning"
                            onClick={() => sendToDoctor(a.receiptNo)}>
                            → Doctor
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="table-footer">
              <span className="table-record-count">{filtered.length} record{filtered.length !== 1 ? "s" : ""}</span>
              <Pager />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
