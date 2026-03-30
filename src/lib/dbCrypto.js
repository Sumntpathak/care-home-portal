/**
 * IndexedDB Encryption Layer — AES-256-GCM via Web Crypto API
 *
 * Encrypts all PHI before storing in IndexedDB.
 * Key is generated per-session and stored in sessionStorage.
 * On logout or session timeout, keys are cleared.
 */

const KEY_STORAGE_KEY = 'sc_db_key';
let cachedKey = null;

// Chunked base64 encoding — safe for large payloads (avoids call stack overflow)
function toBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunk = 8192;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function fromBase64(str) {
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

async function getOrCreateKey() {
  if (cachedKey) return cachedKey;

  // Try to restore from sessionStorage
  try {
    const stored = sessionStorage.getItem(KEY_STORAGE_KEY);
    if (stored) {
      const rawKey = fromBase64(stored);
      cachedKey = await crypto.subtle.importKey('raw', rawKey, 'AES-GCM', true, ['encrypt', 'decrypt']);
      return cachedKey;
    }
  } catch {}

  // Generate new key
  cachedKey = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );

  // Persist raw bytes to sessionStorage
  try {
    const rawKey = await crypto.subtle.exportKey('raw', cachedKey);
    sessionStorage.setItem(KEY_STORAGE_KEY, toBase64(rawKey));
  } catch {}

  return cachedKey;
}

/**
 * Encrypt a JavaScript value for storage in IndexedDB.
 * @param {*} data — any JSON-serializable value
 * @returns {Promise<{_encrypted: true, iv: string, data: string}>}
 */
export async function encrypt(data) {
  const key = await getOrCreateKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(JSON.stringify(data));

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoded
  );

  return {
    _encrypted: true,
    iv: toBase64(iv),
    data: toBase64(ciphertext),
  };
}

/**
 * Decrypt a value retrieved from IndexedDB.
 * @param {Object} payload — { _encrypted, iv, data } from encrypt()
 * @returns {Promise<*>} decrypted JavaScript value
 */
export async function decrypt(payload) {
  if (!payload || !payload._encrypted) return payload;

  const key = await getOrCreateKey();
  const iv = new Uint8Array(fromBase64(payload.iv));
  const ciphertext = fromBase64(payload.data);

  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  );

  return JSON.parse(new TextDecoder().decode(plaintext));
}

/**
 * Check if a value is an encrypted payload.
 */
export function isEncrypted(value) {
  return value && value._encrypted === true && value.iv && value.data;
}

/**
 * Clear encryption keys — call on logout/session timeout.
 */
export function clearKeys() {
  cachedKey = null;
  try { sessionStorage.removeItem(KEY_STORAGE_KEY); } catch {}
}

/**
 * Check if encryption is available (Web Crypto API present).
 */
export function isEncryptionAvailable() {
  return typeof crypto !== 'undefined' && crypto.subtle && typeof crypto.subtle.encrypt === 'function';
}
