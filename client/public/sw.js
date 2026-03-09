// Basic fetch handler (required by Chromium for PWA installability)
self.addEventListener('fetch', function (event) {
    // We can do offline caching here later, for now just pass through to network
    event.respondWith(fetch(event.request).catch(() => new Response('Offline')));
});

self.addEventListener('push', function (event) {
    if (event.data) {
        try {
            const data = event.data.json();

            const options = {
                body: data.body || 'You have a new reminder.',
                icon: '/icon-192x192.png',
                badge: '/badge-monochrome.png',
                vibrate: [100, 50, 100],
                data: {
                    url: data.url || '/reminders'
                }
            };

            event.waitUntil(
                self.registration.showNotification(data.title || 'Note Maker', options)
            );
        } catch (e) {
            console.error('Push event data was not valid JSON', e);
        }
    }
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();

    // This looks to see if the current is already open and focuses if it is
    event.waitUntil(
        clients.matchAll({
            type: "window"
        }).then(function (clientList) {
            const urlToOpen = event.notification.data.url || '/';

            for (var i = 0; i < clientList.length; i++) {
                var client = clientList[i];
                if (client.url.includes(urlToOpen) && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});
