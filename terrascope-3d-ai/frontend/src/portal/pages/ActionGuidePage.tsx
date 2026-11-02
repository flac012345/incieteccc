import React from 'react';
import { Phone, ShieldAlert, AlertTriangle, Home, CheckCircle2, ChevronRight, HelpCircle, Siren } from 'lucide-react';

export const ActionGuidePage: React.FC = () => {
  return (
    <div className="flex-1 bg-slate-900 text-slate-100 py-10 px-4 md:px-8 overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-10">
        {/* Encabezado */}
        <div className="text-center space-y-3">
          <span className="text-xs font-bold text-amber-400 tracking-wider uppercase inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/20">
            <ShieldAlert className="w-3.5 h-3.5" />
            Guía Oficial de Prevención Ciudadana
          </span>
          <h1 className="text-3xl md:text-5xl font-black font-display text-white">
            ¿Qué hacer en caso de <span className="text-rose-500">Deslizamiento</span> o Tormenta?
          </h1>
          <p className="text-sm text-slate-400 max-w-2xl mx-auto">
            Medellín cuenta con una topografía de alta pendiente en sus laderas. Sigue estos pasos avalados por organismos de socorro para proteger tu vida y la de tu familia.
          </p>
        </div>

        {/* Línea 123 Destacada */}
        <div className="bg-gradient-to-r from-rose-950 via-slate-900 to-slate-900 border border-rose-500/40 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-wider">
              <Siren className="w-4 h-4 animate-bounce" />
              Línea Única de Emergencias del Distrito
            </div>
            <h3 className="text-2xl font-black text-white">Reporta Grietas o Flujos de Lodo al 123</h3>
            <p className="text-xs text-slate-300 max-w-xl">
              Si notas abombamientos en el suelo, muros agrietados o agua saliendo con barro de la montaña, llama de inmediato. La inspección del DAGRD es gratuita.
            </p>
          </div>
          <a
            href="tel:123"
            className="px-8 py-4 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black text-lg shadow-xl shadow-rose-600/40 flex items-center gap-3 transition hover:scale-105 shrink-0"
          >
            <Phone className="w-6 h-6" />
            Llamar al 123
          </a>
        </div>

        {/* Fases: Antes, Durante y Después */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* ANTES */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-lg">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-sm">
              01
            </div>
            <h3 className="text-lg font-bold text-white">Antes (Prevención)</h3>
            <ul className="text-xs text-slate-400 space-y-3">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <span>No arrojes basuras ni escombros a las quebradas o laderas.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <span>Monitorea si las puertas o ventanas se descuadran repentinamente.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <span>Ten listo un botiquín, linterna, agua y copia de documentos.</span>
              </li>
            </ul>
          </div>

          {/* DURANTE */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-lg">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-sm">
              02
            </div>
            <h3 className="text-lg font-bold text-white">Durante el Evento</h3>
            <ul className="text-xs text-slate-400 space-y-3">
              <li className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>Si escuchas crujidos en la ladera o la casa, evacúa de inmediato.</span>
              </li>
              <li className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>Aléjate de la trayectoria del derrumbe y busca terrenos altos y firmes.</span>
              </li>
              <li className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>No intentes cruzar vías anegadas con corrientes de agua o lodo.</span>
              </li>
            </ul>
          </div>

          {/* DESPUÉS */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-lg">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-sm">
              03
            </div>
            <h3 className="text-lg font-bold text-white">Después</h3>
            <ul className="text-xs text-slate-400 space-y-3">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>No regreses a la vivienda hasta que las autoridades lo certifiquen.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Cierra llaves de paso de gas y agua ante posibles fugas o roturas.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Permanece atento a los boletines oficiales del DAGRD y SIATA.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
