import { useState, useEffect, useMemo } from 'react';
import {
    ComposedChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { IoStatsChartOutline } from 'react-icons/io5';
import SelectInput from './SelectInput';
import getGardenHarvestsUseCase from '../services/gardens/getGardenHarvestsUseCase';

// ─── Tooltip personalizado ────────────────────────────────────────────────────

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white border-2 border-[#CEB5A7]/40 rounded-2xl shadow-xl px-4 py-3 text-sm">
            <p className="font-bold text-[#5B7B7A] mb-2">{label}</p>
            {payload.map((entry) => (
                <div key={entry.name} className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: entry.color }} />
                    <span className="text-[#A17C6B]">{entry.name}:</span>
                    <span className="font-semibold text-[#3D5A59]">{entry.value} kg</span>
                </div>
            ))}
        </div>
    );
};

// ─── Componente principal ─────────────────────────────────────────────────────

const HarvestChart = ({ uid, gardens }) => {
    const [selectedGardenId, setSelectedGardenId] = useState(gardens[0]?.id ?? null);
    const [selectedPlantId, setSelectedPlantId] = useState(null);
    const [harvests, setHarvests] = useState([]);
    const [loading, setLoading] = useState(false);

    const selectedGarden = gardens.find((g) => g.id === selectedGardenId);

    // Planta por defecto: la más plantada en el huerto seleccionado
    const defaultPlantId = useMemo(() => {
        if (!selectedGarden) return null;
        const counts = {};
        selectedGarden.plants.flat().forEach((cell) => {
            if (cell?.plantName) counts[cell.plantName] = (counts[cell.plantName] || 0) + 1;
        });
        return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
    }, [selectedGarden]);

    // Plantas únicas encontradas en las cosechas (agrupadas por nombre)
    const plants = useMemo(() => {
        const map = new Map();
        harvests.forEach((h) => {
            if (h.plantName && !map.has(h.plantName)) {
                map.set(h.plantName, { id: h.plantName, name: h.plantName, emoji: h.plantEmoji });
            }
        });
        return Array.from(map.values());
    }, [harvests]);

    // Cargar cosechas al cambiar de huerto
    useEffect(() => {
        if (!uid || !selectedGardenId) return;
        setLoading(true);
        setHarvests([]);
        setSelectedPlantId(null);
        getGardenHarvestsUseCase(uid, selectedGardenId)
            .then(setHarvests)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [uid, selectedGardenId]);

    // Seleccionar planta por defecto cuando cargan las cosechas
    useEffect(() => {
        if (plants.length === 0) return;
        const preferred = defaultPlantId && plants.find((p) => p.id === defaultPlantId);
        setSelectedPlantId(preferred ? defaultPlantId : plants[0].id);
    }, [plants, defaultPlantId]);

    // Procesar datos para la gráfica
    const chartData = useMemo(() => {
        const filtered = harvests.filter((h) => h.plantName === selectedPlantId);
        const byDate = {};
        filtered.forEach((h) => {
            const date = h.harvestDate?.toDate?.() ?? new Date(h.harvestDate);
            const key = date.toISOString().split('T')[0];
            byDate[key] = (byDate[key] || 0) + (h.totalGrams || 0);
        });
        let accumulated = 0;
        return Object.entries(byDate)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, grams]) => {
                accumulated += grams;
                return {
                    fecha: new Date(date + 'T12:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }),
                    Diario: Math.round(grams) / 1000,
                    Acumulado: Math.round(accumulated) / 1000,
                };
            });
    }, [harvests, selectedPlantId]);

const gardenOptions = gardens.map((g) => ({ value: g.id, label: g.name ?? g.id }));
    const plantOptions = plants.map((p) => ({ value: p.id, label: `${p.emoji ?? ''} ${p.name}`.trim() }));
    const selectedPlant = plants.find((p) => p.id === selectedPlantId);
    const hasData = chartData.length > 0;

    return (
        <div className="bg-white border-2 border-[#CEB5A7]/40 rounded-3xl p-6">

            {/* Cabecera */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#E0F2E9] rounded-xl flex items-center justify-center">
                        <IoStatsChartOutline className="w-5 h-5 text-[#5B7B7A]" />
                    </div>
                    <div>
                        <h3 className="font-bold text-[#5B7B7A] text-base">Producción de cosechas</h3>
                        <p className="text-xs text-[#A17C6B]">Peso diario y acumulado en kg</p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-3">
                    {gardens.length > 1 && (
                        <div className="w-44">
                            <SelectInput
                                value={selectedGardenId}
                                onChange={setSelectedGardenId}
                                options={gardenOptions}
                            />
                        </div>
                    )}
                    <div className="w-52">
                        <SelectInput
                            value={selectedPlantId ?? ''}
                            onChange={setSelectedPlantId}
                            options={plantOptions}
                            placeholder="Sin cosechas"
                            disabled={plantOptions.length === 0}
                        />
                    </div>
                </div>
            </div>

            {/* Gráfica */}
            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="w-8 h-8 rounded-full border-2 border-[#5B7B7A] border-t-transparent animate-spin" />
                </div>
            ) : !hasData ? (
                <div className="flex flex-col items-center justify-center h-64 gap-3">
                    <div className="w-14 h-14 bg-[#E0F2E9] rounded-2xl flex items-center justify-center">
                        <IoStatsChartOutline className="w-7 h-7 text-[#5B7B7A]" />
                    </div>
                    <p className="text-[#5B7B7A] font-semibold">Sin datos de cosecha</p>
                    <p className="text-xs text-[#A17C6B]">
                        {plantOptions.length === 0
                            ? 'Registra tu primera cosecha para ver la gráfica'
                            : `No hay cosechas registradas para ${selectedPlant?.name ?? 'este cultivo'}`}
                    </p>
                </div>
            ) : (
                <ResponsiveContainer width="100%" height={300}>
                    <ComposedChart data={chartData} margin={{ top: 8, right: 24, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#CEB5A7" strokeOpacity={0.3} />
                        <XAxis
                            dataKey="fecha"
                            tick={{ fontSize: 11, fill: '#A17C6B' }}
                            tickLine={false}
                            axisLine={{ stroke: '#CEB5A7', strokeOpacity: 0.4 }}
                        />
                        <YAxis
                            yAxisId="left"
                            tick={{ fontSize: 11, fill: '#5B7B7A' }}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(v) => `${v} kg`}
                        />
                        <YAxis
                            yAxisId="right"
                            orientation="right"
                            tick={{ fontSize: 11, fill: '#A17C6B' }}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(v) => `${v} kg`}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend
                            wrapperStyle={{ fontSize: 12, color: '#5B7B7A', paddingTop: 12 }}
                        />
                        <Line
                            yAxisId="left"
                            type="monotone"
                            dataKey="Diario"
                            stroke="#5B7B7A"
                            strokeWidth={2}
                            dot={{ r: 3, fill: '#5B7B7A', strokeWidth: 0 }}
                            activeDot={{ r: 5 }}
                        />
                        <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="Acumulado"
                            stroke="#A17C6B"
                            strokeWidth={2}
                            dot={{ r: 3, fill: '#A17C6B', strokeWidth: 0 }}
                            activeDot={{ r: 5 }}
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            )}
        </div>
    );
};

export default HarvestChart;
