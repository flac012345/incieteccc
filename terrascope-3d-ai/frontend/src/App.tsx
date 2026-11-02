import React, { useState, useMemo, useEffect } from 'react';
import {
  GeotechParameters,
  VisualizationLayer,
  CellInspectionData,
  SavedScenario,
} from './types/geotech';
import { computeLocalSummary } from './utils/terrainGenerator';
import { LeftSidebar } from './components/LeftSidebar';
import { RightAnalyticsPanel } from './components/RightAnalyticsPanel';
import { AIAssistantModal } from './components/AIAssistantModal';
import { CameraViewMode } from './components/CinematicPlayerControls';
import { queryAIAnalysis } from './services/api';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';

// PORTAL SIRMED / TERRASCOPE COMPONENTS
import { PortalHeader } from './portal/components/PortalHeader';
import { PortalFooter } from './portal/components/PortalFooter';
import { AccessibilityBar } from './portal/components/AccessibilityBar';
import { HomePage } from './portal/pages/HomePage';
import { MapPage } from './portal/pages/MapPage';
import { ActionGuidePage } from './portal/pages/ActionGuidePage';
import { RealTimeLandslideCanvas } from './portal/components/RealTimeLandslideCanvas';
import { ZONES } from './portal/data/medellinZones';
import { useLiveWeather } from './portal/hooks/useLiveWeather';
import { buildStatuses, StormScenario, AlertLevel } from './portal/utils/alertEngine';

const PRESET_SCENARIOS: Record<string, { label: string; params: GeotechParameters }> = {
  stable: {
    label: '1. Ladera Estable (Base)',
    params: {
      material_type: 'mixed',
      slope_multiplier: 0.9,
      cohesion_kpa: 28,
      friction_angle_deg: 33,
      unit_weight_knm3: 19.0,
      soil_depth_m: 3.0,
      rainfall_intensity_mmh: 10,
      rainfall_duration_h: 2,
      initial_saturation: 0.25,
      toe_erosion_factor: 0.0,
      surcharge_kpa: 2,
      drainage_efficiency: 0.75,
    },
  },
  heavy_rain: {
    label: '2. Tormenta Tropical Intensa',
    params: {
      material_type: 'mixed',
      slope_multiplier: 1.15,
      cohesion_kpa: 16,
      friction_angle_deg: 27,
      unit_weight_knm3: 20.2,
      soil_depth_m: 3.8,
      rainfall_intensity_mmh: 95,
      rainfall_duration_h: 12,
      initial_saturation: 0.55,
      toe_erosion_factor: 0.15,
      surcharge_kpa: 8,
      drainage_efficiency: 0.25,
    },
  },
  toe_erosion: {
    label: '3. Socavación Basal + Saturación Crítica',
    params: {
      material_type: 'clay',
      slope_multiplier: 1.35,
      cohesion_kpa: 10,
      friction_angle_deg: 21,
      unit_weight_knm3: 21.0,
      soil_depth_m: 4.5,
      rainfall_intensity_mmh: 130,
      rainfall_duration_h: 18,
      initial_saturation: 0.75,
      toe_erosion_factor: 0.85,
      surcharge_kpa: 18,
      drainage_efficiency: 0.1,
    },
  },
};

export default function App() {
  // ROUTING DE PÁGINAS DEL PORTAL
  const [currentPath, setCurrentPath] = useState<string>(() => {
    const hash = window.location.hash.replace('#', '');
    return hash || '/';
  });

  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      setCurrentPath(hash || '/');
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigateTo = (path: string) => {
    window.location.hash = path;
    setCurrentPath(path);
  };

  // DATOS METEOROLÓGICOS Y ALERTAS
  const { data: weatherData, status: weatherStatus, refresh: refreshWeather } = useLiveWeather();
  const [activeScenario, setActiveScenario] = useState<StormScenario | null>(null);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>('c8'); // Default Villatina
  const [activeZoneName, setActiveZoneName] = useState<string>('Comuna 8 (Villa Hermosa)');

  const statuses = useMemo(() => {
    return buildStatuses(ZONES, weatherData, activeScenario);
  }, [weatherData, activeScenario]);

  const maxAlert = useMemo(() => {
    return Math.max(...statuses.map((s) => s.alert), 0) as AlertLevel;
  }, [statuses]);

  // ESTADOS DEL SIMULADOR 3D CIENTÍFICO
  const [params, setParams] = useState<GeotechParameters>(PRESET_SCENARIOS.toe_erosion.params);
  const [activeLayer, setActiveLayer] = useState<VisualizationLayer>('realistic');
  const [viewMode, setViewMode] = useState<'3D' | '2D_GIS'>('3D');
  const [verticalExaggeration, setVerticalExaggeration] = useState<number>(1.2);
  const [wireframeContours, setWireframeContours] = useState<boolean>(false);
  const [isSimulatingFlow, setIsSimulatingFlow] = useState<boolean>(false);
  const [selectedCell, setSelectedCell] = useState<CellInspectionData | null>(null);
  const [coordinates, setCoordinates] = useState<[number, number]>([-75.635, 6.091]);
  const [savedScenarios, setSavedScenarios] = useState<SavedScenario[]>([]);
  const [aiQuestion, setAiQuestion] = useState<string>(
    '¿Qué factores detonaron este desprendimiento masivo y qué obras de contención pudieron evitarlo?'
  );
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState<boolean>(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState<boolean>(false);

  // Estados del Modo Cinemático
  const [isCinematicMode, setIsCinematicMode] = useState<boolean>(true);
  const [cinematicProgress, setCinematicProgress] = useState<number>(0.0);
  const [isPlayingCinematic, setIsPlayingCinematic] = useState<boolean>(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [cameraView, setCameraView] = useState<CameraViewMode>('lateral');
  const [rainIntensity, setRainIntensity] = useState<'none' | 'light' | 'storm'>('storm');
  const [showSidePanels, setShowSidePanels] = useState<boolean>(false);

  const summary = useMemo(() => computeLocalSummary(params), [params]);

  useEffect(() => {
    if (!isPlayingCinematic || !isCinematicMode || currentPath !== '/simulador') return;

    const baseDurationMs = 15000;
    let lastTime = performance.now();

    const interval = setInterval(() => {
      const now = performance.now();
      const deltaMs = now - lastTime;
      lastTime = now;

      setCinematicProgress((prev) => {
        const next = prev + (deltaMs / baseDurationMs) * playbackSpeed;
        if (next >= 1.0) return 0.0;
        return next;
      });
    }, 33);

    return () => clearInterval(interval);
  }, [isPlayingCinematic, isCinematicMode, playbackSpeed, currentPath]);

  const handleLaunchSimulatorWithParams = (simParams: GeotechParameters, zoneName: string) => {
    setParams(simParams);
    setActiveZoneName(zoneName);
    setRainIntensity(simParams.rainfall_intensity_mmh > 30 ? 'storm' : simParams.rainfall_intensity_mmh > 5 ? 'light' : 'none');
    navigateTo('/simulador');
  };

  const handleSaveScenario = () => {
    const newScenario: SavedScenario = {
      id: crypto.randomUUID(),
      name: `Escenario #${savedScenarios.length + 1} (FS=${summary.min_fs})`,
      timestamp: new Date().toLocaleTimeString(),
      parameters: { ...params },
      summary,
    };
    setSavedScenarios((prev) => [newScenario, ...prev.slice(0, 4)]);
  };

  const handleExportJSON = () => {
    const payload = {
      platform: 'TERRASCOPE 3D AI - Video Demo Cinemático',
      timestamp: new Date().toISOString(),
      zone: activeZoneName,
      coordinates,
      parameters: params,
      results: summary,
      cinematic: {
        progress: cinematicProgress,
        cameraView,
        rainIntensity,
      },
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `terrascope_${activeZoneName.replace(/\s+/g, '_')}_${Date.now()}.json`;
    a.click();
  };

  const handleAskAI = async () => {
    setIsLoadingAI(true);
    try {
      const data = await queryAIAnalysis({
        question: aiQuestion,
        parameters: params,
        summary,
        comparison_summary: savedScenarios[0]?.summary ?? null,
      });
      setAiResponse(data.answer);
    } catch {
      setAiResponse(
        `[Diagnóstico Geotécnico - ${activeZoneName}]\n` +
          `• Mecanismo: Falla de ladera detonada por sobre-saturación hídrica (u_w = ${summary.pore_pressure_kpa} kPa).\n` +
          `• Factor de Seguridad crítico: ${summary.min_fs} (Inestabilidad alta con riesgo para estructuras).\n` +
          `• Recomendación: Monitoreo con piezómetros y obras de drenaje subsuperficial.`
      );
    } finally {
      setIsLoadingAI(false);
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-[#070a10] text-slate-100 font-sans overflow-hidden">
      <AccessibilityBar />

      {/* ENCABEZADO TIPO SIRMED DISTRITAL */}
      <PortalHeader
        currentPath={currentPath}
        maxAlert={maxAlert}
        stormActive={statuses.some((s) => s.rain.intensity_mmh > 20)}
        simulated={!!activeScenario}
      />

      {/* CONTENIDO PRINCIPAL POR RUTAS */}
      <div className="flex-1 flex flex-col relative w-full h-[calc(100vh-150px)] overflow-hidden">
        {currentPath === '/' && (
          <div className="flex-1 overflow-y-auto flex flex-col h-full">
            <HomePage
              statuses={statuses}
              onSelectZone={(id) => {
                setSelectedZoneId(id);
                navigateTo('/mapa');
              }}
              onNavigate={navigateTo}
            />
            <PortalFooter />
          </div>
        )}

        {currentPath === '/mapa' && (
          <MapPage
            statuses={statuses}
            selectedZoneId={selectedZoneId}
            onSelectZoneId={setSelectedZoneId}
            activeScenario={activeScenario}
            onSelectScenario={setActiveScenario}
            onLaunchSimulatorWithParams={handleLaunchSimulatorWithParams}
            onRefreshWeather={refreshWeather}
            weatherLoading={weatherStatus === 'loading'}
          />
        )}

        {currentPath === '/que-hacer' && (
          <div className="flex-1 overflow-y-auto flex flex-col">
            <ActionGuidePage />
            <PortalFooter />
          </div>
        )}

        {currentPath === '/simulador' && (
          <div className="flex-1 flex flex-col h-full w-full overflow-hidden relative">
            {/* Barra Técnica del Simulador */}
            <div className="bg-slate-950 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between z-30 shrink-0">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigateTo('/mapa')}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Volver al Mapa
                </button>
                <div className="text-xs">
                  <span className="text-slate-400">Escenario de Catástrofe:</span>{' '}
                  <strong className="text-white text-sm">{activeZoneName}</strong>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowSidePanels(!showSidePanels)}
                  className="bg-slate-800 hover:bg-slate-700 text-xs px-3 py-1.5 rounded-lg text-slate-200 font-bold flex items-center gap-1.5 transition"
                >
                  {showSidePanels ? <EyeOff className="w-3.5 h-3.5 text-amber-400" /> : <Eye className="w-3.5 h-3.5 text-emerald-400" />}
                  <span>{showSidePanels ? 'Ocultar Parámetros Geotécnicos' : 'Parámetros Geotécnicos'}</span>
                </button>
              </div>
            </div>

            {/* Simulador Cinemático Realista */}
            <div className="flex-1 flex overflow-hidden relative">
              {showSidePanels && (
                <LeftSidebar
                  params={params}
                  onChangeParams={setParams}
                  activeLayer={activeLayer}
                  onChangeLayer={setActiveLayer}
                  verticalExaggeration={verticalExaggeration}
                  onChangeExaggeration={setVerticalExaggeration}
                  wireframeContours={wireframeContours}
                  onChangeWireframe={setWireframeContours}
                  presetScenarios={PRESET_SCENARIOS}
                />
              )}

              <main className="flex-1 relative w-full h-full">
                <RealTimeLandslideCanvas
                  zoneName={activeZoneName}
                  threatLevel="ALTA"
                  rainIntensity={params.rainfall_intensity_mmh}
                  onAdjustGeotech={() => setShowSidePanels(true)}
                />
              </main>

              {showSidePanels && (
                <RightAnalyticsPanel
                  summary={summary}
                  savedScenarios={savedScenarios}
                  onRestoreScenario={setParams}
                  aiQuestion={aiQuestion}
                  onChangeAiQuestion={setAiQuestion}
                  onAskAI={handleAskAI}
                  aiResponse={aiResponse}
                  isLoadingAI={isLoadingAI}
                />
              )}
            </div>
          </div>
        )}
      </div>

      <AIAssistantModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        params={params}
        summary={summary}
        comparisonSummary={savedScenarios[0]?.summary ?? null}
      />
    </div>
  );
}

