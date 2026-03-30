/**
 * Hospital Print Constants
 * ========================
 * Single source of truth for all hospital identity, colors, and print config.
 * Every print template imports from here — change once, updates everywhere.
 */

export const HOSPITAL = {
  name: "SHANTI CARE HOME",
  subtitle: "A Unit of Shanti Healthcare Pvt. Ltd.",
  address: "123 Serenity Lane, Near Civil Hospital, City — 400001",
  phone: "+91-98765-43210",
  email: "care@shanticarehome.in",
  gstin: "27AABCS1234F1ZP",
  regNo: "MH/2024/HC-0456",
  accreditation: "NABH Accredited",
  tagline: "Compassionate Care, Trusted Healing",
  website: "www.shanticarehome.in",
  logo: "SC", // placeholder initials until real logo
};

/* Print color palette — hardcoded (no CSS vars) for reliable print rendering */
export const P = {
  navy:     "#1a3558",
  white:    "#ffffff",
  black:    "#000000",
  text:     "#1e293b",
  muted:    "#64748b",
  light:    "#94a3b8",
  border:   "#cbd5e1",
  borderLt: "#e2e8f0",
  rowAlt:   "#f8fafc",
  labelBg:  "#f1f5f9",
  accent:   "#2563eb",
  accentBg: "#dbeafe",
  green:    "#16a34a",
  greenBg:  "#dcfce7",
  orange:   "#d97706",
  orangeBg: "#fef9c3",
  red:      "#dc2626",
  redBg:    "#fee2e2",
};

/* Document types and their page configs */
export const DOC_CONFIG = {
  "opd-receipt":    { pageSize: "A5",  title: "OPD CONSULTATION RECEIPT" },
  "prescription":   { pageSize: "A4",  title: "OPD PRESCRIPTION" },
  "dispense-slip":  { pageSize: "A5",  title: "MEDICINE DISPENSARY SLIP" },
  "invoice":        { pageSize: "A4",  title: "MONTHLY INVOICE" },
  "bill":           { pageSize: "A5",  title: "OPD BILLING RECEIPT" },
  "discharge":      { pageSize: "A4",  title: "COMPLETE PATIENT DISCHARGE FILE" },
  "daily-report":   { pageSize: "A4",  title: "DAILY CARE REPORT" },
  "duty-roster":    { pageSize: "A4",  title: "WEEKLY DUTY ROSTER" },
  "kitchen-sheet":  { pageSize: "A4",  title: "DIETARY / KITCHEN SHEET" },
};

/* Where print buttons are actually needed (and nowhere else) */
export const PRINT_LOCATIONS = {
  "Appointments":    "OPD receipt after booking — row action button",
  "PrescribeForm":   "Prescription after doctor saves — modal print",
  "Dispensary":      "Slip after dispensing medicines — modal print",
  "Billing":         "Invoice/bill — modal print",
  "HomeCare":        "Discharge file + daily care report — modal print",
  "DutyRoster":      "Weekly roster — page header action",
  "DietaryMgmt":     "Kitchen sheet — page header action",
};
