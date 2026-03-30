/**
 * Shared Formatters — eliminates duplicate utility functions across pages
 */

/** Get initials from a name: "Kamla Devi" → "KD" */
export function initials(name = "") {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

/** Format currency: 75000 → "₹75,000" */
export function formatCurrency(amount, symbol = "₹") {
  if (amount == null || isNaN(amount)) return "—";
  return `${symbol}${Number(amount).toLocaleString("en-IN")}`;
}

/** Normalize API response — always returns array */
export function normalizeResponse(r, fallback = []) {
  if (Array.isArray(r)) return r;
  if (r?.data && Array.isArray(r.data)) return r.data;
  return fallback;
}

/** Condition → color mapping (for patient cards) */
export function conditionColor(condition = "") {
  const l = condition.toLowerCase();
  if (l.includes("critical") || l.includes("emergency")) return { bg: "var(--danger-light)", color: "var(--danger)" };
  if (l.includes("stable") || l.includes("normal")) return { bg: "var(--success-light)", color: "var(--success)" };
  if (l.includes("moderate") || l.includes("risk")) return { bg: "var(--warning-light)", color: "var(--warning)" };
  return { bg: "var(--subtle)", color: "var(--text-secondary)" };
}

/** Truncate text with ellipsis */
export function truncate(text = "", maxLen = 100) {
  if (text.length <= maxLen) return text;
  return text.substring(0, maxLen) + "...";
}
