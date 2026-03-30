/**
 * FDA + RxNorm API Integration Layer
 * ====================================
 * Enriches the local 5-pass drug interaction engine with real-world data
 * from OpenFDA and RxNorm APIs.
 *
 * Architecture: LOCAL-FIRST with API ENRICHMENT
 * - The local engine (checkInteractions) always runs first and works offline
 * - If network is available, OpenFDA and RxNorm APIs are queried for additional data
 * - External findings are merged with local findings (no duplicates)
 * - Results are cached (30-minute TTL) to reduce API calls
 * - Graceful fallback if APIs are unavailable
 *
 * OpenFDA API: https://api.fda.gov/drug/
 * - /drug/label.json  — drug labels, warnings, interactions
 * - /drug/event.json  — adverse event reports (FAERS)
 * - No API key required (rate limit: 240 requests/min without key)
 *
 * RxNorm API: https://rxnav.nlm.nih.gov/REST/
 * - /rxcui.json              — get RxCUI (standard drug ID) from name
 * - /interaction/list.json   — get interactions by RxCUI
 * - No API key required
 */

import { checkInteractions, normalizeDrugName } from "./drugInteractions.js";

// ── API Base URLs ──────────────────────────────────────────────────────────────

const OPENFDA_BASE = "https://api.fda.gov/drug";
const RXNORM_BASE = "https://rxnav.nlm.nih.gov/REST";

// ── Cache Configuration ────────────────────────────────────────────────────────

/** @type {Map<string, {data: any, timestamp: number}>} */
const cache = new Map();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

// ── Rate Limiting ──────────────────────────────────────────────────────────────

/** Simple sliding-window rate limiter for OpenFDA (240 req/min) */
const rateLimiter = {
  /** @type {number[]} */
  timestamps: [],
  maxRequests: 230, // stay safely under the 240/min limit
  windowMs: 60 * 1000,

  /**
   * Returns true if a request is allowed under the rate limit.
   * @returns {boolean}
   */
  canRequest() {
    const now = Date.now();
    this.timestamps = this.timestamps.filter((t) => now - t < this.windowMs);
    return this.timestamps.length < this.maxRequests;
  },

  /** Record that a request was made. */
  record() {
    this.timestamps.push(Date.now());
  },
};

// ── API Request Timeout ────────────────────────────────────────────────────────

const API_TIMEOUT_MS = 5000; // 5 seconds

// ── Helper: Fetch with Timeout ─────────────────────────────────────────────────

/**
 * Perform a fetch request with an enforced timeout.
 * @param {string} url - The URL to fetch
 * @param {number} [timeoutMs=API_TIMEOUT_MS] - Timeout in milliseconds
 * @returns {Promise<Response>}
 */
async function fetchWithTimeout(url, timeoutMs = API_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timer);
  }
}

// ── Helper: Cache Utilities ────────────────────────────────────────────────────

/**
 * Retrieve a value from the cache if it exists and has not expired.
 * @param {string} key
 * @returns {any|null} cached data, or null if missing / expired
 */
function getCached(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

/**
 * Store a value in the cache with the current timestamp.
 * @param {string} key
 * @param {any} data
 */
function setCache(key, data) {
  cache.set(key, { data, timestamp: Date.now() });
}

// ── Core API Functions ─────────────────────────────────────────────────────────

/**
 * Normalize a drug name via the RxNorm API to obtain the standard RxCUI
 * and canonical drug name.
 *
 * @param {string} drugName - Raw drug name (brand or generic)
 * @returns {Promise<{rxcui: string, name: string, found: boolean}>}
 *   - rxcui:  the RxNorm Concept Unique Identifier (empty string if not found)
 *   - name:   the standardized drug name returned by RxNorm
 *   - found:  whether the lookup was successful
 */
async function normalizeViaRxNorm(drugName) {
  const cacheKey = `rxnorm_normalize_${drugName.toLowerCase().trim()}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const encodedName = encodeURIComponent(drugName.trim());
    const url = `${RXNORM_BASE}/rxcui.json?name=${encodedName}&search=1`;
    const response = await fetchWithTimeout(url);

    if (!response.ok) {
      return { rxcui: "", name: drugName, found: false };
    }

    const data = await response.json();
    const rxnormId =
      data?.idGroup?.rxnormId?.[0] || "";
    const name = data?.idGroup?.name || drugName;

    const result = {
      rxcui: rxnormId,
      name: rxnormId ? name : drugName,
      found: !!rxnormId,
    };

    setCache(cacheKey, result);
    return result;
  } catch (_err) {
    return { rxcui: "", name: drugName, found: false };
  }
}

/**
 * Query the OpenFDA drug label API for interaction warnings and
 * contraindications associated with a given drug.
 *
 * @param {string} drugName - Generic drug name
 * @returns {Promise<{interactions: string[], warnings: string[], found: boolean}>}
 *   - interactions:  text excerpts from the drug_interactions field
 *   - warnings:      text excerpts from the warnings field
 *   - found:         whether the label lookup returned results
 */
async function getOpenFDAInteractions(drugName) {
  const cacheKey = `openfda_label_${drugName.toLowerCase().trim()}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  if (!rateLimiter.canRequest()) {
    return { interactions: [], warnings: [], found: false };
  }

  try {
    const encodedName = encodeURIComponent(drugName.trim().toLowerCase());
    const url = `${OPENFDA_BASE}/label.json?search=openfda.generic_name:"${encodedName}"&limit=1`;

    rateLimiter.record();
    const response = await fetchWithTimeout(url);

    if (!response.ok) {
      return { interactions: [], warnings: [], found: false };
    }

    const data = await response.json();
    const label = data?.results?.[0];

    if (!label) {
      const empty = { interactions: [], warnings: [], found: false };
      setCache(cacheKey, empty);
      return empty;
    }

    // drug_interactions, warnings, and contraindications are arrays of strings
    const interactions = Array.isArray(label.drug_interactions)
      ? label.drug_interactions
      : [];
    const warnings = [
      ...(Array.isArray(label.warnings) ? label.warnings : []),
      ...(Array.isArray(label.contraindications) ? label.contraindications : []),
    ];

    const result = {
      interactions,
      warnings,
      found: true,
    };

    setCache(cacheKey, result);
    return result;
  } catch (_err) {
    return { interactions: [], warnings: [], found: false };
  }
}

/**
 * NOTE: RxNorm Interaction API (/interaction/list.json) was RETIRED in 2024.
 * We now rely solely on OpenFDA label cross-referencing for API-based interactions.
 * The local 5-pass engine remains the primary interaction checker.
 *
 * Legacy function kept as a no-op for backward compatibility.
 */
async function getRxNormInteractions(_rxcui1, _rxcui2) {
  return { hasInteraction: false, severity: "N/A", description: "" };
}

/**
 * Query the OpenFDA FAERS (FDA Adverse Event Reporting System) for adverse
 * event reports related to a given drug.
 *
 * @param {string} drugName - Generic drug name
 * @param {number} [limit=5] - Max number of top reactions to return
 * @returns {Promise<{totalReports: number, topReactions: Array<{term: string, count: number}>, found: boolean}>}
 *   - totalReports:  total number of adverse event reports found
 *   - topReactions:  most commonly reported reactions with counts
 *   - found:         whether the query returned results
 */
async function getAdverseEvents(drugName, limit = 5) {
  const cacheKey = `openfda_faers_${drugName.toLowerCase().trim()}_${limit}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  if (!rateLimiter.canRequest()) {
    return { totalReports: 0, topReactions: [], found: false };
  }

  try {
    const encodedName = encodeURIComponent(drugName.trim().toLowerCase());
    const url =
      `${OPENFDA_BASE}/event.json` +
      `?search=patient.drug.openfda.generic_name:"${encodedName}"` +
      `&count=patient.reaction.reactionmeddrapt.exact` +
      `&limit=${limit}`;

    rateLimiter.record();
    const response = await fetchWithTimeout(url);

    if (!response.ok) {
      return { totalReports: 0, topReactions: [], found: false };
    }

    const data = await response.json();
    const results = data?.results || [];

    if (results.length === 0) {
      const empty = { totalReports: 0, topReactions: [], found: false };
      setCache(cacheKey, empty);
      return empty;
    }

    const topReactions = results.map((r) => ({
      term: r.term || "Unknown",
      count: r.count || 0,
    }));

    const totalReports = topReactions.reduce((sum, r) => sum + r.count, 0);

    const result = {
      totalReports,
      topReactions,
      found: true,
    };

    setCache(cacheKey, result);
    return result;
  } catch (_err) {
    return { totalReports: 0, topReactions: [], found: false };
  }
}

// ── Severity Mapping Helpers ───────────────────────────────────────────────────

/**
 * Map an RxNorm severity string to the local engine's severity levels.
 * @param {string} rxnormSeverity - e.g. "high", "moderate", "low", "N/A"
 * @returns {"major"|"moderate"|"minor"}
 */
function mapRxNormSeverity(rxnormSeverity) {
  const s = (rxnormSeverity || "").toLowerCase();
  if (s === "high" || s === "major") return "major";
  if (s === "low" || s === "minor") return "minor";
  return "moderate";
}

/**
 * Determine overall risk level from a list of interactions.
 * @param {Array<{severity: string}>} interactions
 * @returns {"safe"|"caution"|"high-risk"}
 */
function computeOverallRisk(interactions) {
  if (interactions.some((i) => i.severity === "major")) return "high-risk";
  if (interactions.length > 0) return "caution";
  return "safe";
}

// ── Main Integration Function ──────────────────────────────────────────────────

/**
 * Enhanced interaction check — runs the local 5-pass engine first, then
 * enriches results with FDA and RxNorm API data when available.
 *
 * Flow:
 *  1. Run local checkInteractions() (5-pass engine, always works offline)
 *  2. For each drug, attempt to obtain an RxCUI from RxNorm
 *  3. For each drug pair, check the RxNorm interaction API
 *  4. For each drug, pull OpenFDA label warnings
 *  5. Merge any NEW interactions found by the APIs (not already in local results)
 *  6. Add source tags: "local" | "fda" | "rxnorm" on each interaction
 *  7. Return the combined result
 *
 * @param {Array<{name: string, dose?: string, frequency?: string}>} medications
 *   Array of medications to check
 * @param {Object} [patientData={}]
 *   Patient context for the local engine
 * @param {number} [patientData.age] - Patient age
 * @param {string[]} [patientData.conditions] - Active medical conditions
 * @param {string[]} [patientData.allergies] - Known allergies
 * @param {Array<{name: string}>} [patientData.currentMeds] - Current medications
 * @returns {Promise<Object>} Extended result matching checkInteractions() shape:
 *   - interactions:      Array of interaction objects, each with a `source` field
 *   - allergyAlerts:     From local engine
 *   - conditionWarnings: From local engine (+ any FDA-sourced warnings)
 *   - duplicateTherapy:  From local engine
 *   - overallRisk:       "safe" | "caution" | "high-risk"
 *   - summary:           Human-readable summary
 *   - fdaVerified:       Whether FDA API confirmed any local findings
 *   - apiStatus:         "online" | "offline" | "partial"
 *   - adverseEvents:     Map of drug name → { totalReports, topReactions }
 */
async function enhancedInteractionCheck(medications, patientData = {}) {
  // ── Step 1: Always run the local engine first ──────────────────────────────
  const localResult = checkInteractions(medications, patientData);

  // Tag every local interaction with source = "local"
  const taggedInteractions = localResult.interactions.map((interaction) => ({
    ...interaction,
    source: "local",
  }));

  // Tag local condition warnings
  const taggedConditionWarnings = localResult.conditionWarnings.map((w) => ({
    ...w,
    source: "local",
  }));

  // Prepare the enriched result (start with local data)
  const result = {
    ...localResult,
    interactions: taggedInteractions,
    conditionWarnings: taggedConditionWarnings,
    fdaVerified: false,
    apiStatus: "offline",
    adverseEvents: {},
  };

  // ── Step 2: Attempt API enrichment ─────────────────────────────────────────
  // Collect all unique drug names (normalized via local engine)
  const drugNames = medications.map((m) => normalizeDrugName(m.name));
  const uniqueDrugs = [...new Set(drugNames)];

  // Track API availability
  let apiSuccessCount = 0;
  let apiAttemptCount = 0;

  // ── Step 2a: Resolve RxCUIs for all drugs in parallel ──────────────────────
  /** @type {Map<string, string>} drugName → rxcui */
  const rxcuiMap = new Map();

  try {
    apiAttemptCount++;
    const rxnormPromises = uniqueDrugs.map(async (drug) => {
      const result = await normalizeViaRxNorm(drug);
      if (result.found) {
        rxcuiMap.set(drug, result.rxcui);
      }
      return result;
    });

    const rxnormResults = await Promise.allSettled(rxnormPromises);
    const anyRxNormSuccess = rxnormResults.some(
      (r) => r.status === "fulfilled" && r.value.found
    );
    if (anyRxNormSuccess) apiSuccessCount++;
  } catch (_err) {
    // RxNorm lookup failed entirely — continue with local data
  }

  // ── Step 2b: Check RxNorm interactions for each drug pair ──────────────────
  const rxnormInteractions = [];

  try {
    const pairs = [];
    for (let i = 0; i < uniqueDrugs.length; i++) {
      for (let j = i + 1; j < uniqueDrugs.length; j++) {
        const rxcui1 = rxcuiMap.get(uniqueDrugs[i]);
        const rxcui2 = rxcuiMap.get(uniqueDrugs[j]);
        if (rxcui1 && rxcui2) {
          pairs.push({
            drug1: uniqueDrugs[i],
            drug2: uniqueDrugs[j],
            rxcui1,
            rxcui2,
          });
        }
      }
    }

    if (pairs.length > 0) {
      apiAttemptCount++;
      const pairPromises = pairs.map(async (pair) => {
        const rxResult = await getRxNormInteractions(pair.rxcui1, pair.rxcui2);
        return { ...pair, ...rxResult };
      });

      const pairResults = await Promise.allSettled(pairPromises);

      for (const settled of pairResults) {
        if (settled.status !== "fulfilled") continue;
        const pr = settled.value;
        if (!pr.hasInteraction) continue;

        // Check if this pair is already covered by a local interaction
        const alreadyFound = result.interactions.some((existing) => {
          const drugs = [
            (existing.drug1 || "").toLowerCase(),
            (existing.drug2 || "").toLowerCase(),
          ];
          return (
            drugs.includes(pr.drug1.toLowerCase()) &&
            drugs.includes(pr.drug2.toLowerCase())
          );
        });

        if (alreadyFound) {
          // FDA/RxNorm confirms local finding
          result.fdaVerified = true;
        } else {
          // New interaction discovered via RxNorm
          rxnormInteractions.push({
            drug1: pr.drug1,
            drug2: pr.drug2,
            severity: mapRxNormSeverity(pr.severity),
            description: pr.description,
            source: "rxnorm",
          });
        }
      }

      const anyPairSuccess = pairResults.some(
        (r) => r.status === "fulfilled"
      );
      if (anyPairSuccess) apiSuccessCount++;
    }
  } catch (_err) {
    // RxNorm interaction check failed — continue with local data
  }

  // ── Step 2c: Pull OpenFDA label warnings for each drug ─────────────────────
  const fdaInteractions = [];

  try {
    apiAttemptCount++;
    const fdaPromises = uniqueDrugs.map(async (drug) => {
      const fdaResult = await getOpenFDAInteractions(drug);
      return { drug, ...fdaResult };
    });

    const fdaResults = await Promise.allSettled(fdaPromises);

    for (const settled of fdaResults) {
      if (settled.status !== "fulfilled" || !settled.value.found) continue;

      const { drug, interactions: fdaTexts, warnings } = settled.value;

      // Check if any FDA interaction text mentions another drug in the list
      for (const otherDrug of uniqueDrugs) {
        if (otherDrug === drug) continue;

        const otherLower = otherDrug.toLowerCase();
        const matchesInteraction = fdaTexts.some((text) =>
          text.toLowerCase().includes(otherLower)
        );

        if (matchesInteraction) {
          // Check if this pair is already in local or RxNorm results
          const allCurrent = [...result.interactions, ...rxnormInteractions];
          const alreadyFound = allCurrent.some((existing) => {
            const drugs = [
              (existing.drug1 || "").toLowerCase(),
              (existing.drug2 || "").toLowerCase(),
            ];
            return (
              drugs.includes(drug.toLowerCase()) &&
              drugs.includes(otherLower)
            );
          });

          if (alreadyFound) {
            result.fdaVerified = true;
          } else {
            fdaInteractions.push({
              drug1: drug,
              drug2: otherDrug,
              severity: "moderate", // FDA labels don't always specify severity
              description: `FDA label for ${drug} mentions interaction with ${otherDrug}.`,
              source: "fda",
            });
          }
        }
      }

      // Add any relevant FDA warnings as condition warnings
      if (warnings.length > 0) {
        result.conditionWarnings.push({
          drug,
          warning: warnings[0].substring(0, 300) + (warnings[0].length > 300 ? "…" : ""),
          source: "fda",
        });
      }
    }

    const anyFdaSuccess = fdaResults.some(
      (r) => r.status === "fulfilled" && r.value.found
    );
    if (anyFdaSuccess) apiSuccessCount++;
  } catch (_err) {
    // FDA label check failed — continue with local data
  }

  // ── Step 2d: Fetch adverse event data for each drug ────────────────────────
  try {
    apiAttemptCount++;
    const aePromises = uniqueDrugs.map(async (drug) => {
      const aeResult = await getAdverseEvents(drug, 5);
      return { drug, ...aeResult };
    });

    const aeResults = await Promise.allSettled(aePromises);

    for (const settled of aeResults) {
      if (settled.status !== "fulfilled" || !settled.value.found) continue;
      const { drug, totalReports, topReactions } = settled.value;
      result.adverseEvents[drug] = { totalReports, topReactions };
    }

    const anyAeSuccess = aeResults.some(
      (r) => r.status === "fulfilled" && r.value.found
    );
    if (anyAeSuccess) apiSuccessCount++;
  } catch (_err) {
    // Adverse events fetch failed — continue without
  }

  // ── Step 3: Merge API findings into the result ─────────────────────────────
  result.interactions = [
    ...result.interactions,
    ...rxnormInteractions,
    ...fdaInteractions,
  ];

  // Recompute overall risk considering new interactions
  result.overallRisk = computeOverallRisk(result.interactions);

  // Determine API status
  if (apiAttemptCount === 0) {
    result.apiStatus = "offline";
  } else if (apiSuccessCount === 0) {
    result.apiStatus = "offline";
  } else if (apiSuccessCount < apiAttemptCount) {
    result.apiStatus = "partial";
  } else {
    result.apiStatus = "online";
  }

  // Update summary
  const apiInteractionCount = rxnormInteractions.length + fdaInteractions.length;
  const localCount = taggedInteractions.length;
  const totalCount = result.interactions.length;

  let summaryParts = [
    `Checked ${medications.length} medication(s).`,
    `Local engine found ${localCount} interaction(s).`,
  ];

  if (apiInteractionCount > 0) {
    summaryParts.push(
      `API enrichment found ${apiInteractionCount} additional interaction(s).`
    );
  }

  summaryParts.push(`Total: ${totalCount}. Overall risk: ${result.overallRisk.toUpperCase()}.`);

  if (result.fdaVerified) {
    summaryParts.push("FDA/RxNorm data confirmed local findings.");
  }

  summaryParts.push(`API status: ${result.apiStatus}.`);

  result.summary = summaryParts.join(" ");

  return result;
}

// ── Cache Management ───────────────────────────────────────────────────────────

/**
 * Clear all cached API results. Useful when the user wants fresh data.
 */
function clearCache() {
  cache.clear();
}

/**
 * Get cache statistics for debugging.
 * @returns {{ size: number, keys: string[] }}
 */
function getCacheStats() {
  return {
    size: cache.size,
    keys: [...cache.keys()],
  };
}

// ── Exports ────────────────────────────────────────────────────────────────────

export {
  normalizeViaRxNorm,
  getOpenFDAInteractions,
  getRxNormInteractions,
  getAdverseEvents,
  enhancedInteractionCheck,
  clearCache,
  getCacheStats,
};
