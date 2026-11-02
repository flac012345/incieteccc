import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

interface MapView2DProps {
  coordinates: [number, number];
  onCoordinatesChange: (coords: [number, number]) => void;
}

export const MapView2D: React.FC<MapView2DProps> = ({
  coordinates,
  onCoordinatesChange,
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<maplibregl.Map | null>(null);
  const [geoJsonInfo, setGeoJsonInfo] = useState<string>(
    'Polígono de estudio activo: Cuenca Andina de Referencia (6.09°N, -75.63°W)'
  );

  useEffect(() => {
    if (!mapContainer.current || mapInstance.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://demotiles.maplibre.org/style.json',
      center: coordinates,
      zoom: 11,
      pitch: 35,
    });

    map.addControl(new maplibregl.NavigationControl(), 'top-right');
    map.addControl(new maplibregl.ScaleControl({ maxWidth: 120, unit: 'metric' }));

    const marker = new maplibregl.Marker({ color: '#10b981' })
      .setLngLat(coordinates)
      .addTo(map);

    map.on('click', (e) => {
      const newCoords: [number, number] = [
        Number(e.lngLat.lng.toFixed(4)),
        Number(e.lngLat.lat.toFixed(4)),
      ];
      marker.setLngLat(newCoords);
      onCoordinatesChange(newCoords);
    });

    mapInstance.current = map;
    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, []);

  const handleGeoJsonUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !mapInstance.current) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        const map = mapInstance.current!;
        if (map.getSource('imported-geojson')) {
          (map.getSource('imported-geojson') as maplibregl.GeoJSONSource).setData(parsed);
        } else {
          map.addSource('imported-geojson', { type: 'geojson', data: parsed });
          map.addLayer({
            id: 'imported-geojson-fill',
            type: 'fill',
            source: 'imported-geojson',
            paint: { 'fill-color': '#10b981', 'fill-opacity': 0.35 },
          });
        }
        setGeoJsonInfo(`Archivo GeoJSON cargado: ${file.name} (Origen: IMPORTED_GIS)`);
      } catch {
        setGeoJsonInfo('Error: El archivo seleccionado no es un GeoJSON válido.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-slate-950">
      <div className="p-3 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="text-slate-300">
          <span className="text-emerald-400 font-semibold">Coordenadas Seleccionadas:</span>{' '}
          Lon {coordinates[0]}°, Lat {coordinates[1]}° | <span className="text-slate-400">{geoJsonInfo}</span>
        </div>
        <label className="cursor-pointer bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/50 text-emerald-300 px-3 py-1 rounded transition">
          Importar Polígono GeoJSON
          <input type="file" accept=".geojson,.json" onChange={handleGeoJsonUpload} className="hidden" />
        </label>
      </div>
      <div ref={mapContainer} className="flex-1 w-full" />
    </div>
  );
};
