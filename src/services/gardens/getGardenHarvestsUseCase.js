import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../../config/firebase";

export default async function getGardenHarvestsUseCase(uid, gardenId) {
    const colRef = collection(db, "users", uid, "gardens", gardenId, "harvests");
    const q = query(colRef, orderBy("harvestDate", "asc"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
