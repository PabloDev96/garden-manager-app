import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  updateDoc,
  writeBatch,
  runTransaction,
} from "firebase/firestore";
import { db } from "../../config/firebase";

/**
 * Elimina el cultivo de una parcela.
 * - Resta de stats/totals lo cosechado por ese plantId (sin bajar de 0)
 * - Vacía la parcela (plants.{row_col} -> null)
 * - Opcional: si deleteHistory=true, borra también el historial (harvests) de ese plantId
 *
 * @returns {Promise<{ removedUnits: number, removedGrams: number }>}
 */
export default async function removeCropUseCase(uid, gardenId, row, col, options = {}) {
  const { deleteHistory = false } = options;

  if (!uid) throw new Error("removeCropUseCase: uid is required");
  if (!gardenId) throw new Error("removeCropUseCase: gardenId is required");
  if (row === undefined || col === undefined) throw new Error("removeCropUseCase: row/col are required");

  const gardenRef = doc(db, "users", uid, "gardens", gardenId);
  const key = `${row}_${col}`;

  // 1) Leer cultivo actual en esa casilla para obtener plantId
  const gardenSnap = await getDoc(gardenRef);
  const gardenData = gardenSnap.data() || {};
  const currentPlant = gardenData?.plants?.[key] ?? null;

  // Si ya está vacío, aseguramos null y salimos
  if (!currentPlant?.id) {
    await updateDoc(gardenRef, {
      [`plants.${key}`]: null,
      updatedAt: serverTimestamp(),
    });
    return { removedUnits: 0, removedGrams: 0 };
  }

  const plantId = currentPlant.id;

  // 2) Traer cosechas de ese plantId (para saber cuánto restar)
  const harvestsColRef = collection(db, "users", uid, "gardens", gardenId, "harvests");
  const harvestsQ = query(harvestsColRef, where("plantId", "==", plantId));
  const harvestsSnap = await getDocs(harvestsQ);

  let removedUnits = 0;
  let removedGrams = 0;

  harvestsSnap.docs.forEach((d) => {
    const data = d.data() || {};
    removedUnits += data.units || 0;
    removedGrams += data.totalGrams || 0;
  });

  // 3) Restar en stats/totals con TRANSACCIÓN (clamp a 0)
  const totalsRef = doc(db, "users", uid, "gardens", gardenId, "stats", "totals");

  await runTransaction(db, async (tx) => {
    const totalsSnap = await tx.get(totalsRef);

    // ✅ CORREGIDO: Si no existe, recalcular desde todas las cosechas
    let currentUnits = 0;
    let currentGrams = 0;

    if (totalsSnap.exists()) {
      // Si existe, usar los valores actuales
      const data = totalsSnap.data() || {};
      currentUnits = Number(data.totalUnits || 0);
      currentGrams = Number(data.totalGrams || 0);
    } else {
      // Si NO existe, recalcular desde TODAS las cosechas
      const allHarvestsSnap = await getDocs(harvestsColRef);
      allHarvestsSnap.docs.forEach((d) => {
        const data = d.data() || {};
        currentUnits += data.units || 0;
        currentGrams += data.totalGrams || 0;
      });
    }

    // Restar lo del plantId que vamos a eliminar
    const nextUnits = Math.max(0, currentUnits - (removedUnits || 0));
    const nextGrams = Math.max(0, currentGrams - (removedGrams || 0));

    tx.set(totalsRef, { totalUnits: nextUnits, totalGrams: nextGrams });
  });

  // 4) Vaciar la parcela
  await updateDoc(gardenRef, {
    [`plants.${key}`]: null,
    updatedAt: serverTimestamp(),
  });

  // 5) Opcional: borrar historial en BD (harvests) de ese plantId
  if (deleteHistory && harvestsSnap.size > 0) {
    const docs = harvestsSnap.docs;

    // Batch máximo 500 ops -> chunk
    for (let i = 0; i < docs.length; i += 450) {
      const batch = writeBatch(db);
      const chunk = docs.slice(i, i + 450);
      chunk.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
  }

  return { removedUnits, removedGrams };
}