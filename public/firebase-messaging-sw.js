importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: "AIzaSyDaHWPn7sWJUBffzEOfghm9kfbk7fkswYw",
    authDomain: "garden-manager-app.firebaseapp.com",
    projectId: "garden-manager-app",
    storageBucket: "garden-manager-app.firebasestorage.app",
    messagingSenderId: "633457955079",
    appId: "1:633457955079:web:4ad08f2195c847a6fe75a2",
    measurementId: "G-VVJMXF3YHY"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    return self.registration.showNotification(payload.notification.title, {
        body: payload.notification.body,
        icon: '/favicon.ico',
    });
});