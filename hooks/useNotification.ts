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
    console.log('[Notification] sendNotification called:', { title, body });
    
    if (typeof window === 'undefined') {
      console.warn('[Notification] window is undefined (SSR)');
      return false;
    }
    
    // Construct absolute URL for icon (required for some browsers/OS)
    const iconUrl = icon.startsWith('http') ? icon : `${window.location.origin}${icon}`;
    console.log('[Notification] Icon URL:', iconUrl);

    if (!('Notification' in window)) {
      console.warn('[Notification] This browser does not support desktop notification');
      return false;
    }

    // Check permission at call time (not cached state)
    const currentPermission = Notification.permission;
    console.log('[Notification] Current permission:', currentPermission);
    
    if (currentPermission === 'granted') {
      try {
        console.log('[Notification] Creating notification...');
        const n = new Notification(title, { body, icon: iconUrl });
        n.onclick = () => { window.focus(); n.close(); };
        console.log('[Notification] ✓ Notification created successfully');
        return true;
      } catch (e) {
        console.error('[Notification] Creation failed:', e);
        return false;
      }
    } else if (currentPermission === 'denied') {
      console.warn('[Notification] Permission denied by user');
      return false;
    } else {
      console.warn('[Notification] Permission not yet granted (default)');
      return false;
    }
  }, []);

  return { permission, requestPermission, sendNotification };
}
