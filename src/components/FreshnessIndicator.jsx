/**
 * Data Freshness Indicator
 * Shows when data was last synced with the server.
 * Yellow warning if stale, red if very stale (clinical safety).
 */
import { useState, useEffect } from 'react';
import { RefreshCw, Clock, WifiOff } from 'lucide-react';
import { getFreshness, onFreshnessChange, invalidate } from '../lib/dataLayer';

export default function FreshnessIndicator({ storeName, onRefresh, label }) {
  const [freshness, setFreshness] = useState(() => getFreshness(storeName));
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const update = () => setFreshness(getFreshness(storeName));
    const unsub = onFreshnessChange((name) => {
      if (name === storeName) update();
    });
    // Update every 10 seconds for the relative time display
    const timer = setInterval(update, 10000);
    return () => { unsub(); clearInterval(timer); };
  }, [storeName]);

  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    invalidate(storeName);
    try {
      if (onRefresh) await onRefresh();
    } finally {
      setRefreshing(false);
      setFreshness(getFreshness(storeName));
    }
  };

  const { staleSec, isStale, lastFetched } = freshness;
  const isOnline = navigator.onLine;

  // Determine severity
  let color = 'var(--success)';
  let bg = 'var(--success-light)';
  let Icon = Clock;

  if (!isOnline) {
    color = 'var(--warning)';
    bg = 'var(--warning-light)';
    Icon = WifiOff;
  } else if (isStale && staleSec > 300) {
    // Very stale (>5 min) — red for clinical screens
    color = 'var(--danger)';
    bg = 'var(--danger-light)';
  } else if (isStale) {
    color = 'var(--warning)';
    bg = 'var(--warning-light)';
  }

  const timeText = staleSec === null
    ? 'Not yet loaded'
    : staleSec < 10
      ? 'Just now'
      : staleSec < 60
        ? `${staleSec}s ago`
        : staleSec < 3600
          ? `${Math.floor(staleSec / 60)}m ago`
          : `${Math.floor(staleSec / 3600)}h ago`;

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '3px 10px',
        borderRadius: '20px',
        fontSize: '11px',
        fontWeight: 500,
        background: bg,
        color,
        cursor: onRefresh ? 'pointer' : 'default',
      }}
      onClick={onRefresh ? handleRefresh : undefined}
      title={lastFetched ? `Last synced: ${new Date(lastFetched).toLocaleTimeString()}` : 'Not synced yet'}
    >
      {refreshing ? (
        <RefreshCw size={11} style={{ animation: 'spin 1s linear infinite' }} />
      ) : (
        <Icon size={11} />
      )}
      <span>{label || 'Synced'}: {timeText}</span>
      {!isOnline && <span style={{ fontSize: '10px', opacity: 0.8 }}>(offline)</span>}
    </div>
  );
}
