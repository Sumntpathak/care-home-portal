import { X, Printer } from "lucide-react";
import { printElement, VisitReceipt } from "../print";

export default function UnifiedReceipt({ appointment = {}, prescription, dispensary, tests, dietPlan, healthAdvice, onClose }) {
  const handlePrint = () => printElement("print-visit-receipt", { pageSize: "A4" });

  return (
    <div style={{ position:"fixed", inset:0, zIndex:10000, display:"flex", alignItems:"flex-start", justifyContent:"center", background:"rgba(0,0,0,0.55)", backdropFilter:"blur(2px)", padding:"clamp(16px, 4vw, 40px)", paddingTop:"clamp(24px, 5vh, 60px)", overflowY:"auto" }} onClick={e => e.target === e.currentTarget && onClose?.()}>
      <div style={{ width:"100%", maxWidth:"min(95vw, 780px)", maxHeight:"calc(100vh - 80px)", overflowY:"auto", background:"#fff", borderRadius:12, boxShadow:"0 24px 64px rgba(0,0,0,0.3)", display:"flex", flexDirection:"column", animation:"modalIn .2s ease-out" }}>
        <div style={{ padding: "20px 28px", background: "#fff" }}>
          <VisitReceipt data={{ appointment, prescription, dispensary, tests, dietPlan, healthAdvice }} />
        </div>
        <div className="no-print" style={{ display:"flex", justifyContent:"center", gap:12, padding:"12px 28px 16px", borderTop:"1px solid #e2e8f0", background:"#fff", borderRadius:"0 0 12px 12px", position:"sticky", bottom:0 }}>
          <button onClick={handlePrint} style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"10px 28px", background:"#2563eb", color:"#fff", border:"none", borderRadius:8, fontSize:14, fontWeight:600, cursor:"pointer" }}>
            <Printer size={18}/> Print Receipt
          </button>
          <button onClick={onClose} style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"10px 28px", background:"transparent", color:"#1e293b", border:"1.5px solid #cbd5e1", borderRadius:8, fontSize:14, fontWeight:600, cursor:"pointer" }}>
            <X size={18}/> Close
          </button>
        </div>
      </div>
    </div>
  );
}
