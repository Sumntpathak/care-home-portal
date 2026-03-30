import { useState, useEffect } from "react";
import { getDispensaryQueue, getDispensedRecords, markDispensed } from "../api/sheets";
import { RefreshCw, Printer, CheckCircle, X } from "lucide-react";
import { printElement, DispenseSlip } from "../print";
import FreshnessIndicator from "../components/FreshnessIndicator";
import DataTable from "../components/DataTable";
import { useToast } from "../components/Toast";

/* GAS returns: receiptNo, doctor, patientName, diagnosis, medications, dosage, timing, amount, notes, status, date */
function parseMeds(str) {
  try { const p = JSON.parse(str); if (Array.isArray(p)) return p; } catch {}
  return [];
}

function DispenseModal({ item, onClose, onConfirm, saving }) {
  if (!item) return null;
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.55)",backdropFilter:"blur(2px)",zIndex:1000,display:"flex",alignItems:"flex-start",justifyContent:"center",padding:"clamp(16px, 4vw, 40px)",paddingTop:"clamp(24px, 5vh, 60px)"}}>
      <div style={{background:"#fff",borderRadius:"14px",padding:"20px",maxWidth:"min(90vw, 520px)",width:"100%",maxHeight:"calc(100vh - 80px)",overflowY:"auto",boxShadow:"0 12px 48px rgba(0,0,0,.2)",animation:"modalIn .2s ease-out"}}>
        <DispenseSlip data={item} />
        <div className="no-print" style={{display:"flex",gap:"8px",marginTop:"14px"}}>
          <button className="btn btn-success" style={{flex:1,justifyContent:"center"}} disabled={saving}
            onClick={() => onConfirm(item.receiptNo)}>
            {saving ? <span className="spinner" style={{width:"14px",height:"14px"}}/> : <><CheckCircle size={13}/> Mark Dispensed</>}
          </button>
          <button className="btn btn-outline" onClick={() => printElement("print-dispense-slip", { pageSize: "A5" })}><Printer size={13}/></button>
          <button className="btn btn-outline" onClick={onClose}><X size={13}/></button>
        </div>
      </div>
    </div>
  );
}

export default function Dispensary() {
  const { addToast } = useToast();
  const [queue, setQueue]       = useState([]);
  const [dispensed, setDispensed] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [tab, setTab]           = useState("queue");
  const [modal, setModal]       = useState(null);
  const [saving, setSaving]     = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([getDispensaryQueue(), getDispensedRecords()])
      .then(([q, d]) => {
        setQueue(q?.data    || (Array.isArray(q) ? q : []));
        setDispensed(d?.data || (Array.isArray(d) ? d : []));
      })
      .catch(() => addToast("Failed to load dispensary data.", "error"))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const handleDispense = async (receiptNo) => {
    setSaving(true);
    try {
      const r = await markDispensed(receiptNo);
      if (r.success === true) { setModal(null); load(); }
      else addToast(r.error || "Failed to mark dispensed.", "error");
    } catch { addToast("Connection error.", "error"); }
    finally { setSaving(false); }
  };

  const queueColumns = [
    { key: "receiptNo", label: "Receipt No.", cellStyle: {fontFamily:"monospace",fontSize:"12px",fontWeight:"600"} },
    { key: "patientName", label: "Patient", render: (q) => <span className="cell-name">{q.patientName}</span> },
    { key: "doctor", label: "Doctor", cellStyle: {fontSize:"12px"} },
    { key: "diagnosis", label: "Diagnosis", cellStyle: {fontSize:"12px"} },
    { key: "medications", label: "Medicines", cellStyle: {fontSize:"12px"}, render: (q) => {
      const meds = parseMeds(q.medications);
      return meds.length > 0
        ? meds.map((m,j) => <div key={j}><strong>{m.name}</strong> — {m.timing}</div>)
        : q.medications;
    }},
  ];

  const doneColumns = [
    { key: "receiptNo", label: "Receipt No.", cellStyle: {fontFamily:"monospace",fontSize:"12px"} },
    { key: "patientName", label: "Patient", render: (d) => <span className="cell-name">{d.patientName}</span> },
    { key: "doctor", label: "Doctor", cellStyle: {fontSize:"12px"} },
    { key: "diagnosis", label: "Diagnosis", cellStyle: {fontSize:"12px"} },
    { key: "date", label: "Date", cellStyle: {fontSize:"12px"} },
    { key: "status", label: "Status", render: () => <span className="badge badge-green">Dispensed</span> },
  ];

  return (
    <div className="fade-in">
      {modal && <DispenseModal item={modal} onClose={() => setModal(null)} onConfirm={handleDispense} saving={saving} />}

      <div className="page-header">
        <div>
          <h2>Dispensary</h2>
          <p>Prescription queue &amp; dispensed records</p>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <FreshnessIndicator storeName="dispensary" onRefresh={load} label="Data" />
          <button className="btn btn-outline btn-sm" onClick={load}><RefreshCw size={13}/> Refresh</button>
        </div>
      </div>

      {queue.length > 0 && (
        <div className="alert-bar alert-info" style={{marginBottom:"14px"}}>
          <CheckCircle size={14}/> {queue.length} prescription{queue.length>1?"s":""} pending — awaiting dispensing
        </div>
      )}

      <div className="tab-bar">
        <button className={`tab-btn ${tab==="queue"?"active":""}`} onClick={() => setTab("queue")}>
          Pending Queue
          {queue.length > 0 && <span className="badge badge-purple" style={{marginLeft:"6px"}}>{queue.length}</span>}
        </button>
        <button className={`tab-btn ${tab==="done"?"active":""}`} onClick={() => setTab("done")}>
          Dispensed Records
        </button>
      </div>

      {loading ? <div className="loading-box"><span className="spinner"/></div> : (
        <div className="card">
          {tab === "queue" && (
            <DataTable
              columns={queueColumns}
              data={queue}
              loading={loading}
              searchFields={["receiptNo", "patientName", "doctor", "diagnosis"]}
              searchPlaceholder="Search queue…"
              emptyMessage="Queue is clear"
              actions={(q) => (
                <button className="btn btn-sm btn-primary" onClick={() => setModal(q)}>
                  <CheckCircle size={12}/> Dispense
                </button>
              )}
            />
          )}

          {tab === "done" && (
            <DataTable
              columns={doneColumns}
              data={dispensed}
              loading={loading}
              searchFields={["receiptNo", "patientName", "doctor", "diagnosis"]}
              searchPlaceholder="Search dispensed records…"
              emptyMessage="No records yet"
              actions={(d) => (
                <button className="btn btn-sm btn-outline" onClick={() => setModal(d)} title="View & Print">
                  <Printer size={12}/> Print
                </button>
              )}
            />
          )}
        </div>
      )}
    </div>
  );
}
