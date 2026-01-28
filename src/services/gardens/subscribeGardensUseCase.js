import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../../config/firebase";

function toPlantsGrid(plantsMap, rows, cols) {
  const grid = Array.from({ length: rows }, () => Array(cols).fill(null));
  if (!plantsMap) return grid;

  for (const [key, value] of Object.entries(plantsMap)) {
    const [rStr, cStr] = key.split("_");
    const r = Number(rStr);
    const c = Number(cStr);
    if (Number.isInteger(r) && Number.isInteger(c) && grid[r]?.[c] !== undefined) {
      grid[r][c] = value;
    }
  }
  return grid;
}

export default function subscribeGardensUseCase(uid, onChange, onError) {
  if (!uid) throw new Error("subscribeGardensUseCase: uid is required");

  const colRef = collection(db, "users", uid, "gardens");
  const q = query(colRef, orderBy("createdAt", "desc"));

  return onSnapshot(
    q,
    (snap) => {
      const gardens = snap.docs.map((d) => {
        const data = d.data();
        const rows = data?.grid?.rows ?? 0;
        const cols = data?.grid?.columns ?? 0;

        // Firestore guarda plants como MAP, UI usa plants como GRID 2D
        const plantsGrid = toPlantsGrid(data.plants, rows, cols);

        return {
          id: d.id,
          ...data,
          plants: plantsGrid,
        };
      });

      onChange(gardens);
    },
    (err) => {
      if (onError) onError(err);
      else console.error(err);
    }
  );
}