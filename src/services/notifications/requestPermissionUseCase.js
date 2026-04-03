import { getToken, onMessage } from 'firebase/messaging';
import { messaging } from '../../config/firebase';
import { doc, setDoc, collection, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

const requestPermissionUseCase = async (uid) => {
    try {
        console.log('1. Iniciando requestPermission...');
        if (!('Notification' in window)) { console.log('No soporta notificaciones'); return; }

        const permission = await Notification.requestPermission();
        console.log('2. Permiso:', permission);
        if (permission !== 'granted') return;

        console.log('3. Obteniendo token...');
        const token = await getToken(messaging, { vapidKey: VAPID_KEY });
        console.log('4. Token obtenido:', token);
        if (!token) { console.log('No se obtuvo token'); return; }

        await setDoc(doc(db, 'users', uid), { uid }, { merge: true });

        const tokensSnap = await getDocs(collection(db, 'users', uid, 'fcmTokens'));
        await Promise.all(tokensSnap.docs.map((d) => deleteDoc(d.ref)));

        await setDoc(doc(db, 'users', uid, 'fcmTokens', token), {
            token,
            createdAt: new Date().toISOString(),
        });
        console.log('5. Token guardado en Firestore');

        onMessage(messaging, (payload) => {
            navigator.serviceWorker.ready.then((registration) => {
                registration.showNotification(payload.notification.title, {
                    body: payload.notification.body,
                    icon: '/favicon.ico',
                });
            });
        });
    } catch (e) {
        console.error('Error registrando notificaciones:', e);
    }
};

export default requestPermissionUseCase;