const { onSchedule } = require('firebase-functions/v2/scheduler');
const admin = require('firebase-admin');
admin.initializeApp();

exports.enviarRecordatoriosHoy = onSchedule(
    { schedule: '00 08 * * *', timeZone: 'Europe/Madrid' },
    async () => {
        const db = admin.firestore();
        const hoy = new Date().toISOString().split('T')[0];

        const usersSnap = await db.collection('users').get();
        console.log(`Usuarios encontrados: ${usersSnap.docs.length}`);

        for (const userDoc of usersSnap.docs) {
            const uid = userDoc.id;
            console.log(`Procesando uid: ${uid}`);

            const alertsSnap = await db
                .collection('users').doc(uid)
                .collection('alerts')
                .where('date', '==', hoy)
                .get();

            console.log(`Alertas para hoy (${hoy}): ${alertsSnap.docs.length}`);
            if (alertsSnap.empty) continue;

            const tokensSnap = await db
                .collection('users').doc(uid)
                .collection('fcmTokens')
                .get();

            const tokens = tokensSnap.docs.map((d) => d.data().token);
            console.log(`Tokens FCM: ${tokens.length}`);
            if (tokens.length === 0) continue;

            for (const alertDoc of alertsSnap.docs) {
                const alert = alertDoc.data();
                const response = await admin.messaging().sendEachForMulticast({
                    tokens,
                    notification: {
                        title: '🔔 Recordatorio de huerto',
                        body: alert.content,
                    },
                });
                console.log(`FCM: ${response.successCount} éxitos, ${response.failureCount} fallos`);
                response.responses.forEach((r, i) => {
                    if (!r.success) console.error(`Token[${i}] error:`, r.error);
                });
            }
        }

        console.log('Recordatorios enviados para:', hoy);
    }
);