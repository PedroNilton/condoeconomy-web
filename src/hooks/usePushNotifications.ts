import { useEffect } from 'react';
import api from '../services/api';

const publicVapidKey = 'BB+new06uBT5YB+9+1AKsnmR4BzLo9RA4OCyF1RtZhw8gHLggZ1wRChnVqR/34EiiF073qSESe5BOqKT+EAb5XU=';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications() {
  useEffect(() => {
    async function setupPush() {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.warn('Web Push not supported.');
        return;
      }

      try {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return;

        const registration = await navigator.serviceWorker.register('/sw.js');
        await navigator.serviceWorker.ready;

        let subscription = await registration.pushManager.getSubscription();

        if (!subscription) {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
          });
        }

        // Send to backend
        const token = localStorage.getItem('@CondoEconomy:token');
        if (token && subscription) {
            await api.post('/api/v1/push/subscribe', subscription.toJSON());
        }

      } catch (err) {
        console.error('Error setting up Web Push', err);
      }
    }

    setupPush();
  }, []);
}
