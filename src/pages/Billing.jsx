import { useState, useEffect, useMemo } from "react";
import { getBilling, getHomeCarePatients, getMedicines, getHomeCareNotes, getRooms, getPrescriptions } from "../api/sheets";
import { generateMonthlyInvoice, formatInvoiceForPrint } from "../utils/invoiceGenerator";
import { Printer, IndianRupee, FileText, Download, X } from "lucide-react";
import { printElement } from "../print";
import DataTable from "../components/DataTable";
import { useToast } from "../components/Toast";

function InvoiceModal({ invoice, printData, onClose }) {
  if (!printData) return null;

  const handlePrint = () => {
    printElement("invoice-print-content", { pageSize: "A4" });
  };

  const pd = printData;
  const h = pd.header;
  const pt = pd.patientDetails;
  const ps = pd.paymentSummary;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", zIndex: 1000, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "16px", overflowY: "auto" }}>
      <div style={{ background: "#fff", borderRadius: "10px", padding: "0", maxWidth: "780px", width: "100%", boxShadow: "0 8px 40px rgba(0,0,0,.2)", margin: "20px 0", color: "#1a1a1a" }}>
        <div id="invoice-print-content" style={{ padding: "32px 36px 24px", fontFamily: "Arial, Helvetica, sans-serif", fontSize: "12px", color: "#1a1a1a", background: "#fff" }}>
          {/* Header */}
          <div style={{ textAlign: "center", borderBottom: "3px solid #1a3558", paddingBottom: "14px", marginBottom: "18px" }}>
            <div style={{ fontSize: "22px", fontWeight: "800", color: "#1a3558", letterSpacing: "0.5px" }}>{h.facilityName}</div>
            <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>{h.address}</div>
            <div style={{ fontSize: "12px", color: "#64748b" }}>Phone: {h.phone} | Email: {h.email}</div>
            <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "4px" }}>GSTIN: {h.gstin} | Reg No: {h.regNo}</div>
            <div style={{ marginTop: "10px", background: "#1a3558", color: "#fff", display: "inline-block", padding: "4px 20px", borderRadius: "4px", fontSize: "14px", fontWeight: "700", letterSpacing: "1px" }}>MONTHLY INVOICE</div>
          </div>

          {/* Invoice & Patient Info */}
          <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", marginBottom: "18px", fontSize: "13px" }}>
            <div style={{ flex: 1, minWidth: "220px" }}>
              <div style={{ fontWeight: "700", color: "#1a3558", marginBottom: "6px", fontSize: "14px" }}>Patient Details</div>
              <table style={{ fontSize: "13px" }}><tbody>
                {[["Name", pt.name], ["Patient ID", pt.patientId], ["Room", pt.room], ["Guardian", pt.guardian], ["Admit Date", pt.admitDate], ["Billing Period", pt.billingPeriod], ["Days Stayed", pt.daysStayed]].map(([k, v]) => (
                  <tr key={k}><td style={{ padding: "2px 12px 2px 0", color: "#64748b", fontWeight: "600" }}>{k}:</td><td style={{ padding: "2px 0", fontWeight: "500" }}>{v || "—"}</td></tr>
                ))}
              </tbody></table>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontWeight: "700", color: "#1a3558", marginBottom: "6px", fontSize: "14px" }}>Invoice Info</div>
              <div style={{ fontSize: "13px" }}>
                <div>Invoice No: <strong>{h.invoiceNo}</strong></div>
                <div>Date: <strong>{h.invoiceDate}</strong></div>
                <div>Due Date: <strong>{h.dueDate}</strong></div>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", marginBottom: "16px" }}>
            <thead>
              <tr style={{ background: "#1a3558", color: "#fff" }}>
                <th style={{ padding: "8px 10px", textAlign: "left", fontWeight: "600" }}>S.No</th>
                <th style={{ padding: "8px 10px", textAlign: "left", fontWeight: "600" }}>Description</th>
                <th style={{ padding: "8px 10px", textAlign: "left", fontWeight: "600" }}>Details</th>
                <th style={{ padding: "8px 10px", textAlign: "center", fontWeight: "600" }}>HSN</th>
                <th style={{ padding: "8px 10px", textAlign: "center", fontWeight: "600" }}>GST</th>
                <th style={{ padding: "8px 10px", textAlign: "right", fontWeight: "600" }}>Amount (Rs.)</th>
              </tr>
            </thead>
            <tbody>
              {pd.lineItems.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: "center", padding: "16px", color: "#94a3b8" }}>No charges for this period</td></tr>
              )}
              {pd.lineItems.map((item, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #e2e8f0", background: i % 2 === 0 ? "#f8fafc" : "#fff" }}>
                  <td style={{ padding: "7px 10px" }}>{item.sno}</td>
                  <td style={{ padding: "7px 10px", fontWeight: "600" }}>{item.description}</td>
                  <td style={{ padding: "7px 10px", color: "#64748b", fontSize: "11px" }}>{item.details}</td>
                  <td style={{ padding: "7px 10px", textAlign: "center" }}>{item.hsn}</td>
                  <td style={{ padding: "7px 10px", textAlign: "center" }}>{item.gstRate}</td>
                  <td style={{ padding: "7px 10px", textAlign: "right", fontWeight: "600" }}>{item.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Tax Breakdown */}
          {pd.taxSection.breakdown && pd.taxSection.breakdown.length > 0 && (
            <div style={{ marginBottom: "16px" }}>
              <div style={{ fontWeight: "700", color: "#1a3558", fontSize: "13px", marginBottom: "6px" }}>Tax Breakdown (GST)</div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                <thead>
                  <tr style={{ background: "#f1f5f9" }}>
                    <th style={{ padding: "6px 10px", textAlign: "left" }}>Category</th>
                    <th style={{ padding: "6px 10px", textAlign: "right" }}>Taxable Amt</th>
                    <th style={{ padding: "6px 10px", textAlign: "center" }}>Rate</th>
                    <th style={{ padding: "6px 10px", textAlign: "right" }}>CGST</th>
                    <th style={{ padding: "6px 10px", textAlign: "right" }}>SGST</th>
                    <th style={{ padding: "6px 10px", textAlign: "right" }}>Total Tax</th>
                  </tr>
                </thead>
                <tbody>
                  {pd.taxSection.breakdown.map((b, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #e2e8f0" }}>
                      <td style={{ padding: "6px 10px" }}>{b.category}</td>
                      <td style={{ padding: "6px 10px", textAlign: "right" }}>{b.taxableAmount}</td>
                      <td style={{ padding: "6px 10px", textAlign: "center" }}>{b.rate}</td>
                      <td style={{ padding: "6px 10px", textAlign: "right" }}>{b.cgst}</td>
                      <td style={{ padding: "6px 10px", textAlign: "right" }}>{b.sgst}</td>
                      <td style={{ padding: "6px 10px", textAlign: "right", fontWeight: "600" }}>{b.totalTax}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Payment Summary */}
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px" }}>
            <div style={{ minWidth: "260px" }}>
              {[
                ["Subtotal", ps.subtotal],
                ["GST", ps.gst],
                ...(ps.discount ? [["Discount", `- ${ps.discount}`]] : []),
              ].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: "13px", borderBottom: "1px solid #f1f5f9" }}>
                  <span style={{ color: "#64748b" }}>{k}</span><span style={{ fontWeight: "600" }}>{v}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", fontSize: "16px", fontWeight: "800", color: "#1a3558", borderTop: "2px solid #1a3558", marginTop: "4px" }}>
                <span>TOTAL</span><span>Rs. {ps.total}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", fontSize: "13px" }}>
                <span style={{ color: "#64748b" }}>Paid</span><span style={{ color: "#15803d", fontWeight: "600" }}>Rs. {ps.paid}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", fontSize: "14px", fontWeight: "700" }}>
                <span>Balance Due</span>
                <span style={{ color: ps.status === "PAID" ? "#15803d" : "#dc2626" }}>Rs. {ps.balance}</span>
              </div>
              <div style={{ textAlign: "right", marginTop: "4px" }}>
                <span style={{ padding: "2px 10px", borderRadius: "4px", fontSize: "11px", fontWeight: "700", background: ps.status === "PAID" ? "#dcfce7" : ps.status === "PARTIALLY PAID" ? "#fef3c7" : "#fee2e2", color: ps.status === "PAID" ? "#15803d" : ps.status === "PARTIALLY PAID" ? "#92400e" : "#dc2626" }}>{ps.status}</span>
              </div>
            </div>
          </div>

          {/* Amount in Words */}
          <div style={{ background: "#f8fafc", padding: "8px 12px", borderRadius: "6px", fontSize: "12px", marginBottom: "16px", borderLeft: "3px solid #1a3558" }}>
            <strong>Amount in Words:</strong> {pd.amountInWords}
          </div>

          {/* Payment History */}
          {pd.paymentHistory && pd.paymentHistory.length > 0 && (
            <div style={{ marginBottom: "16px" }}>
              <div style={{ fontWeight: "700", color: "#1a3558", fontSize: "13px", marginBottom: "6px" }}>Payment History</div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                <thead><tr style={{ background: "#f1f5f9" }}>
                  <th style={{ padding: "6px 10px", textAlign: "left" }}>Date</th>
                  <th style={{ padding: "6px 10px", textAlign: "right" }}>Amount</th>
                  <th style={{ padding: "6px 10px", textAlign: "left" }}>Method</th>
                  <th style={{ padding: "6px 10px", textAlign: "left" }}>Receipt</th>
                </tr></thead>
                <tbody>
                  {pd.paymentHistory.map((p, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #e2e8f0" }}>
                      <td style={{ padding: "6px 10px" }}>{p.date}</td>
                      <td style={{ padding: "6px 10px", textAlign: "right", fontWeight: "600" }}>Rs. {p.amount}</td>
                      <td style={{ padding: "6px 10px" }}>{p.method}</td>
                      <td style={{ padding: "6px 10px", fontFamily: "monospace", fontSize: "11px" }}>{p.receiptNo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Bank Details */}
          {pd.bankDetails && (
            <div style={{ background: "#f0f9ff", padding: "12px 16px", borderRadius: "6px", fontSize: "12px", marginBottom: "16px", border: "1px solid #bae6fd" }}>
              <div style={{ fontWeight: "700", color: "#1a3558", marginBottom: "6px" }}>Bank Details for Payment</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 16px" }}>
                {[["Bank", pd.bankDetails.bankName], ["Branch", pd.bankDetails.branch], ["Account Name", pd.bankDetails.accountName], ["Account No", pd.bankDetails.accountNo], ["IFSC", pd.bankDetails.ifsc], ["UPI", pd.bankDetails.upiId]].map(([k, v]) => (
                  <div key={k}><span style={{ color: "#64748b" }}>{k}: </span><strong>{v}</strong></div>
                ))}
              </div>
            </div>
          )}

          {/* Terms */}
          {pd.termsAndConditions && (
            <div style={{ fontSize: "10px", color: "#94a3b8", marginBottom: "16px" }}>
              <div style={{ fontWeight: "600", marginBottom: "4px", color: "#64748b" }}>Terms & Conditions</div>
              <ol style={{ margin: 0, paddingLeft: "16px" }}>
                {pd.termsAndConditions.map((t, i) => <li key={i} style={{ marginBottom: "2px" }}>{t}</li>)}
              </ol>
            </div>
          )}

          {/* Footer note */}
          <div style={{ textAlign: "center", fontSize: "11px", color: "#94a3b8", borderTop: "1px solid #e2e8f0", paddingTop: "10px", marginBottom: "16px" }}>
            This is a computer-generated invoice. Generated on {pd.generatedAt ? new Date(pd.generatedAt).toLocaleString("en-IN") : "—"}
          </div>

          {/* Actions — outside print area */}
        </div>
        <div className="no-print" style={{ display: "flex", gap: "8px", padding: "0 36px 24px", borderTop: "1px solid #e2e8f0", paddingTop: "16px" }}>
          <button className="btn btn-primary" style={{ flex: 1, justifyContent: "center" }} onClick={handlePrint}><Printer size={13} /> Print Invoice</button>
          <button className="btn btn-outline" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

function BillPrint({ bill, onClose }) {
  if (!bill) return null;
  const today = new Date().toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"});
  const total = (parseFloat(bill.bill||bill.amount||0)+parseFloat(bill.medicineAmount||0));
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:"16px"}}>
      <div style={{background:"#fff",borderRadius:"10px",padding:"20px",maxWidth:"440px",width:"100%",boxShadow:"0 4px 24px rgba(0,0,0,.15)"}}>
        {/* Printable content */}
        <div id="bill-print-content" style={{fontFamily:"Arial, Helvetica, sans-serif",fontSize:"12px",color:"#1e293b",background:"#fff"}}>
          {/* Hospital Header */}
          <div style={{textAlign:"center",borderBottom:"3px double #1a3558",paddingBottom:"8px",marginBottom:"10px"}}>
            <div style={{fontSize:"18px",fontWeight:"800",color:"#1a3558",letterSpacing:"1.5px"}}>SHANTI CARE HOME</div>
            <div style={{fontSize:"9px",color:"#64748b",marginTop:"2px"}}>A Unit of Shanti Healthcare Pvt. Ltd.</div>
            <div style={{fontSize:"9px",color:"#64748b"}}>123 Serenity Lane, Near Civil Hospital, City — 400001 | Ph: +91-98765-43210</div>
            <div style={{fontSize:"8px",color:"#94a3b8",marginTop:"1px"}}>GSTIN: 27AABCS1234F1ZP | Reg No: MH/2024/HC-0456</div>
            <div style={{marginTop:"6px",display:"inline-block",background:"#1a3558",color:"#fff",padding:"2px 14px",borderRadius:"2px",fontSize:"10px",fontWeight:"700",letterSpacing:"1px"}}>OPD BILLING RECEIPT</div>
          </div>
          {/* Receipt info */}
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:"10px",fontSize:"11px"}}>
            <span>Bill No: <strong style={{fontFamily:"monospace"}}>{bill.receiptNo}</strong></span>
            <span>Date: <strong>{bill.date||today}</strong></span>
          </div>
          {/* Patient details */}
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:"11px",marginBottom:"10px",border:"1px solid #cbd5e1"}}>
            <tbody>
              {[["Patient", bill.patientName],["Doctor", bill.doctor],["Type", bill.type||"Consultation"]].map(([k,v]) => (
                <tr key={k}><td style={{padding:"4px 10px",fontWeight:"700",background:"#f1f5f9",color:"#334155",width:"30%",border:"1px solid #cbd5e1"}}>{k}</td><td style={{padding:"4px 10px",fontWeight:"600",border:"1px solid #cbd5e1"}}>{v||"—"}</td></tr>
              ))}
            </tbody>
          </table>
          {/* Charges */}
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:"11px",marginBottom:"8px",border:"1px solid #cbd5e1"}}>
            <thead><tr style={{background:"#1a3558",color:"#fff"}}>
              <th style={{padding:"5px 10px",textAlign:"left",fontWeight:"700",fontSize:"9px",letterSpacing:".3px",border:"1px solid #1a3558"}}>DESCRIPTION</th>
              <th style={{padding:"5px 10px",textAlign:"right",fontWeight:"700",fontSize:"9px",letterSpacing:".3px",border:"1px solid #1a3558"}}>AMOUNT</th>
            </tr></thead>
            <tbody>
              <tr><td style={{padding:"5px 10px",border:"1px solid #cbd5e1"}}>Consultation Fee</td><td style={{padding:"5px 10px",textAlign:"right",border:"1px solid #cbd5e1"}}>&#8377;{bill.bill||bill.amount||0}</td></tr>
              {bill.medicineAmount && <tr><td style={{padding:"5px 10px",border:"1px solid #cbd5e1"}}>Medicines</td><td style={{padding:"5px 10px",textAlign:"right",border:"1px solid #cbd5e1"}}>&#8377;{bill.medicineAmount}</td></tr>}
              <tr style={{background:"#f1f5f9"}}>
                <td style={{padding:"6px 10px",fontWeight:"800",color:"#1a3558",border:"1px solid #cbd5e1"}}>TOTAL</td>
                <td style={{padding:"6px 10px",textAlign:"right",fontWeight:"800",fontSize:"14px",color:"#1a3558",fontFamily:"monospace",border:"1px solid #cbd5e1"}}>&#8377;{total.toLocaleString("en-IN")}</td>
              </tr>
            </tbody>
          </table>
          {/* Payment status */}
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:"11px",marginBottom:"8px",border:"1px solid #cbd5e1"}}>
            <tbody><tr style={{background: bill.status==="Paid" ? "#dcfce7" : "#fef3c7"}}>
              <td style={{padding:"6px 10px",fontWeight:"700",border:"1px solid #cbd5e1"}}>Payment Status</td>
              <td style={{padding:"6px 10px",textAlign:"right",fontWeight:"700",color: bill.status==="Paid" ? "#15803d" : "#92400e",border:"1px solid #cbd5e1"}}>{bill.status}</td>
            </tr></tbody>
          </table>
          {/* Signatures */}
          <div style={{display:"flex",justifyContent:"space-between",marginTop:"16px",gap:"12px"}}>
            {["Authorized Signatory","Patient / Guardian"].map(label => (
              <div key={label} style={{flex:1,textAlign:"center"}}><div style={{height:"24px",borderBottom:"1px solid #1e293b",marginBottom:"3px"}}/><div style={{fontSize:"8px",fontWeight:"700"}}>{label}</div></div>
            ))}
          </div>
          {/* Footer */}
          <div style={{textAlign:"center",fontSize:"7px",color:"#94a3b8",marginTop:"8px",borderTop:"1px solid #e2e8f0",paddingTop:"4px"}}>
            Computer-generated receipt. SHANTI CARE HOME — Compassionate Care, Trusted Healing
          </div>
        </div>
        {/* Actions */}
        <div className="no-print" style={{display:"flex",gap:"8px",marginTop:"14px"}}>
          <button className="btn btn-primary" style={{flex:1,justifyContent:"center"}} onClick={() => printElement("bill-print-content", { pageSize: "A5" })}><Printer size={13}/> Print Bill</button>
          <button className="btn btn-outline" onClick={onClose}><X size={13}/></button>
        </div>
      </div>
    </div>
  );
}

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export default function Billing() {
  const { addToast } = useToast();
  const [bills, setBills]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [printBill, setPrintBill] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");

  // Invoice state
  const [showInvoiceDropdown, setShowInvoiceDropdown] = useState(false);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [invoiceData, setInvoiceData] = useState(null); // { invoice, printData }
  const [patients, setPatients] = useState([]);
  const [invoiceMonth, setInvoiceMonth] = useState(MONTHS[new Date().getMonth()]);
  const [invoiceYear, setInvoiceYear] = useState(new Date().getFullYear());

  useEffect(() => {
    getBilling()
      .then(r => setBills(Array.isArray(r) ? r : r.data || []))
      .catch(() => { setBills([]); addToast("Failed to load billing data.", "error"); })
      .finally(() => setLoading(false));
  }, []);

  // Load patients when invoice dropdown opens
  useEffect(() => {
    if (showInvoiceDropdown && patients.length === 0) {
      getHomeCarePatients()
        .then(r => setPatients(Array.isArray(r) ? r : r.data || []))
        .catch(() => { setPatients([]); addToast("Failed to load patients.", "error"); });
    }
  }, [showInvoiceDropdown]);

  const handleGenerateInvoice = async (patient) => {
    if (!patient) { addToast("Select a patient first.", "error"); return; }
    setInvoiceLoading(true);
    setShowInvoiceDropdown(false);
    try {
      const [billingData, medicines, notes, rooms] = await Promise.all([
        getBilling().then(r => Array.isArray(r) ? r : r.data || []),
        getMedicines().then(r => Array.isArray(r) ? r : r.data || []),
        getHomeCareNotes(patient.id).then(r => Array.isArray(r) ? r : r.data || []),
        getRooms().then(r => Array.isArray(r) ? r : r.data || []),
      ]);

      // Filter billing for this patient
      const patientBilling = billingData.filter(b =>
        b.patientName === patient.name || b.patientId === patient.id || String(b.patientId) === String(patient.id)
      );

      const data = {
        billing: patientBilling,
        medicines,
        notes,
        rooms,
        prescriptions: [], // prescriptions fetched via billing entries
      };

      const invoice = generateMonthlyInvoice(patient, invoiceMonth, invoiceYear, data);
      const printData = formatInvoiceForPrint(invoice);
      setInvoiceData({ invoice, printData });
    } catch (err) {
      console.error("Invoice generation failed:", err);
      addToast("Failed to generate invoice.", "error");
    } finally {
      setInvoiceLoading(false);
    }
  };

  // Filter by status tab, DataTable handles search internally
  const statusFiltered = useMemo(() => {
    if (filterStatus === "paid") return bills.filter(b => b.status?.toLowerCase() === "paid");
    if (filterStatus === "pending") return bills.filter(b => b.status?.toLowerCase() !== "paid");
    return bills;
  }, [bills, filterStatus]);

  const totalCollected = bills.filter(b=>b.status?.toLowerCase()==="paid").reduce((s,b)=>s+parseFloat(b.bill||b.amount||0),0);
  const totalPending   = bills.filter(b=>b.status?.toLowerCase()!=="paid").reduce((s,b)=>s+parseFloat(b.bill||b.amount||0),0);

  const columns = [
    { key: "receiptNo", label: "Receipt", cellStyle: {fontFamily:"monospace",fontSize:"12px"} },
    { key: "patientName", label: "Patient", render: (b) => <span className="cell-name">{b.patientName}</span> },
    { key: "date", label: "Date", cellStyle: {fontSize:"12px"} },
    { key: "doctor", label: "Doctor", cellStyle: {fontSize:"12px"} },
    { key: "amount", label: "Amount", render: (b) => <span style={{fontWeight:"700"}}>₹{parseFloat(b.bill||b.amount||0).toLocaleString("en-IN")}</span> },
    { key: "status", label: "Status", render: (b) =>
      b.status?.toLowerCase() === "paid"
        ? <span className="badge badge-green">Paid</span>
        : <span className="badge badge-yellow">Pending</span>
    },
  ];

  return (
    <div className="fade-in">
      {printBill && <BillPrint bill={printBill} onClose={() => setPrintBill(null)} />}
      {invoiceData && <InvoiceModal invoice={invoiceData.invoice} printData={invoiceData.printData} onClose={() => setInvoiceData(null)} />}

      <div className="page-header">
        <div><h2>Billing</h2><p>Manage receipts and payments</p></div>
        <div style={{ position: "relative" }}>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setShowInvoiceDropdown(!showInvoiceDropdown)}
            disabled={invoiceLoading}
          >
            {invoiceLoading ? <><span className="spinner" style={{ width: 13, height: 13 }} /> Generating...</> : <><FileText size={13} /> Monthly Invoice</>}
          </button>

          {showInvoiceDropdown && (
            <div style={{
              position: "absolute", right: 0, top: "calc(100% + 6px)", background: "var(--card-bg, #fff)",
              border: "1px solid var(--border, #e2e8f0)", borderRadius: "8px", boxShadow: "0 8px 30px rgba(0,0,0,.15)",
              width: "320px", zIndex: 100, padding: "12px", maxHeight: "420px", overflowY: "auto"
            }}>
              <div style={{ fontSize: "13px", fontWeight: "700", color: "var(--text)", marginBottom: "10px" }}>Generate Monthly Invoice</div>

              {/* Month / Year selector */}
              <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
                <select
                  value={invoiceMonth}
                  onChange={e => setInvoiceMonth(e.target.value)}
                  style={{ flex: 1, padding: "6px 8px", border: "1.5px solid var(--border, #e2e8f0)", borderRadius: "5px", fontSize: "12px", background: "var(--card-bg, #fff)", color: "var(--text)" }}
                >
                  {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <input
                  type="number"
                  value={invoiceYear}
                  onChange={e => setInvoiceYear(parseInt(e.target.value) || new Date().getFullYear())}
                  style={{ width: "75px", padding: "6px 8px", border: "1.5px solid var(--border, #e2e8f0)", borderRadius: "5px", fontSize: "12px", background: "var(--card-bg, #fff)", color: "var(--text)" }}
                  min={2020} max={2030}
                />
              </div>

              <div style={{ fontSize: "11px", fontWeight: "600", color: "var(--text-muted, #94a3b8)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Select Patient</div>

              {patients.length === 0 ? (
                <div style={{ textAlign: "center", padding: "16px", color: "var(--text-muted, #94a3b8)", fontSize: "12px" }}>Loading patients...</div>
              ) : (
                patients.map(p => (
                  <button
                    key={p.id}
                    onClick={() => handleGenerateInvoice(p)}
                    style={{
                      display: "flex", alignItems: "center", gap: "10px", width: "100%", padding: "8px 10px",
                      border: "1px solid var(--border, #e2e8f0)", borderRadius: "6px", marginBottom: "6px",
                      background: "var(--card-bg, #fff)", cursor: "pointer", textAlign: "left", color: "var(--text)",
                      transition: "background 0.15s"
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "var(--hover-bg, #f8fafc)"}
                    onMouseLeave={e => e.currentTarget.style.background = "var(--card-bg, #fff)"}
                  >
                    <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#1a3558", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: "700", flexShrink: 0 }}>
                      {(p.name || "?")[0]}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "13px", fontWeight: "600", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                      <div style={{ fontSize: "11px", color: "var(--text-muted, #94a3b8)" }}>Room {p.room || "—"} · {p.condition || p.diagnosis || "—"}</div>
                    </div>
                    <FileText size={14} style={{ color: "var(--text-muted, #94a3b8)", flexShrink: 0 }} />
                  </button>
                ))
              )}

              <button
                className="btn btn-outline btn-sm"
                onClick={() => setShowInvoiceDropdown(false)}
                style={{ width: "100%", marginTop: "4px", justifyContent: "center" }}
              >Cancel</button>
            </div>
          )}
        </div>
      </div>

      <div className="stat-grid" style={{marginBottom:"16px"}}>
        <div className="stat-card" style={{"--accent-color":"var(--success)"}}>
          <div className="val">₹{totalCollected.toLocaleString("en-IN")}</div>
          <div className="label">Total Collected</div>
          <div className="sub" style={{color:"var(--success)"}}>Paid bills</div>
        </div>
        <div className="stat-card" style={{"--accent-color":"var(--warning)"}}>
          <div className="val">₹{totalPending.toLocaleString("en-IN")}</div>
          <div className="label">Pending Amount</div>
        </div>
        <div className="stat-card" style={{"--accent-color":"var(--text)"}}>
          <div className="val">{bills.length}</div>
          <div className="label">Total Bills</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="tab-bar" style={{marginBottom:0,borderBottom:"none"}}>
            {[["all","All"],["paid","Paid"],["pending","Pending"]].map(([k,l]) => (
              <button key={k} className={`tab-btn ${filterStatus===k?"active":""}`} onClick={() => setFilterStatus(k)}>{l}</button>
            ))}
          </div>
        </div>
        <DataTable
          columns={columns}
          data={statusFiltered}
          searchFields={["patientName", "receiptNo"]}
          searchPlaceholder="Search patient or receipt…"
          emptyMessage="No bills found"
          loading={loading}
          actions={(b) => (
            <button className="btn btn-sm btn-outline" onClick={() => setPrintBill(b)}>
              <Printer size={12}/> Print
            </button>
          )}
        />
      </div>
    </div>
  );
}
