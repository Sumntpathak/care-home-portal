import { useState, useEffect, useMemo } from "react";
import { getDispensaryQueue, getDispensedRecords, markDispensed, updateBilling, getMedicines } from "../api/sheets";
import { invalidate } from "../lib/dataLayer";
import {
  RefreshCw, Printer, CheckCircle, X, MessageCircle, Clock, User, Pill,
  Stethoscope, Receipt, Activity, ChevronRight, Search, Inbox,
} from "lucide-react";
import { printElement, DispenseSlip } from "../print";
import FreshnessIndicator from "../components/FreshnessIndicator";
import DataTable from "../components/DataTable";
import { useToast } from "../components/Toast";
import { PageHeader, Modal, FormField, Input, Select } from "../components/ui";

/* ──────────────────────────────────────────────────────────────────
   Utilities
────────────────────────────────────────────────────────────────── */
function parseMeds(src) {
  if (!src) return [];
  if (Array.isArray(src)) return src;
  try {
    const p = typeof src === "string" ? JSON.parse(src) : src;
    return Array.isArray(p) ? p : [];
  } catch {
    return [];
  }
}

function waitedFor(dateStr) {
  if (!dateStr) return "";
  const t = new Date(dateStr).getTime();
  if (!t || Number.isNaN(t)) return "";
  const diffMin = Math.max(0, Math.round((Date.now() - t) / 60000));
  if (diffMin < 60) return `${diffMin} min`;
  const h = Math.floor(diffMin / 60);
  if (h < 24) return `${h}h ${diffMin % 60}m`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}

/* ──────────────────────────────────────────────────────────────────
   Dispense Modal — uses new unified Modal + FormField
────────────────────────────────────────────────────────────────── */
function DispenseModal({ item, onClose, onConfirm, saving, stockMeds = [] }) {
  const [medAmount, setMedAmount] = useState("");
  const [payMethod, setPayMethod] = useState("Cash");
  const [payMed, setPayMed] = useState(false);
  const [priceBreakdown, setPriceBreakdown] = useState([]);

  useEffect(() => {
    if (!item || !stockMeds.length) return;
    const meds = parseMeds(item.medicationsJson || item.medications);
    if (meds.length === 0) return;

    let total = 0;
    const breakdown = [];
    for (const med of meds) {
      const name = (med.name || "").toLowerCase().trim();
      const qty = parseFloat(med.qty) || 1;
      const stockMatch = stockMeds.find(s => {
        const sName = (s.name || "").toLowerCase().trim();
        return sName === name || sName.includes(name) || name.includes(sName);
      });
      if (stockMatch && stockMatch.price) {
        const price = parseFloat(stockMatch.price) || 0;
        const lineTotal = price * qty;
        total += lineTotal;
        breakdown.push({ name: med.name, qty, price, lineTotal });
      }
    }
    if (total > 0) {
      setMedAmount(String(Math.round(total)));
      setPriceBreakdown(breakdown);
    }
  }, [item, stockMeds]);

  const handlePrint = () => printElement("print-dispense-slip", { pageSize: "A5" });
  const handleWhatsApp = () => {
    const msg = `नमस्ते ${item.patientName} जी,\nआपकी दवाइयाँ तैयार हैं।\nReceipt No: ${item.receiptNo}\nPlease collect from dispensary. - Shanti Care`;
    window.open(`https://wa.me/91${item.phone?.replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  return (
    <Modal
      open={!!item}
      onClose={onClose}
      title="Dispense Prescription"
      subtitle={item ? `Receipt ${item.receiptNo} • ${item.patientName}` : ""}
      size="md"
      variant="print"
      headerActions={
        <button className="btn btn-outline btn-sm" onClick={handlePrint} aria-label="Print slip">
          <Printer size={13} />
          <span style={{ marginLeft: 6 }}>Print</span>
        </button>
      }
      footer={
        <>
          {item?.phone && (
            <button className="btn btn-outline btn-sm" onClick={handleWhatsApp} title="WhatsApp patient">
              <MessageCircle size={13} />
              <span style={{ marginLeft: 6 }}>WhatsApp</span>
            </button>
          )}
          <div style={{ flex: 1 }} />
          <button className="btn btn-outline" onClick={onClose} disabled={saving}>Cancel</button>
          <button
            className="btn btn-success"
            disabled={saving}
            onClick={() => onConfirm(item.receiptNo, payMed ? { medAmount, payMethod } : null)}
          >
            {saving ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <CheckCircle size={14} />}
            <span style={{ marginLeft: 6 }}>{saving ? "Saving…" : "Mark Dispensed"}</span>
          </button>
        </>
      }
    >
      <DispenseSlip data={item} />

      <div className="sc-dispense-pay no-print">
        <div className="sc-dispense-pay__head">
          <Receipt size={14} />
          <span>Medicine Payment</span>
          <span className="sc-dispense-pay__hint">mark after confirming amount with patient</span>
        </div>

        {priceBreakdown.length > 0 && (
          <div className="sc-dispense-pay__breakdown">
            <div className="sc-dispense-pay__breakdown-title">Auto-calculated from inventory</div>
            {priceBreakdown.map((b, i) => (
              <div className="sc-dispense-pay__row" key={i}>
                <span>{b.name} × {b.qty}</span>
                <span>Rs. {b.lineTotal.toFixed(2)}</span>
              </div>
            ))}
            <div className="sc-dispense-pay__total">
              <span>Total</span>
              <span>Rs. {priceBreakdown.reduce((s, b) => s + b.lineTotal, 0).toFixed(2)}</span>
            </div>
            <div className="sc-dispense-pay__note">Edit amount below to override.</div>
          </div>
        )}

        <div className="sc-dispense-pay__grid">
          <FormField label="Amount (Rs.)">
            <Input
              type="number"
              inputMode="decimal"
              placeholder="0"
              value={medAmount}
              onChange={e => setMedAmount(e.target.value)}
            />
          </FormField>
          <FormField label="Payment method">
            <Select value={payMethod} onChange={e => setPayMethod(e.target.value)}>
              <option>Cash</option>
              <option>UPI</option>
              <option>Card</option>
              <option>Insurance</option>
              <option>Waived</option>
            </Select>
          </FormField>
          <label className="sc-dispense-pay__check">
            <input type="checkbox" checked={payMed} onChange={e => setPayMed(e.target.checked)} />
            <span>Mark as paid now</span>
          </label>
        </div>
      </div>
    </Modal>
  );
}

/* ──────────────────────────────────────────────────────────────────
   Task Card — one prescription in the action queue
────────────────────────────────────────────────────────────────── */
function TaskCard({ item, onDispense, onPrint, onWhatsApp }) {
  const meds = parseMeds(item.medicationsJson || item.medications);
  const waited = waitedFor(item.date);
  const urgent = meds.some(m => /stat|urgent|emergency/i.test(m.timing || ""));

  return (
    <article className={`sc-task ${urgent ? "sc-task--urgent" : ""}`}>
      <div className="sc-task__rail" aria-hidden="true" />
      <div className="sc-task__body">
        <header className="sc-task__head">
          <div className="sc-task__id">
            <Receipt size={12} />
            <span>{item.receiptNo}</span>
            {waited && <><span className="sc-task__dot" aria-hidden="true" /><Clock size={12} /><span>{waited} ago</span></>}
            {urgent && <span className="sc-chip sc-chip--danger">Urgent</span>}
          </div>
          <h3 className="sc-task__name">{item.patientName || "—"}</h3>
          <div className="sc-task__meta">
            <span className="sc-task__meta-item"><Stethoscope size={12} />{item.doctor || "—"}</span>
            {item.diagnosis && (
              <span className="sc-task__meta-item sc-task__meta-item--muted">
                <Activity size={12} />{item.diagnosis}
              </span>
            )}
          </div>
        </header>

        {meds.length > 0 ? (
          <ul className="sc-task__meds">
            {meds.map((m, i) => (
              <li key={i} className="sc-task__med">
                <Pill size={11} />
                <strong>{m.name}</strong>
                {m.qty && <span className="sc-task__med-qty">× {m.qty}</span>}
                {m.timing && <span className="sc-task__med-timing">{m.timing}</span>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="sc-task__empty-meds">No parsed medications — see slip</p>
        )}
      </div>

      <div className="sc-task__actions">
        <button className="btn btn-primary" onClick={() => onDispense(item)}>
          <CheckCircle size={14} />
          <span style={{ marginLeft: 6 }}>Dispense</span>
          <ChevronRight size={14} style={{ marginLeft: 4, opacity: .8 }} />
        </button>
        <button className="btn btn-outline btn-sm" onClick={() => onPrint(item)} title="Print slip">
          <Printer size={13} />
        </button>
        {item.phone && (
          <button className="btn btn-outline btn-sm" onClick={() => onWhatsApp(item)} title="WhatsApp patient">
            <MessageCircle size={13} />
          </button>
        )}
      </div>
    </article>
  );
}

/* ──────────────────────────────────────────────────────────────────
   Page
────────────────────────────────────────────────────────────────── */
export default function Dispensary() {
  const { addToast } = useToast();
  const [queue, setQueue] = useState([]);
  const [dispensed, setDispensed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("queue");
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [stockMeds, setStockMeds] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    getMedicines()
      .then(r => setStockMeds(Array.isArray(r) ? r : (r?.data || [])))
      .catch(() => {});
  }, []);

  const load = () => {
    setLoading(true);
    Promise.all([getDispensaryQueue(), getDispensedRecords()])
      .then(([q, d]) => {
        setQueue(q?.data || (Array.isArray(q) ? q : []));
        setDispensed(d?.data || (Array.isArray(d) ? d : []));
      })
      .catch(() => addToast("Failed to load dispensary data.", "error"))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const handleDispense = async (receiptNo, paymentData) => {
    setSaving(true);
    try {
      const r = await markDispensed(receiptNo);
      if (r.success === true) {
        if (paymentData) {
          try {
            await updateBilling({
              receiptNo,
              status: "Paid",
              payment_method: paymentData.payMethod,
              amount: parseFloat(paymentData.medAmount) || 0,
            });
          } catch {
            addToast("Warning: Billing record may not have been updated.", "warning");
          }
        }
        invalidate("dispensary");
        setModal(null);
        load();
        addToast("Prescription dispensed.", "success");
      } else {
        addToast(r.error || "Failed to mark dispensed.", "error");
      }
    } catch {
      addToast("Connection error.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handlePrintQuick = (item) => {
    setModal(item);
    requestAnimationFrame(() => printElement("print-dispense-slip", { pageSize: "A5" }));
  };

  const handleWhatsApp = (item) => {
    const msg = `नमस्ते ${item.patientName} जी,\nआपकी दवाइयाँ तैयार हैं।\nReceipt No: ${item.receiptNo}\nPlease collect from dispensary. - Shanti Care`;
    window.open(`https://wa.me/91${item.phone?.replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const filteredQueue = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return queue;
    return queue.filter(p =>
      [p.receiptNo, p.patientName, p.doctor, p.diagnosis]
        .some(v => (v || "").toLowerCase().includes(q))
    );
  }, [queue, search]);

  const today = new Date().toISOString().slice(0, 10);
  const dispensedToday = dispensed.filter(d => (d.date || "").slice(0, 10) === today).length;
  const urgentCount = queue.filter(q => {
    const meds = parseMeds(q.medicationsJson || q.medications);
    return meds.some(m => /stat|urgent|emergency/i.test(m.timing || ""));
  }).length;

  const doneColumns = [
    { key: "receiptNo", label: "Receipt", cellStyle: { fontFamily: "monospace", fontSize: 12 } },
    { key: "patientName", label: "Patient", render: (d) => <span className="cell-name">{d.patientName}</span> },
    { key: "doctor", label: "Doctor", cellStyle: { fontSize: 12 } },
    { key: "diagnosis", label: "Diagnosis", cellStyle: { fontSize: 12 } },
    { key: "date", label: "Date", cellStyle: { fontSize: 12 } },
    { key: "status", label: "Status", render: () => <span className="badge badge-green">Dispensed</span> },
  ];

  return (
    <div className="fade-in">
      <DispenseModal
        item={modal}
        onClose={() => setModal(null)}
        onConfirm={handleDispense}
        saving={saving}
        stockMeds={stockMeds}
      />

      <PageHeader
        eyebrow={
          <span className="sc-chip sc-chip--live">
            <span className="sc-chip__pulse" aria-hidden="true" />
            Live queue
          </span>
        }
        title="Dispensary"
        subtitle="Task-play: review, confirm, dispense."
        actions={
          <>
            <FreshnessIndicator storeName="dispensary" onRefresh={load} label="Data" />
            <button className="btn btn-outline btn-sm" onClick={load}>
              <RefreshCw size={13} /> Refresh
            </button>
          </>
        }
      />

      {/* Stat strip */}
      <div className="sc-stat-strip">
        <div className="sc-stat">
          <div className="sc-stat__kicker">Pending</div>
          <div className="sc-stat__value">{queue.length}</div>
          <div className="sc-stat__sub">awaiting action</div>
        </div>
        <div className="sc-stat sc-stat--warn" data-hidden={urgentCount === 0 ? "true" : undefined}>
          <div className="sc-stat__kicker">Urgent</div>
          <div className="sc-stat__value">{urgentCount}</div>
          <div className="sc-stat__sub">flagged stat/urgent</div>
        </div>
        <div className="sc-stat sc-stat--ok">
          <div className="sc-stat__kicker">Dispensed today</div>
          <div className="sc-stat__value">{dispensedToday}</div>
          <div className="sc-stat__sub">since midnight</div>
        </div>
        <div className="sc-stat">
          <div className="sc-stat__kicker">Total records</div>
          <div className="sc-stat__value">{dispensed.length}</div>
          <div className="sc-stat__sub">all time</div>
        </div>
      </div>

      <div className="tab-bar" style={{ marginTop: 18 }}>
        <button className={`tab-btn ${tab === "queue" ? "active" : ""}`} onClick={() => setTab("queue")}>
          Task queue
          {queue.length > 0 && <span className="badge badge-purple" style={{ marginLeft: 6 }}>{queue.length}</span>}
        </button>
        <button className={`tab-btn ${tab === "done" ? "active" : ""}`} onClick={() => setTab("done")}>
          Dispensed records
        </button>
      </div>

      {tab === "queue" && (
        <>
          <div className="sc-queue-search">
            <Search size={14} />
            <input
              className="sc-queue-search__input"
              placeholder="Search receipt, patient, doctor, or diagnosis…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button className="sc-queue-search__clear" onClick={() => setSearch("")} aria-label="Clear">
                <X size={13} />
              </button>
            )}
          </div>

          {loading ? (
            <div className="loading-box"><span className="spinner" /></div>
          ) : filteredQueue.length === 0 ? (
            <div className="sc-queue-empty">
              <Inbox size={26} />
              <h3>{queue.length === 0 ? "Queue is clear" : "No matches"}</h3>
              <p>{queue.length === 0 ? "New prescriptions will appear here the moment a doctor sends them." : "Try a different search term."}</p>
            </div>
          ) : (
            <div className="sc-task-list" role="list">
              {filteredQueue.map(item => (
                <TaskCard
                  key={item.receiptNo}
                  item={item}
                  onDispense={setModal}
                  onPrint={handlePrintQuick}
                  onWhatsApp={handleWhatsApp}
                />
              ))}
            </div>
          )}
        </>
      )}

      {tab === "done" && (
        <div className="card" style={{ marginTop: 14 }}>
          <DataTable
            columns={doneColumns}
            data={dispensed}
            loading={loading}
            searchFields={["receiptNo", "patientName", "doctor", "diagnosis"]}
            searchPlaceholder="Search dispensed records…"
            emptyMessage="No records yet"
            actions={(d) => (
              <button className="btn btn-sm btn-outline" onClick={() => setModal(d)} title="View & Print">
                <Printer size={12} /> Print
              </button>
            )}
          />
        </div>
      )}
    </div>
  );
}
