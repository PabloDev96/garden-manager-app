import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';

/**
 * Registra el riego de una parcela concreta (actualiza lastWatered a hoy).
 */
export default async function waterPlantUseCase(uid, gardenId, row, col) {
  const ref = doc(db, 'users', uid, 'gardens', gardenId);
  const key = `${row}_${col}`;
  const today = new Date().toISOString().split('T')[0];
  await updateDoc(ref, {
    [`plants.${key}.lastWatered`]: today,
    updatedAt: serverTimestamp(),
  });
  return today;
}
