import { useState, useEffect, useCallback } from 'react';

export function useNotification() {
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result === 'granted') {
        new Notification('Notifications Enabled', {
           body: 'You will now receive alerts for new broadcasts and updates!',
           icon: '/acron.png'
        });
      }
    } catch (error: any) {
      if (error?.message?.includes('Extension context invalidated')) {
        console.warn('Browser extension updated/crashed. Please refresh the page to enable notifications.');
        // Optionally alert user: alert("Please refresh the page to enable notifications.");
      } else {
        console.error('Error requesting notification permission:', error);
      }
    }
  }, []);

  const sendNotification = useCallback((title: string, body: string, icon: string = '/acron.png') => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    if (Notification.permission === 'granted') {
      new Notification(title, { body, icon });
    } else if (Notification.permission !== 'denied') {
      // Try requesting again if default (though modern browsers block this unless user gesture)
      // Best to rely on manual request first
    }
  }, []);

  return { permission, requestPermission, sendNotification };
}
