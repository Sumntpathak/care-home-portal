/**
 * NABH-Compliant Document Templates
 * National Accreditation Board for Hospitals and Healthcare Organizations
 *
 * Templates follow NABH 5th Edition standards for:
 * - Discharge Summary (ME 7.1)
 * - Consent Forms (PRE 2.2)
 * - Nursing Assessment (COP 4.1)
 * - Clinical Audit Checklist
 */

export const NABH_DISCHARGE_TEMPLATE = {
  version: "NABH-5th-Ed",
  sections: [
    {
      id: "patient_info",
      title: "Patient Information",
      fields: [
        { key: "uhid", label: "UHID / MRN", required: true },
        { key: "name", label: "Patient Name", required: true },
        { key: "age", label: "Age / DOB", required: true },
        { key: "gender", label: "Gender", required: true },
        { key: "address", label: "Address", required: true },
        { key: "phone", label: "Contact Number", required: true },
        { key: "aadhar", label: "Aadhaar / ABHA ID", required: false },
        { key: "guardian", label: "Guardian / Next of Kin", required: true },
      ],
    },
    {
      id: "admission",
      title: "Admission Details",
      fields: [
        { key: "admissionDate", label: "Date of Admission", type: "date", required: true },
        { key: "dischargeDate", label: "Date of Discharge", type: "date", required: true },
        { key: "admittingDoctor", label: "Admitting Consultant", required: true },
        { key: "dischargingDoctor", label: "Discharging Consultant", required: true },
        { key: "ward", label: "Ward / Room", required: true },
        { key: "ipNumber", label: "IP Number", required: true },
      ],
    },
    {
      id: "diagnosis",
      title: "Diagnosis (ICD-10 Coded)",
      fields: [
        { key: "primaryDiagnosis", label: "Primary Diagnosis", required: true },
        { key: "icdCode", label: "ICD-10 Code", required: false },
        { key: "secondaryDiagnoses", label: "Secondary Diagnoses", type: "textarea", required: false },
        { key: "comorbidities", label: "Co-morbidities", type: "textarea", required: false },
      ],
    },
    {
      id: "treatment",
      title: "Treatment Summary",
      fields: [
        { key: "chiefComplaints", label: "Chief Complaints at Admission", type: "textarea", required: true },
        { key: "historyOfPresentIllness", label: "History of Present Illness", type: "textarea", required: true },
        { key: "treatmentGiven", label: "Course of Treatment", type: "textarea", required: true },
        { key: "proceduresDone", label: "Procedures / Surgeries Done", type: "textarea", required: false },
        { key: "significantFindings", label: "Significant Investigation Findings", type: "textarea", required: false },
      ],
    },
    {
      id: "discharge_meds",
      title: "Discharge Medications",
      fields: [
        { key: "medications", label: "Medications at Discharge", type: "medication_table", required: true },
      ],
    },
    {
      id: "discharge_advice",
      title: "Discharge Advice",
      fields: [
        { key: "dietAdvice", label: "Dietary Advice", type: "textarea", required: false },
        { key: "activityAdvice", label: "Activity / Lifestyle Advice", type: "textarea", required: false },
        { key: "followUpDate", label: "Follow-up Date", type: "date", required: true },
        { key: "followUpDoctor", label: "Follow-up With", required: true },
        { key: "warningSignsSigns", label: "Warning Signs to Watch For", type: "textarea", required: true },
        { key: "emergencyContact", label: "Emergency Contact Number", required: true },
      ],
    },
    {
      id: "condition_at_discharge",
      title: "Condition at Discharge",
      fields: [
        { key: "conditionAtDischarge", label: "General Condition", type: "select", options: ["Improved", "Stable", "Unchanged", "Deteriorated", "AMA (Against Medical Advice)", "Expired"], required: true },
        { key: "vitalsAtDischarge", label: "Vitals at Discharge", type: "textarea", required: false },
      ],
    },
    {
      id: "signatures",
      title: "Authorization",
      fields: [
        { key: "treatingDoctorSign", label: "Treating Doctor Signature", required: true },
        { key: "nurseSign", label: "Duty Nurse Signature", required: false },
        { key: "patientSign", label: "Patient / Attendant Signature", required: true },
      ],
    },
  ],
};

export const NABH_CONSENT_TEMPLATE = {
  version: "NABH-5th-Ed",
  types: [
    {
      id: "general_consent",
      title: "General Consent for Treatment",
      body: `I, the undersigned patient / authorized representative, hereby consent to routine medical care, diagnostic procedures, nursing care, and treatment as deemed necessary by the medical team at {{hospital_name}}.

I understand that:
1. The nature of my condition has been explained to me in a language I understand.
2. I have the right to ask questions about my treatment.
3. I have the right to refuse treatment after being informed of the consequences.
4. My medical information will be kept confidential as per applicable laws.
5. I consent to sharing my health records via ABDM/ABHA if applicable.

I authorize the hospital to collect, store, and process my health data in compliance with the Information Technology Act, 2000 and applicable healthcare regulations.`,
      requiresWitness: true,
    },
    {
      id: "procedure_consent",
      title: "Informed Consent for Procedure / Surgery",
      body: `Procedure: {{procedure_name}}

I have been informed about:
1. The nature of the proposed procedure
2. Expected benefits and success rate
3. Possible risks, complications, and side effects
4. Alternative treatment options available
5. Consequences of not undergoing the procedure

I understand that no guarantees have been made regarding the outcome. I consent to the procedure and any additional measures deemed necessary during the procedure.`,
      requiresWitness: true,
    },
    {
      id: "ama_consent",
      title: "Discharge Against Medical Advice (AMA / LAMA)",
      body: `I wish to be discharged against the medical advice of the treating team.

I understand that:
1. My condition requires continued medical care
2. Leaving against medical advice may result in worsening of my condition
3. The hospital and its staff are not responsible for any adverse outcome
4. I may return for treatment at any time

I release the hospital and all associated personnel from any liability arising from this decision.`,
      requiresWitness: true,
    },
  ],
};

export const NABH_NURSING_ASSESSMENT = {
  version: "NABH-5th-Ed",
  sections: [
    { id: "initial", title: "Initial Nursing Assessment (within 24 hours)", fields: ["Chief Complaints", "History of Present Illness", "Past Medical History", "Surgical History", "Drug Allergies", "Family History"] },
    { id: "vitals", title: "Vital Signs", fields: ["Temperature", "Blood Pressure", "Pulse", "Respiratory Rate", "SpO2", "Pain Score (0-10)", "GCS Score", "Weight", "Height", "BMI"] },
    { id: "systems", title: "Systems Review", fields: ["Cardiovascular", "Respiratory", "Gastrointestinal", "Neurological", "Musculoskeletal", "Integumentary (Skin)", "Genitourinary"] },
    { id: "risk", title: "Risk Assessment", fields: ["Fall Risk (Morse Scale)", "Pressure Ulcer Risk (Braden Scale)", "Nutritional Risk (NRS-2002)", "DVT Risk", "Suicide Risk (if applicable)"] },
    { id: "functional", title: "Functional Assessment", fields: ["ADL Score (Barthel Index)", "Mobility Status", "Communication", "Vision/Hearing", "Cognitive Status", "Emotional Status"] },
    { id: "plan", title: "Nursing Care Plan", fields: ["Nursing Diagnosis", "Goals", "Interventions", "Expected Outcomes", "Patient/Family Education"] },
  ],
};

export const NABH_QUALITY_INDICATORS = [
  { id: "QI-1", name: "Hand Hygiene Compliance", target: ">85%", frequency: "Monthly", department: "All" },
  { id: "QI-2", name: "Medication Error Rate", target: "<0.5%", frequency: "Monthly", department: "Nursing" },
  { id: "QI-3", name: "Patient Fall Rate", target: "<2 per 1000 patient days", frequency: "Monthly", department: "Nursing" },
  { id: "QI-4", name: "Pressure Ulcer Incidence", target: "<1%", frequency: "Monthly", department: "Nursing" },
  { id: "QI-5", name: "Surgical Site Infection Rate", target: "<2%", frequency: "Monthly", department: "Surgery" },
  { id: "QI-6", name: "Blood Transfusion Reaction Rate", target: "<0.5%", frequency: "Monthly", department: "Blood Bank" },
  { id: "QI-7", name: "Re-admission Rate (30-day)", target: "<5%", frequency: "Monthly", department: "All" },
  { id: "QI-8", name: "Average Length of Stay", target: "As per benchmark", frequency: "Monthly", department: "All" },
  { id: "QI-9", name: "Patient Satisfaction Score", target: ">80%", frequency: "Quarterly", department: "All" },
  { id: "QI-10", name: "Clinical Audit Completion Rate", target: "100%", frequency: "Monthly", department: "Quality" },
];

// ═══════════════════════════════════════════════════════
//  NABH VALIDATION ENGINE
// ═══════════════════════════════════════════════════════

/**
 * Validate a discharge summary against NABH template requirements.
 * Returns list of missing/incomplete fields.
 * @param {Object} data - Filled discharge summary data
 * @returns {{ valid: boolean, errors: Array, completeness: number }}
 */
export function validateDischargeSummary(data = {}) {
  const errors = [];
  let totalFields = 0;
  let filledFields = 0;

  for (const section of NABH_DISCHARGE_TEMPLATE.sections) {
    for (const field of section.fields) {
      totalFields++;
      const value = data[field.key];
      const hasValue = value != null && String(value).trim() !== "";

      if (hasValue) filledFields++;

      if (field.required && !hasValue) {
        errors.push({
          section: section.title,
          field: field.label,
          key: field.key,
          severity: "error",
          message: `${field.label} is required (NABH ${section.id})`,
        });
      }
    }
  }

  // Clinical logic validations
  if (data.dischargeDate && data.admissionDate) {
    const admit = new Date(data.admissionDate);
    const discharge = new Date(data.dischargeDate);
    if (discharge < admit) {
      errors.push({ section: "Admission Details", field: "Discharge Date", severity: "error", message: "Discharge date cannot be before admission date" });
    }
  }

  if (data.conditionAtDischarge === "AMA (Against Medical Advice)" && !data.treatmentGiven) {
    errors.push({ section: "Treatment Summary", field: "Course of Treatment", severity: "warning", message: "Document treatment offered before AMA discharge (NABH ME 7.1)" });
  }

  if (!data.warningSignsSigns && data.conditionAtDischarge !== "Expired") {
    errors.push({ section: "Discharge Advice", field: "Warning Signs", severity: "error", message: "Warning signs must be documented for all discharges (NABH patient safety)" });
  }

  const completeness = totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0;

  return {
    valid: errors.filter(e => e.severity === "error").length === 0,
    errors,
    completeness,
    summary: `${filledFields}/${totalFields} fields completed (${completeness}%). ${errors.filter(e => e.severity === "error").length} mandatory fields missing.`,
  };
}

/**
 * Validate consent form completeness.
 * @param {Object} data - { type, patientName, patientSign, witnessSign, date }
 * @returns {{ valid: boolean, errors: Array }}
 */
export function validateConsentForm(data = {}) {
  const errors = [];

  if (!data.patientName) errors.push({ field: "Patient Name", message: "Patient name required on consent" });
  if (!data.patientSign) errors.push({ field: "Patient Signature", message: "Patient or authorized representative must sign" });
  if (!data.date) errors.push({ field: "Date", message: "Consent date required" });

  const consentType = NABH_CONSENT_TEMPLATE.types.find(t => t.id === data.type);
  if (consentType?.requiresWitness && !data.witnessSign) {
    errors.push({ field: "Witness Signature", message: `Witness signature required for ${consentType.title} (NABH PRE 2.2)` });
  }

  if (data.type === "procedure_consent" && !data.procedureName) {
    errors.push({ field: "Procedure Name", message: "Procedure name must be specified in informed consent" });
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Check if a patient is ready for discharge based on NABH checklist.
 * @param {Object} patient - Patient record with all clinical data
 * @returns {{ ready: boolean, checklist: Array }}
 */
export function checkDischargeReadiness(patient = {}) {
  const checklist = [
    { item: "Discharge summary completed", met: !!patient.dischargeSummary, mandatory: true },
    { item: "Discharge medications documented", met: !!patient.dischargeMedications, mandatory: true },
    { item: "Follow-up date scheduled", met: !!patient.followUpDate, mandatory: true },
    { item: "Warning signs explained to patient/family", met: !!patient.warningSignsExplained, mandatory: true },
    { item: "Patient/family education completed", met: !!patient.educationCompleted, mandatory: false },
    { item: "Outstanding bills settled or payment plan arranged", met: patient.billingCleared !== false, mandatory: true },
    { item: "Consent for discharge signed", met: !!patient.dischargeConsentSigned, mandatory: true },
    { item: "Referral letters provided (if applicable)", met: patient.referralNeeded ? !!patient.referralProvided : true, mandatory: false },
    { item: "Valuables returned", met: patient.valuablesReturned !== false, mandatory: false },
    { item: "Transport arranged", met: patient.transportArranged !== false, mandatory: false },
  ];

  const mandatoryMet = checklist.filter(c => c.mandatory).every(c => c.met);

  return {
    ready: mandatoryMet,
    checklist,
    mandatoryComplete: checklist.filter(c => c.mandatory && c.met).length,
    mandatoryTotal: checklist.filter(c => c.mandatory).length,
    summary: mandatoryMet
      ? "All mandatory discharge criteria met. Patient may be discharged."
      : `${checklist.filter(c => c.mandatory && !c.met).length} mandatory item(s) incomplete. Cannot discharge until resolved.`,
  };
}
