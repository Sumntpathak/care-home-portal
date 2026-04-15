/**
 * liveSync — stub.
 *
 * The original 178-LOC WebSocket real-time sync was wired up (AuthContext
 * called connect() on login) but nothing consumed the events in the UI.
 * Replaced with no-ops. Public API preserved so AuthContext + dataLayer imports
 * remain safe.
 *
 * If real-time multi-device sync is needed, reintroduce here.
 */

export function connect() {}
export function disconnect() {}
export function broadcastChange() {}
export function onChange() { return () => {}; }
export function getStatus() { return { connected: false, url: null }; }
