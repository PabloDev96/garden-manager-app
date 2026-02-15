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
 * - Siempre vacía la parcela (plants.{row_col} -> null)
 * - Si deleteHistory=true:
 *    - borra harvests de ESE plotKey+plantId
 *    - y resta esos valores en totals (clamp a 0)
 * - Si deleteHistory=false:
 *    - NO toca harvests
 *    - NO toca totals
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

  // 1) Leer cultivo actual
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
  const plotKey = key;

  // 2) Siempre vaciar parcela (esto NO borra historial)
  await updateDoc(gardenRef, {
    [`plants.${key}`]: null,
    updatedAt: serverTimestamp(),
  });

  // ✅ Si NO quieres borrar historial, aquí se acaba
  if (!deleteHistory) {
    return { removedUnits: 0, removedGrams: 0 };
  }

  // 3) Si deleteHistory=true -> traer cosechas SOLO de esa parcela + ese plantId
  const harvestsColRef = collection(db, "users", uid, "gardens", gardenId, "harvests");
  const harvestsQ = query(
    harvestsColRef,
    where("plotKey", "==", plotKey),
    where("plantId", "==", plantId)
  );

  const harvestsSnap = await getDocs(harvestsQ);

  let removedUnits = 0;
  let removedGrams = 0;

  harvestsSnap.docs.forEach((d) => {
    const data = d.data() || {};
    removedUnits += data.units || 0;
    removedGrams += data.totalGrams || 0;
  });

  // 4) Restar en totals con transacción (clamp a 0)
  const totalsRef = doc(db, "users", uid, "gardens", gardenId, "stats", "totals");

  await runTransaction(db, async (tx) => {
    const totalsSnap = await tx.get(totalsRef);

    let currentUnits = 0;
    let currentGrams = 0;

    if (totalsSnap.exists()) {
      const data = totalsSnap.data() || {};
      currentUnits = Number(data.totalUnits || 0);
      currentGrams = Number(data.totalGrams || 0);
    } else {
      // recalcular desde TODAS las cosechas
      const allHarvestsSnap = await getDocs(harvestsColRef);
      allHarvestsSnap.docs.forEach((d) => {
        const data = d.data() || {};
        currentUnits += data.units || 0;
        currentGrams += data.totalGrams || 0;
      });
    }

    const nextUnits = Math.max(0, currentUnits - removedUnits);
    const nextGrams = Math.max(0, currentGrams - removedGrams);

    tx.set(totalsRef, { totalUnits: nextUnits, totalGrams: nextGrams });
  });

  // 5) Borrar historial (harvest docs) en batches
  if (harvestsSnap.size > 0) {
    const docs = harvestsSnap.docs;
    for (let i = 0; i < docs.length; i += 450) {
      const batch = writeBatch(db);
      const chunk = docs.slice(i, i + 450);
      chunk.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
  }

  return { removedUnits, removedGrams };
}