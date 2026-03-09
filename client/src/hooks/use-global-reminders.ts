'use client';

import { useEffect } from 'react';
import { api } from '@/lib/api';

// Utility to convert Base64 URL safe VAPID key to Uint8Array
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

export function useGlobalReminders() {
    useEffect(() => {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            console.log('Push notifications are not supported by the browser.');
            return;
        }

        const registerAndSubscribe = async () => {
            try {
                // 1. Register Service Worker
                const registration = await navigator.serviceWorker.register('/sw.js');

                // 2. Request Permission
                const permission = await Notification.requestPermission();
                if (permission !== 'granted') {
                    console.log('Notification permission not granted.');
                    return;
                }

                // 3. Get VAPID public key from backend
                const response = await api.get('/notifications/vapid-public-key');
                const vapidPublicKey = (response as any).publicKey;

                if (!vapidPublicKey) {
                    console.error('No VAPID public key received from backend');
                    return;
                }

                const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

                // 4. Subscribe to PushManager
                const subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: convertedVapidKey
                });

                // 5. Send subscription to our backend
                await api.post('/notifications/subscribe', {
                    subscription
                });

                console.log('Successfully subscribed to Web Push Notifications!');
            } catch (error) {
                console.error('Error during service worker registration or subscription:', error);
            }
        };

        registerAndSubscribe();
    }, []);

    return null;
}
