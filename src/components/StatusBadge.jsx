/**
 * StatusBadge — THE single source of truth for all status rendering.
 * Every page should use this instead of inline badge logic.
 *
 * Usage:
 *   import StatusBadge from "../components/StatusBadge";
 *   <StatusBadge status="Completed" />
 *   <StatusBadge status="High" type="severity" />
 */

const STATUS_MAP = {
  // Appointment statuses
  "Scheduled":      "info",
  "With Doctor":    "warning",
  "To Dispensary":  "warning",
  "Dispensed":      "success",
  "Completed":      "success",
  // Patient statuses
  "Active":         "success",
  "Admitted":       "info",
  "Discharged":     "neutral",
  "Critical":       "danger",
  "Stable":         "success",
  "Serious":        "warning",
  // Billing
  "Paid":           "success",
  "Pending":        "warning",
  "Partially Paid": "warning",
  "Cancelled":      "danger",
  "Overdue":        "danger",
  // Duty/Staff
  "On Duty":        "success",
  "Off Duty":       "neutral",
  "On Leave":       "warning",
  // Incident severity
  "Low":            "info",
  "Moderate":       "warning",
  "High":           "danger",
  // Maternity
  "Open":           "info",
  "Delivered":      "success",
  "Closed":         "neutral",
  // Generic
  "Resolved":       "success",
  "Monitoring":     "warning",
  "Acknowledged":   "success",
};

export default function StatusBadge({ status, type }) {
  const variant = STATUS_MAP[status] || "neutral";
  return <span className={`status-badge ${variant}`}>{status || "N/A"}</span>;
}

/** Utility for inline use where a component isn't practical */
export function getStatusVariant(status) {
  return STATUS_MAP[status] || "neutral";
}
