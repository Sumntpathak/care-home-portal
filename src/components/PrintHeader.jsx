/**
 * PrintHeader — appears only when printing.
 * Usage: <PrintHeader doctor="Dr. Meena Sharma" degree="MBBS, MD" slipNo="REC-001" slipLabel="OPD Receipt" />
 */
export default function PrintHeader({ doctor, degree, slipNo, slipLabel = "Receipt", date }) {
  const today = date || new Date().toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" });
  return (
    <div className="print-header print-only">
      <div className="ph-name">Shanti Care Home</div>
      <div className="ph-sub">123 Serenity Lane, Near Civil Hospital, City · Ph: +91-98765-43210</div>
      {doctor && <div className="ph-doc">{doctor}{degree ? ` — ${degree}` : ""}</div>}
      <div className="ph-line">
        <span>{slipLabel}: <strong>{slipNo || "—"}</strong></span>
        <span>Date: <strong>{today}</strong></span>
      </div>
    </div>
  );
}
