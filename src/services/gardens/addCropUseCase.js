import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "../../config/firebase";

export default async function addCropUseCase(uid, gardenId, row, col, plantData) {
  if (!uid) throw new Error("addCropUseCase: uid is required");
  if (!gardenId) throw new Error("addCropUseCase: gardenId is required");

  const ref = doc(db, "users", uid, "gardens", gardenId);
  const key = `${row}_${col}`;

  await updateDoc(ref, {
    [`plants.${key}`]: {
      ...plantData,
      id: plantData?.id ?? Date.now().toString(),
    },
    updatedAt: serverTimestamp(),
  });
}