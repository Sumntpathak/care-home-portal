import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { savePrescription, getMedicines } from "../api/sheets";
import { Printer, Plus, Trash2, X, ArrowLeft, Package, Leaf, AlertTriangle, Heart, ShieldCheck, Shield } from "lucide-react";
import { checkInteractions } from "../utils/drugInteractions";
import { enhancedInteractionCheck } from "../utils/fdaIntegration";
import { logEngineCall, markFeedback } from "../utils/auditTrail";
import { DISCLAIMER } from "../utils/clinicalDisclaimer";
import { generateDietPlan, generateHealthAdvice, getAvailableConditions } from "../utils/healthAdvisor";
import { printElement, PrescriptionA4 } from "../print";

const DIET_CONDITIONS = getAvailableConditions();

const TIMINGS   = ["Before Meals","After Meals","With Meals","Empty Stomach","At Bedtime","Morning","Evening","Night"];
const FREQ      = ["Once daily","Twice daily","Three times daily","Four times daily","As needed (SOS)","Weekly"];
const DURATIONS = ["3 days","5 days","7 days","10 days","14 days","1 month","2 months","Until further notice"];

function emptyMed() {
  return { name:"", dose:"", timing:TIMINGS[1], frequency:FREQ[1], duration:DURATIONS[2], qty:"", notes:"" };
}

function A4Prescription({ receiptNo, patient, doctorName, degree, diagnosis, meds, genNotes, dietPlan, onClose }) {
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.55)",backdropFilter:"blur(2px)",zIndex:1000,display:"flex",alignItems:"flex-start",justifyContent:"center",padding:"clamp(16px, 4vw, 40px)",paddingTop:"clamp(24px, 5vh, 60px)",overflowY:"auto"}}>
      <div style={{background:"#fff",borderRadius:"14px",padding:"16px",maxWidth:"min(95vw, 680px)",width:"100%",maxHeight:"calc(100vh - 80px)",overflowY:"auto",boxShadow:"0 12px 48px rgba(0,0,0,.2)",animation:"modalIn .2s ease-out"}}>
        <PrescriptionA4 data={{ receiptNo, patient, doctorName, degree, diagnosis, meds, notes: genNotes, dietPlan }} />
        <div className="no-print" style={{display:"flex",gap:"8px",marginTop:"14px"}}>
          <button className="btn btn-primary" style={{flex:1,justifyContent:"center"}} onClick={() => printElement("print-prescription", { pageSize: "A4" })}>
            <Printer size={14}/> Print Prescription (A4)
          </button>
          <button className="btn btn-outline" onClick={onClose}><X size={14}/></button>
        </div>
      </div>
    </div>
  );
}

/* ── Main component ── */
export default function PrescribeForm() {
  const { receiptNo } = useParams();
  const { state }     = useLocation();
  const { user }      = useAuth();
  const navigate      = useNavigate();

  const patient   = state?.patient || {};
  const doctorName = user?.name || "";
  const degree     = user?.position || "";

  const [diagnosis, setDiagnosis] = useState("");
  const [meds, setMeds]           = useState([emptyMed()]);
  const [genNotes, setGenNotes]   = useState("");
  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState(false);
  const [showPrint, setShowPrint] = useState(false);
  const [err, setErr]             = useState("");

  /* ── Diet plan state ── */
  const [dietCategory, setDietCategory] = useState("general"); // key from DIET_CONDITIONS
  const [dietPlan, setDietPlan]         = useState(null);

  /* Auto-generate diet when diagnosis or category changes */
  const currentDiet = useMemo(() => {
    const pat = {
      name: patient?.patientName || patient?.name || "",
      age: patient?.age || 40,
      condition: dietCategory !== "general" ? dietCategory : (diagnosis || "general"),
      diagnosis: diagnosis || "",
    };
    return generateDietPlan(pat);
  }, [dietCategory, diagnosis, patient]);

  /* ── Drug interaction check (real-time — local 5-pass) ── */
  const interactionCheck = useMemo(() => {
    const filledMeds = meds.filter(m => m.name.trim());
    if (filledMeds.length === 0) return null;
    const patientData = {
      age: patient?.age || 70,
      conditions: [diagnosis, patient?.condition].filter(Boolean),
      allergies: patient?.allergies ? patient.allergies.split(",").map(a => a.trim()) : [],
    };
    const result = checkInteractions(filledMeds, patientData);
    // Log to audit trail
    if (result && filledMeds.length >= 2) {
      logEngineCall("drugInteractions",
        { drugs: filledMeds.map(m => m.name), conditions: patientData.conditions },
        { risk: result.overallRisk, interactionCount: result.interactions.length, summary: result.summary },
        user?.name || "Doctor"
      );
    }
    return result;
  }, [meds, diagnosis, patient]);

  /* ── Drug simulation: predict impact of adding each new med ── */
  const [simResult, setSimResult] = useState(null);

  useEffect(() => {
    const lastMed = meds[meds.length - 1];
    if (!lastMed?.name?.trim() || meds.filter(m => m.name.trim()).length < 1) {
      setSimResult(null);
      return;
    }
    // Lazy load simulation
    import("../utils/clinicalPipeline").then(({ simulateAddDrug }) => {
      const patientData = {
        age: patient?.age || 70,
        conditions: [diagnosis, patient?.condition].filter(Boolean),
        medications: meds.slice(0, -1).filter(m => m.name.trim()).map(m => ({ name: m.name })),
      };
      const result = simulateAddDrug(patientData, {}, lastMed.name.trim());
      if (result && !result.error) setSimResult(result);
    }).catch(() => {});
  }, [meds, diagnosis, patient]);

  /* ── FDA/RxNorm enhanced check (async, runs after local) ── */
  const [fdaResult, setFdaResult] = useState(null);
  const [fdaLoading, setFdaLoading] = useState(false);
  useEffect(() => {
    const filledMeds = meds.filter(m => m.name.trim());
    if (filledMeds.length < 2) { setFdaResult(null); return; }
    const patientData = {
      age: patient?.age || 70,
      conditions: [diagnosis, patient?.condition].filter(Boolean),
      allergies: patient?.allergies ? patient.allergies.split(",").map(a => a.trim()) : [],
    };
    setFdaLoading(true);
    const timer = setTimeout(() => {
      enhancedInteractionCheck(filledMeds, patientData)
        .then(r => { setFdaResult(r); setFdaLoading(false); })
        .catch(() => setFdaLoading(false));
    }, 800); // debounce
    return () => clearTimeout(timer);
  }, [meds, diagnosis, patient]);

  /* ── Medicine stock suggestions state ── */
  const [stockMeds, setStockMeds]         = useState([]);
  const [activeSuggest, setActiveSuggest] = useState(-1);
  const suggestRef = useRef(null);

  /* ── Load medicines from inventory on mount ── */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getMedicines();
        if (!cancelled && res?.data) {
          setStockMeds(res.data);
        }
      } catch (e) {
        console.error("Failed to load medicines inventory:", e);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  /* ── Click-outside handler to close suggestion dropdown ── */
  useEffect(() => {
    function handleClickOutside(e) {
      if (suggestRef.current && !suggestRef.current.contains(e.target)) {
        setActiveSuggest(-1);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* ── Filter suggestions based on typed text ── */
  const getFilteredSuggestions = (query) => {
    if (!query || query.trim().length < 1) return [];
    const q = query.toLowerCase();
    return stockMeds.filter(med =>
      med.name && med.name.toLowerCase().includes(q)
    ).slice(0, 15);
  };

  /* ── Handle selecting a suggestion ── */
  const handleSelectSuggestion = (medIndex, suggestion) => {
    updateMed(medIndex, "name", suggestion.name);
    if (suggestion.unit) {
      updateMed(medIndex, "dose", `1 ${suggestion.unit}`);
    }
    setActiveSuggest(-1);
  };

  const updateMed = (i,k,v) => setMeds(ms => ms.map((m,idx) => idx===i ? {...m,[k]:v} : m));
  const addMed    = () => setMeds(ms => [...ms, emptyMed()]);
  const removeMed = (i) => setMeds(ms => ms.filter((_,idx) => idx!==i));

  const handleSave = async (e) => {
    e.preventDefault();
    if (!diagnosis.trim()) { setErr("Diagnosis is required."); return; }
    if (meds.some(m => !m.name.trim())) { setErr("Fill all medicine names."); return; }
    if (meds.some(m => m.dose && parseFloat(m.dose) < 0)) { setErr("Dosage cannot be negative."); return; }
    if (meds.some(m => m.qty && (isNaN(m.qty) || parseFloat(m.qty) < 0))) { setErr("Quantity cannot be negative."); return; }
    setSaving(true); setErr("");

    // Build flat fields the GAS expects + store full JSON in medications
    const firstMed = meds[0] || {};
    const payload = {
      receiptNo,
      patientName:  patient?.patientName || patient?.name || "",
      doctorName,
      diagnosis,
      medications:  JSON.stringify(meds),
      dosage:       meds.map(m => m.dose).join(", "),
      timing:       meds.map(m => m.timing).join(", "),
      amount:       meds.map(m => m.qty || "—").join(", "),
      notes:        genNotes,
      dietPlan:     JSON.stringify(currentDiet),
      consultFee:   patient?.billAmount || patient?.bill || "",
    };
    try {
      const r = await savePrescription(payload);
      if (r.success) {
        setSaved(true);
        setShowPrint(true);
      } else {
        setErr(r.error || r.message || "Failed to save prescription.");
      }
    } catch { setErr("Connection error. Try again."); }
    finally { setSaving(false); }
  };

  return (
    <div className="fade-in">
      {showPrint && (
        <A4Prescription
          receiptNo={receiptNo}
          patient={patient}
          doctorName={doctorName}
          degree={degree}
          diagnosis={diagnosis}
          meds={meds}
          genNotes={genNotes}
          dietPlan={currentDiet}
          onClose={() => setShowPrint(false)}
        />
      )}

      <div className="page-header">
        <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
          <button className="btn-icon" onClick={() => navigate(-1)}><ArrowLeft size={16}/></button>
          <div>
            <h2>Write Prescription</h2>
            <p>Receipt: <strong style={{fontFamily:"monospace"}}>{receiptNo}</strong>
              {patient?.patientName ? ` — ${patient.patientName}` : ""}
            </p>
          </div>
        </div>
        {saved && (
          <button className="btn btn-outline btn-sm" onClick={() => setShowPrint(true)}>
            <Printer size={13}/> Print Prescription
          </button>
        )}
      </div>

      {saved && !showPrint && (
        <div className="alert-bar alert-success" style={{marginBottom:"14px"}}>
          Prescription saved. Dispensary has been notified automatically.
          <button className="btn btn-sm btn-success" style={{marginLeft:"8px"}} onClick={() => setShowPrint(true)}>
            <Printer size={12}/> Print
          </button>
        </div>
      )}

      <form onSubmit={handleSave}>
        {/* Patient Card */}
        {(patient?.patientName || patient?.name) && (
          <div className="card" style={{marginBottom:"14px"}}>
            <div className="section-title">Patient</div>
            <div className="detail-grid">
              <div className="detail-item"><div className="d-label">Name</div><div className="d-value">{patient.patientName||patient.name}</div></div>
              <div className="detail-item"><div className="d-label">Receipt No.</div><div className="d-value" style={{fontFamily:"monospace"}}>{receiptNo}</div></div>
              {patient.type && <div className="detail-item"><div className="d-label">Type</div><div className="d-value">{patient.type}</div></div>}
              {patient.phone && <div className="detail-item"><div className="d-label">Phone</div><div className="d-value">{patient.phone}</div></div>}
            </div>
          </div>
        )}

        {/* Diagnosis */}
        <div className="card" style={{marginBottom:"14px"}}>
          <div className="section-title">Diagnosis</div>
          {err && <div className="alert-bar alert-danger" style={{marginBottom:"10px"}}>{err}</div>}
          <div className="field">
            <label>Diagnosis / Chief Complaint <span className="req">*</span></label>
            <textarea value={diagnosis} onChange={e=>setDiagnosis(e.target.value)} rows={2} placeholder="e.g. Viral fever, Hypertension, Diabetes type-2 follow-up…" disabled={saved}/>
          </div>
        </div>

        {/* Medicines */}
        <div className="card" style={{marginBottom:"14px"}}>
          <div className="card-header">
            <h3>Medicines (&#8478;)</h3>
            {!saved && <button type="button" className="btn btn-outline btn-sm" onClick={addMed}><Plus size={13}/> Add</button>}
          </div>
          {meds.map((m,i) => {
            const suggestions = activeSuggest === i ? getFilteredSuggestions(m.name) : [];
            return (
            <div key={i} style={{border:"1px solid var(--border)",borderRadius:"6px",padding:"14px",marginBottom:"10px",background:"var(--subtle)"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"10px"}}>
                <span style={{fontSize:"12px",fontWeight:"700",color:"var(--text)"}}>Medicine {i+1}</span>
                {meds.length > 1 && !saved && (
                  <button type="button" className="btn-icon" onClick={() => removeMed(i)} style={{background:"var(--danger-light)",color:"var(--danger)"}}>
                    <Trash2 size={13}/>
                  </button>
                )}
              </div>
              <div className="form-row">
                <div className="field" style={{position:"relative"}} ref={activeSuggest === i ? suggestRef : null}>
                  <label>Medicine Name <span className="req">*</span></label>
                  <input
                    value={m.name}
                    onChange={e => {
                      updateMed(i, "name", e.target.value);
                      setActiveSuggest(i);
                    }}
                    onFocus={() => setActiveSuggest(i)}
                    placeholder="e.g. Paracetamol 500mg"
                    disabled={saved}
                    autoComplete="off"
                  />
                  {/* ── Medicine suggestion dropdown ── */}
                  {activeSuggest === i && suggestions.length > 0 && (
                    <div style={{
                      position:"absolute",
                      top:"100%",
                      left:0,
                      right:0,
                      zIndex:10,
                      background:"#fff",
                      border:"1px solid var(--border)",
                      borderRadius:"6px",
                      boxShadow:"0 4px 16px rgba(0,0,0,.12)",
                      maxHeight:"220px",
                      overflowY:"auto",
                      marginTop:"2px"
                    }}>
                      {suggestions.map((med, si) => (
                        <div
                          key={si}
                          onClick={() => handleSelectSuggestion(i, med)}
                          style={{
                            padding:"8px 12px",
                            cursor:"pointer",
                            borderBottom: si < suggestions.length - 1 ? "1px solid #f1f5f9" : "none",
                            display:"flex",
                            alignItems:"center",
                            justifyContent:"space-between",
                            gap:"8px",
                            transition:"background .15s",
                            background: med.isLow ? "#fff5f5" : "transparent"
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = med.isLow ? "#fee2e2" : "#f1f5f9"}
                          onMouseLeave={e => e.currentTarget.style.background = med.isLow ? "#fff5f5" : "transparent"}
                        >
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontSize:"13px",fontWeight:"600",color:"#1e293b",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                              {med.name}
                            </div>
                            <div style={{display:"flex",alignItems:"center",gap:"6px",marginTop:"2px"}}>
                              {med.category && (
                                <span style={{
                                  fontSize:"10px",
                                  fontWeight:"600",
                                  padding:"1px 6px",
                                  borderRadius:"4px",
                                  background:"#e0f2fe",
                                  color:"#0369a1",
                                  textTransform:"uppercase",
                                  letterSpacing:".3px"
                                }}>
                                  {med.category}
                                </span>
                              )}
                              {med.price && (
                                <span style={{fontSize:"11px",color:"#64748b"}}>
                                  Rs.{med.price}
                                </span>
                              )}
                            </div>
                          </div>
                          <div style={{
                            display:"flex",
                            alignItems:"center",
                            gap:"4px",
                            fontSize:"12px",
                            fontWeight:"700",
                            color: med.isLow ? "#dc2626" : "#16a34a",
                            whiteSpace:"nowrap"
                          }}>
                            <Package size={12} />
                            <span>{med.stock ?? "?"}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="field">
                  <label>Dose</label>
                  <input value={m.dose} onChange={e=>updateMed(i,"dose",e.target.value)} placeholder="e.g. 1 tablet, 5ml" disabled={saved}/>
                </div>
              </div>
              <div className="form-row3">
                <div className="field">
                  <label>When to Take</label>
                  <select value={m.timing} onChange={e=>updateMed(i,"timing",e.target.value)} disabled={saved}>
                    {TIMINGS.map(t=><option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>Frequency</label>
                  <select value={m.frequency} onChange={e=>updateMed(i,"frequency",e.target.value)} disabled={saved}>
                    {FREQ.map(f=><option key={f}>{f}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>Duration</label>
                  <select value={m.duration} onChange={e=>updateMed(i,"duration",e.target.value)} disabled={saved}>
                    {DURATIONS.map(d=><option key={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="field">
                  <label>Quantity</label>
                  <input value={m.qty} onChange={e=>updateMed(i,"qty",e.target.value)} placeholder="e.g. 10 tablets" disabled={saved}/>
                </div>
                <div className="field">
                  <label>Special Note</label>
                  <input value={m.notes} onChange={e=>updateMed(i,"notes",e.target.value)} placeholder="e.g. avoid in pregnancy" disabled={saved}/>
                </div>
              </div>
            </div>
            );
          })}
        </div>

        {/* Drug Interaction Check */}
        {interactionCheck && (interactionCheck.interactions.length > 0 || interactionCheck.allergyAlerts.length > 0 || interactionCheck.conditionWarnings.length > 0 || interactionCheck.duplicateTherapy.length > 0) && (
          <div className="card" style={{marginBottom:14, borderLeft: `3px solid ${interactionCheck.overallRisk === "high-risk" ? "var(--danger)" : "var(--warning)"}`}}>
            <div className="card-header">
              <h3 style={{display:"flex",alignItems:"center",gap:6}}>
                <AlertTriangle size={15} style={{color: interactionCheck.overallRisk === "high-risk" ? "var(--danger)" : "var(--warning)"}} />
                Drug Interaction Alert
              </h3>
              <span className={`badge ${interactionCheck.overallRisk === "high-risk" ? "badge-red" : "badge-yellow"}`}>
                {interactionCheck.overallRisk}
              </span>
            </div>

            <p style={{fontSize:12, color:"var(--text-secondary)", marginBottom:10}}>{interactionCheck.summary}</p>

            {/* Drug-Drug Interactions — show combined local + FDA results */}
            {(fdaResult?.interactions || interactionCheck.interactions).map((int, i) => {
              const source = int.source || "local";
              const sourceStyle = {
                local:  { bg: "#dbeafe", color: "#1d4ed8", label: "LOCAL ENGINE" },
                fda:    { bg: "#dcfce7", color: "#15803d", label: "FDA VERIFIED" },
                rxnorm: { bg: "#f3e8ff", color: "#7c3aed", label: "RxNorm API" },
              };
              const ss = sourceStyle[source] || sourceStyle.local;
              return (
              <div key={`int-${i}`} style={{
                borderLeft: `3px solid ${int.severity === "major" ? "var(--danger)" : int.severity === "moderate" ? "#f59e0b" : "#94a3b8"}`,
                background: int.severity === "major" ? "var(--danger-light, #fef2f2)" : int.severity === "moderate" ? "#fffbeb" : "var(--subtle)",
                borderRadius: "6px",
                padding: "10px 12px",
                marginBottom: 8,
                fontSize: 12
              }}>
                <div style={{fontWeight:700, color:"var(--text)", marginBottom:3, display:"flex", alignItems:"center", gap:6, flexWrap:"wrap"}}>
                  {int.drug1} ↔ {int.drug2}
                  <span style={{
                    fontSize:10, fontWeight:600, textTransform:"uppercase",
                    color: int.severity === "major" ? "var(--danger)" : int.severity === "moderate" ? "#d97706" : "#64748b"
                  }}>{int.severity}</span>
                  <span style={{
                    fontSize:8, fontWeight:700, padding:"2px 6px", borderRadius:3,
                    background: ss.bg, color: ss.color, letterSpacing:".5px", marginLeft:"auto"
                  }}>{ss.label}</span>
                </div>
                <div style={{color:"var(--text-secondary)", marginBottom:3}}>{int.description}</div>
                <div style={{color: int.severity === "major" ? "var(--danger)" : "var(--text-secondary)", fontStyle:"italic"}}>
                  Recommendation: {int.recommendation}
                </div>
              </div>
              );
            })}

            {/* Allergy Alerts */}
            {interactionCheck.allergyAlerts.map((alert, i) => (
              <div key={`allergy-${i}`} style={{
                borderLeft: "3px solid var(--danger)",
                background: "var(--danger-light, #fef2f2)",
                borderRadius: "6px",
                padding: "10px 12px",
                marginBottom: 8,
                fontSize: 12
              }}>
                <div style={{fontWeight:700, color:"var(--danger)", marginBottom:3}}>
                  Allergy Alert: {alert.drug}
                </div>
                <div style={{color:"var(--text-secondary)"}}>
                  Patient allergic to <strong>{alert.allergen}</strong>. {alert.note}
                </div>
              </div>
            ))}

            {/* Condition Warnings */}
            {(fdaResult?.conditionWarnings || interactionCheck.conditionWarnings).map((warn, i) => {
              const source = warn.source || "local";
              const ss = source === "fda" ? { bg: "#dcfce7", color: "#15803d", label: "FDA" } : { bg: "#dbeafe", color: "#1d4ed8", label: "LOCAL" };
              return (
              <div key={`cond-${i}`} style={{
                borderLeft: `3px solid ${warn.severity === "major" ? "var(--danger)" : "#f59e0b"}`,
                background: warn.severity === "major" ? "var(--danger-light, #fef2f2)" : "#fffbeb",
                borderRadius: "6px",
                padding: "10px 12px",
                marginBottom: 8,
                fontSize: 12
              }}>
                <div style={{fontWeight:700, color:"var(--text)", marginBottom:3, display:"flex", alignItems:"center", gap:6, flexWrap:"wrap"}}>
                  Condition Warning: {warn.drug} — {warn.condition}
                  <span style={{ fontSize:10, fontWeight:600, textTransform:"uppercase", color: warn.severity === "major" ? "var(--danger)" : "#d97706" }}>{warn.severity}</span>
                  <span style={{ fontSize:8, fontWeight:700, padding:"2px 6px", borderRadius:3, background: ss.bg, color: ss.color, letterSpacing:".5px", marginLeft:"auto" }}>{ss.label}</span>
                </div>
                <div style={{color:"var(--text-secondary)"}}>{warn.note}</div>
              </div>
              );
            })}

            {/* Duplicate Therapy */}
            {interactionCheck.duplicateTherapy.map((dup, i) => (
              <div key={`dup-${i}`} style={{
                borderLeft: "3px solid #f59e0b",
                background: "#fffbeb",
                borderRadius: "6px",
                padding: "10px 12px",
                marginBottom: 8,
                fontSize: 12
              }}>
                <div style={{fontWeight:700, color:"var(--text)", marginBottom:3}}>
                  Duplicate Therapy: {dup.drug1} &amp; {dup.drug2}
                  <span style={{marginLeft:8, fontSize:10, fontWeight:600, textTransform:"uppercase", color:"#d97706"}}>
                    {dup.class}
                  </span>
                </div>
                <div style={{color:"var(--text-secondary)"}}>{dup.note}</div>
              </div>
            ))}
          </div>
        )}

        {/* Drug Simulation Preview */}
        {simResult && !simResult.isSafe && (
          <div style={{ margin: "10px 0", padding: "12px 14px", borderRadius: 10, background: simResult.predictions.some(p => p.severity === "critical") ? "var(--danger-light)" : "var(--warning-light)", border: `1px solid ${simResult.predictions.some(p => p.severity === "critical") ? "rgba(212,104,90,.3)" : "rgba(212,149,106,.3)"}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6, fontWeight: 700, fontSize: 13, color: simResult.predictions.some(p => p.severity === "critical") ? "var(--danger)" : "var(--warning)" }}>
              <AlertTriangle size={14} /> Simulation: Adding {meds[meds.length - 1]?.name}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.7 }}>
              {simResult.overallVerdict}
            </div>
            {simResult.predictions.map((p, i) => (
              <div key={i} style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4, paddingLeft: 8, borderLeft: `2px solid ${p.severity === "critical" ? "var(--danger)" : "var(--warning)"}` }}>
                {p.message}
              </div>
            ))}
          </div>
        )}

        {/* Safe badge if no issues */}
        {interactionCheck && interactionCheck.overallRisk === "safe" && meds.some(m => m.name.trim()) && (
          <div style={{
            display:"flex", alignItems:"center", gap:8, flexWrap:"wrap",
            background:"var(--success-light)", border:"1px solid var(--success-light)", borderRadius:6,
            padding:"8px 14px", marginBottom:14, fontSize:12, color:"var(--success)", fontWeight:600
          }}>
            <ShieldCheck size={14} /> No interactions detected
            <span style={{fontSize:9,fontWeight:700,padding:"2px 6px",borderRadius:3,background:"#dbeafe",color:"#1d4ed8"}}>LOCAL ENGINE</span>
            {fdaResult?.apiStatus === "online" && <span style={{fontSize:9,fontWeight:700,padding:"2px 6px",borderRadius:3,background:"#dcfce7",color:"#15803d"}}>FDA CLEAR</span>}
            <span style={{fontWeight:400,fontSize:11,color:"var(--text-muted)",marginLeft:4}}>5-pass: Rules + CYP450 + Transporters + Opposing Forces + QT</span>
          </div>
        )}

        {/* FDA/RxNorm Verification Status — with source breakdown */}
        {meds.some(m => m.name.trim()) && (
          <div style={{
            display:"flex", alignItems:"center", gap:8, flexWrap:"wrap",
            padding:"8px 12px", borderRadius:6, marginBottom:8,
            background:"var(--subtle)", border:"1px solid var(--border)",
            fontSize:11, color:"var(--text-muted)",
          }}>
            {fdaLoading ? (
              <><span className="spinner" style={{width:12,height:12}} /> Checking OpenFDA + RxNorm APIs...</>
            ) : fdaResult ? (
              <>
                <ShieldCheck size={13} style={{color: fdaResult.apiStatus === "online" ? "var(--success)" : "var(--text-muted)"}} />
                <span style={{flex:1, minWidth:0}}>
                  {fdaResult.apiStatus === "online"
                    ? `${fdaResult.interactions.length} interaction(s) detected`
                    : "Offline — local engine only"
                  }
                </span>
                {/* Source flags */}
                <div style={{display:"flex", gap:4, flexWrap:"wrap"}}>
                  {(() => {
                    const ints = fdaResult.interactions || [];
                    const localCount = ints.filter(i => i.source === "local").length;
                    const fdaCount = ints.filter(i => i.source === "fda").length;
                    const rxCount = ints.filter(i => i.source === "rxnorm").length;
                    return (<>
                      {localCount > 0 && <span style={{fontSize:9,fontWeight:700,padding:"2px 8px",borderRadius:3,background:"#dbeafe",color:"#1d4ed8"}}>LOCAL: {localCount}</span>}
                      {fdaCount > 0 && <span style={{fontSize:9,fontWeight:700,padding:"2px 8px",borderRadius:3,background:"#dcfce7",color:"#15803d"}}>FDA: {fdaCount}</span>}
                      {rxCount > 0 && <span style={{fontSize:9,fontWeight:700,padding:"2px 8px",borderRadius:3,background:"#f3e8ff",color:"#7c3aed"}}>RxNorm: {rxCount}</span>}
                      {fdaResult.fdaVerified && <span style={{fontSize:9,fontWeight:700,padding:"2px 8px",borderRadius:3,background:"#dcfce7",color:"#15803d",border:"1px solid #15803d"}}>FDA CONFIRMED</span>}
                      {fdaResult.apiStatus === "online" && localCount > 0 && fdaCount === 0 && rxCount === 0 && <span style={{fontSize:9,fontWeight:600,padding:"2px 8px",borderRadius:3,background:"var(--card)",border:"1px solid var(--border)",color:"var(--text-muted)"}}>API: No extra findings</span>}
                    </>);
                  })()}
                </div>
              </>
            ) : (
              <>
                <Shield size={12} />
                <span>Local 5-pass engine active</span>
                <span style={{fontSize:9,fontWeight:700,padding:"2px 8px",borderRadius:3,background:"#dbeafe",color:"#1d4ed8"}}>LOCAL ENGINE</span>
              </>
            )}
          </div>
        )}

        {/* Adverse Event Summary (from OpenFDA FAERS) */}
        {fdaResult?.adverseEvents && Object.keys(fdaResult.adverseEvents).length > 0 && (
          <details style={{marginBottom:10}}>
            <summary style={{fontSize:11,color:"var(--text-muted)",cursor:"pointer",fontWeight:600,padding:"4px 0",display:"flex",alignItems:"center",gap:6}}>
              <span style={{fontSize:8,fontWeight:700,padding:"2px 6px",borderRadius:3,background:"#dcfce7",color:"#15803d"}}>FDA API</span>
              Adverse Event Reports (FAERS) — {Object.keys(fdaResult.adverseEvents).length} drug(s) queried
            </summary>
            <div style={{padding:"8px 12px",background:"var(--subtle)",borderRadius:6,marginTop:4,fontSize:11,color:"var(--text-secondary)"}}>
              {Object.entries(fdaResult.adverseEvents).map(([drug, data]) => (
                <div key={drug} style={{marginBottom:8,padding:"6px 0",borderBottom:"1px solid var(--border)"}}>
                  <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
                    <strong>{drug}</strong>
                    <span style={{fontSize:10,color:"var(--text-muted)"}}>{data.totalReports?.toLocaleString() || 0} total reports</span>
                    <span style={{fontSize:8,fontWeight:700,padding:"1px 5px",borderRadius:3,background:"#dcfce7",color:"#15803d",marginLeft:"auto"}}>LIVE FDA DATA</span>
                  </div>
                  <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                    {data.topReactions?.slice(0,5).map((r,i) => (
                      <span key={i} style={{padding:"2px 8px",borderRadius:4,background:"var(--card)",border:"1px solid var(--border)",fontSize:10,fontWeight:500}}>
                        {r.term} <strong style={{color:"var(--danger)"}}>{r.count?.toLocaleString()}</strong>
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </details>
        )}

        {/* Clinical Decision Support Disclaimer */}
        {interactionCheck && meds.some(m => m.name.trim()) && (
          <div style={{
            padding:"10px 14px", borderRadius:8, marginBottom:14,
            background:"var(--subtle)", border:"1px solid var(--border)",
            fontSize:11, color:"var(--text-muted)", lineHeight:1.7,
          }}>
            <div style={{display:"flex", alignItems:"center", gap:6, marginBottom:4}}>
              <Shield size={12} style={{flexShrink:0}} />
              <strong style={{color:"var(--text-secondary)", fontSize:10, textTransform:"uppercase", letterSpacing:".04em"}}>
                {DISCLAIMER.classification.india}
              </strong>
            </div>
            <div>{DISCLAIMER.medium}</div>
            <div style={{marginTop:4, fontStyle:"italic"}}>{DISCLAIMER.engines.drugInteractions}</div>
          </div>
        )}

        {/* Diet Category */}
        <div className="card" style={{marginBottom:"14px",borderLeft:"3px solid var(--success)"}}>
          <div className="card-header">
            <h3 style={{display:"flex",alignItems:"center",gap:"6px"}}><Leaf size={15} style={{color:"var(--success)"}}/> Diet Plan</h3>
            <span className="badge badge-green" style={{fontSize:"10px"}}>{currentDiet.dietType} · {currentDiet.calories}</span>
          </div>
          <div className="field" style={{marginBottom:"10px"}}>
            <label>Diet Category (auto-suggested based on diagnosis, or select manually)</label>
            <select value={dietCategory} onChange={e => setDietCategory(e.target.value)} disabled={saved}>
              {DIET_CONDITIONS.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
            </select>
          </div>
          {/* Compact diet preview */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"6px",fontSize:"11px"}}>
            {[["Breakfast",currentDiet.meals?.breakfast],["Lunch",currentDiet.meals?.lunch],["Dinner",currentDiet.meals?.dinner]].map(([slot,meal]) => (
              <div key={slot} style={{background:"var(--subtle)",borderRadius:"6px",padding:"8px",border:"1px solid var(--border)"}}>
                <div style={{fontSize:"9px",fontWeight:"700",textTransform:"uppercase",color:"var(--success)",marginBottom:"3px"}}>{slot}</div>
                <div style={{color:"var(--text)",lineHeight:"1.4"}}>{meal || "—"}</div>
              </div>
            ))}
          </div>
          {currentDiet.restrictions?.length > 0 && (
            <div style={{fontSize:"11px",color:"var(--danger)",marginTop:"8px"}}><strong>Avoid:</strong> {currentDiet.restrictions.join(", ")}</div>
          )}
        </div>

        {/* Instructions */}
        <div className="card" style={{marginBottom:"14px"}}>
          <div className="field">
            <label>General Instructions / Follow-up</label>
            <textarea value={genNotes} onChange={e=>setGenNotes(e.target.value)} rows={2} placeholder="e.g. Rest, avoid cold water. Follow-up after 5 days." disabled={saved}/>
          </div>
        </div>

        <div style={{display:"flex",gap:"8px",flexWrap:"wrap"}}>
          {!saved ? (
            <button className="btn btn-primary" type="submit" disabled={saving}>
              {saving ? <span className="spinner" style={{width:"14px",height:"14px"}}/> : "Save & Send to Dispensary"}
            </button>
          ) : (
            <button type="button" className="btn btn-success" onClick={() => setShowPrint(true)}>
              <Printer size={13}/> Print Prescription
            </button>
          )}
          <button type="button" className="btn btn-outline" onClick={() => navigate(-1)}>
            <ArrowLeft size={13}/> Back
          </button>
        </div>
      </form>

      {/* ── Health Advisory (shown after save) ── */}
      {saved && diagnosis && (() => {
        const pat = { name: patient?.patientName || patient?.name || "", age: patient?.age || 70, condition: diagnosis, diagnosis };
        const advice = generateHealthAdvice(pat, null, diagnosis);
        return (
          <>

            {/* Health Advisory */}
            <div className="card" style={{borderLeft:"3px solid var(--info)"}}>
              <div className="card-header">
                <h3 style={{display:"flex",alignItems:"center",gap:"6px"}}><Heart size={15} style={{color:"var(--info)"}}/> Health Advisory</h3>
              </div>
              <p style={{fontSize:"12px",color:"var(--text-secondary)",marginBottom:"12px",lineHeight:"1.6"}}>{advice.summary}</p>
              {advice.recommendations?.length > 0 && (
                <div style={{marginBottom:"10px"}}>
                  <div style={{fontSize:"11px",fontWeight:"700",color:"var(--text)",marginBottom:"6px"}}>Recommendations</div>
                  <ul style={{fontSize:"12px",color:"var(--text-secondary)",paddingLeft:"18px",lineHeight:"1.8",margin:0}}>
                    {advice.recommendations.slice(0,6).map((r,i) => <li key={i}>{r}</li>)}
                  </ul>
                </div>
              )}
              {advice.warnings?.length > 0 && (
                <div style={{background:"var(--danger-light)",borderRadius:"6px",padding:"10px 12px",display:"flex",gap:"8px",alignItems:"flex-start"}}>
                  <AlertTriangle size={14} style={{color:"var(--danger)",flexShrink:0,marginTop:"2px"}} />
                  <div style={{fontSize:"11px",color:"var(--danger)"}}>
                    <strong>Warning Signs:</strong> {advice.warnings.join(", ")}
                  </div>
                </div>
              )}
              {advice.followUp && (
                <div style={{fontSize:"12px",color:"var(--text-muted)",marginTop:"8px"}}>
                  <strong>Follow-up:</strong> {advice.followUp}
                </div>
              )}
            </div>
          </>
        );
      })()}
    </div>
  );
}
