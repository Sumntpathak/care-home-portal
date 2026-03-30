/**
 * CLINICAL DECISION PIPELINE
 * Central orchestration layer that chains all clinical engines.
 *
 * Flow: Patient Context → Vitals → Risk Scores → Drug Safety → Diet → Final Alert
 *
 * Every output includes:
 * - Confidence score (0-1)
 * - Explainability (why + guideline source)
 * - Severity (info/warning/critical)
 * - Required action (monitor/alert-doctor/emergency)
 * - Audit-ready metadata
 */

import { classifySystolic, classifyDiastolic, classifyPulse, classifySpo2, classifyGlucose, classifyTemperature, calculateQSOFA, screenCardiorenalSyndrome, screenOvermedication } from './vitalsEngine';
import { logEngineCall } from './auditTrail';

// ═══════════════════════════════════════════════════════
//  LAYER 2: RISK SCORING SYSTEMS
// ═══════════════════════════════════════════════════════

/**
 * NEWS2 (National Early Warning Score 2) — UK Royal College of Physicians
 * Used globally for early detection of clinical deterioration.
 * Score 0-3 per parameter, total 0-20.
 */
export function calculateNEWS2(vitals = {}) {
  let score = 0;
  const breakdown = [];

  // Respiratory Rate
  const rr = vitals.respiratoryRate;
  if (rr != null) {
    let pts = 0;
    if (rr <= 8) pts = 3;
    else if (rr <= 11) pts = 1;
    else if (rr <= 20) pts = 0;
    else if (rr <= 24) pts = 2;
    else pts = 3;
    score += pts;
    breakdown.push({ param: "Respiratory Rate", value: rr, unit: "/min", points: pts, explanation: pts > 0 ? `RR ${rr}/min scores ${pts} — ${rr <= 8 ? "dangerously low" : "elevated"} (NEWS2 table)` : `RR ${rr}/min — normal range (12-20)` });
  }

  // SpO2 (Scale 1 — no supplemental O2)
  const spo2 = vitals.spo2;
  if (spo2 != null) {
    let pts = 0;
    if (spo2 <= 91) pts = 3;
    else if (spo2 <= 93) pts = 2;
    else if (spo2 <= 95) pts = 1;
    else pts = 0;
    score += pts;
    breakdown.push({ param: "SpO₂", value: spo2, unit: "%", points: pts, explanation: pts > 0 ? `SpO₂ ${spo2}% scores ${pts} — ${spo2 <= 91 ? "severe hypoxemia" : "below normal"} (NEWS2 Scale 1)` : `SpO₂ ${spo2}% — normal (≥96%)` });
  }

  // Systolic BP
  const sys = vitals.systolic;
  if (sys != null) {
    let pts = 0;
    if (sys <= 90) pts = 3;
    else if (sys <= 100) pts = 2;
    else if (sys <= 110) pts = 1;
    else if (sys <= 219) pts = 0;
    else pts = 3;
    score += pts;
    breakdown.push({ param: "Systolic BP", value: sys, unit: "mmHg", points: pts, explanation: pts > 0 ? `Systolic ${sys} mmHg scores ${pts} — ${sys <= 90 ? "severe hypotension" : sys >= 220 ? "hypertensive emergency" : "borderline"} (NEWS2)` : `Systolic ${sys} mmHg — normal range (111-219)` });
  }

  // Pulse
  const pulse = vitals.pulse;
  if (pulse != null) {
    let pts = 0;
    if (pulse <= 40) pts = 3;
    else if (pulse <= 50) pts = 1;
    else if (pulse <= 90) pts = 0;
    else if (pulse <= 110) pts = 1;
    else if (pulse <= 130) pts = 2;
    else pts = 3;
    score += pts;
    breakdown.push({ param: "Pulse", value: pulse, unit: "bpm", points: pts, explanation: pts > 0 ? `Pulse ${pulse} bpm scores ${pts} — ${pulse <= 40 ? "severe bradycardia" : pulse >= 131 ? "severe tachycardia" : "outside normal"} (NEWS2)` : `Pulse ${pulse} bpm — normal (51-90)` });
  }

  // Temperature
  const temp = vitals.temperature;
  if (temp != null) {
    // Convert to Celsius if > 50 (assumed Fahrenheit)
    const tempC = temp > 50 ? (temp - 32) * 5 / 9 : temp;
    let pts = 0;
    if (tempC <= 35.0) pts = 3;
    else if (tempC <= 36.0) pts = 1;
    else if (tempC <= 38.0) pts = 0;
    else if (tempC <= 39.0) pts = 1;
    else pts = 2;
    score += pts;
    breakdown.push({ param: "Temperature", value: temp, unit: temp > 50 ? "°F" : "°C", points: pts, explanation: pts > 0 ? `Temp ${temp}${temp > 50 ? "°F" : "°C"} (${tempC.toFixed(1)}°C) scores ${pts} — ${tempC <= 35 ? "hypothermia" : "fever"} (NEWS2)` : `Temp normal range` });
  }

  // Consciousness (AVPU)
  const consciousness = vitals.consciousness || vitals.avpu || "A";
  if (consciousness !== "A" && consciousness !== "Alert") {
    score += 3;
    breakdown.push({ param: "Consciousness", value: consciousness, unit: "AVPU", points: 3, explanation: `Non-alert consciousness (${consciousness}) scores 3 — any reduction from Alert is critical (NEWS2)` });
  } else {
    breakdown.push({ param: "Consciousness", value: "Alert", unit: "AVPU", points: 0, explanation: "Alert — normal" });
  }

  // Risk classification
  let risk, action, color;
  if (score >= 7) { risk = "HIGH"; action = "emergency"; color = "#dc2626"; }
  else if (score >= 5) { risk = "MEDIUM-HIGH"; action = "urgent-review"; color = "#ea580c"; }
  else if (score >= 3) { risk = "LOW-MEDIUM"; action = "increase-monitoring"; color = "#d97706"; }
  else { risk = "LOW"; action = "routine"; color = "#15803d"; }

  return {
    score,
    maxScore: 20,
    risk,
    action,
    color,
    breakdown,
    explanation: `NEWS2 score ${score}/20 — ${risk} risk. ${score >= 7 ? "Immediate clinical review required. Consider ICU transfer." : score >= 5 ? "Urgent bedside review by clinician within 30 minutes." : score >= 3 ? "Increase observation frequency to minimum every hour." : "Continue routine monitoring every 4-6 hours."}`,
    source: "Royal College of Physicians, NEWS2 (2017)",
  };
}

/**
 * CHA₂DS₂-VASc Score — Stroke risk in atrial fibrillation
 * ESC Guidelines for AF management
 */
export function calculateCHA2DS2VASc(patient = {}) {
  let score = 0;
  const breakdown = [];
  const age = patient.age || 0;
  const conditions = (patient.conditions || []).map(c => c.toLowerCase());
  const gender = (patient.gender || "").toLowerCase();

  // C: Congestive Heart Failure (+1)
  if (conditions.some(c => c.includes("heart failure") || c.includes("chf") || c.includes("hf"))) {
    score += 1;
    breakdown.push({ criterion: "Congestive Heart Failure", points: 1, met: true });
  }

  // H: Hypertension (+1)
  if (conditions.some(c => c.includes("hypertension") || c.includes("htn"))) {
    score += 1;
    breakdown.push({ criterion: "Hypertension", points: 1, met: true });
  }

  // A₂: Age ≥75 (+2)
  if (age >= 75) {
    score += 2;
    breakdown.push({ criterion: "Age ≥ 75", points: 2, met: true });
  } else if (age >= 65) {
    // A: Age 65-74 (+1) — counted later
    score += 1;
    breakdown.push({ criterion: "Age 65-74", points: 1, met: true });
  }

  // D: Diabetes (+1)
  if (conditions.some(c => c.includes("diabetes") || c.includes("dm"))) {
    score += 1;
    breakdown.push({ criterion: "Diabetes Mellitus", points: 1, met: true });
  }

  // S₂: Prior Stroke/TIA (+2)
  if (conditions.some(c => c.includes("stroke") || c.includes("tia") || c.includes("cva"))) {
    score += 2;
    breakdown.push({ criterion: "Prior Stroke/TIA/Thromboembolism", points: 2, met: true });
  }

  // V: Vascular disease (+1)
  if (conditions.some(c => c.includes("vascular") || c.includes("mi") || c.includes("pad") || c.includes("aortic"))) {
    score += 1;
    breakdown.push({ criterion: "Vascular Disease", points: 1, met: true });
  }

  // Sc: Sex category — Female (+1)
  if (gender === "female" || gender === "f") {
    score += 1;
    breakdown.push({ criterion: "Female Sex", points: 1, met: true });
  }

  let risk, recommendation;
  const isFemale = gender === "female" || gender === "f";
  const anticoagThreshold = isFemale ? 3 : 2;

  if (score === 0) { risk = "Low"; recommendation = "No anticoagulation recommended."; }
  else if (score < anticoagThreshold) { risk = "Low-Moderate"; recommendation = `Score ${score} — consider anticoagulation. ${isFemale ? "ESC 2020: anticoagulation recommended at >=3 for women." : "ESC 2020: anticoagulation recommended at >=2 for men."} Discuss risk/benefit with patient.`; }
  else { risk = "Moderate-High"; recommendation = `Oral anticoagulation recommended (score ${score}, threshold ${anticoagThreshold} for ${isFemale ? "women" : "men"} per ESC 2020). Annual stroke risk ~${Math.min(score * 1.5, 15).toFixed(1)}%.`; }

  return {
    score,
    maxScore: 9,
    risk,
    recommendation,
    breakdown,
    explanation: `CHA₂DS₂-VASc score ${score}/9 — ${risk} stroke risk in atrial fibrillation. ${recommendation}`,
    source: "ESC Guidelines for AF Management (2020)",
  };
}

/**
 * Morse Fall Scale — Fall risk assessment
 * Score ≥45 = High risk, 25-44 = Moderate, 0-24 = Low
 */
export function calculateMorseFallScale(patient = {}) {
  let score = 0;
  const breakdown = [];

  // History of falling (within 3 months)
  if (patient.fallHistory) {
    score += 25;
    breakdown.push({ criterion: "History of falling (3 months)", points: 25, met: true });
  }

  // Secondary diagnosis (≥2 medical diagnoses)
  const condCount = (patient.conditions || []).length;
  if (condCount >= 2) {
    score += 15;
    breakdown.push({ criterion: "Secondary diagnosis (≥2 conditions)", points: 15, met: true, detail: `${condCount} active conditions` });
  }

  // Ambulatory aid
  const aid = (patient.ambulatoryAid || "").toLowerCase();
  if (aid.includes("wheelchair") || aid.includes("bedrest")) {
    score += 0;
    breakdown.push({ criterion: "Ambulatory aid: wheelchair/bedrest", points: 0, met: false });
  } else if (aid.includes("crutch") || aid.includes("cane") || aid.includes("walker")) {
    score += 15;
    breakdown.push({ criterion: "Ambulatory aid: crutches/cane/walker", points: 15, met: true });
  } else if (aid.includes("furniture") || aid.includes("wall")) {
    score += 30;
    breakdown.push({ criterion: "Ambulatory aid: furniture/wall", points: 30, met: true });
  }

  // IV therapy / heparin lock
  if (patient.ivTherapy) {
    score += 20;
    breakdown.push({ criterion: "IV therapy / heparin lock", points: 20, met: true });
  }

  // Gait
  const gait = (patient.gait || "").toLowerCase();
  if (gait.includes("impaired") || gait.includes("unsteady")) {
    score += 20;
    breakdown.push({ criterion: "Impaired gait", points: 20, met: true });
  } else if (gait.includes("weak")) {
    score += 10;
    breakdown.push({ criterion: "Weak gait", points: 10, met: true });
  }

  // Mental status
  if (patient.overestimatesAbility || patient.confused) {
    score += 15;
    breakdown.push({ criterion: "Overestimates ability / forgetful", points: 15, met: true });
  }

  // Age factor (added — not original Morse but clinically relevant)
  const age = patient.age || 0;
  if (age >= 80) {
    score += 10;
    breakdown.push({ criterion: "Age ≥ 80 (additional factor)", points: 10, met: true });
  } else if (age >= 65) {
    score += 5;
    breakdown.push({ criterion: "Age 65-79 (additional factor)", points: 5, met: true });
  }

  let risk, color, interventions;
  if (score >= 45) {
    risk = "HIGH";
    color = "#dc2626";
    interventions = ["Fall risk sign on door and chart", "Non-slip footwear mandatory", "Bed in lowest position with side rails", "Assist with all transfers", "Toileting schedule every 2 hours", "Consider 1:1 observation if score >75"];
  } else if (score >= 25) {
    risk = "MODERATE";
    color = "#d97706";
    interventions = ["Yellow fall risk band", "Non-slip footwear", "Bed in low position", "Call bell within reach", "Assist with transfers as needed"];
  } else {
    risk = "LOW";
    color = "#15803d";
    interventions = ["Standard safety precautions", "Ensure environment is hazard-free"];
  }

  return {
    score,
    risk,
    color,
    breakdown,
    interventions,
    explanation: `Morse Fall Scale score ${score} — ${risk} fall risk. ${interventions[0]}.`,
    source: "Morse JM, et al. Western Journal of Nursing Research (1989)",
  };
}

/**
 * Braden Pressure Ulcer Risk Scale
 * Score ≤12 = High risk, 13-14 = Moderate, 15-18 = Mild, ≥19 = No risk
 */
export function calculateBradenScale(patient = {}) {
  // Each dimension scored 1-4 (lower = worse)
  const sensory = patient.bradenSensory || 3; // 1=completely limited, 4=no impairment
  const moisture = patient.bradenMoisture || 3;
  const activity = patient.bradenActivity || 3; // 1=bedfast, 4=walks frequently
  const mobility = patient.bradenMobility || 3;
  const nutrition = patient.bradenNutrition || 3;
  const friction = patient.bradenFriction || 2; // 1-3 only

  const score = sensory + moisture + activity + mobility + nutrition + friction;

  let risk, color;
  if (score <= 12) { risk = "HIGH"; color = "#dc2626"; }
  else if (score <= 14) { risk = "MODERATE"; color = "#d97706"; }
  else if (score <= 18) { risk = "MILD"; color = "#f59e0b"; }
  else { risk = "NONE"; color = "#15803d"; }

  return {
    score,
    maxScore: 23,
    risk,
    color,
    breakdown: [
      { dimension: "Sensory Perception", score: sensory, max: 4 },
      { dimension: "Moisture", score: moisture, max: 4 },
      { dimension: "Activity", score: activity, max: 4 },
      { dimension: "Mobility", score: mobility, max: 4 },
      { dimension: "Nutrition", score: nutrition, max: 4 },
      { dimension: "Friction & Shear", score: friction, max: 3 },
    ],
    explanation: `Braden Scale score ${score}/23 — ${risk} pressure ulcer risk. ${score <= 14 ? "Implement pressure relief protocol. Reposition every 2 hours." : "Standard skin care."}`,
    source: "Braden BJ, Bergstrom N. Nursing Research (1987)",
  };
}

// ═══════════════════════════════════════════════════════
//  BRAIN LAYER 1: Causal Alert Suppression
//  When Alert B is caused by Alert A, suppress B and amplify A.
// ═══════════════════════════════════════════════════════

const CAUSAL_RULES = [
  {
    id: "hypoglycemic-tachycardia",
    cause: (a) => a.param === "Glucose" && a.value < 70,
    effect: (a) => a.param === "Pulse" && a.value > 100,
    suppress: "effect",
    mergeMessage: (cause, effect) =>
      `Tachycardia (${effect.value} bpm) is likely ADRENERGIC RESPONSE to hypoglycemia (${cause.value} mg/dL). Treat glucose first — tachycardia should resolve. Do NOT initiate cardiac workup until glucose corrected. (ADA 2024 + AHA)`,
  },
  {
    id: "fever-tachycardia",
    cause: (a) => a.param === "Temperature" && a.value > 101,
    effect: (a) => a.param === "Pulse" && a.value > 100 && a.value < 130,
    suppress: "effect",
    mergeMessage: (cause, effect) =>
      `Tachycardia (${effect.value} bpm) is likely FEVER-DRIVEN (temp ${cause.value}°F). Heart rate increases ~10 bpm per 1°F rise. Treat fever — tachycardia should resolve. (AHA)`,
  },
  {
    id: "dehydration-hypotension",
    cause: (a) => a.param === "Pulse" && a.value > 110,
    effect: (a) => a.param === "BP" && a.value < 100,
    suppress: "none",
    mergeMessage: (cause, effect) =>
      `Tachycardia (${cause.value} bpm) + hypotension (systolic ${effect.value} mmHg) — possible hypovolemia/dehydration. Assess fluid status. If febrile + hypotensive + tachycardic → sepsis protocol. (Surviving Sepsis Campaign 2021)`,
  },
  {
    id: "news2-subsumes-vitals",
    cause: (a) => a.param === "NEWS2" && a.value >= 5,
    effect: (a) => a.type === "vitals" && a.severity === "warning",
    suppress: "effect",
    mergeMessage: (cause) =>
      `NEWS2 score ${cause.value} (${cause.value >= 7 ? "HIGH" : "MEDIUM-HIGH"} risk) — individual vital alerts subsumed into composite score. Clinical review covers all parameters. (RCP 2017)`,
  },
];

function applyCausalSuppression(alerts) {
  const suppressed = new Set();
  const amplified = [];

  for (const rule of CAUSAL_RULES) {
    const causeAlert = alerts.find(a => !suppressed.has(a) && rule.cause(a));
    const effectAlert = alerts.find(a => !suppressed.has(a) && a !== causeAlert && rule.effect(a));

    if (causeAlert && effectAlert) {
      if (rule.suppress === "effect") {
        suppressed.add(effectAlert);
      }
      // Create merged alert
      amplified.push({
        type: "causal-reasoning",
        param: rule.id,
        severity: causeAlert.severity,
        message: rule.mergeMessage(causeAlert, effectAlert),
        source: "Clinical Decision Pipeline — Causal Analysis",
        causedBy: causeAlert.param,
        suppresses: effectAlert.param,
      });
    }
  }

  // Return: non-suppressed original alerts + amplified causal alerts
  return [
    ...amplified,
    ...alerts.filter(a => !suppressed.has(a)),
  ];
}

// ═══════════════════════════════════════════════════════
//  BRAIN LAYER 2: Drug-Vitals Fusion
//  Links drug interactions to observed vital sign anomalies.
// ═══════════════════════════════════════════════════════

const DRUG_VITAL_LINKS = [
  {
    drugClasses: ["beta-blocker", "metoprolol", "atenolol", "propranolol", "carvedilol", "bisoprolol", "nebivolol"],
    vitalParam: "Pulse",
    vitalCondition: (v) => v < 60,
    message: (drugs, vital) =>
      `Bradycardia (${vital} bpm) in patient on ${drugs.join(" + ")}. LIKELY DRUG-INDUCED (beta-blocker effect). Do NOT initiate cardiac workup until medication review. Consider dose reduction or withholding next dose. (AHA)`,
  },
  {
    drugClasses: ["ccb", "diltiazem", "verapamil", "amlodipine", "nifedipine"],
    vitalParam: "Pulse",
    vitalCondition: (v) => v < 55,
    message: (drugs, vital) =>
      `Severe bradycardia (${vital} bpm) with calcium channel blocker (${drugs.join(", ")}). Rate-limiting CCBs (diltiazem/verapamil) can cause significant bradycardia. Hold next dose, monitor ECG. (AHA)`,
  },
  {
    drugClasses: ["insulin", "glimepiride", "glipizide", "glyburide", "sulfonylurea", "actrapid", "mixtard", "humalog"],
    vitalParam: "Glucose",
    vitalCondition: (v) => v < 70,
    message: (drugs, vital) =>
      `Hypoglycemia (${vital} mg/dL) in patient on ${drugs.join(" + ")}. LIKELY DRUG-INDUCED. Treat with 15-20g fast-acting glucose. Review insulin/sulfonylurea dose — may need reduction, especially in elderly or renal impairment. (ADA 2024)`,
  },
  {
    drugClasses: ["nsaid", "ibuprofen", "diclofenac", "naproxen", "piroxicam", "indomethacin", "ketorolac"],
    vitalParam: "BP",
    vitalCondition: (v) => v > 150,
    message: (drugs, vital) =>
      `Elevated BP (systolic ${vital} mmHg) in patient on NSAIDs (${drugs.join(", ")}). NSAIDs cause sodium retention and reduce antihypertensive efficacy. Consider paracetamol as alternative. (AHA/JNC-8)`,
  },
  {
    drugClasses: ["diuretic", "furosemide", "torsemide", "hydrochlorothiazide", "spironolactone", "amiloride"],
    vitalParam: "BP",
    vitalCondition: (v) => v < 95,
    message: (drugs, vital) =>
      `Hypotension (systolic ${vital} mmHg) in patient on diuretics (${drugs.join(", ")}). Possible over-diuresis/volume depletion. Assess hydration status, check electrolytes. Consider dose adjustment. (AHA)`,
  },
  {
    drugClasses: ["opioid", "morphine", "tramadol", "codeine", "fentanyl", "hydromorphone", "oxycodone"],
    vitalParam: "respiratory_rate",
    vitalCondition: (v) => v < 12,
    message: (drugs, vital) =>
      `Low respiratory rate (${vital}/min) in patient on opioids (${drugs.join(", ")}). POSSIBLE OPIOID-INDUCED RESPIRATORY DEPRESSION. Assess consciousness. Consider naloxone if RR <8 or unresponsive. (WHO Opioid Guidelines)`,
  },
];

function fuseDrugVitalAlerts(vitalsAlerts, medications = [], vitals = {}) {
  const fusedAlerts = [];
  const medNames = medications.map(m => (m.name || m || "").toLowerCase());

  for (const link of DRUG_VITAL_LINKS) {
    // Check if patient is on any of the drug classes
    const matchedDrugs = medNames.filter(m =>
      link.drugClasses.some(d => m.includes(d))
    );
    if (matchedDrugs.length === 0) continue;

    // Check if the vital sign condition is met
    let vitalValue = null;
    if (link.vitalParam === "Pulse") vitalValue = vitals.pulse;
    else if (link.vitalParam === "Glucose") vitalValue = vitals.glucose;
    else if (link.vitalParam === "BP") vitalValue = vitals.systolic;
    else if (link.vitalParam === "respiratory_rate") vitalValue = vitals.respiratoryRate;

    if (vitalValue != null && link.vitalCondition(vitalValue)) {
      fusedAlerts.push({
        type: "drug-vital-fusion",
        severity: "critical",
        message: link.message(matchedDrugs, vitalValue),
        source: "Clinical Decision Pipeline — Drug-Vital Fusion",
        linkedDrugs: matchedDrugs,
        linkedVital: link.vitalParam,
      });
    }
  }

  return fusedAlerts;
}

// ═══════════════════════════════════════════════════════
//  BRAIN LAYER 4: Temporal Trend Injection
//  Analyzes vitals history and injects trend-based alerts.
// ═══════════════════════════════════════════════════════

function analyzeTemporalTrends(vitals, history = []) {
  const trendAlerts = [];
  if (!history || history.length < 3) return trendAlerts;

  // Helper: detect trend direction from recent values
  function detectTrend(values) {
    if (values.length < 3) return null;
    const recent = values.slice(-5);
    const first = recent[0];
    const last = recent[recent.length - 1];
    const change = last - first;
    const pctChange = Math.abs(change / first) * 100;
    const direction = change > 0 ? "rising" : "falling";
    // Simple linear check — are values consistently increasing/decreasing?
    let consistent = 0;
    for (let i = 1; i < recent.length; i++) {
      if ((change > 0 && recent[i] > recent[i - 1]) || (change < 0 && recent[i] < recent[i - 1])) consistent++;
    }
    const isConsistent = consistent >= Math.floor(recent.length * 0.6);
    return { direction, change, pctChange, isConsistent, dataPoints: recent.length };
  }

  // BP trend
  const systolics = history.map(h => h.systolic || h.bp?.split("/")?.[0]).filter(Boolean).map(Number);
  if (systolics.length >= 3) {
    const trend = detectTrend(systolics);
    if (trend && trend.isConsistent && Math.abs(trend.change) > 10) {
      trendAlerts.push({
        type: "temporal-trend",
        param: "BP Trend",
        severity: Math.abs(trend.change) > 20 ? "warning" : "info",
        message: `BP ${trend.direction} trend: systolic ${systolics[0]} → ${systolics[systolics.length - 1]} mmHg over ${trend.dataPoints} readings (${trend.direction === "rising" ? "+" : ""}${trend.change} mmHg). ${trend.direction === "rising" && systolics[systolics.length - 1] > 140 ? "Consider antihypertensive review." : trend.direction === "falling" && systolics[systolics.length - 1] < 100 ? "Monitor for orthostatic symptoms. Review antihypertensives." : "Continue monitoring."}`,
        source: "Clinical Pipeline — Temporal Analysis",
      });
    }
  }

  // Weight trend (fluid retention)
  const weights = history.map(h => h.weight).filter(Boolean).map(Number);
  if (weights.length >= 3) {
    const weeklyGain = weights[weights.length - 1] - weights[0];
    if (weeklyGain > 1.5) {
      trendAlerts.push({
        type: "temporal-trend",
        param: "Weight Trend",
        severity: weeklyGain > 3 ? "critical" : "warning",
        message: `Weight gain +${weeklyGain.toFixed(1)} kg over ${weights.length} readings — possible fluid retention. ${weeklyGain > 3 ? "URGENT: >3kg gain suggests significant fluid overload. Check for peripheral edema, lung crackles, JVP elevation. Consider diuretic adjustment." : "Monitor daily. Report gain >1kg/day to physician."} (AHA Heart Failure Guidelines)`,
        source: "Clinical Pipeline — Temporal Analysis",
      });
    }
  }

  // Glucose trend
  const glucoses = history.map(h => h.glucose).filter(Boolean).map(Number);
  if (glucoses.length >= 3) {
    const trend = detectTrend(glucoses);
    if (trend && trend.isConsistent && Math.abs(trend.change) > 30) {
      trendAlerts.push({
        type: "temporal-trend",
        param: "Glucose Trend",
        severity: "warning",
        message: `Glucose ${trend.direction}: ${glucoses[0]} → ${glucoses[glucoses.length - 1]} mg/dL over ${trend.dataPoints} readings. ${trend.direction === "rising" ? "Worsening glycemic control — review diet compliance, medication adherence, consider dose adjustment." : "Improving, but watch for hypoglycemia if on insulin/sulfonylureas."} (ADA 2024)`,
        source: "Clinical Pipeline — Temporal Analysis",
      });
    }
  }

  // NEWS2 deterioration trend
  const news2Scores = history.map(h => h.news2Score).filter(s => s != null);
  if (news2Scores.length >= 2) {
    const last = news2Scores[news2Scores.length - 1];
    const prev = news2Scores[news2Scores.length - 2];
    if (last > prev && last >= 3) {
      trendAlerts.push({
        type: "temporal-trend",
        param: "NEWS2 Trajectory",
        severity: last >= 5 ? "critical" : "warning",
        message: `NEWS2 DETERIORATING: ${prev} → ${last} (${last - prev > 2 ? "rapid" : "gradual"} increase). A rising NEWS2 is more clinically significant than a static elevated score. Escalate monitoring frequency. ${last >= 7 ? "Consider ICU assessment." : "Reassess within 1 hour."}`,
        source: "Clinical Pipeline — Temporal Analysis (RCP 2017)",
      });
    }
  }

  return trendAlerts;
}

// ═══════════════════════════════════════════════════════
//  LAYER 1: CLINICAL DECISION PIPELINE
// ═══════════════════════════════════════════════════════

/**
 * Run the full clinical decision pipeline for a patient.
 *
 * @param {Object} patient - { name, age, gender, weight, height, conditions: [], allergies: [], medications: [], labs: {} }
 * @param {Object} vitals - { temperature, systolic, diastolic, pulse, spo2, glucose, respiratoryRate, consciousness, weight }
 * @param {Object} options - { includeRiskScores: true, includeDrugCheck: true, includeDiet: true }
 * @returns {Object} Complete clinical assessment with all alerts, scores, and explanations
 */
export function runClinicalPipeline(patient = {}, vitals = {}, options = {}, history = []) {
  const startTime = Date.now();
  const alerts = [];
  const riskScores = {};
  const explanations = [];
  const actions = [];

  // ── Step 1: Patient Context Enrichment ──
  const context = {
    age: patient.age || 0,
    isElderly: (patient.age || 0) >= 65,
    isGeriatric: (patient.age || 0) >= 80,
    isPediatric: (patient.age || 0) < 18,
    gender: patient.gender || "unknown",
    bmi: patient.weight && patient.height ? Math.round(patient.weight / ((patient.height / 100) ** 2) * 10) / 10 : null,
    conditionsList: (patient.conditions || []).map(c => c.toLowerCase()),
    medCount: (patient.medications || []).length,
    hasAllergies: (patient.allergies || []).length > 0,
    renalFunction: patient.labs?.creatinine ? (patient.labs.creatinine > 1.5 ? "impaired" : "normal") : "unknown",
    hba1c: patient.labs?.hba1c || null,
  };

  // ── Step 2: Vitals Classification with Explainability ──
  if (vitals.systolic) {
    const cls = classifySystolic(vitals.systolic);
    if (cls !== "Normal") {
      const explain = vitals.systolic >= 180
        ? `Systolic BP ${vitals.systolic} mmHg — HYPERTENSIVE CRISIS (≥180 per AHA/JNC-8). Immediate intervention required.`
        : vitals.systolic >= 140
          ? `Systolic BP ${vitals.systolic} mmHg — Stage 2 Hypertension (140-179 per AHA/JNC-8).${context.isElderly ? " JNC-8 allows <150 for age ≥60." : ""}`
          : vitals.systolic < 90
            ? `Systolic BP ${vitals.systolic} mmHg — HYPOTENSION (<90 per AHA). Assess for shock, dehydration, medication effect.`
            : `Systolic BP ${vitals.systolic} mmHg — ${cls} (AHA/JNC-8).`;
      alerts.push({ type: "vitals", param: "BP", severity: vitals.systolic >= 180 || vitals.systolic < 90 ? "critical" : "warning", message: explain, source: "AHA/JNC-8", value: vitals.systolic, unit: "mmHg" });
      explanations.push(explain);
    }
  }

  if (vitals.glucose) {
    const g = vitals.glucose;
    if (g < 70 || g > 200) {
      const explain = g < 54
        ? `Blood glucose ${g} mg/dL — CRITICAL HYPOGLYCEMIA (<54 per ADA 2024). Administer 15-20g fast-acting glucose immediately.`
        : g < 70
          ? `Blood glucose ${g} mg/dL — Hypoglycemia (54-70 per ADA 2024). Give 15g carbohydrate, recheck in 15 min.${context.isElderly ? " Elderly at higher risk of neuroglycopenic symptoms." : ""}`
          : g > 300
            ? `Blood glucose ${g} mg/dL — DKA RISK (>300 per ADA). Check ketones, hydration, consider insulin adjustment.`
            : `Blood glucose ${g} mg/dL — Elevated (${g >= 200 ? "diabetic range" : "pre-diabetic"} per ADA 2024).`;
      alerts.push({ type: "vitals", param: "Glucose", severity: g < 54 || g > 300 ? "critical" : "warning", message: explain, source: "ADA 2024", value: g, unit: "mg/dL" });
      explanations.push(explain);
    }
  }

  if (vitals.spo2 && vitals.spo2 < 95) {
    const explain = vitals.spo2 < 88
      ? `SpO₂ ${vitals.spo2}% — SEVERE HYPOXEMIA (<88% per WHO). Administer supplemental oxygen immediately. Consider ABG.`
      : `SpO₂ ${vitals.spo2}% — Below normal (<95% per WHO).${context.conditionsList.some(c => c.includes("copd")) ? " Note: COPD target 88-92%." : " Monitor closely."}`;
    alerts.push({ type: "vitals", param: "SpO₂", severity: vitals.spo2 < 88 ? "critical" : "warning", message: explain, source: "WHO", value: vitals.spo2, unit: "%" });
    explanations.push(explain);
  }

  if (vitals.pulse) {
    if (vitals.pulse < 50 || vitals.pulse > 120) {
      const explain = vitals.pulse < 50
        ? `Pulse ${vitals.pulse} bpm — Severe bradycardia (<50). ${context.medCount > 3 ? "Consider beta-blocker or CCB toxicity." : "Assess cardiac conduction."}`
        : `Pulse ${vitals.pulse} bpm — Severe tachycardia (>120). ${vitals.glucose && vitals.glucose < 70 ? "Correlates with hypoglycemia — treat glucose first." : "Assess for pain, fever, dehydration, anemia, cardiac arrhythmia."}`;
      alerts.push({ type: "vitals", param: "Pulse", severity: "critical", message: explain, source: "AHA", value: vitals.pulse, unit: "bpm" });
      explanations.push(explain);
    }
  }

  if (vitals.temperature) {
    const t = vitals.temperature;
    if (t > 103 || t < 96) {
      const explain = t > 103
        ? `Temperature ${t}°F — HIGH FEVER (>103°F per WHO). Assess for infection source. Consider blood cultures, antipyretics.`
        : `Temperature ${t}°F — HYPOTHERMIA (<96°F per WHO). Assess for sepsis, exposure, endocrine dysfunction.`;
      alerts.push({ type: "vitals", param: "Temperature", severity: "critical", message: explain, source: "WHO", value: t, unit: "°F" });
      explanations.push(explain);
    }
  }

  // ── Step 3: Risk Scores ──
  if (options.includeRiskScores !== false) {
    // NEWS2
    riskScores.news2 = calculateNEWS2(vitals);
    if (riskScores.news2.score >= 5) {
      alerts.push({ type: "risk-score", param: "NEWS2", severity: riskScores.news2.score >= 7 ? "critical" : "warning", message: riskScores.news2.explanation, source: riskScores.news2.source, value: riskScores.news2.score });
      actions.push(riskScores.news2.score >= 7 ? "EMERGENCY: Immediate clinical review" : "URGENT: Bedside review within 30 min");
    }

    // qSOFA
    riskScores.qsofa = calculateQSOFA(vitals);
    if (riskScores.qsofa.score >= 2) {
      alerts.push({ type: "risk-score", param: "qSOFA", severity: "critical", message: riskScores.qsofa.recommendation, source: "Singer M, et al. JAMA 2016", value: riskScores.qsofa.score });
      actions.push("SEPSIS PROTOCOL: Blood cultures + lactate + fluids");
    }

    // Cardiorenal (if patient has relevant conditions)
    if (context.conditionsList.some(c => c.includes("heart") || c.includes("kidney") || c.includes("ckd") || c.includes("hf"))) {
      riskScores.cardiorenal = screenCardiorenalSyndrome(vitals, patient, []);
      if (riskScores.cardiorenal.detected) {
        alerts.push({ type: "risk-score", param: "Cardiorenal", severity: "warning", message: riskScores.cardiorenal.recommendation, source: "Ronco C, et al. JACC 2008" });
      }
    }

    // Over-medication (elderly)
    if (context.isElderly) {
      riskScores.overmedication = screenOvermedication(vitals, patient);
      if (riskScores.overmedication.detected) {
        alerts.push({ type: "risk-score", param: "Over-medication", severity: riskScores.overmedication.indicators.some(i => i.beersClass) ? "critical" : "warning", message: riskScores.overmedication.recommendation, source: "AGS Beers Criteria 2023, Am Geriatr Soc" });
        actions.push("PHARMACY REVIEW: Comprehensive medication reconciliation");
      }
    }

    // Fall risk
    riskScores.fallRisk = calculateMorseFallScale(patient);
    if (riskScores.fallRisk.score >= 25) {
      alerts.push({ type: "risk-score", param: "Fall Risk", severity: riskScores.fallRisk.score >= 45 ? "critical" : "warning", message: riskScores.fallRisk.explanation, source: riskScores.fallRisk.source, value: riskScores.fallRisk.score });
    }

    // CHA2DS2-VASc (if AF)
    if (context.conditionsList.some(c => c.includes("atrial fibrillation") || c.includes("af") || c.includes("afib"))) {
      riskScores.cha2ds2vasc = calculateCHA2DS2VASc(patient);
      if (riskScores.cha2ds2vasc.score >= 2) {
        alerts.push({ type: "risk-score", param: "CHA₂DS₂-VASc", severity: "warning", message: riskScores.cha2ds2vasc.explanation, source: riskScores.cha2ds2vasc.source });
      }
    }
  }

  // ── Step 3b: Temporal Trend Analysis ──
  if (history.length >= 3) {
    const trendAlerts = analyzeTemporalTrends(vitals, history);
    alerts.push(...trendAlerts);
  }

  // ── Step 4: Cross-Vital Pattern Detection ──
  // Hypoglycemic tachycardia
  if (vitals.glucose && vitals.glucose < 70 && vitals.pulse && vitals.pulse > 100) {
    const explain = `Cross-vital: Hypoglycemia (${vitals.glucose} mg/dL) with tachycardia (${vitals.pulse} bpm) — adrenergic response to low glucose. Treat hypoglycemia first; tachycardia should resolve.`;
    alerts.push({ type: "cross-vital", severity: "critical", message: explain, source: "ADA 2024 + AHA" });
    explanations.push(explain);
  }

  // Fluid overload triad
  if (vitals.systolic && vitals.systolic > 150 && vitals.spo2 && vitals.spo2 < 94 && vitals.weight) {
    const explain = `Cross-vital: Elevated BP (${vitals.systolic}) + low SpO₂ (${vitals.spo2}%) + weight tracking — possible fluid overload. Check for pulmonary congestion, ankle edema. Consider diuretic adjustment.`;
    alerts.push({ type: "cross-vital", severity: "warning", message: explain, source: "KDIGO + AHA" });
  }

  // Sepsis triad (fever + tachycardia + hypotension)
  if (vitals.temperature && vitals.temperature > 101 && vitals.pulse && vitals.pulse > 100 && vitals.systolic && vitals.systolic < 100) {
    const explain = `Cross-vital SEPSIS TRIAD: Fever (${vitals.temperature}°F) + tachycardia (${vitals.pulse} bpm) + hypotension (${vitals.systolic} mmHg). Activate sepsis protocol immediately.`;
    alerts.push({ type: "cross-vital", severity: "critical", message: explain, source: "Surviving Sepsis Campaign 2021" });
    actions.push("SEPSIS BUNDLE: Blood cultures, lactate, IV fluids within 1 hour");
  }

  // ── Step 4b: Drug-Vitals Fusion ──
  const drugVitalFusions = fuseDrugVitalAlerts(alerts, patient.medications, vitals);
  alerts.push(...drugVitalFusions);

  // ── Step 4c: Causal Alert Suppression ──
  const processedAlerts = applyCausalSuppression(alerts);
  // Replace alerts array with processed version
  alerts.length = 0;
  alerts.push(...processedAlerts);

  // ── Step 5: Determine Overall Severity ──
  const hasCritical = alerts.some(a => a.severity === "critical");
  const hasWarning = alerts.some(a => a.severity === "warning");

  const overallSeverity = hasCritical ? "critical" : hasWarning ? "warning" : "normal";
  const overallAction = hasCritical ? "immediate-review" : hasWarning ? "monitor-closely" : "routine";
  const confidence = Math.min(1, 0.7 + (Object.keys(vitals).filter(k => vitals[k] != null).length * 0.05));

  // ── Audit Log ──
  const auditId = logEngineCall("clinicalPipeline", {
    patientAge: patient.age,
    conditions: patient.conditions,
    vitalsProvided: Object.keys(vitals).filter(k => vitals[k] != null),
    medCount: context.medCount,
  }, {
    overallRisk: overallSeverity,
    alertCount: alerts.length,
    riskScoresComputed: Object.keys(riskScores),
    durationMs: Date.now() - startTime,
  }, patient.assessedBy || "system");

  return {
    auditId,
    timestamp: new Date().toISOString(),
    patient: { name: patient.name, age: patient.age, id: patient.id },
    context,
    overallSeverity,
    overallAction,
    confidence,
    alerts: alerts.sort((a, b) => (a.severity === "critical" ? 0 : 1) - (b.severity === "critical" ? 0 : 1)),
    riskScores,
    explanations,
    actions: [...new Set(actions)],
    causalReasoning: processedAlerts.filter(a => a.type === "causal-reasoning").length,
    drugVitalFusions: drugVitalFusions.length,
    disclaimer: "This is a clinical decision support tool. All outputs are advisory and must be verified by a licensed medical practitioner. The treating physician retains full clinical responsibility.",
    engineVersion: "2.0.0",
    processingTimeMs: Date.now() - startTime,
  };
}

// ═══════════════════════════════════════════════════════
//  BRAIN LAYER 3: Dominant Theme Detection + Unified Narrative
// ═══════════════════════════════════════════════════════

const CLINICAL_THEMES = {
  sepsis: {
    detect: (r) => r.alerts.some(a => a.param === "qSOFA" && a.value >= 2) || r.alerts.some(a => a.message?.includes("sepsis") || a.message?.includes("SEPSIS")),
    title: "Sepsis / Systemic Infection",
    narrative: (r) => `PRIMARY CONCERN: Sepsis indicators detected. ${r.riskScores?.qsofa?.score >= 2 ? `qSOFA score ${r.riskScores.qsofa.score}/3 — high suspicion.` : ""} Activate sepsis bundle: blood cultures × 2, serum lactate, IV fluid bolus 30mL/kg within 1 hour. Empiric antibiotics within 1 hour of recognition. Monitor urine output hourly. Reassess volume status after bolus.`,
  },
  cardiac_crisis: {
    detect: (r) => r.alerts.some(a => a.param === "BP" && (a.value >= 180 || a.value < 80)),
    title: "Acute Cardiovascular Event",
    narrative: (r) => {
      const bpAlert = r.alerts.find(a => a.param === "BP");
      const isHypertensive = bpAlert?.value >= 180;
      return isHypertensive
        ? `PRIMARY CONCERN: Hypertensive crisis (systolic ${bpAlert.value} mmHg). Assess for target organ damage: headache, visual changes, chest pain, dyspnea. If symptomatic → hypertensive emergency (IV labetalol/nicardipine). If asymptomatic → hypertensive urgency (oral agents, reduce BP by 25% in first hour).`
        : `PRIMARY CONCERN: Severe hypotension (systolic ${bpAlert?.value} mmHg). Assess for shock: cold extremities, altered mentation, oliguria. Establish IV access. Fluid challenge 250-500mL crystalloid. If unresponsive to fluids → consider vasopressors. Determine etiology: cardiogenic, hypovolemic, distributive, obstructive.`;
    },
  },
  medication_toxicity: {
    detect: (r) => r.alerts.some(a => a.type === "drug-vital-fusion") || (r.riskScores?.overmedication?.detected && r.riskScores.overmedication.indicators.some(i => i.beersClass)),
    title: "Suspected Medication Toxicity / Adverse Effect",
    narrative: (r) => {
      const fusions = r.alerts.filter(a => a.type === "drug-vital-fusion");
      const beersFlags = r.riskScores?.overmedication?.indicators?.filter(i => i.beersClass) || [];
      let text = `PRIMARY CONCERN: Vital sign abnormalities correlate with current medications. `;
      if (fusions.length > 0) text += fusions.map(f => f.message).join(" ");
      if (beersFlags.length > 0) text += ` Additionally, ${beersFlags.length} potentially inappropriate medication(s) identified per AGS Beers Criteria 2023: ${beersFlags.map(b => b.sign).join(", ")}. `;
      text += `ACTION: Comprehensive medication review by pharmacist/physician. Consider deprescribing, dose reduction, or drug substitution. Reassess vitals after medication adjustment.`;
      return text;
    },
  },
  metabolic_crisis: {
    detect: (r) => r.alerts.some(a => a.param === "Glucose" && (a.value < 54 || a.value > 300)),
    title: "Acute Metabolic Emergency",
    narrative: (r) => {
      const gAlert = r.alerts.find(a => a.param === "Glucose");
      return gAlert.value < 54
        ? `PRIMARY CONCERN: Critical hypoglycemia (${gAlert.value} mg/dL). IMMEDIATE: 15-20g IV dextrose (D50) or oral glucose if conscious. Do NOT give insulin. Recheck glucose in 15 minutes. Identify cause: missed meal, insulin overdose, renal clearance of hypoglycemics. If on sulfonylurea → admit for observation (prolonged hypoglycemia risk). (ADA 2024)`
        : `PRIMARY CONCERN: Severe hyperglycemia (${gAlert.value} mg/dL) — DKA risk. Check blood/urine ketones, serum bicarbonate, pH. If ketones positive → DKA protocol: IV fluids + insulin drip + electrolyte replacement. Monitor potassium closely. If no ketones → HHS (hyperosmolar state): aggressive rehydration first. (ADA 2024)`;
    },
  },
  respiratory_failure: {
    detect: (r) => r.alerts.some(a => a.param === "SpO₂" && a.value < 88),
    title: "Acute Respiratory Compromise",
    narrative: (r) => {
      const spo2Alert = r.alerts.find(a => a.param === "SpO₂");
      return `PRIMARY CONCERN: Severe hypoxemia (SpO₂ ${spo2Alert.value}%). Apply supplemental oxygen immediately — target SpO₂ ≥94% (or 88-92% if COPD). Assess breathing pattern, use of accessory muscles, ability to speak in sentences. Auscultate lungs for crackles (pulmonary edema), wheeze (bronchospasm), absent sounds (pneumothorax). Consider ABG if not improving. CXR urgent. If respiratory distress → NIV or intubation readiness.`;
    },
  },
  deteriorating: {
    detect: (r) => r.riskScores?.news2?.score >= 5,
    title: "Clinical Deterioration (NEWS2 Elevated)",
    narrative: (r) => {
      const news2 = r.riskScores.news2;
      return `PRIMARY CONCERN: NEWS2 score ${news2.score}/20 (${news2.risk}) indicates clinical deterioration. ${news2.score >= 7 ? "EMERGENCY response required: immediate bedside review by senior clinician. Consider ICU transfer." : "URGENT bedside review within 30 minutes."} Key contributors: ${news2.breakdown.filter(b => b.points > 0).map(b => `${b.param} (${b.points} pts)`).join(", ")}. Individual vital alerts may be secondary to overall deterioration pattern — treat the patient, not individual numbers.`;
    },
  },
  fall_risk: {
    detect: (r) => r.riskScores?.fallRisk?.score >= 45,
    title: "High Fall Risk",
    narrative: (r) => {
      const fall = r.riskScores.fallRisk;
      return `SAFETY CONCERN: Morse Fall Scale ${fall.score} — HIGH fall risk. Immediate interventions: ${fall.interventions?.slice(0, 4).join("; ")}. ${r.context?.medCount >= 5 ? "Polypharmacy increases fall risk — review sedatives, antihypertensives, opioids." : ""} ${r.alerts.some(a => a.param === "Glucose" && a.value < 70) ? "CRITICAL: Hypoglycemia further elevates fall risk. Correct glucose urgently." : ""}`;
    },
  },
  stable: {
    detect: () => true, // fallback
    title: "Clinically Stable",
    narrative: (r) => `Patient assessment: ${r.alerts.length === 0 ? "All vitals within normal parameters. No clinical alerts." : `${r.alerts.length} minor alert(s) noted — see individual findings.`} Continue routine monitoring per care plan. ${r.riskScores?.news2 ? `NEWS2 score ${r.riskScores.news2.score}/20.` : ""}`,
  },
};

/**
 * Generate a unified clinical narrative from pipeline results.
 * Detects the dominant clinical theme and produces a single coherent assessment.
 */
export function generateClinicalSummary(result) {
  if (!result) return "";

  // Detect dominant theme (first match wins — ordered by clinical urgency)
  const themeOrder = ["sepsis", "cardiac_crisis", "respiratory_failure", "metabolic_crisis", "medication_toxicity", "deteriorating", "fall_risk", "stable"];
  let dominantTheme = null;
  for (const key of themeOrder) {
    if (CLINICAL_THEMES[key].detect(result)) {
      dominantTheme = CLINICAL_THEMES[key];
      break;
    }
  }

  const lines = [];
  lines.push(`═══ CLINICAL ASSESSMENT ═══`);
  lines.push(`Patient: ${result.patient?.name || "Unknown"}, Age ${result.patient?.age || "?"}, ${result.context?.gender || ""}`);
  lines.push(`Assessment Time: ${result.timestamp || new Date().toISOString()}`);
  lines.push(`Overall: ${result.overallSeverity?.toUpperCase()} (Confidence: ${Math.round((result.confidence || 0) * 100)}%)`);
  lines.push(``);

  // Dominant theme narrative
  if (dominantTheme) {
    lines.push(`▸ ${dominantTheme.title.toUpperCase()}`);
    lines.push(dominantTheme.narrative(result));
    lines.push(``);
  }

  // Causal reasoning (if any)
  const causal = result.alerts?.filter(a => a.type === "causal-reasoning") || [];
  if (causal.length > 0) {
    lines.push(`▸ CAUSAL ANALYSIS`);
    causal.forEach(c => lines.push(`  ${c.message}`));
    lines.push(``);
  }

  // Drug-vital fusions (if any)
  const fusions = result.alerts?.filter(a => a.type === "drug-vital-fusion") || [];
  if (fusions.length > 0) {
    lines.push(`▸ DRUG-VITAL CORRELATIONS`);
    fusions.forEach(f => lines.push(`  ${f.message}`));
    lines.push(``);
  }

  // Remaining alerts not covered by theme
  const remainingAlerts = result.alerts?.filter(a => a.type !== "causal-reasoning" && a.type !== "drug-vital-fusion" && a.type !== "cross-vital") || [];
  if (remainingAlerts.length > 0) {
    lines.push(`▸ INDIVIDUAL FINDINGS (${remainingAlerts.length})`);
    remainingAlerts.forEach((a, i) => {
      lines.push(`  ${i + 1}. [${(a.severity || "info").toUpperCase()}] ${a.message}`);
    });
    lines.push(``);
  }

  // Required actions
  if (result.actions?.length > 0) {
    lines.push(`▸ REQUIRED ACTIONS`);
    result.actions.forEach(a => lines.push(`  → ${a}`));
    lines.push(``);
  }

  // Risk scores summary
  const scores = result.riskScores || {};
  const scoreLines = [];
  if (scores.news2) scoreLines.push(`NEWS2: ${scores.news2.score}/20 (${scores.news2.risk})`);
  if (scores.qsofa) scoreLines.push(`qSOFA: ${scores.qsofa.score}/3${scores.qsofa.missing > 0 ? ` (${scores.qsofa.missing} criteria not assessed)` : ""}`);
  if (scores.fallRisk) scoreLines.push(`Morse Fall: ${scores.fallRisk.score} (${scores.fallRisk.risk})`);
  if (scores.cha2ds2vasc) scoreLines.push(`CHA₂DS₂-VASc: ${scores.cha2ds2vasc.score}/9`);
  if (scoreLines.length > 0) {
    lines.push(`▸ RISK SCORES`);
    scoreLines.forEach(s => lines.push(`  ${s}`));
    lines.push(``);
  }

  lines.push(`═══ END ASSESSMENT ═══`);
  lines.push(result.disclaimer || "");

  return lines.join("\n");
}
