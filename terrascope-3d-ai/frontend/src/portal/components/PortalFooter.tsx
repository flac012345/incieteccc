import React from 'react';
import { Phone, Flame, HeartPulse, ShieldAlert } from 'lucide-react';
import { BrandLogo } from './PortalHeader';

const LINES = [
  { icon: Phone, label: 'Línea única de emergencias', number: '123' },
  { icon: Flame, label: 'Bomberos', number: '119' },
  { icon: HeartPulse, label: 'Cruz Roja', number: '132' },
  { icon: ShieldAlert, label: 'Defensa Civil', number: '144' },
];

export const PortalFooter: React.FC = () => (
  <footer className="bg-gradient-to-br from-gov to-[#2453b3] text-white">
    <div className="mx-auto max-w-7xl px-4 py-12 grid gap-10 md:grid-cols-3">
      <div className="space-y-4">
        <BrandLogo light />
        <p className="text-sm text-white/80 leading-relaxed">
          Plataforma de alerta temprana que integra la amenaza por movimientos en masa con la lluvia en tiempo real para
          anticipar deslizamientos y tormentas en el Valle de Aburrá.
        </p>
      </div>

      <div>
        <h2 className="font-display font-bold text-lg mb-4">Líneas de emergencia</h2>
        <ul className="grid grid-cols-2 gap-3">
          {LINES.map(({ icon: Icon, label, number }) => (
            <li key={number}>
              <a href={`tel:${number}`} className="flex items-center gap-3 rounded-xl bg-white/10 hover:bg-white/20 px-3 py-2.5 transition">
                <Icon className="w-5 h-5 text-sun shrink-0" />
                <span className="leading-tight">
                  <span className="block text-xl font-extrabold">{number}</span>
                  <span className="block text-[11px] text-white/75">{label}</span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-3 text-sm">
        <h2 className="font-display font-bold text-lg mb-4">Fuentes de datos</h2>
        <p className="text-white/80">
          Lluvia y pronóstico: <a className="underline" href="https://open-meteo.com" target="_blank" rel="noreferrer">Open-Meteo</a>.
          Cartografía: Google Maps.
        </p>
        <p className="text-white/80">
          Referencia institucional:{' '}
          <a className="underline" href="https://www.medellin.gov.co/sirmed/sdgrd" target="_blank" rel="noreferrer">SIRMED – DAGRD Medellín</a>{' '}
          y <a className="underline" href="https://siata.gov.co" target="_blank" rel="noreferrer">SIATA</a>.
        </p>
        <p className="rounded-lg bg-black/15 px-3 py-2 text-xs text-white/75">
          Prototipo académico. Los niveles de amenaza son ilustrativos y no reemplazan los canales oficiales del DAGRD.
        </p>
      </div>
    </div>
    <div className="border-t border-white/15 py-4 text-center text-xs text-white/60">
      © {new Date().getFullYear()} TerraScope Alerta · Gestión del riesgo de desastres
    </div>
  </footer>
);
