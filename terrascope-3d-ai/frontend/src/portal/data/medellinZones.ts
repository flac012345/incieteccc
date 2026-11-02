/**
 * Zonas de análisis del Distrito de Medellín (16 comunas + 5 corregimientos).
 *
 * IMPORTANTE: Las coordenadas son centroides aproximados y el nivel de amenaza por
 * movimientos en masa es una clasificación ILUSTRATIVA basada en la topografía general
 * (laderas nororientales, centro-orientales y occidentales de mayor pendiente).
 * Para uso oficial reemplazar con la cartografía del POT / DAGRD (GeoMedellín).
 */

export type ThreatLevel = 'alta' | 'media' | 'baja';

export interface Zone {
  id: string;
  code: string;
  name: string;
  kind: 'comuna' | 'corregimiento';
  lat: number;
  lng: number;
  /** Radio de representación en el mapa (metros). */
  radius_m: number;
  threat: ThreatLevel;
  notes: string;
}

export const MEDELLIN_CENTER = { lat: 6.2442, lng: -75.5812 };

export const ZONES: Zone[] = [
  { id: 'c1', code: '1', name: 'Popular', kind: 'comuna', lat: 6.2930, lng: -75.5460, radius_m: 1100, threat: 'alta', notes: 'Ladera nororiental de alta pendiente con asentamientos densos.' },
  { id: 'c2', code: '2', name: 'Santa Cruz', kind: 'comuna', lat: 6.2950, lng: -75.5560, radius_m: 900, threat: 'media', notes: 'Pie de ladera nororiental con quebradas canalizadas.' },
  { id: 'c3', code: '3', name: 'Manrique', kind: 'comuna', lat: 6.2730, lng: -75.5450, radius_m: 1200, threat: 'alta', notes: 'Vertiente oriental empinada, sectores en zona de alto riesgo no mitigable.' },
  { id: 'c4', code: '4', name: 'Aranjuez', kind: 'comuna', lat: 6.2800, lng: -75.5590, radius_m: 1000, threat: 'media', notes: 'Transición entre el valle y la ladera nororiental.' },
  { id: 'c5', code: '5', name: 'Castilla', kind: 'comuna', lat: 6.2930, lng: -75.5730, radius_m: 1000, threat: 'baja', notes: 'Zona plana del valle, riesgo principal por inundación.' },
  { id: 'c6', code: '6', name: 'Doce de Octubre', kind: 'comuna', lat: 6.3040, lng: -75.5880, radius_m: 1000, threat: 'alta', notes: 'Ladera noroccidental con taludes de corte y rellenos.' },
  { id: 'c7', code: '7', name: 'Robledo', kind: 'comuna', lat: 6.2780, lng: -75.5980, radius_m: 1500, threat: 'alta', notes: 'Ladera occidental extensa con suelos residuales.' },
  { id: 'c8', code: '8', name: 'Villa Hermosa', kind: 'comuna', lat: 6.2520, lng: -75.5450, radius_m: 1200, threat: 'alta', notes: 'Ladera centro-oriental. Incluye el sector de Villatina.' },
  { id: 'c9', code: '9', name: 'Buenos Aires', kind: 'comuna', lat: 6.2360, lng: -75.5500, radius_m: 1200, threat: 'media', notes: 'Ladera centro-oriental de pendiente moderada a alta.' },
  { id: 'c10', code: '10', name: 'La Candelaria', kind: 'comuna', lat: 6.2470, lng: -75.5680, radius_m: 1000, threat: 'baja', notes: 'Centro de la ciudad, zona plana.' },
  { id: 'c11', code: '11', name: 'Laureles - Estadio', kind: 'comuna', lat: 6.2470, lng: -75.5910, radius_m: 1100, threat: 'baja', notes: 'Zona plana del valle occidental.' },
  { id: 'c12', code: '12', name: 'La América', kind: 'comuna', lat: 6.2540, lng: -75.6050, radius_m: 900, threat: 'baja', notes: 'Transición valle-ladera occidental.' },
  { id: 'c13', code: '13', name: 'San Javier', kind: 'comuna', lat: 6.2560, lng: -75.6200, radius_m: 1100, threat: 'alta', notes: 'Ladera centro-occidental de alta pendiente (Comuna 13).' },
  { id: 'c14', code: '14', name: 'El Poblado', kind: 'comuna', lat: 6.2080, lng: -75.5650, radius_m: 1600, threat: 'media', notes: 'Ladera suroriental con quebradas y urbanización en pendiente.' },
  { id: 'c15', code: '15', name: 'Guayabal', kind: 'comuna', lat: 6.2160, lng: -75.5880, radius_m: 1000, threat: 'baja', notes: 'Zona plana del valle sur.' },
  { id: 'c16', code: '16', name: 'Belén', kind: 'comuna', lat: 6.2300, lng: -75.6070, radius_m: 1400, threat: 'media', notes: 'Valle y ladera suroccidental (sector Altavista).' },
  { id: 'r50', code: '50', name: 'San Sebastián de Palmitas', kind: 'corregimiento', lat: 6.3440, lng: -75.6880, radius_m: 3200, threat: 'media', notes: 'Corregimiento rural de montaña, vías con taludes inestables.' },
  { id: 'r60', code: '60', name: 'San Cristóbal', kind: 'corregimiento', lat: 6.2800, lng: -75.6400, radius_m: 2600, threat: 'alta', notes: 'Expansión urbana en ladera occidental.' },
  { id: 'r70', code: '70', name: 'Altavista', kind: 'corregimiento', lat: 6.2220, lng: -75.6300, radius_m: 2000, threat: 'alta', notes: 'Ladera suroccidental con avenidas torrenciales registradas.' },
  { id: 'r80', code: '80', name: 'San Antonio de Prado', kind: 'corregimiento', lat: 6.1830, lng: -75.6560, radius_m: 2600, threat: 'media', notes: 'Corregimiento en crecimiento con laderas de pendiente media.' },
  { id: 'r90', code: '90', name: 'Santa Elena', kind: 'corregimiento', lat: 6.2100, lng: -75.5000, radius_m: 3400, threat: 'media', notes: 'Altiplano oriental, niebla y lluvias frecuentes.' },
];

/** Evento histórico de referencia (para contexto en el mapa). */
export const HISTORIC_EVENTS = [
  {
    id: 'villatina-1987',
    name: 'Deslizamiento de Villatina',
    date: '27 de septiembre de 1987',
    lat: 6.2405,
    lng: -75.5385,
    description:
      'Uno de los desastres por movimiento en masa más graves de la historia de Medellín, en la ladera centro-oriental (Comuna 8).',
  },
];

export const THREAT_META: Record<ThreatLevel, { label: string; color: string; weight: number }> = {
  alta: { label: 'Alta', color: '#d7263d', weight: 3 },
  media: { label: 'Media', color: '#f49d37', weight: 2 },
  baja: { label: 'Baja', color: '#f6d743', weight: 1 },
};
