/**
 * Sync Status & Conflict Resolution Dashboard
 * Shows sync queue state, pending items, and data conflicts for clinical review.
 */
import { useState, useEffect } from 'react';
import { RefreshCw, AlertTriangle, CheckCircle, XCircle, Clock, Wifi, WifiOff, Server, Cloud, Trash2, RotateCcw } from 'lucide-react';
import { getSyncQueue, getPendingCount, getConflictCount, getConflicts, processSyncQueue, retryFailed, clearCompleted, resolveConflict, getConflictDetail } from '../lib/syncManager';
import { getConnectionType } from '../lib/serverDiscovery';
import { useToast } from '../components/Toast';

const STATUS_CONFIG = {
  pending:  { label: 'Pending',  color: 'var(--info)',    bg: 'var(--info-light)',    icon: Clock },
  retrying: { label: 'Retrying', color: 'var(--warning)', bg: 'var(--warning-light)', icon: RefreshCw },
  conflict: { label: 'Conflict', color: 'var(--danger)',  bg: 'var(--danger-light)',  icon: AlertTriangle },
  failed:   { label: 'Failed',   color: 'var(--danger)',  bg: 'var(--danger-light)',  icon: XCircle },
};

const CONN_CONFIG = {
  lan:     { label: 'Local Server (LAN)', icon: Server, color: 'var(--success)' },
  cloud:   { label: 'Cloud',              icon: Cloud,  color: 'var(--info)' },
  offline: { label: 'Offline',            icon: WifiOff,color: 'var(--warning)' },
};

export default function SyncStatus() {
  const { addToast } = useToast();
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [connType, setConnType] = useState(getConnectionType());
  const [filter, setFilter] = useState('all');
  const [conflictView, setConflictView] = useState(null); // { localVersion, serverVersion, id, entityType }

  const load = async () => {
    setLoading(true);
    try {
      const items = await getSyncQueue();
      setQueue(items.sort((a, b) => a.priority - b.priority || new Date(b.createdAt) - new Date(a.createdAt)));
    } catch { setQueue([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await processSyncQueue();
      addToast('Sync completed.', 'success');
    } catch { addToast('Sync failed.', 'error'); }
    finally { setSyncing(false); load(); }
  };

  const handleRetryFailed = async () => {
    await retryFailed();
    addToast('Retrying failed items...', 'info');
    load();
  };

  const viewConflict = async (itemId) => {
    const detail = await getConflictDetail(itemId);
    if (detail) setConflictView(detail);
  };

  const handleResolve = async (itemId, choice) => {
    await resolveConflict(itemId, choice);
    setConflictView(null);
    addToast(choice === 'local' ? 'Keeping local version — will sync on next attempt.' : 'Server version kept — local change discarded.', 'success');
    load();
  };

  const handleClearFailed = async () => {
    await clearCompleted();
    addToast('Cleared failed/conflicted items.', 'info');
    load();
  };

  // Stats
  const pending = queue.filter(i => i.status === 'pending' || i.status === 'retrying').length;
  const conflicts = queue.filter(i => i.status === 'conflict').length;
  const failed = queue.filter(i => i.status === 'failed').length;
  const total = queue.length;

  const filtered = filter === 'all' ? queue : queue.filter(i => i.status === filter);

  const conn = CONN_CONFIG[connType] || CONN_CONFIG.offline;
  const ConnIcon = conn.icon;

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h2>Sync Status</h2>
          <p>Offline queue, data conflicts &amp; connection status</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-primary btn-sm" onClick={handleSync} disabled={syncing || pending === 0}>
            {syncing ? <RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <RefreshCw size={13} />}
            Sync Now
          </button>
          {failed > 0 && (
            <button className="btn btn-outline btn-sm" onClick={handleRetryFailed}>
              <RotateCcw size={13} /> Retry Failed
            </button>
          )}
        </div>
      </div>

      {/* Connection Status */}
      <div className="card" style={{ marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: conn.color === 'var(--success)' ? 'var(--success-light)' : conn.color === 'var(--info)' ? 'var(--info-light)' : 'var(--warning-light)' }}>
            <ConnIcon size={20} style={{ color: conn.color }} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '14px' }}>Connected to: {conn.label}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {connType === 'lan' && 'Fast local sync — data stays on hospital network'}
              {connType === 'cloud' && 'Syncing via internet — all changes backed up'}
              {connType === 'offline' && 'Changes saved locally — will sync when connection restores'}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="val">{total}</div>
          <div className="label">Total in Queue</div>
        </div>
        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => setFilter('pending')}>
          <div className="val" style={{ color: 'var(--info)' }}>{pending}</div>
          <div className="label">Pending Sync</div>
        </div>
        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => setFilter('conflict')}>
          <div className="val" style={{ color: conflicts > 0 ? 'var(--danger)' : 'var(--success)' }}>{conflicts}</div>
          <div className="label">Conflicts</div>
          {conflicts > 0 && <div className="sub" style={{ color: 'var(--danger)' }}>Needs clinical review</div>}
        </div>
        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => setFilter('failed')}>
          <div className="val" style={{ color: failed > 0 ? 'var(--danger)' : 'var(--text-muted)' }}>{failed}</div>
          <div className="label">Failed</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="tab-bar" style={{ marginBottom: '14px' }}>
        {[['all', `All (${total})`], ['pending', `Pending (${pending})`], ['conflict', `Conflicts (${conflicts})`], ['failed', `Failed (${failed})`]].map(([key, label]) => (
          <button key={key} className={`tab-btn ${filter === key ? 'active' : ''}`} onClick={() => setFilter(key)}>{label}</button>
        ))}
      </div>

      {/* Queue Items */}
      {loading ? <div className="loading-box"><span className="spinner" /></div> : (
        filtered.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <CheckCircle size={36} style={{ color: 'var(--success)' }} />
              <div style={{ fontWeight: 600 }}>All synced</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No pending operations in the queue</div>
            </div>
          </div>
        ) : (
          <div className="card">
            {filtered.map(item => {
              const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
              const Icon = cfg.icon;
              return (
                <div key={item.id} style={{
                  padding: '12px 14px', borderRadius: '8px', marginBottom: '8px',
                  background: cfg.bg, border: `1px solid ${cfg.color}20`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                      <Icon size={16} style={{ color: cfg.color, flexShrink: 0 }} />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '13px' }}>
                          {item.method} — {item.entityType}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {item.url || 'Queued operation'} · Priority: {item.priority}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          Created: {new Date(item.createdAt).toLocaleString()}
                          {item.retryCount > 0 && ` · Retries: ${item.retryCount}`}
                        </div>
                        {item.status === 'conflict' && item.conflictDetail && (
                          <div style={{ marginTop: '6px', padding: '8px', background: 'rgba(255,255,255,.7)', borderRadius: '6px', fontSize: '12px' }}>
                            <strong style={{ color: 'var(--danger)' }}>Conflict Detail:</strong>
                            <pre style={{ margin: '4px 0 0', fontSize: '11px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                              {item.conflictDetail}
                            </pre>
                          </div>
                        )}
                        {item.status === 'failed' && item.errorDetail && (
                          <div style={{ marginTop: '4px', fontSize: '11px', color: 'var(--danger)' }}>
                            Error: {item.errorDetail}
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="badge" style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}30` }}>
                      {cfg.label}
                    </span>
                    {item.status === 'conflict' && (
                      <button className="btn btn-sm btn-outline" style={{ marginLeft: '8px' }} onClick={() => viewConflict(item.id)}>
                        Resolve
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {(failed > 0 || conflicts > 0) && (
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                {failed > 0 && (
                  <button className="btn btn-outline btn-sm" onClick={handleRetryFailed}>
                    <RotateCcw size={12} /> Retry All Failed
                  </button>
                )}
                <button className="btn btn-outline btn-sm" style={{ color: 'var(--danger)' }} onClick={handleClearFailed}>
                  <Trash2 size={12} /> Clear Failed &amp; Conflicts
                </button>
              </div>
            )}
          </div>
        )
      )}

      {/* Conflict Diff Modal */}
      {conflictView && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', backdropFilter: 'blur(2px)', zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: 'clamp(16px, 4vw, 40px)', paddingTop: 'clamp(24px, 5vh, 60px)', overflowY: 'auto' }}>
          <div style={{ background: 'var(--surface)', borderRadius: '12px', padding: '24px', maxWidth: 'min(95vw, 700px)', width: '100%', maxHeight: 'calc(100vh - 80px)', overflowY: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,.2)', animation: 'modalIn .2s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Resolve Conflict — {conflictView.entityType}</h3>
              <button className="btn-icon" onClick={() => setConflictView(null)}><XCircle size={18} /></button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div style={{ background: 'var(--info-light)', borderRadius: '8px', padding: '12px', border: '2px solid var(--info)' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--info)', marginBottom: '8px' }}>Your Version (Local)</div>
                <pre style={{ fontSize: '11px', whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0, lineHeight: 1.6 }}>
                  {JSON.stringify(conflictView.localVersion, null, 2)}
                </pre>
              </div>
              <div style={{ background: 'var(--warning-light)', borderRadius: '8px', padding: '12px', border: '2px solid var(--warning)' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--warning)', marginBottom: '8px' }}>Server Version</div>
                <pre style={{ fontSize: '11px', whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0, lineHeight: 1.6 }}>
                  {JSON.stringify(conflictView.serverVersion, null, 2)}
                </pre>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => handleResolve(conflictView.id, 'local')}>
                Keep My Version
              </button>
              <button className="btn btn-outline" style={{ flex: 1, justifyContent: 'center', borderColor: 'var(--warning)', color: 'var(--warning)' }} onClick={() => handleResolve(conflictView.id, 'server')}>
                Keep Server Version
              </button>
            </div>

            {conflictView.entityType?.includes('med') && (
              <div style={{ marginTop: '10px', padding: '8px 12px', background: 'var(--danger-light)', borderRadius: '6px', fontSize: '11px', color: 'var(--danger)' }}>
                <AlertTriangle size={12} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                Clinical data conflict — review carefully before choosing. If unsure, keep the server version and verify with the treating clinician.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Info Box */}
      <div style={{ marginTop: '14px', padding: '12px 16px', background: 'var(--info-light)', borderRadius: '8px', fontSize: '12px', color: 'var(--info)', lineHeight: 1.7 }}>
        <strong>How offline sync works:</strong><br />
        When you're offline, all changes are saved locally and queued for sync. When the connection restores, items sync in priority order: critical (medications, incidents) first, then prescriptions, then general data. If the server detects a conflict (e.g., another device edited the same record), it's flagged here for your review.
      </div>
    </div>
  );
}
