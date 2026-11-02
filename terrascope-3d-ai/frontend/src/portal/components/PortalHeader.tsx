import React, { useState } from 'react';
import { Menu, X, Phone, Accessibility, Radio, CloudLightning } from 'lucide-react';
import { ALERT_META, type AlertLevel } from '../utils/alertEngine';

export const NAV_ITEMS = [
  { path: '/', label: 'Inicio' },
  { path: '/mapa', label: 'Mapa y Alertas' },
  { path: '/simulador', label: 'Simulador 3D' },
  { path: '/que-hacer', label: '¿Qué hacer?' },
];

export const BrandLogo: React.FC<{ light?: boolean }> = ({ light }) => (
  <a href="#/" className="flex items-center gap-3 group" aria-label="TerraScope Alerta - Inicio">
    <svg viewBox="0 0 48 48" className="h-11 w-11 shrink-0 transition-transform group-hover:scale-105" aria-hidden>
      <defs>
        <linearGradient id="lg-mtn" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffc800" />
          <stop offset="1" stopColor="#f97316" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="12" fill={light ? '#ffffff22' : '#1d2a4d'} />
      <path d="M6 38 L18 20 L24 28 L31 16 L42 38 Z" fill="url(#lg-mtn)" />
      <path d="M18 20 L21 25 L16 31" stroke="#1d2a4d" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M33 9 a7 7 0 0 1 7 7 M33 5 a11 11 0 0 1 11 11" stroke="#7dd3fc" strokeWidth="2.2" fill="none" strokeLinecap="round" />
    </svg>
    <div className="leading-tight">
      <div className={`font-display font-extrabold tracking-tight text-xl ${light ? 'text-white' : 'text-navy'}`}>
        TERRASCOPE <span className="text-sun-600">Alerta</span>
      </div>
      <div className={`text-[11px] font-medium ${light ? 'text-white/80' : 'text-slate-500'}`}>
        Alerta temprana · Deslizamientos y tormentas · Medellín
      </div>
    </div>
  </a>
);

interface PortalHeaderProps {
  currentPath: string;
  maxAlert: AlertLevel;
  stormActive: boolean;
  simulated: boolean;
}

export const PortalHeader: React.FC<PortalHeaderProps> = ({ currentPath, maxAlert, stormActive, simulated }) => {
  const [open, setOpen] = useState(false);
  const meta = ALERT_META[maxAlert];

  return (
    <header className="relative z-40 shrink-0 shadow-md">
      {/* Barra utilitaria superior */}
      <div className="bg-gov text-white text-xs">
        <div className="mx-auto max-w-7xl px-4 h-9 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-semibold tracking-wide">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span className="hidden sm:inline">Sistema de monitoreo en vivo · Valle de Aburrá</span>
            <span className="sm:hidden">Monitoreo en vivo</span>
          </div>
          <div className="flex items-center gap-5">
            <a href="#/que-hacer" className="hidden md:flex items-center gap-1.5 hover:underline">
              <Accessibility className="w-3.5 h-3.5" /> Guía ciudadana
            </a>
            <a href="tel:123" className="flex items-center gap-1.5 font-bold hover:underline">
              <Phone className="w-3.5 h-3.5" /> Emergencias 123
            </a>
          </div>
        </div>
      </div>

      {/* Encabezado institucional */}
      <div className="bg-white">
        <div className="mx-auto max-w-7xl px-4 h-16 flex items-center justify-between gap-4">
          <BrandLogo />
          <div className="flex items-center gap-3">
            {stormActive && (
              <span className="hidden md:inline-flex items-center gap-1.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 px-3 py-1 text-xs font-semibold">
                <CloudLightning className="w-3.5 h-3.5" /> Tormenta eléctrica activa
              </span>
            )}
            <a
              href="#/mapa"
              className="hidden sm:inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold transition hover:shadow-md"
              style={{ background: meta.soft, color: meta.text, borderColor: `${meta.color}55` }}
              title="Nivel de alerta más alto en la ciudad"
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping" style={{ background: meta.color }} />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full" style={{ background: meta.color }} />
              </span>
              Alerta {meta.name}
              {simulated && <span className="font-medium opacity-70">(simulación)</span>}
            </a>
            <a
              href="tel:123"
              className="grid place-items-center h-10 w-10 rounded-full bg-sun text-navy shadow hover:scale-105 transition"
              aria-label="Llamar a la línea de emergencias 123"
            >
              <Phone className="w-5 h-5" />
            </a>
            <button
              id="nav-toggle"
              className="lg:hidden grid place-items-center h-10 w-10 rounded-lg text-navy hover:bg-slate-100"
              onClick={() => setOpen(!open)}
              aria-label="Abrir menú"
            >
              {open ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </div>

      {/* Navegación principal */}
      <nav className={`bg-navy ${open ? 'block' : 'hidden'} lg:block`} aria-label="Navegación principal">
        <ul className="mx-auto max-w-7xl px-4 flex flex-col lg:flex-row lg:items-stretch lg:justify-center">
          {NAV_ITEMS.map((item, i) => {
            const active = currentPath === item.path;
            return (
              <li key={item.path} className={`lg:border-l lg:border-white/15 ${i === NAV_ITEMS.length - 1 ? 'lg:border-r' : ''}`}>
                <a
                  id={`nav-${item.path.replace('/', '') || 'inicio'}`}
                  href={`#${item.path}`}
                  onClick={() => setOpen(false)}
                  className={`relative block px-6 py-3.5 text-sm font-medium text-white/90 hover:text-white hover:bg-white/5 transition ${
                    active ? 'text-white bg-white/10' : ''
                  }`}
                >
                  {item.label}
                  <span
                    className={`absolute left-4 right-4 bottom-0 h-[3px] rounded-t bg-sun transition-transform origin-center ${
                      active ? 'scale-x-100' : 'scale-x-0'
                    }`}
                  />
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
};
