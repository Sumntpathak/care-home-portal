import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getDoctorAppointments } from "../api/sheets";
import { RefreshCw, Stethoscope } from "lucide-react";
import { useToast } from "../components/Toast";

const STATUS_STYLE = {
  "Scheduled":     { bg:"var(--info-light)",color:"var(--info)" },
  "With Doctor":   { bg:"var(--warning-light)",color:"var(--warning)" },
  "To Dispensary": { bg:"var(--purple-light)",color:"var(--purple)" },
  "Dispensed":     { bg:"var(--success-light)",color:"var(--success)" },
  "Completed":     { bg:"var(--success-light)",color:"var(--success)" },
};
function SBadge({s}) {
  const st = STATUS_STYLE[s] || { bg:"var(--subtle)",color:"var(--text-muted)" };
  return <span style={{background:st.bg,color:st.color,padding:"2px 8px",borderRadius:"4px",fontSize:"11px",fontWeight:"600"}}>{s}</span>;
}

export default function DoctorAppts() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [appts, setAppts]     = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    getDoctorAppointments(user.name)
      .then(r => setAppts(Array.isArray(r) ? r : r.data || []))
      .catch(() => { setAppts([]); addToast("Failed to load appointments.", "error"); })
      .finally(() => setLoading(false));
  };
  useEffect(load, [user.name]);

  const waiting = appts.filter(a => a.status === "With Doctor" || a.status === "Scheduled");

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h2>My Patients</h2>
          <p>Today's queue assigned to you</p>
        </div>
        <button className="btn btn-outline btn-sm" onClick={load}><RefreshCw size={13}/> Refresh</button>
      </div>

      {waiting.length > 0 && (
        <div className="alert-bar alert-warn" style={{marginBottom:"14px"}}>
          <Stethoscope size={14}/> {waiting.length} patient{waiting.length>1?"s":""} waiting for consultation
        </div>
      )}

      <div className="card">
        {loading ? <div className="loading-box"><span className="spinner"/></div> : (
          <div className="table-wrap">
            <table className="data-table resp-cards">
              <thead><tr>
                <th>Receipt No.</th><th>Patient</th><th>Phone</th><th>Type</th><th>Status</th><th>Action</th>
              </tr></thead>
              <tbody>
                {appts.length === 0 && (
                  <tr><td colSpan={6} style={{textAlign:"center",color:"var(--text-light)",padding:"28px"}}>No patients assigned today</td></tr>
                )}
                {appts.map((a,i) => (
                  <tr key={i}>
                    <td data-label="Receipt" style={{fontFamily:"monospace",fontSize:"12px"}}>{a.receiptNo}</td>
                    <td data-label="Patient" className="cell-name">{a.patientName}</td>
                    <td data-label="Phone" style={{fontSize:"12px",color:"var(--text-muted)"}}>{a.phone}</td>
                    <td data-label="Type">{a.type}</td>
                    <td data-label="Status"><SBadge s={a.status} /></td>
                    <td data-label="Action">
                      {(a.status === "With Doctor" || a.status === "Scheduled") && (
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => navigate(`/prescribe/${a.receiptNo}`, { state: { patient: a } })}
                        >
                          <Stethoscope size={12}/> Prescribe
                        </button>
                      )}
                      {a.status === "To Dispensary" && (
                        <span style={{fontSize:"12px",color:"var(--purple)",fontWeight:"600"}}>Sent to Dispensary</span>
                      )}
                    </td>
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
