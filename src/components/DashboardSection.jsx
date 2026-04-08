import { useState, useEffect, useMemo } from 'react';
import {
    IoLeafOutline,
    IoWarningOutline,
    IoWaterOutline,
    IoSunnyOutline,
    IoPartlySunnyOutline,
    IoCloudyOutline,
    IoRainyOutline,
    IoThunderstormOutline,
    IoGridOutline,
    IoStatsChartOutline,
    IoStarOutline,
} from 'react-icons/io5';
import HarvestChart from './HarvestChart';
import { getPlantsToWater } from '../utils/wateringUtils';
import useOpenMeteo from '../hooks/useOpenMeteo';
import getGardenHarvestsUseCase from '../services/gardens/getGardenHarvestsUseCase';

const OVIEDO = { lat: 43.3614, lon: -5.8593 };

const CONDITION_CONFIG = {
    sunny:        { icon: IoSunnyOutline,        label: 'Soleado',               color: 'bg-amber-400' },
    partlyCloudy: { icon: IoPartlySunnyOutline,  label: 'Parcialmente nublado',  color: 'bg-amber-300' },
    cloudy:       { icon: IoCloudyOutline,        label: 'Nublado',               color: 'bg-slate-400' },
    rainy:        { icon: IoRainyOutline,         label: 'Lluvia',                color: 'bg-blue-400'  },
    stormy:       { icon: IoThunderstormOutline,  label: 'Tormenta',              color: 'bg-purple-400'},
};

const DashboardSection = ({ uid, gardens, alerts = [] }) => {
    const today = new Date().toISOString().split('T')[0];

    // — KPIs básicos —
    const pendingWater = getPlantsToWater(gardens).length;
    const pendingAlerts = alerts.filter((a) => a.date >= today).length;

    // — Tiempo (7 días para calcular racha) —
    const { weatherData } = useOpenMeteo({ latitude: OVIEDO.lat, longitude: OVIEDO.lon, daysAhead: 1, pastDays: 7 });
    const todayWeather = weatherData[today];
    const weatherCfg = todayWeather ? (CONDITION_CONFIG[todayWeather.condition] ?? CONDITION_CONFIG.cloudy) : null;

    // — Peso total recolectado —
    const [totalGrams, setTotalGrams] = useState(null);
    useEffect(() => {
        if (!uid || !gardens.length) { setTotalGrams(0); return; }
        Promise.all(gardens.map((g) => getGardenHarvestsUseCase(uid, g.id)))
            .then((results) => {
                const total = results.flat().reduce((sum, h) => sum + (h.totalGrams ?? 0), 0);
                setTotalGrams(total);
            })
            .catch(() => setTotalGrams(0));
    }, [uid, gardens]);

    // — Número de plantas activas —
    const plantCount = useMemo(() => {
        let count = 0;
        for (const g of gardens) {
            for (const row of (g.plants ?? [])) {
                for (const cell of (row ?? [])) {
                    if (cell) count++;
                }
            }
        }
        return count;
    }, [gardens]);

    // — Cultivo más plantado —
    const mostPlanted = useMemo(() => {
        const counts = {};
        for (const g of gardens) {
            for (const row of (g.plants ?? [])) {
                for (const cell of (row ?? [])) {
                    if (cell?.name) {
                        const key = cell.name;
                        counts[key] = {
                            count: (counts[key]?.count ?? 0) + 1,
                            emoji: cell.emoji ?? '',
                        };
                    }
                }
            }
        }
        const entries = Object.entries(counts);
        if (!entries.length) return null;
        const [name, data] = entries.sort((a, b) => b[1].count - a[1].count)[0];
        return { name, count: data.count, emoji: data.emoji };
    }, [gardens]);

    // — Racha meteorológica (días consecutivos hacia atrás desde hoy) —
    const streak = useMemo(() => {
        const isRainy = (c) => c === 'rainy' || c === 'stormy';
        const isSunny = (c) => c === 'sunny' || c === 'partlyCloudy';
        const todayCond = weatherData[today]?.condition;
        if (!todayCond) return null;
        const todayRainy = isRainy(todayCond);
        let count = 0;
        let allSunny = true;
        for (let i = 0; i <= 7; i++) {
            const d = new Date(today + 'T12:00:00');
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const cond = weatherData[dateStr]?.condition;
            if (!cond) break;
            if (todayRainy ? isRainy(cond) : !isRainy(cond)) {
                count++;
                if (!isSunny(cond)) allSunny = false;
            } else {
                break;
            }
        }
        return { count, rainy: todayRainy, sunny: !todayRainy && allSunny };
    }, [weatherData, today]);

    // — Formato peso —
    const weightLabel = totalGrams === null
        ? '—'
        : totalGrams >= 1000
            ? `${(totalGrams / 1000).toFixed(1)} kg`
            : `${totalGrams} g`;

    const stats = [
        { label: 'Huertos activos',   value: gardens.length, icon: IoLeafOutline,      color: 'bg-[#5B7B7A]' },
        { label: 'Plantas activas',   value: plantCount,     icon: IoGridOutline,      color: 'bg-[#5B7B7A]' },
        {
            label: 'Alertas pendientes',
            value: pendingAlerts === 0 ? 'Sin alertas' : pendingAlerts,
            icon: IoWarningOutline,
            color: pendingAlerts === 0 ? 'bg-[#A17C6B]' : 'bg-orange-500',
            valueColor: pendingAlerts === 0 ? 'text-[#5B7B7A]' : 'text-orange-500',
            small: pendingAlerts === 0,
        },
        {
            label: 'Pendientes de regar',
            value: pendingWater === 0 ? 'Todo regado' : pendingWater,
            icon: IoWaterOutline,
            color: pendingWater === 0 ? 'bg-[#5B7B7A]' : 'bg-[#5B82A0]',
            valueColor: pendingWater === 0 ? 'text-[#5B7B7A]' : 'text-[#5B82A0]',
            small: pendingWater === 0,
        },
        { label: 'Total recolectado', value: weightLabel,    icon: IoStatsChartOutline, color: 'bg-[#A17C6B]' },
        {
            label: 'Cultivo más plantado',
            value: mostPlanted ? `${mostPlanted.emoji} ${mostPlanted.name}` : '—',
            mobileValue: mostPlanted?.emoji ?? '—',
            badge: mostPlanted?.count,
            icon: IoStarOutline,
            color: 'bg-amber-500',
            small: !!mostPlanted,
        },
        {
            label: weatherCfg ? weatherCfg.label : 'Tiempo hoy',
            value: todayWeather ? `${todayWeather.tempMax}°C` : '—',
            icon: weatherCfg ? weatherCfg.icon : IoSunnyOutline,
            color: weatherCfg ? weatherCfg.color : 'bg-[#CEB5A7]',
        },
        {
            label: streak
                ? streak.rainy
                    ? 'Días lloviendo seguidos'
                    : streak.sunny && streak.count >= 3
                        ? 'Días de sol seguidos'
                        : 'Días sin llover'
                : 'Sin datos',
            value: streak ? streak.count : '—',
            icon: streak?.rainy ? IoRainyOutline : IoSunnyOutline,
            color: streak
                ? streak.rainy ? 'bg-blue-400' : 'bg-amber-400'
                : 'bg-[#CEB5A7]',
        },
    ];

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                {stats.map((stat, index) => (
                    <div
                        key={index}
                        className="bg-white border border-[#CEB5A7]/40 rounded-xl p-3 hover:shadow-md hover:border-[#5B7B7A]/50 transition-all group flex items-center gap-3"
                    >
                        <div className={`w-9 h-9 ${stat.color} rounded-lg flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                            <stat.icon className="w-4 h-4 text-white" />
                        </div>
                        <div className="min-w-0">
                            <div className={`flex items-center gap-1.5 font-bold leading-tight ${stat.small ? 'text-sm' : 'text-lg'} ${stat.valueColor ?? 'text-[#5B7B7A]'}`}>
                                {stat.mobileValue
                                    ? <><span className="truncate sm:hidden">{stat.mobileValue}</span><span className="truncate hidden sm:inline">{stat.value}</span></>
                                    : <span className="truncate">{stat.value}</span>
                                }
                                {stat.badge && (
                                    <span className="shrink-0 text-[10px] font-bold bg-amber-100 text-amber-700 rounded-full px-1.5 py-0.5 leading-none">
                                        ×{stat.badge}
                                    </span>
                                )}
                            </div>
                            <p className="text-[10px] text-[#A17C6B] font-medium leading-tight">{stat.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {gardens.length > 0 && <HarvestChart uid={uid} gardens={gardens} />}
        </div>
    );
};

export default DashboardSection;
