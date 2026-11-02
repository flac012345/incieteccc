import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MEDELLIN_CENTER, THREAT_META, HISTORIC_EVENTS } from '../data/medellinZones';
import { ALERT_META, AlertLevel, ZoneStatus } from '../utils/alertEngine';
import { GOOGLE_MAPS_KEY } from '../services/googleMapsLoader';

export type ColorBy = 'alerta' | 'amenaza';

export interface MapLayers {
  zones: boolean;
  rain: boolean;
  labels: boolean;
  history: boolean;
}

interface UniversalMapProps {
  statuses: ZoneStatus[];
  colorBy: ColorBy;
  layers: MapLayers;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  userLocation: { lat: number; lng: number } | null;
  focus: { lat: number; lng: number; zoom?: number; nonce: number } | null;
  importedGeoJson: object | null;
}

export const UniversalMap: React.FC<UniversalMapProps> = ({
  statuses,
  colorBy,
  layers,
  selectedId,
  onSelect,
  userLocation,
  focus,
  importedGeoJson,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const circlesRef = useRef<Map<string, L.Circle>>(new Map());
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const geoJsonLayerRef = useRef<L.GeoJSON | null>(null);
  const userMarkerRef = useRef<L.CircleMarker | null>(null);

  const [mapType, setMapType] = useState<'google_sat' | 'google_roads' | 'osm_terrain'>('google_sat');
  const [embedGoogleFrame, setEmbedGoogleFrame] = useState(false);

  // Inicializar Leaflet con TileLayers directos de satélite y relieve
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [MEDELLIN_CENTER.lat, MEDELLIN_CENTER.lng],
      zoom: 12,
      zoomControl: true,
      attributionControl: false,
    });

    // Layer base de satélite híbrido de Google (carga 100% garantizada y nítida)
    const googleSat = L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
      maxZoom: 20,
    });

    const googleRoads = L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
      maxZoom: 20,
    });

    const terrain = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
      maxZoom: 17,
    });

    if (mapType === 'google_sat') googleSat.addTo(map);
    else if (mapType === 'google_roads') googleRoads.addTo(map);
    else terrain.addTo(map);

    (map as any)._layersMap = { googleSat, googleRoads, terrain };

    map.on('click', (e: any) => {
      // Si se hace clic en fondo vacío
      if (e.originalEvent.target.classList.contains('leaflet-container')) {
        onSelect(null);
      }
    });

    mapRef.current = map;

    const onResize = () => map.invalidateSize();
    window.addEventListener('resize', onResize);

    setTimeout(() => {
      map.invalidateSize();
    }, 150);

    return () => {
      window.removeEventListener('resize', onResize);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Cambiar tipo de mapa (Satélite Google vs Calles vs Relieve)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const layersMap = (map as any)._layersMap;
    if (!layersMap) return;

    map.removeLayer(layersMap.googleSat);
    map.removeLayer(layersMap.googleRoads);
    map.removeLayer(layersMap.terrain);

    if (mapType === 'google_sat') layersMap.googleSat.addTo(map);
    else if (mapType === 'google_roads') layersMap.googleRoads.addTo(map);
    else layersMap.terrain.addTo(map);
  }, [mapType]);

  // Actualizar círculos y marcadores interactivos de las comunas
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    statuses.forEach((s) => {
      const isSelected = s.zone.id === selectedId;
      const color = colorBy === 'alerta' ? ALERT_META[s.alert].color : THREAT_META[s.zone.threat].color;

      // Círculo de área
      let circle = circlesRef.current.get(s.zone.id);
      if (!circle) {
        circle = L.circle([s.zone.lat, s.zone.lng], {
          radius: s.zone.radius_m,
          fillColor: color,
          fillOpacity: 0.35,
          color: color,
          weight: 2,
        }).addTo(map);

        circle.on('click', () => onSelect(s.zone.id));
        circlesRef.current.set(s.zone.id, circle);
      } else {
        circle.setLatLng([s.zone.lat, s.zone.lng]);
        circle.setRadius(s.zone.radius_m);
        circle.setStyle({
          fillColor: color,
          fillOpacity: isSelected ? 0.65 : 0.35,
          color: isSelected ? '#ffffff' : color,
          weight: isSelected ? 3.5 : 2,
        });
      }

      // Etiqueta HTML
      let marker = markersRef.current.get(s.zone.id);
      const iconHtml = `
        <div class="map-zone-pill ${isSelected ? 'active' : ''}" style="border-color: ${color}">
          <span class="dot" style="background: ${color}"></span>
          <span class="name">${s.zone.kind === 'comuna' ? 'C' + s.zone.code : 'CR'}: ${s.zone.name}</span>
          ${s.rain.intensity_mmh > 0 ? `<span class="rain">${s.rain.intensity_mmh}mm/h</span>` : ''}
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-leaflet-div',
        html: iconHtml,
        iconAnchor: [60, 15],
      });

      if (!marker) {
        marker = L.marker([s.zone.lat, s.zone.lng], { icon: customIcon }).addTo(map);
        marker.on('click', () => onSelect(s.zone.id));
        markersRef.current.set(s.zone.id, marker);
      } else {
        marker.setLatLng([s.zone.lat, s.zone.lng]);
        marker.setIcon(customIcon);
      }
    });
  }, [statuses, colorBy, selectedId]);

  // Enfocar en mapa cuando se selecciona o solicita foco
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !focus) return;
    map.flyTo([focus.lat, focus.lng], focus.zoom || 14, { duration: 1.2 });
  }, [focus]);

  // Marcador de ubicación de usuario
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (userLocation) {
      if (!userMarkerRef.current) {
        userMarkerRef.current = L.circleMarker([userLocation.lat, userLocation.lng], {
          radius: 9,
          fillColor: '#3b82f6',
          fillOpacity: 1,
          color: '#ffffff',
          weight: 3,
        }).addTo(map);
      } else {
        userMarkerRef.current.setLatLng([userLocation.lat, userLocation.lng]);
      }
    }
  }, [userLocation]);

  // GeoJSON Import
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (geoJsonLayerRef.current) {
      map.removeLayer(geoJsonLayerRef.current);
      geoJsonLayerRef.current = null;
    }
    if (importedGeoJson) {
      geoJsonLayerRef.current = L.geoJSON(importedGeoJson as any, {
        style: {
          color: '#e11d48',
          weight: 2,
          fillOpacity: 0.25,
        },
      }).addTo(map);
    }
  }, [importedGeoJson]);

  return (
    <div className="relative w-full h-full bg-slate-950">
      {/* Botones de control satelital directo */}
      <div className="absolute top-4 right-4 z-[1000] flex items-center gap-2 bg-slate-950/90 border border-slate-700 p-1.5 rounded-xl shadow-2xl backdrop-blur-md">
        <button
          onClick={() => setMapType('google_sat')}
          className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
            mapType === 'google_sat' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          Google Satélite HD
        </button>
        <button
          onClick={() => setMapType('google_roads')}
          className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
            mapType === 'google_roads' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          Calles
        </button>
        <button
          onClick={() => setMapType('osm_terrain')}
          className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
            mapType === 'osm_terrain' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          Relieve Topográfico
        </button>
        <button
          onClick={() => setEmbedGoogleFrame(!embedGoogleFrame)}
          className={`px-3 py-1 rounded-lg text-xs font-bold transition border ${
            embedGoogleFrame ? 'bg-emerald-600 border-emerald-400 text-white' : 'border-slate-700 text-slate-300 hover:bg-slate-800'
          }`}
          title="Alternar vista embebida oficial de Google Maps"
        >
          {embedGoogleFrame ? 'Cerrar Visor Google 3D' : 'Ver Google Maps 3D'}
        </button>
      </div>

      {embedGoogleFrame ? (
        <iframe
          src={`https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d126916.63412574044!2d-75.6425974!3d6.2442033!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8e4428dfb80fad05%3A0x42137cfcc7b53b56!2sMedell%C3%ADn%2C%20Antioquia!5e1!3m2!1ses!2sco!4v1700000000000`}
          className="absolute inset-0 w-full h-full border-0 z-0"
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="Google Maps Medellín Oficial"
        />
      ) : (
        <div ref={containerRef} className="absolute inset-0 w-full h-full z-0" />
      )}
    </div>
  );
};
