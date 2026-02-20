/** REQ-RC-PWA-003: Service Worker更新通知 */
import { useState, useEffect, useCallback } from 'react';

interface UseServiceWorkerResult {
  needRefresh: boolean;
  updateServiceWorker: () => void;
  dismissUpdate: () => void;
}

export function useServiceWorker(): UseServiceWorkerResult {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const handleControllerChange = () => {
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

    navigator.serviceWorker.ready.then((reg) => {
      setRegistration(reg);

      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            setNeedRefresh(true);
          }
        });
      });
    });

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
    };
  }, []);

  const updateServiceWorker = useCallback(() => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  }, [registration]);

  const dismissUpdate = useCallback(() => {
    setNeedRefresh(false);
  }, []);

  return { needRefresh, updateServiceWorker, dismissUpdate };
}
