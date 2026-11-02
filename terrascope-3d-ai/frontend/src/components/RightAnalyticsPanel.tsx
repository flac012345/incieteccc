import React from 'react';
import {
  SimulationSummary,
  SavedScenario,
  GeotechParameters,
} from '../types/geotech';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

interface RightAnalyticsPanelProps {
  summary: SimulationSummary;
  savedScenarios: SavedScenario[];
  onRestoreScenario: (params: GeotechParameters) => void;
  aiQuestion: string;
  onChangeAiQuestion: (q: string) => void;
  onAskAI: () => void;
  aiResponse: string | null;
  isLoadingAI: boolean;
}

export const RightAnalyticsPanel: React.FC<RightAnalyticsPanelProps> = ({
  summary,
  savedScenarios,
  onRestoreScenario,
  aiQuestion,
  onChangeAiQuestion,
  onAskAI,
  aiResponse,
  isLoadingAI,
}) => {
  return (
    <aside className="w-96 bg-slate-950 border-l border-slate-800 p-4 overflow-y-auto space-y-5 shrink-0 select-none">
      {/* Indicadores Principales */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2">
          Indicadores del Modelo (Talud Infinito)
        </h2>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-slate-900 border border-slate-800 p-2.5 rounded shadow">
            <div className="text-slate-400">FS Crítico (P2)</div>
            <div
              className={`text-lg font-bold font-mono ${
                summary.min_fs < 1.0
                  ? 'text-red-400'
                  : summary.min_fs < 1.3
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}
            >
              {summary.min_fs}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              Estado: <span className="font-semibold text-slate-300">{summary.stability_status}</span>
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-2.5 rounded shadow">
            <div className="text-slate-400">Presión Poros (u<sub>w</sub>)</div>
            <div className="text-lg font-bold font-mono text-cyan-300">
              {summary.pore_pressure_kpa} kPa
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              Sat: {(summary.effective_saturation * 100).toFixed(1)}%
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-2.5 rounded shadow">
            <div className="text-slate-400">Área Inestable (FS &lt; 1)</div>
            <div className="text-base font-bold font-mono text-red-400">
              {summary.unstable_cells_pct}%
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              Marginal: {summary.critical_warning_cells_pct}%
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-2.5 rounded shadow">
            <div className="text-slate-400">Pendiente Máx / Media</div>
            <div className="text-base font-bold font-mono text-slate-200">
              {summary.max_slope_deg}° / {summary.mean_slope_deg}°
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              Seguras: {summary.safe_cells_pct}%
            </div>
          </div>
        </div>
      </div>

      {/* Curva de Sensibilidad Hidrológica */}
      <div className="bg-slate-900/70 border border-slate-800 p-3 rounded">
        <div className="text-xs font-semibold text-slate-200 mb-2">
          Curva de Sensibilidad: FS vs. Lluvia (mm/h)
        </div>
        <div className="h-40 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={summary.sensitivity_curve}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="rainfall_mmh" stroke="#94a3b8" fontSize={10} />
              <YAxis stroke="#94a3b8" fontSize={10} domain={[0, 3]} />
              <Tooltip
                contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', fontSize: 11 }}
              />
              <Line
                type="monotone"
                dataKey="critical_fs"
                name="FS Crítico"
                stroke="#ef4444"
                strokeWidth={2}
                dot={{ r: 2 }}
              />
              <Line
                type="monotone"
                dataKey="mean_fs"
                name="FS Medio"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ r: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Comparación de Escenarios Guardados */}
      {savedScenarios.length > 0 && (
        <div className="border-t border-slate-800 pt-3">
          <h3 className="text-xs font-bold uppercase text-cyan-400 mb-2">
            Comparativa de Escenarios ({savedScenarios.length})
          </h3>
          <div className="space-y-1.5 text-xs">
            {savedScenarios.map((sc) => (
              <div
                key={sc.id}
                className="bg-slate-900 border border-slate-800 p-2 rounded flex justify-between items-center"
              >
                <div>
                  <div className="font-semibold text-slate-200">{sc.name}</div>
                  <div className="text-[10px] text-slate-400">
                    Área inestable: {sc.summary.unstable_cells_pct}% | u<sub>w</sub>:{' '}
                    {sc.summary.pore_pressure_kpa} kPa
                  </div>
                </div>
                <button
                  onClick={() => onRestoreScenario(sc.parameters)}
                  className="text-[11px] bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded text-emerald-300 transition"
                >
                  Restaurar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Asistente Geotécnico con IA */}
      <div className="border-t border-slate-800 pt-3 space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase text-emerald-400">
            Copiloto Geotécnico IA (Gemini 2.5 Flash)
          </h3>
          {isLoadingAI && (
            <span className="text-[10px] text-emerald-400 animate-pulse">Analizando...</span>
          )}
        </div>
        <textarea
          value={aiQuestion}
          onChange={(e) => onChangeAiQuestion(e.target.value)}
          rows={2}
          className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          placeholder="Escribe tu consulta geotécnica..."
        />
        <button
          onClick={onAskAI}
          disabled={isLoadingAI}
          className="w-full py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-slate-950 font-semibold text-xs transition flex items-center justify-center gap-1.5"
        >
          {isLoadingAI ? 'Consultando...' : 'Consultar Diagnóstico Técnico'}
        </button>
        {aiResponse && (
          <div className="bg-slate-900 border border-emerald-500/40 rounded p-2.5 text-xs text-slate-200 whitespace-pre-line leading-relaxed max-h-56 overflow-y-auto">
            {aiResponse}
          </div>
        )}
      </div>
    </aside>
  );
};
