import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { getPrescriptions, getDoctorPrescriptions } from "../api/sheets";
import { Printer, X } from "lucide-react";
import { printElement, PrescriptionA4 } from "../print";
import DataTable from "../components/DataTable";

function RxPrint({ rx, onClose }) {
  if (!rx) return null;
  let meds = [];
  try { meds = JSON.parse(rx.medications || "[]"); } catch { meds = []; }

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.55)",backdropFilter:"blur(2px)",zIndex:1000,display:"flex",alignItems:"flex-start",justifyContent:"center",padding:"clamp(16px, 4vw, 40px)",paddingTop:"clamp(24px, 5vh, 60px)",overflowY:"auto"}}>
      <div style={{background:"#fff",borderRadius:"14px",padding:"20px",maxWidth:"min(95vw, 680px)",width:"100%",maxHeight:"calc(100vh - 80px)",overflowY:"auto",boxShadow:"0 12px 48px rgba(0,0,0,.2)",animation:"modalIn .2s ease-out"}}>
        <PrescriptionA4 data={{
          receiptNo: rx.receiptNo,
          patient: { patientName: rx.patientName, phone: rx.phone },
          doctorName: rx.doctor || rx.doctorName,
          degree: rx.degree,
          diagnosis: rx.diagnosis,
          meds,
          notes: rx.notes,
        }} />
        <div className="no-print" style={{display:"flex",gap:"8px",marginTop:"14px"}}>
          <button className="btn btn-primary" style={{flex:1,justifyContent:"center"}} onClick={() => printElement("print-prescription", { pageSize: "A4" })}><Printer size={13}/> Print</button>
          <button className="btn btn-outline" onClick={onClose}><X size={13}/> Close</button>
        </div>
      </div>
    </div>
  );
}

export default function Prescriptions() {
  const { user, isDoctor } = useAuth();
  const [rxs, setRxs]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [printRx, setPrintRx] = useState(null);

  useEffect(() => {
    const fn = isDoctor ? () => getDoctorPrescriptions(user?.name) : () => getPrescriptions("all");
    fn()
      .then(r => setRxs(Array.isArray(r) ? r : r.data || []))
      .catch(() => setRxs([]))
      .finally(() => setLoading(false));
  }, [isDoctor, user?.name]);

  const columns = [
    { key: "receiptNo", label: "Receipt", cellStyle: {fontFamily:"monospace",fontSize:"12px"} },
    { key: "date", label: "Date", cellStyle: {fontSize:"12px"} },
    { key: "patientName", label: "Patient", render: (r) => <span className="cell-name">{r.patientName}</span> },
    { key: "doctor", label: "Doctor", render: (r) => r.doctor || r.doctorName },
    { key: "diagnosis", label: "Diagnosis" },
    { key: "medications", label: "Medicines", cellStyle: {fontSize:"12px"}, render: (r) => {
      let meds = [];
      try { meds = JSON.parse(r.medications||"[]"); } catch { meds = []; }
      return meds.length > 0 ? meds.map(m=>m.name).join(", ") : r.medications;
    }},
    { key: "status", label: "Status", render: (r) =>
      r.status === "Dispensed"
        ? <span className="badge badge-green">Dispensed</span>
        : <span className="badge badge-purple">To Dispensary</span>
    },
  ];

  return (
    <div className="fade-in">
      {printRx && <RxPrint rx={printRx} onClose={() => setPrintRx(null)} />}

      <div className="page-header">
        <div><h2>Prescriptions</h2><p>{isDoctor ? "Your prescriptions" : "All prescriptions"}</p></div>
      </div>

      <div className="card">
        <DataTable
          columns={columns}
          data={rxs}
          searchFields={["patientName", "receiptNo", "doctorName", "diagnosis"]}
          searchPlaceholder="Search patient, receipt, doctor, diagnosis…"
          emptyMessage="No prescriptions found"
          loading={loading}
          actions={(r) => (
            <button className="btn btn-sm btn-outline" onClick={() => setPrintRx(r)}>
              <Printer size={12}/>
            </button>
          )}
        />
      </div>
    </div>
  );
}
