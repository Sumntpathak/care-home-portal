// StatusChip — consistent status badges across all pages
export function StatusChip({ status }) {
  const map = {
    "Scheduled":     { bg: "#eff6ff", text: "#1d4ed8", dot: "#3b82f6" },
    "With Doctor":   { bg: "#fef3c7", text: "#92400e", dot: "#f59e0b" },
    "To Dispensary": { bg: "#f5f3ff", text: "#5b21b6", dot: "#8b5cf6" },
    "Dispensed":     { bg: "#dcfce7", text: "#14532d", dot: "#16a34a" },
    "Completed":     { bg: "#ecfeff", text: "#164e63", dot: "#0891b2" },
    "Discharged":    { bg: "#f1f5f9", text: "#475569", dot: "#94a3b8" },
    "Admitted":      { bg: "#ecfdf5", text: "#064e3b", dot: "#059669" },
    "Active":        { bg: "#dcfce7", text: "#14532d", dot: "#16a34a" },
    "Pending":       { bg: "#fef3c7", text: "#92400e", dot: "#f59e0b" },
    "Paid":          { bg: "#dcfce7", text: "#14532d", dot: "#16a34a" },
    "Cancelled":     { bg: "#fef2f2", text: "#7f1d1d", dot: "#ef4444" },
  };
  const c = map[status] || { bg: "#f1f5f9", text: "#475569", dot: "#94a3b8" };

  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      gap: "5px",
      padding: "3px 10px",
      borderRadius: "20px",
      background: c.bg,
      color: c.text,
      fontSize: "11px",
      fontWeight: "600",
      lineHeight: 1.6,
      whiteSpace: "nowrap",
    }}>
      <span style={{
        width: "6px",
        height: "6px",
        borderRadius: "50%",
        background: c.dot,
        flexShrink: 0,
      }} />
      {status}
    </span>
  );
}
