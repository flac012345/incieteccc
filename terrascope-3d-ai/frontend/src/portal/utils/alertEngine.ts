import type { GeotechParameters } from '../../types/geotech';
import { THREAT_META, type ThreatLevel, type Zone } from '../data/medellinZones';
import type { ZoneWeather } from '../services/weather';

export type AlertLevel = 0 | 1 | 2 | 3;

export const ALERT_META: Record<
  AlertLevel,
  { name: string; label: string; color: string; soft: string; text: string; action: string }
> = {
  0: {
    name: 'Verde',
    label: 'Normal',
    color: '#16a34a',
    soft: '#dcfce7',
    text: '#14532d',
    action: 'Sin lluvias significativas. Mantén tu plan familiar de emergencia actualizado.',
  },
  1: {
    name: 'Amarilla',
    label: 'Vigilancia',
    color: '#eab308',
    soft: '#fef9c3',
    text: '#713f12',
    action: 'Lluvia acumulada en aumento. Observa grietas, filtraciones y el caudal de las quebradas.',
  },
  2: {
    name: 'Naranja',
    label: 'Preparación',
    color: '#f97316',
    soft: '#ffedd5',
    text: '#7c2d12',
    action: 'Suelo saturado. Ten listo el kit de emergencia e identifica la ruta de evacuación.',
  },
  3: {
    name: 'Roja',
    label: 'Emergencia',
    color: '#dc2626',
    soft: '#fee2e2',
    text: '#7f1d1d',
    action: 'Probabilidad alta de deslizamiento. Evacúa zonas de ladera y llama a la línea 123.',
  },
};

/** Lluvia aplicada a una zona (real o del escenario simulado). */
export interface RainInput {
  intensity_mmh: number;
  acc72_mm: number;
}

/**
 * Umbrales de lluvia (ilustrativos) inspirados en la práctica de alerta temprana:
 * la lluvia antecedente (72h) satura el suelo y la intensidad horaria detona la falla.
 */
export function rainLevel({ intensity_mmh, acc72_mm }: RainInput): AlertLevel {
  if (acc72_mm >= 100 || intensity_mmh >= 30) return 3;
  if (acc72_mm >= 60 || intensity_mmh >= 15) return 2;
  if (acc72_mm >= 30 || intensity_mmh >= 5) return 1;
  return 0;
}

/** Nivel de alerta = amenaza del terreno × detonante de lluvia. */
export function computeAlert(threat: ThreatLevel, rain: RainInput): AlertLevel {
  const r = rainLevel(rain);
  if (r === 0) return 0;
  const shift = threat === 'alta' ? 1 : threat === 'baja' ? -1 : 0;
  return Math.max(0, Math.min(3, r + shift)) as AlertLevel;
}

export interface ZoneStatus {
  zone: Zone;
  rain: RainInput;
  weather?: ZoneWeather;
  alert: AlertLevel;
}

export interface StormScenario {
  id: string;
  label: string;
  description: string;
  intensity_mmh: number;
  acc72_mm: number;
}

export const STORM_PRESETS: StormScenario[] = [
  { id: 'llovizna', label: 'Llovizna', description: 'Lluvia débil intermitente', intensity_mmh: 3, acc72_mm: 18 },
  { id: 'moderada', label: 'Lluvia moderada', description: 'Temporada de lluvias típica', intensity_mmh: 10, acc72_mm: 45 },
  { id: 'tormenta', label: 'Tormenta fuerte', description: 'Aguacero con tormenta eléctrica', intensity_mmh: 25, acc72_mm: 75 },
  { id: 'nina', label: 'Fenómeno de La Niña', description: 'Lluvias extremas acumuladas', intensity_mmh: 45, acc72_mm: 130 },
];

export function buildStatuses(
  zones: Zone[],
  weather: Record<string, ZoneWeather> | null,
  scenario: StormScenario | null
): ZoneStatus[] {
  return zones.map((zone) => {
    const w = weather?.[zone.id];
    const rain: RainInput = scenario
      ? { intensity_mmh: scenario.intensity_mmh, acc72_mm: scenario.acc72_mm }
      : { intensity_mmh: w?.intensity_mmh ?? 0, acc72_mm: w?.acc72_mm ?? 0 };
    return { zone, rain, weather: w, alert: computeAlert(zone.threat, rain) };
  });
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/**
 * Convierte la condición de una zona en parámetros para el simulador 3D existente.
 */
export function zoneToSimParams(status: ZoneStatus): GeotechParameters {
  const { zone, rain } = status;
  const base: Record<ThreatLevel, GeotechParameters> = {
    alta: {
      material_type: 'clay', slope_multiplier: 1.35, cohesion_kpa: 10, friction_angle_deg: 21,
      unit_weight_knm3: 21, soil_depth_m: 4.5, rainfall_intensity_mmh: 0, rainfall_duration_h: 0,
      initial_saturation: 0, toe_erosion_factor: 0.7, surcharge_kpa: 15, drainage_efficiency: 0.15,
    },
    media: {
      material_type: 'mixed', slope_multiplier: 1.15, cohesion_kpa: 16, friction_angle_deg: 27,
      unit_weight_knm3: 20.2, soil_depth_m: 3.8, rainfall_intensity_mmh: 0, rainfall_duration_h: 0,
      initial_saturation: 0, toe_erosion_factor: 0.2, surcharge_kpa: 8, drainage_efficiency: 0.35,
    },
    baja: {
      material_type: 'mixed', slope_multiplier: 0.9, cohesion_kpa: 28, friction_angle_deg: 33,
      unit_weight_knm3: 19, soil_depth_m: 3, rainfall_intensity_mmh: 0, rainfall_duration_h: 0,
      initial_saturation: 0, toe_erosion_factor: 0, surcharge_kpa: 2, drainage_efficiency: 0.75,
    },
  };
  const intensity = clamp(rain.intensity_mmh, 2, 150);
  return {
    ...base[zone.threat],
    rainfall_intensity_mmh: Math.round(intensity),
    rainfall_duration_h: Math.round(clamp(rain.acc72_mm / Math.max(intensity, 1), 1, 24)),
    initial_saturation: Number(clamp(0.2 + rain.acc72_mm / 160, 0.2, 0.95).toFixed(2)),
  };
}

export function threatColor(t: ThreatLevel) {
  return THREAT_META[t].color;
}

/** Distancia en km (haversine) para ubicar la zona más cercana al usuario. */
export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
