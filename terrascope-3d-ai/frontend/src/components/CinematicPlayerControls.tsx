import React from 'react';
import { Play, Pause, RotateCcw, Camera, Eye, Zap, Volume2 } from 'lucide-react';

export type CameraViewMode = 'lateral' | 'drone' | 'houses' | 'crown' | 'free';

interface CinematicPlayerControlsProps {
  progress: number; // 0 to 1
  onSeek: (progress: number) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onRestart: () => void;
  playbackSpeed: number;
  onChangeSpeed: (speed: number) => void;
  cameraView: CameraViewMode;
  onChangeCameraView: (view: CameraViewMode) => void;
  rainIntensity: 'none' | 'light' | 'storm';
  onToggleRain: () => void;
}

export const CinematicPlayerControls: React.FC<CinematicPlayerControlsProps> = ({
  progress,
  onSeek,
  isPlaying,
  onTogglePlay,
  onRestart,
  playbackSpeed,
  onChangeSpeed,
  cameraView,
  onChangeCameraView,
  rainIntensity,
  onToggleRain,
}) => {
  const totalSeconds = 15;
  const currentSeconds = (progress * totalSeconds).toFixed(1);

  // Fases del evento
  const getPhaseDescription = () => {
    if (progress < 0.15) {
      return {
        badge: 'FASE 1: PRE-FALLA',
        title: 'Saturación del manto y lluvia intensa',
        color: 'text-cyan-400 border-cyan-500/50 bg-cyan-950/60',
      };
    }
    if (progress < 0.35) {
      return {
        badge: 'FASE 2: AGRIETAMIENTO',
        title: 'Apertura de la grieta de tracción en la corona',
        color: 'text-amber-400 border-amber-500/50 bg-amber-950/60',
      };
    }
    if (progress < 0.65) {
      return {
        badge: 'FASE 3: COLAPSO GRAVITACIONAL',
        title: 'Desprendimiento acelerado de la masa rocosa y lodo',
        color: 'text-orange-400 border-orange-500/50 bg-orange-950/60',
      };
    }
    if (progress < 0.88) {
      return {
        badge: 'FASE 4: IMPACTO VIAL Y ESTRUCTURAL',
        title: 'Afectación y sepultamiento de vía y viviendas',
        color: 'text-red-400 border-red-500/50 bg-red-950/60',
      };
    }
    return {
      badge: 'FASE 5: DEPÓSITO Y DETENCIÓN',
      title: 'Cono de deyección y estabilización de escombros',
      color: 'text-emerald-400 border-emerald-500/50 bg-emerald-950/60',
    };
  };

  const phase = getPhaseDescription();

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-11/12 max-w-4xl bg-slate-950/95 border border-slate-700/80 rounded-2xl p-4 shadow-[0_12px_40px_rgba(0,0,0,0.85)] backdrop-blur-xl flex flex-col gap-3 select-none z-30 transition-all">
      {/* Encabezado de la barra con estado de la fase cinematográfica */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2.5">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${phase.color}`}>
            {phase.badge}
          </span>
          <span className="text-xs text-slate-200 font-semibold">{phase.title}</span>
        </div>

        {/* Cámaras cinematográficas */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-400 text-[11px] mr-1 hidden sm:inline flex items-center gap-1">
            <Camera className="w-3.5 h-3.5 inline text-emerald-400" /> Cámara:
          </span>
          {(
            [
              ['lateral', 'Lateral'],
              ['drone', 'Dron'],
              ['crown', 'Corona'],
              ['houses', 'Casas'],
              ['free', 'Libre'],
            ] as [CameraViewMode, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => onChangeCameraView(key)}
              className={`px-2 py-1 rounded text-[11px] transition font-medium ${
                cameraView === key
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Barra de progreso de video interactiva */}
      <div className="space-y-1">
        <div className="relative w-full h-3 bg-slate-900 rounded-full cursor-pointer overflow-hidden border border-slate-800 group">
          {/* Fondo con segmentos de fase */}
          <div className="absolute inset-0 flex">
            <div className="w-[15%] h-full bg-cyan-950/50 border-r border-slate-800/80" title="Saturación" />
            <div className="w-[20%] h-full bg-amber-950/50 border-r border-slate-800/80" title="Grieta" />
            <div className="w-[30%] h-full bg-orange-950/50 border-r border-slate-800/80" title="Colapso" />
            <div className="w-[23%] h-full bg-red-950/50 border-r border-slate-800/80" title="Impacto" />
            <div className="w-[12%] h-full bg-emerald-950/50" title="Depósito" />
          </div>

          {/* Barra de progreso animada */}
          <div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-cyan-500 via-amber-400 to-red-500 transition-all duration-75"
            style={{ width: `${progress * 100}%` }}
          />

          {/* Slider input invisible sobrepuesto */}
          <input
            type="range"
            min={0}
            max={1}
            step={0.005}
            value={progress}
            onChange={(e) => onSeek(parseFloat(e.target.value))}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>

        {/* Marcas de tiempo de los hitos */}
        <div className="flex justify-between text-[10px] text-slate-400 font-mono">
          <span>00:00 (Inicio)</span>
          <span>00:03 (Grieta Corona)</span>
          <span>00:07 (Ruptura Masiva)</span>
          <span>00:11 (Impacto Vía/Casas)</span>
          <span>00:15 (Depósito)</span>
        </div>
      </div>

      {/* Controles de reproducción principales */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-3">
          {/* Botón Play / Pause */}
          <button
            onClick={onTogglePlay}
            className="w-10 h-10 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center font-bold shadow-lg transition active:scale-95"
            title={isPlaying ? 'Pausar video' : 'Reproducir video de colapso'}
          >
            {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
          </button>

          {/* Botón Reiniciar */}
          <button
            onClick={onRestart}
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition"
            title="Reiniciar secuencia"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Contador de tiempo */}
          <div className="text-xs font-mono text-slate-300 font-semibold bg-slate-900 px-2.5 py-1 rounded border border-slate-800">
            00:{currentSeconds.padStart(4, '0')} <span className="text-slate-500">/ 00:15.0</span>
          </div>

          {/* Alternar Lluvia Torrencial */}
          <button
            onClick={onToggleRain}
            className={`text-xs px-2.5 py-1 rounded border transition flex items-center gap-1.5 ${
              rainIntensity === 'storm'
                ? 'bg-blue-600/30 border-blue-400 text-blue-200'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="Activar/Desactivar tormenta"
          >
            <Zap className="w-3.5 h-3.5 text-yellow-400" />
            <span className="hidden sm:inline">Lluvia:</span> {rainIntensity === 'storm' ? 'Tormenta 90mm/h' : 'Seco'}
          </button>
        </div>

        {/* Velocidad de reproducción */}
        <div className="flex items-center gap-1">
          <span className="text-[11px] text-slate-400 mr-1 hidden sm:inline">Velocidad:</span>
          {[0.5, 1, 2].map((spd) => (
            <button
              key={spd}
              onClick={() => onChangeSpeed(spd)}
              className={`px-2 py-0.5 rounded text-xs transition ${
                playbackSpeed === spd
                  ? 'bg-emerald-600/40 border border-emerald-400 text-emerald-300 font-bold'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {spd}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
