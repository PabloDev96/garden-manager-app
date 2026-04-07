/**
 * Devuelve true si la planta necesita riego en la fecha indicada.
 * Referencia: lastWatered ?? plantedDate
 */
export function needsWatering(plant, targetDate = new Date()) {
  if (!plant?.wateringDays || plant.wateringDays <= 0) return false;
  const ref = plant.lastWatered ?? plant.plantedDate;
  if (!ref) return false;

  const refDate = new Date(ref);
  refDate.setHours(0, 0, 0, 0);
  const next = new Date(refDate);
  next.setDate(next.getDate() + plant.wateringDays);

  const target = new Date(targetDate);
  target.setHours(0, 0, 0, 0);

  return target >= next;
}

/**
 * Devuelve la fecha del próximo riego para una planta.
 */
export function getNextWateringDate(plant) {
  if (!plant?.wateringDays || plant.wateringDays <= 0) return null;
  const ref = plant.lastWatered ?? plant.plantedDate;
  if (!ref) return null;

  const d = new Date(ref);
  d.setDate(d.getDate() + plant.wateringDays);
  return d;
}

/**
 * Devuelve todas las plantas de todos los huertos que necesitan riego en targetDate.
 * Cada elemento: { garden, plant, row, col }
 */
export function getPlantsToWater(gardens, targetDate = new Date()) {
  const result = [];
  for (const garden of gardens) {
    for (let r = 0; r < (garden.plants?.length ?? 0); r++) {
      for (let c = 0; c < (garden.plants[r]?.length ?? 0); c++) {
        const plant = garden.plants[r][c];
        if (plant && needsWatering(plant, targetDate)) {
          result.push({ garden, plant, row: r, col: c });
        }
      }
    }
  }
  return result;
}
