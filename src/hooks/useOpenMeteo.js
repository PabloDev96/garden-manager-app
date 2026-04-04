import { useState, useEffect, useCallback } from 'react';

// ─── Mapeo de códigos WMO → condición de la app ───────────────────────────────
// https://open-meteo.com/en/docs#weathervariables (Weather Interpretation Codes)
const wmoToCondition = (code) => {
    if (code === 0) return 'sunny';        // Cielo despejado
    if (code <= 2) return 'partlyCloudy'; // Parcialmente nublado
    if (code === 3) return 'cloudy';       // Cubierto
    if (code >= 45 && code <= 48) return 'cloudy';       // Niebla
    if (code >= 51 && code <= 67) return 'rainy';        // Llovizna / lluvia
    if (code >= 71 && code <= 77) return 'cloudy';       // Nieve
    if (code >= 80 && code <= 82) return 'rainy';        // Chubascos
    if (code >= 85 && code <= 86) return 'cloudy';       // Chubascos de nieve
    if (code >= 95 && code <= 99) return 'stormy';       // Tormenta
    return 'cloudy';
};

// Transforma la respuesta de Open-Meteo al formato { "YYYY-MM-DD": { ... } }
const parseResponse = (data) => {
    const { time, temperature_2m_max, temperature_2m_min, precipitation_probability_max, weather_code } = data.daily;
    const result = {};
    time.forEach((date, i) => {
        result[date] = {
            tempMax: Math.round(temperature_2m_max[i]),
            tempMin: Math.round(temperature_2m_min[i]),
            precipProb: precipitation_probability_max[i] ?? 0,
            condition: wmoToCondition(weather_code[i]),
            wmoCode: weather_code[i],
        };
    });
    return result;
};

// ─── Hook principal ───────────────────────────────────────────────────────────
const useOpenMeteo = ({ latitude, longitude, daysAhead = 16 } = {}) => {
    const [weatherData, setWeatherData] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchWeather = useCallback(async () => {
        if (latitude == null || longitude == null) return;

        setLoading(true);
        setError(null);

        const params = new URLSearchParams({
            latitude,
            longitude,
            daily: [
                'weather_code',
                'temperature_2m_max',
                'temperature_2m_min',
                'precipitation_probability_max',
            ].join(','),
            timezone: 'auto',
            forecast_days: String(daysAhead),  // solo hacia adelante, máx 16
        });

        try {
            const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
            if (!res.ok) throw new Error(`Open-Meteo error: ${res.status}`);
            const data = await res.json();
            setWeatherData(parseResponse(data));
        } catch (err) {
            console.error('useOpenMeteo:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [latitude, longitude, daysAhead]);

    useEffect(() => {
        fetchWeather();
    }, [fetchWeather]);

    return { weatherData, loading, error, refetch: fetchWeather };
};

export default useOpenMeteo;
