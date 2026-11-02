import type { Zone } from '../data/medellinZones';

/** Condición hidrometeorológica de una zona (fuente: Open-Meteo, sin API key). */
export interface ZoneWeather {
  /** Lluvia de la hora actual (mm/h). */
  intensity_mmh: number;
  /** Lluvia acumulada de las últimas 72 horas (mm) – detonante antecedente de deslizamientos. */
  acc72_mm: number;
  /** Lluvia pronosticada para las próximas 6 horas (mm). */
  next6h_mm: number;
  /** Probabilidad máxima de precipitación en las próximas 6 horas (%). */
  prob6h_pct: number;
  temperature_c: number;
  humidity_pct: number;
  wind_kmh: number;
  weather_code: number;
}

interface OpenMeteoLocation {
  current: {
    time: string;
    temperature_2m: number;
    relative_humidity_2m: number;
    weather_code: number;
    wind_speed_10m: number;
  };
  hourly: {
    time: string[];
    precipitation: (number | null)[];
    precipitation_probability: (number | null)[];
  };
}

const round1 = (n: number) => Math.round(n * 10) / 10;

/**
 * Consulta en UNA sola petición las 21 zonas (Open-Meteo admite listas de coordenadas).
 */
export async function fetchZonesWeather(zones: Zone[], signal?: AbortSignal): Promise<Record<string, ZoneWeather>> {
  const params = new URLSearchParams({
    latitude: zones.map((z) => z.lat.toFixed(4)).join(','),
    longitude: zones.map((z) => z.lng.toFixed(4)).join(','),
    current: 'temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m',
    hourly: 'precipitation,precipitation_probability',
    past_days: '3',
    forecast_days: '1',
    timezone: 'America/Bogota',
  });

  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, { signal });
  if (!res.ok) throw new Error(`Open-Meteo respondió ${res.status}`);
  const json = (await res.json()) as OpenMeteoLocation | OpenMeteoLocation[];
  const list = Array.isArray(json) ? json : [json];

  const result: Record<string, ZoneWeather> = {};
  list.forEach((loc, i) => {
    const zone = zones[i];
    if (!zone) return;
    const { time, precipitation, precipitation_probability } = loc.hourly;
    const currentHour = `${loc.current.time.slice(0, 13)}:00`;
    let idx = time.findIndex((t) => t === currentHour);
    if (idx < 0) idx = time.length - 1;

    const sum = (from: number, to: number) => {
      let s = 0;
      for (let k = Math.max(0, from); k <= Math.min(time.length - 1, to); k++) s += precipitation[k] ?? 0;
      return s;
    };
    let prob = 0;
    for (let k = idx; k <= Math.min(time.length - 1, idx + 6); k++) {
      prob = Math.max(prob, precipitation_probability[k] ?? 0);
    }

    result[zone.id] = {
      intensity_mmh: round1(precipitation[idx] ?? 0),
      acc72_mm: round1(sum(idx - 71, idx)),
      next6h_mm: round1(sum(idx + 1, idx + 6)),
      prob6h_pct: Math.round(prob),
      temperature_c: round1(loc.current.temperature_2m),
      humidity_pct: Math.round(loc.current.relative_humidity_2m),
      wind_kmh: round1(loc.current.wind_speed_10m),
      weather_code: loc.current.weather_code,
    };
  });
  return result;
}

/** Descripción en español de los códigos WMO de Open-Meteo. */
export function describeWeatherCode(code: number): { label: string; icon: string; isStorm: boolean } {
  if (code === 0) return { label: 'Despejado', icon: '☀️', isStorm: false };
  if (code <= 2) return { label: 'Parcialmente nublado', icon: '⛅', isStorm: false };
  if (code === 3) return { label: 'Nublado', icon: '☁️', isStorm: false };
  if (code === 45 || code === 48) return { label: 'Niebla', icon: '🌫️', isStorm: false };
  if (code >= 51 && code <= 57) return { label: 'Llovizna', icon: '🌦️', isStorm: false };
  if (code >= 61 && code <= 67) return { label: code >= 65 ? 'Lluvia fuerte' : 'Lluvia', icon: '🌧️', isStorm: false };
  if (code >= 80 && code <= 82) return { label: code === 82 ? 'Aguacero violento' : 'Chubascos', icon: '🌧️', isStorm: code === 82 };
  if (code >= 95) return { label: 'Tormenta eléctrica', icon: '⛈️', isStorm: true };
  return { label: 'Variable', icon: '🌥️', isStorm: false };
}
