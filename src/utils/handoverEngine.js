// ═══════════════════════════════════════════════════════
//  AUTO NURSE HANDOVER ENGINE
//  Auto-generates shift handover reports from daily care data
//  Follows ISBAR framework:
//    I - Identify, S - Situation, B - Background,
//    A - Assessment, R - Recommendation
// ═══════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────
//  CONSTANTS & THRESHOLDS
// ─────────────────────────────────────────────────────

/**
 * Clinical vital sign thresholds for alert generation
 */
const VITAL_THRESHOLDS = {
  temperature: {
    unit: "°F",
    critical_high: 103,
    high: 101,
    low: 95,
    critical_low: 93,
    label: "Temperature",
  },
  systolicBP: {
    unit: "mmHg",
    critical_high: 180,
    high: 160,
    low: 90,
    critical_low: 80,
    label: "Systolic BP",
  },
  diastolicBP: {
    unit: "mmHg",
    critical_high: 120,
    high: 100,
    low: 60,
    critical_low: 50,
    label: "Diastolic BP",
  },
  pulse: {
    unit: "bpm",
    critical_high: 120,
    high: 100,
    low: 50,
    critical_low: 40,
    label: "Pulse Rate",
  },
  spo2: {
    unit: "%",
    low: 93,
    critical_low: 88,
    label: "SpO2",
  },
  glucose: {
    unit: "mg/dL",
    critical_high: 400,
    high: 250,
    low: 70,
    critical_low: 50,
    label: "Blood Glucose",
  },
  respiratoryRate: {
    unit: "breaths/min",
    critical_high: 30,
    high: 24,
    low: 10,
    critical_low: 8,
    label: "Respiratory Rate",
  },
};

/**
 * Shift-specific scheduled tasks and responsibilities
 */
const SHIFT_TASKS = {
  Morning: {
    label: "Morning Shift (7:00 AM - 3:00 PM)",
    hours: { start: 7, end: 15 },
    tasks: [
      "Administer morning medications (7:00 AM - 8:00 AM)",
      "Assist with morning hygiene and bathing",
      "Serve breakfast and monitor dietary intake (8:00 AM - 9:00 AM)",
      "Morning vital signs check (8:00 AM - 9:00 AM)",
      "Doctor rounds and follow-up on orders (9:00 AM - 11:00 AM)",
      "Physiotherapy and rehabilitation sessions (10:00 AM - 12:00 PM)",
      "Mid-morning snack distribution (10:30 AM)",
      "Wound dressing changes as scheduled",
      "Pre-lunch blood glucose check for diabetic patients (11:30 AM)",
      "Serve lunch and monitor dietary intake (12:30 PM - 1:30 PM)",
      "Post-lunch medications (1:00 PM - 2:00 PM)",
      "Position changes for bedridden patients (every 2 hours)",
      "Update patient care charts and documentation",
      "Prepare afternoon shift handover notes (2:30 PM)",
    ],
  },
  Afternoon: {
    label: "Afternoon Shift (3:00 PM - 11:00 PM)",
    hours: { start: 15, end: 23 },
    tasks: [
      "Receive handover from morning shift (3:00 PM)",
      "Administer afternoon/evening medications (3:00 PM - 4:00 PM)",
      "Afternoon vital signs check (3:30 PM - 4:30 PM)",
      "Serve evening tea and snacks (4:00 PM - 4:30 PM)",
      "Manage visitor hours (4:00 PM - 6:00 PM)",
      "Assist with evening ambulation and exercises",
      "Pre-dinner blood glucose check for diabetic patients (6:00 PM)",
      "Serve dinner and monitor dietary intake (7:00 PM - 8:00 PM)",
      "Evening medications administration (8:00 PM - 9:00 PM)",
      "Assist with evening hygiene and preparation for bed",
      "Evening vital signs for critical patients (9:00 PM)",
      "Position changes for bedridden patients (every 2 hours)",
      "Ensure all call bells are within patient reach",
      "Update patient care charts and documentation",
      "Prepare night shift handover notes (10:30 PM)",
    ],
  },
  Night: {
    label: "Night Shift (11:00 PM - 7:00 AM)",
    hours: { start: 23, end: 7 },
    tasks: [
      "Receive handover from afternoon shift (11:00 PM)",
      "Administer night medications (11:00 PM - 11:30 PM)",
      "Perform security and safety rounds (11:30 PM)",
      "Position changes for bedridden patients — every 2 hours (1 AM, 3 AM, 5 AM)",
      "Overnight vital signs check for critical patients (2:00 AM)",
      "Monitor oxygen-dependent patients — continuous",
      "Respond to call bells and patient needs",
      "Manage incontinence care as needed",
      "Early morning vital signs check (5:00 AM - 6:00 AM)",
      "Early morning blood glucose check for diabetic patients (6:00 AM)",
      "Assist early risers with hygiene (6:00 AM - 7:00 AM)",
      "Prepare morning medications trolley (6:30 AM)",
      "Complete night shift documentation",
      "Prepare morning shift handover notes (6:30 AM)",
    ],
  },
};

/**
 * Conditions that indicate high fall risk
 */
const FALL_RISK_CONDITIONS = [
  "parkinson", "alzheimer", "dementia", "stroke", "fracture",
  "vertigo", "neuropathy", "weakness", "unsteady gait",
  "post-surgical", "visual impairment", "cataract",
];

/**
 * Conditions requiring special monitoring
 */
const SPECIAL_MONITORING_CONDITIONS = {
  dialysis: {
    label: "Dialysis Patient",
    tasks: ["Pre-dialysis vitals", "Post-dialysis vitals", "Monitor fistula site", "Fluid intake tracking"],
  },
  oxygen: {
    label: "Oxygen Dependent",
    tasks: ["Continuous SpO2 monitoring", "Check oxygen flow rate hourly", "Ensure backup cylinder available"],
  },
  bedridden: {
    label: "Bedridden Patient",
    tasks: ["Position change every 2 hours", "Pressure sore assessment", "Passive range of motion exercises"],
  },
  tracheostomy: {
    label: "Tracheostomy Patient",
    tasks: ["Suction as needed", "Clean inner cannula", "Monitor for signs of obstruction"],
  },
  feeding_tube: {
    label: "Feeding Tube Patient",
    tasks: ["Check tube placement before feeding", "Flush tube after feeding", "Monitor for aspiration signs"],
  },
};

// ─────────────────────────────────────────────────────
//  HELPER FUNCTIONS
// ─────────────────────────────────────────────────────

/**
 * Parse a date string into a Date object
 * @param {string|Date} dateStr
 * @returns {Date|null}
 */
function parseDate(dateStr) {
  if (dateStr instanceof Date) return dateStr;
  if (!dateStr) return null;

  const ddmmyyyy = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/;
  const match = String(dateStr).match(ddmmyyyy);
  if (match) {
    return new Date(parseInt(match[3]), parseInt(match[2]) - 1, parseInt(match[1]));
  }
  return new Date(dateStr);
}

/**
 * Format a Date to "HH:MM AM/PM" string
 * @param {Date} date
 * @returns {string}
 */
function formatTime(date) {
  if (!date) return "";
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
}

/**
 * Format a Date to "DD/MM/YYYY" string
 * @param {Date} date
 * @returns {string}
 */
function formatDate(date) {
  if (!date) return "";
  const d = date instanceof Date ? date : new Date(date);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Parse blood pressure string "120/80" into {systolic, diastolic}
 * @param {string|Object} bp
 * @returns {{systolic: number, diastolic: number}|null}
 */
function parseBP(bp) {
  if (!bp) return null;
  if (typeof bp === "object" && bp.systolic !== undefined) {
    return { systolic: Number(bp.systolic), diastolic: Number(bp.diastolic || 0) };
  }
  const match = String(bp).match(/(\d+)\s*\/\s*(\d+)/);
  if (match) {
    return { systolic: parseInt(match[1]), diastolic: parseInt(match[2]) };
  }
  return null;
}

/**
 * Extract a numeric vital value from various possible formats
 * @param {*} value
 * @returns {number|null}
 */
function extractNumericVital(value) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return value;
  const match = String(value).match(/([\d.]+)/);
  return match ? parseFloat(match[1]) : null;
}

/**
 * Check if a patient has a specific condition (case-insensitive search)
 * @param {Object} patient
 * @param {string[]} conditionKeywords
 * @returns {boolean}
 */
function hasCondition(patient, conditionKeywords) {
  const searchFields = [
    patient.condition,
    patient.diagnosis,
    patient.conditions,
    patient.medicalHistory,
    patient.primaryDiagnosis,
  ]
    .flat()
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return conditionKeywords.some((kw) => searchFields.includes(kw.toLowerCase()));
}

/**
 * Determine hours elapsed since an event
 * @param {string|Date} eventDate
 * @param {string|Date} [referenceDate]
 * @returns {number}
 */
function hoursAgo(eventDate, referenceDate) {
  const event = parseDate(eventDate);
  const ref = referenceDate ? parseDate(referenceDate) : new Date();
  if (!event) return Infinity;
  return (ref - event) / (1000 * 60 * 60);
}

// ─────────────────────────────────────────────────────
//  VITAL SIGN ANALYSIS
// ─────────────────────────────────────────────────────

/**
 * Analyze a set of vitals against thresholds and return alerts
 *
 * @param {Object} vitals - {temp, bp, pulse, spo2, glucose, respiratoryRate}
 * @param {string} patientName
 * @param {string} room
 * @returns {Array<Object>} - [{vital, value, threshold, severity, message}]
 */
function analyzeVitals(vitals, patientName, room) {
  if (!vitals) return [];

  const alerts = [];

  /**
   * Check a single vital against its threshold
   * @param {string} vitalKey
   * @param {number|null} value
   */
  function checkVital(vitalKey, value) {
    if (value === null || value === undefined) return;
    const threshold = VITAL_THRESHOLDS[vitalKey];
    if (!threshold) return;

    if (threshold.critical_high && value >= threshold.critical_high) {
      alerts.push({
        vital: threshold.label,
        value: `${value} ${threshold.unit}`,
        severity: "critical",
        message: `CRITICAL: ${patientName} (Room ${room}) — ${threshold.label} critically high at ${value} ${threshold.unit}`,
      });
    } else if (threshold.high && value >= threshold.high) {
      alerts.push({
        vital: threshold.label,
        value: `${value} ${threshold.unit}`,
        severity: "high",
        message: `HIGH: ${patientName} (Room ${room}) — ${threshold.label} elevated at ${value} ${threshold.unit}`,
      });
    }

    if (threshold.critical_low && value <= threshold.critical_low) {
      alerts.push({
        vital: threshold.label,
        value: `${value} ${threshold.unit}`,
        severity: "critical",
        message: `CRITICAL: ${patientName} (Room ${room}) — ${threshold.label} critically low at ${value} ${threshold.unit}`,
      });
    } else if (threshold.low && value <= threshold.low) {
      alerts.push({
        vital: threshold.label,
        value: `${value} ${threshold.unit}`,
        severity: "high",
        message: `LOW: ${patientName} (Room ${room}) — ${threshold.label} low at ${value} ${threshold.unit}`,
      });
    }
  }

  // Temperature
  checkVital("temperature", extractNumericVital(vitals.temp || vitals.temperature));

  // Blood pressure
  const bp = parseBP(vitals.bp || vitals.bloodPressure);
  if (bp) {
    checkVital("systolicBP", bp.systolic);
    checkVital("diastolicBP", bp.diastolic);
  }

  // Pulse
  checkVital("pulse", extractNumericVital(vitals.pulse || vitals.heartRate));

  // SpO2
  checkVital("spo2", extractNumericVital(vitals.spo2 || vitals.oxygenSaturation));

  // Blood glucose
  checkVital("glucose", extractNumericVital(vitals.glucose || vitals.bloodSugar || vitals.bloodGlucose));

  // Respiratory rate
  checkVital("respiratoryRate", extractNumericVital(vitals.respiratoryRate || vitals.respRate));

  return alerts;
}

// ─────────────────────────────────────────────────────
//  PATIENT STATUS ASSESSMENT
// ─────────────────────────────────────────────────────

/**
 * Analyze care notes to determine if a patient is stable, improving,
 * declining, or in critical condition. Uses vitals trends, observations,
 * and condition context.
 *
 * @param {Array<Object>} notes - Care notes for this patient during the shift
 *   Each note may include: {vitals, observations, condition, complaints, ...}
 * @param {Object} patient - Patient record {id, name, condition, ...}
 * @returns {Object} - {
 *   status: "stable"|"improving"|"declining"|"critical",
 *   confidence: number (0-1),
 *   reasoning: string[],
 *   latestVitals: Object,
 *   vitalsTrend: string
 * }
 */
function assessPatientStatus(notes, patient) {
  const result = {
    status: "stable",
    confidence: 0.5,
    reasoning: [],
    latestVitals: null,
    vitalsTrend: "steady",
  };

  if (!notes || notes.length === 0) {
    result.reasoning.push("No care notes available for this shift — status assumed stable.");
    return result;
  }

  // Sort notes chronologically
  const sortedNotes = [...notes].sort((a, b) => {
    const dateA = parseDate(a.date || a.timestamp);
    const dateB = parseDate(b.date || b.timestamp);
    return (dateA || 0) - (dateB || 0);
  });

  // ── Collect vitals readings over the shift ──
  const vitalsHistory = [];
  sortedNotes.forEach((note) => {
    if (note.vitals) {
      vitalsHistory.push(note.vitals);
    }
  });

  if (vitalsHistory.length > 0) {
    result.latestVitals = vitalsHistory[vitalsHistory.length - 1];
  }

  // ── Check for critical vitals in latest reading ──
  let criticalCount = 0;
  let abnormalCount = 0;

  if (result.latestVitals) {
    const vitalAlerts = analyzeVitals(result.latestVitals, patient.name || "Patient", patient.room || "");
    criticalCount = vitalAlerts.filter((a) => a.severity === "critical").length;
    abnormalCount = vitalAlerts.length;

    if (criticalCount > 0) {
      result.status = "critical";
      result.confidence = 0.9;
      result.reasoning.push(`${criticalCount} critical vital sign(s) detected in latest reading.`);
    } else if (abnormalCount > 0) {
      result.reasoning.push(`${abnormalCount} abnormal vital sign(s) noted.`);
    }
  }

  // ── Analyze vitals trends (if multiple readings) ──
  if (vitalsHistory.length >= 2) {
    const first = vitalsHistory[0];
    const last = vitalsHistory[vitalsHistory.length - 1];

    const trendIndicators = { improving: 0, declining: 0 };

    // SpO2 trend
    const spo2First = extractNumericVital(first.spo2 || first.oxygenSaturation);
    const spo2Last = extractNumericVital(last.spo2 || last.oxygenSaturation);
    if (spo2First !== null && spo2Last !== null) {
      if (spo2Last > spo2First + 2) trendIndicators.improving++;
      else if (spo2Last < spo2First - 2) trendIndicators.declining++;
    }

    // Systolic BP trend
    const bpFirst = parseBP(first.bp || first.bloodPressure);
    const bpLast = parseBP(last.bp || last.bloodPressure);
    if (bpFirst && bpLast) {
      const sysDiff = bpLast.systolic - bpFirst.systolic;
      // If BP was high and came down, that's improving
      if (bpFirst.systolic > 140 && sysDiff < -10) trendIndicators.improving++;
      // If BP was normal and went high, that's declining
      else if (bpFirst.systolic <= 140 && sysDiff > 20) trendIndicators.declining++;
      // If BP was low and went lower, that's declining
      else if (bpFirst.systolic < 100 && sysDiff < -10) trendIndicators.declining++;
    }

    // Temperature trend
    const tempFirst = extractNumericVital(first.temp || first.temperature);
    const tempLast = extractNumericVital(last.temp || last.temperature);
    if (tempFirst !== null && tempLast !== null) {
      if (tempFirst > 100 && tempLast < tempFirst - 0.5) trendIndicators.improving++;
      else if (tempLast > tempFirst + 0.5 && tempLast > 100) trendIndicators.declining++;
    }

    // Glucose trend
    const glucFirst = extractNumericVital(first.glucose || first.bloodSugar);
    const glucLast = extractNumericVital(last.glucose || last.bloodSugar);
    if (glucFirst !== null && glucLast !== null) {
      if (glucFirst > 200 && glucLast < glucFirst - 30) trendIndicators.improving++;
      else if (glucLast > glucFirst + 50) trendIndicators.declining++;
    }

    if (trendIndicators.declining > trendIndicators.improving) {
      result.vitalsTrend = "worsening";
      result.reasoning.push("Vital signs show a worsening trend over the shift.");
      if (result.status !== "critical") {
        result.status = "declining";
        result.confidence = Math.min(result.confidence + 0.2, 0.9);
      }
    } else if (trendIndicators.improving > trendIndicators.declining) {
      result.vitalsTrend = "improving";
      result.reasoning.push("Vital signs show an improving trend over the shift.");
      if (result.status !== "critical") {
        result.status = "improving";
        result.confidence = Math.min(result.confidence + 0.2, 0.9);
      }
    } else {
      result.vitalsTrend = "steady";
      result.reasoning.push("Vital signs remained relatively stable during the shift.");
    }
  }

  // ── Scan observations for concerning keywords ──
  const decliningKeywords = [
    "deteriorat", "worsen", "declin", "unresponsive", "confused",
    "agitat", "restless", "pain increas", "vomit", "fever",
    "bleed", "fall", "seizure", "dyspnea", "cyanosis",
    "altered consciousness", "lethargy", "rigid",
  ];
  const improvingKeywords = [
    "improv", "better", "stable", "good appetite", "alert",
    "cooperative", "walked", "independent", "no complaints",
    "comfortable", "pain reduced", "fever subsided",
  ];

  let decliningSignals = 0;
  let improvingSignals = 0;

  sortedNotes.forEach((note) => {
    const text = [
      note.observations,
      note.condition,
      note.complaints,
      note.generalCondition,
      note.notes,
      note.remarks,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    decliningKeywords.forEach((kw) => {
      if (text.includes(kw)) decliningSignals++;
    });
    improvingKeywords.forEach((kw) => {
      if (text.includes(kw)) improvingSignals++;
    });
  });

  if (decliningSignals > improvingSignals + 1 && result.status !== "critical") {
    result.status = "declining";
    result.confidence = Math.min(result.confidence + 0.15, 0.85);
    result.reasoning.push("Nurse observations indicate declining condition.");
  } else if (improvingSignals > decliningSignals + 1 && result.status === "stable") {
    result.status = "improving";
    result.confidence = Math.min(result.confidence + 0.15, 0.85);
    result.reasoning.push("Nurse observations indicate improvement.");
  }

  // If no strong signals, confirm stable
  if (result.status === "stable" && abnormalCount === 0) {
    result.confidence = 0.7;
    result.reasoning.push("All vitals within normal range; patient is stable.");
  }

  return result;
}

// ─────────────────────────────────────────────────────
//  CRITICAL ALERT GENERATION
// ─────────────────────────────────────────────────────

/**
 * Scan all shift data for issues the incoming nurse MUST know about.
 * Generates prioritized alerts for abnormal vitals, missed medications,
 * recent incidents, fall risks, and special care requirements.
 *
 * @param {Array<Object>} notes - Care notes from the shift
 *   [{patientId, patientName, room, vitals, medications, incidents, ...}]
 * @param {Array<Object>} patients - All active patients
 *   [{id, name, room, condition, bedridden, oxygenDependent, dialysis, ...}]
 * @param {Array<Object>} medSchedule - Medication administration status
 *   [{patientId, schedule: [{time, medication, status: "given"|"pending"|"missed", ...}]}]
 * @param {Array<Object>} [incidents] - Incident reports during this shift
 *   [{patientId, type, description, date, severity, ...}]
 * @returns {Array<Object>} - Sorted alerts [{patient, room, alert, priority, category, details}]
 */
function generateCriticalAlerts(notes, patients, medSchedule, incidents) {
  const alerts = [];

  // ── 1. Abnormal Vitals ──
  if (notes && Array.isArray(notes)) {
    notes.forEach((note) => {
      if (!note.vitals) return;
      const name = note.patientName || note.patient || "Unknown";
      const room = note.room || "N/A";

      const vitalAlerts = analyzeVitals(note.vitals, name, room);
      vitalAlerts.forEach((va) => {
        alerts.push({
          patient: name,
          room,
          alert: va.message,
          priority: va.severity === "critical" ? "high" : "medium",
          category: "Abnormal Vitals",
          details: `${va.vital}: ${va.value}`,
        });
      });
    });
  }

  // ── 2. Missed Medications ──
  if (medSchedule && Array.isArray(medSchedule)) {
    medSchedule.forEach((entry) => {
      const patient = patients?.find(
        (p) => p.id === entry.patientId || String(p.id) === String(entry.patientId)
      );
      const name = patient?.name || entry.patientName || "Unknown";
      const room = patient?.room || entry.room || "N/A";

      const schedule = entry.schedule || entry.medications || [];
      const missed = schedule.filter(
        (s) => (s.status || "").toLowerCase() === "missed" || (s.status || "").toLowerCase() === "not given"
      );

      missed.forEach((m) => {
        alerts.push({
          patient: name,
          room,
          alert: `MISSED MEDICATION: ${m.medication || m.name || "Unknown"} was not administered at ${m.time || "scheduled time"}.`,
          priority: "high",
          category: "Missed Medication",
          details: `Reason: ${m.reason || "Not documented"}`,
        });
      });
    });
  }

  // ── 3. Recent Incidents ──
  if (incidents && Array.isArray(incidents)) {
    incidents.forEach((inc) => {
      const patient = patients?.find(
        (p) => p.id === inc.patientId || String(p.id) === String(inc.patientId)
      );
      const name = patient?.name || inc.patientName || "Unknown";
      const room = patient?.room || inc.room || "N/A";
      const type = (inc.type || "incident").toLowerCase();

      let priority = "medium";
      if (type.includes("fall") || type.includes("injury") || type.includes("emergency")) {
        priority = "high";
      }
      if ((inc.severity || "").toLowerCase() === "critical" || (inc.severity || "").toLowerCase() === "high") {
        priority = "high";
      }

      alerts.push({
        patient: name,
        room,
        alert: `INCIDENT: ${inc.type || "Incident"} — ${inc.description || "Details not documented"}`,
        priority,
        category: "Incident",
        details: `Time: ${inc.time || inc.date || "Not recorded"}. Follow-up: ${inc.followUp || "Monitor closely for 48 hours."}`,
      });
    });
  }

  // ── 4. Fall Risk Patients ──
  if (patients && Array.isArray(patients)) {
    patients.forEach((patient) => {
      const name = patient.name || "Unknown";
      const room = patient.room || "N/A";

      // Check fall risk
      if (patient.fallRisk || hasCondition(patient, FALL_RISK_CONDITIONS)) {
        alerts.push({
          patient: name,
          room,
          alert: `FALL RISK: Patient is identified as high fall risk. Ensure bed rails are up, call bell within reach.`,
          priority: "medium",
          category: "Fall Risk",
          details: `Condition: ${patient.condition || patient.diagnosis || "See medical records"}`,
        });
      }

      // Check bedridden — position change reminder
      if (patient.bedridden || patient.immobile || hasCondition(patient, ["bedridden", "immobile", "paralysis", "paraplegia", "quadriplegia"])) {
        alerts.push({
          patient: name,
          room,
          alert: `POSITION CHANGE: Bedridden patient requires repositioning every 2 hours to prevent pressure ulcers.`,
          priority: "medium",
          category: "Bedridden Care",
          details: "Last position change should be documented. Check for pressure sore development.",
        });
      }

      // Check oxygen-dependent
      if (patient.oxygenDependent || patient.onOxygen || hasCondition(patient, ["oxygen", "copd", "respiratory failure", "ventilator"])) {
        alerts.push({
          patient: name,
          room,
          alert: `OXYGEN PATIENT: Continuous SpO2 monitoring required. Check oxygen flow rate and backup cylinder.`,
          priority: "high",
          category: "Oxygen Dependent",
          details: `Current flow rate: ${patient.oxygenFlowRate || "Verify from equipment"}`,
        });
      }

      // Check dialysis patients
      if (patient.dialysis || hasCondition(patient, ["dialysis", "ckd stage 5", "esrd", "end stage renal"])) {
        alerts.push({
          patient: name,
          room,
          alert: `DIALYSIS PATIENT: Monitor fistula site, fluid intake/output, pre/post dialysis vitals.`,
          priority: "medium",
          category: "Dialysis Care",
          details: `Next dialysis: ${patient.nextDialysis || "Check schedule"}`,
        });
      }
    });
  }

  // ── 5. Recent Falls (48-hour monitoring) ──
  if (incidents && Array.isArray(incidents)) {
    const fallIncidents = incidents.filter((inc) => {
      const type = (inc.type || "").toLowerCase();
      return type.includes("fall") || type.includes("slip");
    });

    fallIncidents.forEach((fall) => {
      const hrs = hoursAgo(fall.date || fall.timestamp);
      if (hrs <= 48 && hrs > 0) {
        const patient = patients?.find(
          (p) => p.id === fall.patientId || String(p.id) === String(fall.patientId)
        );
        const name = patient?.name || fall.patientName || "Unknown";
        const room = patient?.room || fall.room || "N/A";

        alerts.push({
          patient: name,
          room,
          alert: `48-HOUR FALL MONITORING: Patient had a fall ${Math.round(hrs)} hours ago. Continue close observation.`,
          priority: "high",
          category: "Post-Fall Monitoring",
          details: "Monitor for delayed symptoms: headache, dizziness, new pain, neurological changes.",
        });
      }
    });
  }

  // ── Sort by priority: high > medium > low ──
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  alerts.sort((a, b) => (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2));

  return alerts;
}

// ─────────────────────────────────────────────────────
//  PENDING TASKS GENERATOR
// ─────────────────────────────────────────────────────

/**
 * Generate a list of tasks for the incoming shift based on
 * patient needs, medication schedules, and standard shift duties.
 *
 * @param {string} toShift - Incoming shift: "Morning"|"Afternoon"|"Night"
 * @param {Array<Object>} patients - All active patients
 * @param {Array<Object>} medSchedule - Medication schedule [{patientId, schedule: [...]}]
 * @param {Array<Object>} notes - Care notes from outgoing shift
 * @returns {Array<string>} - List of tasks for the incoming shift
 */
function generatePendingTasks(toShift, patients, medSchedule, notes) {
  const tasks = [];
  const shiftInfo = SHIFT_TASKS[toShift];

  if (!shiftInfo) {
    tasks.push(`Begin ${toShift} shift duties as per standard protocol.`);
    return tasks;
  }

  // ── Standard shift tasks ──
  shiftInfo.tasks.forEach((task) => {
    tasks.push(task);
  });

  // ── Patient-specific tasks ──
  if (patients && Array.isArray(patients)) {
    patients.forEach((patient) => {
      const name = patient.name || "Unknown";
      const room = patient.room || "N/A";

      // Bedridden patients — position changes
      if (patient.bedridden || patient.immobile || hasCondition(patient, ["bedridden", "immobile", "paralysis"])) {
        tasks.push(`[Room ${room}] ${name}: Position change every 2 hours — pressure sore check.`);
      }

      // Dialysis patients
      if (patient.dialysis || hasCondition(patient, ["dialysis"])) {
        tasks.push(`[Room ${room}] ${name}: Pre/post dialysis vitals and fistula site check.`);
      }

      // Oxygen patients
      if (patient.oxygenDependent || patient.onOxygen || hasCondition(patient, ["oxygen"])) {
        tasks.push(`[Room ${room}] ${name}: Check oxygen flow rate and SpO2 hourly.`);
      }

      // Wound care
      if (patient.woundCare || hasCondition(patient, ["wound", "ulcer", "dressing"])) {
        tasks.push(`[Room ${room}] ${name}: Wound dressing change as scheduled.`);
      }

      // Diabetic patients — glucose monitoring
      if (hasCondition(patient, ["diabetes", "diabetic"])) {
        if (toShift === "Morning") {
          tasks.push(`[Room ${room}] ${name}: Fasting blood glucose check before breakfast. Pre-lunch check at 11:30 AM.`);
        } else if (toShift === "Afternoon") {
          tasks.push(`[Room ${room}] ${name}: Pre-dinner blood glucose check at 6:00 PM.`);
        } else {
          tasks.push(`[Room ${room}] ${name}: Early morning fasting blood glucose at 6:00 AM.`);
        }
      }
    });
  }

  // ── Pending medications from schedule ──
  if (medSchedule && Array.isArray(medSchedule)) {
    medSchedule.forEach((entry) => {
      const patient = patients?.find(
        (p) => p.id === entry.patientId || String(p.id) === String(entry.patientId)
      );
      const name = patient?.name || entry.patientName || "Unknown";
      const room = patient?.room || entry.room || "N/A";

      const schedule = entry.schedule || entry.medications || [];
      const pending = schedule.filter(
        (s) => (s.status || "").toLowerCase() === "pending" || (s.status || "").toLowerCase() === "scheduled"
      );

      if (pending.length > 0) {
        const medList = pending.map((p) => `${p.medication || p.name} at ${p.time || "scheduled time"}`).join(", ");
        tasks.push(`[Room ${room}] ${name}: Pending medications — ${medList}`);
      }
    });
  }

  // ── Tasks from outgoing shift notes (follow-ups) ──
  if (notes && Array.isArray(notes)) {
    notes.forEach((note) => {
      const followUp = note.followUp || note.pendingActions || note.nextShiftTasks;
      if (followUp) {
        const name = note.patientName || note.patient || "Unknown";
        const room = note.room || "N/A";
        if (Array.isArray(followUp)) {
          followUp.forEach((task) => {
            tasks.push(`[Room ${room}] ${name}: Follow-up — ${task}`);
          });
        } else {
          tasks.push(`[Room ${room}] ${name}: Follow-up — ${followUp}`);
        }
      }
    });
  }

  return tasks;
}

// ─────────────────────────────────────────────────────
//  MEDICATION SUMMARY
// ─────────────────────────────────────────────────────

/**
 * Calculate medication administration compliance for the shift
 *
 * @param {Array<Object>} medSchedule - [{patientId, schedule: [{status, ...}]}]
 * @returns {Object} - {totalDue, given, pending, missed, compliance}
 */
function calculateMedicationSummary(medSchedule) {
  const summary = {
    totalDue: 0,
    given: 0,
    pending: 0,
    missed: 0,
    compliance: 100,
  };

  if (!medSchedule || !Array.isArray(medSchedule)) return summary;

  medSchedule.forEach((entry) => {
    const schedule = entry.schedule || entry.medications || [];
    schedule.forEach((item) => {
      summary.totalDue++;
      const status = (item.status || "").toLowerCase();
      if (status === "given" || status === "administered" || status === "completed") {
        summary.given++;
      } else if (status === "missed" || status === "not given" || status === "refused") {
        summary.missed++;
      } else {
        summary.pending++;
      }
    });
  });

  summary.compliance =
    summary.totalDue > 0
      ? Math.round((summary.given / summary.totalDue) * 100)
      : 100;

  return summary;
}

// ─────────────────────────────────────────────────────
//  ISBAR SUMMARY GENERATION
// ─────────────────────────────────────────────────────

/**
 * Generate the ISBAR-formatted narrative overview for the handover.
 *
 * @param {Object} shiftData - Full shift data
 * @param {Array<Object>} patientUpdates - Assessed patient updates
 * @param {Array<Object>} criticalAlerts - Generated critical alerts
 * @param {Object} medSummary - Medication compliance summary
 * @returns {Object} - {identify, situation, background, assessment, recommendation, summary}
 */
function generateISBARSummary(shiftData, patientUpdates, criticalAlerts, medSummary) {
  const totalPatients = shiftData.patients?.length || 0;
  const criticalCount = patientUpdates.filter((p) => p.status === "critical").length;
  const decliningCount = patientUpdates.filter((p) => p.status === "declining").length;
  const stableCount = patientUpdates.filter((p) => p.status === "stable").length;
  const improvingCount = patientUpdates.filter((p) => p.status === "improving").length;
  const highAlerts = criticalAlerts.filter((a) => a.priority === "high").length;
  const incidentCount = shiftData.incidents?.length || 0;

  // ── I: Identify ──
  const identify = `${shiftData.fromShift} shift handover to ${shiftData.toShift} shift on ${shiftData.date || formatDate(new Date())}. Handed over by: ${shiftData.handedBy || "Duty Nurse"}.`;

  // ── S: Situation ──
  let situation = `Ward census: ${totalPatients} active resident(s).`;
  if (criticalCount > 0) {
    situation += ` ${criticalCount} patient(s) in critical condition requiring immediate attention.`;
  }
  if (decliningCount > 0) {
    situation += ` ${decliningCount} patient(s) showing declining trends.`;
  }
  if (highAlerts > 0) {
    situation += ` There are ${highAlerts} high-priority alert(s) flagged.`;
  }
  if (criticalCount === 0 && decliningCount === 0) {
    situation += " All patients are currently stable.";
  }

  // ── B: Background ──
  const backgroundItems = [];
  if (incidentCount > 0) {
    backgroundItems.push(`${incidentCount} incident(s) reported during the shift.`);
  }
  backgroundItems.push(
    `Medication compliance: ${medSummary.compliance}% (${medSummary.given}/${medSummary.totalDue} administered).`
  );
  if (medSummary.missed > 0) {
    backgroundItems.push(`${medSummary.missed} medication(s) were missed — details in medication summary.`);
  }
  if (medSummary.pending > 0) {
    backgroundItems.push(`${medSummary.pending} medication(s) still pending for incoming shift.`);
  }
  const background = backgroundItems.join(" ");

  // ── A: Assessment ──
  const assessmentParts = [];
  if (criticalCount > 0) {
    const criticalNames = patientUpdates.filter((p) => p.status === "critical").map((p) => `${p.patient} (Room ${p.room})`);
    assessmentParts.push(`Critical: ${criticalNames.join(", ")}.`);
  }
  if (decliningCount > 0) {
    const decliningNames = patientUpdates.filter((p) => p.status === "declining").map((p) => `${p.patient} (Room ${p.room})`);
    assessmentParts.push(`Declining: ${decliningNames.join(", ")}.`);
  }
  assessmentParts.push(
    `${stableCount} stable, ${improvingCount} improving.`
  );
  const assessment = assessmentParts.join(" ");

  // ── R: Recommendation ──
  const recommendations = [];
  if (criticalCount > 0) {
    recommendations.push("Prioritize assessment of critical patients immediately upon taking over.");
  }
  if (medSummary.missed > 0) {
    recommendations.push("Review missed medications with the doctor for catch-up orders.");
  }
  if (medSummary.pending > 0) {
    recommendations.push("Administer pending medications as per schedule.");
  }
  if (decliningCount > 0) {
    recommendations.push("Closely monitor declining patients — increase vital check frequency.");
  }
  if (incidentCount > 0) {
    recommendations.push("Follow up on shift incidents — ensure documentation is complete.");
  }
  if (recommendations.length === 0) {
    recommendations.push("Continue routine care. All patients stable — standard monitoring protocol.");
  }
  const recommendation = recommendations.join(" ");

  // ── 2-3 sentence overview ──
  let summary = `${shiftData.fromShift} shift completed with ${totalPatients} patients under care.`;
  if (criticalCount > 0 || decliningCount > 0) {
    summary += ` ${criticalCount + decliningCount} patient(s) require heightened attention.`;
  } else {
    summary += " All patients are stable with no major concerns.";
  }
  if (medSummary.compliance < 100) {
    summary += ` Medication compliance was ${medSummary.compliance}%.`;
  }

  return {
    identify,
    situation,
    background,
    assessment,
    recommendation,
    summary,
  };
}

// ─────────────────────────────────────────────────────
//  MAIN HANDOVER GENERATOR
// ─────────────────────────────────────────────────────

/**
 * Generate a complete shift handover summary following the ISBAR framework.
 *
 * @param {Object} shiftData - Complete shift data
 *   @param {string} shiftData.fromShift - Outgoing shift: "Morning"|"Afternoon"|"Night"
 *   @param {string} shiftData.toShift - Incoming shift: "Morning"|"Afternoon"|"Night"
 *   @param {string} shiftData.date - Date string for the shift
 *   @param {string} shiftData.handedBy - Name of the outgoing nurse
 *   @param {Array<Object>} shiftData.notes - Care notes from this shift
 *     [{patientId, patientName, room, vitals, observations, medications, complaints, ...}]
 *   @param {Array<Object>} [shiftData.incidents] - Incident reports during shift
 *     [{patientId, patientName, type, description, date, severity, ...}]
 *   @param {Array<Object>} [shiftData.medSchedule] - Medication admin status
 *     [{patientId, patientName, room, schedule: [{time, medication, status, reason}]}]
 *   @param {Array<Object>} shiftData.patients - All active patients
 *     [{id, name, room, condition, bedridden, oxygenDependent, dialysis, ...}]
 *
 * @returns {Object} Complete handover summary
 */
function generateHandoverSummary(shiftData) {
  if (!shiftData) {
    throw new Error("Shift data is required to generate a handover summary.");
  }

  const {
    fromShift = "Morning",
    toShift = "Afternoon",
    date,
    handedBy = "Duty Nurse",
    notes = [],
    incidents = [],
    medSchedule = [],
    patients = [],
  } = shiftData;

  const now = new Date();

  // ── 1. Generate Critical Alerts ──
  const criticalAlerts = generateCriticalAlerts(notes, patients, medSchedule, incidents);

  // ── 2. Assess Each Patient ──
  const patientUpdates = patients.map((patient) => {
    // Find notes for this patient
    const patientNotes = notes.filter(
      (n) =>
        n.patientId === patient.id ||
        String(n.patientId) === String(patient.id) ||
        n.patientName === patient.name
    );

    // Find med schedule for this patient
    const patientMeds = medSchedule.find(
      (m) =>
        m.patientId === patient.id ||
        String(m.patientId) === String(patient.id)
    );

    // Assess status
    const assessment = assessPatientStatus(patientNotes, patient);

    // Extract latest vitals
    const latestNote = patientNotes.length > 0 ? patientNotes[patientNotes.length - 1] : null;
    const vitals = assessment.latestVitals || latestNote?.vitals || {};

    // Extract medications given and pending
    const medicationsGiven = [];
    const medicationsPending = [];

    if (patientMeds) {
      const schedule = patientMeds.schedule || patientMeds.medications || [];
      schedule.forEach((item) => {
        const medName = item.medication || item.name || "Unknown";
        const status = (item.status || "").toLowerCase();
        if (status === "given" || status === "administered" || status === "completed") {
          medicationsGiven.push(`${medName} (${item.time || "on time"})`);
        } else if (status === "pending" || status === "scheduled") {
          medicationsPending.push(`${medName} (${item.time || "scheduled"})`);
        } else if (status === "missed" || status === "not given") {
          medicationsPending.push(`${medName} — MISSED (${item.reason || "no reason given"})`);
        }
      });
    }

    // Collect medications from notes
    patientNotes.forEach((note) => {
      const noteMeds = note.medications || note.medicationsGiven || note.meds || [];
      if (Array.isArray(noteMeds)) {
        noteMeds.forEach((m) => {
          const name = typeof m === "string" ? m : m.name || m.medication || "";
          if (name && !medicationsGiven.some((g) => g.includes(name))) {
            medicationsGiven.push(name);
          }
        });
      }
    });

    // Build key observations
    const observations = patientNotes
      .map((n) => n.observations || n.notes || n.remarks || n.generalCondition || "")
      .filter(Boolean)
      .join("; ");

    // Build concerns list
    const concerns = [];
    if (assessment.status === "critical") concerns.push("Patient is in critical condition — immediate assessment needed.");
    if (assessment.status === "declining") concerns.push("Patient condition is declining — increased monitoring required.");

    // Check for specific concerns from notes
    patientNotes.forEach((note) => {
      if (note.complaints) {
        const complaint = typeof note.complaints === "string" ? note.complaints : note.complaints.join(", ");
        if (complaint) concerns.push(`Complaints: ${complaint}`);
      }
      if (note.concerns) {
        const concern = typeof note.concerns === "string" ? note.concerns : note.concerns.join(", ");
        if (concern) concerns.push(concern);
      }
    });

    // Patient-level alerts
    const patientAlerts = criticalAlerts.filter((a) => a.patient === patient.name);
    patientAlerts.forEach((a) => {
      if (!concerns.some((c) => c.includes(a.category))) {
        concerns.push(a.alert);
      }
    });

    return {
      patient: patient.name,
      patientId: patient.id,
      room: patient.room,
      condition: patient.condition || patient.diagnosis || "See medical records",
      vitals: {
        temp: vitals.temp || vitals.temperature || null,
        bp: vitals.bp || vitals.bloodPressure || null,
        pulse: vitals.pulse || vitals.heartRate || null,
        spo2: vitals.spo2 || vitals.oxygenSaturation || null,
        glucose: vitals.glucose || vitals.bloodSugar || vitals.bloodGlucose || null,
      },
      status: assessment.status,
      statusConfidence: assessment.confidence,
      vitalsTrend: assessment.vitalsTrend,
      keyObservations: observations || "No specific observations recorded this shift.",
      medicationsGiven,
      medicationsPending,
      concerns,
    };
  });

  // ── 3. Medication Summary ──
  const medicationSummary = calculateMedicationSummary(medSchedule);

  // ── 4. Incident Summary ──
  const incidentSummary = [];
  if (incidents && incidents.length > 0) {
    incidents.forEach((inc) => {
      const patient = patients.find(
        (p) => p.id === inc.patientId || String(p.id) === String(inc.patientId)
      );
      const name = patient?.name || inc.patientName || "Unknown";
      const room = patient?.room || inc.room || "N/A";
      incidentSummary.push(
        `${inc.type || "Incident"} — ${name} (Room ${room}): ${inc.description || "Details not documented"}. Severity: ${inc.severity || "Not classified"}.`
      );
    });
  }

  // ── 5. Pending Tasks ──
  const pendingTasks = generatePendingTasks(toShift, patients, medSchedule, notes);

  // ── 6. ISBAR Summary ──
  const isbar = generateISBARSummary(shiftData, patientUpdates, criticalAlerts, medicationSummary);

  // ── 7. Recommendations ──
  const recommendations = [];

  // Critical patient recommendations
  patientUpdates.filter((p) => p.status === "critical").forEach((p) => {
    recommendations.push(`Immediate assessment needed for ${p.patient} (Room ${p.room}) — currently in critical condition.`);
  });

  // Declining patient recommendations
  patientUpdates.filter((p) => p.status === "declining").forEach((p) => {
    recommendations.push(`Increase monitoring frequency for ${p.patient} (Room ${p.room}) — condition is declining.`);
  });

  // Medication recommendations
  if (medicationSummary.missed > 0) {
    recommendations.push(`Contact doctor regarding ${medicationSummary.missed} missed medication(s) for catch-up or rescheduling orders.`);
  }
  if (medicationSummary.pending > 0) {
    recommendations.push(`${medicationSummary.pending} medication(s) pending — prioritize administration per schedule.`);
  }

  // Special care recommendations
  patients.forEach((patient) => {
    if (patient.bedridden || hasCondition(patient, ["bedridden"])) {
      recommendations.push(`${patient.name} (Room ${patient.room}): Ensure position change log is up to date — prevent pressure ulcers.`);
    }
    if (patient.oxygenDependent || hasCondition(patient, ["oxygen"])) {
      recommendations.push(`${patient.name} (Room ${patient.room}): Verify oxygen cylinder levels and backup availability.`);
    }
  });

  // Shift-specific recommendations
  if (toShift === "Morning") {
    recommendations.push("Prepare for doctor rounds — ensure all patient charts and vitals are updated.");
    recommendations.push("Verify breakfast dietary restrictions for each patient.");
  } else if (toShift === "Afternoon") {
    recommendations.push("Review and follow up on any doctor orders from morning rounds.");
    recommendations.push("Prepare for visitor hours — ensure patient areas are tidy.");
  } else if (toShift === "Night") {
    recommendations.push("Verify all patients are settled and comfortable for the night.");
    recommendations.push("Ensure emergency equipment and call bells are functional.");
    recommendations.push("Set alarms for 2-hourly position changes for bedridden patients.");
  }

  // De-duplicate recommendations
  const uniqueRecommendations = [...new Set(recommendations)];

  // ── Build Final Handover Report ──
  const handoverReport = {
    // ISBAR framework
    isbar: {
      identify: isbar.identify,
      situation: isbar.situation,
      background: isbar.background,
      assessment: isbar.assessment,
      recommendation: isbar.recommendation,
    },

    // Quick summary
    summary: isbar.summary,

    // Critical alerts (sorted by priority)
    criticalAlerts,

    // Patient-by-patient updates
    patientUpdates,

    // Pending tasks for incoming shift
    pendingTasks,

    // Medication compliance
    medicationSummary,

    // Incident log
    incidentSummary,

    // Actionable recommendations
    recommendations: uniqueRecommendations,

    // Metadata
    shiftInfo: {
      fromShift,
      toShift,
      date: date || formatDate(now),
      handedBy,
      shiftLabel: SHIFT_TASKS[fromShift]?.label || `${fromShift} Shift`,
    },
    handoverTime: formatTime(now),
    generatedAt: now.toISOString(),
    patientCount: patients.length,
    alertCount: criticalAlerts.length,
    highPriorityAlertCount: criticalAlerts.filter((a) => a.priority === "high").length,
  };

  return handoverReport;
}

// ─────────────────────────────────────────────────────
//  EXPORTS
// ─────────────────────────────────────────────────────

export {
  generateHandoverSummary,
  assessPatientStatus,
  generateCriticalAlerts,
  generatePendingTasks,
  calculateMedicationSummary,
  generateISBARSummary,
  analyzeVitals,
  VITAL_THRESHOLDS,
  SHIFT_TASKS,
  FALL_RISK_CONDITIONS,
  SPECIAL_MONITORING_CONDITIONS,
};
