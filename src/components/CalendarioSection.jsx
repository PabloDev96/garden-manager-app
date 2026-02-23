import React, { useState, useEffect, useRef } from 'react';
import Calendar from 'react-calendar';
import {
    IoSunnyOutline,
    IoRainyOutline,
    IoCloudyOutline,
    IoThunderstormOutline,
    IoPartlySunnyOutline,
    IoWaterOutline,
    IoLocationOutline,
    IoRefreshOutline,
    IoWarningOutline,
    IoSearchOutline,
    IoCloseOutline,
} from 'react-icons/io5';
import useOpenMeteo from '../utils/useOpenMeteo';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const toKey = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

const CONDITION_CONFIG = {
    sunny: { icon: IoSunnyOutline, color: 'text-amber-400', bg: 'bg-amber-50', label: 'Soleado' },
    partlyCloudy: { icon: IoPartlySunnyOutline, color: 'text-amber-300', bg: 'bg-amber-50/60', label: 'Parcialmente nublado' },
    cloudy: { icon: IoCloudyOutline, color: 'text-slate-400', bg: 'bg-slate-50', label: 'Nublado' },
    rainy: { icon: IoRainyOutline, color: 'text-blue-400', bg: 'bg-blue-50', label: 'Lluvia' },
    stormy: { icon: IoThunderstormOutline, color: 'text-purple-400', bg: 'bg-purple-50', label: 'Tormenta' },
};

const precipColor = (prob) => {
    if (prob >= 70) return 'bg-blue-500';
    if (prob >= 40) return 'bg-blue-300';
    if (prob >= 20) return 'bg-blue-200';
    return 'bg-blue-100';
};

// ─── Buscador de ciudades (Open-Meteo Geocoding API) ──────────────────────────

const CitySearch = ({ ubicacion, onSelect }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const debounceRef = useRef(null);
    const wrapperRef = useRef(null);

    // Cierra el desplegable al hacer clic fuera
    useEffect(() => {
        const handler = (e) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const search = (q) => {
        clearTimeout(debounceRef.current);
        if (!q.trim()) { setResults([]); setOpen(false); return; }

        debounceRef.current = setTimeout(async () => {
            setLoading(true);
            try {
                const res = await fetch(
                    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=6&language=es&format=json`
                );
                const data = await res.json();
                const items = (data.results ?? []).map((r) => ({
                    label: [r.name, r.admin1, r.country].filter(Boolean).join(', '),
                    lat: r.latitude,
                    lon: r.longitude,
                }));
                setResults(items);
                setOpen(items.length > 0);
            } catch {
                setResults([]);
            } finally {
                setLoading(false);
            }
        }, 350); // debounce 350ms para no saturar la API
    };

    const handleSelect = (item) => {
        onSelect(item);
        setQuery('');
        setResults([]);
        setOpen(false);
    };

    const handleClear = () => {
        setQuery('');
        setResults([]);
        setOpen(false);
    };

    return (
        <div ref={wrapperRef} className="relative">
            {/* Input de búsqueda */}
            <div className="flex items-center gap-2 bg-white border-2 border-[#CEB5A7]/40 rounded-xl px-3 py-2 min-w-[260px] focus-within:border-[#5B7B7A] transition-colors">
                {loading
                    ? <div className="w-4 h-4 rounded-full border-2 border-[#5B7B7A] border-t-transparent animate-spin shrink-0" />
                    : <IoSearchOutline className="w-4 h-4 text-[#5B7B7A] shrink-0" />
                }
                <input
                    type="text"
                    value={query}
                    onChange={(e) => { setQuery(e.target.value); search(e.target.value); }}
                    onFocus={() => results.length > 0 && setOpen(true)}
                    placeholder={ubicacion ? ubicacion.label : 'Buscar ciudad o pueblo…'}
                    className="flex-1 text-sm text-[#5B7B7A] placeholder-[#CEB5A7] bg-transparent outline-none"
                />
                {query && (
                    <button onClick={handleClear} className="shrink-0 text-[#CEB5A7] hover:text-[#A17C6B] transition-colors">
                        <IoCloseOutline className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Resultados */}
            {open && (
                <ul className="absolute top-full mt-1 left-0 right-0 bg-white border-2 border-[#CEB5A7]/40 rounded-xl shadow-lg z-50 overflow-hidden">
                    {results.map((item, i) => (
                        <li key={i}>
                            <button
                                onMouseDown={() => handleSelect(item)}
                                className="w-full text-left px-4 py-2.5 text-sm text-[#3D5A59] hover:bg-[#E0F2E9] flex items-center gap-2 transition-colors cursor-pointer"
                            >
                                <IoLocationOutline className="w-3.5 h-3.5 text-[#A17C6B] shrink-0" />
                                {item.label}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

// ─── WeatherTile ─────────────────────────────────────────────────────────────

const WeatherTile = ({ weather }) => {
    if (!weather) return null;
    const cfg = CONDITION_CONFIG[weather.condition] ?? CONDITION_CONFIG.cloudy;
    const Icon = cfg.icon;
    return (
        <div className="flex flex-col items-center gap-0.5 mt-0.5 w-full">
            <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
            <div className="w-4 h-1 rounded-full bg-slate-100 overflow-hidden">
                <div
                    className={`h-full rounded-full ${precipColor(weather.precipProb)} transition-all`}
                    style={{ width: `${weather.precipProb}%` }}
                />
            </div>
        </div>
    );
};

// ─── DayDetail ────────────────────────────────────────────────────────────────

const DayDetail = ({ date, weather }) => {
    if (!date) return (
        <div className="flex flex-col items-center justify-center h-full text-center p-6 gap-3">
            <div className="w-14 h-14 rounded-2xl bg-[#E0F2E9] flex items-center justify-center">
                <IoSunnyOutline className="w-7 h-7 text-[#5B7B7A]" />
            </div>
            <p className="text-[#5B7B7A] font-semibold">Selecciona un día</p>
            <p className="text-xs text-[#A17C6B]">Ver pronóstico y planificar tareas</p>
        </div>
    );

    const cfg = weather ? (CONDITION_CONFIG[weather.condition] ?? CONDITION_CONFIG.cloudy) : null;
    const Icon = cfg?.icon ?? IoSunnyOutline;
    const dayLabel = date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

    return (
        <div className="flex flex-col gap-4 p-5 h-full">
            <div>
                <p className="text-xs font-semibold text-[#A17C6B] uppercase tracking-widest mb-0.5">Pronóstico</p>
                <p className="text-[#5B7B7A] font-bold text-base capitalize">{dayLabel}</p>
            </div>

            {weather ? (
                <>
                    {/* Condición principal */}
                    <div className={`rounded-2xl p-4 flex items-center gap-4 ${cfg.bg}`}>
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white/70">
                            <Icon className={`w-6 h-6 ${cfg.color}`} />
                        </div>
                        <div>
                            <p className="font-bold text-[#3D5A59] text-sm">{cfg.label}</p>
                            <p className="text-xs text-[#A17C6B]">{weather.tempMin}° — {weather.tempMax}°C</p>
                        </div>
                    </div>

                    {/* Precipitación */}
                    <div className="bg-white rounded-2xl p-4 border border-[#CEB5A7]/30">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <IoWaterOutline className="w-4 h-4 text-blue-400" />
                                <span className="text-xs font-semibold text-[#5B7B7A]">Probabilidad de lluvia</span>
                            </div>
                            <span className="text-sm font-bold text-blue-500">{weather.precipProb}%</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-blue-100 overflow-hidden">
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-blue-300 to-blue-500 transition-all duration-500"
                                style={{ width: `${weather.precipProb}%` }}
                            />
                        </div>
                        <p className="text-xs text-[#A17C6B] mt-2">
                            {weather.precipProb >= 70 ? '🌧 Alta probabilidad — planifica el riego' :
                                weather.precipProb >= 40 ? '🌦 Posible lluvia — revisa tus huertos' :
                                    weather.precipProb >= 20 ? '⛅ Baja probabilidad de lluvia' :
                                        '☀️ Sin lluvia prevista'}
                        </p>
                    </div>

                    {/* Tareas — placeholder */}
                    <div className="bg-[#E0F2E9] rounded-2xl p-4 border border-[#5B7B7A]/20 mt-auto">
                        <p className="text-xs font-semibold text-[#5B7B7A] mb-1">🌱 Tareas del día</p>
                        <p className="text-xs text-[#A17C6B]">Próximamente podrás ver y gestionar tus tareas de huerto aquí.</p>
                    </div>
                </>
            ) : (
                <div className="bg-white rounded-2xl p-4 border border-[#CEB5A7]/30 text-center">
                    <p className="text-xs text-[#A17C6B]">Sin datos para este día</p>
                    <p className="text-xs text-[#CEB5A7] mt-1">Open-Meteo cubre los próximos 16 días</p>
                </div>
            )}
        </div>
    );
};

// ─── Componente principal ─────────────────────────────────────────────────────

const CalendarioSection = () => {
    const [selectedDate, setSelectedDate] = useState(null);
    const [ubicacion, setUbicacion] = useState({ label: 'Madrid', lat: 40.4168, lon: -3.7038 });

    const { weatherData, loading, error, refetch } = useOpenMeteo({
        latitude: ubicacion.lat,
        longitude: ubicacion.lon,
        daysAhead: 16,
    });

    const selectedWeather = selectedDate ? weatherData[toKey(selectedDate)] : null;

    return (
        <div className="space-y-6">

            {/* Buscador + ubicación activa + refresh */}
            <div className="flex flex-wrap items-center gap-3">
                <CitySearch ubicacion={ubicacion} onSelect={setUbicacion} />

                {ubicacion && (
                    <div className="flex items-center gap-1.5 px-3 py-2 bg-[#E0F2E9] rounded-xl border border-[#5B7B7A]/20">
                        <IoLocationOutline className="w-3.5 h-3.5 text-[#5B7B7A] shrink-0" />
                        <span className="text-xs font-semibold text-[#5B7B7A] max-w-[200px] truncate">{ubicacion.label}</span>
                    </div>
                )}

                <button
                    onClick={refetch}
                    disabled={loading}
                    className="flex items-center gap-2 px-3 py-2 bg-white border-2 border-[#CEB5A7]/40 rounded-xl text-sm font-medium text-[#5B7B7A] hover:bg-[#E0F2E9] transition-all disabled:opacity-50 cursor-pointer"
                >
                    <IoRefreshOutline className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Actualizar
                </button>

                {loading && !error && (
                    <p className="text-xs text-[#A17C6B] animate-pulse">Cargando datos de Open-Meteo…</p>
                )}
                {error && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-xl text-xs text-red-500">
                        <IoWarningOutline className="w-4 h-4 shrink-0" />
                        Error al cargar datos. Comprueba tu conexión.
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* ── Calendario ── */}
                <div className="lg:col-span-2 bg-white border-2 border-[#CEB5A7]/40 rounded-3xl p-6 overflow-hidden">

                    {/* Leyenda */}
                    <div className="flex flex-wrap gap-2 mb-5">
                        {Object.entries(CONDITION_CONFIG).map(([key, cfg]) => {
                            const Icon = cfg.icon;
                            return (
                                <div key={key} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color}`}>
                                    <Icon className="w-3.5 h-3.5" />
                                    {cfg.label}
                                </div>
                            );
                        })}
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-400">
                            <IoWaterOutline className="w-3.5 h-3.5" />
                            Prob. lluvia
                        </div>
                    </div>

                    <style>{`
            .garden-calendar { width: 100%; }
            .garden-calendar .react-calendar__navigation { display: flex; align-items: center; margin-bottom: 1rem; gap: 4px; }
            .garden-calendar .react-calendar__navigation button {
              background: none; border: none; cursor: pointer; border-radius: 0.75rem;
              padding: 0.5rem 0.75rem; font-weight: 600; color: #5B7B7A; transition: background 0.15s;
            }
            .garden-calendar .react-calendar__navigation button:hover { background: #E0F2E9; }
            .garden-calendar .react-calendar__navigation__label { flex: 1; font-size: 1rem; font-weight: 700; color: #5B7B7A; }
            .garden-calendar .react-calendar__navigation__arrow { font-size: 1.1rem; min-width: 2.5rem; }
            .garden-calendar .react-calendar__month-view__weekdays { margin-bottom: 0.25rem; }
            .garden-calendar .react-calendar__month-view__weekdays__weekday {
              text-align: center; font-size: 0.7rem; font-weight: 700;
              color: #A17C6B; text-transform: uppercase; letter-spacing: 0.05em; padding: 0.25rem 0;
            }
            .garden-calendar .react-calendar__month-view__weekdays__weekday abbr { text-decoration: none; }
            .garden-calendar .react-calendar__tile {
              background: none; border: 2px solid transparent; cursor: pointer;
              border-radius: 0.75rem; padding: 0.4rem 0.25rem 0.5rem;
              display: flex; flex-direction: column; align-items: center;
              font-size: 0.85rem; font-weight: 500; color: #3D5A59;
              transition: background 0.15s; min-height: 4rem;
            }
            .garden-calendar .react-calendar__tile:hover { background: #E0F2E9; border-color: #CEB5A7; }
            .garden-calendar .react-calendar__tile--now { background: #E0F2E9; font-weight: 700; }
            .garden-calendar .react-calendar__tile--active {
              background: linear-gradient(135deg, #5B7B7A, #A17C6B) !important;
              color: white !important; border-color: transparent !important;
            }
            .garden-calendar .react-calendar__tile--active svg { color: rgba(255,255,255,0.85) !important; }
            .garden-calendar .react-calendar__month-view__days__day--neighboringMonth { color: #CEB5A7; opacity: 0.6; }
            .garden-calendar .react-calendar__year-view .react-calendar__tile,
            .garden-calendar .react-calendar__decade-view .react-calendar__tile,
            .garden-calendar .react-calendar__century-view .react-calendar__tile { min-height: 2.5rem; }
          `}</style>

                    <Calendar
                        className="garden-calendar"
                        onChange={setSelectedDate}
                        value={selectedDate}
                        locale="es-ES"
                        tileContent={({ date, view }) => {
                            if (view !== 'month') return null;
                            const weather = weatherData[toKey(date)];
                            return <WeatherTile weather={weather} />;
                        }}
                    />
                </div>

                {/* ── Panel de detalle ── */}
                <div className="bg-white border-2 border-[#CEB5A7]/40 rounded-3xl overflow-hidden">
                    {loading && Object.keys(weatherData).length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full p-8 gap-3">
                            <div className="w-10 h-10 rounded-full border-2 border-[#5B7B7A] border-t-transparent animate-spin" />
                            <p className="text-[#A17C6B] text-sm">Cargando pronóstico…</p>
                        </div>
                    ) : (
                        <DayDetail date={selectedDate} weather={selectedWeather} />
                    )}
                </div>
            </div>
        </div>
    );
};

export default CalendarioSection;