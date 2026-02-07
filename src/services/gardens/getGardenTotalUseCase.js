import { doc, getDoc, collection, getDocs, setDoc } from "firebase/firestore";
import { db } from "../../config/firebase";

/**
 * Lee los totales agregados del huerto.
 * Si no existe el doc stats/totals, lo calcula desde todas las cosechas y lo guarda.
 * Devuelve siempre { totalUnits, totalGrams }.
 */
export default async function getGardenTotalsUseCase(uid, gardenId) {
  if (!uid) throw new Error("getGardenTotalsUseCase: uid is required");
  if (!gardenId) throw new Error("getGardenTotalsUseCase: gardenId is required");

  const totalsRef = doc(db, "users", uid, "gardens", gardenId, "stats", "totals");
  const snap = await getDoc(totalsRef);

  // Si existe, devolver directamente
  if (snap.exists()) {
    const data = snap.data() || {};
    return {
      totalUnits: typeof data.totalUnits === "number" ? data.totalUnits : 0,
      totalGrams: typeof data.totalGrams === "number" ? data.totalGrams : 0,
    };
  }

  // Si NO existe, recalcular desde todas las cosechas
  const harvestsRef = collection(db, "users", uid, "gardens", gardenId, "harvests");
  const harvestsSnap = await getDocs(harvestsRef);

  let totalUnits = 0;
  let totalGrams = 0;

  harvestsSnap.docs.forEach((d) => {
    const data = d.data() || {};
    totalUnits += data.units || 0;
    totalGrams += data.totalGrams || 0;
  });

  // Guardar el doc para futuras lecturas
  await setDoc(totalsRef, { totalUnits, totalGrams }, { merge: true });

  return { totalUnits, totalGrams };
}