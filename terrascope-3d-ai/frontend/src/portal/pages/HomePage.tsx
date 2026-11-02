import React from 'react';
import { ArrowRight, MapPin, CloudRain, ShieldAlert, Activity, AlertTriangle, Layers, PhoneCall, Compass } from 'lucide-react';
import { ZONES, THREAT_META, ThreatLevel } from '../data/medellinZones';
import { ALERT_META, AlertLevel, ZoneStatus } from '../utils/alertEngine';
import { describeWeatherCode } from '../services/weather';

interface HomePageProps {
  statuses: ZoneStatus[];
  onSelectZone: (id: string) => void;
  onNavigate: (path: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ statuses, onSelectZone, onNavigate }) => {
  // Conteo de alertas
  const alertCounts = statuses.reduce((acc, s) => {
    acc[s.alert] = (acc[s.alert] || 0) + 1;
    return acc;
  }, {} as Record<AlertLevel, number>);

  // Comunas críticas (Alerta Roja o Naranja)
  const criticalZones = statuses
    .filter((s) => s.alert >= 2)
    .sort((a, b) => b.alert - a.alert || b.rain.intensity_mmh - a.rain.intensity_mmh);

  return (
    <div className="flex-1 flex flex-col bg-slate-50 text-slate-800">
      {/* 1. HERO SECTION (Banner dinámico Medellín con Tormenta) */}
      <section className="relative h-[480px] md:h-[540px] flex items-center justify-center overflow-hidden bg-slate-950 text-white">
        <img
          src="/hero-medellin.jpg"
          alt="Valle de Aburrá Medellín bajo tormenta"
          className="absolute inset-0 w-full h-full object-cover opacity-45 scale-105 animate-pulse duration-[10000ms]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
        
        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-semibold backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            SISTEMA INTEGRAL DE ALERTA TEMPRANA · MEDELLÍN
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-white font-display drop-shadow-md">
            Monitoreo de <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-rose-500">Deslizamientos</span> y Tormentas
          </h1>

          <p className="max-w-2xl mx-auto text-sm sm:text-base md:text-lg text-slate-200 font-light leading-relaxed">
            Plataforma interactiva con <strong className="text-white font-medium">Google Maps</strong> y <strong className="text-emerald-400 font-medium">Simulador 3D Científico</strong> para la prevención de emergencias geológicas y meteorológicas en las comunas y corregimientos de Medellín.
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => onNavigate('/mapa')}
              className="px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-xl shadow-blue-600/30 flex items-center gap-2 transition hover:-translate-y-0.5"
            >
              <Compass className="w-4 h-4" />
              Explorar Mapa en Vivo
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigate('/simulador')}
              className="px-6 py-3.5 rounded-xl bg-slate-800/90 hover:bg-slate-800 text-emerald-400 border border-emerald-500/40 font-bold text-sm shadow-xl backdrop-blur-md flex items-center gap-2 transition hover:-translate-y-0.5"
            >
              <Activity className="w-4 h-4 text-emerald-400" />
              Lanzar Simulador 3D
            </button>
          </div>
        </div>
      </section>

      {/* 2. BARRA DE SEMÁFORO DE ALERTA GENERAL (ESTILO SIRMED) */}
      <section className="bg-white border-b border-slate-200 py-6 px-4 shadow-sm relative -mt-6 z-20 max-w-6xl mx-auto rounded-2xl w-[94%]">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Estado General de la Red</span>
            <h2 className="text-lg font-bold text-slate-900">Nivel de Vigilancia por Cuencas y Laderas</h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full md:w-auto">
            {([0, 1, 2, 3] as AlertLevel[]).map((lvl) => {
              const meta = ALERT_META[lvl];
              const count = alertCounts[lvl] || 0;
              return (
                <div
                  key={lvl}
                  className="flex items-center gap-3 p-3 rounded-xl border transition"
                  style={{ backgroundColor: `${meta.soft}60`, borderColor: `${meta.color}40` }}
                >
                  <span className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: meta.color }} />
                  <div>
                    <div className="text-xs font-semibold text-slate-600">{meta.name}</div>
                    <div className="text-lg font-black text-slate-900 leading-none">
                      {count} <span className="text-[10px] font-normal text-slate-500">zonas</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. COMPONENTE INFORMATIVO ESTILO SIRMED (Módulos de Gestión del Riesgo) */}
      <section className="max-w-6xl mx-auto px-4 py-12 w-full space-y-10">
        <div>
          <span className="text-xs font-bold text-blue-700 uppercase tracking-widest block mb-1">SIRMED · DAGRD Referencia</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
            Componentes del Monitoreo y Reducción del Riesgo
          </h2>
          <p className="text-sm text-slate-600 max-w-3xl mt-2">
            La gestión integral articula el conocimiento físico de las laderas del Valle de Aburrá con la alerta temprana y el análisis geotécnico interactivo en tiempo real.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Tarjeta 1: Google Maps GIS */}
          <div
            onClick={() => onNavigate('/mapa')}
            className="group cursor-pointer bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-blue-400 transition-all flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                1. Mapa Satelital & Google Maps
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Cartografía interactiva con las 16 comunas y 5 corregimientos. Detección de sectores vulnerables como Villatina, San Javier, Popular y laderas nororientales.
              </p>
            </div>
            <div className="pt-6 flex items-center text-xs font-bold text-blue-600 gap-1 group-hover:translate-x-1 transition-transform">
              Ver mapa interactivo <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Tarjeta 2: Tormentas y Meteorología */}
          <div
            onClick={() => onNavigate('/mapa')}
            className="group cursor-pointer bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-amber-400 transition-all flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <CloudRain className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-amber-600 transition-colors">
                2. Lluvia y Tormentas en Vivo
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Adquisición hidrológica continua con Open-Meteo. Cálculo del umbral antecedente de 72 horas para determinar la saturación crítica del terreno.
              </p>
            </div>
            <div className="pt-6 flex items-center text-xs font-bold text-amber-600 gap-1 group-hover:translate-x-1 transition-transform">
              Consultar precipitación <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Tarjeta 3: Simulador 3D */}
          <div
            onClick={() => onNavigate('/simulador')}
            className="group cursor-pointer bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-emerald-400 transition-all flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Activity className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                3. Simulador Físico 3D
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Motor Three.js con física de rotura de talud, presión de poros, lluvia volumétrica y visualización cinemática de desprendimientos sobre viviendas.
              </p>
            </div>
            <div className="pt-6 flex items-center text-xs font-bold text-emerald-600 gap-1 group-hover:translate-x-1 transition-transform">
              Ejecutar modelo 3D <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        {/* 4. SECCIÓN DE ZONAS BAJO MONITOREO ESPECIAL */}
        <div className="bg-slate-900 rounded-3xl p-6 md:p-8 text-white space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-amber-400 tracking-wider uppercase block">Laderas y Cuencas Principales</span>
              <h3 className="text-xl font-black font-display">Estado de Alertas en Comunas Prioritarias</h3>
            </div>
            <button
              onClick={() => onNavigate('/mapa')}
              className="text-xs px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl transition"
            >
              Ver todas las 21 zonas en Google Maps
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {statuses.slice(0, 6).map((status) => {
              const meta = ALERT_META[status.alert];
              const weatherDesc = status.weather ? describeWeatherCode(status.weather.weather_code) : null;
              return (
                <div
                  key={status.zone.id}
                  onClick={() => {
                    onSelectZone(status.zone.id);
                    onNavigate('/mapa');
                  }}
                  className="bg-slate-800/80 hover:bg-slate-800 p-4 rounded-2xl border border-slate-700 cursor-pointer transition flex items-center justify-between gap-3 group"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">
                        {status.zone.kind === 'comuna' ? `C${status.zone.code}` : `Correg.`}
                      </span>
                      <h4 className="font-bold text-sm text-white group-hover:text-blue-400 transition-colors">
                        {status.zone.name}
                      </h4>
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-2">
                      <span>Lluvia: {status.rain.intensity_mmh} mm/h</span>
                      {weatherDesc && <span>· {weatherDesc.icon}</span>}
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className="inline-block text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: meta.soft, color: meta.text }}
                    >
                      {meta.name}
                    </span>
                    <span className="block text-[10px] text-slate-400 mt-1">
                      Amenaza: {THREAT_META[status.zone.threat].label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
};
