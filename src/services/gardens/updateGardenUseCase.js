import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../../config/firebase";

export default async function updateGardenUseCase(uid, gardenId, data) {
  if (!uid) throw new Error("updateGardenUseCase: uid is required");
  if (!gardenId) throw new Error("updateGardenUseCase: gardenId is required");
  if (!data) throw new Error("updateGardenUseCase: data is required");

  const ref = doc(db, "users", uid, "gardens", gardenId);

  const payload = {
    ...data,
    updatedAt: serverTimestamp(),
  };

  // evitamos que se intente sobrescribir el id dentro del doc
  delete payload.id;

  await setDoc(ref, payload, { merge: true });
}