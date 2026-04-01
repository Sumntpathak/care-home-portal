import { useState, useEffect } from "react";
import { getHomeCarePatients, addHomeCarePatient, getHomeCareNotes, addHomeCareNote, updateHomeCarePatient, getMedSchedule } from "../api/sheets";
import { Plus, X, BedDouble, Printer, ChevronDown, ChevronUp, LogOut, FileText, Filter, Leaf, Activity, TrendingUp } from "lucide-react";
import { generateDietPlan } from "../utils/healthAdvisor";
import { generateVitalsReport, getChartConfig } from "../utils/vitalsEngine";
import { validateDischargeSummary, checkDischargeReadiness } from "../utils/nabhTemplates";
import { printElement, DailyCareReport, DischargeFile } from "../print";
import { usePagination } from "../components/Pagination";
import { useToast } from "../components/Toast";
import { useAuth } from "../context/AuthContext";

const VITALS_TEMPLATE = { temp:"", bp:"", pulse:"", spo2:"", glucose:"", weight:"" };

/* ───────────────────── Complete Patient File (uses centralized template) ───────────────────── */
function DischargeFileView({ patient, notes, medications, dischargeInfo, onClose }) {
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.55)",backdropFilter:"blur(2px)",zIndex:2000,display:"flex",alignItems:"flex-start",justifyContent:"center",padding:"clamp(16px, 4vw, 40px)",paddingTop:"clamp(24px, 5vh, 60px)",overflowY:"auto"}}>
      <div style={{background:"#fff",borderRadius:"10px",padding:"24px",maxWidth:"min(95vw, 800px)",width:"100%",boxShadow:"0 4px 24px rgba(0,0,0,.2)",maxHeight:"calc(100vh - 80px)",overflowY:"auto",animation:"modalIn .2s ease-out"}}>
        <div className="no-print" style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"16px"}}>
          <h3 style={{fontSize:"16px",fontWeight:"700",color:"var(--text)"}}>Complete Patient File — {patient.name}</h3>
          <div style={{display:"flex",gap:"6px"}}>
            <button className="btn btn-primary btn-sm" onClick={() => printElement("print-discharge", { pageSize: "A4" })}><Printer size={12}/> Print File</button>
            <button className="btn-icon" onClick={onClose}><X size={15}/></button>
          </div>
        </div>
        <DischargeFile data={{ patient, notes, medications, dischargeInfo }} />
      </div>
    </div>
  );
}


/* ───────────────────── Discharge Modal ───────────────────── */
function DischargeModal({ patient, onClose, onDischarged }) {
  const { addToast } = useToast();
  const [step, setStep] = useState("form"); // "form" | "file"
  const [saving, setSaving] = useState(false);
  const [loadingFile, setLoadingFile] = useState(false);
  const [notes, setNotes] = useState([]);
  const [medications, setMedications] = useState([]);
  const [dischargeInfo, setDischargeInfo] = useState({
    dischargeDate: new Date().toISOString().split("T")[0],
    dischargeReason: "Recovery / Improvement",
    dischargeSummary: "",
  });

  const setField = (k, v) => setDischargeInfo(prev => ({ ...prev, [k]: v }));

  const handleDischarge = async () => {
    if (!dischargeInfo.dischargeDate) return;

    // NABH discharge validation
    const nabhResult = validateDischargeSummary({
      name: patient?.name,
      admissionDate: patient?.admitDate,
      dischargeDate: dischargeInfo.dischargeDate || new Date().toISOString().split("T")[0],
      conditionAtDischarge: dischargeInfo.dischargeReason || "Improved",
      treatmentGiven: dischargeInfo.dischargeSummary || "",
      warningSignsSigns: "",
      primaryDiagnosis: patient?.condition || "",
      dischargingDoctor: "",
    });

    if (!nabhResult.valid) {
      const missingFields = nabhResult.errors.filter(e => e.severity === "error").map(e => e.field).join(", ");
      addToast(`NABH validation: ${missingFields} required before discharge.`, "warning");
    }

    setSaving(true);
    try {
      await updateHomeCarePatient({
        id: patient.id,
        status: "Discharged",
        notes: `Discharged on ${dischargeInfo.dischargeDate}. Reason: ${dischargeInfo.dischargeReason}. Summary: ${dischargeInfo.dischargeSummary}`,
      });
      onDischarged();
    } catch {
      addToast("Failed to discharge patient.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateFile = async () => {
    setLoadingFile(true);
    try {
      // Fetch all care notes
      const notesRes = await getHomeCareNotes(patient.id);
      const fetchedNotes = Array.isArray(notesRes) ? notesRes : notesRes.data || [];
      // Sort chronologically
      fetchedNotes.sort((a, b) => {
        const da = a.date || ""; const db = b.date || "";
        if (da !== db) return da.localeCompare(db);
        const shiftOrder = { Morning: 0, Afternoon: 1, Evening: 2, Night: 3 };
        return (shiftOrder[a.shift] || 0) - (shiftOrder[b.shift] || 0);
      });
      setNotes(fetchedNotes);

      // Fetch med schedules
      try {
        const medRes = await getMedSchedule();
        const allMeds = Array.isArray(medRes) ? medRes : medRes.data || [];
        const patientMeds = allMeds.filter(m =>
          String(m.patientId || m.patient_id || "").trim() === String(patient.id).trim() ||
          String(m.patientName || m.patient || "").toLowerCase().trim() === String(patient.name).toLowerCase().trim()
        );
        setMedications(patientMeds);
      } catch {
        setMedications([]);
        addToast("Failed to load medications.", "error");
      }

      setStep("file");
    } catch {
      setNotes([]);
      addToast("Failed to load patient notes.", "error");
      setStep("file");
    } finally {
      setLoadingFile(false);
    }
  };

  if (step === "file") {
    return (
      <DischargeFileView
        patient={patient}
        notes={notes}
        medications={medications}
        dischargeInfo={dischargeInfo}
        onClose={onClose}
      />
    );
  }

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.55)",backdropFilter:"blur(2px)",zIndex:1000,display:"flex",alignItems:"flex-start",justifyContent:"center",padding:"clamp(16px, 4vw, 40px)",paddingTop:"clamp(24px, 5vh, 60px)",overflowY:"auto"}}>
      <div style={{background:"#fff",borderRadius:"10px",padding:"24px",maxWidth:"min(95vw, 520px)",width:"100%",boxShadow:"0 4px 24px rgba(0,0,0,.15)",maxHeight:"calc(100vh - 80px)",overflowY:"auto",animation:"modalIn .2s ease-out"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"16px"}}>
          <div>
            <h3 style={{fontSize:"16px",fontWeight:"700",color:"var(--text)"}}>Discharge Patient</h3>
            <p style={{fontSize:"12px",color:"var(--text-light)"}}>{patient.name} — Room {patient.room || "—"}</p>
          </div>
          <button className="btn-icon" onClick={onClose}><X size={15}/></button>
        </div>

        <div style={{background:"#fef3c7",border:"1px solid #f59e0b",borderRadius:"8px",padding:"10px 14px",marginBottom:"16px",fontSize:"12px",color:"#92400e"}}>
          <strong>Note:</strong> Discharging will mark this patient as inactive. You can generate a complete patient file before or after discharge.
        </div>

        <div className="form-grid" style={{gap:"12px"}}>
          <div className="field">
            <label>Discharge Date <span className="req">*</span></label>
            <input type="date" value={dischargeInfo.dischargeDate} onChange={e => setField("dischargeDate", e.target.value)} />
          </div>
          <div className="field">
            <label>Reason for Discharge</label>
            <select value={dischargeInfo.dischargeReason} onChange={e => setField("dischargeReason", e.target.value)}>
              <option>Recovery / Improvement</option>
              <option>Transferred to Hospital</option>
              <option>Against Medical Advice (AMA)</option>
              <option>Family Request</option>
              <option>Referred to Specialist</option>
              <option>Completed Treatment</option>
              <option>Other</option>
            </select>
          </div>
          <div className="field">
            <label>Discharge Summary &amp; Instructions</label>
            <textarea
              value={dischargeInfo.dischargeSummary}
              onChange={e => setField("dischargeSummary", e.target.value)}
              rows={4}
              placeholder="Enter discharge summary, follow-up instructions, medications to continue, dietary advice, next appointment date, etc."
            />
          </div>
        </div>

        {/* NABH Completeness Check */}
        {(() => {
          const nabhCheck = validateDischargeSummary({
            name: patient?.name,
            admissionDate: patient?.admitDate,
            dischargeDate: dischargeInfo.dischargeDate || new Date().toISOString().split("T")[0],
            conditionAtDischarge: dischargeInfo.dischargeReason || "Improved",
            treatmentGiven: dischargeInfo.dischargeSummary || "",
            warningSignsSigns: "",
            primaryDiagnosis: patient?.condition || "",
            dischargingDoctor: "",
          });
          return (
            <div style={{ padding: "10px 14px", background: nabhCheck?.completeness >= 80 ? "var(--success-light, #dcfce7)" : "var(--warning-light, #fef3c7)", borderRadius: 8, fontSize: 12, marginBottom: 10, marginTop: 16 }}>
              <strong>NABH Completeness:</strong> {nabhCheck?.completeness || 0}% — {nabhCheck?.valid ? "Ready for discharge" : `${nabhCheck?.errors?.filter(e => e.severity === "error").length || 0} mandatory fields missing`}
            </div>
          );
        })()}

        <div style={{display:"flex",gap:"8px",marginTop:"16px",flexWrap:"wrap"}}>
          <button
            className="btn btn-primary"
            onClick={async () => { await handleDischarge(); await handleGenerateFile(); }}
            disabled={saving || loadingFile}
            style={{background:"#dc2626",borderColor:"#dc2626"}}
          >
            {saving ? "Discharging..." : loadingFile ? "Generating File..." : "Discharge & Generate File"}
          </button>
          <button
            className="btn btn-outline"
            onClick={handleGenerateFile}
            disabled={loadingFile}
            style={{borderColor:"#1a3558",color:"#1a3558"}}
          >
            <FileText size={13}/> {loadingFile ? "Loading..." : "Generate File Only (Preview)"}
          </button>
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────── Daily Notes Modal ───────────────────── */
/* ───────────────────── Mini SVG Line Chart ───────────────────── */
function MiniLineChart({ data, config, width = "100%", height = 80 }) {
  if (!data || data.length < 2) return null;

  const values = data.map(d => d.value);
  const [normalMin, normalMax] = config.normalRange || [0, 0];
  const dataMin = Math.min(...values, normalMin || Infinity);
  const dataMax = Math.max(...values, normalMax || -Infinity);
  const padding = (dataMax - dataMin) * 0.15 || 5;
  const yMin = dataMin - padding;
  const yMax = dataMax + padding;
  const yRange = yMax - yMin || 1;

  const svgW = 300;
  const svgH = 80;
  const padL = 6;
  const padR = 6;
  const padT = 6;
  const padB = 18;
  const plotW = svgW - padL - padR;
  const plotH = svgH - padT - padB;

  const toX = (i) => padL + (i / (data.length - 1)) * plotW;
  const toY = (v) => padT + plotH - ((v - yMin) / yRange) * plotH;

  const points = data.map((d, i) => `${toX(i)},${toY(d.value)}`).join(" ");

  const statusColor = (s) =>
    s === "critical" ? "#ef4444" : s === "caution" ? "#f59e0b" : "#22c55e";

  const normalY1 = normalMin > 0 ? toY(Math.min(normalMax, yMax)) : 0;
  const normalY2 = normalMin > 0 ? toY(Math.max(normalMin, yMin)) : 0;
  const showNormalBand = normalMin > 0 && normalMax > 0;

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const parts = dateStr.split("-");
    if (parts.length === 3) return `${parts[2]}/${parts[1]}`;
    return dateStr.slice(-5);
  };

  return (
    <svg
      viewBox={`0 0 ${svgW} ${svgH}`}
      width={width}
      height={height}
      style={{ display: "block" }}
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Normal range band */}
      {showNormalBand && (
        <rect
          x={padL} y={normalY1}
          width={plotW} height={Math.max(normalY2 - normalY1, 1)}
          fill="#22c55e" opacity={0.1} rx={2}
        />
      )}
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((f, i) => (
        <line key={i}
          x1={padL} x2={padL + plotW}
          y1={padT + plotH * (1 - f)} y2={padT + plotH * (1 - f)}
          stroke="var(--border, #e2e8f0)" strokeWidth={0.5} opacity={0.6}
        />
      ))}
      {/* Data line */}
      <polyline
        points={points}
        fill="none"
        stroke={config.color || "#3b82f6"}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Data points */}
      {data.map((d, i) => (
        <circle key={i}
          cx={toX(i)} cy={toY(d.value)}
          r={3}
          fill={statusColor(d.status || "normal")}
          stroke="var(--surface, #fff)" strokeWidth={1.5}
        />
      ))}
      {/* Min / Max labels */}
      <text x={padL + plotW + 2} y={padT + 4} fontSize={7} fill="var(--text-muted, #94a3b8)" textAnchor="start">
        {Math.round(yMax * 10) / 10}
      </text>
      <text x={padL + plotW + 2} y={padT + plotH} fontSize={7} fill="var(--text-muted, #94a3b8)" textAnchor="start">
        {Math.round(yMin * 10) / 10}
      </text>
      {/* X-axis date labels (first and last) */}
      <text x={toX(0)} y={svgH - 2} fontSize={7} fill="var(--text-muted, #94a3b8)" textAnchor="start">
        {formatDate(data[0]?.date)}
      </text>
      <text x={toX(data.length - 1)} y={svgH - 2} fontSize={7} fill="var(--text-muted, #94a3b8)" textAnchor="end">
        {formatDate(data[data.length - 1]?.date)}
      </text>
    </svg>
  );
}

function NoteModal({ patient, onClose }) {
  const { addToast } = useToast();
  const { user } = useAuth();
  const [notes, setNotes]   = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm]     = useState({
    date: new Date().toISOString().split("T")[0],
    shift: "Morning", ...VITALS_TEMPLATE,
    medications:"", observations:"", nursing:"", diet:"", moodBehaviour:"",
  });
  const set = (k,v) => setForm(p=>({...p,[k]:v}));

  useEffect(() => {
    if (patient?.id) {
      getHomeCareNotes(patient.id)
        .then(r => setNotes(Array.isArray(r)?r:r.data||[]))
        .catch(() => { setNotes([]); addToast("Failed to load care notes.", "error"); });
    }
  }, [patient?.id]);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await addHomeCareNote({ ...form, patientId: patient.id, patientName: patient.name, recordedBy: user?.name || "" });
      setShowForm(false);
      const r = await getHomeCareNotes(patient.id);
      setNotes(Array.isArray(r)?r:r.data||[]);
    } catch { addToast("Failed to save care note.", "error"); } finally { setSaving(false); }
  };

  const handlePrintNotes = () => {
    printElement("print-daily-report", { pageSize: "A4" });
  };

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:"16px",overflowY:"auto"}}>
      <div style={{background:"var(--surface)",borderRadius:"12px",padding:"24px",maxWidth:"720px",width:"100%",boxShadow:"0 8px 32px rgba(0,0,0,.2)",maxHeight:"90vh",overflowY:"auto",border:"1px solid var(--border)"}}>
        <div className="no-print" style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"16px"}}>
          <div>
            <h3 style={{fontSize:"16px",fontWeight:"700",color:"var(--text)"}}>Daily Care Notes — {patient.name}</h3>
            <p style={{fontSize:"12px",color:"var(--text-muted)"}}>Room {patient.room||"—"} · {patient.condition||"—"}</p>
          </div>
          <div style={{display:"flex",gap:"6px"}}>
            <button className="btn btn-primary btn-sm" onClick={handlePrintNotes}><Printer size={12}/> Print Report</button>
            <button className="btn-icon" onClick={onClose}><X size={15}/></button>
          </div>
        </div>

        {/* Print-only: hidden on screen, visible only when printElement clones it */}
        <div style={{display:"none"}}>
          <DailyCareReport data={{ patient, notes }} />
        </div>

        {/* Screen-only controls */}
        <div className="no-print">
          <button className="btn btn-primary btn-sm" style={{marginBottom:"14px"}} onClick={() => setShowForm(s=>!s)}>
            <Plus size={13}/> Add Today's Note
          </button>
        </div>

        {showForm && (
          <form onSubmit={save} className="form-grid no-print" style={{background:"var(--subtle)",padding:"14px",borderRadius:"8px",marginBottom:"14px"}}>
            <div className="form-row">
              <div className="field"><label>Date</label><input type="date" value={form.date} onChange={e=>set("date",e.target.value)} /></div>
              <div className="field"><label>Shift</label>
                <select value={form.shift} onChange={e=>set("shift",e.target.value)}>
                  <option>Morning</option><option>Afternoon</option><option>Evening</option><option>Night</option>
                </select>
              </div>
            </div>

            <div className="section-title" style={{margin:"4px 0"}}>Vital Signs</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"10px"}}>
              {[["temp","Temperature (°F)"],["bp","Blood Pressure"],["pulse","Pulse (bpm)"],["spo2","SpO₂ (%)"],["glucose","Glucose (mg/dL)"],["weight","Weight (kg)"]].map(([k,l]) => (
                <div key={k} className="field"><label>{l}</label><input value={form[k]} onChange={e=>set(k,e.target.value)} placeholder="—" /></div>
              ))}
            </div>

            <div className="field"><label>Medications Given</label><textarea value={form.medications} onChange={e=>set("medications",e.target.value)} rows={2} /></div>
            <div className="field"><label>Clinical Observations</label><textarea value={form.observations} onChange={e=>set("observations",e.target.value)} rows={2} /></div>
            <div className="form-row">
              <div className="field"><label>Nursing Suggestions</label><textarea value={form.nursing} onChange={e=>set("nursing",e.target.value)} rows={2} /></div>
              <div className="field"><label>Diet / Intake</label><textarea value={form.diet} onChange={e=>set("diet",e.target.value)} rows={2} /></div>
            </div>
            <div className="field"><label>Mood / Behaviour</label><input value={form.moodBehaviour} onChange={e=>set("moodBehaviour",e.target.value)} /></div>
            <div style={{display:"flex",gap:"8px"}}>
              <button className="btn btn-primary" type="submit" disabled={saving}>Save Note</button>
              <button className="btn btn-outline" type="button" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        )}

        {/* Screen-only notes cards */}
        <div className="no-print">
        {notes.length === 0 && !showForm && (
          <div className="empty-state"><BedDouble size={32}/><div>No care notes yet</div></div>
        )}
        {notes.map((n,i) => (
          <div key={i} style={{border:"1px solid var(--border)",borderRadius:"10px",padding:"16px",marginBottom:"12px",background:"var(--card)"}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:"12px",flexWrap:"wrap",gap:"4px",alignItems:"center"}}>
              <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
                <div style={{width:"8px",height:"8px",borderRadius:"50%",background:"var(--primary)"}} />
                <span style={{fontWeight:"700",fontSize:"13px",color:"var(--text)"}}>{n.date}</span>
                <span className="badge badge-blue" style={{fontSize:"10px",padding:"2px 8px"}}>{n.shift}</span>
              </div>
              <span style={{fontSize:"11px",color:"var(--text-muted)"}}>{n.recordedBy||"Nurse"}</span>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"6px",marginBottom:"12px"}}>
              {[["Temp",n.temp||"—","°F"],["BP",n.bp||"—",""],["Pulse",n.pulse||"—","bpm"],["SpO₂",n.spo2||"—","%"],["Glucose",n.glucose||"—","mg/dL"],["Weight",n.weight||"—","kg"]].map(([k,v,unit]) => (
                <div key={k} style={{background:"var(--subtle)",borderRadius:"8px",padding:"8px 10px",border:"1px solid var(--border)"}}>
                  <div style={{fontSize:"9px",color:"var(--text-muted)",fontWeight:"600",textTransform:"uppercase",letterSpacing:".04em"}}>{k}</div>
                  <div style={{fontWeight:"700",fontSize:"15px",color:"var(--text)",marginTop:"2px"}}>{v}<span style={{fontSize:"10px",fontWeight:"400",color:"var(--text-muted)",marginLeft:"2px"}}>{v !== "—" ? unit : ""}</span></div>
                </div>
              ))}
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:"4px",fontSize:"12px",color:"var(--text-secondary)"}}>
              {n.observations && <div><span style={{fontWeight:"600",color:"var(--text)"}}>Observations:</span> {n.observations}</div>}
              {n.medications  && <div><span style={{fontWeight:"600",color:"var(--text)"}}>Medications:</span> {n.medications}</div>}
              {n.nursing      && <div><span style={{fontWeight:"600",color:"var(--text)"}}>Nursing:</span> {n.nursing}</div>}
              {n.diet         && <div><span style={{fontWeight:"600",color:"var(--text)"}}>Diet:</span> {n.diet}</div>}
              {n.moodBehaviour && <div><span style={{fontWeight:"600",color:"var(--text)"}}>Mood:</span> {n.moodBehaviour}</div>}
            </div>
          </div>
        ))}
        </div>

        {/* ───────────────────── Vitals Trends ───────────────────── */}
        {(() => {
          try {
          const vitalsReport = notes.length >= 2 ? generateVitalsReport(notes, patient) : null;
          if (!vitalsReport) return null;

          const statusStyles = {
            stable: { background: "rgba(34,197,94,0.1)", color: "#16a34a", border: "1px solid rgba(34,197,94,0.25)" },
            "needs attention": { background: "rgba(245,158,11,0.1)", color: "#d97706", border: "1px solid rgba(245,158,11,0.25)" },
            critical: { background: "rgba(239,68,68,0.1)", color: "#dc2626", border: "1px solid rgba(239,68,68,0.25)" },
          };
          const sStyle = statusStyles[vitalsReport.overallStatus] || statusStyles.stable;

          const trendBadge = (trend) => {
            const styles = {
              improving: { bg: "rgba(34,197,94,0.12)", color: "#16a34a", label: "Improving" },
              worsening: { bg: "rgba(239,68,68,0.12)", color: "#dc2626", label: "Worsening" },
              stable: { bg: "rgba(100,116,139,0.12)", color: "#64748b", label: "Stable" },
              fluctuating: { bg: "rgba(245,158,11,0.12)", color: "#d97706", label: "Fluctuating" },
            };
            const t = styles[trend] || styles.stable;
            return (
              <span style={{ fontSize: "9px", padding: "1px 6px", borderRadius: "6px", background: t.bg, color: t.color, fontWeight: 600 }}>
                {t.label}
              </span>
            );
          };

          return (
            <div style={{ marginTop: 16 }} className="no-print">
              <div className="section-title" style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <TrendingUp size={13} /> Vitals Trends
              </div>

              {/* Overall status */}
              <div style={{
                ...sStyle,
                borderRadius: "8px", padding: "10px 14px", marginBottom: 10,
                fontSize: "12px", fontWeight: 500, lineHeight: 1.5,
              }}>
                <Activity size={12} style={{ marginRight: 4, verticalAlign: "middle" }} />
                {vitalsReport.summary}
              </div>

              {/* Critical alerts */}
              {vitalsReport.criticalAlerts.length > 0 && (
                <div style={{ marginBottom: 10 }}>
                  {vitalsReport.criticalAlerts.map((alert, ai) => (
                    <div key={ai} style={{
                      background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
                      borderRadius: "6px", padding: "8px 12px", marginBottom: 4,
                      fontSize: "11px", color: "#dc2626", fontWeight: 500,
                    }}>
                      {alert}
                    </div>
                  ))}
                </div>
              )}

              {/* Charts grid - 2 columns */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {Object.entries(vitalsReport.vitals)
                  .filter(([, v]) => v && v.chartData && v.chartData.length >= 2)
                  .map(([key, vital]) => {
                    const config = getChartConfig(key);
                    const trendDir = vital.trend?.trend || "stable";
                    return (
                      <div key={key} style={{
                        background: "var(--subtle)", border: "1px solid var(--border)",
                        borderRadius: "10px", padding: "12px", overflow: "hidden",
                      }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                          <div style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em", color: "var(--text-muted)" }}>
                            {config.label}
                          </div>
                          {trendBadge(trendDir)}
                        </div>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 8 }}>
                          <span style={{ fontSize: "18px", fontWeight: 800, color: "var(--text)" }}>
                            {vital.current}
                          </span>
                          <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>{config.unit}</span>
                          <span style={{ fontSize: "9px", color: "var(--text-muted)", marginLeft: "auto" }}>
                            avg {vital.avg} · range {vital.min}–{vital.max}
                          </span>
                        </div>
                        <MiniLineChart data={vital.chartData} config={config} />
                      </div>
                    );
                  })}
              </div>
            </div>
          );
          } catch { return null; }
        })()}
      </div>
    </div>
  );
}

/* ───────────────────── Main HomeCare Page ───────────────────── */
export default function HomeCare() {
  const { addToast } = useToast();
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);
  const [dietFor, setDietFor] = useState(null);
  const [dischargePatient, setDischargePatient] = useState(null);
  const [showDischarged, setShowDischarged] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [err, setErr]           = useState("");
  const [form, setForm]         = useState({
    name:"", age:"", gender:"Male", phone:"", room:"", guardian:"",
    admitDate: new Date().toISOString().split("T")[0],
    condition:"", notes:"",
  });
  const set = (k,v) => setForm(p=>({...p,[k]:v}));

  const load = () => {
    setLoading(true);
    getHomeCarePatients()
      .then(r => setPatients(Array.isArray(r)?r:r.data||[]))
      .catch(() => { setPatients([]); addToast("Failed to load patients.", "error"); })
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.name) { setErr("Name required."); return; }
    setSaving(true); setErr("");
    try {
      const r = await addHomeCarePatient(form);
      if (r.success !== false) { setShowForm(false); load(); }
      else setErr(r.message||"Failed.");
    } catch { setErr("Error."); addToast("Failed to add patient.", "error"); }
    finally { setSaving(false); }
  };

  const condColor = (c="") => {
    const l = c.toLowerCase();
    if (l.includes("critical")) return "var(--danger)";
    if (l.includes("stable"))   return "var(--success)";
    return "var(--warning)";
  };

  const isDischarged = (p) => {
    return (p.status || "").toLowerCase() === "discharged";
  };

  const filteredPatients = showDischarged
    ? patients
    : patients.filter(p => !isDischarged(p));

  const { paginated, Pager } = usePagination(filteredPatients, 25);

  const activeCount = patients.filter(p => !isDischarged(p)).length;
  const dischargedCount = patients.filter(p => isDischarged(p)).length;

  return (
    <div className="fade-in">
      {selected && <NoteModal patient={selected} onClose={() => setSelected(null)} />}
      {dietFor && (() => {
        const diet = generateDietPlan(dietFor);
        return (
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:"16px",overflowY:"auto"}}>
            <div style={{background:"var(--surface)",borderRadius:"12px",padding:"24px",maxWidth:"600px",width:"100%",boxShadow:"0 8px 32px rgba(0,0,0,.2)",maxHeight:"90vh",overflowY:"auto",border:"1px solid var(--border)"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"16px"}}>
                <div>
                  <h3 style={{fontSize:"16px",fontWeight:"700",color:"var(--text)",display:"flex",alignItems:"center",gap:"6px"}}><Leaf size={16} style={{color:"var(--success)"}}/> Diet Plan — {dietFor.name}</h3>
                  <p style={{fontSize:"12px",color:"var(--text-muted)"}}>{diet.dietType} · {diet.calories} cal/day · {dietFor.condition}</p>
                </div>
                <button className="btn-icon" onClick={() => setDietFor(null)}><X size={15}/></button>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:"8px",marginBottom:"14px"}}>
                {[["Breakfast",diet.meals.breakfast],["Mid-Morning",diet.meals.midMorning],["Lunch",diet.meals.lunch],["Evening",diet.meals.evening],["Dinner",diet.meals.dinner],["Bedtime",diet.meals.bedtime]].map(([slot,meal]) => (
                  <div key={slot} style={{background:"var(--subtle)",borderRadius:"8px",padding:"10px 12px",border:"1px solid var(--border)"}}>
                    <div style={{fontSize:"9px",fontWeight:"700",textTransform:"uppercase",letterSpacing:".06em",color:"var(--success)",marginBottom:"4px"}}>{slot}</div>
                    <div style={{fontSize:"12px",color:"var(--text)",lineHeight:"1.5"}}>{meal}</div>
                  </div>
                ))}
              </div>
              {diet.restrictions?.length > 0 && (
                <div style={{background:"var(--danger-light)",borderRadius:"6px",padding:"10px 12px",marginBottom:"8px",fontSize:"12px",color:"var(--danger)"}}>
                  <strong>Avoid:</strong> {diet.restrictions.join(", ")}
                </div>
              )}
              {diet.tips?.length > 0 && (
                <div style={{fontSize:"12px",color:"var(--text-secondary)",marginBottom:"12px"}}>
                  <strong>Tips:</strong> {diet.tips.join(" · ")}
                </div>
              )}
              <button className="btn btn-outline" style={{width:"100%",justifyContent:"center"}} onClick={() => setDietFor(null)}>Close</button>
            </div>
          </div>
        );
      })()}
      {dischargePatient && (
        <DischargeModal
          patient={dischargePatient}
          onClose={() => setDischargePatient(null)}
          onDischarged={() => { setDischargePatient(null); load(); }}
        />
      )}

      <div className="page-header">
        <div><h2>Home Care</h2><p>Admitted patient daily tracking</p></div>
        <div style={{display:"flex",gap:"8px",alignItems:"center",flexWrap:"wrap"}}>
          <button
            className={`btn btn-sm ${showDischarged ? "btn-outline" : "btn-outline"}`}
            onClick={() => setShowDischarged(s => !s)}
            style={{fontSize:"11px",display:"flex",alignItems:"center",gap:"4px"}}
          >
            <Filter size={12}/>
            {showDischarged ? `Hide Discharged (${dischargedCount})` : `Show Discharged (${dischargedCount})`}
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}><Plus size={13}/> Admit Patient</button>
        </div>
      </div>

      {/* Stats */}
      <div className="stat-grid" style={{marginBottom:"16px"}}>
        <div className="stat-card" style={{"--accent-color":"var(--primary)"}}><div className="val">{activeCount}</div><div className="label">Active Patients</div></div>
        <div className="stat-card" style={{"--accent-color":"var(--danger)"}}><div className="val">{dischargedCount}</div><div className="label">Discharged</div></div>
        <div className="stat-card" style={{"--accent-color":"var(--success)"}}><div className="val">{patients.length}</div><div className="label">Total Admitted</div></div>
      </div>

      {showForm && (
        <div className="card" style={{border:"2px solid var(--primary)",marginBottom:"16px"}}>
          <div className="card-header">
            <h3>Admit New Patient</h3>
            <button className="btn-icon" onClick={() => setShowForm(false)}><X size={15}/></button>
          </div>
          {err && <div className="alert-bar alert-danger" style={{marginBottom:"10px"}}>{err}</div>}
          <form onSubmit={handleAdd} className="form-grid">
            <div className="form-row">
              <div className="field"><label>Full Name <span className="req">*</span></label><input value={form.name} onChange={e=>set("name",e.target.value)} /></div>
              <div className="field"><label>Phone</label><input value={form.phone} onChange={e=>set("phone",e.target.value)} /></div>
            </div>
            <div className="form-row3">
              <div className="field"><label>Age</label><input type="number" value={form.age} onChange={e=>set("age",e.target.value)} /></div>
              <div className="field"><label>Gender</label><select value={form.gender} onChange={e=>set("gender",e.target.value)}><option>Male</option><option>Female</option><option>Other</option></select></div>
              <div className="field"><label>Room / Bed</label><input value={form.room} onChange={e=>set("room",e.target.value)} placeholder="101-A" /></div>
            </div>
            <div className="form-row">
              <div className="field"><label>Admit Date</label><input type="date" value={form.admitDate} onChange={e=>set("admitDate",e.target.value)} /></div>
              <div className="field"><label>Guardian / Contact</label><input value={form.guardian} onChange={e=>set("guardian",e.target.value)} /></div>
            </div>
            <div className="field"><label>Condition / Reason for Admission</label><textarea value={form.condition} onChange={e=>set("condition",e.target.value)} rows={2} /></div>
            <div style={{display:"flex",gap:"8px"}}>
              <button className="btn btn-primary" type="submit" disabled={saving}>Admit Patient</button>
              <button className="btn btn-outline" type="button" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        {loading ? <div className="loading-box"><span className="spinner"/></div> : (
          filteredPatients.length===0 ? (
            <div className="empty-state"><BedDouble size={36}/><div>{showDischarged ? "No patients found" : "No active patients"}</div></div>
          ) : (
            <div className="table-wrap">
              <table className="data-table resp-cards">
                <thead><tr>
                  <th>Patient</th><th>Age/Gender</th><th>Room</th><th>Admit Date</th><th>Condition</th><th>Status</th><th>Guardian</th><th>Actions</th>
                </tr></thead>
                <tbody>
                  {paginated.map((p,i) => {
                    const discharged = isDischarged(p);
                    return (
                      <tr key={i} style={discharged ? {opacity:0.45} : {}}>
                        <td data-label="Patient" className="cell-name">
                          <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
                            <div style={{width:"34px",height:"34px",borderRadius:"50%",background:"var(--primary-light)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"13px",fontWeight:"700",color:"var(--primary)",flexShrink:0}}>
                              {(p.name||"?")[0]}
                            </div>
                            <div>
                              <div>{p.name}</div>
                              <div style={{fontSize:"11px",color:"var(--text-muted)",fontWeight:"400"}}>{p.phone}</div>
                            </div>
                          </div>
                        </td>
                        <td data-label="Age">{p.age||"—"} · {p.gender}</td>
                        <td data-label="Room" style={{fontFamily:"monospace",fontWeight:"600"}}>{p.room||"—"}</td>
                        <td data-label="Admit Date" style={{fontSize:"12px"}}>{p.admitDate}</td>
                        <td data-label="Condition">
                          <span style={{fontSize:"12px",color:condColor(p.condition),fontWeight:"500"}}>
                            {p.condition||"—"}
                          </span>
                        </td>
                        <td data-label="Status">
                          <span className={`badge ${discharged ? "badge-red" : "badge-green"}`}>
                            {discharged ? "Discharged" : "Active"}
                          </span>
                        </td>
                        <td data-label="Guardian" style={{fontSize:"12px",color:"var(--text-secondary)"}}>{p.guardian||"—"}</td>
                        <td data-label="Actions">
                          <div style={{display:"flex",gap:"4px",flexWrap:"wrap"}}>
                            <button className="btn btn-sm btn-outline" onClick={() => setSelected(p)}>
                              Notes
                            </button>
                            {!discharged && (
                              <button className="btn btn-sm btn-outline" onClick={() => setDietFor(p)}
                                style={{borderColor:"var(--success)",color:"var(--success)"}}>
                                <Leaf size={11}/> Diet
                              </button>
                            )}
                            {!discharged ? (
                              <button
                                className="btn btn-sm btn-outline"
                                onClick={() => setDischargePatient(p)}
                                style={{borderColor:"var(--danger)",color:"var(--danger)"}}
                              >
                                <LogOut size={11}/> Discharge
                              </button>
                            ) : (
                              <button
                                className="btn btn-sm btn-outline"
                                onClick={() => setDischargePatient(p)}
                              >
                                <FileText size={11}/> File
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <Pager />
            </div>
          )
        )}
      </div>
    </div>
  );
}
