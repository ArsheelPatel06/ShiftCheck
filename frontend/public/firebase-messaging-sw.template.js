// Firebase Cloud Messaging Service Worker Template
// This file is a template - actual values are injected during build process
// DO NOT commit this file with real API keys!

importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Initialize Firebase in the service worker
// Values are injected during build process from environment variables
firebase.initializeApp({
    apiKey: "YOUR_FIREBASE_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_FIREBASE_APP_ID"
});

// Initialize Firebase Cloud Messaging
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
    console.log('Received background message:', payload);

    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/logo192.png',
        badge: '/logo192.png',
        tag: payload.data?.type || 'general',
        data: payload.data,
        actions: getNotificationActions(payload.data?.type),
        requireInteraction: payload.data?.priority === 'high'
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
    console.log('Notification clicked:', event);

    event.notification.close();

    // Handle different notification types
    const data = event.notification.data;
    if (data) {
        handleNotificationClick(data);
    }
});

// Handle notification action clicks
self.addEventListener('notificationclick', (event) => {
    if (event.action) {
        console.log('Notification action clicked:', event.action);
        handleNotificationAction(event.action, event.notification.data);
    }
});

function getNotificationActions(type) {
    const actions = [];

    switch (type) {
        case 'shift_assigned':
            actions.push(
                { action: 'view', title: 'View Shift' },
                { action: 'decline', title: 'Decline' }
            );
            break;
        case 'leave_request':
            actions.push(
                { action: 'approve', title: 'Approve' },
                { action: 'reject', title: 'Reject' }
            );
            break;
        case 'schedule_change':
            actions.push(
                { action: 'view', title: 'View Changes' }
            );
            break;
    }

    return actions;
}

function handleNotificationClick(data) {
    const url = getNotificationUrl(data);
    if (url) {
        event.waitUntil(
            clients.matchAll({ type: 'window' }).then((clientList) => {
                // Check if app is already open
                for (const client of clientList) {
                    if (client.url.includes(self.location.origin) && 'focus' in client) {
                        return client.focus();
                    }
                }
                // Open new window if app is not open
                if (clients.openWindow) {
                    return clients.openWindow(url);
                }
            })
        );
    }
}

function handleNotificationAction(action, data) {
    switch (action) {
        case 'view':
            handleNotificationClick(data);
            break;
        case 'approve':
            // Handle leave request approval
            console.log('Approving leave request:', data);
            break;
        case 'reject':
            // Handle leave request rejection
            console.log('Rejecting leave request:', data);
            break;
        case 'decline':
            // Handle shift decline
            console.log('Declining shift:', data);
            break;
    }
}

function getNotificationUrl(data) {
    if (!data) return '/';

    switch (data.type) {
        case 'shift_assigned':
        case 'schedule_change':
            return '/staff-dashboard?tab=schedule';
        case 'leave_request':
            return '/admin-dashboard?tab=requests';
        case 'leave_approved':
        case 'leave_rejected':
            return '/staff-dashboard?tab=requests';
        default:
            return '/staff-dashboard?tab=notifications';
    }
}
