import { deleteDoc, doc } from "firebase/firestore";
import { db } from "../../config/firebase";

export default async function deleteGardenUseCase(uid, gardenId) {
  if (!uid) throw new Error("deleteGardenUseCase: uid is required");
  if (!gardenId) throw new Error("deleteGardenUseCase: gardenId is required");

  const ref = doc(db, "users", uid, "gardens", gardenId);
  await deleteDoc(ref);
}