import {
    addDoc,
    collection,
    doc,
    serverTimestamp,
    increment,
    runTransaction,
} from "firebase/firestore";
import { db } from "../../config/firebase";

export default async function addHarvestUseCase(uid, gardenId, row, col, harvestData) {
    if (!uid) throw new Error("addHarvestUseCase: uid is required");
    if (!gardenId) throw new Error("addHarvestUseCase: gardenId is required");

    const harvestsColRef = collection(db, "users", uid, "gardens", gardenId, "harvests");

    const payload = {
        ...harvestData, // aquí debe venir plantId si quieres filtrar por cultivo
        position: { row, col },
        plotKey: `${row}_${col}`,
        harvestDate: serverTimestamp(),
    };

    // 1) Guardar cosecha
    const ref = await addDoc(harvestsColRef, payload);

    // 2) Actualizar totales usando transacción (más seguro que setDoc + increment)
    const totalsRef = doc(db, "users", uid, "gardens", gardenId, "stats", "totals");

    await runTransaction(db, async (tx) => {
        const totalsSnap = await tx.get(totalsRef);

        let currentUnits = 0;
        let currentGrams = 0;

        if (totalsSnap.exists()) {
            const data = totalsSnap.data() || {};
            currentUnits = Number(data.totalUnits || 0);
            currentGrams = Number(data.totalGrams || 0);
        }

        tx.set(totalsRef, {
            totalUnits: currentUnits + (payload.units || 0),
            totalGrams: currentGrams + (payload.totalGrams || 0),
        });
    });

    return ref.id;
}