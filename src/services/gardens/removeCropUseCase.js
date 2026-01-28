import { deleteField, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "../../config/firebase";

export default async function removeCropUseCase(uid, gardenId, row, col) {
  if (!uid) throw new Error("removeCropUseCase: uid is required");
  if (!gardenId) throw new Error("removeCropUseCase: gardenId is required");

  const ref = doc(db, "users", uid, "gardens", gardenId);
  const key = `${row}_${col}`;

  await updateDoc(ref, {
    [`plants.${key}`]: deleteField(),
    updatedAt: serverTimestamp(),
  });
}