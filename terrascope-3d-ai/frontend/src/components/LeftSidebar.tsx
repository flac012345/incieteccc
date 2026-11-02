import React from 'react';
import { GeotechParameters, VisualizationLayer, MaterialType } from '../types/geotech';

interface LeftSidebarProps {
  params: GeotechParameters;
  onChangeParams: (params: GeotechParameters) => void;
  activeLayer: VisualizationLayer;
  onChangeLayer: (layer: VisualizationLayer) => void;
  verticalExaggeration: number;
  onChangeExaggeration: (v: number) => void;
  wireframeContours: boolean;
  onChangeWireframe: (w: boolean) => void;
  presetScenarios: Record<string, { label: string; params: GeotechParameters }>;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  params,
  onChangeParams,
  activeLayer,
  onChangeLayer,
  verticalExaggeration,
  onChangeExaggeration,
  wireframeContours,
  onChangeWireframe,
  presetScenarios,
}) => {
  return (
    <aside className="w-80 bg-slate-950 border-r border-slate-800 p-4 overflow-y-auto space-y-5 shrink-0 select-none">
      {/* Escenarios */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2">
          Escenarios Predefinidos
        </h2>
        <div className="space-y-1.5">
          {Object.entries(presetScenarios).map(([key, sc]) => (
            <button
              key={key}
              onClick={() => onChangeParams(sc.params)}
              className="w-full text-left text-xs px-3 py-2 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 transition"
            >
              {sc.label}
            </button>
          ))}
        </div>
      </div>

      {/* Capas 3D */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-cyan-400 mb-2">
          Capas de Visualización 3D
        </h2>
        <div className="grid grid-cols-2 gap-1.5 text-xs">
          {(
            [
              ['safety_factor', 'Factor Seguridad'],
              ['slope', 'Mapa Pendientes'],
              ['saturation', 'Saturación / Poros'],
              ['elevation', 'Hipsometría DEM'],
              ['realistic', 'Geomorfológico'],
            ] as [VisualizationLayer, string][]
          ).map(([layerId, label]) => (
            <button
              key={layerId}
              onClick={() => onChangeLayer(layerId)}
              className={`px-2.5 py-1.5 rounded border text-left transition ${
                activeLayer === layerId
                  ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 font-semibold'
                  : 'bg-slate-900 border-slate-800 text-slate-400'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-slate-300">
          <span>Exageración Vertical: {verticalExaggeration.toFixed(1)}x</span>
          <input
            type="range"
            min={0.6}
            max={2.2}
            step={0.1}
            value={verticalExaggeration}
            onChange={(e) => onChangeExaggeration(parseFloat(e.target.value))}
            className="w-28 accent-emerald-400"
          />
        </div>
        <label className="mt-2 flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
          <input
            type="checkbox"
            checked={wireframeContours}
            onChange={(e) => onChangeWireframe(e.target.checked)}
            className="accent-emerald-400"
          />
          Mostrar Malla Topográfica (Wireframe)
        </label>
      </div>

      {/* Parámetros Geotécnicos */}
      <div className="space-y-3 border-t border-slate-800 pt-4 text-xs">
        <h2 className="font-bold uppercase tracking-wider text-emerald-400">
          Parámetros Geotécnicos e Hidrológicos
        </h2>

        <div>
          <label className="block text-slate-400 mb-1">Litología Predominante:</label>
          <select
            value={params.material_type}
            onChange={(e) =>
              onChangeParams({ ...params, material_type: e.target.value as MaterialType })
            }
            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-200"
          >
            <option value="clay">Arcilla Limoarenosa (Clay)</option>
            <option value="sand">Arena Aluvial (Sand)</option>
            <option value="mixed">Coluvión Mixto (Mixed)</option>
            <option value="rock">Macizo Rocoso Fracturado (Rock)</option>
          </select>
        </div>

        <div>
          <div className="flex justify-between mb-1">
            <span>Cohesión efectiva (c'):</span>
            <span className="text-emerald-300 font-mono">{params.cohesion_kpa} kPa</span>
          </div>
          <input
            type="range"
            min={0}
            max={65}
            step={1}
            value={params.cohesion_kpa}
            onChange={(e) =>
              onChangeParams({ ...params, cohesion_kpa: parseFloat(e.target.value) })
            }
            className="w-full accent-emerald-400"
          />
        </div>

        <div>
          <div className="flex justify-between mb-1">
            <span>Ángulo Fricción (φ'):</span>
            <span className="text-emerald-300 font-mono">{params.friction_angle_deg}°</span>
          </div>
          <input
            type="range"
            min={10}
            max={45}
            step={1}
            value={params.friction_angle_deg}
            onChange={(e) =>
              onChangeParams({ ...params, friction_angle_deg: parseFloat(e.target.value) })
            }
            className="w-full accent-emerald-400"
          />
        </div>

        <div>
          <div className="flex justify-between mb-1">
            <span>Espesor del Estrato (z):</span>
            <span className="text-emerald-300 font-mono">{params.soil_depth_m} m</span>
          </div>
          <input
            type="range"
            min={1.0}
            max={10.0}
            step={0.5}
            value={params.soil_depth_m}
            onChange={(e) =>
              onChangeParams({ ...params, soil_depth_m: parseFloat(e.target.value) })
            }
            className="w-full accent-emerald-400"
          />
        </div>

        <div>
          <div className="flex justify-between mb-1">
            <span>Intensidad de Lluvia:</span>
            <span className="text-cyan-300 font-mono">{params.rainfall_intensity_mmh} mm/h</span>
          </div>
          <input
            type="range"
            min={0}
            max={160}
            step={5}
            value={params.rainfall_intensity_mmh}
            onChange={(e) =>
              onChangeParams({ ...params, rainfall_intensity_mmh: parseFloat(e.target.value) })
            }
            className="w-full accent-cyan-400"
          />
        </div>

        <div>
          <div className="flex justify-between mb-1">
            <span>Duración del Evento:</span>
            <span className="text-cyan-300 font-mono">{params.rainfall_duration_h} h</span>
          </div>
          <input
            type="range"
            min={1}
            max={48}
            step={1}
            value={params.rainfall_duration_h}
            onChange={(e) =>
              onChangeParams({ ...params, rainfall_duration_h: parseFloat(e.target.value) })
            }
            className="w-full accent-cyan-400"
          />
        </div>

        <div>
          <div className="flex justify-between mb-1">
            <span>Erosión en Base de Ladera:</span>
            <span className="text-amber-300 font-mono">
              {(params.toe_erosion_factor * 100).toFixed(0)}%
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={params.toe_erosion_factor}
            onChange={(e) =>
              onChangeParams({ ...params, toe_erosion_factor: parseFloat(e.target.value) })
            }
            className="w-full accent-amber-400"
          />
        </div>

        <div>
          <div className="flex justify-between mb-1">
            <span>Eficiencia de Drenaje:</span>
            <span className="text-emerald-300 font-mono">
              {(params.drainage_efficiency * 100).toFixed(0)}%
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={params.drainage_efficiency}
            onChange={(e) =>
              onChangeParams({ ...params, drainage_efficiency: parseFloat(e.target.value) })
            }
            className="w-full accent-emerald-400"
          />
        </div>

        <div>
          <div className="flex justify-between mb-1">
            <span>Sobrecarga Estructural (q):</span>
            <span className="text-slate-300 font-mono">{params.surcharge_kpa} kPa</span>
          </div>
          <input
            type="range"
            min={0}
            max={50}
            step={2}
            value={params.surcharge_kpa}
            onChange={(e) =>
              onChangeParams({ ...params, surcharge_kpa: parseFloat(e.target.value) })
            }
            className="w-full accent-slate-400"
          />
        </div>
      </div>
    </aside>
  );
};
