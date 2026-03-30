// ═══════════════════════════════════════════════════════
//  SECURITY LAYER
//  Encryption, sanitization, session management,
//  rate limiting, input validation
// ═══════════════════════════════════════════════════════

// ── Session-scoped encryption for localStorage ──
// Uses a per-session random key with XOR stream cipher + random IV
// Data is only readable within the same browser session
// For persistent auth, production should use httpOnly cookies instead

const SESSION_KEY = (() => {
  // Generate a 256-bit random key per session
  const key = new Uint8Array(32);
  crypto.getRandomValues(key);
  return key;
})();

function deriveStream(iv, length) {
  // Generate a pseudo-random stream from key + IV using FNV-1a hash expansion
  const stream = new Uint8Array(length);
  const seed = new Uint8Array(SESSION_KEY.length + iv.length);
  seed.set(SESSION_KEY);
  seed.set(iv, SESSION_KEY.length);

  // Seed the hash state from the combined key + IV
  let h = 0x811c9dc5; // FNV-1a offset basis
  for (let i = 0; i < seed.length; i++) {
    h ^= seed[i];
    h = Math.imul(h, 0x01000193); // FNV-1a prime
  }

  for (let i = 0; i < length; i++) {
    h ^= (i + 1);
    h = Math.imul(h, 0x01000193);
    h = (h >>> 0); // ensure unsigned
    stream[i] = (h >>> ((i % 4) * 8)) & 0xff;
  }
  return stream;
}

function encryptData(data) {
  try {
    const str = typeof data === "string" ? data : JSON.stringify(data);
    const encoder = new TextEncoder();
    const plaintext = encoder.encode(str);

    // Random 16-byte IV per encryption
    const iv = new Uint8Array(16);
    crypto.getRandomValues(iv);

    // XOR plaintext with derived key stream
    const stream = deriveStream(iv, plaintext.length);
    const ciphertext = new Uint8Array(plaintext.length);
    for (let i = 0; i < plaintext.length; i++) {
      ciphertext[i] = plaintext[i] ^ stream[i];
    }

    // Combine IV + ciphertext and base64 encode for storage
    const combined = new Uint8Array(iv.length + ciphertext.length);
    combined.set(iv);
    combined.set(ciphertext, iv.length);

    return btoa(String.fromCharCode(...combined));
  } catch { return null; }
}

function decryptData(encoded) {
  try {
    const binary = atob(encoded);
    const combined = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      combined[i] = binary.charCodeAt(i);
    }

    if (combined.length < 17) return null; // minimum: 16 IV + 1 byte data

    const iv = combined.slice(0, 16);
    const ciphertext = combined.slice(16);

    const stream = deriveStream(iv, ciphertext.length);
    const plaintext = new Uint8Array(ciphertext.length);
    for (let i = 0; i < ciphertext.length; i++) {
      plaintext[i] = ciphertext[i] ^ stream[i];
    }

    const decoder = new TextDecoder();
    return decoder.decode(plaintext);
  } catch { return null; }
}

// ── Secure localStorage wrapper ──
export function secureSet(key, value) {
  try {
    const encrypted = encryptData(value);
    if (encrypted) localStorage.setItem(key, encrypted);
  } catch {}
}

export function secureGet(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const decrypted = decryptData(raw);
    if (!decrypted) {
      // Handle legacy unencrypted data — attempt migration
      try {
        const parsed = JSON.parse(raw);
        secureSet(key, parsed);
        return parsed;
      } catch { return null; }
    }
    try { return JSON.parse(decrypted); } catch { return decrypted; }
  } catch { return null; }
}

export function secureRemove(key) {
  try { localStorage.removeItem(key); } catch {}
}

// ── HTML Sanitization ──
export function sanitizeHTML(str) {
  if (typeof str !== "string") return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

// ── Input Validation ──
export function validateEmail(email) {
  if (!email || typeof email !== "string") return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function validatePhone(phone) {
  if (!phone || typeof phone !== "string") return false;
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 13;
}

export function validateName(name) {
  if (!name || typeof name !== "string") return false;
  const trimmed = name.trim();
  return trimmed.length >= 2 && trimmed.length <= 100 && !/[<>{}]/.test(trimmed);
}

export function validatePassword(password) {
  if (!password || typeof password !== "string") return false;
  return password.length >= 6 && password.length <= 128;
}

// Whitelist-based object sanitizer — only allows specified keys
export function sanitizeObject(obj, allowedKeys) {
  if (!obj || typeof obj !== "object") return {};
  const clean = {};
  for (const key of allowedKeys) {
    if (obj.hasOwnProperty(key) && key !== "__proto__" && key !== "constructor" && key !== "prototype") {
      clean[key] = obj[key];
    }
  }
  return clean;
}

// ── Rate Limiting ──
const rateLimits = new Map();

export function checkRateLimit(action, maxAttempts = 5, windowMs = 15 * 60 * 1000) {
  const now = Date.now();
  const key = action;

  if (!rateLimits.has(key)) {
    rateLimits.set(key, { attempts: [], lockedUntil: 0 });
  }

  const state = rateLimits.get(key);

  // Check if locked out
  if (state.lockedUntil > now) {
    const remaining = Math.ceil((state.lockedUntil - now) / 1000);
    return { allowed: false, remaining, message: `Too many attempts. Try again in ${remaining} seconds.` };
  }

  // Clean old attempts
  state.attempts = state.attempts.filter(t => t > now - windowMs);

  if (state.attempts.length >= maxAttempts) {
    state.lockedUntil = now + windowMs;
    return { allowed: false, remaining: Math.ceil(windowMs / 1000), message: `Account locked for ${Math.ceil(windowMs / 60000)} minutes.` };
  }

  return { allowed: true, remaining: 0, attemptsLeft: maxAttempts - state.attempts.length };
}

export function recordAttempt(action) {
  if (!rateLimits.has(action)) {
    rateLimits.set(action, { attempts: [], lockedUntil: 0 });
  }
  rateLimits.get(action).attempts.push(Date.now());
}

export function resetRateLimit(action) {
  rateLimits.delete(action);
}

// ── Session Management ──
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const WARNING_BEFORE = 5 * 60 * 1000; // warn 5 min before
let lastActivity = Date.now();
let sessionTimer = null;
let warningCallback = null;
let logoutCallback = null;

export function initSession(onWarning, onLogout) {
  warningCallback = onWarning;
  logoutCallback = onLogout;
  lastActivity = Date.now();

  // Track user activity
  const resetTimer = () => {
    lastActivity = Date.now();
  };

  ["mousedown", "keydown", "scroll", "touchstart"].forEach(event => {
    document.addEventListener(event, resetTimer, { passive: true });
  });

  // Check session every 30 seconds
  sessionTimer = setInterval(() => {
    const idle = Date.now() - lastActivity;
    if (idle >= SESSION_TIMEOUT && logoutCallback) {
      logoutCallback();
      clearInterval(sessionTimer);
    } else if (idle >= SESSION_TIMEOUT - WARNING_BEFORE && warningCallback) {
      warningCallback(Math.ceil((SESSION_TIMEOUT - idle) / 1000));
    }
  }, 30000);

  return () => {
    clearInterval(sessionTimer);
    ["mousedown", "keydown", "scroll", "touchstart"].forEach(event => {
      document.removeEventListener(event, resetTimer);
    });
  };
}

// ── UUID Generator (for non-predictable IDs) ──
export function generateUUID() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ── Secure Receipt Number (non-predictable) ──
export function generateSecureReceiptNo() {
  const date = new Date();
  const prefix = `REC-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}`;
  const random = crypto.getRandomValues(new Uint32Array(1))[0].toString(36).toUpperCase().slice(0, 6);
  return `${prefix}-${random}`;
}
