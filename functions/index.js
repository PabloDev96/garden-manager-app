const { onSchedule } = require('firebase-functions/v2/scheduler');
const admin = require('firebase-admin');
admin.initializeApp();

exports.enviarRecordatoriosHoy = onSchedule(
    { schedule: 'every day 15:15', timeZone: 'Europe/Madrid' },
    async () => {
        const db = admin.firestore();
        const hoy = new Date().toISOString().split('T')[0];

        const usersSnap = await db.collection('users').get();

        for (const userDoc of usersSnap.docs) {
            const uid = userDoc.id;

            const alertsSnap = await db
                .collection('users').doc(uid)
                .collection('alerts')
                .where('date', '==', hoy)
                .get();

            if (alertsSnap.empty) continue;

            const tokensSnap = await db
                .collection('users').doc(uid)
                .collection('fcmTokens')
                .get();

            const tokens = tokensSnap.docs.map((d) => d.data().token);
            if (tokens.length === 0) continue;

            for (const alertDoc of alertsSnap.docs) {
                const alert = alertDoc.data();
                await admin.messaging().sendEachForMulticast({
                    tokens,
                    notification: {
                        title: '🔔 Recordatorio de huerto',
                        body: alert.content,
                    },
                });
            }
        }

        console.log('Recordatorios enviados para:', hoy);
    }
);