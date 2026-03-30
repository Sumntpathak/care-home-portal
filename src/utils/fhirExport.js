/**
 * HL7 FHIR R4 Export
 *
 * Converts Shanti Care data into FHIR R4 resources for interoperability.
 * Supports: Patient, Encounter, Observation, MedicationRequest, DiagnosticReport
 */

const FHIR_VERSION = "4.0.1";
const SYSTEM_URL = "https://shanticarehome.in/fhir";

/**
 * Convert patient record to FHIR Patient resource
 */
export function toFhirPatient(patient) {
  return {
    resourceType: "Patient",
    id: patient.id,
    meta: { versionId: "1", lastUpdated: patient.updatedAt || new Date().toISOString(), profile: ["http://hl7.org/fhir/StructureDefinition/Patient"] },
    identifier: [
      { system: `${SYSTEM_URL}/patient-id`, value: patient.id },
      ...(patient.abhaId ? [{ system: "https://healthid.abdm.gov.in", value: patient.abhaId }] : []),
      ...(patient.phone ? [{ system: "urn:oid:2.16.840.1.113883.2.18", value: patient.phone }] : []),
    ],
    name: [{ use: "official", text: patient.name, family: patient.name?.split(" ").pop(), given: patient.name?.split(" ").slice(0, -1) }],
    gender: patient.gender?.toLowerCase() === "male" ? "male" : patient.gender?.toLowerCase() === "female" ? "female" : "other",
    ...(patient.age ? { birthDate: estimateBirthYear(patient.age) } : {}),
    ...(patient.phone ? { telecom: [{ system: "phone", value: patient.phone, use: "mobile" }] } : {}),
    ...(patient.guardian ? { contact: [{ relationship: [{ text: "Guardian" }], name: { text: patient.guardian } }] } : {}),
    active: patient.status !== "Discharged",
  };
}

/**
 * Convert appointment to FHIR Encounter resource
 */
export function toFhirEncounter(appointment) {
  return {
    resourceType: "Encounter",
    id: appointment.receiptNo,
    meta: { lastUpdated: appointment.date || new Date().toISOString() },
    identifier: [{ system: `${SYSTEM_URL}/receipt`, value: appointment.receiptNo }],
    status: mapEncounterStatus(appointment.status),
    class: { system: "http://terminology.hl7.org/CodeSystem/v3-ActCode", code: "AMB", display: "ambulatory" },
    type: [{ text: appointment.type || "General Consultation" }],
    subject: { display: appointment.patientName },
    participant: [{ individual: { display: appointment.doctor } }],
    period: { start: appointment.date },
    reasonCode: appointment.notes ? [{ text: appointment.notes }] : [],
  };
}

/**
 * Convert vitals to FHIR Observation resources
 */
export function toFhirVitals(vitals, patientRef) {
  const observations = [];
  const now = new Date().toISOString();

  if (vitals.temperature) {
    observations.push(createObservation("body-temperature", "8310-5", "Body Temperature", vitals.temperature, "degF", patientRef, now));
  }
  if (vitals.bp) {
    const [sys, dia] = vitals.bp.split("/").map(Number);
    if (sys) observations.push(createObservation("blood-pressure-systolic", "8480-6", "Systolic BP", sys, "mm[Hg]", patientRef, now));
    if (dia) observations.push(createObservation("blood-pressure-diastolic", "8462-4", "Diastolic BP", dia, "mm[Hg]", patientRef, now));
  }
  if (vitals.pulse) {
    observations.push(createObservation("heart-rate", "8867-4", "Heart Rate", vitals.pulse, "/min", patientRef, now));
  }
  if (vitals.spo2) {
    observations.push(createObservation("oxygen-saturation", "59408-5", "Oxygen saturation in Arterial blood by Pulse oximetry", vitals.spo2, "%", patientRef, now));
  }
  if (vitals.glucose) {
    observations.push(createObservation("blood-glucose", "2339-0", "Blood Glucose", vitals.glucose, "mg/dL", patientRef, now));
  }

  return observations;
}

/**
 * Convert prescription to FHIR MedicationRequest
 */
export function toFhirMedicationRequest(med, prescriptionId, patientRef, doctorRef) {
  return {
    resourceType: "MedicationRequest",
    id: `${prescriptionId}-${med.name?.replace(/\s+/g, "-").toLowerCase()}`,
    status: "active",
    intent: "order",
    medicationCodeableConcept: { text: med.name },
    subject: patientRef,
    requester: doctorRef,
    dosageInstruction: [{
      text: `${med.dose || ""} ${med.timing || ""} ${med.frequency || ""}`.trim(),
      timing: { code: { text: med.frequency || med.timing || "" } },
      doseAndRate: med.dose ? [{ doseQuantity: { value: parseFloat(med.dose) || 0, unit: "dose" } }] : [],
    }],
    ...(med.duration ? { dispenseRequest: { expectedSupplyDuration: { value: parseInt(med.duration) || 0, unit: "days" } } } : {}),
    note: med.notes ? [{ text: med.notes }] : [],
  };
}

/**
 * Convert lab results to FHIR DiagnosticReport
 */
export function toFhirDiagnosticReport(labOrder, results) {
  return {
    resourceType: "DiagnosticReport",
    id: labOrder.id,
    status: labOrder.status === "Completed" ? "final" : "preliminary",
    category: [{ coding: [{ system: "http://terminology.hl7.org/CodeSystem/v2-0074", code: "LAB", display: "Laboratory" }] }],
    code: { text: labOrder.tests?.map(t => t).join(", ") || "Lab Panel" },
    subject: { display: labOrder.patientName },
    effectiveDateTime: labOrder.orderedAt,
    issued: new Date().toISOString(),
    result: Object.entries(results || {}).map(([key, value]) => ({
      reference: `Observation/${key}`,
      display: `${key}: ${value}`,
    })),
  };
}

/**
 * Export full patient record as FHIR Bundle
 */
export function toFhirBundle(patient, encounters = [], prescriptions = [], vitals = [], labReports = []) {
  const patientResource = toFhirPatient(patient);
  const patientRef = { reference: `Patient/${patient.id}`, display: patient.name };

  const entries = [
    { resource: patientResource, request: { method: "PUT", url: `Patient/${patient.id}` } },
    ...encounters.map(e => ({
      resource: toFhirEncounter(e),
      request: { method: "PUT", url: `Encounter/${e.receiptNo}` },
    })),
    ...vitals.flatMap(v => toFhirVitals(v, patientRef).map(obs => ({
      resource: obs,
      request: { method: "PUT", url: `Observation/${obs.id}` },
    }))),
    ...labReports.map(lr => ({
      resource: toFhirDiagnosticReport(lr, lr.results),
      request: { method: "PUT", url: `DiagnosticReport/${lr.id}` },
    })),
  ];

  return {
    resourceType: "Bundle",
    type: "transaction",
    meta: { lastUpdated: new Date().toISOString() },
    entry: entries,
  };
}

/**
 * Download FHIR bundle as JSON file
 */
export function downloadFhirBundle(bundle, filename) {
  const json = JSON.stringify(bundle, null, 2);
  const blob = new Blob([json], { type: "application/fhir+json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename || `fhir-export-${new Date().toISOString().split("T")[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Helpers ──

function createObservation(id, loincCode, display, value, unit, patientRef, date) {
  return {
    resourceType: "Observation",
    id,
    status: "final",
    category: [{ coding: [{ system: "http://terminology.hl7.org/CodeSystem/observation-category", code: "vital-signs" }] }],
    code: { coding: [{ system: "http://loinc.org", code: loincCode, display }], text: display },
    subject: patientRef,
    effectiveDateTime: date,
    valueQuantity: { value: Number(value), unit, system: "http://unitsofmeasure.org" },
  };
}

function mapEncounterStatus(status) {
  const map = { Scheduled: "planned", "With Doctor": "in-progress", "To Dispensary": "in-progress", Dispensed: "finished", Completed: "finished" };
  return map[status] || "unknown";
}

function estimateBirthYear(age) {
  const year = new Date().getFullYear() - parseInt(age);
  return `${year}-01-01`;
}
