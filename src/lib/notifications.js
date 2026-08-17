// notifications.js
// Local notification helpers (in-app / service-worker integration placeholder)

export async function requestNotificationPermission() {
  if (!('Notification' in window)) return false;
  const perm = await Notification.requestPermission();
  return perm === 'granted';
}

export function showLocalNotification(title, body) {
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  try {
    new Notification(title, { body });
  } catch (e) {
    console.warn('Notification failed', e);
  }
}

// schedule a simple timeout-based reminder (only while app is open)
export function scheduleInAppReminder(msFromNow, title, body) {
  setTimeout(() => showLocalNotification(title, body), msFromNow);
}
