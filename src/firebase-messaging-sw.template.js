importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: "__VITE_FIREBASE_API_KEY__",
    authDomain: "__VITE_FIREBASE_AUTH_DOMAIN__",
    projectId: "__VITE_FIREBASE_PROJECT_ID__",
    storageBucket: "__VITE_FIREBASE_STORAGE_BUCKET__",
    messagingSenderId: "__VITE_FIREBASE_MESSAGING_SENDER_ID__",
    appId: "__VITE_FIREBASE_APP_ID__",
    measurementId: "__VITE_FIREBASE_MEASUREMENT_ID__"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    return self.registration.showNotification(payload.notification.title, {
        body: payload.notification.body,
        icon: '/favicon.ico',
    });
});
