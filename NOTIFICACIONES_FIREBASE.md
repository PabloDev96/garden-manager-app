# Notificaciones Push con Firebase Cloud Messaging (FCM)

Guía paso a paso para implementar notificaciones push en una web con Firebase.

---

## 1. Requisitos previos

- Proyecto creado en [Firebase Console](https://console.firebase.google.com)
- Firebase SDK instalado: `npm install firebase`
- Firebase Functions instalado: `npm install firebase-functions firebase-admin`
- Firebase CLI instalado globalmente: `npm install -g firebase-tools`

---

## 2. Obtener la VAPID Key

1. Ve a Firebase Console → **Project Settings** → pestaña **Cloud Messaging**
2. En la sección **Web Push certificates**, haz clic en **Generate key pair**
3. Copia la clave — la necesitarás en el frontend

---

## 3. Inicializar Firebase Messaging en el frontend

En tu archivo de configuración de Firebase (ej. `src/config/firebase.js`):

```js
import { initializeApp } from "firebase/app";
import { getMessaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};

const app = initializeApp(firebaseConfig);
export const messaging = getMessaging(app);
```

---

## 4. Crear el Service Worker

Crea el archivo `public/firebase-messaging-sw.js` (debe estar en la raíz pública):

```js
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
});

const messaging = firebase.messaging();

// Maneja notificaciones cuando la app está en SEGUNDO PLANO
messaging.onBackgroundMessage((payload) => {
  return self.registration.showNotification(payload.notification.title, {
    body: payload.notification.body,
    icon: '/favicon.ico',
  });
});
```

> ⚠️ El `return` delante de `showNotification` es obligatorio. Sin él, el navegador cierra el canal antes de mostrar la notificación.

---

## 5. Solicitar permiso y guardar el token

Crea un use case o función que:
1. Pida permiso al usuario
2. Obtenga el token FCM
3. Lo guarde en Firestore
4. Maneje notificaciones en primer plano con `onMessage`

```js
import { getToken, onMessage } from 'firebase/messaging';
import { messaging } from '../config/firebase';
import { doc, setDoc, collection, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

const VAPID_KEY = 'tu_vapid_key_aquí';

const requestPermissionUseCase = async (uid) => {
  try {
    if (!('Notification' in window)) return;

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return;

    const token = await getToken(messaging, { vapidKey: VAPID_KEY });
    if (!token) return;

    // Asegurar que el documento del usuario existe en Firestore
    await setDoc(doc(db, 'users', uid), { uid }, { merge: true });

    // Borrar tokens anteriores para evitar duplicados
    const tokensSnap = await getDocs(collection(db, 'users', uid, 'fcmTokens'));
    await Promise.all(tokensSnap.docs.map((d) => deleteDoc(d.ref)));

    // Guardar el token actual
    await setDoc(doc(db, 'users', uid, 'fcmTokens', token), {
      token,
      createdAt: new Date().toISOString(),
    });

    // Maneja notificaciones cuando la app está en PRIMER PLANO
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
```

Llama a esta función cuando el usuario esté autenticado, por ejemplo en un `useEffect`:

```js
useEffect(() => {
  if (!uid) return;
  requestPermissionUseCase(uid);
}, [uid]);
```

---

## 6. Cloud Function para enviar notificaciones programadas

En `functions/index.js`:

```js
const { onSchedule } = require('firebase-functions/v2/scheduler');
const admin = require('firebase-admin');
admin.initializeApp();

exports.enviarNotificaciones = onSchedule(
  { schedule: '0 9 * * *', timeZone: 'Europe/Madrid' }, // cada día a las 9:00
  async () => {
    const db = admin.firestore();
    const hoy = new Date().toISOString().split('T')[0]; // formato YYYY-MM-DD

    const usersSnap = await db.collection('users').get();

    for (const userDoc of usersSnap.docs) {
      const uid = userDoc.id;

      // Buscar alertas para hoy
      const alertsSnap = await db
        .collection('users').doc(uid)
        .collection('alerts')
        .where('date', '==', hoy)
        .get();

      if (alertsSnap.empty) continue;

      // Obtener tokens FCM del usuario
      const tokensSnap = await db
        .collection('users').doc(uid)
        .collection('fcmTokens')
        .get();

      const tokens = tokensSnap.docs.map((d) => d.data().token);
      if (tokens.length === 0) continue;

      // Enviar una notificación por cada alerta
      for (const alertDoc of alertsSnap.docs) {
        const alert = alertDoc.data();
        const response = await admin.messaging().sendEachForMulticast({
          tokens,
          notification: {
            title: '🔔 Recordatorio',
            body: alert.content,
          },
        });
        console.log(`FCM: ${response.successCount} éxitos, ${response.failureCount} fallos`);
      }
    }

    console.log('Notificaciones enviadas para:', hoy);
  }
);
```

> ⚠️ El formato del schedule debe ser **cron estándar** (`'0 9 * * *'`) o App Engine (`'every 24 hours'`). Formatos como `'every day 09:00'` no son válidos y harán que la función no se despliegue correctamente.

---

## 7. Estructura de Firestore esperada

```
users/
  {uid}/                        ← documento con campo uid (obligatorio)
    fcmTokens/
      {token}/                  ← documento con campo token
    alerts/
      {alertId}/                ← documento con campos date (YYYY-MM-DD) y content
```

> ⚠️ El documento `users/{uid}` debe existir como documento propio, no solo como contenedor de subcolecciones. Si no existe, `db.collection('users').get()` lo ignorará y no enviará notificaciones.

---

## 8. Desplegar

```bash
# Solo funciones
firebase deploy --only functions

# Solo hosting
firebase deploy --only hosting

# Todo (si tienes un script de build)
npm run deploy   # equivale a: npm run build && firebase deploy
```

---

## 9. Compatibilidad con dispositivos

| Plataforma | Navegador | ¿Funciona? |
|---|---|---|
| Android | Chrome | ✅ Sin necesidad de PWA |
| Android | Firefox | ✅ |
| Windows/Mac | Chrome, Edge, Firefox | ✅ |
| iPhone/iPad | Safari (PWA) | ✅ Solo como PWA instalada, iOS 16.4+ |
| iPhone/iPad | Chrome, Firefox | ❌ Apple no lo permite |
| iPhone/iPad | Safari (navegación privada) | ❌ No soportado |

Para instalar como PWA en iPhone: Safari → botón compartir → **Añadir a pantalla de inicio** → abrir desde el icono.

---

## 10. Errores comunes

| Error / Síntoma | Causa | Solución |
|---|---|---|
| La función se ejecuta pero no envía nada | El documento `users/{uid}` no existe | Crear el documento con `setDoc(..., { uid }, { merge: true })` |
| Llegan notificaciones duplicadas | Varios tokens FCM guardados | Borrar tokens anteriores antes de guardar el nuevo |
| No aparece el log `FCM: X éxitos` | La función no encuentra alertas o tokens | Añadir logs de debug para verificar cada paso |
| Notificación llega pero no se muestra | Falta `return` en `onBackgroundMessage` | Añadir `return` delante de `self.registration.showNotification(...)` |
| `every day HH:MM` no funciona como schedule | Formato inválido para Cloud Scheduler | Usar cron estándar: `'MM HH * * *'` |
