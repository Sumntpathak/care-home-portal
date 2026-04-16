import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { LogOut, HeartPulse, Baby, AlertTriangle } from "lucide-react";
import { getPatientMaternityFile } from "../api/sheets";
import { calcWeeks, getTrimester, getProgress, weeksColor, STATUS_STYLE } from "../utils/maternity";


export default function PatientPortal() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const data = user?._data || {};
  const appts = Array.isArray(data.appointments) ? data.appointments : [];
  const rxs   = Array.isArray(data.prescriptions) ? data.prescriptions : [];

  /* Fetch maternity file for this patient */
  const [matFile, setMatFile] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (user?.name) {
      setLoading(true);
      getPatientMaternityFile(user.name)
        .then(r => setMatFile(r?.data || null))
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [user?.name]);

  const handleLogout = () => { logout(); navigate("/login"); };
  const today = new Date().toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"});

  const statusColor = {
    "Scheduled":     { bg:"var(--info-light)",color:"var(--info)" },
    "With Doctor":   { bg:"var(--warning-light)",color:"var(--warning)" },
    "To Dispensary": { bg:"var(--purple-light)",color:"var(--purple)" },
    "Dispensed":     { bg:"var(--success-light)",color:"var(--success)" },
    "Completed":     { bg:"var(--success-light)",color:"var(--success)" },
  };

  if (loading) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: "16px" }}>
      <span className="spinner" style={{ width: 32, height: 32 }} />
      <div style={{ fontSize: 14, color: "var(--text-muted)", fontWeight: 500 }}>Loading your records...</div>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:"var(--subtle)",padding:"0"}}>
      {/* Header */}
      <div style={{background:"#1a3558",padding:"16px 24px",display:"flex",alignItems:"center",justifyContent:"space-between"}} className="no-print">
        <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
          <HeartPulse size={22} color="#fff"/>
          <div>
            <div style={{fontSize:"15px",fontWeight:"700",color:"#fff"}}>Shanti Care Home</div>
            <div style={{fontSize:"11px",color:"rgba(255,255,255,.55)"}}>Patient Portal</div>
          </div>
        </div>
        <div style={{display:"flex",gap:"8px",alignItems:"center"}}>
          <button className="btn btn-sm" style={{background:"rgba(255,255,255,.1)",color:"#fff",border:"1px solid rgba(255,255,255,.15)"}} onClick={handleLogout}>
            <LogOut size={13}/> Logout
          </button>
        </div>
      </div>

      <div style={{maxWidth:"720px",margin:"0 auto",padding:"24px 16px"}}>
        {/* Print header */}
        <div className="print-only" style={{textAlign:"center",borderBottom:"2px solid #1a3558",paddingBottom:"10px",marginBottom:"14px"}}>
          <div style={{fontSize:"18px",fontWeight:"800",color:"#1a3558"}}>Shanti Care Home</div>
          <div style={{fontSize:"11px",color:"var(--text-muted)"}}>123 Serenity Lane · Ph: +91-98765-43210</div>
          <div style={{display:"flex",justifyContent:"space-between",marginTop:"6px",fontSize:"11px",borderTop:"1px solid #e2e8f0",paddingTop:"6px"}}>
            <strong>PATIENT RECORDS</strong><span>Date: {today}</span>
          </div>
        </div>

        {/* Patient card */}
        <div style={{background:"var(--card)",borderRadius:"10px",padding:"20px",boxShadow:"0 1px 4px rgba(0,0,0,.06)",marginBottom:"16px",borderLeft:"4px solid var(--text)"}}>
          <div style={{fontSize:"18px",fontWeight:"800",color:"var(--text)",marginBottom:"4px"}}>{user.name}</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px",marginTop:"10px"}}>
            {[["Receipt No.", user.receiptNo||"—"],["Phone",user.phone||"—"]].map(([k,v])=>(
              <div key={k} style={{background:"var(--subtle)",borderRadius:"6px",padding:"8px 12px"}}>
                <div style={{fontSize:"10px",color:"var(--text-light)",fontWeight:"600",textTransform:"uppercase"}}>{k}</div>
                <div style={{fontWeight:"700",marginTop:"2px",fontFamily:k.includes("Receipt")?"monospace":"inherit"}}>{v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Appointments */}
        <div style={{background:"var(--card)",borderRadius:"10px",padding:"20px",boxShadow:"0 1px 4px rgba(0,0,0,.06)",marginBottom:"16px"}}>
          <h3 style={{fontSize:"15px",fontWeight:"700",color:"var(--text)",marginBottom:"14px",paddingBottom:"8px",borderBottom:"1px solid var(--border)"}}>
            My Appointments
          </h3>
          {appts.length===0 ? (
            <div style={{textAlign:"center",color:"var(--text-light)",padding:"20px",fontSize:"13px"}}>No appointments found</div>
          ) : appts.map((a,i) => {
            const sc = statusColor[a.status] || { bg:"var(--subtle)",color:"var(--text-secondary)" };
            return (
              <div key={i} style={{borderBottom:"1px solid var(--subtle)",padding:"12px 0",display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:"8px"}}>
                <div>
                  <div style={{fontWeight:"600",fontSize:"13px"}}>{a.doctor}</div>
                  <div style={{fontSize:"12px",color:"var(--text-muted)"}}>{a.type} · {a.date}</div>
                  <div style={{fontSize:"11px",fontFamily:"monospace",color:"var(--text-light)",marginTop:"2px"}}>{a.receiptNo}</div>
                </div>
                <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:"4px"}}>
                  <span style={{background:sc.bg,color:sc.color,padding:"2px 8px",borderRadius:"4px",fontSize:"11px",fontWeight:"600"}}>{a.status}</span>
                  <span style={{fontSize:"12px",fontWeight:"700"}}>₹{a.bill}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Prescriptions */}
        <div style={{background:"var(--card)",borderRadius:"10px",padding:"20px",boxShadow:"0 1px 4px rgba(0,0,0,.06)"}}>
          <h3 style={{fontSize:"15px",fontWeight:"700",color:"var(--text)",marginBottom:"14px",paddingBottom:"8px",borderBottom:"1px solid var(--border)"}}>
            My Prescriptions
          </h3>
          {rxs.length===0 ? (
            <div style={{textAlign:"center",color:"var(--text-light)",padding:"20px",fontSize:"13px"}}>No prescriptions found</div>
          ) : rxs.map((r,i) => {
            let meds = [];
            try { meds = JSON.parse(r.medications||"[]"); } catch { meds = []; }
            return (
              <div key={i} style={{border:"1px solid var(--border)",borderRadius:"8px",padding:"14px",marginBottom:"10px",borderLeft:"3px solid var(--info)"}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:"8px",flexWrap:"wrap",gap:"4px"}}>
                  <div style={{fontWeight:"700"}}>{r.doctorName}</div>
                  <div style={{fontSize:"12px",color:"var(--text-muted)"}}>{r.date}</div>
                </div>
                <div style={{fontSize:"13px",color:"var(--text)",marginBottom:"8px"}}>
                  <strong>Diagnosis:</strong> {r.diagnosis}
                </div>
                {meds.length > 0 ? (
                  <div>
                    {meds.map((m,j) => (
                      <div key={j} style={{background:"var(--subtle)",borderRadius:"5px",padding:"7px 10px",marginBottom:"5px",fontSize:"12px"}}>
                        <span style={{fontWeight:"700"}}>{m.name}</span>
                        {m.dose && <span style={{color:"var(--text-muted)"}}> · {m.dose}</span>}
                        <br/>
                        <span style={{color:"var(--text-light)"}}>{m.timing} · {m.frequency} · {m.duration}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{fontSize:"12px",color:"var(--text-muted)"}}>{typeof r.medications === "string" ? r.medications : Array.isArray(r.medications) ? r.medications.map(m => typeof m === "string" ? m : `${m.medication || m.name || ""}${m.dose ? ` (${m.dose})` : ""}`).filter(Boolean).join(", ") : JSON.stringify(r.medications || "")}</div>
                )}
                {r.notes && <div style={{fontSize:"12px",color:"var(--text-muted)",marginTop:"6px",fontStyle:"italic"}}>{r.notes}</div>}
              </div>
            );
          })}
        </div>

        {/* ── Maternity / Pregnancy Section ── */}
        {matFile && (() => {
          const weeks = calcWeeks(matFile.lmpDate);
          const progress = getProgress(matFile.lmpDate);
          const sSt = STATUS_STYLE[matFile.status] || STATUS_STYLE.Open;
          return (
            <div style={{background:"var(--card)",borderRadius:"10px",padding:"20px",boxShadow:"0 1px 4px rgba(0,0,0,.06)",marginTop:"16px",borderLeft:"4px solid var(--purple)"}}>
              <h3 style={{fontSize:"15px",fontWeight:"700",color:"var(--text)",marginBottom:"14px",paddingBottom:"8px",borderBottom:"1px solid var(--border)",display:"flex",alignItems:"center",gap:"8px"}}>
                <Baby size={18} style={{color:"var(--purple)"}}/> My Pregnancy
                <span style={{padding:"2px 8px",borderRadius:4,fontSize:10,fontWeight:600,background:sSt.bg,color:sSt.color,marginLeft:"auto"}}>{sSt.label}</span>
              </h3>

              {/* Progress bar */}
              {weeks != null && (
                <div style={{marginBottom:"14px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:"4px",fontSize:"12px"}}>
                    <span style={{fontWeight:700,color:weeksColor(weeks)}}>{weeks} weeks pregnant</span>
                    <span style={{color:"var(--text-muted)"}}>EDD: <strong>{matFile.eddDate || "—"}</strong></span>
                  </div>
                  <div style={{background:"var(--subtle)",borderRadius:8,height:8,overflow:"hidden"}}>
                    <div style={{width:`${progress}%`,height:"100%",borderRadius:8,background:progress > 90 ? "var(--danger)" : progress > 65 ? "var(--warning)" : "var(--success)",transition:"width .3s"}}/>
                  </div>
                  <div style={{fontSize:"11px",color:"var(--text-muted)",marginTop:"4px"}}>{matFile.trimester}</div>
                </div>
              )}

              {/* Key info */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px",marginBottom:"14px"}}>
                {[["Care Type",matFile.careType],["Obstetrician",matFile.obstetrician||"—"],["Blood Group",matFile.bloodGroup||"—"],["Partner",matFile.partnerName||"—"]].map(([k,v])=>(
                  <div key={k} style={{background:"var(--subtle)",borderRadius:"6px",padding:"8px 12px"}}>
                    <div style={{fontSize:"9px",color:"var(--text-light)",fontWeight:"600",textTransform:"uppercase"}}>{k}</div>
                    <div style={{fontWeight:"600",marginTop:"2px",fontSize:"13px"}}>{v}</div>
                  </div>
                ))}
              </div>

              {/* Risk factors */}
              {matFile.riskFactors?.length > 0 && (
                <div style={{background:"var(--danger-light)",borderRadius:8,padding:"8px 12px",marginBottom:"14px",display:"flex",alignItems:"center",gap:"6px",flexWrap:"wrap"}}>
                  <AlertTriangle size={14} style={{color:"var(--danger)"}}/>
                  <span style={{fontSize:"11px",fontWeight:"700",color:"var(--danger)"}}>Risk Factors:</span>
                  {matFile.riskFactors.map(r => <span key={r} style={{fontSize:"10px",padding:"2px 6px",borderRadius:4,background:"rgba(239,68,68,.1)",color:"var(--danger)"}}>{r}</span>)}
                </div>
              )}

              {/* Delivery info */}
              {matFile.deliveryDate && (
                <div style={{background:"var(--purple-light)",borderRadius:8,padding:"10px 12px",marginBottom:"14px",border:"1px solid var(--purple)"}}>
                  <div style={{fontSize:"12px",fontWeight:700,color:"var(--purple)"}}>Delivery: {matFile.deliveryDate}</div>
                  {matFile.deliveryNotes && <div style={{fontSize:"12px",marginTop:"4px"}}>{matFile.deliveryNotes}</div>}
                </div>
              )}

              {/* Recent visits */}
              {matFile.visits?.length > 0 && (
                <div style={{marginBottom:"14px"}}>
                  <div style={{fontSize:"12px",fontWeight:700,color:"var(--text)",marginBottom:"8px"}}>Recent Visits</div>
                  {matFile.visits.slice(-3).reverse().map((v,i) => (
                    <div key={i} style={{borderBottom:"1px solid var(--subtle)",padding:"8px 0",fontSize:"12px"}}>
                      <div style={{display:"flex",justifyContent:"space-between"}}>
                        <span style={{fontWeight:600}}>{v.type}</span>
                        <span style={{color:"var(--text-muted)"}}>{v.date}</span>
                      </div>
                      <div style={{color:"var(--text-muted)",marginTop:"2px"}}>{v.doctor} · BP: {v.bp||"—"} · Fetal HR: {v.fetalHR||"—"}</div>
                      {v.notes && <div style={{color:"var(--text-secondary)",marginTop:"2px",fontStyle:"italic"}}>{v.notes}</div>}
                    </div>
                  ))}
                </div>
              )}

              {/* Recent care notes */}
              {matFile.careNotes?.length > 0 && (
                <div>
                  <div style={{fontSize:"12px",fontWeight:700,color:"var(--text)",marginBottom:"8px"}}>Daily Care Notes</div>
                  {matFile.careNotes.slice(0, 3).map((n, i) => (
                    <div key={i} style={{background:"var(--subtle)",borderRadius:8,padding:"10px 12px",marginBottom:"6px"}}>
                      <div style={{display:"flex",justifyContent:"space-between",fontSize:"11px",marginBottom:"4px"}}>
                        <span style={{fontWeight:700}}>{n.date} — {n.shift}</span>
                        <span style={{color:"var(--text-muted)"}}>{n.nurse}</span>
                      </div>
                      <div style={{display:"flex",gap:"12px",fontSize:"11px",marginBottom:"4px"}}>
                        <span>BP: <strong>{n.bp||"—"}</strong></span>
                        <span>Wt: <strong>{n.weight||"—"}kg</strong></span>
                        <span>FHR: <strong>{n.fetalHR||"—"}</strong></span>
                      </div>
                      {n.observations && <div style={{fontSize:"11px",color:"var(--text-secondary)"}}>{n.observations}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })()}
      </div>
    </div>
  );
}
