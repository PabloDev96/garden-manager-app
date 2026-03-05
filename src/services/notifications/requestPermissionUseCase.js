import { getToken } from 'firebase/messaging';
import { messaging } from '../../config/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';

const VAPID_KEY = 'BKH-G6I5VzzSHDv-5IuvtFD_11f8d2A-WTX9ykY5P6sc8Z41-wPJeqW-MnvPL-JhJMfLiB-JIvuHxBt7JDhz804';

const requestPermissionUseCase = async (uid) => {
    try {
        if (!('Notification' in window)) return;
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return;

        const token = await getToken(messaging, { vapidKey: VAPID_KEY });
        if (!token) return;

        await setDoc(doc(db, 'users', uid, 'fcmTokens', token), {
            token,
            createdAt: new Date().toISOString(),
        });
    } catch (e) {
        console.error('Error registrando notificaciones:', e);
    }
};

export default requestPermissionUseCase;