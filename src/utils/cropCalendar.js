// ─── Calendario de cultivos ───────────────────────────────────────────────────
// Fuente: calendario agrícola estacional (zona norte de España)
// Meses: 1 = enero … 12 = diciembre
// prep    = preparación de la tierra
// sow     = siembra
// harvest = recolección

export const CROP_CALENDAR = {
    'acelga':      { prep: [],        sow: [3, 4],          harvest: [1, 2, 5, 6, 7, 8, 9, 10, 11, 12] },
    'ajo':         { prep: [],        sow: [1, 11, 12],     harvest: [8, 9] },
    'berenjena':   { prep: [2],       sow: [3, 4],          harvest: [6, 7, 8, 9, 10] },
    'berza':       { prep: [1,2,3,8], sow: [3,4,5,6,7,8],  harvest: [1, 2, 3, 4, 6, 7, 8, 9, 10, 11, 12] },
    'calabacín':   { prep: [],        sow: [3, 4, 5],       harvest: [8, 9, 10] },
    'calabaza':    { prep: [],        sow: [3, 4, 5],       harvest: [8, 9, 10] },
    'cebolla':     { prep: [1, 12],   sow: [3, 4],          harvest: [8, 9, 10] },
    'coliflor':    { prep: [2],       sow: [3, 4],          harvest: [7] },
    'escarola':    { prep: [],        sow: [11, 12],        harvest: [9, 10] },
    'espinaca':    { prep: [2],       sow: [4],             harvest: [6] },
    'guisante':    { prep: [],        sow: [1, 11, 12],     harvest: [3, 4, 5, 6] },
    'haba':        { prep: [],        sow: [4, 5],          harvest: [9, 10] },
    'judía verde': { prep: [],        sow: [3, 4, 5],       harvest: [6, 7, 8, 9] },
    'lechuga':     { prep: [1, 2, 3], sow: [3, 4, 5],       harvest: [6, 7, 8, 9] },
    'maíz':        { prep: [],        sow: [4, 5],          harvest: [9, 10, 11] },
    'nabo':        { prep: [],        sow: [8, 9, 10],      harvest: [1, 2, 11, 12] },
    'patata':      { prep: [],        sow: [3, 4],          harvest: [8, 9] },
    'perejil':     { prep: [],        sow: [4, 5],          harvest: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
    'pimiento':    { prep: [1, 2],    sow: [3, 4, 5],       harvest: [7, 8, 9] },
    'puerro':      { prep: [2, 3, 4], sow: [5, 6, 7, 8],   harvest: [1, 2, 8, 9, 10, 11, 12] },
    'remolacha':   { prep: [],        sow: [8, 9, 10],      harvest: [1, 2, 11, 12] },
    'repollo':     { prep: [2],       sow: [3, 4, 5],       harvest: [7] },
    'tomate':      { prep: [1, 2, 3], sow: [3, 4, 5],       harvest: [7, 8, 9] },
    'zanahoria':   { prep: [2, 3],    sow: [3, 4, 5],       harvest: [6, 7, 8, 9] },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const normalize = (s) =>
    s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

const NORMALIZED_CALENDAR = Object.fromEntries(
    Object.entries(CROP_CALENDAR).map(([k, v]) => [normalize(k), v])
);

/**
 * Devuelve la entrada del calendario para un cultivo por su nombre.
 * Insensible a mayúsculas y acentos.
 */
export function getCalendarEntry(plantName) {
    if (!plantName) return null;
    return NORMALIZED_CALENDAR[normalize(plantName)] ?? null;
}

/**
 * Dado un array de cultivos plantados y un mes (1-12),
 * devuelve qué acciones corresponden este mes para cada cultivo.
 *
 * @param {Array<{name: string, emoji: string}>} plantedCrops
 * @param {number} month — 1 a 12
 * @returns {{ prep: Array, sow: Array, harvest: Array }}
 */
export function getMonthTasksForCrops(plantedCrops, month) {
    const prep = [];
    const sow = [];
    const harvest = [];

    for (const crop of plantedCrops) {
        const entry = getCalendarEntry(crop.name);
        if (!entry) continue;
        if (entry.prep.includes(month))    prep.push(crop);
        if (entry.sow.includes(month))     sow.push(crop);
        if (entry.harvest.includes(month)) harvest.push(crop);
    }

    return { prep, sow, harvest };
}
