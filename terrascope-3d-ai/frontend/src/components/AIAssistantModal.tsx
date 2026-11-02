import React, { useState } from 'react';
import { GeotechParameters, SimulationSummary } from '../types/geotech';
import { queryAIAnalysis } from '../services/api';

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  params: GeotechParameters;
  summary: SimulationSummary;
  comparisonSummary: SimulationSummary | null;
}

const PROMPT_PRESETS = [
  '¿Cuáles son las principales causas físicas de la inestabilidad en este talud?',
  '¿Qué obras geotécnicas de mitigación (drenajes, anclajes, bermas) serían más efectivas?',
  '¿Cómo impactaría duplicar la eficiencia de drenaje sobre el FS crítico?',
  'Genera un informe técnico formal para presentar a la autoridad ambiental.',
  '¿Qué ensayos geotécnicos de laboratorio y campo se requieren para validar este modelo?',
];

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({
  isOpen,
  onClose,
  params,
  summary,
  comparisonSummary,
}) => {
  const [question, setQuestion] = useState(PROMPT_PRESETS[0]);
  const [response, setResponse] = useState<string | null>(null);
  const [provider, setProvider] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSendQuery = async (customQ?: string) => {
    const q = customQ || question;
    setLoading(true);
    setResponse(null);
    try {
      const data = await queryAIAnalysis({
        question: q,
        parameters: params,
        summary,
        comparison_summary: comparisonSummary,
      });
      setResponse(data.answer);
      setProvider(data.provider);
    } catch {
      // Deterministic fallback if API offline
      setResponse(
        `**Diagnóstico Técnico Geotécnico (Modo Local):**\n\n` +
          `• **Condición de Falla:** El talud presenta un FS crítico de **${summary.min_fs}** con un **${summary.unstable_cells_pct}%** del área en inestabilidad teórica ($FS < 1.0$).\n` +
          `• **Mecanismo Físico Dominante:** La presión de poros intersticial calculada ($u_w = ${summary.pore_pressure_kpa}\\text{ kPa}$) reduce significativamente el esfuerzo normal efectivo sobre la potencial superficie de deslizamiento.\n` +
          `• **Recomendaciones de Estabilización Inmediata:**\n` +
          `  1. Zanjas de coronación y subdrenes horizontales franceses para abatir $u_w$.\n` +
          `  2. Reperfilado del talud y protección en la base contra la socavación erosiva.\n` +
          `  3. Instrumentación con inclinómetros y piezómetros de cuerda vibrante.`
      );
      setProvider('Motor Determinista Geotécnico Local');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-950 border border-slate-800 rounded-xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-3 h-3 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]" />
            <h2 className="text-sm font-bold text-white">
              Copiloto Geotécnico Especializado (Gemini 2.5 Flash)
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-lg font-bold px-2 py-0.5 rounded transition"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 flex-1 overflow-y-auto space-y-4 text-xs">
          {/* Current State Summary Banner */}
          <div className="bg-slate-900 border border-slate-800 p-3 rounded flex flex-wrap justify-between gap-3 text-slate-300">
            <div>
              <span className="text-slate-500">FS Crítico:</span>{' '}
              <span className={summary.min_fs < 1.0 ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>
                {summary.min_fs}
              </span>
            </div>
            <div>
              <span className="text-slate-500">Presión Poros:</span>{' '}
              <span className="text-cyan-300 font-mono font-bold">{summary.pore_pressure_kpa} kPa</span>
            </div>
            <div>
              <span className="text-slate-500">Inestable:</span>{' '}
              <span className="text-amber-400 font-mono font-bold">{summary.unstable_cells_pct}%</span>
            </div>
            <div>
              <span className="text-slate-500">Lluvia:</span>{' '}
              <span className="text-slate-200 font-mono">{params.rainfall_intensity_mmh} mm/h</span>
            </div>
          </div>

          {/* Quick Presets */}
          <div>
            <div className="text-slate-400 font-semibold mb-1.5">Consultas Geotécnicas Frecuentes:</div>
            <div className="flex flex-wrap gap-1.5">
              {PROMPT_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setQuestion(preset);
                    handleSendQuery(preset);
                  }}
                  className="bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 px-2.5 py-1 rounded text-left transition"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Input Box */}
          <div className="space-y-1.5">
            <label className="text-slate-400 font-semibold">Tu Pregunta o Planteamiento:</label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              rows={3}
              className="w-full bg-slate-900 border border-slate-700 rounded p-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
              placeholder="Escribe aquí tu consulta geotécnica..."
            />
          </div>

          <button
            onClick={() => handleSendQuery()}
            disabled={loading}
            className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-slate-950 font-bold rounded transition flex items-center justify-center gap-2 shadow"
          >
            {loading ? 'Consultando al Ingeniero Geotécnico IA...' : 'Generar Análisis con Gemini 2.5 Flash'}
          </button>

          {/* AI Output */}
          {response && (
            <div className="bg-slate-900 border border-emerald-500/40 rounded-lg p-3.5 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-emerald-400 border-b border-slate-800 pb-1.5">
                <span className="font-semibold">Respuesta del Modelo:</span>
                <span className="text-slate-500">{provider}</span>
              </div>
              <div className="text-slate-200 leading-relaxed whitespace-pre-line text-xs">
                {response}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="text-xs px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
