/**
 * ABDM (Ayushman Bharat Digital Mission) Integration
 *
 * Implements:
 * - ABHA ID generation/linking
 * - Health Information Exchange
 * - Consent management
 *
 * Uses ABDM Sandbox APIs for development.
 * Production requires ABDM registration and credentials.
 */

const ABDM_SANDBOX_URL = "https://dev.abdm.gov.in/gateway";
const ABDM_AUTH_URL = "https://dev.abdm.gov.in/gateway/v0.5/sessions";

let accessToken = null;
let tokenExpiry = 0;

// ── Configuration ──
const CLIENT_ID = import.meta.env.VITE_ABDM_CLIENT_ID || "";
const CLIENT_SECRET = import.meta.env.VITE_ABDM_CLIENT_SECRET || "";

/**
 * Get ABDM access token (sandbox)
 */
async function getToken() {
  if (accessToken && Date.now() < tokenExpiry) return accessToken;

  if (!CLIENT_ID || !CLIENT_SECRET) {
    console.warn("[ABDM] No credentials configured. Set VITE_ABDM_CLIENT_ID and VITE_ABDM_CLIENT_SECRET.");
    return null;
  }

  try {
    const res = await fetch(ABDM_AUTH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId: CLIENT_ID, clientSecret: CLIENT_SECRET }),
    });
    if (!res.ok) throw new Error("Auth failed");
    const data = await res.json();
    accessToken = data.accessToken;
    tokenExpiry = Date.now() + (data.expiresIn || 1800) * 1000;
    return accessToken;
  } catch (err) {
    console.error("[ABDM] Token fetch failed:", err.message);
    return null;
  }
}

async function abdmFetch(path, options = {}, retries = 3) {
  const token = await getToken();
  if (!token) return { error: "ABDM not configured. Set credentials in .env" };

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const res = await fetch(`${ABDM_SANDBOX_URL}${path}`, {
        ...options,
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          ...options.headers,
        },
      });
      clearTimeout(timeout);

      const data = await res.json();

      // Audit log every ABDM call
      logAbdmCall(path, options.method || "GET", res.status, data);

      return data;
    } catch (err) {
      if (attempt === retries) {
        logAbdmCall(path, options.method || "GET", 0, { error: err.message });
        return { error: `ABDM request failed after ${retries} attempts: ${err.message}` };
      }
      // Exponential backoff
      await new Promise(r => setTimeout(r, 1000 * attempt));
    }
  }
}

// ABDM-specific audit trail
function logAbdmCall(path, method, status, response) {
  try {
    const trail = JSON.parse(localStorage.getItem("abdm_audit_trail") || "[]");
    trail.push({
      id: `ABDM-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      path,
      method,
      status,
      success: status >= 200 && status < 300,
    });
    // Keep last 200 entries
    if (trail.length > 200) trail.splice(0, trail.length - 200);
    localStorage.setItem("abdm_audit_trail", JSON.stringify(trail));
  } catch {}
}

/**
 * Get ABDM audit trail for compliance reporting
 */
export function getAbdmAuditTrail() {
  try { return JSON.parse(localStorage.getItem("abdm_audit_trail") || "[]"); } catch { return []; }
}

// ── ABHA ID Operations ──

/**
 * Generate ABHA number using Aadhaar OTP
 */
export async function generateAbhaViaAadhaar(aadhaarNumber) {
  return abdmFetch("/v1/registration/aadhaar/generateOtp", {
    method: "POST",
    body: JSON.stringify({ aadhaar: aadhaarNumber }),
  });
}

/**
 * Verify Aadhaar OTP for ABHA creation
 */
export async function verifyAadhaarOtp(txnId, otp) {
  return abdmFetch("/v1/registration/aadhaar/verifyOtp", {
    method: "POST",
    body: JSON.stringify({ txnId, otp }),
  });
}

/**
 * Create ABHA address (PHR address)
 */
export async function createAbhaAddress(txnId, phrAddress) {
  return abdmFetch("/v1/registration/aadhaar/createPhrAddress", {
    method: "POST",
    body: JSON.stringify({ txnId, phrAddress }),
  });
}

/**
 * Search for existing ABHA by health ID
 */
export async function searchAbha(healthId) {
  return abdmFetch(`/v1/search/searchByHealthId`, {
    method: "POST",
    body: JSON.stringify({ healthId }),
  });
}

/**
 * Link ABHA to a care context (e.g., OPD visit, lab report)
 */
export async function linkCareContext(abhaAddress, careContexts) {
  return abdmFetch("/v0.5/links/link/add-contexts", {
    method: "POST",
    body: JSON.stringify({
      link: {
        accessToken: abhaAddress,
        patient: {
          referenceNumber: careContexts.patientId,
          display: careContexts.patientName,
          careContexts: careContexts.records.map(r => ({
            referenceNumber: r.id,
            display: r.display,
          })),
        },
      },
    }),
  });
}

// ── Health Information Exchange ──

/**
 * Request health information from another provider
 */
export async function requestHealthInfo(abhaAddress, dateRange) {
  return abdmFetch("/v0.5/health-information/cm/request", {
    method: "POST",
    body: JSON.stringify({
      healthInfoRequest: {
        consent: { id: "consent-id-placeholder" },
        dateRange: {
          from: dateRange.from,
          to: dateRange.to,
        },
        dataPushUrl: `${window.location.origin}/api/abdm/data-push`,
        keyMaterial: {
          cryptoAlg: "ECDH",
          curve: "Curve25519",
        },
      },
    }),
  });
}

// ── Consent Management ──

/**
 * Create a consent request for accessing patient records
 */
export async function createConsentRequest(patientAbha, purpose, hiTypes, dateRange) {
  return abdmFetch("/v0.5/consent-requests/init", {
    method: "POST",
    body: JSON.stringify({
      consent: {
        purpose: { text: purpose, code: "CAREMGT" },
        patient: { id: patientAbha },
        hiu: { id: "shanti-care-hiu" },
        requester: {
          name: "Shanti Care Home",
          identifier: { type: "REGNO", value: import.meta.env.VITE_HFR_ID || "PENDING-HFR-REGISTRATION" },
        },
        hiTypes: hiTypes || ["OPConsultation", "Prescription", "DiagnosticReport"],
        permission: {
          accessMode: "VIEW",
          dateRange: {
            from: dateRange?.from || new Date(Date.now() - 365 * 86400000).toISOString(),
            to: dateRange?.to || new Date().toISOString(),
          },
          frequency: { unit: "HOUR", value: 1, repeats: 0 },
        },
      },
    }),
  });
}

// ── Utility ──

/**
 * Check if ABDM integration is configured
 */
export function isAbdmConfigured() {
  return !!(CLIENT_ID && CLIENT_SECRET);
}

/**
 * Get ABDM configuration status
 */
export function getAbdmStatus() {
  return {
    configured: isAbdmConfigured(),
    environment: CLIENT_ID ? "sandbox" : "not configured",
    sandboxUrl: ABDM_SANDBOX_URL,
  };
}
