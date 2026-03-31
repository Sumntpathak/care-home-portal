/**
 * Notification Manager
 * Requests permission and manages local notifications for:
 * - Medication reminders
 * - Critical vitals alerts
 * - Overdue tasks
 */
import { useState, useEffect } from 'react';
import { Bell, BellOff, Check } from 'lucide-react';

let notificationPermission = typeof Notification !== 'undefined' ? Notification.permission : 'denied';

/**
 * Request notification permission from the user.
 */
export async function requestNotificationPermission() {
  if (typeof Notification === 'undefined') return 'denied';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  const result = await Notification.requestPermission();
  notificationPermission = result;
  return result;
}

/**
 * Send a local notification (not push — works without server).
 */
export function sendLocalNotification(title, options = {}) {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return null;

  const notification = new Notification(title, {
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-96.png',
    vibrate: [200, 100, 200],
    tag: options.tag || 'shanti-care',
    renotify: true,
    ...options,
  });

  notification.onclick = () => {
    window.focus();
    if (options.url) window.location.hash = options.url;
    notification.close();
  };

  return notification;
}

/**
 * Schedule a medication reminder.
 */
export function scheduleMedReminder(patientName, medication, timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const now = new Date();
  const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);

  if (target <= now) target.setDate(target.getDate() + 1); // next day if time passed

  const delay = target - now;

  return setTimeout(() => {
    sendLocalNotification(`Medication Due: ${patientName}`, {
      body: `${medication} scheduled at ${timeStr}. Tap to mark as given.`,
      tag: `med-${patientName}-${medication}`,
      url: '#/med-schedule',
      requireInteraction: true,
    });
  }, delay);
}

/**
 * Send a critical vitals alert.
 */
export function sendVitalsAlert(patientName, alert) {
  sendLocalNotification(`Critical Alert: ${patientName}`, {
    body: alert,
    tag: `vitals-${patientName}`,
    url: '#/home-care',
    requireInteraction: true,
    vibrate: [300, 200, 300, 200, 300],
  });
}

/**
 * Notification permission toggle UI component.
 */
export default function NotificationToggle() {
  const [permission, setPermission] = useState(notificationPermission);

  useEffect(() => {
    if (typeof Notification !== 'undefined') {
      setPermission(Notification.permission);
    }
  }, []);

  const handleEnable = async () => {
    const result = await requestNotificationPermission();
    setPermission(result);
    if (result === 'granted') {
      sendLocalNotification('Notifications Enabled', {
        body: 'You will receive medication reminders and critical alerts.',
        tag: 'setup',
      });
    }
  };

  if (typeof Notification === 'undefined') return null;

  return (
    <button
      onClick={handleEnable}
      disabled={permission === 'denied'}
      title={permission === 'granted' ? 'Notifications enabled' : permission === 'denied' ? 'Notifications blocked — enable in browser settings' : 'Enable notifications'}
      style={{
        background: 'none', border: 'none', cursor: permission === 'denied' ? 'not-allowed' : 'pointer',
        color: permission === 'granted' ? 'var(--success)' : 'var(--text-muted)',
        padding: 4, display: 'flex', alignItems: 'center', borderRadius: 6,
      }}
      aria-label={permission === 'granted' ? 'Notifications enabled' : 'Enable notifications'}
    >
      {permission === 'granted' ? <Bell size={18} /> : <BellOff size={18} />}
    </button>
  );
}
