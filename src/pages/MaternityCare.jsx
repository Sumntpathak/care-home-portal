import { useState, useEffect } from "react";
import { useToast } from "../components/Toast";
import { getPatients, getMaternityFiles, createMaternityFile, addMaternityVisit, addMaternityCareNote, updateMaternityStatus } from "../api/sheets";
import { Search, Plus, X, Baby, Heart, Calendar, Activity, FileText, AlertTriangle, ChevronDown, ChevronUp, CheckCircle, Clock } from "lucide-react";
import { printElement } from "../print";
import { usePagination } from "../components/Pagination";
import { HospitalHeader, HospitalFooter, SectionTitle, SignatureBlock, DataTable, S } from "../print/PrintBlocks";
import { P } from "../print/hospital";
import {
  TRIMESTERS, CARE_TYPES, VISIT_TYPES, RISK_FACTORS, IVF_STAGES, FILE_STATUSES, STATUS_STYLE,
  calcEDD, calcWeeks, getTrimester, getProgress, weeksColor, fmtDate, lmpForWeeks,
} from "../utils/maternity";

const emptyFile = () => ({
  patientName: "", age: "", phone: "", careType: CARE_TYPES[0],
  lmpDate: "", eddDate: "", trimester: TRIMESTERS[0],
  bloodGroup: "", partnerName: "", partnerBloodGroup: "",
  riskFactors: [], obstetrician: "", notes: "",
  ivfCycle: "", ivfStage: IVF_STAGES[0], ivfClinic: "",
});

const emptyVisit = () => ({
  date: new Date().toISOString().split("T")[0], type: VISIT_TYPES[0],
  doctor: "", weight: "", bp: "", fetalHR: "", fundusHeight: "", notes: "", nextVisit: "",
});

const emptyCareNote = () => ({
  date: new Date().toISOString().split("T")[0], shift: "Morning",
  bp: "", weight: "", fetalHR: "", fundusHeight: "",
  edema: "None", urine: "Normal", observations: "", medications: "", nurse: "",
});

/* ── Printable Maternity Report ── */
function MaternityReport({ file }) {
  if (!file) return null;
  const weeks = calcWeeks(file.lmpDate);
  return (
    <div id="print-maternity-report" style={{ fontFamily: "Arial, Helvetica, sans-serif", fontSize: 11, color: P.text, background: P.white }}>
      <HospitalHeader docTitle="MATERNITY CARE RECORD" />
      <SectionTitle>Patient Information</SectionTitle>
      <table style={S.table}><tbody>
        <tr><td style={S.label}>Patient</td><td style={{ ...S.cell, fontWeight: 700 }}>{file.patientName}</td><td style={S.label}>Age</td><td style={S.cell}>{file.age || "—"} yrs</td></tr>
        <tr style={S.rowAlt}><td style={S.label}>Care Type</td><td style={S.cell}>{file.careType}</td><td style={S.label}>Blood Group</td><td style={S.cell}>{file.bloodGroup || "—"}</td></tr>
        <tr><td style={S.label}>LMP Date</td><td style={S.cell}>{file.lmpDate || "—"}</td><td style={S.label}>EDD</td><td style={{ ...S.cell, fontWeight: 700, color: P.accent }}>{file.eddDate || "—"}</td></tr>
        <tr style={S.rowAlt}><td style={S.label}>Weeks</td><td style={S.cell}>{weeks != null ? `${weeks} weeks` : "—"}</td><td style={S.label}>Trimester</td><td style={S.cell}>{file.trimester}</td></tr>
        <tr><td style={S.label}>Status</td><td style={{ ...S.cell, fontWeight: 700 }}>{file.status}</td><td style={S.label}>Obstetrician</td><td style={S.cell}>{file.obstetrician || "—"}</td></tr>
        {file.riskFactors?.length > 0 && <tr style={{ background: P.redBg }}><td style={{ ...S.label, color: P.red }}>Risk Factors</td><td colSpan={3} style={{ ...S.cell, color: P.red, fontWeight: 600 }}>{file.riskFactors.join(", ")}</td></tr>}
        {file.deliveryDate && <tr><td style={S.label}>Delivery Date</td><td style={S.cell}>{file.deliveryDate}</td><td style={S.label}>Delivery Notes</td><td style={S.cell}>{file.deliveryNotes || "—"}</td></tr>}
      </tbody></table>

      {file.careType?.includes("IVF") && (
        <><SectionTitle>IVF Treatment</SectionTitle>
        <table style={S.table}><tbody>
          <tr><td style={S.label}>Cycle</td><td style={S.cell}>{file.ivfCycle || "—"}</td><td style={S.label}>Stage</td><td style={{ ...S.cell, fontWeight: 700 }}>{file.ivfStage}</td></tr>
          <tr style={S.rowAlt}><td style={S.label}>Clinic</td><td colSpan={3} style={S.cell}>{file.ivfClinic || "—"}</td></tr>
        </tbody></table></>
      )}

      {file.visits?.length > 0 && (
        <><SectionTitle>Visit History ({file.visits.length})</SectionTitle>
        <DataTable
          headers={["Date", "Type", "Doctor", "Wt(kg)", "BP", "FHR", "Fundus", "Notes"]}
          rows={file.visits.map(v => [v.date, v.type, v.doctor || "—", v.weight || "—", v.bp || "—", v.fetalHR || "—", v.fundusHeight || "—", <span key={v.date} style={{ fontSize: 9 }}>{v.notes || "—"}</span>])}
        /></>
      )}

      {file.careNotes?.length > 0 && (
        <><SectionTitle>Daily Care Notes ({file.careNotes.length})</SectionTitle>
        <DataTable
          headers={["Date", "Shift", "BP", "Wt", "FHR", "Edema", "Observations", "Medications", "Nurse"]}
          rows={file.careNotes.map(n => [n.date, n.shift, n.bp || "—", n.weight || "—", n.fetalHR || "—", n.edema || "—", <span key={n.date} style={{ fontSize: 9 }}>{n.observations || "—"}</span>, <span key={n.date+"m"} style={{ fontSize: 9 }}>{n.medications || "—"}</span>, n.nurse || "—"])}
        /></>
      )}

      <SignatureBlock signatures={[{ label: "Obstetrician" }, { label: "Nursing In-Charge" }, { label: "Patient / Guardian" }]} />
      <HospitalFooter />
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ════════════════════════════════════════════════════════════════ */
export default function MaternityCare() {
  const { addToast } = useToast();
  const [files, setFiles] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [form, setForm] = useState(emptyFile());
  const [showPrint, setShowPrint] = useState(null);

  // Sub-forms
  const [visitFormId, setVisitFormId] = useState(null);
  const [newVisit, setNewVisit] = useState(emptyVisit());
  const [noteFormId, setNoteFormId] = useState(null);
  const [newNote, setNewNote] = useState(emptyCareNote());
  const [deliveryFormId, setDeliveryFormId] = useState(null);
  const [deliveryInfo, setDeliveryInfo] = useState({ deliveryDate: new Date().toISOString().split("T")[0], deliveryNotes: "" });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const setV = (k, v) => setNewVisit(p => ({ ...p, [k]: v }));
  const setN = (k, v) => setNewNote(p => ({ ...p, [k]: v }));

  const load = async () => {
    setLoading(true);
    try {
      const [mf, pt] = await Promise.all([getMaternityFiles(), getPatients()]);
      setFiles(Array.isArray(mf) ? mf : (mf?.data || []));
      setPatients(Array.isArray(pt) ? pt : pt?.data || []);
    } catch {} finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  /* ── Create file ── */
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.patientName?.trim()) { addToast("Patient name is required.", "error"); return; }
    if (!form.lmp && !form.lmpDate) { addToast("LMP date is required for gestational calculation.", "error"); return; }
    const edd = form.eddDate || calcEDD(form.lmpDate);
    const weeks = calcWeeks(form.lmpDate);
    const trimester = getTrimester(weeks);
    await createMaternityFile({ ...form, eddDate: edd, trimester });
    setForm(emptyFile());
    setShowForm(false);
    load();
  };

  /* ── Add visit ── */
  const handleAddVisit = async (fileId) => {
    await addMaternityVisit(fileId, newVisit);
    setVisitFormId(null);
    setNewVisit(emptyVisit());
    load();
  };

  /* ── Add care note ── */
  const handleAddNote = async (fileId) => {
    await addMaternityCareNote(fileId, newNote);
    setNoteFormId(null);
    setNewNote(emptyCareNote());
    load();
  };

  /* ── Status transitions ── */
  const handleMarkActive = async (fileId) => {
    await updateMaternityStatus(fileId, "Active");
    load();
  };
  const handleDelivery = async (fileId) => {
    await updateMaternityStatus(fileId, "Delivered", deliveryInfo);
    setDeliveryFormId(null);
    load();
  };
  const handleClose = async (fileId) => {
    await updateMaternityStatus(fileId, "Closed", { closedReason: "Normal Closure" });
    load();
  };

  const handleLmpChange = (v) => { set("lmpDate", v); set("eddDate", calcEDD(v)); set("trimester", getTrimester(calcWeeks(v))); };
  const toggleRisk = (r) => { const cur = form.riskFactors || []; set("riskFactors", cur.includes(r) ? cur.filter(x => x !== r) : [...cur, r]); };

  const filtered = files.filter(f => {
    const q = search.toLowerCase();
    return f.patientName?.toLowerCase().includes(q) || f.careType?.toLowerCase().includes(q) || f.obstetrician?.toLowerCase().includes(q) || f.id?.toLowerCase().includes(q);
  });

  const { paginated, Pager } = usePagination(filtered, 25);

  return (
    <div className="fade-in">
      {/* Print modal */}
      {showPrint != null && (
        <div className="modal-backdrop">
          <div className="modal-sheet print-receipt" style={{ maxWidth: "780px" }}>
            <MaternityReport file={files.find(f => f.id === showPrint)} />
            <div className="no-print" style={{ display: "flex", gap: 8, marginTop: 14 }}>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => printElement("print-maternity-report", { pageSize: "A4" })}><FileText size={14} /> Print</button>
              <button className="btn btn-outline" onClick={() => setShowPrint(null)}><X size={14} /> Close</button>
            </div>
          </div>
        </div>
      )}

      <div className="page-header">
        <div>
          <h2 style={{ display: "flex", alignItems: "center", gap: 8 }}><Baby size={22} /> Maternity & IVF Care</h2>
          <p>{files.length} active files · Pregnancy tracking, prenatal visits, IVF cycles</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}><Plus size={13} /> New File</button>
      </div>

      {/* ── Create Form ── */}
      {showForm && (
        <div className="card" style={{ border: "2px solid var(--primary)", marginBottom: 16 }}>
          <div className="card-header"><h3>Create Maternity File</h3><button className="btn-icon" onClick={() => setShowForm(false)}><X size={15} /></button></div>
          <form onSubmit={handleCreate} className="form-grid">
            <div className="form-row">
              <div className="field">
                <label>Patient Name <span className="req">*</span></label>
                <input list="mat-patients" value={form.patientName} onChange={e => { set("patientName", e.target.value); const p = patients.find(p => p.name === e.target.value); if (p) { set("age", p.age || ""); set("phone", p.phone || ""); set("bloodGroup", p.bloodGroup || ""); }}} />
                <datalist id="mat-patients">{patients.filter(p => p.gender === "Female" || !p.gender).map((p, i) => <option key={i} value={p.name} />)}</datalist>
              </div>
              <div className="field"><label>Age</label><input type="number" value={form.age} onChange={e => set("age", e.target.value)} /></div>
              <div className="field"><label>Phone</label><input value={form.phone} onChange={e => set("phone", e.target.value)} /></div>
            </div>
            <div className="form-row3">
              <div className="field"><label>Care Type</label><select value={form.careType} onChange={e => set("careType", e.target.value)}>{CARE_TYPES.map(t => <option key={t}>{t}</option>)}</select></div>
              <div className="field"><label>Blood Group</label><input value={form.bloodGroup} onChange={e => set("bloodGroup", e.target.value)} placeholder="B+" /></div>
              <div className="field"><label>Obstetrician</label><input value={form.obstetrician} onChange={e => set("obstetrician", e.target.value)} /></div>
            </div>
            <div className="form-row3">
              <div className="field"><label>LMP Date</label><input type="date" value={form.lmpDate} onChange={e => handleLmpChange(e.target.value)} /></div>
              <div className="field"><label>EDD (auto-calculated)</label><input type="date" value={form.eddDate} onChange={e => set("eddDate", e.target.value)} style={{ fontWeight: 700, color: "var(--primary)" }} /></div>
              <div className="field"><label>Trimester</label><input value={form.trimester} readOnly style={{ background: "var(--subtle)" }} /></div>
            </div>
            <div className="form-row">
              <div className="field"><label>Partner Name</label><input value={form.partnerName} onChange={e => set("partnerName", e.target.value)} /></div>
              <div className="field"><label>Partner Blood Group</label><input value={form.partnerBloodGroup} onChange={e => set("partnerBloodGroup", e.target.value)} /></div>
            </div>
            {form.careType?.includes("IVF") && (
              <div className="form-row3">
                <div className="field"><label>IVF Cycle</label><input value={form.ivfCycle} onChange={e => set("ivfCycle", e.target.value)} placeholder="Cycle 1" /></div>
                <div className="field"><label>IVF Stage</label><select value={form.ivfStage} onChange={e => set("ivfStage", e.target.value)}>{IVF_STAGES.map(s => <option key={s}>{s}</option>)}</select></div>
                <div className="field"><label>IVF Clinic</label><input value={form.ivfClinic} onChange={e => set("ivfClinic", e.target.value)} /></div>
              </div>
            )}
            <div className="field">
              <label>Risk Factors</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
                {RISK_FACTORS.map(r => (
                  <button key={r} type="button" onClick={() => toggleRisk(r)} style={{ padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer", border: "1px solid", background: form.riskFactors?.includes(r) ? "var(--danger-light)" : "var(--subtle)", color: form.riskFactors?.includes(r) ? "var(--danger)" : "var(--text-muted)", borderColor: form.riskFactors?.includes(r) ? "var(--danger)" : "var(--border)" }}>{r}</button>
                ))}
              </div>
            </div>
            <div className="field"><label>Notes</label><textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={2} /></div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-primary" type="submit"><Plus size={13} /> Create</button>
              <button className="btn btn-outline" type="button" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Search */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="search-box"><Search size={14} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, type, doctor..." /></div>
      </div>

      {/* ── Files ── */}
      {loading ? <div className="loading-box"><span className="spinner" /></div> : filtered.length === 0 ? (
        <div className="card" style={{ padding: 48, textAlign: "center" }}>
          <Baby size={32} style={{ color: "var(--text-light)", marginBottom: 12 }} />
          <h3>No maternity files</h3>
          <p style={{ color: "var(--text-muted)", fontSize: 13 }}>Create a new file to start tracking.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {paginated.map((f) => {
            const isExpanded = expandedId === f.id;
            const weeks = calcWeeks(f.lmpDate);
            const progress = getProgress(f.lmpDate);
            const isIVF = f.careType?.includes("IVF");
            const sSt = STATUS_STYLE[f.status] || STATUS_STYLE.Open;
            const isClosed = f.status === "Closed";

            return (
              <div key={f.id} className="card" style={{ opacity: isClosed ? 0.6 : 1, border: f.riskFactors?.length > 0 && !isClosed ? "1px solid var(--danger)" : undefined }}>
                {/* Card header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", gap: 10 }} onClick={() => setExpandedId(isExpanded ? null : f.id)}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
                    <div style={{ width: 38, height: 38, borderRadius: "50%", background: isIVF ? "var(--purple-light)" : "var(--primary-light)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {isIVF ? <Heart size={18} style={{ color: "var(--purple)" }} /> : <Baby size={18} style={{ color: "var(--primary)" }} />}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text)" }}>{f.patientName} <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 600, background: sSt.bg, color: sSt.color, marginLeft: 6 }}>{sSt.label}</span></div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <span>{f.careType}</span>
                        {f.obstetrician && <span>· {f.obstetrician}</span>}
                        {f.eddDate && <span>· EDD: <strong>{f.eddDate}</strong></span>}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                    {weeks != null && <span style={{ background: `color-mix(in srgb, ${weeksColor(weeks)} 12%, transparent)`, color: weeksColor(weeks), padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700 }}>{weeks}w</span>}
                    {f.riskFactors?.length > 0 && <AlertTriangle size={16} style={{ color: "var(--danger)" }} />}
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </div>

                {/* Progress bar */}
                {weeks != null && !isClosed && (
                  <div style={{ marginTop: 10, background: "var(--subtle)", borderRadius: 8, height: 6, overflow: "hidden" }}>
                    <div style={{ width: `${progress}%`, height: "100%", borderRadius: 8, background: progress > 90 ? "var(--danger)" : progress > 65 ? "var(--warning)" : "var(--success)", transition: "width .3s" }} />
                  </div>
                )}

                {/* ── EXPANDED CONTENT ── */}
                {isExpanded && (
                  <div style={{ marginTop: 14, borderTop: "1px solid var(--border)", paddingTop: 14 }}>
                    {/* Info grid */}
                    <div className="detail-grid" style={{ marginBottom: 14 }}>
                      {[["Age", f.age ? `${f.age} yrs` : "—"], ["Blood Group", f.bloodGroup || "—"], ["LMP", f.lmpDate || "—"], ["EDD", f.eddDate || "—"], ["Trimester", f.trimester || "—"], ["Partner", f.partnerName || "—"], ["Phone", f.phone || "—"], ["Status", f.status]].map(([k, v]) => (
                        <div key={k} className="detail-item"><div className="d-label">{k}</div><div className="d-value">{v}</div></div>
                      ))}
                    </div>

                    {/* Delivery info */}
                    {f.deliveryDate && (
                      <div style={{ background: "var(--purple-light)", borderRadius: 8, padding: 12, marginBottom: 14, border: "1px solid var(--purple)" }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--purple)", marginBottom: 4 }}>Delivery Details</div>
                        <div style={{ fontSize: 12 }}>Date: <strong>{f.deliveryDate}</strong> &nbsp; {f.deliveryNotes && <span>{f.deliveryNotes}</span>}</div>
                      </div>
                    )}

                    {/* IVF section */}
                    {isIVF && (
                      <div style={{ background: "var(--purple-light)", borderRadius: 8, padding: 12, marginBottom: 14, border: "1px solid var(--purple)" }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--purple)", marginBottom: 4 }}>IVF Treatment</div>
                        <div style={{ display: "flex", gap: 16, fontSize: 12, flexWrap: "wrap" }}>
                          <span>Cycle: <strong>{f.ivfCycle || "—"}</strong></span>
                          <span>Stage: <strong>{f.ivfStage}</strong></span>
                          <span>Clinic: <strong>{f.ivfClinic || "—"}</strong></span>
                        </div>
                      </div>
                    )}

                    {/* Risk factors */}
                    {f.riskFactors?.length > 0 && (
                      <div style={{ background: "var(--danger-light)", borderRadius: 8, padding: 10, marginBottom: 14 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--danger)", marginBottom: 4 }}>Risk Factors</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                          {f.riskFactors.map(r => <span key={r} style={{ padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 600, background: "rgba(239,68,68,.08)", color: "var(--danger)" }}>{r}</span>)}
                        </div>
                      </div>
                    )}

                    {/* ── VISITS SECTION ── */}
                    {!isClosed && (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                        <div className="section-title" style={{ margin: 0 }}>Visits ({f.visits?.length || 0})</div>
                        <button className="btn btn-primary btn-sm" onClick={() => { setVisitFormId(f.id); setNewVisit(emptyVisit()); }}><Plus size={12} /> Add Visit</button>
                      </div>
                    )}

                    {visitFormId === f.id && (
                      <div style={{ background: "var(--subtle)", borderRadius: 8, padding: 14, marginBottom: 12, border: "1px solid var(--border)" }}>
                        <div className="form-row3">
                          <div className="field"><label>Date</label><input type="date" value={newVisit.date} onChange={e => setV("date", e.target.value)} /></div>
                          <div className="field"><label>Type</label><select value={newVisit.type} onChange={e => setV("type", e.target.value)}>{VISIT_TYPES.map(t => <option key={t}>{t}</option>)}</select></div>
                          <div className="field"><label>Doctor</label><input value={newVisit.doctor} onChange={e => setV("doctor", e.target.value)} /></div>
                        </div>
                        <div className="form-row" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
                          <div className="field"><label>Weight (kg)</label><input value={newVisit.weight} onChange={e => setV("weight", e.target.value)} /></div>
                          <div className="field"><label>BP</label><input value={newVisit.bp} onChange={e => setV("bp", e.target.value)} placeholder="120/80" /></div>
                          <div className="field"><label>Fetal HR (bpm)</label><input value={newVisit.fetalHR} onChange={e => setV("fetalHR", e.target.value)} /></div>
                          <div className="field"><label>Fundus (cm)</label><input value={newVisit.fundusHeight} onChange={e => setV("fundusHeight", e.target.value)} /></div>
                        </div>
                        <div className="form-row">
                          <div className="field"><label>Notes</label><textarea value={newVisit.notes} onChange={e => setV("notes", e.target.value)} rows={2} /></div>
                          <div className="field"><label>Next Visit</label><input type="date" value={newVisit.nextVisit} onChange={e => setV("nextVisit", e.target.value)} /></div>
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button className="btn btn-primary btn-sm" onClick={() => handleAddVisit(f.id)}>Save Visit</button>
                          <button className="btn btn-outline btn-sm" onClick={() => setVisitFormId(null)}>Cancel</button>
                        </div>
                      </div>
                    )}

                    {f.visits?.length > 0 && (
                      <div className="table-wrap" style={{ marginBottom: 14 }}>
                        <table className="data-table" style={{ fontSize: 12 }}>
                          <thead><tr><th>Date</th><th>Type</th><th>Doctor</th><th>Wt</th><th>BP</th><th>FHR</th><th>Notes</th><th>Next</th></tr></thead>
                          <tbody>
                            {f.visits.map((v, vi) => (
                              <tr key={vi}>
                                <td style={{ whiteSpace: "nowrap" }}>{v.date}</td>
                                <td><span style={{ padding: "2px 6px", borderRadius: 4, fontSize: 10, fontWeight: 600, background: v.type?.includes("IVF") ? "var(--purple-light)" : v.type?.includes("Emergency") ? "var(--danger-light)" : "var(--primary-light)", color: v.type?.includes("IVF") ? "var(--purple)" : v.type?.includes("Emergency") ? "var(--danger)" : "var(--primary)" }}>{v.type}</span></td>
                                <td>{v.doctor || "—"}</td>
                                <td>{v.weight ? `${v.weight}kg` : "—"}</td>
                                <td>{v.bp || "—"}</td>
                                <td>{v.fetalHR || "—"}</td>
                                <td style={{ fontSize: 11, maxWidth: 200 }}>{v.notes || "—"}</td>
                                <td style={{ whiteSpace: "nowrap" }}>{v.nextVisit || "—"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* ── CARE NOTES SECTION ── */}
                    {!isClosed && (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                        <div className="section-title" style={{ margin: 0 }}>Daily Care Notes ({f.careNotes?.length || 0})</div>
                        <button className="btn btn-outline btn-sm" onClick={() => { setNoteFormId(f.id); setNewNote(emptyCareNote()); }}><Plus size={12} /> Add Note</button>
                      </div>
                    )}

                    {noteFormId === f.id && (
                      <div style={{ background: "var(--subtle)", borderRadius: 8, padding: 14, marginBottom: 12, border: "1px solid var(--border)" }}>
                        <div className="form-row3">
                          <div className="field"><label>Date</label><input type="date" value={newNote.date} onChange={e => setN("date", e.target.value)} /></div>
                          <div className="field"><label>Shift</label><select value={newNote.shift} onChange={e => setN("shift", e.target.value)}><option>Morning</option><option>Afternoon</option><option>Night</option></select></div>
                          <div className="field"><label>Nurse</label><input value={newNote.nurse} onChange={e => setN("nurse", e.target.value)} /></div>
                        </div>
                        <div className="form-row" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
                          <div className="field"><label>BP</label><input value={newNote.bp} onChange={e => setN("bp", e.target.value)} placeholder="120/80" /></div>
                          <div className="field"><label>Weight (kg)</label><input value={newNote.weight} onChange={e => setN("weight", e.target.value)} /></div>
                          <div className="field"><label>Fetal HR</label><input value={newNote.fetalHR} onChange={e => setN("fetalHR", e.target.value)} /></div>
                          <div className="field"><label>Fundus (cm)</label><input value={newNote.fundusHeight} onChange={e => setN("fundusHeight", e.target.value)} /></div>
                        </div>
                        <div className="form-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                          <div className="field"><label>Edema</label><select value={newNote.edema} onChange={e => setN("edema", e.target.value)}><option>None</option><option>Mild ankle</option><option>Moderate</option><option>Severe</option></select></div>
                          <div className="field"><label>Urine</label><select value={newNote.urine} onChange={e => setN("urine", e.target.value)}><option>Normal</option><option>Trace protein</option><option>1+ protein</option><option>2+ protein</option></select></div>
                        </div>
                        <div className="field"><label>Observations</label><textarea value={newNote.observations} onChange={e => setN("observations", e.target.value)} rows={2} /></div>
                        <div className="field"><label>Medications Given</label><textarea value={newNote.medications} onChange={e => setN("medications", e.target.value)} rows={1} /></div>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button className="btn btn-primary btn-sm" onClick={() => handleAddNote(f.id)}>Save Note</button>
                          <button className="btn btn-outline btn-sm" onClick={() => setNoteFormId(null)}>Cancel</button>
                        </div>
                      </div>
                    )}

                    {f.careNotes?.length > 0 && (
                      <div style={{ marginBottom: 14 }}>
                        {f.careNotes.slice(0, 5).map((n, ni) => (
                          <div key={ni} style={{ border: "1px solid var(--border)", borderRadius: 8, padding: 12, marginBottom: 8, background: "var(--card)" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 12 }}>
                              <span style={{ fontWeight: 700 }}>{n.date} — {n.shift}</span>
                              <span style={{ color: "var(--text-muted)" }}>{n.nurse || "Nurse"}</span>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6, marginBottom: 8 }}>
                              {[["BP", n.bp], ["Wt", n.weight ? `${n.weight}kg` : "—"], ["FHR", n.fetalHR || "—"], ["Edema", n.edema || "—"]].map(([k, v]) => (
                                <div key={k} style={{ background: "var(--subtle)", borderRadius: 6, padding: "4px 8px", fontSize: 11 }}>
                                  <div style={{ fontSize: 9, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>{k}</div>
                                  <div style={{ fontWeight: 700 }}>{v || "—"}</div>
                                </div>
                              ))}
                            </div>
                            {n.observations && <div style={{ fontSize: 11, color: "var(--text-secondary)" }}><strong>Obs:</strong> {typeof n.observations === "string" ? n.observations : JSON.stringify(n.observations)}</div>}
                            {n.medications && <div style={{ fontSize: 11, color: "var(--text-secondary)" }}><strong>Meds:</strong> {typeof n.medications === "string" ? n.medications : Array.isArray(n.medications) ? n.medications.map(m => typeof m === "string" ? m : `${m.medication || m.name || ""}${m.dose ? ` (${m.dose})` : ""}`).filter(Boolean).join(", ") : JSON.stringify(n.medications)}</div>}
                          </div>
                        ))}
                        {f.careNotes.length > 5 && <div style={{ fontSize: 11, color: "var(--text-muted)", textAlign: "center" }}>+{f.careNotes.length - 5} more notes (visible in print report)</div>}
                      </div>
                    )}

                    {/* ── STATUS ACTIONS ── */}
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14, borderTop: "1px solid var(--border)", paddingTop: 14 }}>
                      {f.status === "Open" && <button className="btn btn-sm" style={{ background: "var(--success)", color: "#fff", border: "none" }} onClick={() => handleMarkActive(f.id)}><CheckCircle size={12} /> Mark Active</button>}
                      {f.status === "Active" && (
                        deliveryFormId === f.id ? (
                          <div style={{ display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap" }}>
                            <div className="field" style={{ marginBottom: 0 }}><label>Delivery Date</label><input type="date" value={deliveryInfo.deliveryDate} onChange={e => setDeliveryInfo(p => ({ ...p, deliveryDate: e.target.value }))} /></div>
                            <div className="field" style={{ marginBottom: 0, flex: 1, minWidth: 200 }}><label>Notes (baby weight, type, APGAR)</label><input value={deliveryInfo.deliveryNotes} onChange={e => setDeliveryInfo(p => ({ ...p, deliveryNotes: e.target.value }))} placeholder="Normal delivery, 3.2kg, APGAR 8/9" /></div>
                            <button className="btn btn-sm" style={{ background: "var(--purple)", color: "#fff", border: "none" }} onClick={() => handleDelivery(f.id)}>Confirm Delivery</button>
                            <button className="btn btn-sm btn-outline" onClick={() => setDeliveryFormId(null)}>Cancel</button>
                          </div>
                        ) : <button className="btn btn-sm" style={{ background: "var(--purple)", color: "#fff", border: "none" }} onClick={() => setDeliveryFormId(f.id)}><Baby size={12} /> Record Delivery</button>
                      )}
                      {f.status === "Delivered" && <button className="btn btn-sm btn-outline" onClick={() => handleClose(f.id)}><Clock size={12} /> Close File</button>}
                      <button className="btn btn-outline btn-sm" onClick={() => setShowPrint(f.id)}><FileText size={12} /> Print Report</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          <Pager />
        </div>
      )}
    </div>
  );
}
