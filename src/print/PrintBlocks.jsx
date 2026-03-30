/**
 * Print Building Blocks
 * =====================
 * Shared components used by ALL print templates.
 * Every hospital document uses the same header, footer, section titles, and table styles.
 */

import { HOSPITAL, P } from "./hospital";

/* ══════════════════════════════════════════════
   STYLES — reusable inline style objects
   ══════════════════════════════════════════════ */

export const S = {
  /* Table cell */
  cell: { padding: "4px 10px", border: `1px solid ${P.border}`, verticalAlign: "top", fontSize: 11 },
  /* Label cell (left column) */
  label: { padding: "4px 10px", border: `1px solid ${P.border}`, fontWeight: 700, background: P.labelBg, color: "#334155", width: "28%", fontSize: 10, verticalAlign: "top" },
  /* Table */
  table: { width: "100%", borderCollapse: "collapse", border: `1px solid ${P.border}`, fontSize: 11, marginBottom: 6 },
  /* Data table header row */
  thead: { background: P.navy, color: P.white },
  thCell: { padding: "4px 8px", textAlign: "left", fontWeight: 700, fontSize: 9, letterSpacing: 0.4, border: `1px solid ${P.navy}`, textTransform: "uppercase" },
  /* Alternating row */
  rowAlt: { background: P.rowAlt },
  /* Section break avoidance */
  section: { pageBreakInside: "avoid", marginBottom: 8 },
};

/* ══════════════════════════════════════════════
   HOSPITAL HEADER
   Standard header for every printed document.
   ══════════════════════════════════════════════ */

export function HospitalHeader({ docTitle }) {
  return (
    <div style={{ textAlign: "center", borderBottom: `3px double ${P.navy}`, paddingBottom: 8, marginBottom: 10 }}>
      <div style={{ fontSize: 20, fontWeight: 800, color: P.navy, letterSpacing: 2 }}>{HOSPITAL.name}</div>
      <div style={{ fontSize: 9.5, color: P.muted, marginTop: 2 }}>{HOSPITAL.subtitle}</div>
      <div style={{ fontSize: 9, color: P.muted, marginTop: 2, lineHeight: 1.5 }}>
        {HOSPITAL.address} | Ph: {HOSPITAL.phone} | Email: {HOSPITAL.email}
        <br />GSTIN: {HOSPITAL.gstin} | Reg No: {HOSPITAL.regNo}
      </div>
      {docTitle && (
        <div style={{ marginTop: 6, display: "inline-block", background: P.navy, color: P.white, padding: "3px 18px", borderRadius: 2, fontSize: 11, fontWeight: 700, letterSpacing: 1.5 }}>
          {docTitle}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════
   HOSPITAL FOOTER
   Consistent footer with timestamp & tagline.
   ══════════════════════════════════════════════ */

export function HospitalFooter() {
  const now = new Date();
  const date = now.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
  const time = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  return (
    <div style={{ marginTop: 12, textAlign: "center", fontSize: 8, color: P.light, borderTop: `1px solid ${P.borderLt}`, paddingTop: 6 }}>
      Computer-generated document. Does not require physical signature for validity.
      <br />Printed on {date} at {time}.
      <br /><strong style={{ letterSpacing: 0.8, color: P.navy }}>{HOSPITAL.name} — {HOSPITAL.tagline}</strong>
    </div>
  );
}

/* ══════════════════════════════════════════════
   SECTION TITLE
   Clean navy line separator between sections.
   ══════════════════════════════════════════════ */

export function SectionTitle({ children }) {
  return (
    <div style={{ margin: "10px 0 5px", paddingBottom: 3, borderBottom: `1.5px solid ${P.navy}`, fontSize: 10, fontWeight: 700, color: P.navy, letterSpacing: 0.8, textTransform: "uppercase" }}>
      {children}
    </div>
  );
}

/* ══════════════════════════════════════════════
   SIGNATURE BLOCK
   Standard 2 or 3 column signature area.
   ══════════════════════════════════════════════ */

export function SignatureBlock({ signatures = [] }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 18, gap: 12 }}>
      {signatures.map((sig) => (
        <div key={sig.label} style={{ flex: 1, textAlign: "center" }}>
          <div style={{ height: 28, borderBottom: `1px solid ${P.text}`, marginBottom: 3 }} />
          <div style={{ fontSize: 9, fontWeight: 700, color: P.text }}>{sig.label}</div>
          {sig.name && <div style={{ fontSize: 8, color: P.muted }}>{sig.name}</div>}
        </div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════
   INFO TABLE
   Two-column label:value table for patient/receipt info.
   ══════════════════════════════════════════════ */

export function InfoTable({ rows }) {
  return (
    <table style={S.table}>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i} style={i % 2 === 1 ? S.rowAlt : undefined}>
            {row.map(([label, value], j) => (
              <React.Fragment key={j}>
                <td style={S.label}>{label}</td>
                <td style={{ ...S.cell, fontWeight: value && String(value).length < 30 ? 600 : 400 }}>{value || "—"}</td>
              </React.Fragment>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/* ══════════════════════════════════════════════
   DATA TABLE
   Striped table with navy header for lists (meds, tests, etc).
   ══════════════════════════════════════════════ */

export function DataTable({ headers, rows }) {
  return (
    <table style={{ ...S.table, fontSize: 10 }}>
      <thead>
        <tr style={S.thead}>
          {headers.map((h) => (
            <th key={h} style={S.thCell}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((cells, i) => (
          <tr key={i} style={i % 2 === 0 ? undefined : S.rowAlt}>
            {cells.map((cell, j) => (
              <td key={j} style={{ ...S.cell, fontSize: 10 }}>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/* ══════════════════════════════════════════════
   STATUS BADGE (for receipts)
   ══════════════════════════════════════════════ */

export function StatusBadge({ status }) {
  const s = (status || "").toLowerCase();
  let bg = P.accentBg, fg = P.accent;
  if (["completed", "dispensed", "paid", "active"].some(k => s.includes(k))) { bg = P.greenBg; fg = P.green; }
  else if (["pending", "with doctor", "to dispensary", "scheduled"].some(k => s.includes(k))) { bg = P.orangeBg; fg = P.orange; }
  else if (["critical", "cancelled"].some(k => s.includes(k))) { bg = P.redBg; fg = P.red; }
  return (
    <span style={{ display: "inline-block", padding: "3px 12px", borderRadius: 12, fontSize: 10, fontWeight: 700, background: bg, color: fg, border: `1px solid ${fg}` }}>
      {status || "N/A"}
    </span>
  );
}

/* ══════════════════════════════════════════════
   RECEIPT BAR
   Receipt No + Date + Status in one row.
   ══════════════════════════════════════════════ */

export function ReceiptBar({ receiptNo, dateTime, status }) {
  return (
    <table style={{ ...S.table, marginBottom: 8 }}>
      <tbody>
        <tr style={{ background: P.accentBg }}>
          <td style={{ ...S.cell, width: "30%" }}>
            <div style={{ fontSize: 9, color: P.muted }}>RECEIPT NO</div>
            <div style={{ fontFamily: "monospace", fontSize: 13, fontWeight: 800, color: P.accent }}>{receiptNo || "—"}</div>
          </td>
          <td style={{ ...S.cell, textAlign: "center" }}>
            <div style={{ fontSize: 9, color: P.muted }}>DATE & TIME</div>
            <div style={{ fontWeight: 600 }}>{dateTime || "—"}</div>
          </td>
          <td style={{ ...S.cell, textAlign: "right" }}>
            <StatusBadge status={status} />
          </td>
        </tr>
      </tbody>
    </table>
  );
}

/* ══════════════════════════════════════════════
   FEE ROW
   Amount + Payment status in one row.
   ══════════════════════════════════════════════ */

export function FeeRow({ amount, paid }) {
  return (
    <table style={{ ...S.table, marginBottom: 6 }}>
      <tbody>
        <tr>
          <td style={{ ...S.cell, width: "60%" }}>
            <div style={{ fontSize: 9, color: P.muted }}>AMOUNT</div>
            <div style={{ fontSize: 18, fontWeight: 800, fontFamily: "monospace" }}>
              &#8377; {amount != null ? Number(amount).toLocaleString("en-IN") : "—"}
            </div>
          </td>
          <td style={{ ...S.cell, textAlign: "right" }}>
            <div style={{ fontSize: 9, color: P.muted }}>PAYMENT</div>
            <span style={{ display: "inline-block", padding: "3px 14px", borderRadius: 12, fontSize: 11, fontWeight: 700, background: paid ? P.greenBg : P.orangeBg, color: paid ? P.green : P.orange }}>
              {paid ? "PAID" : "PENDING"}
            </span>
          </td>
        </tr>
      </tbody>
    </table>
  );
}

/* need React in scope for InfoTable fragments */
import React from "react";
