import React from 'react';
import { Film, Sliders, Map, Download, Save, MessageSquareText } from 'lucide-react';

interface TopBarProps {
  viewMode: '3D' | '2D_GIS';
  onToggleViewMode: () => void;
  isCinematicMode: boolean;
  onToggleCinematicMode: () => void;
  onSaveScenario: () => void;
  onExportJSON: () => void;
  onOpenAIModal?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  viewMode,
  onToggleViewMode,
  isCinematicMode,
  onToggleCinematicMode,
  onSaveScenario,
  onExportJSON,
  onOpenAIModal,
}) => {
  return (
    <header className="h-14 border-b border-slate-800 bg-slate-950 px-4 flex items-center justify-between shrink-0 shadow-lg select-none z-20">
      <div className="flex items-center gap-3">
        <div className="w-3 h-3 rounded-full bg-emerald-400 shadow-[0_0_12px_#10b981]" />
        <span className="font-bold tracking-wider text-sm md:text-base text-white">
          TERRASCOPE <span className="text-emerald-400">3D AI</span>
        </span>
        <span className="hidden lg:inline-block text-xs bg-slate-900 border border-slate-700 text-slate-300 px-2.5 py-0.5 rounded">
          {isCinematicMode ? '🎬 Modo Video Demo Cinemático (Colapso y Derrumbe)' : '📊 Modo Simulador Geotécnico'}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {/* Botón Principal: Alternar entre Modo Cinemático y Modo Simulador */}
        <button
          onClick={onToggleCinematicMode}
          className={`text-xs px-3.5 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 shadow-lg ${
            isCinematicMode
              ? 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white shadow-orange-950/60'
              : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-slate-950 shadow-emerald-950/60'
          }`}
        >
          <Film className="w-4 h-4" />
          <span>{isCinematicMode ? '🎬 Ver Video Demo (Activo)' : '🎬 Ver Video Demo'}</span>
        </button>

        <button
          onClick={onToggleViewMode}
          className="text-xs px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-300 font-medium transition flex items-center gap-1.5"
        >
          <Map className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{viewMode === '3D' ? 'Mapa 2D' : 'Visor 3D'}</span>
        </button>

        <button
          onClick={onSaveScenario}
          className="text-xs px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 transition hidden md:flex items-center gap-1.5"
        >
          <Save className="w-3.5 h-3.5" />
          <span>Guardar</span>
        </button>

        <button
          onClick={onExportJSON}
          className="text-xs px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-emerald-500/50 text-emerald-300 transition flex items-center gap-1.5"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Exportar</span>
        </button>

        {onOpenAIModal && (
          <button
            onClick={onOpenAIModal}
            className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-100 font-medium transition flex items-center gap-1.5 shadow"
          >
            <MessageSquareText className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">IA</span>
          </button>
        )}
      </div>
    </header>
  );
};
