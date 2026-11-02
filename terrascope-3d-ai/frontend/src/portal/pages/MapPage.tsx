import React, { useState } from 'react';
import {
  Layers,
  Filter,
  CloudRain,
  Activity,
  AlertTriangle,
  Info,
  Compass,
  Upload,
  RefreshCw,
  Search,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import { UniversalMap, ColorBy, MapLayers } from '../components/UniversalMap';
import { ZONES, THREAT_META, ThreatLevel, Zone } from '../data/medellinZones';
import {
  ALERT_META,
  AlertLevel,
  ZoneStatus,
  STORM_PRESETS,
  StormScenario,
  zoneToSimParams,
} from '../utils/alertEngine';
import { describeWeatherCode } from '../services/weather';
import { GeotechParameters } from '../../types/geotech';

interface MapPageProps {
  statuses: ZoneStatus[];
  selectedZoneId: string | null;
  onSelectZoneId: (id: string | null) => void;
  activeScenario: StormScenario | null;
  onSelectScenario: (scenario: StormScenario | null) => void;
  onLaunchSimulatorWithParams: (params: GeotechParameters, zoneName: string) => void;
  onRefreshWeather: () => void;
  weatherLoading: boolean;
}

export const MapPage: React.FC<MapPageProps> = ({
  statuses,
  selectedZoneId,
  onSelectZoneId,
  activeScenario,
  onSelectScenario,
  onLaunchSimulatorWithParams,
  onRefreshWeather,
  weatherLoading,
}) => {
  const [colorBy, setColorBy] = useState<ColorBy>('alerta');
  const [layers, setLayers] = useState<MapLayers>({
    zones: true,
    rain: true,
    labels: true,
    history: true,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [threatFilter, setThreatFilter] = useState<'all' | ThreatLevel>('all');
  const [userLocation, setUserLocation] = useState<google.maps.LatLngLiteral | null>(null);
  const [importedGeoJson, setImportedGeoJson] = useState<object | null>(null);
  const [focus, setFocus] = useState<{ lat: number; lng: number; zoom?: number; nonce: number } | null>(null);

  const selectedStatus = statuses.find((s) => s.zone.id === selectedZoneId) || null;

  const filteredStatuses = statuses.filter((s) => {
    const matchesSearch =
      s.zone.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.zone.code.includes(searchQuery);
    const matchesThreat = threatFilter === 'all' || s.zone.threat === threatFilter;
    return matchesSearch && matchesThreat;
  });

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert('Tu navegador no soporta geolocalización');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(coords);
        setFocus({ ...coords, zoom: 15, nonce: Date.now() });
      },
      () => alert('No se pudo obtener tu ubicación GPS')
    );
  };

  const handleGeoJsonUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        setImportedGeoJson(parsed);
      } catch {
        alert('Archivo GeoJSON no válido');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row w-full h-full overflow-hidden bg-slate-950 text-slate-100">
      {/* MAPA PRINCIPAL GOOGLE MAPS SATÉLITE HD */}
      <main className="flex-1 relative h-full w-full overflow-hidden">
        <UniversalMap
          statuses={statuses}
          colorBy={colorBy}
          layers={layers}
          selectedId={selectedZoneId}
          onSelect={(id) => onSelectZoneId(id)}
          userLocation={userLocation}
          focus={focus}
          importedGeoJson={importedGeoJson}
        />

        {/* CONTROLES SUPERPUESTOS EN EL MAPA */}
        <div className="absolute top-4 left-4 z-20 flex flex-wrap gap-2">
          {/* Selector de Capa de Color (Alerta / Amenaza) */}
          <div className="bg-slate-950/90 border border-slate-700/80 rounded-xl p-1.5 shadow-2xl backdrop-blur-md flex items-center gap-1 text-xs">
            <button
              onClick={() => setColorBy('alerta')}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                colorBy === 'alerta'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Semáforo de Alerta
            </button>
            <button
              onClick={() => setColorBy('amenaza')}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                colorBy === 'amenaza'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Amenaza por Pendiente
            </button>
          </div>

          {/* Botón Mi Ubicación */}
          <button
            onClick={handleLocateMe}
            className="bg-slate-950/90 hover:bg-slate-800 border border-slate-700/80 text-xs px-3 py-2 rounded-xl text-slate-200 flex items-center gap-1.5 shadow-2xl backdrop-blur-md transition"
          >
            <Compass className="w-3.5 h-3.5 text-blue-400" />
            <span>Mi Ubicación</span>
          </button>
        </div>

        {/* LEYENDA FLOTANTE */}
        <div className="absolute bottom-6 left-4 z-20 bg-slate-950/90 border border-slate-800/80 rounded-2xl p-3 shadow-2xl backdrop-blur-md max-w-xs text-xs space-y-2 pointer-events-auto">
          <div className="font-bold text-slate-200 flex items-center justify-between">
            <span>Leyenda: {colorBy === 'alerta' ? 'Nivel de Alerta' : 'Amenaza Geológica'}</span>
          </div>
          {colorBy === 'alerta' ? (
            <div className="grid grid-cols-2 gap-1.5">
              {([0, 1, 2, 3] as AlertLevel[]).map((lvl) => {
                const meta = ALERT_META[lvl];
                return (
                  <div key={lvl} className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: meta.color }} />
                    <span className="text-[11px] text-slate-300 font-medium">{meta.name}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1.5">
              {(['alta', 'media', 'baja'] as ThreatLevel[]).map((th) => {
                const meta = THREAT_META[th];
                return (
                  <div key={th} className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: meta.color }} />
                    <span className="text-[11px] text-slate-300 capitalize font-medium">{th}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* PANEL LATERAL DE CONTROL E INSPECCIÓN */}
      <aside className="w-full lg:w-96 border-l border-slate-800 bg-slate-950 p-4 flex flex-col gap-4 overflow-y-auto z-20 h-auto lg:h-full shrink-0 shadow-2xl">
        {/* ENCABEZADO PANEL */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-emerald-400" />
              Centro de Monitoreo
            </h2>
            <span className="text-xs text-slate-400">Valle de Aburrá · Medellín</span>
          </div>
          <button
            onClick={onRefreshWeather}
            disabled={weatherLoading}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title="Actualizar datos meteorológicos"
          >
            <RefreshCw className={`w-4 h-4 ${weatherLoading ? 'animate-spin text-blue-400' : ''}`} />
          </button>
        </div>

        {/* SIMULADOR DE TORMENTAS / PRECIPITACIÓN */}
        <div className="bg-slate-900/90 rounded-2xl p-3 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
              <CloudRain className="w-3.5 h-3.5" />
              Simulador de Tormenta
            </span>
            {activeScenario && (
              <button
                onClick={() => onSelectScenario(null)}
                className="text-[10px] text-blue-400 hover:underline"
              >
                Volver a lluvia real
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {STORM_PRESETS.map((sc) => {
              const isSelected = activeScenario?.id === sc.id;
              return (
                <button
                  key={sc.id}
                  onClick={() => onSelectScenario(isSelected ? null : sc)}
                  className={`p-2 rounded-xl text-left border text-xs transition ${
                    isSelected
                      ? 'bg-amber-500/20 border-amber-500 text-amber-200'
                      : 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="font-bold text-[11px] leading-tight">{sc.label}</div>
                  <div className="text-[9px] text-slate-400 mt-0.5">{sc.intensity_mmh} mm/h</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* FICHA TÉCNICA DE ZONA SELECCIONADA */}
        {selectedStatus ? (
          <div className="bg-slate-900/90 border border-slate-700 rounded-2xl p-4 space-y-3 shadow-xl">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                  {selectedStatus.zone.kind === 'comuna' ? `Comuna ${selectedStatus.zone.code}` : 'Corregimiento'}
                </span>
                <h3 className="text-lg font-black text-white mt-1">{selectedStatus.zone.name}</h3>
              </div>
              <span
                className="text-xs font-extrabold px-2.5 py-1 rounded-full uppercase"
                style={{
                  backgroundColor: ALERT_META[selectedStatus.alert].soft,
                  color: ALERT_META[selectedStatus.alert].text,
                }}
              >
                {ALERT_META[selectedStatus.alert].name}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-800/60 p-2 rounded-xl">
                <span className="text-[10px] text-slate-400 block">Amenaza Terreno</span>
                <span className="font-bold capitalize text-slate-200">{selectedStatus.zone.threat}</span>
              </div>
              <div className="bg-slate-800/60 p-2 rounded-xl">
                <span className="text-[10px] text-slate-400 block">Precipitación</span>
                <span className="font-bold text-blue-400">{selectedStatus.rain.intensity_mmh} mm/h</span>
              </div>
              <div className="bg-slate-800/60 p-2 rounded-xl">
                <span className="text-[10px] text-slate-400 block">Acumulado 72h</span>
                <span className="font-bold text-amber-400">{selectedStatus.rain.acc72_mm} mm</span>
              </div>
              <div className="bg-slate-800/60 p-2 rounded-xl">
                <span className="text-[10px] text-slate-400 block">Condición Clima</span>
                <span className="font-bold text-slate-200">
                  {selectedStatus.weather ? describeWeatherCode(selectedStatus.weather.weather_code).label : 'En línea'}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed border-t border-slate-800 pt-2">
              {selectedStatus.zone.notes}
            </p>

            {/* BOTÓN VINCULADOR CON EL SIMULADOR 3D */}
            <button
              onClick={() => {
                const params = zoneToSimParams(selectedStatus);
                onLaunchSimulatorWithParams(params, selectedStatus.zone.name);
              }}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2 transition"
            >
              <Activity className="w-4 h-4" />
              Simular Deslizamiento 3D de esta Comuna
            </button>
          </div>
        ) : (
          <div className="bg-slate-900/60 border border-dashed border-slate-800 rounded-2xl p-6 text-center text-xs text-slate-500 space-y-2">
            <Compass className="w-6 h-6 mx-auto text-slate-600" />
            <p>Haz clic en cualquier comuna o corregimiento en Google Maps para consultar su nivel de alerta y precipitación.</p>
          </div>
        )}

        {/* LISTADO DE COMUNAS */}
        <div className="space-y-2 flex-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-bold">Zonas Monitoreadas ({filteredStatuses.length})</span>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar comuna..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
            {filteredStatuses.map((s) => {
              const meta = ALERT_META[s.alert];
              const isSelected = s.zone.id === selectedZoneId;
              return (
                <div
                  key={s.zone.id}
                  onClick={() => {
                    onSelectZoneId(s.zone.id);
                    setFocus({ lat: s.zone.lat, lng: s.zone.lng, zoom: 14, nonce: Date.now() });
                  }}
                  className={`p-2 rounded-xl text-xs flex items-center justify-between cursor-pointer border transition ${
                    isSelected
                      ? 'bg-blue-600/20 border-blue-500 text-white'
                      : 'bg-slate-900/40 border-slate-800/80 text-slate-300 hover:bg-slate-850'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: meta.color }} />
                    <span className="font-semibold">{s.zone.name}</span>
                  </div>
                  <span className="text-[10px] text-slate-400">{s.rain.intensity_mmh} mm/h</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* IMPORTACIÓN DE CAPA GEOJSON */}
        <div className="border-t border-slate-800 pt-3">
          <label className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 text-xs flex items-center justify-center gap-2 cursor-pointer transition">
            <Upload className="w-3.5 h-3.5 text-blue-400" />
            <span>Cargar GeoJSON Oficial (DAGRD / POT)</span>
            <input type="file" accept=".geojson,.json" onChange={handleGeoJsonUpload} className="hidden" />
          </label>
        </div>
      </aside>
    </div>
  );
};
