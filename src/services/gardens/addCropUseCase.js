import { doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "../../config/firebase";

/**
 * Añade/edita un cultivo en una parcela.
 * - Si la parcela está vacía (null): crea un plantId NUEVO (evita heredar cosechas antiguas).
 * - Si ya hay cultivo: mantiene el plantId existente (edición).
 */
export default async function addCropUseCase(uid, gardenId, row, col, plantData) {
  if (!uid) throw new Error("addCropUseCase: uid is required");
  if (!gardenId) throw new Error("addCropUseCase: gardenId is required");
  if (row === undefined || col === undefined) {
    throw new Error("addCropUseCase: row/col are required");
  }

  const ref = doc(db, "users", uid, "gardens", gardenId);
  const key = `${row}_${col}`;

  // 1) Leer estado actual de la casilla para decidir si es "nuevo" o "editar"
  const snap = await getDoc(ref);
  const gardenData = snap.data() || {};
  const currentPlant = gardenData?.plants?.[key] ?? null;

  const isEmpty = currentPlant === null; // (porque en removeCrop dejamos null)
  const existingId = currentPlant?.id;

  // 2) Decidir plantId
  // - si está vacía -> NUEVO
  // - si no -> mantener id existente (si lo hay), o usar el que venga
  const plantId = isEmpty
    ? Date.now().toString()
    : (existingId ?? plantData?.id ?? Date.now().toString());

  // 3) Guardar
  await updateDoc(ref, {
    [`plants.${key}`]: {
      ...plantData,
      id: plantId,
    },
    updatedAt: serverTimestamp(),
  });

  return plantId;
}