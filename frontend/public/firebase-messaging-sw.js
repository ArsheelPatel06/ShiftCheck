// Firebase Cloud Messaging Service Worker
// This file must be in the public directory

importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Initialize Firebase in the service worker
// Note: Service workers can't access process.env, so we need to use the actual values
// In production, these values should be injected during build process
firebase.initializeApp({
    apiKey: "AIzaSyCLTDPs0qMVRQyhLxD9EgWBlC2eikO_aoQ",
    authDomain: "healthcare-shift-manager-ef7cc.firebaseapp.com",
    projectId: "healthcare-shift-manager-ef7cc",
    storageBucket: "healthcare-shift-manager-ef7cc.appspot.com",
    messagingSenderId: "846320531265",
    appId: "1:846320531265:web:08c5f7561eb924526d53c0"
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
