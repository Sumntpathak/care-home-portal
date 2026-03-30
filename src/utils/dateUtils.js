/**
 * Date Utilities — Single source of truth for all date formatting
 */

/** "29 Mar 2026" */
export function formatDateShort(d) {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); }
  catch { return String(d); }
}

/** "29 March 2026" */
export function formatDateLong(d) {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }); }
  catch { return String(d); }
}

/** "29 Mar 2026, 02:30 pm" */
export function formatDateTime(d) {
  if (!d) return "—";
  try { return new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true }); }
  catch { return String(d); }
}

/** "Monday, 29 March 2026" */
export function formatDateFull(d) {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" }); }
  catch { return String(d); }
}

/** "2026-03-29" (ISO date for inputs) */
export function formatISO(d) {
  if (!d) return "";
  try { return new Date(d).toISOString().split("T")[0]; }
  catch { return ""; }
}

/** Today as "2026-03-29" */
export function todayISO() {
  return new Date().toISOString().split("T")[0];
}

/** Today as "29 March 2026" */
export function todayLong() {
  return formatDateLong(new Date());
}

/** Current time as "02:30 pm" */
export function timeNow() {
  return new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
}

/** Days between two dates */
export function daysBetween(a, b) {
  if (!a || !b) return null;
  return Math.ceil((new Date(b) - new Date(a)) / 86400000);
}
