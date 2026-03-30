/**
 * Offline/Online Status Indicator
 * Shows sync status in the app header.
 *
 * - Green dot: Online, synced
 * - Yellow dot + "Offline": Offline with pending items
 * - Red dot + "Sync failed": Errors, manual retry available
 * - Sync count badge when items are pending
 */
import { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, AlertCircle } from 'lucide-react';
import { onSyncChange, getPendingCount, processSyncQueue, retryFailed } from '../lib/syncManager';
import { getConnectionType, onConnectionChange } from '../lib/serverDiscovery';

export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncState, setSyncState] = useState({ isSyncing: false, pendingCount: 0 });
  const [connType, setConnType] = useState(getConnectionType());

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen for sync changes
    const unsub = onSyncChange(setSyncState);
    const unsubConn = onConnectionChange(({ type }) => setConnType(type));

    // Get initial count
    getPendingCount().then(count => setSyncState(prev => ({ ...prev, pendingCount: count })));

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsub();
      unsubConn();
    };
  }, []);

  const { isSyncing, pendingCount } = syncState;

  // Don't show anything if online and no pending items
  if (isOnline && pendingCount === 0 && !isSyncing) {
    return (
      <div style={styles.container} title={connType === 'lan' ? 'Connected to Local Server' : 'Connected to Cloud'}>
        <div style={{ ...styles.dot, background: connType === 'lan' ? '#22c55e' : '#3b82f6' }} />
        {connType === 'lan' && <span style={{ ...styles.text, color: '#22c55e' }}>LAN</span>}
      </div>
    );
  }

  if (!isOnline) {
    return (
      <div style={{ ...styles.container, ...styles.offline }} title="Offline — changes saved locally">
        <WifiOff size={14} />
        <span style={styles.text}>Offline</span>
        {pendingCount > 0 && <span style={styles.badge}>{pendingCount}</span>}
      </div>
    );
  }

  if (isSyncing) {
    return (
      <div style={{ ...styles.container, ...styles.syncing }} title="Syncing...">
        <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} />
        <span style={styles.text}>Syncing {pendingCount}</span>
      </div>
    );
  }

  if (pendingCount > 0) {
    return (
      <div
        style={{ ...styles.container, ...styles.pending, cursor: 'pointer' }}
        onClick={() => processSyncQueue()}
        title="Click to sync pending changes"
      >
        <AlertCircle size={14} />
        <span style={styles.text}>{pendingCount} pending</span>
        <button
          onClick={(e) => { e.stopPropagation(); retryFailed(); }}
          style={styles.retryBtn}
        >
          Retry
        </button>
      </div>
    );
  }

  return null;
}

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 500,
    whiteSpace: 'nowrap',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
  },
  offline: {
    background: '#fef3c7',
    color: '#92400e',
  },
  syncing: {
    background: '#dbeafe',
    color: '#1e40af',
  },
  pending: {
    background: '#fee2e2',
    color: '#991b1b',
  },
  text: {
    fontSize: '11px',
  },
  badge: {
    background: '#ef4444',
    color: 'white',
    borderRadius: '10px',
    padding: '0 6px',
    fontSize: '10px',
    fontWeight: 700,
    minWidth: '18px',
    textAlign: 'center',
  },
  retryBtn: {
    background: 'none',
    border: '1px solid currentColor',
    borderRadius: '4px',
    padding: '1px 6px',
    fontSize: '10px',
    cursor: 'pointer',
    color: 'inherit',
  },
};
