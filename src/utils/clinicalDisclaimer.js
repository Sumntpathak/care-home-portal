// ═══════════════════════════════════════════════════════
//  CLINICAL DISCLAIMER & REGULATORY COMPLIANCE
//  Legal shield for all engine outputs
//  Aligned with: CDSCO, MCI, IT Act 2000, DISHA (Draft)
// ═══════════════════════════════════════════════════════

/**
 * Regulatory frameworks this system references:
 *
 * INDIA:
 * - Medical Council of India (MCI) / NMC — Telemedicine Practice Guidelines 2020
 * - CDSCO — Central Drugs Standard Control Organisation
 * - IT Act 2000, Section 79 — Intermediary liability protection
 * - DISHA (Digital Information Security in Healthcare Act) — Draft
 * - Indian Medical Devices Rules 2017 — Software as Medical Device (SaMD) classification
 *
 * INTERNATIONAL:
 * - FDA 21 CFR Part 11 — Electronic records
 * - IEC 62304 — Medical device software lifecycle
 * - ISO 14971 — Risk management for medical devices
 * - WHO Digital Health Guidelines 2019
 */

export const DISCLAIMER = {
  // Short — for inline display next to results
  short: "Safety assistant — helps catch errors, not a replacement for clinical judgment.",

  // Medium — for result panels
  medium: "This is a safety assistant that helps healthcare professionals catch potential errors. It is NOT a diagnostic tool, NOT a prescription system, and does NOT replace clinical consultation. All suggestions must be independently verified by a qualified doctor before any patient care decision.",

  // Full — for modals, print, and legal pages
  full: `WHAT THIS SOFTWARE IS — AND WHAT IT IS NOT

This software is a SAFETY ASSISTANT. It helps healthcare professionals catch potential errors — missed drug interactions, dangerous vital sign patterns, dietary conflicts. It is NOT a doctor, NOT a diagnostic tool, and NOT a replacement for clinical consultation.

Classified as a Clinical Decision Support System (CDSS) — NOT a Medical Device under Indian Medical Devices Rules 2017 (MDR 2017).

1. WHAT IT DOES
- Flags potential drug interactions that a busy doctor might miss
- Suggests diet modifications based on published guidelines
- Highlights concerning vital sign patterns for nurse review
- Drafts shift handover summaries as a starting checklist
ALL outputs are SUGGESTIONS to help catch errors. The doctor/nurse makes every decision.

2. WHAT IT DOES NOT DO
- It does NOT diagnose any condition
- It does NOT prescribe any medication
- It does NOT replace a doctor's examination
- It does NOT guarantee the absence of errors — no alert does NOT mean safe
- It CANNOT account for individual patient variability that only bedside assessment reveals

3. LIABILITY
Under Section 79 of the Information Technology Act 2000, this platform acts as an intermediary providing tools and information. The treating physician/healthcare facility retains full clinical responsibility for all patient care decisions. The software provider shall not be liable for any clinical outcomes resulting from use of this system.

4. STANDARDS REFERENCED (not endorsed by)
- FDA Drug Interaction Guidelines — referenced for interaction severity classification
- AHA/JNC-8 — referenced for blood pressure classification thresholds
- ADA Standards of Care 2024 — referenced for glucose management targets
- WHO Clinical Guidelines — referenced for SpO₂ and temperature ranges
- KDIGO — referenced for CKD dietary guidelines
- ICMR-NIN — referenced for Indian dietary recommendations
- NHS ISBAR — referenced for handover communication framework
- CredibleMeds — referenced for QT prolongation risk classification

"Referenced" means the thresholds and classifications from these standards are used as data inputs. This system is NOT certified, endorsed, or approved by any of these organizations.

5. DATA PRIVACY
Patient data processed by this system is stored locally or on the healthcare facility's chosen infrastructure. The software provider does not access, store, or transmit patient data to external servers without explicit consent, in compliance with the Information Technology (Reasonable Security Practices) Rules 2011.

6. REPORTING
Any suspected adverse events related to clinical decisions supported by this system should be reported to: (a) The treating physician, (b) The healthcare facility's quality assurance team, (c) The Pharmacovigilance Programme of India (PvPI) if drug-related.`,

  // Regulatory classification
  classification: {
    india: "CDSS — Not classified as Medical Device under MDR 2017 Rule 2(b)",
    fda: "Clinical Decision Support Software — exempt under 21st Century Cures Act Section 3060(a)",
    ce: "Not CE marked — informational tool only",
    status: "Advisory tool for qualified healthcare professionals",
  },

  // Per-engine disclaimers
  engines: {
    drugInteractions: "This is a safety net, not a prescription tool. It flags POTENTIAL interactions to help doctors catch errors before they happen. The database is not exhaustive — the absence of an alert does NOT mean a combination is safe. The prescribing doctor must independently verify every prescription. This tool reduces errors; it does not eliminate the need for clinical knowledge.",

    dietEngine: "This generates STARTING POINT suggestions, not final diet orders. Every plan must be reviewed and customized by the treating doctor or a registered dietitian. Individual patient needs, food preferences, and tolerances require human judgment that software cannot provide.",

    vitalsAnalyzer: "This is a screening assistant that highlights patterns a busy nurse might miss — not a diagnostic system. Every alert is a suggestion to LOOK CLOSER, not a diagnosis. A doctor must assess the patient bedside before any clinical action. The system catches errors; the doctor makes decisions.",

    handoverEngine: "This drafts a handover summary from recorded data — it does NOT replace face-to-face nurse communication. Critical patient information must always be verbally confirmed. Use this as a checklist to ensure nothing is missed, not as the handover itself.",

    invoiceGenerator: "Invoices are generated from recorded transactions for convenience. Tax calculations are approximate. A qualified accountant must verify all financial documents before use.",
  },
};

/**
 * Get the appropriate disclaimer for a given context
 * @param {"short"|"medium"|"full"} level
 * @param {string} [engine] - specific engine name for engine-specific disclaimer
 * @returns {string}
 */
export function getDisclaimer(level = "medium", engine = null) {
  let text = DISCLAIMER[level] || DISCLAIMER.medium;
  if (engine && DISCLAIMER.engines[engine]) {
    text += "\n\n" + DISCLAIMER.engines[engine];
  }
  return text;
}

/**
 * Get regulatory classification summary
 */
export function getClassification() {
  return DISCLAIMER.classification;
}

/**
 * Wrap any engine output with disclaimer metadata
 * @param {Object} result - the engine output
 * @param {string} engineName - which engine produced this
 * @returns {Object} - result with disclaimer metadata attached
 */
export function wrapWithDisclaimer(result, engineName) {
  return {
    ...result,
    _disclaimer: {
      level: "medium",
      text: DISCLAIMER.medium,
      engineNote: DISCLAIMER.engines[engineName] || "",
      classification: DISCLAIMER.classification.india,
      generatedAt: new Date().toISOString(),
      version: "1.0.0",
    },
  };
}

/**
 * Clinical Safety Guardrails
 * Every engine output MUST pass through these before display.
 */

/** Severity levels requiring doctor override before action */
export const OVERRIDE_REQUIRED = {
  "drug-interaction-major": "This interaction is classified as MAJOR. A doctor must review and explicitly override before proceeding.",
  "vitals-critical": "Critical vital signs detected. A doctor must acknowledge before the alert can be dismissed.",
  "sepsis-alert": "Sepsis screening positive. Doctor must review within 30 minutes per Surviving Sepsis Campaign guidelines.",
  "medication-error": "Potential medication error detected. Pharmacist or doctor verification required before dispensing.",
};

/** Check if an alert requires doctor override */
export function requiresDoctorOverride(alertType, severity) {
  if (severity === "critical") return true;
  if (alertType === "drug-interaction" && severity === "major") return true;
  if (alertType === "sepsis") return true;
  return false;
}

/** Medico-legal disclaimer that MUST appear on every engine output */
export const MEDICO_LEGAL_DISCLAIMER = `
CLINICAL DECISION SUPPORT — NOT A DIAGNOSIS

This output is generated by a deterministic clinical rule engine based on published medical standards (AHA, WHO, ADA, FDA, JNC-8, KDIGO, NHS).

⚕ This system does NOT diagnose, prescribe, or replace clinical judgment.
⚕ All suggestions MUST be independently verified by a qualified medical practitioner.
⚕ The treating physician retains full clinical and legal responsibility.
⚕ Standards are referenced for threshold data only — not endorsed by any cited organization.

Regulatory: Classified as CDSS under Indian MDR 2017 Rule 2(b). Not a Medical Device.
Exempt under FDA 21st Century Cures Act §3060(a).
Liability: Protected under IT Act 2000, Section 79.
`.trim();

/** Validate clinical input data — reject garbage */
export function validateClinicalInput(vitals = {}) {
  const errors = [];

  if (vitals.systolic != null) {
    if (typeof vitals.systolic !== "number" || vitals.systolic < 40 || vitals.systolic > 300) {
      errors.push({ param: "Systolic BP", value: vitals.systolic, message: "Systolic BP must be 40-300 mmHg" });
    }
  }
  if (vitals.diastolic != null) {
    if (typeof vitals.diastolic !== "number" || vitals.diastolic < 20 || vitals.diastolic > 200) {
      errors.push({ param: "Diastolic BP", value: vitals.diastolic, message: "Diastolic BP must be 20-200 mmHg" });
    }
  }
  if (vitals.systolic && vitals.diastolic && vitals.diastolic >= vitals.systolic) {
    errors.push({ param: "BP", message: "Diastolic must be less than systolic" });
  }
  if (vitals.pulse != null) {
    if (typeof vitals.pulse !== "number" || vitals.pulse < 20 || vitals.pulse > 250) {
      errors.push({ param: "Pulse", value: vitals.pulse, message: "Pulse must be 20-250 bpm" });
    }
  }
  if (vitals.spo2 != null) {
    if (typeof vitals.spo2 !== "number" || vitals.spo2 < 50 || vitals.spo2 > 100) {
      errors.push({ param: "SpO₂", value: vitals.spo2, message: "SpO₂ must be 50-100%" });
    }
  }
  if (vitals.glucose != null) {
    if (typeof vitals.glucose !== "number" || vitals.glucose < 10 || vitals.glucose > 800) {
      errors.push({ param: "Glucose", value: vitals.glucose, message: "Glucose must be 10-800 mg/dL" });
    }
  }
  if (vitals.temperature != null) {
    if (typeof vitals.temperature !== "number" || vitals.temperature < 85 || vitals.temperature > 110) {
      errors.push({ param: "Temperature", value: vitals.temperature, message: "Temperature must be 85-110°F" });
    }
  }
  if (vitals.respiratoryRate != null) {
    if (typeof vitals.respiratoryRate !== "number" || vitals.respiratoryRate < 4 || vitals.respiratoryRate > 60) {
      errors.push({ param: "Respiratory Rate", value: vitals.respiratoryRate, message: "RR must be 4-60 breaths/min" });
    }
  }

  return { valid: errors.length === 0, errors };
}
