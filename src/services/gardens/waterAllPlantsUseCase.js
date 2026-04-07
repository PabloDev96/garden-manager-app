import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';

/**
 * Registra el riego de varias parcelas en un solo write a Firestore.
 * @param {string} uid
 * @param {string} gardenId
 * @param {Array<{row: number, col: number}>} plants - parcelas a regar
 */
export default async function waterAllPlantsUseCase(uid, gardenId, plants) {
  if (!plants?.length) return;
  const ref = doc(db, 'users', uid, 'gardens', gardenId);
  const today = new Date().toISOString().split('T')[0];
  const updates = { updatedAt: serverTimestamp() };
  for (const { row, col } of plants) {
    updates[`plants.${row}_${col}.lastWatered`] = today;
  }
  await updateDoc(ref, updates);
  return today;
}
