/*
 * sw.js
 * Service Worker for background notifications.
 */

self.addEventListener('install', function(event) {
    self.skipWaiting();
});

self.addEventListener('activate', function(event) {
    event.waitUntil(clients.claim());
});

self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
            if (clientList.length > 0) {
                return clientList[0].focus();
            }
            return clients.openWindow('/');
        })
    );
});

self.addEventListener('push', function(event) {
    if (event.data) {
        var data = event.data.json();
        event.waitUntil(
            self.registration.showNotification(data.title || 'FamilyHub', {
                body: data.body || 'You have a new notification',
                tag: data.tag || 'familyhub-notification',
                renotify: true,
                vibrate: [200, 100, 200]
            })
        );
    }
});