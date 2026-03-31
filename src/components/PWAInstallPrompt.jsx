/**
 * PWA Install Prompt
 * Shows a custom "Install App" button when the browser triggers beforeinstallprompt.
 * Also handles iOS install instructions (iOS doesn't support beforeinstallprompt).
 */
import { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';

let deferredPrompt = null;

// Capture the install prompt globally
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    window.dispatchEvent(new CustomEvent('pwa:installable'));
  });
}

export default function PWAInstallPrompt() {
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true);
      return;
    }

    // Check iOS
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(ios);

    // Check if dismissed recently
    const dismissed = localStorage.getItem('pwa_install_dismissed');
    if (dismissed && Date.now() - parseInt(dismissed) < 3 * 86400000) return; // 3 days

    // Show after 5 seconds on page
    const timer = setTimeout(() => {
      if (deferredPrompt || ios) setShow(true);
    }, 5000);

    // Also show immediately if installable event fires
    const handler = () => setShow(true);
    window.addEventListener('pwa:installable', handler);

    return () => { clearTimeout(timer); window.removeEventListener('pwa:installable', handler); };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const result = await deferredPrompt.userChoice;
      if (result.outcome === 'accepted') setInstalled(true);
      deferredPrompt = null;
    }
    setShow(false);
  };

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem('pwa_install_dismissed', String(Date.now()));
  };

  if (installed || !show) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)',
      background: 'var(--surface)', borderRadius: 14, padding: '14px 18px',
      boxShadow: '0 8px 32px rgba(0,0,0,.2)', border: '1px solid var(--border)',
      zIndex: 950, maxWidth: 360, width: 'calc(100% - 32px)',
      animation: 'modalIn .3s ease-out',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #1a3a5c, #1a5f5a)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Smartphone size={20} color="#6dd5b4" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', marginBottom: 4 }}>Install ShantiCare</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 10 }}>
            {isIOS
              ? 'Tap the Share button, then "Add to Home Screen" for the full app experience.'
              : 'Install as an app for offline access, faster loading, and medication reminders.'}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {!isIOS && (
              <button onClick={handleInstall} style={{
                padding: '8px 16px', borderRadius: 8, border: 'none',
                background: 'var(--primary)', color: '#fff', fontSize: 13, fontWeight: 600,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <Download size={14} /> Install
              </button>
            )}
            <button onClick={handleDismiss} style={{
              padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border)',
              background: 'transparent', color: 'var(--text-muted)', fontSize: 13,
              cursor: 'pointer',
            }}>
              Later
            </button>
          </div>
        </div>
        <button onClick={handleDismiss} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 2 }}>
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
