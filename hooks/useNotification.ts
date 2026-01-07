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
    if (typeof window === 'undefined') return false;
    
    if (!('Notification' in window)) {
        console.warn('This browser does not support desktop notification');
        return false;
    }

    if (Notification.permission === 'granted') {
      try {
        new Notification(title, { body, icon });
        return true;
      } catch (e) {
        console.error('Notification creation failed', e);
        return false;
      }
    } else {
       console.warn('Notification permission not granted');
       return false;
    }
  }, []);

  return { permission, requestPermission, sendNotification };
}
