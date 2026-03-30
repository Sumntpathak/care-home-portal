/**
 * CLINICAL AUDIT TRAIL
 * =====================
 * Logs every engine invocation with input, output, and metadata.
 * Stored in localStorage (session-persistent, survives page reloads).
 *
 * Purpose:
 *  1. Legal defense   — prove what the system recommended and when
 *  2. Quality tracking — detect false positives / negatives over time
 *  3. Compliance      — IT Act 2000, MCI (Medical Council of India) guidelines
 *
 * Each audit entry captures:
 *  - A unique audit ID
 *  - Timestamp (ISO 8601)
 *  - Engine name
 *  - Sanitized input (drug names, conditions, vitals — no patient PII)
 *  - Summarized output (risk level, interaction count, key findings)
 *  - API status at the time of the call
 *  - User who triggered the action
 *  - Optional feedback from a doctor (valid / override / false-positive)
 */

// ── Constants ──────────────────────────────────────────────────────────────────

/** localStorage key for the audit trail */
const AUDIT_KEY = "shanti_audit_trail";

/** Maximum number of entries to retain (oldest are pruned first) */
const MAX_ENTRIES = 500;

/** Schema version for forward-compatible data migration */
const DATA_VERSION = "1.0.0";

/** Valid engine names */
const VALID_ENGINES = [
  "drugInteractions",
  "dietEngine",
  "vitalsAnalyzer",
  "handoverEngine",
];

// ── Internal Helpers ───────────────────────────────────────────────────────────

/**
 * Load the audit trail from localStorage.
 * @returns {Array<Object>} Array of audit entry objects
 */
function loadTrail() {
  try {
    const raw = localStorage.getItem(AUDIT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_err) {
    return [];
  }
}

/**
 * Persist the audit trail to localStorage, pruning to MAX_ENTRIES.
 * @param {Array<Object>} trail
 */
function saveTrail(trail) {
  try {
    // Keep only the most recent MAX_ENTRIES entries
    const trimmed = trail.slice(-MAX_ENTRIES);
    localStorage.setItem(AUDIT_KEY, JSON.stringify(trimmed));
  } catch (_err) {
    // localStorage may be full or unavailable — fail silently
    console.warn("Audit trail: unable to persist to localStorage.");
  }
}

/**
 * Generate a unique audit ID.
 * Format: AUD-{timestamp}-{random 6-char hex}
 * @returns {string}
 */
function generateAuditId() {
  const ts = Date.now();
  const rand = Math.random().toString(16).substring(2, 8);
  return `AUD-${ts}-${rand}`;
}

/**
 * Sanitize engine input to remove any potential patient PII.
 * Keeps drug names, conditions, vitals, ages — strips names, IDs, addresses.
 * @param {Object} input
 * @returns {Object} sanitized copy
 */
function sanitizeInput(input) {
  if (!input || typeof input !== "object") return {};

  const sanitized = { ...input };

  // Remove fields that could contain PII
  const piiFields = [
    "patientName",
    "name",
    "patientId",
    "id",
    "address",
    "phone",
    "email",
    "aadhar",
    "aadhaar",
    "contactNumber",
    "emergencyContact",
    "nextOfKin",
    "guardianName",
    "admissionId",
  ];

  for (const field of piiFields) {
    delete sanitized[field];
  }

  // If there is nested patientData, sanitize that too
  if (sanitized.patientData && typeof sanitized.patientData === "object") {
    sanitized.patientData = sanitizeInput(sanitized.patientData);
  }

  return sanitized;
}

/**
 * Summarize engine output into a compact form for the audit record.
 * @param {string} engineName
 * @param {Object} output
 * @returns {Object} summarized output
 */
function summarizeOutput(engineName, output) {
  if (!output || typeof output !== "object") return {};

  switch (engineName) {
    case "drugInteractions":
      return {
        interactionCount: Array.isArray(output.interactions)
          ? output.interactions.length
          : 0,
        allergyAlertCount: Array.isArray(output.allergyAlerts)
          ? output.allergyAlerts.length
          : 0,
        conditionWarningCount: Array.isArray(output.conditionWarnings)
          ? output.conditionWarnings.length
          : 0,
        duplicateTherapyCount: Array.isArray(output.duplicateTherapy)
          ? output.duplicateTherapy.length
          : 0,
        overallRisk: output.overallRisk || "unknown",
        apiStatus: output.apiStatus || "N/A",
        fdaVerified: output.fdaVerified || false,
        keyFindings: Array.isArray(output.interactions)
          ? output.interactions.slice(0, 3).map((i) => ({
              drug1: i.drug1,
              drug2: i.drug2,
              severity: i.severity,
              source: i.source || "local",
            }))
          : [],
      };

    case "vitalsAnalyzer":
      return {
        overallStatus: output.overallStatus || output.status || "unknown",
        alertCount: Array.isArray(output.alerts) ? output.alerts.length : 0,
        criticalCount: Array.isArray(output.alerts)
          ? output.alerts.filter(
              (a) => a.severity === "critical" || a.level === "critical"
            ).length
          : 0,
      };

    case "dietEngine":
      return {
        recommendationCount: Array.isArray(output.recommendations)
          ? output.recommendations.length
          : 0,
        restrictionCount: Array.isArray(output.restrictions)
          ? output.restrictions.length
          : 0,
      };

    case "handoverEngine":
      return {
        patientCount: output.patientCount || 0,
        criticalItems: output.criticalItems || 0,
        shiftType: output.shiftType || "unknown",
      };

    default:
      return {
        resultKeys: Object.keys(output).slice(0, 10),
      };
  }
}

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Log an engine call to the audit trail.
 *
 * @param {string} engineName - One of: "drugInteractions" | "dietEngine" | "vitalsAnalyzer" | "handoverEngine"
 * @param {Object} input      - What was sent to the engine (will be sanitized — no patient PII stored)
 * @param {Object} output     - What the engine returned (will be summarized)
 * @param {string} [user="system"] - Who triggered the call (e.g. doctor name, nurse ID)
 * @returns {string} The generated audit ID for this entry
 *
 * @example
 * const auditId = logEngineCall(
 *   "drugInteractions",
 *   { medications: [{name: "metformin"}], patientData: {age: 72} },
 *   interactionResult,
 *   "Dr. Sharma"
 * );
 */
function logEngineCall(engineName, input, output, user = "system") {
  const auditId = generateAuditId();

  const entry = {
    id: auditId,
    timestamp: new Date().toISOString(),
    engineName,
    dataVersion: DATA_VERSION,
    input: sanitizeInput(input),
    output: summarizeOutput(engineName, output),
    apiStatus: output?.apiStatus || "N/A",
    user: user || "system",
    feedback: null,
  };

  const trail = loadTrail();
  trail.push(entry);
  saveTrail(trail);

  return auditId;
}

/**
 * Retrieve audit trail entries, optionally filtered.
 *
 * @param {Object} [filters={}] - Filter criteria (all optional, combined with AND)
 * @param {string} [filters.engineName]  - Filter by engine name
 * @param {string} [filters.dateFrom]    - ISO date string — include entries on or after this date
 * @param {string} [filters.dateTo]      - ISO date string — include entries on or before this date
 * @param {string} [filters.riskLevel]   - Filter by overallRisk in the output (e.g. "high-risk")
 * @param {string} [filters.user]        - Filter by user who triggered the call
 * @param {string} [filters.feedbackAction] - Filter by feedback action (e.g. "false-positive")
 * @returns {Array<Object>} Matching audit entries, most recent first
 *
 * @example
 * const highRiskToday = getAuditTrail({
 *   riskLevel: "high-risk",
 *   dateFrom: "2026-03-22T00:00:00Z",
 * });
 */
function getAuditTrail(filters = {}) {
  let trail = loadTrail();

  if (filters.engineName) {
    trail = trail.filter((e) => e.engineName === filters.engineName);
  }

  if (filters.dateFrom) {
    const from = new Date(filters.dateFrom).getTime();
    trail = trail.filter((e) => new Date(e.timestamp).getTime() >= from);
  }

  if (filters.dateTo) {
    const to = new Date(filters.dateTo).getTime();
    trail = trail.filter((e) => new Date(e.timestamp).getTime() <= to);
  }

  if (filters.riskLevel) {
    trail = trail.filter(
      (e) => e.output?.overallRisk === filters.riskLevel
    );
  }

  if (filters.user) {
    trail = trail.filter((e) => e.user === filters.user);
  }

  if (filters.feedbackAction) {
    trail = trail.filter(
      (e) => e.feedback?.action === filters.feedbackAction
    );
  }

  // Return most recent first
  return trail.reverse();
}

/**
 * Get aggregate statistics from the audit trail.
 *
 * @returns {Object} Statistics summary:
 *   - totalCalls:       total number of engine calls logged
 *   - byEngine:         { engineName: count } breakdown
 *   - byRisk:           { riskLevel: count } breakdown (for engines that report risk)
 *   - falsePositiveRate: percentage of feedback-marked entries that were false positives
 *   - overrideRate:      percentage of feedback-marked entries that were overridden
 *   - feedbackCount:     total entries that have doctor feedback
 *   - apiOnlineRate:     percentage of calls where API was online
 *
 * @example
 * const stats = getAuditStats();
 * console.log(`False positive rate: ${stats.falsePositiveRate}%`);
 */
function getAuditStats() {
  const trail = loadTrail();
  const totalCalls = trail.length;

  // Breakdown by engine
  const byEngine = {};
  for (const entry of trail) {
    byEngine[entry.engineName] = (byEngine[entry.engineName] || 0) + 1;
  }

  // Breakdown by risk level
  const byRisk = {};
  for (const entry of trail) {
    const risk = entry.output?.overallRisk;
    if (risk) {
      byRisk[risk] = (byRisk[risk] || 0) + 1;
    }
  }

  // Feedback analysis
  const withFeedback = trail.filter((e) => e.feedback !== null);
  const feedbackCount = withFeedback.length;
  const falsePositives = withFeedback.filter(
    (e) => e.feedback?.action === "false-positive"
  ).length;
  const overrides = withFeedback.filter(
    (e) => e.feedback?.action === "override"
  ).length;

  const falsePositiveRate =
    feedbackCount > 0
      ? Math.round((falsePositives / feedbackCount) * 100 * 100) / 100
      : 0;

  const overrideRate =
    feedbackCount > 0
      ? Math.round((overrides / feedbackCount) * 100 * 100) / 100
      : 0;

  // API online rate
  const apiEntries = trail.filter((e) => e.apiStatus && e.apiStatus !== "N/A");
  const apiOnline = apiEntries.filter((e) => e.apiStatus === "online").length;
  const apiOnlineRate =
    apiEntries.length > 0
      ? Math.round((apiOnline / apiEntries.length) * 100 * 100) / 100
      : 0;

  return {
    totalCalls,
    byEngine,
    byRisk,
    falsePositiveRate,
    overrideRate,
    feedbackCount,
    apiOnlineRate,
  };
}

/**
 * Export the full audit trail as a JSON string for compliance reporting
 * and external archiving.
 *
 * @param {"json"|"csv"} [format="json"] - Export format
 * @returns {string} The audit trail serialized as JSON or CSV
 *
 * @example
 * const jsonExport = exportAuditTrail("json");
 * // Download or send to compliance server
 */
function exportAuditTrail(format = "json") {
  const trail = loadTrail();

  if (format === "csv") {
    // CSV header
    const headers = [
      "id",
      "timestamp",
      "engineName",
      "dataVersion",
      "overallRisk",
      "interactionCount",
      "apiStatus",
      "user",
      "feedbackAction",
      "feedbackReason",
      "feedbackBy",
      "feedbackAt",
    ];

    const rows = trail.map((entry) => {
      const escapeCsv = (val) => {
        const str = String(val ?? "");
        if (str.includes(",") || str.includes('"') || str.includes("\n")) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      return [
        escapeCsv(entry.id),
        escapeCsv(entry.timestamp),
        escapeCsv(entry.engineName),
        escapeCsv(entry.dataVersion),
        escapeCsv(entry.output?.overallRisk),
        escapeCsv(entry.output?.interactionCount),
        escapeCsv(entry.apiStatus),
        escapeCsv(entry.user),
        escapeCsv(entry.feedback?.action),
        escapeCsv(entry.feedback?.reason),
        escapeCsv(entry.feedback?.by),
        escapeCsv(entry.feedback?.at),
      ].join(",");
    });

    return [headers.join(","), ...rows].join("\n");
  }

  // Default: JSON
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      dataVersion: DATA_VERSION,
      entryCount: trail.length,
      entries: trail,
    },
    null,
    2
  );
}

/**
 * Record doctor feedback on a specific audit entry.
 *
 * A doctor can mark an alert as:
 *  - "valid"          — the alert was clinically relevant and acted upon
 *  - "override"       — the alert was seen but the doctor chose to proceed
 *  - "false-positive" — the alert was not clinically relevant
 *
 * This data is essential for calculating false-positive rates and improving
 * the engine over time.
 *
 * @param {string} auditId   - The audit entry ID (e.g. "AUD-1711100000000-a1b2c3")
 * @param {Object} feedback  - Feedback details
 * @param {string} feedback.action - "valid" | "override" | "false-positive"
 * @param {string} [feedback.reason] - Free-text reason for the decision
 * @param {string} [feedback.by]     - Name or ID of the doctor providing feedback
 * @returns {boolean} true if the entry was found and updated, false otherwise
 *
 * @example
 * markFeedback("AUD-1711100000000-a1b2c3", {
 *   action: "override",
 *   reason: "Patient has been stable on this combination for 2 years",
 *   by: "Dr. Sharma",
 * });
 */
function markFeedback(auditId, feedback) {
  if (!auditId || !feedback || !feedback.action) {
    return false;
  }

  const validActions = ["valid", "override", "false-positive"];
  if (!validActions.includes(feedback.action)) {
    return false;
  }

  const trail = loadTrail();
  const entry = trail.find((e) => e.id === auditId);

  if (!entry) {
    return false;
  }

  entry.feedback = {
    action: feedback.action,
    reason: feedback.reason || "",
    by: feedback.by || "unknown",
    at: new Date().toISOString(),
  };

  saveTrail(trail);
  return true;
}

/**
 * Clear the entire audit trail from localStorage.
 * Use with caution — primarily for testing or when data must be purged.
 *
 * @returns {number} The number of entries that were removed
 */
function clearAuditTrail() {
  const trail = loadTrail();
  const count = trail.length;
  try {
    localStorage.removeItem(AUDIT_KEY);
  } catch (_err) {
    // Fail silently
  }
  return count;
}

// ── Exports ────────────────────────────────────────────────────────────────────

export {
  logEngineCall,
  getAuditTrail,
  getAuditStats,
  exportAuditTrail,
  markFeedback,
  clearAuditTrail,
  AUDIT_KEY,
  MAX_ENTRIES,
  DATA_VERSION,
};
