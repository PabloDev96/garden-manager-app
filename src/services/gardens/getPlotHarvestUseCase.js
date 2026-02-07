import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { db } from "../../config/firebase";

/**
 * Obtiene el historial de cosechas de una parcela.
 * Si pasas plantId, SOLO devuelve las cosechas del cultivo actual (sin borrar historial antiguo).
 *
 * ⚠️ Requiere índice compuesto si usas:
 * where(plotKey) + where(plantId) + orderBy(harvestDate)
 */
export default async function getPlotHarvestsUseCase(uid, gardenId, row, col, plantId) {
  if (!uid) throw new Error("getPlotHarvestsUseCase: uid is required");
  if (!gardenId) throw new Error("getPlotHarvestsUseCase: gardenId is required");
  if (row === undefined || col === undefined) {
    throw new Error("getPlotHarvestsUseCase: row/col are required");
  }

  const colRef = collection(db, "users", uid, "gardens", gardenId, "harvests");
  const plotKey = `${row}_${col}`;

  const q = plantId
    ? query(
        colRef,
        where("plotKey", "==", plotKey),
        where("plantId", "==", plantId),
        orderBy("harvestDate", "desc")
      )
    : query(colRef, where("plotKey", "==", plotKey), orderBy("harvestDate", "desc"));

  const snap = await getDocs(q);

  return snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }));
}