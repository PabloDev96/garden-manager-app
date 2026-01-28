import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../../config/firebase";

export default async function addGardenUseCase(uid, garden) {
  if (!uid) throw new Error("addGardenUseCase: uid is required");
  if (!garden) throw new Error("addGardenUseCase: garden is required");

  const colRef = collection(db, "users", uid, "gardens");

  // Firestore genera el id
  const payload = {
  ...garden,
  plants: garden.plants && !Array.isArray(garden.plants) ? garden.plants : {}, // <- map
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
};

  // si viene con id/createdAt de cliente, los quitamos por limpieza
  delete payload.id;

  const ref = await addDoc(colRef, payload);
  return ref.id;
}